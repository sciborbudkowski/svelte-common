# Components

[Documentation index](README.md) · [Modals and feedback](overlays-and-feedback.md)

Import all components from `svelte-common`. The tables list supported props;
finished components forward typed native root attributes, including class/style,
aria/data attributes and native handlers. The root destination is described below.
Snippets have no arguments unless stated otherwise. Shared design tokens are in [styling](styling.md).

## Accordion and AccordionItem

[Accordion source](../src/lib/ui/Accordion/Accordion.svelte) ·
[Item source](../src/lib/ui/Accordion/AccordionItem.svelte)

Accordion owns local selection or renders a parent-controlled value array. AccordionItem must be rendered inside an Accordion
and have an ID unique within that accordion. Separate accordions can reuse local IDs;
their DOM IDs include a generated instance namespace.

| Accordion prop | Type                   | Default | Meaning                                        |
| -------------- | ---------------------- | ------- | ---------------------------------------------- |
| `children`     | `Snippet`              | omitted | Items/content.                                 |
| `multiple`     | `boolean`              | `false` | Allow multiple open panels.                    |
| `defaultOpen`  | `string` or `string[]` | `[]`    | Initial item IDs. Single mode takes the first. |
| `cssClass`     | `string`               | `''`    | Extra class on the accordion wrapper.          |

| Additional Accordion prop               | Type                                              | Default / meaning                                          |
| --------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `value`                                 | `readonly string[]`                               | Omitted: local ownership; supplied: controlled selection.  |
| `defaultValue`                          | `readonly string[]`                               | Initial-only; takes precedence over legacy defaultOpen.    |
| `onValueChange`                         | `ChangeHandler<string[], AccordionChangeDetails>` | Full selection proposal with trigger/item/event details.   |
| `disabled`                              | `boolean`                                         | false; prevents item triggers.                             |
| `class`, `style`, native div attributes | native types                                      | Forwarded root props; class wins over deprecated cssClass. |

| AccordionItem prop | Type                      | Default  | Meaning                                             |
| ------------------ | ------------------------- | -------- | --------------------------------------------------- |
| `id`               | `string`                  | required | Stable local item ID.                               |
| `title`            | `string`                  | required | Trigger label.                                      |
| `subTitle`         | `string`                  | `''`     | Secondary trigger text.                             |
| `icon`             | `string`                  | omitted  | Bundled icon name or application icon-font classes. |
| `children`         | `Snippet`                 | omitted  | Panel content.                                      |
| `isOpen`           | `boolean`                 | `false`  | Legacy initialization alias.                        |
| `defaultOpen`      | `boolean`                 | `isOpen` | Initial request to open this item.                  |
| `onOpenChange`     | `(open: boolean) => void` | omitted  | Called after this item's trigger is activated.      |

Items also accept disabled, triggerProps (`ButtonPartProps`), panelProps
(`PanelPartProps`), a trigger snippet receiving `TriggerState`, and native section
attributes/class/style. Legacy onOpenChange accepts void/promises and reports the
trigger's proposed boolean; prefer root onValueChange for complete selection changes.

```svelte
<script lang="ts">
	import { Accordion, AccordionItem } from 'svelte-common';
</script>

<Accordion defaultOpen="delivery">
	<AccordionItem id="delivery" title="Delivery">
		<p>Delivery takes three business days.</p>
	</AccordionItem>
	<AccordionItem id="returns" title="Returns">
		<p>Contact us before returning an order.</p>
	</AccordionItem>
</Accordion>
```

Defaults do not reset state when changed. The modern value prop is controlled;
modern value/defaultValue take precedence over legacy item defaults.
In single mode, a parent's selected default takes precedence over item requests;
otherwise the first requesting item wins. Changing `multiple` from true to false keeps
one open item. A trigger can close its initially open panel. `onOpenChange` does not
report every sibling change caused by the parent's single-open policy. Triggers/panels
have `aria-expanded`, `aria-controls` and labelled regions.

## Avatar

[Source](../src/lib/ui/Avatar.svelte)

| Prop                 | Type                                         | Default      | Meaning                                                       |
| -------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------- |
| `initials`           | `string` or `null`                           | `null`       | Text; falls back to `??`.                                     |
| `imageUrl`           | `string` or `null`                           | `null`       | Image source/background.                                      |
| `type`               | `'initials'`, `'image'`, `'mixed'`           | `'initials'` | Rendering mode. Mixed overlays initials on a CSS background.  |
| `size`               | `'xxs'`, `'xs'`, `'normal'`, `'xl'`, `'xxl'` | `'normal'`   | Diameter: 1, 2, 3, 4 or 5 rem respectively.                   |
| `withShadow`         | `string`                                     | `'1'`        | Suffix for `--sc-shadow-*`; supported shipped levels are 1–5. |
| `initialsColor`      | `string`                                     | `'#ffffff'`  | Text color.                                                   |
| `backgroundColor`    | `string`                                     | `'#a5a320'`  | Background color.                                             |
| `alt`                | `string`                                     | `''`         | Image alternative in image mode.                              |
| `class`              | div class attribute                          | `''`         | Merged with avatar/size classes.                              |
| `style`              | `string`                                     | `''`         | Appended after generated inline variables.                    |
| Other div attributes | `HTMLAttributes<HTMLDivElement>`             | omitted      | Forwarded to the outer div.                                   |

`imageProps` forwards native image attributes except owned src/alt, retaining the
image class. `fallback: Snippet` replaces missing initials. Outer class supports
native class arrays/objects as well as strings. No automatic image-error fallback is added.

```svelte
<script lang="ts">
	import { Avatar } from 'svelte-common';
</script>

<Avatar initials="AB" aria-label="Alex Brown" />
<Avatar type="image" imageUrl="/alex.jpg" alt="Alex Brown" size="xl" />
```

An empty `alt` treats an image as decorative. `alt` is not used for the mixed CSS
background; name its outer wrapper if needed. Image mode with no URL renders no image.
There is no automatic image-error fallback or initials extraction from a full name.

## Carousel

[Source](../src/lib/ui/Carousel.svelte)

| Prop        | Type                  | Default      | Meaning                                                            |
| ----------- | --------------------- | ------------ | ------------------------------------------------------------------ |
| `slides`    | `Slide[]` shape below | required     | Keep this array constant after mount. Use unique slide/button IDs. |
| `timeout`   | `number`              | `5000`       | Rotation delay; nonpositive/nonfinite values use 5000.             |
| `autoplay`  | `boolean`             | `true`       | Enable automatic rotation and its pause control.                   |
| `ariaLabel` | `string`              | `'Karuzela'` | Region name.                                                       |

| Additional prop                                                                          | Type                                                 | Default / meaning                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `index`, `defaultIndex`                                                                  | number                                               | Controlled index or initial-only default 0.                                   |
| `onIndexChange`                                                                          | `ChangeHandler<number, CarouselIndexChangeDetails>`  | Proposes previous/next/pagination/autoplay changes.                           |
| `paused`, `defaultPaused`                                                                | boolean                                              | Controlled user pause or initial-only default false.                          |
| `onPausedChange`                                                                         | `ChangeHandler<boolean, CarouselPauseChangeDetails>` | User rotation-control proposal.                                               |
| `disabled`                                                                               | boolean                                              | false; blocks navigation and rotation. Parent index updates remain supported. |
| `autoplayIntervalMs`                                                                     | number                                               | Preferred delay alias; wins over timeout.                                     |
| `labels`                                                                                 | `Partial<CarouselLabels>`                            | Role descriptions and all navigation/rotation text; Polish defaults.          |
| `previousButtonProps`, `nextButtonProps`, `paginationButtonProps`, `rotationButtonProps` | ButtonPartProps                                      | Native control attributes/classes/styles and interceptors.                    |
| `slideContent`                                                                           | `Snippet<[Slide, number]>`                           | Optional content renderer; receives slide and zero-based index.               |
| Native div attributes/class/style                                                        | native types                                         | Forwarded to the carousel region, not its progress sibling.                   |

Indices are floored/clamped to the slide range, with nonfinite values displayed as
zero, without rewriting controlled props. Animations follow accepted changes only.
User-pause is separate from focus/hover/reduced-motion guards. See [migration](api-migration.md).

```ts
type Slide = {
	id: string;
	image: string;
	filter?: string;
	header: string;
	title: string;
	descriptionHtml: string;
	backgroundPosition?: 'left' | 'right' | 'center';
	buttons: {
		id: string;
		title: string;
		class: string;
		target: string;
		customStyle?: string;
	}[];
};
```

```svelte
<script lang="ts">
	import { Carousel } from 'svelte-common';
	import type { ComponentProps } from 'svelte';

	const slides: ComponentProps<typeof Carousel>['slides'] = [
		{
			id: 'intro',
			image: '/cover.jpg',
			header: 'Welcome',
			title: 'Our work',
			descriptionHtml: 'Explore **our projects**.',
			buttons: [{ id: 'projects', title: 'See projects', class: 'brand', target: '#projects' }]
		}
	];
</script>

<Carousel {slides} autoplay={false} ariaLabel="Featured projects" />
<section id="projects"><h2>Projects</h2></section>
```

Despite its name, `descriptionHtml` goes through `textToHtml`: inline Markdown is
parsed and sanitized HTML is rendered. Buttons scroll to DOM selectors using
`scrollToTarget`; their targets are not router destinations.

Zero slides render nothing. One slide has no slide-navigation controls. The active
slide is visible during SSR and delayed/failed GSAP initialization. Rotation pauses
while hovered, after focus enters slide/navigation content, and when the user pauses.
Hover pause ends on pointer exit; focus pause requires the resume control. Reduced
motion disables autoplay/slide transitions, while manual navigation stays available.
Inactive slides are inert and hidden from accessibility. Carousel control labels and
role descriptions are Polish; `ariaLabel` customizes the region name only.

## CircularTimer

[Source](../src/lib/ui/CircularTimer.svelte)

| Prop               | Type                                   | Default | Meaning                                                 |
| ------------------ | -------------------------------------- | ------- | ------------------------------------------------------- |
| `duration`         | `number`                               | `5000`  | Countdown milliseconds.                                 |
| `size`             | `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'` | `'sm'`  | Diameter: 20, 30, 50, 100 or 200 pixels.                |
| `onTimeout`        | `() => void` or `() => Promise<void>`  | omitted | Completion callback; errors are logged.                 |
| `withNumericTimer` | `boolean`                              | `false` | Show remaining seconds to one decimal place.            |
| `ariaLabel`        | `string`                               | omitted | Expose a labelled timer rather than decorative content. |

`durationMs` takes precedence over legacy duration. `resetKey: unknown` restarts the
same normalized duration when its identity changes. Native root attributes/class/style
are forwarded to the wrapper; native aria-label takes precedence over ariaLabel.

```svelte
<script lang="ts">
	import { CircularTimer } from 'svelte-common';
	let finished = $state(false);
</script>

<CircularTimer
	duration={10000}
	size="md"
	withNumericTimer
	ariaLabel="Time remaining"
	onTimeout={() => {
		finished = true;
	}}
/>
{#if finished}<p>Time is up.</p>{/if}
```

Changing normalized duration restarts the timer; to restart the same duration, change resetKey or remount
with a Svelte `{#key}` block. Nonpositive/nonfinite durations complete on the next
microtask. Each run invokes the callback once unless cancelled by unmount/replacement.
The component is decorative by default. Labelled timers have `aria-live="off"` so
frame updates do not create continuous announcements. Timing is based on elapsed
performance time and animation frames, not a guaranteed background alarm.

## CollapsibleCard

[Source](../src/lib/ui/CollapsibleCard.svelte)

| Prop                        | Type                  | Default          | Meaning                                                               |
| --------------------------- | --------------------- | ---------------- | --------------------------------------------------------------------- |
| `id`                        | `string`              | generated        | Root DOM ID; panel defaults to id-panel. Explicit IDs must be unique. |
| `visibleContent`            | `Snippet`             | required         | Always-visible body content.                                          |
| `hiddenContent`             | `Snippet`             | required         | Expanded body content.                                                |
| `defaultOpen`               | `boolean`             | `false`          | Initial expanded state.                                               |
| `header`, `footer`          | `Snippet` or `null`   | `null`           | Optional card header/footer.                                          |
| `padding`                   | `string` or `null`    | `'1rem'`         | Body padding variable; null omits its inline override.                |
| `chevronPosition`           | `'left'` or `'right'` | `'right'`        | Toggle placement.                                                     |
| `isVisibleContentClickable` | `boolean`             | `false`          | Wrap visible content in a toggle button.                              |
| `showMoreLabel`             | `string`              | `'Pokaż więcej'` | Collapsed toggle label.                                               |
| `showLessLabel`             | `string`              | `'Pokaż mniej'`  | Expanded toggle label.                                                |
| `showMoreLessLabelClass`    | `string` or `null`    | `'link'`         | Toggle styling class.                                                 |
| `class`                     | `string` or `null`    | omitted          | Extra outer card class.                                               |

| Additional prop                        | Type                                               | Default / meaning                                             |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `open`                                 | boolean                                            | Controlled when supplied; otherwise local defaultOpen.        |
| `onOpenChange`                         | `ChangeHandler<boolean, ChangeDetails<'trigger'>>` | Proposes a toggle; parent may reject it.                      |
| `disabled`                             | boolean                                            | false; blocks trigger interaction.                            |
| `panelId`                              | string                                             | Defaults to `${id}-panel`; explicit legacy panel target.      |
| `trigger`                              | `Snippet<[TriggerState]>`                          | Optional chevron/label replacement inside the trigger button. |
| `triggerProps`, `panelProps`           | ButtonPartProps, PanelPartProps                    | Typed internal customization.                                 |
| `headerProps`, `footerProps`           | native div attributes                              | Optional part attributes/classes/styles.                      |
| Root class/style/native div attributes | native types                                       | Forwarded to the card wrapper; base classes retained.         |

```svelte
<script lang="ts">
	import { CollapsibleCard } from 'svelte-common';
</script>

<CollapsibleCard defaultOpen>
	{#snippet header()}<h2>Details</h2>{/snippet}
	{#snippet visibleContent()}<p>Short summary.</p>{/snippet}
	{#snippet hiddenContent()}<p>The full description.</p>{/snippet}
</CollapsibleCard>
```

Omit open for local ownership, or supply open/onOpenChange for controlled ownership.
Changing defaultOpen does not reset it. Open is callback-controlled, not bindable. When visible content is clickable, it must
not contain links, buttons or other interactive elements because it lives in a button.
Keep that prop false for interactive snippets.

## FloatingButton

[Source](../src/lib/ui/FloatingButton.svelte)

| Prop              | Type                                                           | Default                           | Meaning                                                                     |
| ----------------- | -------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `id`              | `string`                                                       | required                          | Stable persisted-position identity.                                         |
| `href`            | `string`                                                       | omitted                           | Render an anchor when supplied, including empty string; otherwise a button. |
| `ariaLabel`       | `string`                                                       | `'Floating Button'`               | Accessible name and tooltip.                                                |
| `icon`            | `string`                                                       | `'plus'`                          | Bundled name or custom font classes.                                        |
| `position`        | `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` | `'bottom-right'`                  | Initial corner.                                                             |
| `disabled`        | `boolean`                                                      | `false`                           | Disable button/link action and drag initiation.                             |
| `hidden`          | `boolean`                                                      | `false`                           | Hide visually with the component's hidden class.                            |
| `backgroundColor` | `string`                                                       | `'var(--sc-color-brand)'`         | Background.                                                                 |
| `color`           | `string`                                                       | `'var(--sc-color-text-inverted)'` | Foreground.                                                                 |
| `opacity`         | `number`                                                       | `1`                               | Opacity variable.                                                           |
| `onclick`         | `(event: MouseEvent) => void`                                  | omitted                           | Activation callback.                                                        |
| `children`        | `Snippet`                                                      | omitted                           | Custom content replacing the icon.                                          |

| Additional prop                       | Type                                                             | Default / meaning                                                          |
| ------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `dragPosition`, `defaultDragPosition` | DragPosition or null                                             | Controlled coordinates or initial-only local coordinates; default null.    |
| `onDragPositionChange`                | `ChangeHandler<DragPosition or null, DragPositionChangeDetails>` | Final drag proposal at pointer release.                                    |
| `onDragMove`                          | `ChangeHandler<DragPosition, DragPositionChangeDetails>`         | Continuous proposals; controlled owners may accept them for live movement. |
| `persistPosition`                     | boolean                                                          | true for local usage; ignored for controlled coordinates.                  |
| `storageKey`                          | string                                                           | Optional override of ID-derived storage identity.                          |
| Native attributes/class/style         | native types                                                     | Forwarded to the actual button/anchor.                                     |

Controlled coordinates never read/write persistence or display a rejected drag.
Explicit defaultDragPosition takes precedence over stored coordinates. New
FloatingAction/FloatingLink wrappers provide exact native button/anchor prop types;
FloatingAction requires id and disallows href, while FloatingLink requires id/href.
The combined FloatingButton remains available for existing callers.

```svelte
<script lang="ts">
	import { FloatingButton, openAlertModal } from 'svelte-common';
</script>

<FloatingButton
	id="help-action"
	ariaLabel="Help"
	icon="info"
	onclick={() => openAlertModal('Contact support.')}
/>
```

Dragging starts after a 4-pixel pointer movement, clamps the button to the viewport,
and saves to `monster-button-position-${id}` for 365 days. Invalid/offscreen saved
positions fall back to the selected corner. Changing `id` reloads its stored position.
Use separate IDs for independently movable buttons. A completed drag suppresses
clicks for 500 ms; an ordinary initial click is not suppressed. Disabled anchors omit
their href, expose `aria-disabled`, and leave the tab order. Native button disabling
is used in the button branch. There is no keyboard drag-position API.

## Spinner

[Source](../src/lib/ui/Spinner.svelte)

| Prop              | Type                                               | Default                                  |
| ----------------- | -------------------------------------------------- | ---------------------------------------- |
| `width`, `height` | `string`                                           | `'2rem'` each                            |
| `border`          | `string`                                           | `'5px solid var(--sc-color-background)'` |
| `spinnerColor`    | `string`                                           | `'var(--sc-color-brand)'`                |
| `animationType`   | `'linear'`, `'ease'`, `'ease-in'`, `'ease-in-out'` | `'linear'`                               |
| `durationMs`      | `number`                                           | `1000`                                   |
| `initialRotation` | `number`                                           | `180` degrees                            |
| `ariaLabel`       | `string`                                           | omitted                                  |

Native root attributes/class/style are forwarded. Native aria-label wins over the
legacy ariaLabel alias. The root is the spinner div, not an external overlay.

```svelte
<script lang="ts">
	import { Spinner } from 'svelte-common';
</script>

<Spinner ariaLabel="Loading results" />
```

Decorative by default (`aria-hidden`); a label enables status semantics. CSS animation
is disabled for reduced motion. Supply valid CSS lengths, borders and a positive
duration. This is a visual component; it does not block interaction like Loader.

## ScrollHint

[Source](../src/lib/ui/ScrollHint.svelte)

Shows a decorative downward hint while content remains below the viewport/target.

| Prop                             | Type                    | Default                               | Meaning                                                      |
| -------------------------------- | ----------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `target`                         | `HTMLElement` or `null` | `null`                                | Null tracks the document/window.                             |
| `threshold`                      | `number`                | `40`                                  | Hide when the remaining distance falls to this many pixels.  |
| `timeout`                        | `number`                | `1000`                                | Initial readiness delay; zero schedules immediate readiness. |
| `bgColor`                        | `string`                | `'oklch(from rgb(0 0 0) l c h / .1)'` | Hint background.                                             |
| `color`                          | `string`                | `'#fff'`                              | Icon color.                                                  |
| `shadow`                         | `string`                | `'none'`                              | Box shadow.                                                  |
| `width`, `height`                | `string`                | `'50px'` each                         | Hint dimensions.                                             |
| `offset`                         | `string`                | `'75px'`                              | Fixed bottom offset.                                         |
| `minVisibility`, `maxVisibility` | `number`                | `0`, `0.5`                            | Bounce animation opacity endpoints.                          |
| `size`                           | `string`                | `'1.25rem'`                           | Icon font size.                                              |
| `fadingTime`                     | `string`                | `'300ms'`                             | CSS transition duration.                                     |
| `bounce`                         | `string`                | `'var(--size-2)'`                     | Vertical bounce distance.                                    |

```svelte
<script lang="ts">
	import { ScrollHint, ScrollIndicator } from 'svelte-common';
	let target = $state<HTMLElement | null>(null);
</script>

<section bind:this={target} style="height: 12rem; overflow-y: auto;">
	<p style="min-height: 30rem;">Scrollable content</p>
</section>
<ScrollHint {target} timeout={0} />
<ScrollIndicator {target} autoHide={false} />
```

Descendant resize, text/child changes, image load, font completion, transitions and
scroll/resize events remeasure through coalesced animation frames. Cleanup cancels
frames and observers. The hint is fixed at horizontal viewport center even for an
element target, is not clickable, and is hidden from accessibility. Reduced motion
disables its bounce animation.

## ScrollIndicator

[Source](../src/lib/ui/ScrollIndicator.svelte)

A decorative vertical thumb following an element's viewport position. It does not
replace native scrolling or provide a draggable scrollbar. It is displayed only
for a fine pointer with hover support, and is hidden from accessibility.

| Prop           | Type                    | Default | Meaning                                             |
| -------------- | ----------------------- | ------- | --------------------------------------------------- |
| `target`       | `HTMLElement` or `null` | `null`  | Scroll element; null renders no indicator.          |
| `width`        | `number`                | `5`     | Track width in pixels.                              |
| `inset`        | `number`                | `4`     | Inset inside target rectangle, pixels.              |
| `minThumbSize` | `number`                | `28`    | Minimum thumb height, pixels.                       |
| `autoHide`     | `boolean`               | `true`  | Hide after inactivity; target scrolling reveals it. |
| `hideDelay`    | `number`                | `2500`  | Delay before hiding.                                |
| `showDuration` | `number`                | `90`    | Fade-in duration.                                   |
| `hideDuration` | `number`                | `600`   | Fade-out duration.                                  |

See the shared target example above. It also tracks ancestor/window movement, target
resize, content mutations, loads and transitions. Pending hide timers, frames and
observers are cleaned up on unmount. Use `.native-scrollbar-remove` on the target
only if your design intentionally hides the native desktop scrollbar; the indicator
itself leaves it intact. Colors/z-index can be customized with
`--sc-scroll-indicator-track`, `--sc-scroll-indicator-thumb`, and
`--sc-scroll-indicator-z-index`.

## SizeView

[Source](../src/lib/debug/SizeView.svelte)

Accepts native div attributes/class/style on its indicator. Development overlay showing `[W: width | H: height]` from window dimensions. It is
absolutely positioned, so its containing block determines placement. Server dimensions
begin at zero. Render it only where you want this debug output.

| Prop                   | Type     | Default         |
| ---------------------- | -------- | --------------- |
| `color`, `borderColor` | `string` | `'#fff'` each   |
| `backgroundColor`      | `string` | `'transparent'` |
| `left`, `bottom`       | `string` | `'10px'` each   |
| `right`, `top`         | `string` | `''` each       |
| `fontSize`             | `string` | `'.75rem'`      |

```svelte
<script lang="ts">
	import { SizeView } from 'svelte-common';
</script>

<SizeView color="black" backgroundColor="white" />
```

## FloatingAction and FloatingLink

[Button source](../src/lib/ui/FloatingAction.svelte) · [Link source](../src/lib/ui/FloatingLink.svelte)

Typed native wrappers around FloatingButton, sharing its state/persistence/drag contracts.
Use FloatingAction for native button/form props and FloatingLink for anchor props.
Both require id; FloatingLink requires href, including an empty href if intentional.
See [the migration reference](api-migration.md#carousel-and-floating-controls).

## Dialog, ManagedModal, LoaderView and ToastStackView

The [modals and feedback reference](overlays-and-feedback.md) covers these renderers.
See [the migration reference](api-migration.md#dialog-and-managed-modal-apis) for state
ownership and [independent feedback](api-migration.md#independent-feedback-renderers)
for view props and controller responsibilities.

## CollapsibleTabBar (unfinished)

[Draft source](../src/lib/ui/CollapsibleTabBar.svelte)

This exported component remains in development and is excluded from the earlier
audit fixes. It renders placeholder states, has no tab data/content/selection API,
and is not a usable tab bar yet. Its existing props are recorded for completeness:

| Prop         | Type                    | Current default                                             |
| ------------ | ----------------------- | ----------------------------------------------------------- |
| `target`     | `HTMLElement` or `null` | `null`                                                      |
| `collapseAt` | `number`                | `40`                                                        |
| `timeout`    | `number`                | `500`                                                       |
| `bgColor`    | `string`                | `'oklch(from rgb(0 0 0) l c h / .8'` (incomplete CSS value) |
| `maxWidth`   | `string`                | `'500px'`                                                   |

Current state transitions and zero/negative delay handling are unfinished, and
queued measurement frames are not retained for cancellation. No stable behavior
or integration example is promised. This documentation does not change the file.
