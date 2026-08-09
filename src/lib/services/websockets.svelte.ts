// src/lib/services/websockets.svelte.ts

export type SocketStatus = 
    | 'disconnected'
    | 'connecting'
    | 'open'
    | 'closing';

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
    private token: string | null = null;
    private uuid: string | null = null;
    private intentionalClose = false;

    private readonly url: string;
    private readonly maxRecconectAttempts: number;
    private readonly reconnectDelay: number;
    private readonly onMessage?: (message: T) => void;
    private readonly onStatusChange?: (status: SocketStatus) => void;
    private readonly debug: boolean;

    constructor(options: WebSocketClientOptions<T>) {
        this.url = options.url;
        this.maxRecconectAttempts = options.maxReconnectAttempts ?? 10;
        this.reconnectDelay = options.reconnectDelay ?? 1000;
        this.onMessage = options.onMessage;
        this.onStatusChange = options.onStatusChange;
        this.debug = options.debug ?? false;
    }

    init(options: { token: string, uuid: string}) {
        this.token = options.token;
        this.uuid = options.uuid;
        this.setupVisibilityListener();
    }

    private setStatus(status: SocketStatus) {
        this.state.status = status;
        this.onStatusChange?.(status);
    }

    connect() {
        if(typeof window === 'undefined') return;

        if(!this.token || !this.uuid) {
            console.warn('WebSocket::connect - missing token or uuid.');
            return;
        }

        if(this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;

        const ws = new WebSocket(`${this.url}?token=${this.token}&uuid=${this.uuid}`);
        this.ws = ws;
        this.setStatus('connecting');

        ws.onopen = () => {
            if(this.ws !== ws) return;

            this.state.attempts = 0;
            this.setStatus('open');
        };

        ws.onmessage = (event) => {
            if(this.ws !== ws) return;

            try {
                this.onMessage?.(JSON.parse(event.data) as T);
            } catch(err) {
                console.error('WebSocket::connect.onmessage - invalid message: ', err);
            }
        }

        ws.onerror = (error) => {
            if(this.ws !== ws) return;

            this.state.error = String(error);
            if(this.debug) console.warn('WebSocket error: ', error);
        }

        ws.onclose = (event) => {
            if(this.ws !== ws) return;

            this.ws = null;
            this.setStatus('disconnected');

            const intentional =
                this.intentionalClose ||
                (event.code === 1000 &&
                    (event.reason === 'DISCONNECT') ||
                        event.reason === 'RECONNECT'
                );
            this.intentionalClose = false;

            if(!intentional && document.visibilityState === 'visible') this.scheduleReconnect();
        };
    }

    send(type: string, payload: unknown): boolean {
        if(this.ws?.readyState !== WebSocket.OPEN) return false;

        try {
            this.ws.send(JSON.stringify({ type, payload }));
        } catch(err) {
            console.error('WebSocket send error: ', err);
            return false;
        }

        return true;
    }

    disconnect() {
        this.clearReconnectTimeout();
        this.intentionalClose = true;

        this.ws?.close(1000, 'DISCONNECT');
        this.ws = null;

        this.setStatus('disconnected');
    }

    dispose() {
        this.disconnect();
        this.resetVisibilityListener();
    }

    private scheduleReconnect() {
        if(this.reconnectTimeout) return;

        if(this.state.attempts >= this.maxRecconectAttempts) {
            if(this.debug) console.warn('WebSocket::scheduleReconnect - max reconnect attempts rached.');
            return;
        }

        const delay = Math.min(this.reconnectDelay * 2 ** this.state.attempts, 30_000);
        this.state.attempts++;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    private clearReconnectTimeout() {
        if(!this.reconnectTimeout) return;

        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
    }

    private setupVisibilityListener() {
        if(typeof document === 'undefined') return;

        this.resetVisibilityListener();

        this.visibilityHandler = () => {
            if(document.visibilityState === 'visible' && this.ws?.readyState !== WebSocket.OPEN) {
                this.state.attempts = 0;
                this.clearReconnectTimeout();
                this.connect();
            }
        }

        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    private resetVisibilityListener() {
        if(!this.visibilityHandler) return;

        document.removeEventListener('visibilitychange', this.visibilityHandler);
        this.visibilityHandler = null;
    }
}