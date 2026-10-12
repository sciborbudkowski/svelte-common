import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api.ts';
import type { CacheAdapter } from './cache.ts';

function memoryCache() {
	const values = new Map<string, unknown>();
	const adapter: CacheAdapter = {
		async get<T>(key: string) {
			return (values.get(key) ?? null) as T | null;
		},
		async set<T>(key: string, value: T) {
			values.set(key, value);
		}
	};
	return { values, adapter };
}
const response = (data: unknown) =>
	new Response(JSON.stringify({ error: false, data }), {
		headers: { 'Content-Type': 'application/json' }
	});

describe('API cache isolation and offline replay', () => {
	it('combines an explicit scope with a custom key for private requests', async () => {
		const cache = memoryCache();
		let scope = 'A';
		const client = new ApiClient({
			fetch: vi.fn().mockResolvedValueOnce(response('A')).mockRejectedValue(new Error('offline')),
			cache: { adapter: cache.adapter, scope: () => scope, getKey: ({ url }) => url }
		});
		await client.get('/profile');
		scope = 'B';
		expect((await client.get('/profile')).error).toBe(true);
		scope = 'A';
		expect(await client.get('/profile')).toEqual({ error: false, data: 'A' });
	});
	it('does not cache private requests without an explicit partition', async () => {
		const cache = memoryCache();
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(response('User A'))
			.mockRejectedValueOnce(new Error('offline'));
		const client = new ApiClient({ fetch: fetcher, cache: { adapter: cache.adapter } });
		await client.get('/profile', { headers: { Authorization: 'Bearer A' } });
		expect((await client.get('/profile', { headers: { Authorization: 'Bearer B' } })).error).toBe(
			true
		);
		expect(cache.values.size).toBe(0);
	});
	it('treats cookie-enabled requests as private even without Authorization', async () => {
		const cache = memoryCache();
		const client = new ApiClient({
			fetch: vi.fn().mockResolvedValue(response('private')),
			cache: { adapter: cache.adapter }
		});
		await client.get('/profile');
		expect(cache.values.size).toBe(0);
	});
	it('isolates sessions, supports logout, and never stores bearer tokens in keys', async () => {
		const cache = memoryCache();
		let scope: string | null = 'user-a';
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(response('A'))
			.mockRejectedValue(new Error('offline'));
		const client = new ApiClient({
			fetch: fetcher,
			cache: { adapter: cache.adapter, scope: () => scope }
		});
		await client.get('/profile', { headers: { Authorization: 'Bearer secret-token' } });
		expect([...cache.values.keys()].join()).not.toContain('secret-token');
		scope = 'user-b';
		expect((await client.get('/profile')).error).toBe(true);
		scope = 'user-a';
		expect(await client.get('/profile')).toEqual({ error: false, data: 'A' });
		scope = null;
		expect((await client.get('/profile')).error).toBe(true);
	});
	it('partitions anonymous request variants by their headers', async () => {
		const cache = memoryCache();
		const client = new ApiClient({
			credentials: 'omit',
			fetch: vi
				.fn()
				.mockResolvedValueOnce(response('PL'))
				.mockRejectedValueOnce(new Error('offline')),
			cache: { adapter: cache.adapter }
		});
		await client.get('/text', { headers: { 'Accept-Language': 'pl' } });
		expect((await client.get('/text', { headers: { 'Accept-Language': 'en' } })).error).toBe(true);
	});
	it('isolates a failing cache-key hook from a successful request', async () => {
		const onError = vi.fn();
		const client = new ApiClient({
			fetch: vi.fn().mockResolvedValue(response('ok')),
			cache: {
				adapter: memoryCache().adapter,
				getKey: () => {
					throw new Error('bad key');
				},
				onError
			}
		});
		expect(await client.get('/profile')).toEqual({ error: false, data: 'ok' });
		expect(onError).toHaveBeenCalledWith(expect.any(Error), {
			operation: 'get',
			target: '/profile'
		});
	});
	it('preserves resolved URL, credential policy and idempotency for offline replay', async () => {
		const enqueue = vi.fn().mockResolvedValue(undefined);
		const client = new ApiClient({
			baseUrl: 'https://api.example',
			credentials: 'same-origin',
			fetch: vi.fn().mockRejectedValue(new Error('offline')),
			offlineQueue: { adapter: { enqueue }, createActionId: () => 'operation-1' }
		});
		expect(await client.post('/items', { value: 1 }, { queueIfOffline: true })).toEqual({
			error: false,
			queued: true
		});
		const action = enqueue.mock.calls[0][0];
		expect(action).toMatchObject({
			url: 'https://api.example/items',
			endpoint: '/items',
			credentials: 'same-origin',
			idempotencyKey: 'operation-1'
		});
		expect(Object.fromEntries(action.headers)['idempotency-key']).toBe('operation-1');
	});
});
