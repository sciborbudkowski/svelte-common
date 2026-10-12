# Audit fix status — 2026-10-10

This records implementation against the [original audit](component-audit-2026-10-10.md).
All 39 findings within the requested scope are addressed. `CollapsibleTabBar.svelte`
and its public export are unchanged: F07–F10 and the TabBar portions of F31/F43 remain
excluded at the owner's request. Prettier ignores that unfinished component.

| Findings | Implemented fix                                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F01      | Private cache access requires a session scope or explicit key policy. Default keys include non-credential header variants; scope getters can disable caching after logout. Failing hooks leave network requests usable.                                                                                      |
| F02      | The working tree declares Svelte `^5.25.0`, matching the APIs in use. This peer correction was already present when implementation began and was preserved.                                                                                                                                                  |
| F03      | Default bar heights are `0px`, so length calculations remain valid.                                                                                                                                                                                                                                          |
| F04–F06  | FloatingButton storage uses the actual reactive ID; changing IDs reloads position without stale reads winning. Disabled links cannot navigate or invoke actions. Click suppression requires a real preceding drag.                                                                                           |
| F11–F13  | Shared overlay ownership makes background branches inert, contains escaped focus, orders Tab traversal, restores focus and scroll styles, and supports nested/overlapping dialogs and loaders. Focus candidates include native summary/media/editable controls. Modal close color uses the documented token. |
| F14–F16  | Carousel inactive slides are inert and hidden from accessibility. Rotation has pause/resume, focus/hover pauses and reduced-motion handling. The active slide is visible during SSR and animation failure; manual navigation still works. Animation/timer teardown is explicit.                              |
| F17–F19  | Accordion initialization no longer overrides subsequent toggles. The single-open policy also holds during initialization/SSR. DOM IDs include the accordion instance namespace.                                                                                                                              |
| F20–F23  | Toast callback types accept void/promises, errors are isolated, every removal path reports a reason, callbacks run after state commits, and replacement generations restart visual timers.                                                                                                                   |
| F24–F27  | Loader shares overlay focus/background ownership, exposes dialog/status/progress semantics, clamps finite progress, and fits narrow viewports without the former minimum width.                                                                                                                              |
| F28–F29  | Avatar forwards typed HTML attributes, combines user classes/styles with sizing, and supports meaningful or decorative image alternatives.                                                                                                                                                                   |
| F30–F32  | ScrollIndicator observes ancestor/window scroll and cancels pending frames/hide timers. ScrollHint coalesces and cancels frames, observes descendant size/content changes, image loads, font completion and transitions. The TabBar part of F31 is excluded.                                                 |
| F33–F34  | GPS watches survive transient errors, can restart while consumers remain, and reject callbacks from superseded generations. Permission denial stops automatic watching until an explicit retry.                                                                                                              |
| F35–F36  | Theme cleanup belongs to its initialization generation. Storage clearing is synchronized; unrelated storage areas are ignored.                                                                                                                                                                               |
| F37–F38  | WebSocket construction failures update error/disconnected state without endless retry. New attempts and successful opens cancel obsolete reconnect deadlines.                                                                                                                                                |
| F39      | Save pickers are requested before network waits. Recoverable picker/share capability failures use download fallback, cancellations remain cancellations, and download URLs have a delayed cleanup window.                                                                                                    |
| F40      | Date helpers preserve numeric timestamp zero while still handling missing/invalid inputs.                                                                                                                                                                                                                    |
| F41      | Standard control/status icons are bundled SVGs. Custom icon class names remain an application-owned opt-in dependency.                                                                                                                                                                                       |
| F42      | The release validator packs a real tarball into a temporary directory, locates it independently of npm stdout, validates its bytes with publint, and removes the temporary archive. Test fixtures are excluded from published files.                                                                         |
| F43      | Repository formatting is corrected, with only the explicitly excluded draft TabBar omitted from Prettier.                                                                                                                                                                                                    |

The additional audit contracts are also resolved: README/API comments describe
CollapsibleCard snippet composition, accordion initialization, decorative/labelled
spinners and timers, zero-duration completion, WebSocket credential rotation and
normalized retry settings. Offline actions now carry replay URL/credentials and a
stable idempotency key; session scoping and server-side duplicate prevention remain
the application's responsibility. See [README](../README.md) for migration details.

## Verification

| Check              | Result                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm test`         | 131 tests across 14 files passed.                                                                                             |
| `npm run check`    | Zero errors and warnings.                                                                                                     |
| `npm run lint`     | Prettier and ESLint passed.                                                                                                   |
| `npm run build`    | Client/SSR builds, svelte-package and real-tarball publint validation passed.                                                 |
| `git diff --check` | Passed.                                                                                                                       |
| Excluded component | SHA-256 unchanged before/after formatting and validation: `df8bd84e6a2ef58014ca8cca3c0de2097742d19d5acc516ff202fffacea6e7f0`. |

Regression coverage includes cache isolation and hook errors, save-picker ordering
and fallbacks, toast callback reentrancy/replacement, GPS generations/recovery, theme
ownership/storage events, WebSocket retries/construction/credentials, DOM focus and
overlay stacking, carousel motion/failure behavior, scrolling observer cleanup, timer
semantics, and SSR rendering for all 16 in-scope component exports.

Tests use jsdom, fake timers, mocked browser APIs/GSAP and SSR rendering. Browser layout,
native pointer capture, screen-reader output and mobile save/share behavior still need
real-browser validation. The declared minimum Svelte version was not separately
installed/tested; checks use the existing Svelte 5.56.9 installation.
