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

	get.mockResolvedValue(null);
	set.mockResolvedValue(undefined);

	const adapter: CacheAdapter = {
		async get<T>(key: string): Promise<T | null> {
			return await get(key) as T | null;
		},

		async set<T>(key: string, value: T, ttl?: number): Promise<void> {
			await set(key, value, ttl);
		}
	};

	return {
		adapter,
		get,
		set
	};
}

function createQueueAdapter() {
	const enqueue = vi.fn(async () => undefined);

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
				adapter: queue.adapter
			}
		});

		const result = await client.post(
			'/user',
			{
				name: 'Test'
			},
			{
				signal: controller.signal
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
			key: 'https://api.test/items'
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
});
