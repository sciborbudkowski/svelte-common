# svelte-common

A Svelte 5 library of UI components, reactive services and stores, shared styles,
and small application utilities. Defaults for many labels and date helpers are Polish.

## Install

The repository documents installation from Git over SSH:

```sh
npm install git+ssh://git@github.com/sciborbudkowski/svelte-common.git
```

Requires **Svelte 5.25 or newer within the Svelte 5 major version**, a Svelte-aware
bundler, and access to the Git repository for this installation method. Import the
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

`CollapsibleTabBar` is exported but unfinished. Its draft interface is documented
separately in the component reference; it is not a finished tab-navigation component.

The [API migration guide](docs/api-migration.md) describes controlled state, native
attribute forwarding, independent renderers and compatibility aliases. The original
[design guide](docs/api-flexibility-guide.md) records the reasoning and migration plan.

The [original audit](docs/component-audit-2026-10-10.md) and
[fix status](docs/component-audit-fixes-2026-10-10.md) record the earlier review and validation.
