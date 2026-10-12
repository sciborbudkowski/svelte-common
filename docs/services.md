# Services

[Documentation index](README.md) · [Lifecycle and SSR](getting-started.md#ssr-and-browser-lifecycle)

## ApiClient

[Source](../src/lib/services/api.ts)

`ApiClient<TCode extends string = string>` wraps fetch, parses an envelope response,
and optionally supplies network-failure cache fallback and mutation queueing. It
does not implement request retry, authentication refresh or background queue replay.

| Constructor option | Type                       | Default / behavior                                             |
| ------------------ | -------------------------- | -------------------------------------------------------------- |
| `baseUrl`          | `string`                   | `''`; one trailing slash removed.                              |
| `credentials`      | `RequestCredentials`       | `'include'`; per-request init can override.                    |
| `fetch`            | `typeof fetch`             | `globalThis.fetch`; inject request-scoped fetch for SSR/tests. |
| `parseResponse`    | `ApiResponseParser<TCode>` | Built-in JSON envelope parser.                                 |
| `cache`            | `ApiCacheOptions`          | Disabled when omitted; see below.                              |
| `offlineQueue`     | Options below              | Disabled when omitted.                                         |

When a base URL exists, a path is joined to it with a slash. This is string joining,
not general URL resolution: pass endpoint paths, not unrelated absolute URLs. With
no base URL the supplied path is passed through unchanged.

### Responses and request methods

```ts
type ApiResponseOk<T> = { error: false; data: T };
type ApiResponseError<TCode extends string = string> = {
	error: true;
	message: string;
	data?: unknown;
	status?: number;
	code?: TCode;
};
type ApiHttpResponse<T, TCode extends string = string> = ApiResponseOk<T> | ApiResponseError<TCode>;
type ApiQueuedResponse = { error: false; queued: true };
type ApiResponse<T, TCode extends string = string> =
	(ApiResponseOk<T> & { queued?: false }) | ApiResponseError<TCode> | ApiQueuedResponse;
```

The built-in parser requires a JSON content type and a boolean `error` field for
successful HTTP responses. It accepts `{ error: false, data }` or application errors
such as `{ error: true, message, code?, data?, status? }`. A non-2xx response becomes
an error even if its body says otherwise; its HTTP status is recorded. Invalid JSON,
missing envelope flags and non-JSON/empty success bodies become errors. A bare REST
object or HTTP 204 therefore needs a custom parser. `T`/`TCode` are TypeScript types,
not runtime response validation.

| Method                          | Signature / return                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get<T>`                        | `(path: string, init?: RequestInit) => Promise<ApiHttpResponse<T, TCode>>`                                                                         |
| `post<T>`, `put<T>`, `patch<T>` | `(path: string, body?: unknown, init?: DirectApiRequestInit) => Promise<ApiHttpResponse<T, TCode>>`; queue-enabled overloads return `ApiResponse`. |
| `delete<T>`                     | `(path: string, init?: DirectApiRequestInit) => Promise<ApiHttpResponse<T, TCode>>`; queue-enabled overloads return `ApiResponse`.                 |
| `downloadAndSave`               | `(path: string, init?: RequestInit, options?: DownloadOptions) => Promise<ApiDownloadResponse>`                                                    |

`ApiRequestInit` extends `RequestInit` with `queueIfOffline?: boolean`.
`DirectApiRequestInit` restricts that flag to false, and `QueuedApiRequestInit` requires
true. If the flag is a dynamic boolean, the result is also the broader `ApiResponse`.
GET does not support mutation queueing.

```ts
import { ApiClient } from 'svelte-common';

type Profile = { id: string; displayName: string };
const api = new ApiClient<'not_found' | 'validation_error'>({ baseUrl: '/api' });

async function readProfile() {
	const result = await api.get<Profile>('/profile');
	if (result.error) {
		console.error(result.message, result.code, result.status);
		return;
	}
	console.log(result.data.displayName);
}
```

The JSON methods serialize a supplied body and set `Content-Type: application/json`
if absent. If body is omitted, an explicit `init.body` is preserved. Serialization
failures, such as circular input, yield an error result. Supply JSON-compatible data.
DELETE passes its supplied init body
through. Pass a signal to abort; aborted ordinary requests return `{ error: true,
message: 'Request aborted.' }` and are not cached/queued as network failures.
Expected fetch/parser/cache/queue failures become results or isolated diagnostics;
application-supplied queue preparation hooks may throw, so this is not a blanket
guarantee that every request promise resolves.

`ApiResponseParser<TCode>` has the generic signature
`<T>(response: Response) => Promise<ApiHttpResponse<T, TCode>>`. It owns HTTP handling
and validation when supplied. Parser exceptions become an invalid-response error.

## Cache

[Adapter interface](../src/lib/services/cache.ts) · [Client implementation](../src/lib/services/api.ts)

```ts
interface CacheAdapter {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttl?: number): Promise<void>;
	delete?(key: string): Promise<void>;
}
```

The client stores successful GET envelopes after a network response and consults
the cache only when fetch throws. It does not serve cache-first requests or fall back
for HTTP errors, invalid responses or cancellation. TTL units/expiration are the
adapter's responsibility; use milliseconds when adapting EphemeralStorage.

| ApiCacheOptions field     | Contract                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `adapter`                 | Required CacheAdapter.                                                                                                    |
| `scope`                   | Non-secret `string` or `() => string \| null`; a configured empty/null scope disables caching.                            |
| `getKey`                  | `(context: ApiCacheKeyContext) => string`; explicit key policy.                                                           |
| `shouldCache`             | `(url: string) => boolean`; defaults true when cache configured.                                                          |
| `getTtl`                  | `(url: string) => number`; passed to adapter set.                                                                         |
| `invalidateAfterMutation` | `(context: ApiCacheMutationContext) => void \| Promise<void>`; called after successful POST/PUT/PATCH/DELETE.             |
| `onError`                 | `(error: unknown, context: { operation: 'get' \| 'set' \| 'invalidate'; target: string }) => void`; optional diagnostics. |

`ApiCacheKeyContext` is `{ url: string; init: RequestInit }` with effective credentials.
`ApiCacheMutationContext` also has `method: OfflineMethod`. There is no automatic
invalidation of related URLs; implement it in the mutation hook. `delete` is optional
because not every adapter supports that policy.

Requests whose credentials are not `omit`, or which include Authorization, Cookie
or Proxy-Authorization, require a scope or explicit `getKey` to cache. Credentials
default to include, so adding an adapter alone does not enable private caching.
Default scoped keys contain the scope, URL and non-credential header variants.
Public requests with credentials omitted and no credential headers may use default
keys without a scope. With both scope and custom key, the scope namespaces that key.
A custom key without a scope must partition users and response variants itself.

```ts
import { ApiClient, EphemeralStorage } from 'svelte-common';
import type { CacheAdapter } from 'svelte-common';

const cache: CacheAdapter = {
	get: <T>(key: string) => EphemeralStorage.get<T>(key),
	set: <T>(key: string, value: T, ttl?: number) => EphemeralStorage.set(key, value, ttl),
	delete: (key: string) => EphemeralStorage.delete(key)
};

let sessionScope: string | null = 'session-123';
const api = new ApiClient({
	baseUrl: '/api',
	cache: { adapter: cache, scope: () => sessionScope, getTtl: () => 60000 }
});
```

Set `sessionScope = null` on logout, rotate it when authorization changes, and clear
old private adapter entries using your application's tracked keys/namespace policy.
Do not use tokens as cache namespaces or retain legacy unscoped private entries.
Cache keys omit the standard credential headers, but custom headers can contain
sensitive values; define an explicit safe key policy for those. The adapter controls
storage security and retention. EphemeralStorage is plain localStorage, not encrypted.

Failing key/filter/get/set/TTL/invalidation hooks are isolated from successful network
requests. `onError` failures are also isolated. An invalidation hook is not called
for a mutation merely queued after network failure.

## Offline queue

Queueing is opt-in twice: configure `offlineQueue.adapter` and pass
`queueIfOffline: true` on a mutation. Fetch must throw for the action to enqueue;
HTTP/application failures and cancellation are not enqueued. Only POST/PUT/PATCH/DELETE
with an absent or serialized string body can be queued. The client still tries the
network first and does not rely on `navigator.onLine`.

| offlineQueue option | Contract                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapter`           | Required `{ enqueue(action: OfflineAction): Promise<void> }`.                                                                                  |
| `shouldQueue`       | `(endpoint: string, method: OfflineMethod) => boolean`; defaults true.                                                                         |
| `createActionId`    | `() => string`; defaults `crypto.randomUUID()`.                                                                                                |
| `idempotency`       | Omitted: action ID is the key sent in `Idempotency-Key`. `false`: no generated key. Object: `headerName?: string`, `createKey?: () => string`. |

```ts
import { ApiClient } from 'svelte-common';
import type { OfflineAction } from 'svelte-common';

// Demonstration only: this array is not persistent storage.
const pending: OfflineAction[] = [];
const api = new ApiClient({
	baseUrl: '/api',
	offlineQueue: {
		adapter: {
			enqueue: async (action) => {
				pending.push(action);
			}
		}
	}
});

async function saveNote() {
	const result = await api.post<{ id: string }>(
		'/notes',
		{ text: 'Draft' },
		{ queueIfOffline: true }
	);
	if (result.error) console.error(result.message);
	else if (result.queued) console.log('Stored for later replay');
	else console.log('Saved', result.data.id);
}
```

`OfflineMethod` is `'POST' | 'PUT' | 'PATCH' | 'DELETE'`. Recorded actions contain:

```ts
interface OfflineAction {
	id: string;
	method: OfflineMethod;
	endpoint: string;
	url: string;
	credentials: RequestCredentials;
	headers: Array<[string, string]>;
	body?: string;
	createdAt: number;
	idempotencyKey?: string;
}
```

`url` is the base-joined URL, not necessarily an absolute URL; `createdAt` is epoch
milliseconds. The generated key is sent on the initial attempt and recorded in
headers for reuse. With idempotency generation enabled, that header replaces any
same-name header in init; configure `createKey` for application-defined keys. Setting
idempotency false preserves caller-supplied headers.

No replay worker, persistence implementation, queue inspection/deletion API or retry
policy is bundled. Your replay worker should send the stored method/URL/credentials/
headers/body, inspect the server response, and remove an action only after success.
The server must honor idempotency keys because a network failure can occur after a
mutation committed. Scope adapters by client/session, clear pending actions on logout,
and decide how expired credentials are renewed without replaying another user's action.
Persisted explicit headers/body may be sensitive; protect them in your adapter.
An enqueue failure returns the standard network error. `queued: true` has no `data`.

## Downloads

`downloadAndSave(path, init = {}, options = {})` is browser-only. It uses the same
base URL/fetch/credentials defaults but does not use response-envelope parsing,
caching or queueing. Its init method defaults to GET and can be overridden.

`DownloadOptions` contains `suggestedName?: string` and `fallbackBaseName?: string`.
`ApiDownloadResponse` is one of:

```ts
type ApiDownloadResponse =
	| { error: false; cancelled?: false; status?: number }
	| { error: false; cancelled: true; status?: number }
	| { error: true; message: string; status?: number };
```

Call directly from a user action so an available save picker can open before waiting
for the fetch. Supply a suggested filename for this early prompt. Cancelling the
picker returns cancelled without downloading. Otherwise the response is fetched
as a Blob and saved through the chosen handle, an available file-share sheet while
activation remains, or an object-URL download link.

```svelte
<script lang="ts">
	import { ApiClient } from 'svelte-common';
	const api = new ApiClient({ baseUrl: '/api' });
	let message = $state('');

	async function download() {
		const result = await api.downloadAndSave('/report', {}, { suggestedName: 'report.pdf' });
		message = result.error ? result.message : result.cancelled ? 'Cancelled' : 'Save requested';
	}
</script>

<button type="button" onclick={download}>Download report</button><p>{message}</p>
```

Without a chosen handle, filename preference is Content-Disposition, suggestedName,
then fallbackBaseName (`download`) plus a recognized MIME extension. Filenames are
sanitized. The chosen picker handle controls the final filename even if server headers
later supply another. SecurityError/NotAllowedError/NotSupportedError from picker/share
can fall back; AbortError remains cancellation. Known expired activation skips picker/
share. Failed writes abort the writable when possible. Object URLs are revoked after
30 seconds to allow the download to start. Success indicates the save/share/download
request completed, not an independently verified file on disk.

## WebSocketClient

[Source](../src/lib/services/websockets.svelte.ts)

`WebSocketClient<T = unknown>` supplies a reactive connection state and JSON message
callbacks. Constructor option types are accepted structurally; the internal option
interface is not a named root export.

| Option                                            | Default / contract                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `url: string`                                     | Required; relative to window location, `http(s)` converted to `ws(s)`. |
| `maxReconnectAttempts?: number`                   | 10; finite values become nonnegative integers.                         |
| `reconnectDelay?: number`                         | 1000 ms; finite values clamped to 0–30000.                             |
| `onMessage?: (message: T) => void`                | Parsed JSON callback. Validate payload shape in application code.      |
| `onStatusChange?: (status: SocketStatus) => void` | Synchronous status callback.                                           |
| `debug?: boolean`                                 | false; extra diagnostics.                                              |

Nonfinite retry settings use defaults. Callback types are synchronous: synchronous
throws are logged, but promises returned from async callbacks are not awaited/caught.
Handle asynchronous work/errors inside your callback.

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { WebSocketClient, setupAppIdentity } from 'svelte-common';
	let { token }: { token: string } = $props();
	const socket = new WebSocketClient<{ type: string }>({
		url: '/events',
		onMessage: (message) => {
			console.log(message.type);
		}
	});

	onMount(() => {
		const uuid = setupAppIdentity('example-client-id');
		if (uuid) {
			socket.init({ token, uuid });
			socket.connect();
		}
		return () => socket.dispose();
	});
</script>

<p>Connection: {socket.state.status}</p>
<button
	type="button"
	disabled={socket.state.status !== 'open'}
	onclick={() => {
		socket.send('ping', { sentAt: Date.now() });
	}}>Ping</button
>
```

`state` contains `status: SocketStatus`, `attempts: number`, `error: string | null`.
`SocketStatus` is `disconnected | connecting | open | closing`. `attempts` counts
scheduled retries, resets on opening/visibility recovery, and does not count sends.

| Method                                          | Behavior                                                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init({ token, uuid }): void`                   | Sets credentials and installs visibility listener; first initialization alone does not connect. Changed credentials replace an active/retrying connection. |
| `connect(): void`                               | Requires nonempty token/UUID; no-op during SSR or when already open/connecting. Cancels obsolete retry work and enables reconnect.                         |
| `send(type: string, payload: unknown): boolean` | Sends JSON `{ type, payload }` only while open; false if unavailable/serialization/send fails.                                                             |
| `disconnect(): void`                            | Stops retrying and closes intentionally; visibility listener remains installed.                                                                            |
| `dispose(): void`                               | Disconnects and removes visibility listener.                                                                                                               |

Token/UUID are URL query parameters, replacing existing values of those names. Treat
the server's logging/authentication policy accordingly. Incoming messages are parsed
with JSON.parse; malformed JSON/callback failures are logged. There is no message
buffer, heartbeat, acknowledgment, binary decoding or runtime schema validation.

Unexpected close while visible schedules exponential delay
`min(reconnectDelay * 2 ** attempts, 30000)` up to the attempt limit. Hidden pages do
not schedule a new retry on close; returning to visible resets the budget and attempts
reconnection when enabled. Hiding does not itself close an open socket. Constructor/
configuration failures populate error/disconnected state and disable automatic retry.
Correct configuration/use a new client if its fixed URL is wrong, then connect explicitly.
Stale socket events and obsolete retry deadlines cannot replace the current connection.

## EphemeralStorage

[Source](../src/lib/services/storage.ts)

Best-effort localStorage with lazy expiration. Methods are async for adapter use;
underlying storage operations are synchronous. No encryption, background cleanup,
schema validation, subscriptions or key prefixing is supplied.

| Method                                                                | Contract                                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `EphemeralStorage.set<T>(key, value, ttlMs = 3600000): Promise<void>` | Stores JSON `{ value, expiresAt }`; TTL is milliseconds.                                    |
| `EphemeralStorage.get<T>(key): Promise<T \| null>`                    | Reads value; expired/malformed entries are removed when read. Generic type is an assertion. |
| `EphemeralStorage.delete(key): Promise<void>`                         | Best-effort removal.                                                                        |

```ts
import { EphemeralStorage } from 'svelte-common';

async function rememberFilter() {
	await EphemeralStorage.set('example-filter', { query: 'active' }, 60000);
	return await EphemeralStorage.get<{ query: string }>('example-filter');
}
```

Unavailable storage, quota/serialization/read errors and SSR writes are tolerated;
reads return null. Values must be JSON-serializable; serialization loses Date/class
identity, and a stored null is indistinguishable from a missing value. Use a finite
positive TTL. Expiration is checked on access, so the physical entry may remain until
read/deleted. Storage failures cannot be inferred from the void write result.
