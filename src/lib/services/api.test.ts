// src/lib/services/api.test.ts

import { describe, expect, it, vi } from 'vitest';

import { ApiClient, type ApiHttpResponse, type OfflineQueueAdapter } from './api.ts';

import type { CacheAdapter } from './cache.ts';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

function createFetch() {
	const mock = vi.fn();

	return {
		mock,
		fetcher: mock as unknown as typeof fetch
	};
}

function createCacheAdapter() {
	const get = vi.fn<(key: string) => Promise<unknown | null>>();

	const set = vi.fn<(key: string, value: unknown, ttl?: number) => Promise<void>>();

	const remove = vi.fn<(key: string) => Promise<void>>();

	get.mockResolvedValue(null);
	set.mockResolvedValue(undefined);
	remove.mockResolvedValue(undefined);

	const adapter: CacheAdapter = {
		async get<T>(key: string): Promise<T | null> {
			return (await get(key)) as T | null;
		},

		async set<T>(key: string, value: T, ttl?: number): Promise<void> {
			await set(key, value, ttl);
		},

		delete: remove
	};

	return {
		adapter,
		get,
		set,
		delete: remove
	};
}

function createQueueAdapter() {
	const enqueue = vi.fn<OfflineQueueAdapter['enqueue']>();

	enqueue.mockResolvedValue(undefined);

	const adapter: OfflineQueueAdapter = {
		enqueue
	};

	return {
		adapter,
		enqueue
	};
}

describe('ApiClient', () => {
	it('parsuje poprawny envelope', async () => {
		const { mock, fetcher } = createFetch();

		mock.mockResolvedValue(
			jsonResponse({
				error: false,
				data: {
					id: 123,
					name: 'Test'
				}
			})
		);

		const client = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher
		});

		const result = await client.get<{
			id: number;
			name: string;
		}>('/user');

		expect(result).toEqual({
			error: false,
			data: {
				id: 123,
				name: 'Test'
			}
		});
	});

	it('parsuje błędny envelope', async () => {
		const { mock, fetcher } = createFetch();

		mock.mockResolvedValue(
			jsonResponse({
				error: true,
				message: 'Access denied.',
				code: 'FORBIDDEN',
				data: {
					reason: 'test'
				},
				status: 403
			})
		);

		const client = new ApiClient<'FORBIDDEN'>({
			fetch: fetcher
		});

		const result = await client.get('/user');

		expect(result).toEqual({
			error: true,
			message: 'Access denied.',
			code: 'FORBIDDEN',
			data: {
				reason: 'test'
			},
			status: 403
		});
	});

	it('odrzuca odpowiedź nie-JSON', async () => {
		const { mock, fetcher } = createFetch();

		mock.mockResolvedValue(
			new Response('<html>error</html>', {
				status: 502,
				headers: {
					'Content-Type': 'text/html'
				}
			})
		);

		const client = new ApiClient({
			fetch: fetcher
		});

		const result = await client.get('/user');

		expect(result).toEqual({
			error: true,
			message: 'Invalid server response.',
			status: 502
		});
	});

	it('obsługuje błąd JSON.stringify bez wykonywania fetch', async () => {
		const { mock, fetcher } = createFetch();

		const client = new ApiClient({
			fetch: fetcher
		});

		const data: Record<string, unknown> = {};
		data.self = data;

		const result = await client.post('/user', data);

		expect(result).toEqual({
			error: true,
			message: 'Request body is not JSON serializable.'
		});

		expect(mock).not.toHaveBeenCalled();
	});

	it('AbortError nie trafia do offline queue', async () => {
		const { mock, fetcher } = createFetch();
		const queue = createQueueAdapter();

		const controller = new AbortController();
		controller.abort();

		mock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

		const client = new ApiClient({
			fetch: fetcher,

			offlineQueue: {
				adapter: queue.adapter,
				shouldQueue: () => true
			}
		});

		const result = await client.post(
			'/user',
			{
				name: 'Test'
			},
			{
				signal: controller.signal,
				queueIfOffline: true
			}
		);

		expect(result).toEqual({
			error: true,
			message: 'Request aborted.'
		});

		expect(queue.enqueue).not.toHaveBeenCalled();
	});

	it('przy błędzie sieci zwraca dane z cache', async () => {
		const { mock, fetcher } = createFetch();
		const cache = createCacheAdapter();

		const cached: ApiHttpResponse<{
			source: string;
		}> = {
			error: false,
			data: {
				source: 'cache'
			}
		};

		mock.mockRejectedValue(new Error('Network unavailable'));

		cache.get.mockResolvedValue(cached);

		const client = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter
			}
		});

		const result = await client.get('/items');

		expect(result).toEqual(cached);

		expect(cache.get).toHaveBeenCalledWith('https://api.test/items');
	});

	it('błąd zapisu cache nie psuje poprawnej odpowiedzi', async () => {
		const { mock, fetcher } = createFetch();
		const cache = createCacheAdapter();

		const cacheError = new Error('Cache write failed');
		const onError = vi.fn();

		mock.mockResolvedValue(
			jsonResponse({
				error: false,
				data: {
					id: 123
				}
			})
		);

		cache.set.mockRejectedValue(cacheError);

		const client = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter,
				onError
			}
		});

		const result = await client.get('/items');

		expect(result).toEqual({
			error: false,
			data: {
				id: 123
			}
		});

		expect(onError).toHaveBeenCalledWith(cacheError, {
			operation: 'set',
			target: 'https://api.test/items'
		});
	});

	it('cache jest namespacowany przez pełny URL', async () => {
		const { mock, fetcher } = createFetch();
		const cache = createCacheAdapter();

		mock
			.mockResolvedValueOnce(
				jsonResponse({
					error: false,
					data: 'A'
				})
			)
			.mockResolvedValueOnce(
				jsonResponse({
					error: false,
					data: 'B'
				})
			);

		const clientA = new ApiClient({
			baseUrl: 'https://api-a.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter
			}
		});

		const clientB = new ApiClient({
			baseUrl: 'https://api-b.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter
			}
		});

		await clientA.get('/items');
		await clientB.get('/items');

		const keys = cache.set.mock.calls.map(([key]) => key);

		expect(keys).toEqual(['https://api-a.test/items', 'https://api-b.test/items']);
	});

	it('nie kolejkuje endpointu bez jawnej zgody', async () => {
		const { mock, fetcher } = createFetch();
		const queue = createQueueAdapter();

		mock.mockRejectedValue(new Error('Offline'));

		const client = new ApiClient({
			fetch: fetcher,
			offlineQueue: {
				adapter: queue.adapter,
				shouldQueue: () => true
			}
		});

		const result = await client.post('/user', { name: 'Test' });

		expect(result).toEqual({
			error: true,
			message: 'Network error.'
		});

		expect(queue.enqueue).not.toHaveBeenCalled();
	});

	it('zapisuje odtwarzalne body i nagłówki', async () => {
		const { mock, fetcher } = createFetch();
		const queue = createQueueAdapter();

		mock.mockRejectedValue(new Error('Offline'));

		const client = new ApiClient({
			fetch: fetcher,
			offlineQueue: {
				adapter: queue.adapter,
				createActionId: () => 'action-123',
				idempotency: {
					createKey: () => 'request-456'
				}
			}
		});

		const result = await client.post(
			'/reports',
			{ title: 'Raport' },
			{
				headers: {
					'X-Tenant': 'tenant-1'
				},
				queueIfOffline: true
			}
		);

		expect(result).toEqual({
			error: false,
			queued: true
		});

		const action = queue.enqueue.mock.calls[0][0];
		const headers = Object.fromEntries(action.headers);

		expect(action).toMatchObject({
			id: 'action-123',
			method: 'POST',
			endpoint: '/reports',
			body: JSON.stringify({ title: 'Raport' }),
			idempotencyKey: 'request-456'
		});

		expect(action.createdAt).toEqual(expect.any(Number));
		expect(headers['content-type']).toBe('application/json');
		expect(headers['x-tenant']).toBe('tenant-1');
		expect(headers['idempotency-key']).toBe('request-456');
	});

	it('rozdziela cache użytkowników dla tego samego URL', async () => {
		const { mock, fetcher } = createFetch();
		const cache = createCacheAdapter();

		mock
			.mockResolvedValueOnce(
				jsonResponse({
					error: false,
					data: 'User A'
				})
			)
			.mockResolvedValueOnce(
				jsonResponse({
					error: false,
					data: 'User B'
				})
			);

		const clientA = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter,
				getKey: ({ url }) => `user-a:${url}`
			}
		});

		const clientB = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter,
				getKey: ({ url }) => `user-b:${url}`
			}
		});

		await clientA.get('/profile');
		await clientB.get('/profile');

		const keys = cache.set.mock.calls.map(([key]) => key);

		expect(keys).toEqual(['user-a:https://api.test/profile', 'user-b:https://api.test/profile']);
	});

	it('usuwa cache po udanej mutacji', async () => {
		const { mock, fetcher } = createFetch();
		const cache = createCacheAdapter();

		mock.mockResolvedValue(
			jsonResponse({
				error: false,
				data: {
					id: 123
				}
			})
		);

		const makeKey = (url: string) => `user-1:${url}`;

		const client = new ApiClient({
			baseUrl: 'https://api.test',
			fetch: fetcher,

			cache: {
				adapter: cache.adapter,
				getKey: ({ url }) => makeKey(url),

				invalidateAfterMutation: async ({ url }) => {
					await cache.adapter.delete?.(makeKey(url));
				}
			}
		});

		const result = await client.post('/items', {
			name: 'Nowy element'
		});

		expect(result.error).toBe(false);

		expect(cache.delete).toHaveBeenCalledWith('user-1:https://api.test/items');
	});

	it('nie pobiera pliku podczas SSR', async () => {
		const { mock, fetcher } = createFetch();

		const client = new ApiClient({ fetch: fetcher });

		const result = await client.downloadAndSave('/file');

		expect(result).toEqual({
			error: true,
			message: 'Downloading is available only in the browser.'
		});

		expect(mock).not.toHaveBeenCalled();
	});
});
