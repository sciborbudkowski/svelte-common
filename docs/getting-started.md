# Getting started

[Documentation index](README.md) · [Styling](styling.md) · [Development](development.md)

## Installation and imports

```sh
npm install git+ssh://git@github.com/sciborbudkowski/svelte-common.git
```

This installation requires Git and SSH access to the repository. A Git installation
runs the project's preparation step, which builds `dist`. The package declares
`svelte: ^5.25.0` as a peer dependency and uses an ESM/Svelte export condition. Its
components require a bundler that compiles Svelte; the root export is not a plain
Node-only utility package. The repository does not declare a Node `engines` range;
the installed build dependencies determine the required development runtime.

```ts
import { Avatar, ApiClient, formatDate } from 'svelte-common';
import 'svelte-common/styles.css';
```

The root and four CSS subpaths are exported: styles.css, styles-without-reset.css,
tokens.css and reset.css. See [style choices](api-migration.md#stylesheet-choices).
Avoid imports from
`svelte-common/dist/...` or the library's internal `$lib` aliases. Bundled SVGs cover
standard controls. FloatingButton/AccordionItem can accept custom icon class names,
which require an application-provided icon font. Toast custom icons are text, such
as an emoji, rather than class names.

## Root layout

For a SvelteKit application, place shared renderers and initialization in
`src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import 'svelte-common/styles.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { AlertModal, ConfirmModal, Loader, ToastStack, initializeTheme } from 'svelte-common';

	let { children }: { children: Snippet } = $props();

	onMount(initializeTheme);
</script>

{@render children()}

<AlertModal />
<ConfirmModal />
<Loader />
<ToastStack />
```

These stores are shared within the loaded library instance. Mount one renderer for
each singleton feature you use. A page calls `showToast`, `showLoader`,
`openAlertModal` or `requestConfirmation`; the layout supplies their visible UI.
Custom Modal/ManagedModal instances are mounted separately with unique IDs.
For parent-owned/local state and independent feedback widgets, use Dialog,
LoaderView and ToastStackView rather than mutating the singleton stores.

The stylesheet includes a reset, body/headings/button/input styling, theme tokens
and utilities. It affects application elements beyond library components. Load your
own overrides after it; see [styling](styling.md) for the layer structure.

## Snippets and component prop types

Components use Svelte 5 snippets rather than named legacy slots:

```svelte
<script lang="ts">
	import { CollapsibleCard } from 'svelte-common';
</script>

<CollapsibleCard showMoreLabel="Details" showLessLabel="Hide details">
	{#snippet visibleContent()}<p>Order summary</p>{/snippet}
	{#snippet hiddenContent()}<p>Delivery and payment information</p>{/snippet}
</CollapsibleCard>
```

Finished DOM-root components forward typed native attributes/classes/styles to
their documented root element. Component-specific props are extracted before
forwarding; named part props customize internal controls. Refer to each prop table
and [migration contract](api-migration.md) for protected attributes and destinations.

```ts
import type { ComponentProps } from 'svelte';
import { Carousel } from 'svelte-common';

type Slides = ComponentProps<typeof Carousel>['slides'];
```

Reactive service/store state uses Svelte runes internally. Read its fields directly
in markup or `$derived` expressions. Copying a primitive field into an ordinary
variable creates a snapshot. These objects are not legacy `Readable` stores and
do not use the `$store` subscription syntax.

## SSR and browser lifecycle

Components can be imported and rendered by a Svelte SSR build. Their browser effects
start after mounting. Shared overlay renderers normally render closed/empty during
SSR; CircularTimer does not start a countdown until its client effect runs. Carousel
renders its active slide before animation initialization. SizeView initially shows
zero dimensions on the server.

| API                                                   | Server behavior / initialization requirement                                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal open/close/confirmation/scroll-target mutations | Browser-only actions throw on the server. Use event handlers or `onMount`. Pure context/open-state reads do not require a DOM.               |
| Loader and toast mutations                            | Browser-only; throw during SSR. Rendering their components alone is safe.                                                                    |
| `initializeTheme()`                                   | Returns a no-op cleanup during SSR. Call it once in the client layout.                                                                       |
| Theme setters                                         | No browser storage/DOM writes on the server, but they change shared in-memory state; avoid per-request server mutation.                      |
| `WebSocketClient.connect()`                           | Returns during SSR; call `init()` and `connect()` after mount, dispose on unmount.                                                           |
| GPS                                                   | Unsupported during SSR; register consumers in `onMount`.                                                                                     |
| `EphemeralStorage`, `setupAppIdentity`                | Storage is unavailable on the server; reads/identity return `null`, writes/deletes do nothing.                                               |
| `ApiClient`                                           | Requires a fetch implementation; supply the request-scoped SvelteKit `fetch` when used on the server. Downloads return a browser-only error. |
| `readThemeColors()`                                   | Requires `document`/computed styles; browser-only.                                                                                           |
| `scrollToTarget()`                                    | Does nothing on the server.                                                                                                                  |
| Date, text, file/language helpers                     | Usable without a document. File helpers inspect supplied file fields; they do not construct browser files.                                   |
| Token/hash helpers                                    | Require Web Crypto, with `btoa` for token encoding. Availability depends on the host runtime.                                                |

Do not mutate the exported singleton UI stores for user-specific server requests:
the module may be shared by multiple requests. Construct request-specific API clients
and scope response-cache adapters per user/session.

## Browser features and cleanup

Scrolling components use ResizeObserver, MutationObserver and requestAnimationFrame.
FloatingButton/toast gestures use pointer capture. Overlay isolation uses native
`inert`, focus events and keyboard events. Styles include OKLCH, relative colors,
cascade layers and modern selectors. The project does not bundle polyfills or declare
a tested browser-version matrix.

Theme initialization, GPS `init()` and component effects return cleanup functions.
Return those from `onMount`. Call `WebSocketClient.dispose()` when its owner unmounts.
Keep store mutations in event handlers, and use `finally` when manually showing a
loader around asynchronous work.

## Default language and accessibility

Many button labels, GPS messages and carousel controls are Polish. Date formatting
uses `pl-PL`/the Polish date-fns locale. Several components offer label props;
others have fixed labels. The library has no global translation provider.

Provide accessible dialog names, meaningful image alternatives and visible labels
for application controls. Decorative Spinner/CircularTimer instances need no label;
give them `ariaLabel` when they communicate state. Carousel supports reduced motion,
and its focus pause requires an explicit resume action. See the component references
for these contracts and [troubleshooting](migration-and-troubleshooting.md) for known limits.
