# Styling

[Documentation index](README.md) · [CSS token reference](css-reference.md)

Use [stylesheet choices](api-migration.md#stylesheet-choices) for full styling,
full styling without reset, tokens only or an optional reset. Component-scoped styles
still apply in every case.

## Entry point and layers

Import `svelte-common/styles.css` once, usually in the root layout. It declares the
ordered layers `reset, base, components, utilities` and imports:

| Layer      | Files / role                                                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reset      | [reset.css](../src/lib/styles/reset.css): box sizing, margins, native elements, focus and reduced-motion defaults.                                                                                                                                                                           |
| base       | [palette.css](../src/lib/styles/palette.css), [props.css](../src/lib/styles/props.css), [appglobals.css](../src/lib/styles/appglobals.css), [tokens.css](../src/lib/styles/tokens.css), [theme.css](../src/lib/styles/theme.css): scales, global tokens, color themes and component aliases. |
| components | buttons, switch, radio, slider, elements and form styles.                                                                                                                                                                                                                                    |
| utilities  | [utils.css](../src/lib/styles/utils.css) and [grids.css](../src/lib/styles/grids.css).                                                                                                                                                                                                       |

This is a global stylesheet, not isolated styling for library components. It changes
body/headings, buttons, native form controls and media defaults. Component Svelte
styles are separately scoped. Many utility declarations use `!important`; they
intentionally override normal declarations, and important layer precedence differs
from normal layer precedence. Inspect the relevant declaration when overriding one.

## Application overrides

Set fonts, brand colors, layout heights and semantic tokens in your application CSS:

```css
:root {
	--sc-font-body: system-ui, sans-serif;
	--sc-font-header: system-ui, sans-serif;
	--sc-color-brand: oklch(55% 0.16 250);
	--sc-color-on-brand: white;
	--sc-top-bar-height: 3rem;
	--sc-bottom-bar-height: 0px;
	--sc-border-radius: 0.5rem;
}

:root[data-theme='dark'] {
	--sc-color-brand: oklch(75% 0.12 250);
	--sc-color-on-brand: black;
}
```

Normal unlayered application declarations override normal layered defaults. Dark
tokens are defined on `:root[data-theme='dark']`, so customize both selectors where
the library supplies a dark override. Components generally read tokens through
inheritance; put a scoped override on an ancestor for a local variant. Props that
write inline values (for example FloatingButton color/background) take precedence
over the corresponding token fallback.

`--sc-top-bar-height` and `--sc-bottom-bar-height` must be CSS lengths (`0px`, not
unitless zero) because components use them in length calculations. The library does
not measure your application bars. Modal sizing/positioning, FloatingButton corners
and ToastStack placement use these values.

## Token families

The [complete token reference](css-reference.md) lists current declarations and their
defaults, including repeated dark-theme declarations. A declared token is not a
promise that every component uses it; follow its source links when customizing.

| Family                                                       | Purpose                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `--clr-*-a*`                                                 | Palette ramps.                                                   |
| `--size-*`                                                   | Spacing/dimension scale; 1–5 are 0.25, 0.5, 1, 1.25 and 1.5 rem. |
| `--font-size-*`, `--font-ls-*`                               | Type size and letter spacing.                                    |
| `--radius-*`, `--border-*`                                   | Radius and border-width scales.                                  |
| `--zi-*`, `--zi-modal-base`                                  | Stacking levels.                                                 |
| `--sc-font-*`, `--sc-border-*`, `--sc-transition-*`          | Application-level fonts, borders and transitions.                |
| `--sc-color-*`, `--sc-color-on-*`                            | Semantic colors and paired foregrounds.                          |
| `--sc-shadow-1` through `--sc-shadow-5`                      | Shadows derived from shadow color.                               |
| `--sc-modal-*`, `--sc-loader-*`, `--sc-toast-*`              | Overlay/feedback styling.                                        |
| `--sc-button-*`, `--sc-floating-button-*`                    | Buttons and floating controls.                                   |
| `--sc-carousel-*`, `--sc-circular-timer-*`                   | Media/countdown styling.                                         |
| `--sc-accordion-*`, `--sc-collapsible-card-*`, `--sc-card-*` | Panels/cards.                                                    |
| `--sc-form-*`, `--sc-switch-*`, `--sc-slider-*`              | Native form styling.                                             |

ScrollIndicator also supports `--sc-scroll-indicator-track`,
`--sc-scroll-indicator-thumb` and `--sc-scroll-indicator-z-index` with in-component
fallbacks. They are not declared by the global stylesheet. Avatar's shadow suffix
is a prop; choose one of the shipped 1–5 levels or define an additional token.

## Buttons

### Bundled icons

FloatingButton and AccordionItem accept these bundled names: `close`, `plus`,
`minus`, `chevron-up`, `chevron-down`, `arrow-right`, `info`, `error`, `success`,
and `warning`. Unknown names are treated as external icon-font class strings;
provide the matching stylesheet yourself. Icons are decorative SVGs; name their
containing action through its label props. The internal Icon component is not a
public export. ToastStack's custom `icon` field is text/emoji instead.

### Button classes

[Source](../src/lib/styles/buttons.css)

All native buttons receive base styling. Compose semantic and appearance classes:

```html
<button type="button" class="brand">Save</button>
<button type="button" class="outline danger">Delete</button>
<button type="button" class="link neutral no-decoration">More</button>
<div class="btn-group">
	<button type="button" class="neutral">Previous</button>
	<button type="button" class="brand">Next</button>
</div>
```

| Classes                                                    | Behavior                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `brand`, `danger`, `warning`, `success`, `info`, `neutral` | Semantic button colors.                                   |
| `outline`                                                  | Transparent resting background with accent border/text.   |
| `link`                                                     | Unbordered, transparent, underlined control.              |
| `no-decoration`                                            | Removes underline.                                        |
| `xxs`, `xs`, `xl`, `xxl`                                   | 70%, 85%, 115%, 130% font sizes; reduced padding.         |
| `btn-group`                                                | Inline group with shared edges and rounded outer corners. |

Use native `disabled` for application buttons. Hover/focus/disabled styles are built
in. These classes target buttons; they do not turn a div into an accessible control
or automatically style an anchor as a button. `.btn` is not a global button API.

## Forms

[Form](../src/lib/styles/form.css) · [Switch](../src/lib/styles/switch.css) ·
[Radio](../src/lib/styles/radio.css) · [Range](../src/lib/styles/slider.css)

Inputs/selects/textareas receive global font, background, border and focus styling.
`form .field` arranges a label/control vertically. Switch and radio helpers depend
on native input markup; keep actual inputs and associated labels.

```html
<form>
	<div class="field">
		<label for="name">Name</label>
		<input id="name" name="name" type="text" />
	</div>
	<label class="switch">
		<input type="checkbox" name="notifications" />
		<span>Notifications</span>
	</label>
	<label class="radio">
		<input type="radio" name="delivery" value="standard" />
		<span class="radio-mark" aria-hidden="true"></span>
		<span>Standard delivery</span>
	</label>
	<label for="volume">Volume</label>
	<input id="volume" type="range" min="0" max="100" value="50" />
</form>
```

For radios, `radio-mark` must immediately follow the input because checked/focus
selectors use the adjacent sibling. Radio styling does not provide a separate
disabled appearance. Range styling applies to `input[type='range']` without a
class and includes WebKit-specific thumb/track rules. Native controls still own
interaction/value/validation; these are CSS helpers, not Svelte form components.

## Layout and text utilities

The following are the shipped class families, not arbitrary generated Tailwind-like
names. Use only the named ranges; there is no responsive-variant compiler.

| Classes                                                                                              | Meaning                                                                                                     |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `m-0`, `mt-0`, `mb-0`, `ml-0`, `mr-0`, `p-0`, `mx-auto`                                              | Zero margins/padding or auto inline margins.                                                                |
| `m-1..5`, `mt-1..5`, `mb-1..5`, `ms-1..5`, `me-1..5`, `mx-1..5`, `my-1..5`                           | Spacing tokens. `ms`/`me` currently use physical left/right, while `mx`/`my` use logical inline/block axes. |
| `p-1..5`, `pt-1..5`, `pb-1..5`, `px-1..5`, `py-1..5`, `gap-1..5`                                     | Padding/gap tokens. No `ps`/`pe` family is supplied.                                                        |
| `fw-1..8`                                                                                            | Font weights 100–800.                                                                                       |
| `flex`, `flex-r`, `flex-c`, `flex-0`, `flex-1`                                                       | Flex display, direction and sizing.                                                                         |
| `flex-all-center`, `all-center`                                                                      | Center alignment; `all-center` also sets flex:1, column and display:flex.                                   |
| `a-start`, `a-center`, `a-end`                                                                       | Align items.                                                                                                |
| `j-content-start`, `j-content-end`, `j-content-between`, `j-start`, `j-center`, `j-end`, `j-between` | Justify content.                                                                                            |
| `j-self-start`, `j-self-end`                                                                         | Grid/self justification.                                                                                    |
| `f-wide`, `f-nosqueeze`                                                                              | Flexible min-width-zero item or fixed nowrap item.                                                          |
| `w-100`, `h-100`, `pos-a`, `pos-r`, `cell-fit`                                                       | Full dimension, absolute/relative position, compact table cell.                                             |
| `grid-2x2` through `grid-4x4`                                                                        | Nine explicit grids with 2–4 columns and 2–4 rows; first number is columns.                                 |
| `text-start`, `text-end`, `text-center`, `text-justify`                                              | Alignment; start/end currently map to physical left/right.                                                  |
| `uc`, `cap`, `b`, `i`, `u`, `ub`, `ws-nowrap`                                                        | Case, weight 800, italic, underline, bottom border, nowrap.                                                 |
| `fs-xxs`, `fs-xs`, `fs-normal`, `fs-xl`, `fs-xxl`                                                    | 70%, 85%, 100%, 115%, 130% type sizes.                                                                      |
| `bg-brand/danger/warning/success/info/neutral`                                                       | Semantic background plus paired foreground.                                                                 |
| `clr-brand/danger/warning/success/info/neutral`                                                      | Semantic foreground and transparent background.                                                             |
| `text-muted`, `text-danger`, `text-warning`, `text-info`, `text-success`                             | Text colors.                                                                                                |
| `badge`                                                                                              | Compact inline-flex pill; combine with semantic background.                                                 |
| `br-1..5`, `br-round`, `rounded`, `with-radius`                                                      | Radius scale, huge radius, circle/aspect ratio, application border radius.                                  |
| `indent`, `no-indent`                                                                                | Text-indent helpers.                                                                                        |
| `sc-section`                                                                                         | Flexible column with margins/min-height zero.                                                               |
| `native-scrollbar-remove`                                                                            | Keeps vertical overflow but hides the native scrollbar only for hover/fine-pointer devices.                 |

## Motion and browser support

The global reset shortens CSS animation/transition durations under reduced motion.
Spinner, ScrollHint, ScrollIndicator and switch CSS have additional motion behavior;
Carousel handles its GSAP motion preference separately. There is no universal
JavaScript animation-disabling API.

Styles use modern features including OKLCH/relative colors, layers, `:has`,
`interpolate-size`, `field-sizing` and native select appearance. Support/fallbacks
vary by feature. No cross-browser support matrix or polyfills are declared; validate
your chosen browser targets, color contrast, zoom/layout and native form appearance.
