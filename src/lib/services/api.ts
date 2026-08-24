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

export type ApiHttpResponse<T, TCode extends string = string> =
	ApiResponseOk<T> | ApiResponseError<TCode>;

export type ApiQueuedResponse = {
	error: false;
	queued: true;
};

export type ApiResponse<T, TCode extends string = string> =
	(ApiResponseOk<T> & { queued?: false }) | ApiResponseError<TCode> | ApiQueuedResponse;

export type ApiDownloadResponse =
	| {
			error: false;
			cancelled?: false;
			status?: number;
	  }
	| {
			error: false;
			cancelled: true;
			status?: number;
	  }
	| {
			error: true;
			message: string;
			status?: number;
	  };

export interface DownloadOptions {
	suggestedName?: string;
	fallbackBaseName?: string;
}

export interface ApiRequestInit extends RequestInit {
	queueIfOffline?: boolean;
}

export interface DirectApiRequestInit extends ApiRequestInit {
	queueIfOffline?: false;
}

export interface QueuedApiRequestInit extends ApiRequestInit {
	queueIfOffline: true;
}

export type ApiResponseParser<TCode extends string = string> = <T>(
	response: Response
) => Promise<ApiHttpResponse<T, TCode>>;

export interface ApiCacheOptions {
	adapter: CacheAdapter;
	getKey?: (context: ApiCacheKeyContext) => string;
	shouldCache?: (url: string) => boolean;
	getTtl?: (url: string) => number;
	invalidateAfterMutation?: (context: ApiCacheMutationContext) => Promise<void> | void;
	onError?: (
		error: unknown,
		context: {
			operation: 'get' | 'set' | 'invalidate';
			target: string;
		}
	) => void;
}

export type OfflineMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiCacheKeyContext {
	url: string;
	init: RequestInit;
}

export interface ApiCacheMutationContext {
	method: OfflineMethod;
	url: string;
	init: RequestInit;
}

export interface OfflineAction {
	id: string;
	method: OfflineMethod;
	endpoint: string;
	headers: Array<[string, string]>;
	body?: string;
	createdAt: number;
	idempotencyKey?: string;
}

export interface OfflineQueueAdapter {
	enqueue(action: OfflineAction): Promise<void>;
}

export interface ApiClientOptions<TCode extends string = string> {
	baseUrl?: string;
	credentials?: RequestCredentials;
	fetch?: typeof fetch;
	parseResponse?: ApiResponseParser<TCode>;

	cache?: ApiCacheOptions;

	offlineQueue?: {
		adapter: OfflineQueueAdapter;
		shouldQueue?: (endpoint: string, method: OfflineAction['method']) => boolean;
		createActionId?: () => string;
		idempotency?: {
			headerName?: string;
			createKey?: () => string;
		};
	};
}

async function parseEnvelopeResponse<T, TCode extends string = string>(
	response: Response
): Promise<ApiHttpResponse<T, TCode>> {
	const contentType = response.headers.get('Content-Type') ?? '';
	if (!contentType.toLowerCase().includes('json')) {
		return {
			error: true,
			message: 'Invalid server response.',
			status: response.status
		};
	}

	let body: unknown;

	try {
		body = await response.json();
	} catch {
		return {
			error: true,
			message: 'Invalid JSON response.',
			status: response.status
		};
	}

	const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined;

	if (!response.ok) {
		return {
			error: true,
			message:
				typeof value?.message === 'string'
					? value.message
					: typeof value?.error === 'string'
						? value.error
						: 'Request failed.',
			code: typeof value?.code === 'string' ? (value.code as TCode) : undefined,
			data: value?.data,
			status: response.status
		};
	}

	if (!value || typeof value.error !== 'boolean') {
		return {
			error: true,
			message: 'Unexpected response format',
			status: response.status
		};
	}

	if (value.error) {
		return {
			error: true,
			message: typeof value.message === 'string' ? value.message : 'Request failed.',
			code: typeof value.code === 'string' ? (value.code as TCode) : undefined,
			data: value.data,
			status: typeof value.status === 'number' ? value.status : undefined
		};
	}

	return {
		error: false,
		data: value.data as T
	};
}

export class ApiClient<TCode extends string = string> {
	private readonly baseUrl: string;
	private readonly credentials: RequestCredentials;
	private readonly fetcher: typeof fetch;
	private readonly parser: ApiResponseParser<TCode>;
	private readonly cache?: ApiCacheOptions;
	private readonly offlineQueue?: ApiClientOptions<TCode>['offlineQueue'];

	constructor(options: ApiClientOptions<TCode> = {}) {
		this.baseUrl = options.baseUrl?.replace(/\/$/, '') ?? '';
		this.credentials = options.credentials ?? 'include';
		this.fetcher = options.fetch ?? globalThis.fetch;
		this.cache = options.cache;
		this.offlineQueue = options.offlineQueue;

		this.parser =
			options.parseResponse ??
			(async <T>(response: Response) => parseEnvelopeResponse<T, TCode>(response));
	}

	get<T>(path: string, init: RequestInit = {}): Promise<ApiHttpResponse<T, TCode>> {
		return this.request<T>(
			path,
			{
				...init,
				method: 'GET'
			},
			false
		);
	}

	post<T>(path: string, body: unknown, init: QueuedApiRequestInit): Promise<ApiResponse<T, TCode>>;
	post<T>(
		path: string,
		body?: unknown,
		init?: DirectApiRequestInit
	): Promise<ApiHttpResponse<T, TCode>>;
	post<T>(path: string, body: unknown, init: ApiRequestInit): Promise<ApiResponse<T, TCode>>;
	post<T>(path: string, body?: unknown, init: ApiRequestInit = {}): Promise<ApiResponse<T, TCode>> {
		return this.jsonRequest<T>('POST', path, body, init);
	}

	put<T>(path: string, body: unknown, init: QueuedApiRequestInit): Promise<ApiResponse<T, TCode>>;
	put<T>(
		path: string,
		body?: unknown,
		init?: DirectApiRequestInit
	): Promise<ApiHttpResponse<T, TCode>>;
	put<T>(path: string, body: unknown, init: ApiRequestInit): Promise<ApiResponse<T, TCode>>;
	put<T>(path: string, body?: unknown, init: ApiRequestInit = {}): Promise<ApiResponse<T, TCode>> {
		return this.jsonRequest<T>('PUT', path, body, init);
	}

	patch<T>(path: string, body: unknown, init: QueuedApiRequestInit): Promise<ApiResponse<T, TCode>>;
	patch<T>(
		path: string,
		body?: unknown,
		init?: DirectApiRequestInit
	): Promise<ApiHttpResponse<T, TCode>>;
	patch<T>(path: string, body: unknown, init: ApiRequestInit): Promise<ApiResponse<T, TCode>>;
	patch<T>(
		path: string,
		body?: unknown,
		init: ApiRequestInit = {}
	): Promise<ApiResponse<T, TCode>> {
		return this.jsonRequest<T>('PATCH', path, body, init);
	}

	delete<T>(path: string, init: QueuedApiRequestInit): Promise<ApiResponse<T, TCode>>;
	delete<T>(path: string, init?: DirectApiRequestInit): Promise<ApiHttpResponse<T, TCode>>;
	delete<T>(path: string, init: ApiRequestInit): Promise<ApiResponse<T, TCode>>;
	delete<T>(path: string, init: ApiRequestInit = {}): Promise<ApiResponse<T, TCode>> {
		const { queueIfOffline = false, ...requestInit } = init;

		return this.request<T>(
			path,
			{
				...requestInit,
				method: 'DELETE'
			},
			queueIfOffline
		);
	}

	async downloadAndSave(
		path: string,
		init: RequestInit = {},
		options: DownloadOptions = {}
	): Promise<ApiDownloadResponse> {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return {
				error: true,
				message: 'Downloading is available only in the browser.'
			};
		}

		const url = this.makeUrl(path);
		let response: Response;

		try {
			response = await this.fetcher(url, {
				...init,
				method: init.method ?? 'GET',
				credentials: init.credentials ?? this.credentials
			});
		} catch (error) {
			if (this.isAbortError(error, init.signal)) {
				return {
					error: false,
					cancelled: true
				};
			}

			return {
				error: true,
				message: 'Network error.'
			};
		}

		if (!response.ok) {
			try {
				const result = await this.parser<never>(response);
				if (result.error) {
					return {
						error: true,
						message: result.message,
						status: result.status ?? response.status
					};
				}
			} catch {
				// Use main return below
			}

			return {
				error: true,
				message: 'Download failed.',
				status: response.status
			};
		}

		try {
			const contentType = response.headers.get('Content-Type') ?? 'application/octet-stream';
			const headerFilename = this.parseFilename(response.headers.get('Content-Disposition'));
			const rawFilename = this.ensureFilename(
				headerFilename ?? options.suggestedName,
				contentType,
				options.fallbackBaseName ?? 'download'
			);
			const filename = this.sanitizeFilename(rawFilename);

			const blob = await response.blob();
			await this.saveBlobToDevice(blob, filename);

			return {
				error: false,
				status: response.status
			};
		} catch (error) {
			if (this.isAbortError(error)) {
				return {
					error: false,
					cancelled: true,
					status: response.status
				};
			}

			return {
				error: true,
				message: error instanceof Error ? error.message : 'Could not save downloaded file.',
				status: response.status
			};
		}
	}

	private request<T>(
		path: string,
		init: RequestInit,
		queueIfOffline: false
	): Promise<ApiHttpResponse<T, TCode>>;

	private request<T>(
		path: string,
		init: RequestInit,
		queueIfOffline: true
	): Promise<ApiResponse<T, TCode>>;

	private request<T>(
		path: string,
		init: RequestInit,
		queueIfOffline: boolean
	): Promise<ApiResponse<T, TCode>>;

	private async request<T>(
		path: string,
		init: RequestInit,
		queueIfOffline: boolean
	): Promise<ApiResponse<T, TCode>> {
		const method = (init.method ?? 'GET').toUpperCase();
		const url = this.makeUrl(path);

		const preparedOffline = queueIfOffline ? this.prepareOfflineAction(path, method, init) : null;
		const requestInit = preparedOffline?.init ?? init;

		const effectiveInit: RequestInit = {
			...requestInit,
			credentials: requestInit.credentials ?? this.credentials
		};

		const cacheEnabled =
			method === 'GET' && this.cache !== undefined && (this.cache.shouldCache?.(url) ?? true);
		const cacheKey = cacheEnabled
			? (this.cache!.getKey?.({ url, init: effectiveInit }) ?? url)
			: url;

		let response: Response;

		try {
			response = await this.fetcher(url, effectiveInit);
		} catch (error) {
			if (this.isAbortError(error, init.signal)) {
				return {
					error: true,
					message: 'Request aborted.'
				};
			}

			return this.handleNetworkError<T>(cacheKey, cacheEnabled, preparedOffline?.action);
		}

		let result: ApiHttpResponse<T, TCode>;

		try {
			result = await this.parser<T>(response);
		} catch {
			return {
				error: true,
				message: 'Invalid server response.',
				status: response.status
			};
		}

		if (cacheEnabled && !result.error) {
			try {
				await this.cache!.adapter.set(cacheKey, result, this.cache!.getTtl?.(url));
			} catch (error) {
				this.reportCacheError(error, 'set', cacheKey);
			}
		}

		if (!result.error && this.cache && this.isQueueableMethod(method)) {
			try {
				await this.cache.invalidateAfterMutation?.({
					method,
					url,
					init: effectiveInit
				});
			} catch (error) {
				this.reportCacheError(error, 'invalidate', url);
			}
		}

		return result;
	}

	private isAbortError(error: unknown, signal?: AbortSignal | null): boolean {
		if (signal?.aborted) return true;

		return (
			typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
		);
	}

	private makeUrl(path: string): string {
		if (!this.baseUrl) return path;

		return `${this.baseUrl}/${path.replace(/^\//, '')}`;
	}

	private jsonRequest<T>(
		method: 'POST' | 'PUT' | 'PATCH',
		path: string,
		body: unknown,
		init: ApiRequestInit
	): Promise<ApiResponse<T, TCode>> {
		const { queueIfOffline = false, ...requestInit } = init;
		const headers = new Headers(requestInit.headers);

		let requestBody = requestInit.body;
		if (body !== undefined) {
			try {
				requestBody = JSON.stringify(body);
			} catch {
				return Promise.resolve({
					error: true,
					message: 'Request body is not JSON serializable.'
				});
			}

			if (!headers.has('Content-Type')) {
				headers.set('Content-Type', 'application/json');
			}
		}

		return this.request<T>(
			path,
			{
				...requestInit,
				method,
				headers,
				body: requestBody
			},
			queueIfOffline
		);
	}

	private async handleNetworkError<T>(
		cacheKey: string,
		cacheEnabled: boolean,
		offlineAction?: OfflineAction
	): Promise<ApiResponse<T, TCode>> {
		if (cacheEnabled) {
			try {
				const cached = await this.cache!.adapter.get<ApiHttpResponse<T, TCode>>(cacheKey);
				if (cached) return cached;
			} catch (error) {
				this.reportCacheError(error, 'get', cacheKey);
			}
		}

		if (offlineAction && this.offlineQueue) {
			try {
				await this.offlineQueue.adapter.enqueue(offlineAction);

				return {
					error: false,
					queued: true
				};
			} catch {
				// Return standard network error below.
			}
		}

		return {
			error: true,
			message: 'Network error.'
		};
	}

	private isQueueableMethod(method: string): method is OfflineAction['method'] {
		return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
	}

	private reportCacheError(
		error: unknown,
		operation: 'get' | 'set' | 'invalidate',
		target: string
	): void {
		try {
			this.cache?.onError?.(error, { operation, target });
		} catch {
			// Diagnostic callback can not break the request
		}
	}

	private parseFilename(cd: string | null): string | undefined {
		if (!cd) return;

		const m =
			cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i) ?? cd.match(/filename\s*=\s*"?([^";]+)"?/i);

		if (!m) return;

		try {
			return decodeURIComponent(m[1]);
		} catch {
			return m[1];
		}
	}

	private guessExtFromMime(mime: string): string {
		const m = mime.toLowerCase().split(';')[0].trim();
		switch (m) {
			case 'application/pdf':
				return 'pdf';
			case 'image/png':
				return 'png';
			case 'image/jpeg':
				return 'jpg';
			case 'text/plain':
				return 'txt';
			case 'text/html':
				return 'html';
			case 'application/zip':
				return 'zip';
			case 'application/vnd.rar':
				return 'rar';
			case 'video/mp4':
				return 'mp4';
			case 'video/x-msvideo':
				return 'avi';
			case 'application/msword':
				return 'doc';
			case 'application/vnd.ms-excel':
				return 'xls';
			case 'application/vnd.ms-powerpoint':
				return 'ppt';
			case 'application/rtf':
				return 'rtf';
			default:
				return '';
		}
	}

	private ensureFilename(name?: string, contentType?: string, fallbackBase = 'download'): string {
		if (name && name.trim()) return name;

		const ext = contentType ? this.guessExtFromMime(contentType) : '';
		return ext ? `${fallbackBase}.${ext}` : fallbackBase;
	}

	private sanitizeFilename(filename: string): string {
		const sanitized = filename
			.normalize('NFC')
			.replace(/[<>:"/\\|?*\p{Cc}]/gu, '_')
			.replace(/[. ]+$/g, '')
			.trim();

		return sanitized || 'download';
	}

	private async saveBlobToDevice(blob: Blob, filename: string): Promise<void> {
		// Android
		ConsiderSavePicker: {
			type WindowWithSavePicker = Window & {
				showSaveFilePicker?: (options?: {
					suggestedName?: string;
					types?: {
						description?: string;
						accept: Record<string, string[]>;
					}[];
				}) => Promise<FileSystemFileHandle>;
			};

			const picker = (window as WindowWithSavePicker).showSaveFilePicker;
			if (typeof picker !== 'function') break ConsiderSavePicker;

			const handle = await picker({ suggestedName: filename });

			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		}

		// iOS/Android
		ConsiderShare: {
			if (!navigator.canShare || !navigator.share) break ConsiderShare;
			const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
			if (!navigator.canShare({ files: [file] })) break ConsiderShare;
			await navigator.share({ files: [file], title: filename });
			return;
		}

		// Fallback
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		try {
			a.href = url;
			a.download = filename;
			a.hidden = true;

			document.body.append(a);
			a.click();
		} finally {
			a.remove();

			setTimeout(() => URL.revokeObjectURL(url), 0);
		}
	}

	private prepareOfflineAction(
		path: string,
		method: string,
		init: RequestInit
	): { action: OfflineAction; init: RequestInit } | null {
		if (!this.offlineQueue || !this.isQueueableMethod(method)) return null;

		const shouldQueue = this.offlineQueue.shouldQueue?.(path, method) ?? true;
		if (!shouldQueue) return null;
		if (init.body != null && typeof init.body !== 'string') return null;

		const id = this.offlineQueue.createActionId?.() ?? globalThis.crypto.randomUUID();
		const idempotency = this.offlineQueue.idempotency;
		const idempotencyKey = idempotency ? (idempotency.createKey?.() ?? id) : undefined;
		const headers = new Headers(init.headers);

		if (idempotencyKey) {
			headers.set(idempotency?.headerName ?? 'Idempotency-Key', idempotencyKey);
		}

		return {
			init: {
				...init,
				headers
			},
			action: {
				id,
				method,
				endpoint: path,
				headers: Array.from(headers.entries()),
				body: typeof init.body === 'string' ? init.body : undefined,
				createdAt: Date.now(),
				idempotencyKey
			}
		};
	}
}
