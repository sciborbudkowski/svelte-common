# Modals and feedback

[Documentation index](README.md) · [Setup](getting-started.md) · [Styling](styling.md)

Mount shared renderers once in the application layout. All modal, loader and toast
mutation functions documented here are browser-only and throw during SSR. Their
components can be rendered normally by a Svelte SSR build. Custom Modal instances
use unique IDs; shared AlertModal/ConfirmModal render their singleton stores.

## Modal

[Compatibility adapter](../src/lib/ui/Modal.svelte) · [Core](../src/lib/ui/Dialog.svelte) · [Store](../src/lib/stores/modal.svelte.ts)

| Prop                          | Type                                                      | Default            | Meaning                                                              |
| ----------------------------- | --------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| `id`                          | `string`                                                  | required           | Unique dialog/store key.                                             |
| `open`                        | `boolean`                                                 | `undefined`        | Omitted: store-driven. Supplied: parent controls visibility.         |
| `busy`                        | `boolean`                                                 | `false`            | Block user dismissal/actions.                                        |
| `ariaLabel`                   | `string`                                                  | omitted            | Explicit accessible name.                                            |
| `ariaLabelledby`              | `string`                                                  | omitted            | ID of an existing title element.                                     |
| `size`                        | `'wide'`, `'narrow'`, `'full'`                            | effective `'wide'` | Context can override.                                                |
| `position`                    | `'center'`, `'top'`, `'bottom'`                           | `'center'`         | Vertical placement.                                                  |
| `fullHeight`                  | `boolean`                                                 | `false`            | Context can override.                                                |
| `confirmButtonLabel`          | `string`                                                  | `'Potwierdź'`      | Default footer confirm label.                                        |
| `cancelButtonLabel`           | `string`                                                  | `'Anuluj'`         | Default footer cancel label.                                         |
| `headerClass`                 | `string`                                                  | omitted            | Extra modal-header class.                                            |
| `onConfirm`                   | `() => void` or `() => Promise<void>`                     | omitted            | Prop action overrides store action.                                  |
| `onCancel`                    | `() => void`                                              | omitted            | Prop cancellation overrides store action.                            |
| `onActionError`               | `(error: unknown, action: 'confirm' \| 'cancel') => void` | omitted            | Action-error handler; otherwise console logging.                     |
| `header`, `content`, `footer` | `Snippet`                                                 | omitted            | Header/body/footer. A custom footer replaces default action buttons. |

Modal additionally accepts defaultOpen (local ownership when open is omitted),
onOpenChange, openingKey, disabled, closeLabel, children as body content, closeIcon,
root native dialog attributes/class/style, backdropProps/headerProps/bodyProps/
footerProps and closeButtonProps/confirmButtonProps/cancelButtonProps. Legacy
headerClass/ariaLabel/ariaLabelledby remain; native ARIA labels take precedence.
When neither open nor defaultOpen is provided, the existing custom store owns
visibility. See [the migration guide](api-migration.md#dialog-and-managed-modal-apis).

### Dialog and ManagedModal

Dialog provides the explicit open/defaultOpen/onOpenChange contract and all the
surface/part props above, without custom-modal visibility/context lookups. Its id
is optional/generated. ManagedModal connects that core to a required modalId store
key and a separate optional DOM id. Both share overlay stacking/focus/scroll ownership.
ManagedModal context retains size/fullHeight overrides. Content can be a named
content snippet or children. Use openingKey to identify logical async replacements.

### Store-driven dialog

```svelte
<script lang="ts">
	import { Modal, openModal, getModalContext } from 'svelte-common';
	let saved = $state(false);

	function openEditor() {
		openModal('edit-profile', {
			context: { accountId: 'account-1', size: 'narrow' },
			onConfirm: () => {
				saved = true;
			}
		});
	}
</script>

<button type="button" onclick={openEditor}>Edit</button>
<Modal id="edit-profile">
	{#snippet header()}Edit profile{/snippet}
	{#snippet content()}
		<p>Account: {getModalContext<{ accountId: string }>('edit-profile')?.accountId}</p>
	{/snippet}
</Modal>
{#if saved}<p>Saved.</p>{/if}
```

| Function                   | Signature / result                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openModal`                | `openModal(id: string, options?: { context?: unknown; onConfirm?: (context?: unknown) => void \| Promise<void>; onCancel?: (context?: unknown) => void }): void` |
| `closeModal`               | `closeModal(id: string): void`; programmatic close, without invoking its cancel callback.                                                                        |
| `getModalContext`          | `getModalContext<T = unknown>(id: string): T \| undefined`; a type assertion, not runtime validation.                                                            |
| `isModalOpen`              | `isModalOpen(id: string): boolean`; reads the custom-modal store, not a controlled component's `open` prop.                                                      |
| `setModalScrollLockTarget` | `setModalScrollLockTarget(target: HTMLElement \| null): void`; null selects body.                                                                                |

Reopening the same ID replaces its stored context/actions. Store callbacks receive
context; the component's prop callback types take no parameters. Context fields
`size` and `fullHeight`, when present, override display props. There is no implicit
network operation or data persistence in a modal.

### Controlled dialog

```svelte
<script lang="ts">
	import { Modal } from 'svelte-common';
	let open = $state(false);
	let accepted = $state(false);
</script>

<button
	type="button"
	onclick={() => {
		open = true;
	}}>Review</button
>
<Modal
	id="controlled-review"
	{open}
	ariaLabel="Review changes"
	onConfirm={() => {
		accepted = true;
		open = false;
	}}
	onCancel={() => {
		open = false;
	}}
>
	{#snippet content()}<p>Apply these changes?</p>{/snippet}
</Modal>
{#if accepted}<p>Accepted.</p>{/if}
```

`open` is not bindable. The parent accepts controlled visibility proposals through
onOpenChange, or closes it in action callbacks as in the legacy example.
Passing `open={false}` overrides any custom-store opening for the same ID. Custom
footer actions must manage their own pending state and invoke their own callbacks;
use `busy={saving}` to block the built-in close button, Escape and backdrop dismissal.

### Actions, focus and scroll ownership

Only the active top dialog's built-in actions run. Async confirmation marks the
dialog busy; duplicate confirmation and user cancellation/dismissal are blocked.
A failed action leaves it open for retry. Programmatic closure/replacement is allowed,
and finishing an older confirmation cannot close its replacement. Cancel callbacks
are synchronous by contract; programmatic `closeModal` does not call them.

Headers provide the default accessible name. `ariaLabel` takes precedence over the
generated header relationship; `ariaLabelledby` references your title. A headerless,
unnamed Modal falls back to `Dialog`, so supply a meaningful name. Focus prefers a
visible `[autofocus]` target, then the first tabbable element, then the dialog itself.
Tab/Shift+Tab cycle within the active overlay, and escaped programmatic focus is
redirected. Inactive/background branches become inert. Nested dialogs keep the
ancestor containing the active dialog available while isolating sibling content.
Focus returns to the prior eligible target when the owning overlay closes.

A rejected controlled close leaves visibility, focus and scroll ownership intact.
State callbacks propose changes rather than guaranteeing acceptance. Controlled
prop updates do not echo callbacks. User close reasons are escape, backdrop,
close-button, cancel or confirm; callback failures are isolated. Existing Modal
store adapters accept store-driven closure and preserve replacement guards.

The first modal locks the configured scroll target and the last releases it. Inline
overflow values and priorities are restored; changing targets while open transfers
the lock. Loader shares reference-counted body locking and has interaction priority
over dialogs. Modal layout respects top/bottom bar heights, while background content
inside those bars is still inert. Only the modal body scrolls within the dialog.

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { setModalScrollLockTarget } from 'svelte-common';
	let mainElement = $state<HTMLElement | null>(null);

	onMount(() => {
		setModalScrollLockTarget(mainElement);
		return () => setModalScrollLockTarget(null);
	});
</script>

<main bind:this={mainElement} style="height: 100dvh; overflow-y: auto;">
	<!-- Application content -->
</main>
```

## AlertModal

[Source](../src/lib/ui/Modals/AlertModal.svelte)

`<AlertModal />` accepts native dialog/part attributes plus id, titles (partial
info/success/warning/error title map) and okLabel (default OK). It displays the singleton alert
message, a bundled status icon, a Polish title and an OK button. Messages are parsed
as sanitized inline Markdown with `textToHtml`.

```ts
import { openAlertModal, closeAlertModal } from 'svelte-common';

openAlertModal('Your changes were **saved**.', 'success');
// Later, if needed:
closeAlertModal();
```

`openAlertModal(message: string, type = 'info')` accepts `info`, `success`, `warning`
or `error`; a later call replaces the current alert. `closeAlertModal(): void` closes
and resets it. Alerts have no result promise or close callback. Mount one renderer;
its internal fixed ID is reserved for that renderer.

## ConfirmModal

[Source](../src/lib/ui/Modals/ConfirmModal.svelte)

| Prop    | Type     | Default                |
| ------- | -------- | ---------------------- |
| `id`    | `string` | `'__confirm_modal_id'` |
| `title` | `string` | `'Potwierdzenie'`      |

ConfirmModal also forwards native dialog/part props and supports closeLabel,
confirmButtonLabel/cancelButtonLabel, closeIcon and onActionError. Its visibility,
actions and built-in header/body remain owned by the confirmation controller.

Mount `<ConfirmModal />` once. Messages use sanitized inline Markdown. Footer
labels default to Polish strings and can be configured. Changing its ID changes stack identity, not the
underlying singleton confirmation state.

```ts
import { requestConfirmation } from 'svelte-common';

async function askToContinue(): Promise<boolean> {
	return await requestConfirmation('Continue with this operation?');
}
```

`requestConfirmation(message: string): Promise<boolean>` resolves true on confirmation
and false on cancellation, replacement, programmatic close or renderer unmount.
A new request settles the previous one as false. Without a mounted renderer, the
request remains pending until another action closes/replaces it. Sequential awaited
requests are supported.

For callback-based actions:

```ts
import { openConfirmModal } from 'svelte-common';

openConfirmModal(
	'Apply changes?',
	async (context) => {
		console.log('Apply context', context);
	},
	{
		context: { revision: 3 },
		onCancel: () => {
			console.log('Cancelled');
		}
	}
);
```

`openConfirmModal(message, onConfirm, options?: { onCancel?: () => void; context?: unknown })`
returns void. `onConfirm` is required and may return a promise. The UI blocks dismissal
while it runs; failures are logged and keep the confirmation open. Old callbacks do
not close a replacement. `closeConfirmModal(): void` settles pending requests as false
and resets the singleton; it does not invoke a callback-based `onCancel`.

## Loader

[Component](../src/lib/ui/Loader.svelte) · [Store](../src/lib/stores/loader.svelte.ts)

`<Loader />` accepts native overlay attributes/class/style and dialogProps. State
continues to come from loaderState. It renders that state as a blocking dialog with
status/progress semantics and a decorative spinner. It makes surrounding content
inert, contains focus, locks body scrolling and restores interaction when hidden.

| State field | Type      | Initial value      |
| ----------- | --------- | ------------------ |
| `isVisible` | `boolean` | `false`            |
| `message`   | `string`  | `'Ładowanie...'`   |
| `progress`  | `number`  | `0`                |
| `status`    | `string`  | `'Proszę czekać.'` |

| Function                                                            | Behavior                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `showLoader(message = 'Ładowanie...'): number`                      | Starts a new run, resets progress/status, returns its run ID.                                    |
| `hideLoader(): void`                                                | Hides UI and invalidates existing sequence ownership.                                            |
| `updateLoaderProgress(percentage, status = 'Proszę czekać.'): void` | Clamps finite progress to 0–100; nonfinite becomes zero. Updates status.                         |
| `updateLoaderMessage(message): void`                                | Replaces title.                                                                                  |
| `showLoaderSequence(steps = [], options?): Promise<void>`           | Runs steps in order; options are `message?: string` and `hideOnFinish?: boolean` (default true). |

```ts
import { showLoader, updateLoaderProgress, hideLoader } from 'svelte-common';

async function showProgress() {
	showLoader('Processing');
	try {
		updateLoaderProgress(50, 'Preparing result');
		await Promise.resolve(); // Replace with application work.
		updateLoaderProgress(100, 'Done');
	} finally {
		hideLoader();
	}
}
```

`LoaderStep` is `{ progress: number; status: string | (() => string); callback?: () => void | Promise<void> }`.
Progress/status are applied before each callback; callback failures propagate to the
caller, with finally cleanup for the still-owning run. A status getter is evaluated
when its step begins.

```ts
import { showLoaderSequence } from 'svelte-common';

async function runSteps() {
	await showLoaderSequence(
		[
			{ progress: 25, status: 'Preparing' },
			{
				progress: 75,
				status: () => 'Working',
				callback: async () => {
					await Promise.resolve();
				}
			},
			{ progress: 100, status: 'Done' }
		],
		{ message: 'Processing', hideOnFinish: true }
	);
}
```

Showing a new loader or calling `hideLoader` invalidates an older sequence, so the
older run stops before its next step and cannot hide the newer run. This does not
cancel a callback already running. Direct update functions do not accept a run ID;
arbitrary concurrent application code must coordinate ownership itself. Hiding leaves
the current message/progress/status in memory; the next show resets them.

## ToastStack

[Component](../src/lib/ui/ToastStack.svelte) · [Store](../src/lib/stores/toaststack.svelte.ts)

`<ToastStack />` accepts root attributes/class/style, closeLabel, closeButtonProps,
toastProps and content/icon snippets receiving UIToast. Mount it once. It renders up to five toasts,
newest first, with a polite live region, close controls and upward swipe dismissal
(over 40 pixels). Its bottom position includes `--sc-bottom-bar-height`.

`UIToastType` is `info | success | warning | error | neutral`.
`ToastCloseReason` is `dismissed | timeout | evicted | replaced | cleared`.

| UIToast field   | Type                                                  | Input/default behavior                                                   |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `id`            | `string`                                              | Optional input; generated with `crypto.randomUUID()` when missing/empty. |
| `title`         | `string`                                              | Optional.                                                                |
| `message`       | `string`                                              | Required.                                                                |
| `systemMessage` | `string` or `null`                                    | Optional secondary text.                                                 |
| `type`          | `UIToastType`                                         | Required.                                                                |
| `timestamp`     | `number`                                              | Optional input; defaults to `Date.now()`.                                |
| `autoClose`     | `boolean`                                             | Optional; omitted does not schedule closure.                             |
| `duration`      | `number`                                              | Positive finite milliseconds; otherwise 8000 for error, 5000 for others. |
| `data`          | `unknown`                                             | Optional application metadata, not rendered.                             |
| `icon`          | `string`                                              | Optional text/emoji; replaces the default SVG.                           |
| `onClose`       | `(reason: ToastCloseReason) => void \| Promise<void>` | Optional lifecycle callback.                                             |

Title/message/systemMessage are sanitized inline Markdown. `icon` is plain text.
`showToast(input)` accepts UIToast with optional ID/timestamp and returns the ID.

```ts
import { showToast, dismissToast } from 'svelte-common';

const id = showToast({
	type: 'info',
	message: 'Upload started.',
	autoClose: false,
	onClose: (reason) => {
		console.log(reason);
	}
});

// Replaces the previous instance and restarts both timers:
showToast({ id, type: 'success', message: 'Upload complete.', autoClose: true, duration: 4000 });
```

| Function                                                                                               | Behavior                                                              |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `showSuccessToast(message, title = 'Sukces', autoClose = true, duration = 4000, systemMessage = null)` | Returns toast ID.                                                     |
| `showErrorToast(message, title = 'Error!', autoClose = true, duration = 8000, systemMessage = null)`   | Returns toast ID. Exact title `Error!` is converted to `Błąd!`.       |
| `dismissToast(id, reason = 'dismissed'): void`                                                         | Removes it and cancels its timer; absent IDs do nothing.              |
| `clearToasts(): void`                                                                                  | Removes every toast and timer with reason `cleared`.                  |
| `getVisibleToasts(): UIToast[]`                                                                        | Reactive view; treat returned objects/array as read-only.             |
| `getToastGeneration(toast): number \| undefined`                                                       | Renderer identity for timer remounts; not a persisted/application ID. |

The sixth toast evicts the oldest; same-ID replacement closes the old instance with
`replaced`. Each removed instance receives one callback, including eviction/clear.
Callbacks run after state/timers are committed and may create toasts safely. Synchronous
throws and rejected promises are logged without breaking the store. No-argument void
callbacks remain valid. Non-auto-closing toasts still count toward the five-toast limit.
Timers belong to the store and do not stop merely because ToastStack is unmounted;
use `clearToasts()` when application lifecycle requires cancellation.

## LoaderView and ToastStackView

[LoaderView source](../src/lib/ui/LoaderView.svelte) ·
[ToastStackView source](../src/lib/ui/ToastStackView.svelte)

LoaderView accepts open=false, message='Ładowanie...', progress=0,
status='Proszę czekać.', dialogProps and root overlay attributes. It clamps progress
and isolates focus/scroll without mutating loaderState. ManagedLoader is a descriptive
alias for the existing Loader store adapter.

ToastStackView accepts items=[] (readonly UIToast array), onDismiss(id, reason),
getGeneration (defaults to item identity), closeLabel='Zamknij', closeButtonProps,
toastProps, content/icon snippets and root stack attributes. It never removes supplied
items, enforces no queue limit, owns no actual dismissal timer, and never calls onClose.
The controller must implement those policies. Immutable item replacement or a generation
getter restarts its visual timer. ManagedToastStack aliases the existing store adapter.

See [independent feedback contracts](api-migration.md#independent-feedback-renderers).
