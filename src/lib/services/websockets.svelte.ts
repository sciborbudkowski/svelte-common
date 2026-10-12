// src/lib/services/websockets.svelte.ts

import { SvelteURL } from 'svelte/reactivity';

export type SocketStatus = 'disconnected' | 'connecting' | 'open' | 'closing';

interface WebSocketClientOptions<T> {
	url: string;
	maxReconnectAttempts?: number;
	reconnectDelay?: number;
	onMessage?: (message: T) => void;
	onStatusChange?: (status: SocketStatus) => void;
	debug?: boolean;
}

export class WebSocketClient<T = unknown> {
	state = $state({
		status: 'disconnected' as SocketStatus,
		attempts: 0,
		error: null as string | null
	});

	private ws: WebSocket | null = null;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private visibilityHandler: (() => void) | null = null;
	private reconnectEnabled = false;
	private token: string | null = null;
	private uuid: string | null = null;

	private readonly url: string;
	private readonly maxReconnectAttempts: number;
	private readonly reconnectDelay: number;
	private readonly onMessage?: (message: T) => void;
	private readonly onStatusChange?: (status: SocketStatus) => void;
	private readonly debug: boolean;
	private readonly intentionallyClosed = new WeakSet<WebSocket>();

	constructor(options: WebSocketClientOptions<T>) {
		this.url = options.url;
		this.maxReconnectAttempts = Number.isFinite(options.maxReconnectAttempts)
			? Math.max(0, Math.floor(options.maxReconnectAttempts!))
			: 10;
		this.reconnectDelay = Number.isFinite(options.reconnectDelay)
			? Math.min(30_000, Math.max(0, options.reconnectDelay!))
			: 1000;
		this.onMessage = options.onMessage;
		this.onStatusChange = options.onStatusChange;
		this.debug = options.debug ?? false;
	}

	init(options: { token: string; uuid: string }) {
		const changed = this.token !== options.token || this.uuid !== options.uuid;
		this.token = options.token;
		this.uuid = options.uuid;
		this.setupVisibilityListener();
		if (changed && this.reconnectEnabled) {
			const previous = this.ws;
			this.ws = null;
			if (previous) {
				this.intentionallyClosed.add(previous);
				previous.close(1000, 'RECONNECT');
			}
			this.state.attempts = 0;
			this.connect();
		}
	}

	private setStatus(status: SocketStatus) {
		this.state.status = status;
		try {
			this.onStatusChange?.(status);
		} catch (error) {
			console.error('WebSocket status callback failed: ', error);
		}
	}

	connect() {
		if (typeof window === 'undefined') return;

		if (!this.token || !this.uuid) {
			console.warn('WebSocket::connect - missing token or uuid.');
			return;
		}

		this.reconnectEnabled = true;
		this.clearReconnectTimeout();

		let ws: WebSocket;
		try {
			if (typeof WebSocket === 'undefined') throw new Error('WebSocket is unavailable.');
			if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)
				return;
			const url = new SvelteURL(this.url, window.location.href);
			if (url.protocol === 'http:') url.protocol = 'ws:';
			if (url.protocol === 'https:') url.protocol = 'wss:';
			url.searchParams.set('token', this.token);
			url.searchParams.set('uuid', this.uuid);
			ws = new WebSocket(url);
		} catch (error) {
			// Constructor failures are configuration/security failures; do not retry in a loop.
			this.reconnectEnabled = false;
			this.state.error = error instanceof Error ? error.message : String(error);
			this.setStatus('disconnected');
			return;
		}
		this.ws = ws;

		ws.onopen = () => {
			if (this.ws !== ws) return;

			this.clearReconnectTimeout();
			this.state.attempts = 0;
			this.state.error = null;
			this.setStatus('open');
		};

		ws.onmessage = (event) => {
			if (this.ws !== ws) return;

			try {
				this.onMessage?.(JSON.parse(event.data) as T);
			} catch (err) {
				console.error('WebSocket::connect.onmessage - invalid message: ', err);
			}
		};

		ws.onerror = (error) => {
			if (this.ws !== ws) return;

			this.state.error = String(error);
			if (this.debug) console.warn('WebSocket error: ', error);
		};

		ws.onclose = (event) => {
			if (this.ws !== ws) return;

			this.ws = null;
			this.setStatus('disconnected');

			const intentional =
				this.intentionallyClosed.has(ws) ||
				(event.code === 1000 && (event.reason === 'DISCONNECT' || event.reason === 'RECONNECT'));

			this.intentionallyClosed.delete(ws);

			if (!intentional && document.visibilityState === 'visible') this.scheduleReconnect();
		};

		this.setStatus('connecting');
	}

	send(type: string, payload: unknown): boolean {
		if (!this.ws || typeof WebSocket === 'undefined' || this.ws.readyState !== WebSocket.OPEN)
			return false;

		try {
			this.ws.send(JSON.stringify({ type, payload }));
		} catch (err) {
			console.error('WebSocket send error: ', err);
			return false;
		}

		return true;
	}

	disconnect() {
		this.reconnectEnabled = false;
		this.clearReconnectTimeout();

		const ws = this.ws;
		if (!ws) {
			this.setStatus('disconnected');
			return;
		}

		this.intentionallyClosed.add(ws);

		this.setStatus('closing');
		ws.close(1000, 'DISCONNECT');
	}

	dispose() {
		try {
			this.disconnect();
		} finally {
			this.resetVisibilityListener();
		}
	}

	private scheduleReconnect() {
		if (!this.reconnectEnabled || this.reconnectTimeout) return;

		if (this.state.attempts >= this.maxReconnectAttempts) {
			if (this.debug)
				console.warn('WebSocket::scheduleReconnect - max reconnect attempts reached.');
			return;
		}

		const delay = Math.min(this.reconnectDelay * 2 ** this.state.attempts, 30_000);
		this.state.attempts++;

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			if (this.reconnectEnabled) this.connect();
		}, delay);
	}

	private clearReconnectTimeout() {
		if (!this.reconnectTimeout) return;

		clearTimeout(this.reconnectTimeout);
		this.reconnectTimeout = null;
	}

	private setupVisibilityListener() {
		if (typeof document === 'undefined') return;

		this.resetVisibilityListener();

		this.visibilityHandler = () => {
			if (
				this.reconnectEnabled &&
				document.visibilityState === 'visible' &&
				this.ws?.readyState !== WebSocket.OPEN
			) {
				this.state.attempts = 0;
				this.clearReconnectTimeout();
				this.connect();
			}
		};

		document.addEventListener('visibilitychange', this.visibilityHandler);
	}

	private resetVisibilityListener() {
		if (!this.visibilityHandler) return;

		document.removeEventListener('visibilitychange', this.visibilityHandler);
		this.visibilityHandler = null;
	}
}
