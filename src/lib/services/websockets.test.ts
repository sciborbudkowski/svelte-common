// src/lib/services/websockets.test.ts

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketClient, type SocketStatus } from './websockets.svelte.ts';

class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	static instances: MockWebSocket[] = [];

	readonly url: string;

	readyState = MockWebSocket.CONNECTING;

	onopen: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;

	send = vi.fn();

	close = vi.fn(() => {
		this.readyState = MockWebSocket.CLOSING;
	});

	constructor(url: string | URL) {
		this.url = String(url);
		MockWebSocket.instances.push(this);
	}

	open() {
		this.readyState = MockWebSocket.OPEN;

		if (!this.onopen) {
			throw new Error('MockWebSocket: onopen is not set');
		}

		this.onopen(new Event('open'));
	}

	serverClose(code = 1006, reason = '') {
		this.readyState = MockWebSocket.CLOSED;

		this.onclose?.({
			code,
			reason,
			wasClean: code === 1000
		} as CloseEvent);
	}
}

describe('WebSocketClient', () => {
	const clients: WebSocketClient[] = [];

	beforeEach(() => {
		vi.useFakeTimers();

		MockWebSocket.instances = [];

		vi.stubGlobal('WebSocket', MockWebSocket);

		Object.defineProperty(document, 'visibilityState', {
			configurable: true,
			value: 'visible'
		});
	});

	afterEach(() => {
		for (const client of clients) {
			client.dispose();
		}

		clients.length = 0;

		vi.clearAllTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.resetAllMocks();
		vi.restoreAllMocks();
	});

	function createClient(
		options: {
			maxReconnectAttempts?: number;
			reconnectDelay?: number;
			onStatusChange?: (status: SocketStatus) => void;
		} = {}
	) {
		const client = new WebSocketClient({
			url: 'ws://localhost/ws',
			...options
		});

		client.init({
			token: 'test-token',
			uuid: 'test-uuid'
		});

		clients.push(client);

		return client;
	}

	it('ręczne zamknięcie nie powoduje reconnect', () => {
		const client = createClient({ reconnectDelay: 100 });

		client.connect();

		expect(MockWebSocket.instances).toHaveLength(1);

		const ws = MockWebSocket.instances[0];

		client.disconnect();

		expect(ws.close).toHaveBeenCalledWith(1000, 'DISCONNECT');

		ws.serverClose(1000, 'DISCONNECT');

		vi.runAllTimers();

		expect(MockWebSocket.instances).toHaveLength(1);
		expect(client.state.status).toBe('disconnected');
	});

	it('disconnect prevents visibility reconnection during and after closing', () => {
		const client = createClient();
		client.connect();
		const ws = MockWebSocket.instances[0];
		ws.open();

		client.disconnect();
		document.dispatchEvent(new Event('visibilitychange'));
		expect(MockWebSocket.instances).toHaveLength(1);

		ws.serverClose(1000, 'DISCONNECT');
		document.dispatchEvent(new Event('visibilitychange'));
		vi.runAllTimers();
		expect(MockWebSocket.instances).toHaveLength(1);
		expect(client.state.status).toBe('disconnected');
	});

	it('explicit connect re-enables automatic reconnection after disconnect', () => {
		const client = createClient({ reconnectDelay: 100 });
		client.connect();
		client.disconnect();
		MockWebSocket.instances[0].serverClose(1000, 'DISCONNECT');

		client.connect();
		MockWebSocket.instances[1].open();
		MockWebSocket.instances[1].serverClose();
		vi.advanceTimersByTime(100);
		expect(MockWebSocket.instances).toHaveLength(3);

		MockWebSocket.instances[2].open();
		Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
		MockWebSocket.instances[2].serverClose();
		expect(vi.getTimerCount()).toBe(0);

		Object.defineProperty(document, 'visibilityState', { value: 'visible' });
		document.dispatchEvent(new Event('visibilitychange'));
		expect(MockWebSocket.instances).toHaveLength(4);
	});

	it('visibility does not start a client before explicit connect', () => {
		createClient();
		document.dispatchEvent(new Event('visibilitychange'));
		expect(MockWebSocket.instances).toHaveLength(0);
	});

	it('status callback exceptions do not interrupt connection, retries or disposal', () => {
		const callbackError = new Error('consumer callback failed');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const client = createClient({
			reconnectDelay: 100,
			onStatusChange: () => {
				throw callbackError;
			}
		});

		expect(() => client.connect()).not.toThrow();
		const ws = MockWebSocket.instances[0];
		expect(() => ws.open()).not.toThrow();
		expect(client.state.status).toBe('open');
		expect(() => ws.serverClose()).not.toThrow();
		vi.advanceTimersByTime(100);
		expect(MockWebSocket.instances).toHaveLength(2);

		expect(() => client.dispose()).not.toThrow();
		expect(MockWebSocket.instances[1].close).toHaveBeenCalledWith(1000, 'DISCONNECT');
		expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
		expect(vi.getTimerCount()).toBe(0);
		MockWebSocket.instances[1].serverClose(1000, 'DISCONNECT');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(MockWebSocket.instances).toHaveLength(2);
		expect(client.state.status).toBe('disconnected');
		expect(errorSpy).toHaveBeenCalledWith(expect.any(String), callbackError);
	});

	it('installs socket handlers before notifying the connecting status', () => {
		let handlersInstalled = false;
		const client = createClient({
			onStatusChange: (status) => {
				if (status !== 'connecting') return;
				const ws = MockWebSocket.instances[0];
				handlersInstalled = Boolean(ws.onopen && ws.onmessage && ws.onerror && ws.onclose);
			}
		});

		client.connect();
		expect(handlersInstalled).toBe(true);
	});

	it('send returns false when the browser WebSocket global is unavailable', () => {
		const client = createClient();
		vi.stubGlobal('WebSocket', undefined);
		expect(client.send('ping', {})).toBe(false);
	});

	it('zamknięcie starego socketa nie wpływa na nowy', () => {
		const client = createClient({ reconnectDelay: 100 });

		client.connect();

		const oldSocket = MockWebSocket.instances[0];

		client.disconnect();

		expect(oldSocket.readyState).toBe(MockWebSocket.CLOSING);

		client.connect();

		expect(MockWebSocket.instances).toHaveLength(2);

		const newSocket = MockWebSocket.instances[1];

		expect(newSocket.onopen).not.toBeNull();

		newSocket.open();

		expect(newSocket.readyState).toBe(MockWebSocket.OPEN);
		expect(client.state.status).toBe('open');

		oldSocket.serverClose(1000, 'DISCONNECT');

		expect(client.state.status).toBe('open');

		newSocket.serverClose(1000);

		expect(vi.getTimerCount()).toBe(1);

		vi.advanceTimersByTime(100);

		expect(MockWebSocket.instances).toHaveLength(3);
	});

	it('reconnect kończy się po osiągnięciu limitu', () => {
		const client = createClient({
			maxReconnectAttempts: 2,
			reconnectDelay: 100
		});

		client.connect();

		MockWebSocket.instances[0].serverClose(1006);

		expect(client.state.attempts).toBe(1);
		expect(vi.getTimerCount()).toBe(1);

		vi.advanceTimersByTime(100);

		expect(MockWebSocket.instances).toHaveLength(2);

		MockWebSocket.instances[1].serverClose(1006);

		expect(client.state.attempts).toBe(2);

		vi.advanceTimersByTime(200);

		expect(MockWebSocket.instances).toHaveLength(3);

		MockWebSocket.instances[2].serverClose(1006);

		expect(client.state.attempts).toBe(2);
		expect(vi.getTimerCount()).toBe(0);

		vi.runAllTimers();

		expect(MockWebSocket.instances).toHaveLength(3);
	});

	it('dispose usuwa visibility listener i reconnect timeout', () => {
		const addSpy = vi.spyOn(document, 'addEventListener');
		const removeSpy = vi.spyOn(document, 'removeEventListener');

		const client = createClient({ reconnectDelay: 100 });

		const visibilityCall = addSpy.mock.calls.find(([event]) => event === 'visibilitychange');

		expect(visibilityCall).toBeDefined();

		const visibilityHandler = visibilityCall![1];

		client.connect();

		MockWebSocket.instances[0].serverClose(1006);

		expect(vi.getTimerCount()).toBe(1);

		client.dispose();

		expect(removeSpy).toHaveBeenLastCalledWith('visibilitychange', visibilityHandler);

		expect(vi.getTimerCount()).toBe(0);
	});
	it('records URL and constructor failures without throwing or retrying', () => {
		const client = new WebSocketClient({ url: 'http://[' });
		clients.push(client);
		client.init({ token: 't', uuid: 'u' });
		expect(() => client.connect()).not.toThrow();
		expect(client.state.error).toBeTruthy();
		expect(client.state.status).toBe('disconnected');
		expect(vi.getTimerCount()).toBe(0);
		const broken = vi.fn(function () {
			throw new Error('constructor failed');
		});
		vi.stubGlobal('WebSocket', Object.assign(broken, { OPEN: 1, CONNECTING: 0 }));
		const second = createClient();
		expect(() => second.connect()).not.toThrow();
		expect(second.state.error).toBe('constructor failed');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(broken).toHaveBeenCalledTimes(1);
	});
	it('replaces an obsolete reconnect deadline after a manual connection', () => {
		const client = createClient({ reconnectDelay: 1000 });
		client.connect();
		MockWebSocket.instances[0].serverClose();
		vi.advanceTimersByTime(100);
		client.connect();
		MockWebSocket.instances[1].open();
		vi.advanceTimersByTime(400);
		MockWebSocket.instances[1].serverClose();
		vi.advanceTimersByTime(500);
		expect(MockWebSocket.instances).toHaveLength(2);
		vi.advanceTimersByTime(500);
		expect(MockWebSocket.instances).toHaveLength(3);
	});
	it('normalizes nonfinite reconnect settings and clamps negative attempt limits', () => {
		const client = createClient({ reconnectDelay: NaN, maxReconnectAttempts: Infinity });
		client.connect();
		MockWebSocket.instances[0].serverClose();
		vi.advanceTimersByTime(999);
		expect(MockWebSocket.instances).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(MockWebSocket.instances).toHaveLength(2);
		client.dispose();
		const noRetries = createClient({ maxReconnectAttempts: -1 });
		noRetries.connect();
		MockWebSocket.instances.at(-1)!.serverClose();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('reconnects an active socket when its credentials change and ignores the old close event', () => {
		const client = createClient();
		client.connect();
		const old = MockWebSocket.instances[0];
		old.open();
		client.init({ token: 'new-token', uuid: 'new-uuid' });
		expect(old.close).toHaveBeenCalledWith(1000, 'RECONNECT');
		const replacement = MockWebSocket.instances[1];
		expect(new URL(replacement.url).searchParams.get('token')).toBe('new-token');
		old.serverClose();
		expect(client.state.status).toBe('connecting');
		replacement.open();
		expect(client.state.status).toBe('open');
		expect(vi.getTimerCount()).toBe(0);
	});
});
