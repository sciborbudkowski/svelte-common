// src/lib/services/api.ts
import type { CacheAdapter } from './cache.ts';

export type ApiResponseOk<T> = {
    error: false;
    data: T;
};

export type ApiResponseError<TCode extends string = string> = {
    error: true;
    message: string;
    data?: unknown;
    status?: number;
    code?: TCode;
};

export interface ApiDownloadResponse {
    error: boolean;
    message?: string;
    status?: number;
}

export type ApiResponse<T = unknown> = ApiResponseOk<T> | ApiResponseError | ApiDownloadResponse;

export interface ApiClientOptions {
    baseUrl?: string;
    credentials?: RequestCredentials;
    cache?: {
        adapter: CacheAdapter;
        shouldCache?: (url: string) => boolean;
        getTtl?: (url: string) => number;
    };
};

export const createApiClient = (options: ApiClientOptions = {}) => {
    const baseUrl = options.baseUrl ?? '';
    const credentials = options.credentials ?? 'include';

    const makeUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
        const method = (init.method ?? 'GET').toUpperCase();
        const url = makeUrl(path);

        const cacheEnabled =
            method === 'GET' &&
            options.cache &&
            (options.cache.shouldCache?.(url) ?? true);

        try {
            const res = await fetch(url, {
                credentials,
                ...init
            });

            const contentType = res.headers.get('Content-Type') ?? '';
            const isJson = contentType.includes('application/json');

            if(!res.ok) {
                let message = 'Request failed.';
                let code: string | undefined;
                let data: unknown;

                if(isJson) {
                    try {
                        const body = await res.json();
                        message = body?.message ?? body?.error ?? message;
                        code = body?.code;
                        data = body?.data;
                    } catch {
                        // ignore
                    }
                }

                return {
                    error: true,
                    message,
                    code,
                    data: data as T,
                    status: res.status
                };
            }

            if(!isJson) {
                return {
                    error: true,
                    message: 'Invalid server response.',
                    status: res.status
                };
            }

            const result = await res.json() as ApiResponse<T>;

            if(cacheEnabled && !result.error) {
                await options.cache!.adapter.set(url, result, options.cache!.getTtl?.(url));
            }

            return result;
        } catch {
            if(cacheEnabled) {
                const cached = await options.cache!.adapter.get<ApiResponse<T>>(url);
                if(cached) return cached;
            }
            return {
                error: true,
                message: 'Network error.'
            };
        }
    }

    return {
        get<T>(path: string,  init: RequestInit = {}) {
            return request<T>(path, {
                ...init,
                method: 'GET'
            });
        },

        post<T>(path: string, body?: unknown, init: RequestInit = {}) {
            return request<T>(path, {
                method: 'POST',
                ...init,
                headers: {
                    'Content-Type': 'application/json',
                    ...init.headers
                },
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
        },

        put<T>(path: string, body?: unknown, init: RequestInit = {}) {
            return request<T>(path, {
                ...init,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...init.headers
                },
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
        },

        patch<T>(path: string, body?: unknown, init: RequestInit = {}) {
            return request<T>(path, {
                ...init,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...init.headers
                },
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
        },

        delete<T>(path: string, init: RequestInit = {}) {
            return request<T>(path, {
                ...init,
                method: 'DELETE'
            });
        }
    };
}