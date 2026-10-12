# Theme and GPS stores

[Documentation index](README.md) · [Loader, toast and modal stores](overlays-and-feedback.md)

State exposed by this library uses Svelte runes, rather than the legacy writable/
readable store API. Read fields directly in markup; do not use `$themeState` or
`$gps`. Theme/loader/toast/modal state is shared per library module instance;
GPS is owned by each `new Gps()` instance.

## Theme

[Source](../src/lib/stores/theme.svelte.ts) · [Theme CSS](../src/lib/styles/appglobals.css)

`ThemePreference` is `'light' | 'dark' | 'system'`.
`ResolvedTheme` is `'light' | 'dark'`. `THEME_STORAGE_KEY` is `'sc-theme'`.

| ThemeState field | Type              | Initial value |
| ---------------- | ----------------- | ------------- |
| `preference`     | `ThemePreference` | `'system'`    |
| `resolved`       | `ResolvedTheme`   | `'light'`     |
| `initialized`    | `boolean`         | `false`       |

| API                             | Behavior                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `themeState`                    | Shared reactive state. Read directly; use functions for changes.                                                               |
| `initializeTheme(): () => void` | Reads storage, observes system scheme/storage, updates `<html data-theme>`, returns ownership-safe cleanup. SSR returns no-op. |
| `destroyTheme(): void`          | Removes current listeners and marks uninitialized; does not erase preference or remove the data-theme attribute.               |
| `setTheme(preference): void`    | Stores preference and applies it. Invalid runtime values are ignored.                                                          |
| `toggleTheme(): void`           | Switches resolved light/dark to the opposite explicit preference.                                                              |
| `useSystemTheme(): void`        | Stores/applies `'system'`.                                                                                                     |

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeTheme, themeState, toggleTheme, useSystemTheme } from 'svelte-common';
	onMount(initializeTheme);
</script>

<p>Preference: {themeState.preference}; displayed: {themeState.resolved}</p>
<button type="button" onclick={toggleTheme}>Switch theme</button>
<button type="button" onclick={useSystemTheme}>Follow system</button>
```

Initialize once in the root layout; a second initialization replaces the prior
listeners. Cleanup from the old owner cannot remove the newer initialization.
System changes apply while preference is system. Other-tab localStorage events,
including clearing storage, update the preference; sessionStorage events are ignored.
Storage failures are tolerated. Before initialization, the system media query is
not installed, so explicit initialization is needed for reliable system resolution.

The stylesheet uses root default light tokens and `:root[data-theme='dark']` overrides.
To apply preference before client mounting and avoid a light-theme flash, place this
script in the consuming SvelteKit application's `app.html` head. Add a CSP nonce/hash
where required by your application:

```html
<script>
	(() => {
		let preference = 'system';
		try {
			const stored = localStorage.getItem('sc-theme');
			if (stored === 'light' || stored === 'dark' || stored === 'system') preference = stored;
		} catch {
			// Storage is optional.
		}
		const systemDark =
			typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.dataset.theme =
			preference === 'dark' || (preference === 'system' && systemDark) ? 'dark' : 'light';
	})();
</script>
```

The startup script only applies the attribute; `initializeTheme` still supplies
reactive state and listeners. SSR itself starts with light state unless your application
adds its own per-request presentation. Avoid server-side mutation of this singleton
to select individual users' themes.

## GPS

[Source](../src/lib/stores/gps.svelte.ts)

`Gps` wraps the browser's `watchPosition` and shares one watch between consumers of
that instance. `GpsMode` is `'balanced' | 'precise'`. A precise consumer upgrades
the watch; releasing the last precise consumer downgrades remaining balanced owners.
Browser geolocation permission and availability are still required.

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { Gps } from 'svelte-common';
	const gps = new Gps();
	onMount(() => gps.init('balanced'));
</script>

{#if gps.state.coords}
	<p>{gps.state.coords.lat}, {gps.state.coords.lon}</p>
{/if}
{#if gps.state.error}<p>{gps.state.error}</p>{/if}
```

For sharing between pages/widgets, keep one instance in an application-owned client
module/context and call `init(mode)` for each consumer. Return each cleanup from its
`onMount`. Do not start watching during module evaluation/SSR.

### State and types

| GpsState field | Type                  | Initial / meaning                                           |
| -------------- | --------------------- | ----------------------------------------------------------- |
| `supported`    | `boolean`             | Browser geolocation availability; false on server.          |
| `active`       | `boolean`             | false; watch registered, including while awaiting recovery. |
| `mode`         | `GpsMode`             | balanced; effective consumer-selected mode.                 |
| `coords`       | `GpsCoords` or `null` | null; latest emitted coordinates.                           |
| `accuracy`     | `number` or `null`    | null; browser accuracy in meters.                           |
| `error`        | `string` or `null`    | null; Polish diagnostic text.                               |
| `updatedAt`    | `number` or `null`    | null; emission time from `Date.now()`.                      |
| `intervalMs`   | `number`              | 10000; minimum interval between emitted updates.            |

```ts
type GpsPosition = {
	lat: number;
	lon: number;
	speed?: number | null;
	heading?: number | null;
	altitude?: number | null;
};
type GpsCoords = GpsPosition & { zoom?: number };
interface GpsOptions {
	enableHighAccuracy: boolean;
	maximumAge?: number;
	timeout?: number;
}
```

The browser supplies speed/heading/altitude with its normal units (meters/second,
degrees and meters). The watcher does not calculate or populate `zoom`; the field
exists for application use. Coordinates are not smoothed or transformed.

### Methods and ownership

| Method                                                            | Behavior                                                                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `init(mode = 'balanced'): () => void`                             | Registers a consumer, starts/upgrades watch, returns idempotent release. Last release stops it.                               |
| `start(): void`                                                   | Starts if supported and not already watching, using effective mode. Can be used directly without consumer tracking.           |
| `stop(): void`                                                    | Clears watch, invalidates stale callbacks, marks inactive. Consumer counts and previous position/error remain.                |
| `restart(): void`                                                 | Restarts when effective mode changed, or starts a stopped watch when registered consumers remain. Not an unconditional reset. |
| `setInterval(ms: number): void`                                   | Finite values are floored and clamped to at least 1000 ms; invalid values ignored.                                            |
| `getGpsOptions(mode): GpsOptions`                                 | Returns native watch options below.                                                                                           |
| `getErrorDescriptionFor(error: GeolocationPositionError): string` | Maps browser errors to Polish text.                                                                                           |

| Mode     | enableHighAccuracy | timeout  | maximumAge |
| -------- | ------------------ | -------- | ---------- |
| balanced | false              | 20000 ms | 30000 ms   |
| precise  | true               | 30000 ms | 5000 ms    |

`setInterval` throttles emitted state updates, not native position acquisition or
energy use. Timeout/position-unavailable errors keep the watch active so it can
recover; permission denial stops watching until an explicit start/restart/new consumer
registration. A later accepted position clears the error. Superseded watch callbacks
are ignored. A stopped watcher retains its last coordinates, so `coords !== null`
alone does not mean a current fix; check `active`, `updatedAt`, error and accuracy.
