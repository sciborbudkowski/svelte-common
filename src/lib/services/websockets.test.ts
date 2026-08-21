// src/lib/services/websockets.test.ts

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketClient } from './websockets.svelte.ts';

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
	});

	function createClient(
		options: {
			maxReconnectAttempts?: number;
			reconnectDelay?: number;
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
});
