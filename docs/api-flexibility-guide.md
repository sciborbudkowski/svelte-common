# API flexibility and consistent component contracts

[Documentation index](README.md) · [Current components](components.md) ·
[Current modals and feedback](overlays-and-feedback.md)

**Status: original design proposal and implementation guide.** The migration is now
implemented in the working tree; see [API migration](api-migration.md) for the actual
exports, compatibility behavior and implementation choices. Standalone examples
below remain design examples and are not literal package exports. `CollapsibleTabBar`
is unchanged. Current reference pages and the migration guide describe supported APIs.

## 1. Identify what needs consistency

Consistency means that the same concept follows the same rules. It does not require
every component to expose an `open` prop or identical snippet names.

| Current example                                                                           | Flexibility limitation                                               | Proposed direction                                                                            |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Avatar forwards typed div attributes; most components do not.                             | Class, style, data attributes and native handlers are unpredictable. | Typed root attributes on every DOM-root component, with a documented destination.             |
| Accordion accepts `cssClass`; other components use `class` or neither.                    | Styling differs by component.                                        | `class` for the root; named part props for other elements.                                    |
| Modal accepts `open`, but store state also supplies visibility/context.                   | Ownership depends on which API the caller used.                      | Explicit open/defaultOpen/change contract; store integration in a wrapper.                    |
| CollapsibleCard only accepts `defaultOpen`.                                               | Parent cannot synchronize open state or reject a toggle.             | Add open/onOpenChange alongside initial default.                                              |
| AccordionItem has initialization inputs and a local callback, while Accordion owns state. | Item callbacks do not describe every parent policy change.           | Parent value/defaultValue/onValueChange; items derive state.                                  |
| Carousel owns its index.                                                                  | External navigation/synchronization cannot select a slide.           | index/defaultIndex/onIndexChange with navigation and autoplay using the same path.            |
| FloatingButton persists position inside the component.                                    | Application cannot own drag coordinates independently of storage.    | Explicit coordinate state; persistence only for uncontrolled usage or an external controller. |
| Loader/ToastStack always read singleton stores.                                           | Separate widget instances and externally managed data are awkward.   | Pure renderers plus existing-style managed wrappers.                                          |

Document the contracts before changing implementations. Name a default prop as an
initial value and a state prop as the current value; do not silently reinterpret
existing defaults as controlled props.

## 2. Standardize props, attributes and callbacks

Use these rules for new APIs:

| Concept                   | Convention                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root styling              | `class`, `style`; preserve base classes, append consumer style after generated variables.                                                                                    |
| Root identity             | `id` is the DOM ID. Generate an SSR-stable default when identity need not be caller-provided. Use another name for a controller/storage key.                                 |
| Native attributes         | Extend the exact native element type from `svelte/elements`; forward `aria-*`, `data-*` and native handlers to the documented root.                                          |
| Native callbacks          | Lowercase DOM spelling: `onclick`, `onkeydown`, `onpointerdown`.                                                                                                             |
| Semantic callbacks        | `onOpenChange`, `onValueChange`, `onIndexChange`, `onConfirm`, `onDismiss`.                                                                                                  |
| Initial interactive state | `defaultOpen`, `defaultValue`, `defaultIndex`; consumed once at initialization.                                                                                              |
| Current interactive state | `open`, `value`, `index`; controlled when provided.                                                                                                                          |
| Disabled interaction      | `disabled`; prevents relevant user transitions, rather than being only visual.                                                                                               |
| Async action gating       | `busy`; distinct from disabled and from state ownership.                                                                                                                     |
| Main content              | `children: Snippet` where there is one main content region; named snippets for genuinely different regions.                                                                  |
| Internal parts            | Explicit typed `triggerProps`, `panelProps`, `backdropProps`, `imageProps`, etc. Define ownership of IDs/roles/state attributes.                                             |
| Labels                    | Prefer native `aria-label` on the root; labelled internal controls need a named label/part prop. Retain existing label aliases during migration.                             |
| Units                     | Express new numeric time/dimension names clearly, e.g. durationMs/autoplayIntervalMs; existing duration/timeout names need compatibility aliases rather than abrupt renames. |

Do not add an untyped `[key: string]: any` just to silence prop errors. Native
attribute types already describe supported attributes. Exclude a conflicting native
field when the component owns it, and retain the other fields.

For multi-root/overlay components, root attributes must have a single clear destination.
For Modal, choose the dialog surface for class/style/id/aria attributes and expose
backdropProps separately. For Carousel, choose its region, not the progress-bar sibling.
For CircularTimer, choose its outer wrapper, not the SVG. For AccordionItem, choose
its section; triggerProps target its button.

When extending a button/link component, use a discriminated type or separate wrappers
for their native attributes. Do not accept every anchor attribute on a button. For
FloatingButton, preserve its existing href behavior during migration, then tighten
button/anchor typing without weakening disabled/navigation guarantees.

Svelte documents native wrapper typing through `svelte/elements` in its
[TypeScript guide](https://svelte.dev/docs/svelte/typescript#Typing-wrapper-components).
Class arrays/objects are supported from Svelte 5.19, which is within the current
5.25 minimum; see the [class documentation](https://svelte.dev/docs/svelte/class).
Use the native class type, without relying on newer separately exported type names.

### Attribute spread and handler composition

Extract component-specific props before spreading rest attributes so open/defaultOpen/
callbacks never leak into the DOM. Spread rest before component-owned attributes,
and explicitly merge class/style. Internal role, aria-expanded, aria-controls, inert
and state attributes must not be accidentally overwritten by a spread.

For an interactive internal part:

1. Check disabled/busy.
2. Call its consumer native handler once.
3. If the event is defaultPrevented, stop the optional state action.
4. Request the semantic state change.

Use preventDefault for cancellation; stopPropagation alone concerns propagation.
Never allow cancellation of a transition to disable an accessibility invariant such
as the active overlay's background isolation. Define separate cancellation hooks for
Escape/backdrop requests when needed. An onclick on the outer wrapper follows normal
DOM bubbling; it is not equivalent to a triggerProps.onclick interception hook.

## 3. Adopt one state-control contract

I recommend explicit props plus change callbacks as the primary contract. This
supports application ownership, rejected transitions and non-Svelte state adapters
without requiring component-level two-way binding.

| Usage                                | Owner             | Component behavior                                                   |
| ------------------------------------ | ----------------- | -------------------------------------------------------------------- |
| State prop omitted                   | Component         | Initialize from default once, update its local value on interaction. |
| State prop provided                  | Parent/controller | Render that value; request changes through the callback.             |
| Parent changes a controlled prop     | Parent/controller | Update rendered state without re-emitting a change callback.         |
| Parent ignores/rejects request       | Parent/controller | Rendered state stays at the supplied value.                          |
| Default changes after initialization | Original owner    | Do not reset current state.                                          |

For booleans, use `open !== undefined`, not `if (open)`, to detect control. False is
a controlled closed state. Zero is a controlled index, and an empty array is a
controlled selection. Null can be a valid value in APIs that declare it; undefined
is the uncontrolled sentinel.

Keep ownership fixed during a mounted lifetime. To change controlled/uncontrolled
mode or reapply a default, remount deliberately with a key. The proposed helper
below rejects an ownership-mode switch instead of silently choosing a new owner.

### Change callback semantics

Use `onXChange(next, details)` for a component-originated change proposal. In
uncontrolled usage, commit local state before calling it. In controlled usage,
request the next value and let the owner accept/transform/reject it. The callback
therefore does not guarantee a controlled prop changed.

Do not emit for initial defaults, repeated requests equal to the current value,
parent prop changes, or effect-based synchronization. A rejected proposal can be
requested again by a later interaction. Collection values use semantic equality
where appropriate and fresh arrays/objects instead of mutating parent values.

Details should contain a component-specific reason and an optional original DOM
event. For example:

```ts
type OpenChangeDetails = {
	reason: 'trigger' | 'escape' | 'backdrop' | 'confirm' | 'cancel';
	event?: Event;
};
```

Do not put every component's reasons into one unrestricted string type. A Carousel
callback needs previous/next/pagination/autoplay reasons; a card needs trigger.
State callbacks may return void/promises, with failures isolated. They are not awaited
to decide local commits. Action callbacks such as onConfirm are a separate contract:
await them, show busy state, and request closure only after successful completion.

### Why not add `$bindable()` everywhere?

Bindable APIs are valid Svelte APIs, and Bits UI documents both ordinary and function
bindings. They are another deliberate state contract, not a shortcut for the strict
controlled-prop contract described here. A bindable assignment may temporarily
override an unbound prop; adding `$bindable()` by itself does not implement parent
accept/reject semantics. See [Svelte $props](https://svelte.dev/docs/svelte/$props#Updating-props),
[Svelte $bindable](https://svelte.dev/docs/svelte/$bindable), and
[Bits UI state management](https://bits-ui.com/docs/state-management).

For this migration, keep explicit callbacks consistent across the interactive
components. Do not make one open prop bindable and another callback-only. If you
later choose binding as the primary API, adopt it for each eligible state prop and
document function-binding control, callback timing and defaults together. Native
input binding and optional DOM-reference binding are separate from component state.

## 4. A reusable implementation pattern

The following is a **proposed internal helper**, not a current export. Store it in
a `.svelte.ts` file because it uses runes. Props/callbacks are read through getters
so later parent updates are observed. Default values and ownership are captured
with untrack at initialization. Objects/arrays returned through the helper are
treated as immutable; callers copy default collections when creating the helper.

```ts
// createControllableState.svelte.ts (proposed)
import { untrack } from 'svelte';

type Options<T, Details> = {
	value: () => T | undefined;
	defaultValue: () => T;
	onChange?: (next: T, details: Details) => void | Promise<void>;
	equals?: (a: T, b: T) => boolean;
};

export function createControllableState<T, Details>(options: Options<T, Details>) {
	const controlled = untrack(() => options.value() !== undefined);
	let internal = $state.raw<T>(untrack(options.defaultValue));
	const equals = options.equals ?? Object.is;

	function read(): T {
		const supplied = options.value();
		if ((supplied !== undefined) !== controlled) {
			throw new Error('State ownership cannot change without remounting.');
		}
		return controlled ? (supplied as T) : internal;
	}

	const current = $derived(read());

	return {
		get value() {
			return current;
		},
		request(next: T, details: Details): void {
			if (equals(read(), next)) return;
			if (!controlled) internal = next;
			try {
				void Promise.resolve(options.onChange?.(next, details)).catch((error) => {
					console.error('State change callback failed:', error);
				});
			} catch (error) {
				console.error('State change callback failed:', error);
			}
		}
	};
}
```

Normalize/reject invalid values in the component before requesting a change. The
helper cannot know valid slide ranges, single-selection policy or viewport bounds.
Its current-value getter preserves reactivity; do not copy `state.value` into a
non-reactive variable and expect it to keep updating.

### Complete proposed collapsible example

This small example demonstrates ownership, native props, class/style merging,
part props, event interception and stable ARIA relationships. It is not a replacement
for the full existing CollapsibleCard markup/transitions.

```svelte
<!-- ProposedCollapsible.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { createControllableState } from './createControllableState.svelte.ts';

	type Details = { reason: 'trigger'; event?: Event };
	type TriggerProps = Omit<
		HTMLButtonAttributes,
		'children' | 'id' | 'type' | 'aria-expanded' | 'aria-controls'
	>;
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		open?: boolean;
		defaultOpen?: boolean;
		onOpenChange?: (next: boolean, details: Details) => void | Promise<void>;
		disabled?: boolean;
		triggerLabel?: string;
		triggerProps?: TriggerProps;
		children?: Snippet;
	};

	const uid = $props.id();
	let {
		id = uid,
		open,
		defaultOpen = false,
		onOpenChange,
		disabled = false,
		triggerLabel = 'Details',
		triggerProps = {},
		children,
		class: className,
		style,
		...rest
	}: Props = $props();

	const state = createControllableState<boolean, Details>({
		value: () => open,
		defaultValue: () => defaultOpen,
		onChange: (next, details) => onOpenChange?.(next, details)
	});

	function handleTrigger(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (disabled || triggerProps.disabled) return;
		triggerProps.onclick?.(event);
		if (event.defaultPrevented) return;
		state.request(!state.value, { reason: 'trigger', event });
	}
</script>

<div
	{...rest}
	{id}
	class={['sc-collapsible', className]}
	{style}
	data-state={state.value ? 'open' : 'closed'}
>
	<button
		{...triggerProps}
		id={`${id}-trigger`}
		type="button"
		class={['sc-collapsible-trigger', triggerProps.class]}
		disabled={disabled || triggerProps.disabled}
		aria-expanded={state.value}
		aria-controls={`${id}-panel`}
		onclick={handleTrigger}
	>
		{triggerLabel}
	</button>
	{#if state.value}
		<div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`}>
			{@render children?.()}
		</div>
	{/if}
</div>
```

This example accepts root style unchanged. For components that generate variables,
write the generated declaration string first and append `style ?? ''` after it.
Keep the root/part class arrays to preserve internal classes. Button type/IDs/ARIA
links are reserved; the caller can add labels/classes/styles/handlers and disable
the trigger further, but cannot make it a form submit button or break panel targeting.

### Uncontrolled consumer (proposed API)

```svelte
<script lang="ts">
	import ProposedCollapsible from './ProposedCollapsible.svelte';
</script>

<ProposedCollapsible
	defaultOpen
	class="account-card"
	data-testid="account-card"
	onOpenChange={(next, details) => {
		console.log(next, details.reason);
	}}
>
	<p>The component owns whether these details are open.</p>
</ProposedCollapsible>
```

### Controlled consumer with rejection (proposed API)

```svelte
<script lang="ts">
	import ProposedCollapsible from './ProposedCollapsible.svelte';
	let expanded = $state(true);
	let locked = $state(false);
</script>

<label><input type="checkbox" bind:checked={locked} /> Reject toggle requests</label>
<button
	type="button"
	onclick={() => {
		expanded = !expanded;
	}}>Change from parent</button
>

<ProposedCollapsible
	open={expanded}
	onOpenChange={(next) => {
		if (!locked) expanded = next;
	}}
>
	<p>The parent decides whether a requested change is accepted.</p>
</ProposedCollapsible>
```

When locked, a trigger click cannot temporarily hide the panel. The parent button
still changes its own state directly, without causing another change callback.

## 5. Apply the contract by component

### CollapsibleCard

Add open/onOpenChange while retaining defaultOpen as initial-only. Route every toggle
branch through one request function. Preserve existing visibleContent/hiddenContent
snippets during the compatibility period; do not require a content rename to gain
state control. Add typed root attributes and trigger/panel/header/footer part props.
Keep clickable visible content's noninteractive-snippet restriction.

### Accordion and AccordionItem

Use a root-level controlled collection:

```ts
type AccordionStateProps = {
	value?: readonly string[];
	defaultValue?: readonly string[];
	onValueChange?: (
		next: string[],
		details: { reason: 'trigger'; itemId: string; event?: Event }
	) => void;
	multiple?: boolean;
};
```

Using arrays in both single/multiple mode avoids a runtime-dependent value type.
Single mode permits at most one ID. Normalize default arrays by removing duplicates
and retaining the first ID when single mode applies. A controlled parent must supply
a valid selection; diagnose invalid input rather than mutating it behind the owner.
Decide how invalid mode changes are handled and document the policy.

AccordionItem derives open state from context and requests a new root collection;
it does not own an independent open flag. Opening B while A is open requests `['B']`
once, so the root callback describes both effects. Remove item-level initialization
requests in the target API. Deprecate them gradually and make parent defaults take
precedence in the adapter. Document stable/unique item IDs and the context boundary.

Migration mapping: parent defaultOpen string/string[] maps to defaultValue array;
item isOpen/defaultOpen migrates to the root default collection; cssClass maps to
class. Keep old aliases with canonical new props winning when both are supplied.

### Modal and confirmation wrappers

In the target API, the core Modal renders explicit open/defaultOpen and requests
onOpenChange(false, reason) for Escape/backdrop/cancel/successful confirmation.
Remove direct singleton-store reads from the eventual core. Introduce a ManagedModal
adapter with a separate modalId/controller key that reads the current store and
accepts requests by calling its store functions. AlertModal and ConfirmModal are
convenience wrappers/controllers around the same core.

To avoid silently breaking old Modal id/openModal calls, keep the current adapter
behavior during a compatibility period or introduce the pure core under a new name
first. Move the final name changes to a documented major release.

Only the active overlay processes requests. busy/action ownership must continue to
block dismissal, isolate callback errors and protect replacements. Do not clear
state/focus/scroll ownership until the actual controlled prop becomes closed.
Do not map a requested close directly to onCancel in every case: confirmation,
Escape/cancel and programmatic updates have different action semantics. Preserve
requestConfirmation settlement and failed-confirm retry behavior in the adapter.

Preserve per-opening identity for asynchronous actions. A boolean open value cannot
tell an old confirmation from a newly replaced logical request that is also open.
Carry an opening/request key through the controller and compare it after awaiting
an action, or deliberately remount the pure core when replacing a logical request.
Old work must not request closure or clear busy state for the new request. Keep
programmatic closure distinct from cancellation callbacks and request settlement.

### Carousel

Add index/defaultIndex/onIndexChange. Previous, next, pagination and autoplay
propose changes through the same path. Parent prop updates change the displayed
slide without emitting another index callback. Validate integer ranges against
slides and make animation follow accepted state changes, including parent updates.
Do not start a transition merely because an unaccepted controlled proposal occurred.

For optional user-pause control, use paused/defaultPaused/onPausedChange, keeping
hover/focus/reduced-motion restrictions as separate effective rotation conditions.
Externally clearing user-pause must not bypass required motion/focus safeguards.
External index control does not remove the current constant-slides restriction;
supporting dynamic slide arrays requires a separate animation/DOM lifecycle change.

### FloatingButton

Keep position as the existing corner preference. Do not repurpose it as coordinates.
Add dragPosition/defaultDragPosition/onDragPositionChange for `{ left, top } | null`.
Specify whether the committed callback fires at drag end; use a distinct onDragMove
if consumers need continuous previews. Validate coordinates before committing.

For controlled coordinates, do not load localStorage into the displayed value or
silently persist it. The application/controller owns persistence. For uncontrolled
usage, let an optional persistence setting load/save the owned value, preserving
the current ID-based key/TTL in its compatibility adapter. Changing storage identity
must cancel stale reads. Make explicit defaults vs saved positions precedence clear.

### Loader and ToastStack

Pure Loader accepts open/message/progress/status and root/part attributes. It has
no user dismissal action, so it does not need a fake defaultOpen/onOpenChange API
just to look like Modal. A managed wrapper reads loaderState and preserves sequence
ownership. Keep progress normalization/accessibility in the shared renderer.

Pure ToastStack accepts readonly items and emits onDismiss(id, reason) requests;
the controller owns removal, timers, queue limits and lifecycle callbacks. Retain a
managed wrapper that uses the current toast store. Avoid independent renderer/store
timers causing double completion. Same-ID replacement generations still restart
visual timers. The renderer should not mutate supplied items or invoke onClose
before the owning controller actually removes the instance.

Choose new core/wrapper names without silently changing existing bare Loader/
ToastStack behavior. The simplest first step is internal extraction with current
exports retained as wrappers; expose pure variants when their contracts are stable.

### Avatar, Spinner, CircularTimer, scrolling and SizeView

These do not all need new controlled state APIs. Avatar/Spinner are presentational;
forward native root props and optional part props. CircularTimer is a duration-driven
effect: specify same-duration restart explicitly, such as a runKey/resetKey proposal,
rather than adding an unrelated open state. Keep timeout ownership/cancellation.
ScrollHint/ScrollIndicator/SizeView derive state from measurements; expose native
attributes and styling without introducing writable duplicates of measured state.
CircularTimer also needs carefully defined labelled vs decorative ARIA precedence
when native aria-label is accepted.

`CollapsibleTabBar` remains excluded until its own design is ready.

## 6. Composition, types, themes and labels

Allow snippets for genuinely variable regions: trigger content, icons, modal header/
body/footer, avatar fallback, etc. Keep sensible defaults so customization is
optional. Type snippet parameters, e.g. a trigger receives read-only open/disabled
state. Do not render a consumer's interactive snippet inside a button; document the
noninteractive contract or provide a separate composition mechanism.

Expose stable data-state/data-disabled attributes for styling accepted state. Name
parts consistently and document which element each part prop targets. Preserve
critical ARIA and focus relationships when spreading consumer attributes. A generic
asChild/polymorphic API is a separate advanced feature; it is not required for the
first flexibility migration.

For public types, consumers can already use ComponentProps<typeof Component>. Add
named root-exported prop/state/reason types where they improve reuse, rather than
forcing imports from internal .svelte files. Keep shared callback helpers small;
do not define one giant props interface that all components must inherit.

Expose labels for currently fixed text while retaining Polish defaults. Root
aria-label names the root; closeLabel/confirmLabel/navigation labels name internal
actions. A typed label object/provider can come later, with clear precedence:
explicit component override, provider value, existing default.

Keep class/style overrides and CSS tokens predictable. Global reset opt-out can
be addressed through a separate tokens/component-style entry and optional reset,
while preserving existing styles.css behavior. Do not claim unstyled support until
component-scoped styling/tokens and accessibility have been checked without the reset.

Do not casually rename existing size values. Avatar's xl and CircularTimer's xl
already represent different scales; a shared vocabulary need not mean shared pixels.
If standardizing xs/sm/md/lg/xl, use a major migration with an explicit old-to-new
mapping. Ambiguous overlapping names such as xl cannot be supported as both old
and new meanings by a simple alias.

## 7. Roll out without breaking existing applications

1. Write the contract and component migration map, marking proposals clearly.
2. Validate the helper with boolean, numeric and collection state. Keep it internal.
3. Pilot CollapsibleCard: it has simple local state and multiple toggle paths.
4. Add typed root/part props and compatibility class aliases across components.
5. Move Accordion ownership to a parent selection contract; migrate item defaults.
6. Extract a pure dialog core behind the existing modal adapters; preserve overlay
   and request/action lifecycle regression tests before exposing new APIs.
7. Add accepted-state Carousel index control and controlled drag-coordinate support.
8. Extract loader/toast presenters from controllers while retaining existing exports.
9. Add types/labels/state attributes and update API references/consumer examples.
10. Deprecate old names with a clear replacement and removal version. Release breaking
    ownership/meaning changes only in a major version after migrating applications.

Additive aliases are suitable for a compatible release only if their precedence
and meaning are deterministic. For class aliases, use new class when defined,
otherwise legacy cssClass; an explicitly empty class is still defined. Do not
silently combine two contradictory state sources. Do not change AccordionItem's
legacy isOpen initialization alias into a new controlled boolean during migration.

## 8. Acceptance checks

Use focused behavioral tests, with the same expectations for every interactive
component. These are requirements, not proof that the proposed APIs already work.

| Case                                 | Expected result                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Initial default true/zero/collection | Correct initial rendering; no change callback.                               |
| Default updated after mount          | Owned state unchanged.                                                       |
| Uncontrolled interaction             | Local state commits; callback called once with next value/reason.            |
| Controlled interaction accepted      | Parent receives request and accepted prop change drives rendering.           |
| Controlled interaction rejected      | No transient state/animation/focus/scroll change.                            |
| Parent prop changed                  | Rendering updates; no callback echo.                                         |
| Controlled false/zero/empty array    | Remains controlled.                                                          |
| Mode changed after mount             | Documented diagnostic/remount policy; no silent ownership transfer.          |
| Invalid input                        | Documented normalization/rejection; no hidden mutation of caller state.      |
| Disabled/busy                        | Relevant requests blocked; parent updates still follow documented rules.     |
| Native handler                       | Called once; preventDefault cancels the documented action only.              |
| Root class/style/aria/data           | Forwarded to correct element; base styles and invariants retained.           |
| Part props                           | Correct element; generated IDs/relationships and state attributes protected. |
| Callback throw/rejection             | Error isolated/reported with documented state timing.                        |
| Async replacement/unmount            | Old work cannot close/update a new owner; resources released.                |
| SSR/hydration                        | Stable IDs and initial accepted state; no browser mutations during SSR.      |

Test modal focus/inert/scroll changes, Carousel accepted-state animation, native
keyboard behavior and drag interaction in real browsers in addition to unit tests.
Retain prior regression tests and run lint, type checking, tests and real-tarball
build validation after implementation.

### Validation of the guide examples

The six TypeScript/Svelte examples were extracted into temporary fixtures and
compiled/type-checked with the installed toolchain: zero errors and warnings.
Eight temporary jsdom checks passed for initialization/default changes, controlled
acceptance/rejection and parent updates, native cancellation, disabled interaction,
attribute/ARIA forwarding and async callback failure isolation. Those checks exercise
the standalone proposed example, not unimplemented changes to library components.
They do not establish real-browser or minimum-Svelte-version compatibility.

## Suggested reading

- [Svelte $props: updates and ownership](https://svelte.dev/docs/svelte/$props#Updating-props)
- [Svelte native wrapper types](https://svelte.dev/docs/svelte/typescript#Typing-wrapper-components)
- [Svelte class composition](https://svelte.dev/docs/svelte/class)
- [Svelte snippets](https://svelte.dev/docs/svelte/snippet)
- [Svelte $bindable](https://svelte.dev/docs/svelte/$bindable)
- [Bits UI state management](https://bits-ui.com/docs/state-management)
- [Bits UI styling](https://bits-ui.com/docs/styling)
