# Selective imports and bundle size

[Documentation index](README.md) · [Package exports](../package.json)

The package ships separate Svelte/ES modules. It does not ship a single prebundled
JavaScript file. Modern Svelte-aware bundlers can tree-shake named root imports;
explicit subpaths also avoid resolving the entire root export graph.

```svelte
<script lang="ts">
	import Avatar from 'svelte-common/components/Avatar';
	import { ApiClient } from 'svelte-common/services/api';
	import { friendlyFileSize } from 'svelte-common/utils/file-size';
	import type { AvatarProps } from 'svelte-common/types';
	import 'svelte-common/tokens.css';

	const avatarProps: AvatarProps = { initials: 'SC', size: 'xl' };
	const api = new ApiClient({ baseUrl: '/api' });
</script>

<Avatar {...avatarProps} />
<p>{friendlyFileSize(2048)}</p>
<button type="button" onclick={() => api.get('/status')}>Check status</button>
```

## Public import paths

Paths are case-sensitive. Component subpaths have a **default export**; services,
stores and utilities have **named exports**, matching the existing root names.
Components and runes modules require a Svelte-aware bundler. Plain utility/service
paths also have a default export condition for JavaScript runtimes; this is an
export-map condition, not a default-exported API class.

| Prefix                      | Supported names                                                                                        | Example                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `svelte-common/components/` | Every finished component exported at the root, including ManagedLoader, ManagedToastStack and SizeView | `import Avatar from 'svelte-common/components/Avatar'`             |
| `svelte-common/services/`   | api, websockets, storage, cache                                                                        | `import { ApiClient } from 'svelte-common/services/api'`           |
| `svelte-common/stores/`     | theme, gps, modals, loader, toasts                                                                     | `import { showToast } from 'svelte-common/stores/toasts'`          |
| `svelte-common/utils/`      | app-id, date, styles, text, file-size, token, files, lang, scroll                                      | `import { friendlyFileSize } from 'svelte-common/utils/file-size'` |
| `svelte-common/types`       | Component props, state/reason/part types and CacheAdapter                                              | `import type { DialogProps } from 'svelte-common/types'`           |

Import service-specific interfaces from the corresponding service path, such as
`ApiResponse` from services/api and `SocketStatus` from services/websockets.
`CacheAdapter` is type-only. The type entry point is for `import type`, not runtime
imports. Modal controller subpaths expose public actions while keeping stack
registration, focus history and internal singleton state private.

The unfinished CollapsibleTabBar has no public export, subpath or packed source.
Its source remains in the repository. Internal icon/state/focus modules are also
excluded from the public export map. Do not import through `svelte-common/dist/...`.

## Import only the CSS you need

CSS is intentionally marked as a side effect. JavaScript tree-shaking does not
remove unused selectors from a stylesheet you explicitly import. The full
`styles.css` includes the reset, native element styling and every helper module.

```ts
import 'svelte-common/tokens.css';
import 'svelte-common/styles/buttons.css';
import 'svelte-common/styles/utils.css';
import 'svelte-common/styles/grids.css';
```

The eight individual modules are buttons, switch, radio, slider, elements, form,
utils and grids, all under `svelte-common/styles/<name>.css`. Import tokens first;
these modules reference the shared variables. Individual modules are unlayered CSS,
so their rules take precedence over layered rules unless your app wraps imports in
its own layers. Use `styles.css` or `styles-without-reset.css` when you want the
library's complete cascade-layer ordering instead.

`tokens.css` provides palette, base variables and component theme variables,
without resetting or styling native elements. `reset.css` is optional. Svelte
components still include their own scoped styles; these entry points do not add an
unstyled rendering mode.

## What this saves

An Avatar-only app includes Avatar and the Svelte runtime, with no Carousel, dialogs,
WebSocket service, GSAP, date-fns, Markdown parser or sanitizer. Existing named
root imports remain supported and are tested for the same omission. Independent
service/utility consumers can omit UI and Svelte entirely.

`friendlyFileSize` now lives in its own module. Its root and utils/text re-exports
are retained, while utils/file-size directly avoids Markdown imports. Calling
textToHtml or rendering ToastStack/Carousel/confirmation content still requires
the parser and sanitizer; those are actual dependencies of those features.
Carousel loads GSAP dynamically when mounted. A dynamic import may create another
chunk rather than making that code disappear: it is required when using Carousel.

Selective imports reduce the browser bundle and dependency graph processed by the
bundler. They do not change which runtime dependencies npm installs for the package.
Avoid namespace imports that enumerate the whole library or dynamically access
exports, which can prevent dead-code elimination.

## Reproducible verification

```sh
npm run package
npm run test:bundles
```

The [consumer bundle check](../scripts/validate-bundles.mjs) builds through the
actual package export map and inspects rendered modules. It checks Avatar via both
root and subpath, the file-size utility, the API service, and a tokens/buttons-only
CSS consumer. It also rejects unrelated component/helper selectors. It fails if unrelated
heavy dependencies are emitted or if plain utility/service bundles include Svelte.
Reported byte counts include the runtime when required and depend on the installed
compiler/minifier. They are examples, not fixed size guarantees.

The [archive check](../scripts/validate-package.mjs), run by build/prepack, verifies
that every declared export target and license/notice is present in the real npm
archive and that drafts, tests and fixtures are absent.
