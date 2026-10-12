# svelte-common

A Svelte 5 library of UI components, reactive services and stores, shared styles,
and small application utilities. Defaults for many labels and date helpers are Polish.

## Install

Install from the public Git repository:

```sh
npm install git+https://github.com/sciborbudkowski/svelte-common.git
```

Requires **Svelte 5.25 or newer within the Svelte 5 major version**, a Svelte-aware
bundler. Import the
stylesheet once in the application root. It includes global element styles and a reset.

## Quick start

```svelte
<script lang="ts">
	import 'svelte-common/styles.css';
	import { onMount } from 'svelte';
	import {
		AlertModal,
		ConfirmModal,
		Loader,
		ToastStack,
		initializeTheme,
		requestConfirmation,
		showSuccessToast
	} from 'svelte-common';

	onMount(initializeTheme);

	async function confirmAction() {
		if (await requestConfirmation('Continue?')) {
			showSuccessToast('Confirmed.');
		}
	}
</script>

<button type="button" class="brand" onclick={confirmAction}>Continue</button>

<AlertModal />
<ConfirmModal />
<Loader />
<ToastStack />
```

Mount each shared renderer once, usually in the root layout. Call browser-only store
actions from event handlers or `onMount`, rather than during server rendering.

## Documentation

| Guide                                                                  | Contents                                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)                             | Installation, root layout, snippets, SSR, browser requirements and imports.              |
| [Components](docs/components.md)                                       | Props, defaults, examples and behavior for general UI and scrolling components.          |
| [Modals and feedback](docs/overlays-and-feedback.md)                   | Modal APIs, confirmation flow, loader sequences and toast lifecycle.                     |
| [Services](docs/services.md)                                           | API responses, scoped caching, offline queues, downloads, WebSockets and storage.        |
| [Stores](docs/stores.md)                                               | Theme synchronization and GPS ownership, state and cleanup.                              |
| [Utilities](docs/utilities.md)                                         | Dates, text, tokens, files, language, theme readers, scrolling and application identity. |
| [Styling](docs/styling.md)                                             | CSS layers, theme tokens, utility classes, buttons and form markup.                      |
| [Development](docs/development.md)                                     | Source layout, scripts, tests, packaging and release checks.                             |
| [Migration and troubleshooting](docs/migration-and-troubleshooting.md) | Behavior changes from the audit fixes and common integration problems.                   |
| [Documentation index](docs/README.md)                                  | Complete public export map and maintenance notes.                                        |

`CollapsibleTabBar` is an internal draft and is excluded from public exports and
the published package.

The [API migration guide](docs/api-migration.md) describes controlled state, native
attribute forwarding, independent renderers and compatibility aliases. The original
[design guide](docs/api-flexibility-guide.md) records the reasoning and migration plan.

The [original audit](docs/component-audit-2026-10-10.md) and
[fix status](docs/component-audit-fixes-2026-10-10.md) record the earlier review and validation.

## Component playground

Run `npm ci` and `npm run dev`, then open the local URL printed by Vite. The home
page demonstrates finished components, state controls, dialogs, notifications,
loaders, scrolling, themes and CSS helpers. Demo images are local SVGs.

## Selective imports

```ts
import Avatar from 'svelte-common/components/Avatar';
import { ApiClient } from 'svelte-common/services/api';
import { friendlyFileSize } from 'svelte-common/utils/file-size';
import 'svelte-common/tokens.css';
import 'svelte-common/styles/buttons.css';
```

Named root imports still support tree-shaking. Explicit subpaths let consumers
resolve only the relevant feature. See [selective imports](docs/selective-imports.md)
for every path, CSS choices and reproducible consumer bundle checks.

## License and maintenance

Project code is [MIT licensed](LICENSE). Third-party assets and dependencies retain
their own terms; see [third-party notices](THIRD_PARTY_NOTICES.md) and the
[licensing guide](docs/licensing.md), including the separate GSAP license.

[GitHub Actions CI](docs/github-actions.md) runs lint, type checks, tests, package
checks and consumer bundle verification on Node 24 and 26 for every pull request.
