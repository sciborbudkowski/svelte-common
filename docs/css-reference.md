# CSS token reference

[Documentation index](README.md) · [Styling guide](styling.md)

Snapshot of declarations in src/lib/styles/*.css. Selectors distinguish light/dark
and element-local values. Values are unresolved CSS expressions. Component-private
inline variables are excluded; see the styling guide for in-component fallbacks.

## buttons.css

[Source](../src/lib/styles/buttons.css)

| Token                         | Selector                              | Declared value                             |
| ----------------------------- | ------------------------------------- | ------------------------------------------ |
| `--sc-button-accent`          | `button`                              | `var(--sc-button-neutral-accent)`          |
| `--sc-button-on-accent`       | `button`                              | `var(--sc-button-neutral-on-accent)`       |
| `--sc-button-accent-hover`    | `button`                              | `var(--sc-button-neutral-accent-hover)`    |
| `--sc-button-on-accent-hover` | `button`                              | `var(--sc-button-neutral-on-accent-hover)` |
| `--sc-button-color`           | `button`                              | `var(--sc-button-on-accent)`               |
| `--sc-button-bg`              | `button`                              | `var(--sc-button-accent)`                  |
| `--sc-button-border`          | `button`                              | `var(--sc-button-accent)`                  |
| `--sc-button-accent`          | `button.neutral`                      | `var(--clr-neutral-a4)`                    |
| `--sc-button-on-accent`       | `button.neutral`                      | `var(--clr-neutral-a1)`                    |
| `--sc-button-accent-hover`    | `button.neutral`                      | `var(--clr-neutral-a3)`                    |
| `--sc-button-on-accent-hover` | `button.neutral`                      | `var(--clr-neutral-a6)`                    |
| `--sc-button-accent`          | `button.danger`                       | `var(--sc-button-danger-accent)`           |
| `--sc-button-on-accent`       | `button.danger`                       | `var(--sc-button-danger-on-accent)`        |
| `--sc-button-accent-hover`    | `button.danger`                       | `var(--sc-button-danger-accent-hover)`     |
| `--sc-button-on-accent-hover` | `button.danger`                       | `var(--sc-button-danger-on-accent-hover)`  |
| `--sc-button-accent`          | `button.warning`                      | `var(--sc-button-warning-accent)`          |
| `--sc-button-on-accent`       | `button.warning`                      | `var(--sc-button-warning-on-accent)`       |
| `--sc-button-accent-hover`    | `button.warning`                      | `var(--sc-button-warning-accent-hover)`    |
| `--sc-button-on-accent-hover` | `button.warning`                      | `var(--sc-button-warning-on-accent-hover)` |
| `--sc-button-accent`          | `button.success`                      | `var(--sc-button-success-accent)`          |
| `--sc-button-on-accent`       | `button.success`                      | `var(--sc-button-success-on-accent)`       |
| `--sc-button-accent-hover`    | `button.success`                      | `var(--sc-button-success-accent-hover)`    |
| `--sc-button-on-accent-hover` | `button.success`                      | `var(--sc-button-success-on-accent-hover)` |
| `--sc-button-accent`          | `button.info`                         | `var(--sc-button-info-accent)`             |
| `--sc-button-on-accent`       | `button.info`                         | `var(--sc-button-info-on-accent)`          |
| `--sc-button-accent-hover`    | `button.info`                         | `var(--sc-button-info-accent-hover)`       |
| `--sc-button-on-accent-hover` | `button.info`                         | `var(--sc-button-info-on-accent-hover)`    |
| `--sc-button-accent`          | `button.brand`                        | `var(--sc-button-brand-accent)`            |
| `--sc-button-on-accent`       | `button.brand`                        | `var(--sc-button-brand-on-accent)`         |
| `--sc-button-accent-hover`    | `button.brand`                        | `var(--sc-button-brand-accent-hover)`      |
| `--sc-button-on-accent-hover` | `button.brand`                        | `var(--sc-button-brand-on-accent-hover)`   |
| `--sc-button-color`           | `button:not(:disabled):hover`         | `var(--sc-button-on-accent-hover)`         |
| `--sc-button-bg`              | `button:not(:disabled):hover`         | `var(--sc-button-accent-hover)`            |
| `--sc-button-border`          | `button:not(:disabled):hover`         | `var(--sc-button-accent-hover)`            |
| `--sc-button-color`           | `button.outline`                      | `var(--sc-button-accent)`                  |
| `--sc-button-bg`              | `button.outline`                      | `transparent`                              |
| `--sc-button-border`          | `button.outline`                      | `var(--sc-button-accent)`                  |
| `--sc-button-color`           | `button.outline:not(:disabled):hover` | `var(--sc-button-on-accent-hover)`         |
| `--sc-button-bg`              | `button.outline:not(:disabled):hover` | `var(--sc-button-accent-hover)`            |
| `--sc-button-border`          | `button.outline:not(:disabled):hover` | `var(--sc-button-accent-hover)`            |
| `--sc-button-shadow`          | `button:disabled`                     | `var(--sc-button-disabled-shadow)`         |
| `--sc-button-color`           | `button.link`                         | `var(--sc-button-accent) !important`       |
| `--sc-button-bg`              | `button.link`                         | `transparent !important`                   |
| `--sc-button-border`          | `button.link`                         | `none !important`                          |
| `--sc-button-shadow`          | `button.link`                         | `none !important`                          |
| `--sc-button-color`           | `button.link:not(:disabled):hover`    | `var(--sc-button-accent-hover) !important` |

## palette.css

[Source](../src/lib/styles/palette.css)

| Token                | Selector | Declared value          |
| -------------------- | -------- | ----------------------- |
| `--clr-bg-a0`        | `:root`  | `oklch(98.5% 0.004 95)` |
| `--clr-bg-a1`        | `:root`  | `oklch(97% 0.005 95)`   |
| `--clr-bg-a2`        | `:root`  | `oklch(95.5% 0.006 95)` |
| `--clr-bg-a3`        | `:root`  | `oklch(94% 0.007 95)`   |
| `--clr-bg-a4`        | `:root`  | `oklch(92.5% 0.008 95)` |
| `--clr-bg-a5`        | `:root`  | `oklch(30% 0.008 95)`   |
| `--clr-bg-a6`        | `:root`  | `oklch(27.5% 0.007 95)` |
| `--clr-bg-a7`        | `:root`  | `oklch(25% 0.006 95)`   |
| `--clr-bg-a8`        | `:root`  | `oklch(22.5% 0.005 95)` |
| `--clr-bg-a9`        | `:root`  | `oklch(20% 0.004 95)`   |
| `--clr-neutral-a0`   | `:root`  | `oklch(28% 0.008 95)`   |
| `--clr-neutral-a1`   | `:root`  | `oklch(34% 0.009 95)`   |
| `--clr-neutral-a2`   | `:root`  | `oklch(40% 0.01 95)`    |
| `--clr-neutral-a3`   | `:root`  | `oklch(45% 0.011 95)`   |
| `--clr-neutral-a4`   | `:root`  | `oklch(49% 0.012 95)`   |
| `--clr-neutral-a5`   | `:root`  | `oklch(71% 0.012 95)`   |
| `--clr-neutral-a6`   | `:root`  | `oklch(76% 0.011 95)`   |
| `--clr-neutral-a7`   | `:root`  | `oklch(81% 0.01 95)`    |
| `--clr-neutral-a8`   | `:root`  | `oklch(86% 0.008 95)`   |
| `--clr-neutral-a9`   | `:root`  | `oklch(92% 0.006 95)`   |
| `--clr-red-a0`       | `:root`  | `oklch(28% 0.093 25)`   |
| `--clr-red-a1`       | `:root`  | `oklch(34% 0.113 25)`   |
| `--clr-red-a2`       | `:root`  | `oklch(40% 0.133 25)`   |
| `--clr-red-a3`       | `:root`  | `oklch(45% 0.15 25)`    |
| `--clr-red-a4`       | `:root`  | `oklch(49% 0.163 25)`   |
| `--clr-red-a5`       | `:root`  | `oklch(71% 0.15 25)`    |
| `--clr-red-a6`       | `:root`  | `oklch(76% 0.117 25)`   |
| `--clr-red-a7`       | `:root`  | `oklch(81% 0.088 25)`   |
| `--clr-red-a8`       | `:root`  | `oklch(86% 0.062 25)`   |
| `--clr-red-a9`       | `:root`  | `oklch(92% 0.033 25)`   |
| `--clr-orange-a0`    | `:root`  | `oklch(28% 0.061 50)`   |
| `--clr-orange-a1`    | `:root`  | `oklch(34% 0.074 50)`   |
| `--clr-orange-a2`    | `:root`  | `oklch(40% 0.087 50)`   |
| `--clr-orange-a3`    | `:root`  | `oklch(45% 0.098 50)`   |
| `--clr-orange-a4`    | `:root`  | `oklch(49% 0.106 50)`   |
| `--clr-orange-a5`    | `:root`  | `oklch(71% 0.154 50)`   |
| `--clr-orange-a6`    | `:root`  | `oklch(76% 0.129 50)`   |
| `--clr-orange-a7`    | `:root`  | `oklch(81% 0.098 50)`   |
| `--clr-orange-a8`    | `:root`  | `oklch(86% 0.069 50)`   |
| `--clr-orange-a9`    | `:root`  | `oklch(92% 0.038 50)`   |
| `--clr-amber-a0`     | `:root`  | `oklch(28% 0.05 70)`    |
| `--clr-amber-a1`     | `:root`  | `oklch(34% 0.06 70)`    |
| `--clr-amber-a2`     | `:root`  | `oklch(40% 0.071 70)`   |
| `--clr-amber-a3`     | `:root`  | `oklch(45% 0.08 70)`    |
| `--clr-amber-a4`     | `:root`  | `oklch(49% 0.087 70)`   |
| `--clr-amber-a5`     | `:root`  | `oklch(71% 0.126 70)`   |
| `--clr-amber-a6`     | `:root`  | `oklch(76% 0.135 70)`   |
| `--clr-amber-a7`     | `:root`  | `oklch(81% 0.125 70)`   |
| `--clr-amber-a8`     | `:root`  | `oklch(86% 0.089 70)`   |
| `--clr-amber-a9`     | `:root`  | `oklch(92% 0.049 70)`   |
| `--clr-yellow-a0`    | `:root`  | `oklch(28% 0.047 95)`   |
| `--clr-yellow-a1`    | `:root`  | `oklch(34% 0.057 95)`   |
| `--clr-yellow-a2`    | `:root`  | `oklch(40% 0.067 95)`   |
| `--clr-yellow-a3`    | `:root`  | `oklch(45% 0.076 95)`   |
| `--clr-yellow-a4`    | `:root`  | `oklch(49% 0.083 95)`   |
| `--clr-yellow-a5`    | `:root`  | `oklch(71% 0.12 95)`    |
| `--clr-yellow-a6`    | `:root`  | `oklch(76% 0.128 95)`   |
| `--clr-yellow-a7`    | `:root`  | `oklch(81% 0.136 95)`   |
| `--clr-yellow-a8`    | `:root`  | `oklch(86% 0.14 95)`    |
| `--clr-yellow-a9`    | `:root`  | `oklch(92% 0.104 95)`   |
| `--clr-lime-a0`      | `:root`  | `oklch(28% 0.058 125)`  |
| `--clr-lime-a1`      | `:root`  | `oklch(34% 0.07 125)`   |
| `--clr-lime-a2`      | `:root`  | `oklch(40% 0.082 125)`  |
| `--clr-lime-a3`      | `:root`  | `oklch(45% 0.093 125)`  |
| `--clr-lime-a4`      | `:root`  | `oklch(49% 0.101 125)`  |
| `--clr-lime-a5`      | `:root`  | `oklch(71% 0.146 125)`  |
| `--clr-lime-a6`      | `:root`  | `oklch(76% 0.157 125)`  |
| `--clr-lime-a7`      | `:root`  | `oklch(81% 0.16 125)`   |
| `--clr-lime-a8`      | `:root`  | `oklch(86% 0.16 125)`   |
| `--clr-lime-a9`      | `:root`  | `oklch(92% 0.16 125)`   |
| `--clr-green-a0`     | `:root`  | `oklch(28% 0.072 145)`  |
| `--clr-green-a1`     | `:root`  | `oklch(34% 0.088 145)`  |
| `--clr-green-a2`     | `:root`  | `oklch(40% 0.103 145)`  |
| `--clr-green-a3`     | `:root`  | `oklch(45% 0.116 145)`  |
| `--clr-green-a4`     | `:root`  | `oklch(49% 0.126 145)`  |
| `--clr-green-a5`     | `:root`  | `oklch(71% 0.18 145)`   |
| `--clr-green-a6`     | `:root`  | `oklch(76% 0.18 145)`   |
| `--clr-green-a7`     | `:root`  | `oklch(81% 0.18 145)`   |
| `--clr-green-a8`     | `:root`  | `oklch(86% 0.18 145)`   |
| `--clr-green-a9`     | `:root`  | `oklch(92% 0.123 145)`  |
| `--clr-teal-a0`      | `:root`  | `oklch(28% 0.045 170)`  |
| `--clr-teal-a1`      | `:root`  | `oklch(34% 0.055 170)`  |
| `--clr-teal-a2`      | `:root`  | `oklch(40% 0.065 170)`  |
| `--clr-teal-a3`      | `:root`  | `oklch(45% 0.073 170)`  |
| `--clr-teal-a4`      | `:root`  | `oklch(49% 0.08 170)`   |
| `--clr-teal-a5`      | `:root`  | `oklch(71% 0.115 170)`  |
| `--clr-teal-a6`      | `:root`  | `oklch(76% 0.123 170)`  |
| `--clr-teal-a7`      | `:root`  | `oklch(81% 0.131 170)`  |
| `--clr-teal-a8`      | `:root`  | `oklch(86% 0.14 170)`   |
| `--clr-teal-a9`      | `:root`  | `oklch(92% 0.1 170)`    |
| `--clr-cyan-a0`      | `:root`  | `oklch(28% 0.039 195)`  |
| `--clr-cyan-a1`      | `:root`  | `oklch(34% 0.048 195)`  |
| `--clr-cyan-a2`      | `:root`  | `oklch(40% 0.056 195)`  |
| `--clr-cyan-a3`      | `:root`  | `oklch(45% 0.063 195)`  |
| `--clr-cyan-a4`      | `:root`  | `oklch(49% 0.069 195)`  |
| `--clr-cyan-a5`      | `:root`  | `oklch(71% 0.099 195)`  |
| `--clr-cyan-a6`      | `:root`  | `oklch(76% 0.106 195)`  |
| `--clr-cyan-a7`      | `:root`  | `oklch(81% 0.113 195)`  |
| `--clr-cyan-a8`      | `:root`  | `oklch(86% 0.12 195)`   |
| `--clr-cyan-a9`      | `:root`  | `oklch(92% 0.104 195)`  |
| `--clr-blue-a0`      | `:root`  | `oklch(28% 0.065 250)`  |
| `--clr-blue-a1`      | `:root`  | `oklch(34% 0.079 250)`  |
| `--clr-blue-a2`      | `:root`  | `oklch(40% 0.093 250)`  |
| `--clr-blue-a3`      | `:root`  | `oklch(45% 0.104 250)`  |
| `--clr-blue-a4`      | `:root`  | `oklch(49% 0.114 250)`  |
| `--clr-blue-a5`      | `:root`  | `oklch(71% 0.129 250)`  |
| `--clr-blue-a6`      | `:root`  | `oklch(76% 0.105 250)`  |
| `--clr-blue-a7`      | `:root`  | `oklch(81% 0.081 250)`  |
| `--clr-blue-a8`      | `:root`  | `oklch(86% 0.059 250)`  |
| `--clr-blue-a9`      | `:root`  | `oklch(92% 0.033 250)`  |
| `--clr-indigo-a0`    | `:root`  | `oklch(28% 0.144 275)`  |
| `--clr-indigo-a1`    | `:root`  | `oklch(34% 0.175 275)`  |
| `--clr-indigo-a2`    | `:root`  | `oklch(40% 0.18 275)`   |
| `--clr-indigo-a3`    | `:root`  | `oklch(45% 0.18 275)`   |
| `--clr-indigo-a4`    | `:root`  | `oklch(49% 0.18 275)`   |
| `--clr-indigo-a5`    | `:root`  | `oklch(71% 0.124 275)`  |
| `--clr-indigo-a6`    | `:root`  | `oklch(76% 0.101 275)`  |
| `--clr-indigo-a7`    | `:root`  | `oklch(81% 0.078 275)`  |
| `--clr-indigo-a8`    | `:root`  | `oklch(86% 0.057 275)`  |
| `--clr-indigo-a9`    | `:root`  | `oklch(92% 0.032 275)`  |
| `--clr-violet-a0`    | `:root`  | `oklch(28% 0.126 295)`  |
| `--clr-violet-a1`    | `:root`  | `oklch(34% 0.153 295)`  |
| `--clr-violet-a2`    | `:root`  | `oklch(40% 0.18 295)`   |
| `--clr-violet-a3`    | `:root`  | `oklch(45% 0.18 295)`   |
| `--clr-violet-a4`    | `:root`  | `oklch(49% 0.18 295)`   |
| `--clr-violet-a5`    | `:root`  | `oklch(71% 0.139 295)`  |
| `--clr-violet-a6`    | `:root`  | `oklch(76% 0.113 295)`  |
| `--clr-violet-a7`    | `:root`  | `oklch(81% 0.088 295)`  |
| `--clr-violet-a8`    | `:root`  | `oklch(86% 0.063 295)`  |
| `--clr-violet-a9`    | `:root`  | `oklch(92% 0.035 295)`  |
| `--clr-purple-a0`    | `:root`  | `oklch(28% 0.113 315)`  |
| `--clr-purple-a1`    | `:root`  | `oklch(34% 0.137 315)`  |
| `--clr-purple-a2`    | `:root`  | `oklch(40% 0.162 315)`  |
| `--clr-purple-a3`    | `:root`  | `oklch(45% 0.18 315)`   |
| `--clr-purple-a4`    | `:root`  | `oklch(49% 0.18 315)`   |
| `--clr-purple-a5`    | `:root`  | `oklch(71% 0.18 315)`   |
| `--clr-purple-a6`    | `:root`  | `oklch(76% 0.149 315)`  |
| `--clr-purple-a7`    | `:root`  | `oklch(81% 0.115 315)`  |
| `--clr-purple-a8`    | `:root`  | `oklch(86% 0.083 315)`  |
| `--clr-purple-a9`    | `:root`  | `oklch(92% 0.046 315)`  |
| `--clr-pink-a0`      | `:root`  | `oklch(28% 0.102 335)`  |
| `--clr-pink-a1`      | `:root`  | `oklch(34% 0.124 335)`  |
| `--clr-pink-a2`      | `:root`  | `oklch(40% 0.146 335)`  |
| `--clr-pink-a3`      | `:root`  | `oklch(45% 0.164 335)`  |
| `--clr-pink-a4`      | `:root`  | `oklch(49% 0.179 335)`  |
| `--clr-pink-a5`      | `:root`  | `oklch(71% 0.18 335)`   |
| `--clr-pink-a6`      | `:root`  | `oklch(76% 0.175 335)`  |
| `--clr-pink-a7`      | `:root`  | `oklch(81% 0.131 335)`  |
| `--clr-pink-a8`      | `:root`  | `oklch(86% 0.091 335)`  |
| `--clr-pink-a9`      | `:root`  | `oklch(92% 0.049 335)`  |
| `--clr-rose-a0`      | `:root`  | `oklch(28% 0.092 10)`   |
| `--clr-rose-a1`      | `:root`  | `oklch(34% 0.111 10)`   |
| `--clr-rose-a2`      | `:root`  | `oklch(40% 0.131 10)`   |
| `--clr-rose-a3`      | `:root`  | `oklch(45% 0.148 10)`   |
| `--clr-rose-a4`      | `:root`  | `oklch(49% 0.161 10)`   |
| `--clr-rose-a5`      | `:root`  | `oklch(71% 0.155 10)`   |
| `--clr-rose-a6`      | `:root`  | `oklch(76% 0.121 10)`   |
| `--clr-rose-a7`      | `:root`  | `oklch(81% 0.091 10)`   |
| `--clr-rose-a8`      | `:root`  | `oklch(86% 0.063 10)`   |
| `--clr-rose-a9`      | `:root`  | `oklch(92% 0.034 10)`   |
| `--clr-brown-a0`     | `:root`  | `oklch(28% 0.046 60)`   |
| `--clr-brown-a1`     | `:root`  | `oklch(34% 0.056 60)`   |
| `--clr-brown-a2`     | `:root`  | `oklch(40% 0.066 60)`   |
| `--clr-brown-a3`     | `:root`  | `oklch(45% 0.074 60)`   |
| `--clr-brown-a4`     | `:root`  | `oklch(49% 0.08 60)`    |
| `--clr-brown-a5`     | `:root`  | `oklch(71% 0.1 60)`     |
| `--clr-brown-a6`     | `:root`  | `oklch(76% 0.1 60)`     |
| `--clr-brown-a7`     | `:root`  | `oklch(81% 0.093 60)`   |
| `--clr-brown-a8`     | `:root`  | `oklch(86% 0.065 60)`   |
| `--clr-brown-a9`     | `:root`  | `oklch(92% 0.036 60)`   |
| `--clr-polish-white` | `:root`  | `#e9e8e7`               |
| `--clr-polish-red`   | `:root`  | `#d4213d`               |

## props.css

[Source](../src/lib/styles/props.css)

| Token             | Selector | Declared value |
| ----------------- | -------- | -------------- |
| `--zi-0`          | `:root`  | `0`            |
| `--zi-1`          | `:root`  | `1`            |
| `--zi-2`          | `:root`  | `5`            |
| `--zi-3`          | `:root`  | `10`           |
| `--zi-4`          | `:root`  | `20`           |
| `--zi-5`          | `:root`  | `100`          |
| `--zi-always-top` | `:root`  | `10000`        |
| `--zi-modal-base` | `:root`  | `200`          |
| `--size-000`      | `:root`  | `-0.5rem`      |
| `--size-00`       | `:root`  | `-0.25rem`     |
| `--size-1`        | `:root`  | `0.25rem`      |
| `--size-2`        | `:root`  | `0.5rem`       |
| `--size-3`        | `:root`  | `1rem`         |
| `--size-4`        | `:root`  | `1.25rem`      |
| `--size-5`        | `:root`  | `1.5rem`       |
| `--size-6`        | `:root`  | `1.75rem`      |
| `--size-7`        | `:root`  | `2rem`         |
| `--size-8`        | `:root`  | `3rem`         |
| `--size-9`        | `:root`  | `4rem`         |
| `--size-10`       | `:root`  | `5rem`         |
| `--size-11`       | `:root`  | `7.5rem`       |
| `--size-12`       | `:root`  | `10rem`        |
| `--size-13`       | `:root`  | `15rem`        |
| `--size-14`       | `:root`  | `20rem`        |
| `--size-15`       | `:root`  | `30rem`        |
| `--font-size-00`  | `:root`  | `0.5rem`       |
| `--font-size-0`   | `:root`  | `0.75rem`      |
| `--font-size-1`   | `:root`  | `1rem`         |
| `--font-size-2`   | `:root`  | `1.1rem`       |
| `--font-size-3`   | `:root`  | `1.25rem`      |
| `--font-size-4`   | `:root`  | `1.5rem`       |
| `--font-size-5`   | `:root`  | `2rem`         |
| `--font-size-6`   | `:root`  | `2.5rem`       |
| `--font-size-7`   | `:root`  | `3rem`         |
| `--font-size-8`   | `:root`  | `3.5rem`       |
| `--font-ls-0`     | `:root`  | `-0.05em`      |
| `--font-ls-1`     | `:root`  | `0.025em`      |
| `--font-ls-2`     | `:root`  | `0.05em`       |
| `--font-ls-3`     | `:root`  | `0.075em`      |
| `--font-ls-4`     | `:root`  | `0.15em`       |
| `--font-ls-5`     | `:root`  | `0.25em`       |
| `--font-ls-6`     | `:root`  | `0.5em`        |
| `--font-ls-7`     | `:root`  | `0.75em`       |
| `--font-ls-8`     | `:root`  | `1em`          |
| `--font-ls-9`     | `:root`  | `1.125em`      |
| `--radius-1`      | `:root`  | `2px`          |
| `--radius-2`      | `:root`  | `5px`          |
| `--radius-3`      | `:root`  | `1rem`         |
| `--radius-4`      | `:root`  | `2rem`         |
| `--radius-5`      | `:root`  | `4rem`         |
| `--radius-round`  | `:root`  | `1e5px`        |
| `--border-1`      | `:root`  | `1px`          |
| `--border-2`      | `:root`  | `2px`          |
| `--border-3`      | `:root`  | `5px`          |
| `--border-4`      | `:root`  | `10px`         |
| `--border-5`      | `:root`  | `25px`         |

## switch.css

[Source](../src/lib/styles/switch.css)

| Token                 | Selector  | Declared value                                                     |
| --------------------- | --------- | ------------------------------------------------------------------ |
| `--switch-inset`      | `.switch` | `calc(var(--sc-switch-height) / 8)`                                |
| `--switch-thumb-size` | `.switch` | `calc(var(--sc-switch-height) - 2 * var(--switch-inset))`          |
| `--switch-travel`     | `.switch` | `max(0px, calc(var(--sc-switch-width) - var(--sc-switch-height)))` |
| `--switch-label-gap`  | `.switch` | `calc(var(--sc-switch-height) / 3)`                                |

## theme.css

[Source](../src/lib/styles/theme.css)

| Token                                           | Selector | Declared value                                                                                                                         |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--sc-shadow-color`                             | `:root`  | `var(--sc-color-shadow)`                                                                                                               |
| `--sc-shadow-1`                                 | `:root`  | `oklch(from var(--sc-shadow-color) l c h / 0.18) -1px -1px 1px 0px, oklch(from var(--sc-shadow-color) l c h / 0.18) 2px 2px 4px 2px`   |
| `--sc-shadow-2`                                 | `:root`  | `oklch(from var(--sc-shadow-color) l c h / 0.22) -1px -1px 2px 0px, oklch(from var(--sc-shadow-color) l c h / 0.22) 3px 3px 6px 4px`   |
| `--sc-shadow-3`                                 | `:root`  | `oklch(from var(--sc-shadow-color) l c h / 0.26) -2px -2px 2px 0px, oklch(from var(--sc-shadow-color) l c h / 0.26) 4px 4px 8px 6px`   |
| `--sc-shadow-4`                                 | `:root`  | `oklch(from var(--sc-shadow-color) l c h / 0.26) -2px -2px 3px 0px, oklch(from var(--sc-shadow-color) l c h / 0.26) 6px 6px 12px 8px`  |
| `--sc-shadow-5`                                 | `:root`  | `oklch(from var(--sc-shadow-color) l c h / 0.26) -3px -3px 4px 0px, oklch(from var(--sc-shadow-color) l c h / 0.26) 8px 8px 16px 10px` |
| `--sc-loader-overlay`                           | `:root`  | `var(--sc-color-surface-semitransparent)`                                                                                              |
| `--sc-loader-content`                           | `:root`  | `var(--sc-color-surface)`                                                                                                              |
| `--sc-loader-content-border`                    | `:root`  | `var(--sc-color-border)`                                                                                                               |
| `--sc-loader-spinner`                           | `:root`  | `var(--sc-color-spinner)`                                                                                                              |
| `--sc-loader-spinner-accent`                    | `:root`  | `var(--sc-color-spinner-indicator)`                                                                                                    |
| `--sc-loader-title`                             | `:root`  | `var(--sc-color-text)`                                                                                                                 |
| `--sc-loader-progress-bar`                      | `:root`  | `var(--sc-color-progress-bar)`                                                                                                         |
| `--sc-loader-status`                            | `:root`  | `var(--sc-color-text-muted)`                                                                                                           |
| `--sc-modal-backdrop`                           | `:root`  | `var(--sc-color-surface-semitransparent)`                                                                                              |
| `--sc-modal-content-shadow`                     | `:root`  | `var(--sc-shadow-4)`                                                                                                                   |
| `--sc-modal-header-text`                        | `:root`  | `var(--sc-color-text-inverted)`                                                                                                        |
| `--sc-modal-header-bg`                          | `:root`  | `var(--sc-color-brand)`                                                                                                                |
| `--sc-modal-header-button-text`                 | `:root`  | `var(--sc-color-text-inverted)`                                                                                                        |
| `--sc-modal-body-bg`                            | `:root`  | `var(--sc-color-surface-light)`                                                                                                        |
| `--sc-modal-footer-bg`                          | `:root`  | `var(--sc-color-surface-muted)`                                                                                                        |
| `--sc-toast-error-text`                         | `:root`  | `var(--sc-color-on-danger)`                                                                                                            |
| `--sc-toast-error-bg`                           | `:root`  | `var(--sc-color-danger)`                                                                                                               |
| `--sc-toast-warning-text`                       | `:root`  | `var(--sc-color-on-warning)`                                                                                                           |
| `--sc-toast-warning-bg`                         | `:root`  | `var(--sc-color-warning)`                                                                                                              |
| `--sc-toast-success-text`                       | `:root`  | `var(--sc-color-on-success)`                                                                                                           |
| `--sc-toast-success-bg`                         | `:root`  | `var(--sc-color-success)`                                                                                                              |
| `--sc-toast-info-text`                          | `:root`  | `var(--sc-color-on-info)`                                                                                                              |
| `--sc-toast-info-bg`                            | `:root`  | `var(--sc-color-info)`                                                                                                                 |
| `--sc-toast-neutral-text`                       | `:root`  | `var(--sc-color-on-neutral)`                                                                                                           |
| `--sc-toast-neutral-bg`                         | `:root`  | `var(--sc-color-neutral)`                                                                                                              |
| `--sc-toast-shadow`                             | `:root`  | `var(--sc-shadow-4)`                                                                                                                   |
| `--sc-button-neutral-accent`                    | `:root`  | `var(--sc-color-neutral)`                                                                                                              |
| `--sc-button-neutral-on-accent`                 | `:root`  | `var(--sc-color-on-neutral)`                                                                                                           |
| `--sc-button-neutral-accent-hover`              | `:root`  | `var(--sc-color-neutral-hover)`                                                                                                        |
| `--sc-button-neutral-on-accent-hover`           | `:root`  | `var(--sc-color-on-neutral-hover)`                                                                                                     |
| `--sc-button-danger-accent`                     | `:root`  | `var(--sc-color-danger)`                                                                                                               |
| `--sc-button-danger-on-accent`                  | `:root`  | `var(--sc-color-on-danger)`                                                                                                            |
| `--sc-button-danger-accent-hover`               | `:root`  | `var(--sc-color-danger-hover)`                                                                                                         |
| `--sc-button-danger-on-accent-hover`            | `:root`  | `var(--sc-color-on-danger-hover)`                                                                                                      |
| `--sc-button-warning-accent`                    | `:root`  | `var(--sc-color-warning)`                                                                                                              |
| `--sc-button-warning-on-accent`                 | `:root`  | `var(--sc-color-on-warning)`                                                                                                           |
| `--sc-button-warning-accent-hover`              | `:root`  | `var(--sc-color-warning-hover)`                                                                                                        |
| `--sc-button-warning-on-accent-hover`           | `:root`  | `var(--sc-color-on-warning-hover)`                                                                                                     |
| `--sc-button-success-accent`                    | `:root`  | `var(--sc-color-success)`                                                                                                              |
| `--sc-button-success-on-accent`                 | `:root`  | `var(--sc-color-on-success)`                                                                                                           |
| `--sc-button-success-accent-hover`              | `:root`  | `var(--sc-color-success-hover)`                                                                                                        |
| `--sc-button-success-on-accent-hover`           | `:root`  | `var(--sc-color-on-success-hover)`                                                                                                     |
| `--sc-button-info-accent`                       | `:root`  | `var(--sc-color-info)`                                                                                                                 |
| `--sc-button-info-on-accent`                    | `:root`  | `var(--sc-color-on-info)`                                                                                                              |
| `--sc-button-info-accent-hover`                 | `:root`  | `var(--sc-color-info-hover)`                                                                                                           |
| `--sc-button-info-on-accent-hover`              | `:root`  | `var(--sc-color-on-info-hover)`                                                                                                        |
| `--sc-button-brand-accent`                      | `:root`  | `var(--sc-color-brand)`                                                                                                                |
| `--sc-button-brand-on-accent`                   | `:root`  | `var(--sc-color-on-brand)`                                                                                                             |
| `--sc-button-brand-accent-hover`                | `:root`  | `var(--sc-color-brand-hover)`                                                                                                          |
| `--sc-button-brand-on-accent-hover`             | `:root`  | `var(--sc-color-on-brand-hover)`                                                                                                       |
| `--sc-button-padding`                           | `:root`  | `calc(var(--size-1) * 1.25) calc(var(--size-2) * 1.5)`                                                                                 |
| `--sc-button-shadow`                            | `:root`  | `var(--sc-shadow-1)`                                                                                                                   |
| `--sc-button-focus-visible-outline`             | `:root`  | `var(--sc-border-ws) var(--sc-color-outline)`                                                                                          |
| `--sc-button-focus-visible-outline-offset`      | `:root`  | `2px`                                                                                                                                  |
| `--sc-button-disabled-opacity`                  | `:root`  | `0.5`                                                                                                                                  |
| `--sc-button-disabled-shadow`                   | `:root`  | `none`                                                                                                                                 |
| `--sc-floating-button-bg`                       | `:root`  | `oklch(from var(--sc-color-brand) l c h / 0.75)`                                                                                       |
| `--sc-floating-button-hover-bg`                 | `:root`  | `var(--sc-color-brand)`                                                                                                                |
| `--sc-floating-button-text`                     | `:root`  | `var(--sc-color-on-brand)`                                                                                                             |
| `--sc-floating-button-transition`               | `:root`  | `transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease`                                                             |
| `--sc-floating-button-focus-outline`            | `:root`  | `var(--sc-color-on-brand)`                                                                                                             |
| `--sc-carousel-font`                            | `:root`  | `var(--sc-font-body)`                                                                                                                  |
| `--sc-carousel-header-bg`                       | `:root`  | `oklch(from var(--sc-color-outline) l c h / 0.4)`                                                                                      |
| `--sc-carousel-header-border`                   | `:root`  | `oklch(from var(--sc-color-outline) l c h / 0.2)`                                                                                      |
| `--sc-carousel-title-bg`                        | `:root`  | `linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)`                                                                           |
| `--sc-carousel-title-filter`                    | `:root`  | `drop-shadow( 0 6px 6px oklch(from var(--sc-color-on-media-shadow) l c h / 0.75) )`                                                    |
| `--sc-carousel-bg`                              | `:root`  | `transparent`                                                                                                                          |
| `--sc-carousel-slide-content-bg`                | `:root`  | `var(--sc-color-background)`                                                                                                           |
| `--sc-carousel-slide-content-text`              | `:root`  | `var(--sc-color-text)`                                                                                                                 |
| `--sc-carousel-slide-subtitle-bg`               | `:root`  | `oklch(from var(--sc-color-text-muted) l c h / 0.2)`                                                                                   |
| `--sc-carousel-nav-item-border`                 | `:root`  | `oklch(from var(--sc-color-on-media) l c h / 0.55)`                                                                                    |
| `--sc-carousel-nav-item-active-bg`              | `:root`  | `var(--sc-color-on-media)`                                                                                                             |
| `--sc-carousel-nav-item-active-border-color`    | `:root`  | `var(--sc-color-on-media)`                                                                                                             |
| `--sc-carousel-nav-item-hover-border-color`     | `:root`  | `var(--sc-color-on-media)`                                                                                                             |
| `--sc-carousel-progress-bar-background`         | `:root`  | `linear-gradient(90deg, #ff6b6b, #4ecdc4)`                                                                                             |
| `--sc-carousel-slide-counter-color`             | `:root`  | `var(--sc-color-on-media)`                                                                                                             |
| `--sc-carousel-counter-button-bg`               | `:root`  | `transparent`                                                                                                                          |
| `--sc-carousel-counter-button-color`            | `:root`  | `var(--sc-color-on-media)`                                                                                                             |
| `--sc-carousel-counter-progress-bg`             | `:root`  | `oklch(from var(--sc-color-on-media) l c h / 0.5)`                                                                                     |
| `--sc-carousel-counter-progress-fill-bg`        | `:root`  | `oklch(from var(--sc-color-on-media) l c h / 0.75)`                                                                                    |
| `--sc-carousel-main-description-color`          | `:root`  | `var(--sc-color-on-media-muted)`                                                                                                       |
| `--sc-carousel-main-description-shadow-color`   | `:root`  | `var(--sc-color-on-media-shadow)`                                                                                                      |
| `--sc-circular-timer-color`                     | `:root`  | `oklch(from var(--sc-color-text-muted) l c h / 0.5)`                                                                                   |
| `--sc-circular-timer-remaining-time-color`      | `:root`  | `oklch(from var(--sc-color-text) l c h / 0.75)`                                                                                        |
| `--sc-collapsible-card-header-bg`               | `:root`  | `var(--sc-color-surface-emphasis)`                                                                                                     |
| `--sc-collapsible-card-footer-bg`               | `:root`  | `var(--sc-color-surface-muted)`                                                                                                        |
| `--sc-collapsible-card-button-link-color`       | `:root`  | `var(--sc-color-text-muted)`                                                                                                           |
| `--sc-collapsible-card-button-link-hover-color` | `:root`  | `var(--sc-color-text)`                                                                                                                 |
| `--sc-accordion-header-bg`                      | `:root`  | `transparent`                                                                                                                          |
| `--sc-accordion-header-color`                   | `:root`  | `var(--sc-color-text-muted)`                                                                                                           |
| `--sc-accordion-trigger-bg`                     | `:root`  | `var(--sc-color-surface)`                                                                                                              |
| `--sc-accordion-trigger-color`                  | `:root`  | `var(--sc-color-text)`                                                                                                                 |
| `--sc-accordion-trigger-hover-bg`               | `:root`  | `var(--sc-color-surface-light)`                                                                                                        |
| `--sc-accordion-item-border-top-color`          | `:root`  | `var(--sc-color-surface-light)`                                                                                                        |
| `--sc-accordion-trigger-expanded-bg`            | `:root`  | `var(--sc-color-surface-light)`                                                                                                        |
| `--sc-accordion-trigger-focus-visible-outline`  | `:root`  | `var(--sc-color-text-muted)`                                                                                                           |
| `--sc-accordion-panel-bg`                       | `:root`  | `var(--sc-color-background)`                                                                                                           |
| `--sc-accordion-panel-color`                    | `:root`  | `var(--sc-color-text)`                                                                                                                 |
| `--sc-card-header-bg`                           | `:root`  | `var(--sc-color-surface-emphasis)`                                                                                                     |
| `--sc-card-body-bg`                             | `:root`  | `var(--sc-color-surface)`                                                                                                              |
| `--sc-card-footer-bg`                           | `:root`  | `var(--sc-color-surface-muted)`                                                                                                        |
| `--sc-color-row-loop-odd`                       | `:root`  | `var(--sc-color-background)`                                                                                                           |
| `--sc-color-row-loop-even`                      | `:root`  | `var(--sc-color-surface)`                                                                                                              |
| `--sc-switch-bg`                                | `:root`  | `var(--sc-color-control-track)`                                                                                                        |
| `--sc-switch-color`                             | `:root`  | `var(--sc-color-brand)`                                                                                                                |
| `--sc-form-input-bg`                            | `:root`  | `var(--sc-color-control-bg)`                                                                                                           |
| `--sc-form-input-color`                         | `:root`  | `inherit`                                                                                                                              |
| `--sc-form-input-border-color`                  | `:root`  | `oklch(from var(--sc-color-outline) l c h / 0.5)`                                                                                      |
| `--sc-form-input-font-style`                    | `:root`  | `inherit`                                                                                                                              |
| `--sc-form-input-focus-border-color`            | `:root`  | `oklch(from var(--sc-color-outline) l c h / 0.85)`                                                                                     |
| `--sc-slider-color`                             | `:root`  | `var(--sc-color-brand)`                                                                                                                |
| `--sc-slider-outline-color`                     | `:root`  | `var(--sc-color-text)`                                                                                                                 |

## tokens.css

[Source](../src/lib/styles/tokens.css)

| Token                                | Selector                   | Declared value                                                |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------- |
| `--sc-top-bar-height`                | `:root`                    | `0px`                                                         |
| `--sc-bottom-bar-height`             | `:root`                    | `0px`                                                         |
| `--sc-font-body`                     | `:root`                    | `sans-serif`                                                  |
| `--sc-font-header`                   | `:root`                    | `serif`                                                       |
| `--sc-font-code`                     | `:root`                    | `monospace`                                                   |
| `--sc-border-width`                  | `:root`                    | `2px`                                                         |
| `--sc-border-style`                  | `:root`                    | `solid`                                                       |
| `--sc-border-ws`                     | `:root`                    | `var(--sc-border-width) var(--sc-border-style)`               |
| `--sc-border-radius`                 | `:root`                    | `var(--radius-2)`                                             |
| `--sc-transition-duration`           | `:root`                    | `0.25s`                                                       |
| `--sc-transition-type`               | `:root`                    | `ease-in-out`                                                 |
| `--sc-transition-all`                | `:root`                    | `all var(--sc-transition-duration) var(--sc-transition-type)` |
| `--sc-backdrop-filter`               | `:root`                    | `blur(20px)`                                                  |
| `--sc-switch-width`                  | `:root`                    | `44px`                                                        |
| `--sc-switch-height`                 | `:root`                    | `24px`                                                        |
| `--sc-color-brand`                   | `:root`                    | `oklch(52.989% 0.06748 112.689)`                              |
| `--sc-color-text`                    | `:root`                    | `var(--clr-neutral-a0)`                                       |
| `--sc-color-text-muted`              | `:root`                    | `var(--clr-neutral-a4)`                                       |
| `--sc-color-text-inverted`           | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-background`              | `:root`                    | `var(--clr-bg-a1)`                                            |
| `--sc-color-surface`                 | `:root`                    | `var(--clr-bg-a4)`                                            |
| `--sc-color-surface-light`           | `:root`                    | `var(--clr-bg-a4)`                                            |
| `--sc-color-surface-muted`           | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-surface-emphasis`        | `:root`                    | `var(--clr-neutral-a7)`                                       |
| `--sc-color-surface-semitransparent` | `:root`                    | `oklch(from var(--clr-bg-a5) l c h / 0.5)`                    |
| `--sc-color-control-bg`              | `:root`                    | `var(--clr-bg-a1)`                                            |
| `--sc-color-control-track`           | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-border`                  | `:root`                    | `var(--clr-neutral-a5)`                                       |
| `--sc-color-outline`                 | `:root`                    | `oklch(39.093% 0.01634 107.182)`                              |
| `--sc-color-shadow`                  | `:root`                    | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-media`                | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-on-media-muted`          | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-on-media-shadow`         | `:root`                    | `var(--clr-neutral-a6)`                                       |
| `--sc-color-accent`                  | `:root`                    | `var(--clr-amber-a6)`                                         |
| `--sc-color-progress-bar`            | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-spinner`                 | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-spinner-indicator`       | `:root`                    | `var(--sc-color-brand)`                                       |
| `--sc-color-on-brand`                | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-brand-hover`             | `:root`                    | `oklch(58.324% 0.08851 113.513)`                              |
| `--sc-color-on-brand-hover`          | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-danger`                  | `:root`                    | `var(--clr-red-a4)`                                           |
| `--sc-color-danger-hover`            | `:root`                    | `var(--clr-red-a3)`                                           |
| `--sc-color-on-danger`               | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-on-danger-hover`         | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-warning`                 | `:root`                    | `var(--clr-yellow-a6)`                                        |
| `--sc-color-warning-hover`           | `:root`                    | `var(--clr-yellow-a5)`                                        |
| `--sc-color-on-warning`              | `:root`                    | `var(--clr-neutral-a1)`                                       |
| `--sc-color-on-warning-hover`        | `:root`                    | `var(--clr-neutral-a1)`                                       |
| `--sc-color-success`                 | `:root`                    | `var(--clr-green-a2)`                                         |
| `--sc-color-success-hover`           | `:root`                    | `var(--clr-green-a3)`                                         |
| `--sc-color-on-success`              | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-on-success-hover`        | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-info`                    | `:root`                    | `var(--clr-blue-a2)`                                          |
| `--sc-color-info-hover`              | `:root`                    | `var(--clr-blue-a3)`                                          |
| `--sc-color-on-info`                 | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-on-info-hover`           | `:root`                    | `var(--clr-neutral-a9)`                                       |
| `--sc-color-neutral`                 | `:root`                    | `var(--clr-neutral-a5)`                                       |
| `--sc-color-neutral-hover`           | `:root`                    | `var(--clr-neutral-a5)`                                       |
| `--sc-color-on-neutral`              | `:root`                    | `var(--clr-neutral-a8)`                                       |
| `--sc-color-on-neutral-hover`        | `:root`                    | `var(--clr-bg-a2)`                                            |
| `--sc-color-brand`                   | `:root[data-theme='dark']` | `oklch(71% 0.1 112.689)`                                      |
| `--sc-color-text`                    | `:root[data-theme='dark']` | `var(--clr-neutral-a9)`                                       |
| `--sc-color-text-muted`              | `:root[data-theme='dark']` | `var(--clr-neutral-a6)`                                       |
| `--sc-color-text-inverted`           | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-background`              | `:root[data-theme='dark']` | `var(--clr-bg-a9)`                                            |
| `--sc-color-surface`                 | `:root[data-theme='dark']` | `var(--clr-bg-a8)`                                            |
| `--sc-color-surface-light`           | `:root[data-theme='dark']` | `var(--clr-bg-a7)`                                            |
| `--sc-color-surface-muted`           | `:root[data-theme='dark']` | `var(--clr-bg-a7)`                                            |
| `--sc-color-surface-emphasis`        | `:root[data-theme='dark']` | `var(--clr-bg-a6)`                                            |
| `--sc-color-surface-semitransparent` | `:root[data-theme='dark']` | `oklch(from var(--clr-bg-a9) l c h / 0.82)`                   |
| `--sc-color-control-bg`              | `:root[data-theme='dark']` | `var(--clr-bg-a8)`                                            |
| `--sc-color-control-track`           | `:root[data-theme='dark']` | `var(--clr-bg-a7)`                                            |
| `--sc-color-border`                  | `:root[data-theme='dark']` | `var(--clr-neutral-a4)`                                       |
| `--sc-color-outline`                 | `:root[data-theme='dark']` | `var(--clr-neutral-a4)`                                       |
| `--sc-color-shadow`                  | `:root[data-theme='dark']` | `var(--clr-neutral-a9)`                                       |
| `--sc-color-on-media`                | `:root[data-theme='dark']` | `var(--clr-neutral-a9)`                                       |
| `--sc-color-on-media-muted`          | `:root[data-theme='dark']` | `var(--clr-neutral-a8)`                                       |
| `--sc-color-on-media-shadow`         | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-accent`                  | `:root[data-theme='dark']` | `var(--clr-amber-a5)`                                         |
| `--sc-color-progress-bar`            | `:root[data-theme='dark']` | `var(--clr-neutral-a7)`                                       |
| `--sc-color-spinner`                 | `:root[data-theme='dark']` | `var(--clr-neutral-a5)`                                       |
| `--sc-color-spinner-indicator`       | `:root[data-theme='dark']` | `var(--sc-color-brand)`                                       |
| `--sc-color-on-brand`                | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-brand-hover`             | `:root[data-theme='dark']` | `oklch(76% 0.105 112.689)`                                    |
| `--sc-color-on-brand-hover`          | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-danger`                  | `:root[data-theme='dark']` | `var(--clr-red-a5)`                                           |
| `--sc-color-danger-hover`            | `:root[data-theme='dark']` | `var(--clr-red-a6)`                                           |
| `--sc-color-on-danger`               | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-danger-hover`         | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-warning`                 | `:root[data-theme='dark']` | `var(--clr-yellow-a6)`                                        |
| `--sc-color-warning-hover`           | `:root[data-theme='dark']` | `var(--clr-yellow-a7)`                                        |
| `--sc-color-on-warning`              | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-warning-hover`        | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-success`                 | `:root[data-theme='dark']` | `var(--clr-green-a5)`                                         |
| `--sc-color-success-hover`           | `:root[data-theme='dark']` | `var(--clr-green-a6)`                                         |
| `--sc-color-on-success`              | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-success-hover`        | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-info`                    | `:root[data-theme='dark']` | `var(--clr-blue-a5)`                                          |
| `--sc-color-info-hover`              | `:root[data-theme='dark']` | `var(--clr-blue-a6)`                                          |
| `--sc-color-on-info`                 | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-info-hover`           | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-neutral`                 | `:root[data-theme='dark']` | `var(--clr-neutral-a5)`                                       |
| `--sc-color-neutral-hover`           | `:root[data-theme='dark']` | `var(--clr-neutral-a6)`                                       |
| `--sc-color-on-neutral`              | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
| `--sc-color-on-neutral-hover`        | `:root[data-theme='dark']` | `var(--clr-neutral-a0)`                                       |
