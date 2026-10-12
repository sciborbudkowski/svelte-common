# API migration

[Documentation index](README.md) · [Design guide](api-flexibility-guide.md)

This migration is implemented in the current working tree. Existing store-backed
exports and legacy aliases are retained. No version bump, publication or application
deployment is implied. `CollapsibleTabBar.svelte` remains unchanged.

## Shared state contract

Interactive state uses explicit current/default/change props. Supplying a current
prop selects parent ownership; omitting it selects local ownership. False, zero and
empty arrays are controlled values. Defaults are initialization-only. Ownership
cannot switch during a mounted lifetime: remount with a key when changing modes.

Change callbacks receive the proposed value and reason/event details. Local state
commits before notification. Controlled state remains unchanged until its owner
accepts the proposal. Parent updates do not echo callbacks. Notifications accept void
or promises and isolate failures. Action callbacks such as confirmation are awaited
separately; async actions retain opening identity and replacement protection.

| Component                                      | Current state                      | Initial default             | Change callback                                            |
| ---------------------------------------------- | ---------------------------------- | --------------------------- | ---------------------------------------------------------- |
| CollapsibleCard                                | open                               | defaultOpen                 | onOpenChange(next, { reason: 'trigger', event })           |
| Dialog                                         | open                               | defaultOpen                 | onOpenChange(next, { reason, event? })                     |
| Accordion                                      | value: readonly string[]           | defaultValue                | onValueChange(next, { reason: 'trigger', itemId, event? }) |
| Carousel                                       | index; paused                      | defaultIndex; defaultPaused | onIndexChange; onPausedChange                              |
| FloatingButton / FloatingAction / FloatingLink | dragPosition: DragPosition or null | defaultDragPosition         | onDragPositionChange(next, { reason: 'drag', event })      |

Accordion normalizes duplicate IDs and displays at most one selected ID in single
mode. It never mutates a controlled input array. Changing multiple to false normalizes
local selection silently; a controlled owner should also update its supplied value.
Carousel displays finite indices floored/clamped to the slide range (nonfinite to
zero) without modifying a controlled prop. Supply valid controlled values when you
need exact agreement between parent state and displayed state.

## Controlled card example

```svelte
<script lang="ts">
	import { CollapsibleCard } from 'svelte-common';
	let expanded = $state(false);
	let locked = $state(false);
</script>

<label><input type="checkbox" bind:checked={locked} /> Reject toggle requests</label>
<CollapsibleCard
	id="details"
	open={expanded}
	onOpenChange={(next) => {
		if (!locked) expanded = next;
	}}
	class="account-card"
	triggerProps={{ class: 'custom-trigger' }}
>
	{#snippet visibleContent()}<p>Account summary</p>{/snippet}
	{#snippet hiddenContent()}<p>Additional details</p>{/snippet}
	{#snippet trigger(state)}{state.open ? 'Hide details' : 'Show details'}{/snippet}
</CollapsibleCard>
```

Omit open and use defaultOpen for a locally owned card. Root class/style/native
attributes are forwarded; headerProps/footerProps, triggerProps and panelProps target
their named elements. Trigger snippets receive read-only open/disabled information
and must contain no interactive descendants because they render inside buttons.

CollapsibleCard id now identifies the **root**. Its panel defaults to `${id}-panel`.
Use the new panelId prop to retain a specific old panel target, giving the root a
distinct ID. Generated aria-controls follows panelId. Existing snippets and size/
label defaults remain supported.

## Accordion migration

- Prefer class over deprecated cssClass. A defined class takes precedence, including
  an empty value; base classes are always retained.
- Prefer defaultValue arrays over deprecated parent defaultOpen string/array.
- Move item isOpen/defaultOpen initialization into the parent selection for new code.
  Legacy item defaults still work when no modern value/defaultValue is supplied.
- Prefer the root onValueChange callback for the complete selection. The legacy item
  callback reports that trigger's proposal, including a rejected controlled request.
- Items still require the parent context and unique local IDs. triggerProps/panelProps
  customize internal elements; a trigger snippet can replace the default contents.

```svelte
<script lang="ts">
	import { Accordion, AccordionItem } from 'svelte-common';
	let selected = $state<string[]>(['delivery']);
</script>

<Accordion
	value={selected}
	onValueChange={(next) => {
		selected = next;
	}}
>
	<AccordionItem id="delivery" title="Delivery">Delivery information</AccordionItem>
	<AccordionItem id="returns" title="Returns">Return information</AccordionItem>
</Accordion>
```

## Dialog and managed modal APIs

Dialog is the pure visibility/action component; it does not read the custom-modal
visibility/context store. It shares the existing overlay stack/scroll manager for
focus isolation and coordination. Use defaultOpen for local ownership or open plus
onOpenChange for controlled ownership.

```svelte
<script lang="ts">
	import { Dialog } from 'svelte-common';
	let visible = $state(false);
	let requestKey = $state(0);

	function show() {
		requestKey += 1;
		visible = true;
	}
</script>

<button type="button" onclick={show}>Open</button>
<Dialog
	open={visible}
	openingKey={requestKey}
	onOpenChange={(next) => {
		visible = next;
	}}
	aria-label="Review changes"
	closeLabel="Close"
	confirmButtonLabel="Confirm"
	cancelButtonLabel="Cancel"
>
	<p>Review the proposed changes.</p>
</Dialog>
```

Use openingKey when replacing a logical request while remaining open. Closing and
reopening or changing that key invalidates old actions. Confirm/cancel callbacks,
pending-state dismissal restrictions, focus restoration and rejected-close isolation
remain covered by regression tests. Custom footer actions remain application-owned.

Dialog root props target its surface. backdropProps, headerProps, bodyProps,
footerProps, closeButtonProps, confirmButtonProps and cancelButtonProps customize
parts while preserving required IDs/roles/ARIA relationships. closeIcon can replace
the decorative SVG. Native aria-label/aria-labelledby take precedence over legacy
ariaLabel/ariaLabelledby aliases. content or children supplies body content.

| Export                    | Ownership / compatibility                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog                    | New pure component; explicit current/default/change contract. ID optional and generated when absent.                                                                                                                                  |
| ManagedModal              | New store adapter; modalId is the store key and id is a separate optional DOM identity.                                                                                                                                               |
| Modal                     | Existing compatibility adapter; id remains the custom-store key and is also the DOM ID. Without open/defaultOpen it reads the existing store. Supplied open is controlled; supplied defaultOpen without open selects local ownership. |
| ConfirmModal / AlertModal | Existing singleton renderers now use Dialog. Native attributes and applicable part props are forwarded.                                                                                                                               |

```svelte
<script lang="ts">
	import { ManagedModal, openModal } from 'svelte-common';
</script>

<button type="button" onclick={() => openModal('editor')}>Edit</button>
<ManagedModal modalId="editor" id="editor-dialog" aria-label="Editor">
	<p>Store-managed content</p>
</ManagedModal>
```

Existing openModal/requestConfirmation workflows continue to work with their existing
renderers. Modal/ManagedModal preserve context-based size/fullHeight overrides.
ConfirmModal accepts title and action labels; AlertModal accepts titles keyed by
info/success/warning/error and okLabel. Polish defaults remain. No global label
provider or asChild API is introduced in this migration.

## Carousel and floating controls

Carousel exposes index/defaultIndex/onIndexChange and paused/defaultPaused/
onPausedChange. Index reasons are previous/next/pagination/autoplay; pause reason is
rotation-control. Animations follow accepted index changes, including parent updates.
User-pause is separate from hover/focus/reduced-motion safeguards. The slides array
must still remain constant after mount.

autoplayIntervalMs takes precedence over legacy timeout. labels is a partial
CarouselLabels object for role descriptions, navigation, previous/next, pause/resume,
slide labels and pagination labels. previousButtonProps/nextButtonProps/
paginationButtonProps/rotationButtonProps customize controls. slideContent receives
the Slide and zero-based index inside the existing animation/content wrapper.

FloatingButton remains the combined compatibility component. The new FloatingAction
and FloatingLink wrappers supply exact button/anchor attribute and handler types.
All require a stable id. FloatingLink requires href; an empty href now renders an
anchor instead of falling into the button branch. FloatingAction does not accept href.

Controlled dragPosition disables internal persistence and displays accepted coordinates
only. onDragMove provides continuous proposals for owners that want live updates;
onDragPositionChange proposes the final coordinates at drag end. Uncontrolled dragging
keeps its normal preview. defaultDragPosition is initial-only and takes precedence over
stored positions. persistPosition defaults true for legacy/local usage; storageKey
overrides the existing ID-derived key. Viewport constraints apply to pointer-generated
positions; controlled owners must supply valid finite coordinates.

## Independent feedback renderers

| Export                         | Behavior                                                                                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LoaderView                     | Props: open=false, message, progress, status, dialogProps and native root attributes. Clamps progress and owns overlay focus/scroll isolation while visible. Does not mutate loaderState.                       |
| Loader / ManagedLoader         | Existing store adapter and descriptive alias. Forwards view styling/part props; state still comes from loaderState.                                                                                             |
| ToastStackView                 | Props: readonly items, onDismiss(id, reason), getGeneration, closeLabel, closeButtonProps, toastProps, content/icon snippets and root attributes. Does not remove supplied items or invoke lifecycle callbacks. |
| ToastStack / ManagedToastStack | Existing store adapter and descriptive alias. Queue limits, actual dismissal timers and onClose remain owned by the toast store.                                                                                |

ToastStackView displays visual countdowns only. Its owner must schedule actual timeouts
and call onClose after an actual removal if needed. getGeneration defaults to item
identity; replace items immutably or supply a revision getter to restart countdowns.
Managed ToastStack uses the existing generation getter and store timers, so no extra
renderer timeout competes with the controller. Pure stacks can display more than five
items; the five-toast policy belongs to the existing store.

LoaderView root props target the overlay; dialogProps target its labelled dialog.
ToastStackView root props target its stack; toastProps target each status item.

## Native props, composition and public types

Avatar merges class arrays/objects and supports imageProps/fallback snippets. Spinner
and CircularTimer accept native aria-label with legacy ariaLabel fallback. Scrolling
components and SizeView forward root attributes/classes/styles without adding writable
copies of measurement state. CircularTimer adds durationMs (preferred over duration)
and resetKey for restarting the same normalized duration; cancellation rules are retained.

Public root exports include each finished component's FooProps type, Slide, UISize,
CarouselLabels, TriggerState, ChangeDetails/ChangeHandler, OpenChangeDetails,
AccordionChangeDetails, CarouselIndexChangeDetails, CarouselPauseChangeDetails,
DragPosition/DragPositionChangeDetails and ButtonPartProps/PanelPartProps. Internal
state/focus helpers remain private. Legacy size names/pixel scales remain unchanged.

## Stylesheet choices

| Import                                 | Contents                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| svelte-common/styles.css               | Existing full styling/reset; unchanged default choice.                                                 |
| svelte-common/styles-without-reset.css | Full base/component/utilities styling without the global reset. Still includes global element styling. |
| svelte-common/tokens.css               | Palette, spacing/layout/theme tokens only; no native element/reset rules.                              |
| svelte-common/reset.css                | Optional reset, composable with tokens.css.                                                            |

This is not an unstyled component mode: Svelte component styles still apply. The
application token declarations moved from appglobals.css to styles/tokens.css;
appglobals imports them, preserving the full entry point's behavior.

## Verification

Validated against the implemented migration:

- `npm test`: 160 tests passed across 15 files, including 21 new client contract
  tests and expanded SSR coverage.
- `npm run check`: zero errors and warnings.
- `npm run lint`: formatting and ESLint passed.
- `npm run build`: production build and real packed-archive validation passed.
- All 48 current TypeScript/Svelte documentation examples type-checked; all 224
  local documentation links resolved. The original design-guide prototypes are
  excluded from the current API example count.
- `git diff --check` passed. CollapsibleTabBar.svelte remained byte-for-byte unchanged.

New contract tests exercise the actual exported components, rather than only the
standalone design-guide prototype. SSR smoke coverage includes the new renderers
and floating wrappers. Native browser layout, pointer capture, mobile saving and
screen-reader behavior still need validation on the application's target devices.
