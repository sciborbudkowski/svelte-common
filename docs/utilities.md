# Utilities

[Documentation index](README.md) · [Source exports](../src/lib/index.ts)

All functions below are root exports. Types used only inside a utility, such as
`DateTimeInput` or `Reader<T>`, are described here but are not named root exports.

## Dates

[Source](../src/lib/utils/date.ts)

Inputs accept `string | number | Date | null | undefined`. Numeric values are epoch
milliseconds; zero is valid. Null, undefined, empty strings and invalid dates return
the function's empty result. Formatting uses the host's local time zone and Polish
locale. For predictable output, pass ISO strings with an explicit zone or Date objects.

| Function                                                                    | Result / defaults                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatDate(input, conditionDaysOld = 7, addSuffix = true): string \| null` | Relative Polish distance for recent/future dates; Polish year/short-month/day/hour/minute when at least the threshold days old. Invalid/missing returns null. |
| `toYMDHMDate(input): string`                                                | Polish year/long-month/day/hour/minute. Despite its name, not an ISO YYYY-MM-DD string. Invalid/missing returns empty string.                                 |
| `toHMSTime(input): string`                                                  | Local hour/minute/second using pl-PL.                                                                                                                         |
| `getDistanceToNow(input): string`                                           | Polish relative distance with suffix.                                                                                                                         |
| `formatDateDifference(a, b): string`                                        | Absolute whole-minute difference as Polish hours/minutes; zero returns `0 minut`.                                                                             |
| `getTimeDifference(a, b): string`                                           | Absolute whole-second duration `HH:MM:SS`; hours may exceed two digits/24.                                                                                    |

```ts
import { formatDate, getTimeDifference } from 'svelte-common';

const epoch = formatDate(0);
const elapsed = getTimeDifference(0, 90000); // '00:01:30'
```

Relative results depend on current time and do not auto-refresh; call again when the
application needs updated text. `conditionDaysOld` counts elapsed 24-hour periods
with floor, not calendar-midnight boundaries. These helpers do not expose a locale
or time-zone option.

## Text and file size

[Source](../src/lib/utils/text.ts)

| Function                                                | Contract                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `textToHtml(text: string \| null \| undefined): string` | Parses inline Markdown with marked (`breaks: true`) and sanitizes with isomorphic DOMPurify; missing/falsy text returns empty string. |
| `friendlyFileSize(bytes: number): string`               | Divides by 1024 through B/KB/MB/GB/TB; one decimal place.                                                                             |

```svelte
<script lang="ts">
	import { textToHtml, friendlyFileSize } from 'svelte-common';
	let { message }: { message: string } = $props();
	const html = $derived(textToHtml(message));
</script>

{@html html}<p>Size: {friendlyFileSize(1536)}</p>
```

File size output for 1536 is `1.5 KB`, using binary scaling despite the labels.
Supply finite nonnegative values; this helper does not validate them. `textToHtml`
is an inline parser, not a full document renderer (headings/tables/block layout are
not its contract). Sanitization does not validate destinations or business meaning;
keep other user-provided styles/URLs out of raw HTML composition.

## Tokens and hashes

[Source](../src/lib/utils/token.ts)

| Function                                      | Result                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `generateToken(bytes = 24): Promise<string>`  | Cryptographically random bytes encoded as URL-safe base64 without padding; default is 32 characters. |
| `generateSha(token: string): Promise<string>` | SHA-256 of UTF-8 input as lowercase 64-character hexadecimal text.                                   |

```ts
import { generateToken, generateSha } from 'svelte-common';

async function makeIdentifier() {
	const token = await generateToken();
	return { token, digest: await generateSha(token) };
}
```

Requires `crypto.getRandomValues`, `crypto.subtle`, TextEncoder and `btoa`. Use a
valid positive integer byte count within the platform's allocation/random limits;
arbitrary sizes are not normalized. Rejections propagate. A plain SHA-256 digest
is not a password-storage scheme or authenticated signature.

## File classification

[Source](../src/lib/utils/files.ts)

`isImageFile(file: File): boolean` and `isVideoFile(file: File): boolean` check a MIME
allowlist **or** a case-insensitive filename extension. They do not inspect bytes.

| Kind  | MIME types                                                | Extensions                             |
| ----- | --------------------------------------------------------- | -------------------------------------- |
| Image | image/jpeg, image/png, image/heic, image/heif, image/avif | .jpg, .jpeg, .png, .heic, .heif, .avif |
| Video | video/mp4, video/quicktime, video/webm                    | .mp4, .mov, .webm                      |

GIF, SVG and WebP are not in the current image lists. These are UI classification
helpers, not server upload validation; MIME/filename values can be inaccurate.

## Polish language helper

[Source](../src/lib/utils/lang.ts)

`Gender` is `'k' | 'm' | 'f'`. `PolishDictionary` is
`Record<string, Record<Gender, string>>`; supply all three forms for each word.
`createPolish(words)` returns `{ gendered(key, gender, withCapitalization = true) }`.
It looks up exactly the supplied key/code, falls back to the key if missing, and
optionally capitalizes its first character. The helper does not infer grammatical
forms or determine gender itself.

```ts
import { createPolish } from 'svelte-common';

const polish = createPolish({ saved: { k: 'zapisana', m: 'zapisany', f: 'zapisane' } });
const label = polish.gendered('saved', 'k'); // 'Zapisana'
```

## CSS color readers

[Source](../src/lib/utils/styles.ts)

| Function                                                             | Contract                                                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `cssVarRgb(root: CSSStyleDeclaration, name: string): string \| null` | Returns trimmed property text or null; it does not convert color formats despite the name.                             |
| `rgba(rgbTriplet: string, alpha: number): string`                    | Replaces whitespace with commas and formats `rgba(...)`; expects a whitespace-separated numeric RGB triplet.           |
| `readThemeColors<T>(reader): T`                                      | Reads computed root styles once and maps each object key through `(css: CSSStyleDeclaration) => T[key]`. Browser-only. |

```ts
import { cssVarRgb, readThemeColors, rgba } from 'svelte-common';

function readBrandColor() {
	return readThemeColors<{ brand: string | null }>({
		brand: (css) => cssVarRgb(css, '--sc-color-brand')
	});
}

const translucent = rgba('12 34 56', 0.5); // 'rgba(12,34,56,0.5)'
```

Shipped theme colors include OKLCH/other CSS color expressions, not necessarily RGB
triplets. Do not feed arbitrary `cssVarRgb` output to `rgba`. These readers are snapshots;
rerun after `themeState.resolved` changes when the consuming chart/widget needs it.

## Scrolling

[Source](../src/lib/utils/scroll.ts)

`scrollToTarget(target: string | HTMLElement): void` scrolls smoothly. `'top'` and
the special legacy string `'#stop'` scroll the window to zero. Other strings are
passed to `document.querySelector`; found elements use `scrollIntoView` with
`block: 'start'`. Missing targets do nothing, and server calls do nothing.

```svelte
<script lang="ts">
	import { scrollToTarget } from 'svelte-common';
</script>

<button type="button" onclick={() => scrollToTarget('#details')}>Details</button>
<section id="details"><h2>Details</h2></section>
```

Supply a valid CSS selector; invalid selector syntax can throw. This helper does
not navigate routes, move keyboard focus, offset fixed headers or expose a motion
preference option. Use CSS `scroll-margin-top` on destinations where needed.

## Application identity

[Source](../src/lib/utils/app-id.ts)

`setupAppIdentity(idKey: string): string | null` reads an existing localStorage value
or creates/stores a `crypto.randomUUID()`. It returns null during SSR or when storage/
generation fails. Existing nonempty values are returned without UUID validation.

```ts
import { setupAppIdentity } from 'svelte-common';

function getBrowserIdentity() {
	return setupAppIdentity('example-installation-id');
}
```

Choose an application-specific key to avoid collisions. This identity is shared by
tabs on the same origin/storage and persists until storage is cleared; it is not
an authentication credential, guaranteed device identifier or TTL-managed entry.
