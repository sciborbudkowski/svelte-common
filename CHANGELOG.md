# Changelog

# 1.0.0 - 2026-08-10

### Changed

- Stabilized public Svelte component API.
- Made HTML sanitization SSR-safe.
- Improved WebSocket reconnect and disconnect handling.
- Fixed API response content-type handling.
- Added TTL-based ephemeral storage.
- Cleaned up browser-safe file type detection.

### Fixed

- Prevented unsafe raw HTML rendering in toast content.
- Fixed GPS high-accuracy option.
- Fixed carousel edge cases and CSS typos.

## 1.0.1 - 2026-08-10

### Added

- CHANGELOG.md added to avoid long commit messages.

## 1.0.2 - 2026-08-10

### Added

- styles.css aggregates import of all css files

### Changed

- package.json exports styles.css properly

## 1.0.3 - 2026-08-10

### Fixed

- CSS color variables fixed for loader (colors)

# 1.0.4 - 2026-08-10

## Fixed

- CSS colors
- Modal has no more isOpen props and takes care of everything inside
- Removed export of closeAlertModal function and modalsState store

# 1.0.5 - 2026-08-10

## Added

- ConfirmModal and AlertModal
- buttons.css with button full default styling
- reset.css with modern settings
- styles.css has added layers to imports

## Fixed

- minor fixes in CSS colors
- Modal.svelte got optional prop for ConfirmModal and AlertModal
- alert and button colors
- fixed CSS classes and layout in CollapsibleCard
- all CSS variables have the same --sc prefix
- hr reset
- AccordionItem CSS classes
- button groups CSS classes
- ConfirmModal internal id

# 1.0.6

## Added

- button-group css class
- modalStack to control the topmost opened modal
- indent CSS class
- CSS classes for sizing buttons
- switchable checkbox
- forms styling
- font weight CSS classes
- section margin value
- CSS class for aplying default border radius, for global center in the view

## Changed

- upgrade to Vite 8
- libraries upgraded

## Fixed

- gps.svelte.ts uses esm-env instead of $app/env (deprecated)
- no-indent CSS class

## Removed

- Lenis

# 1.0.7

## Added

- Spinner component (very simple for now)

# 1.0.8

## Changed

- api client changed from functions into class

## Fixed

- api client file download fixed and integrated into ApiClient class
- some arrow functions at modal and loader do not return any value anymore
- --sc-color-brand default set to transparent instead to itself
- fixed undefined CSS variables
- Carousel import gsap fixed, animateTransition returns boolean, slides and buttons have unique ids
- CircularTimer uses only one timer based on requestAnimationFrame
- toaststack toast ids and timers cleaning
- CollapsibleCard chevron position 'bottom' removed, label fixed
- removed double .fw-* CSS classes
- gps dispose fixed
- loader, modal and toaststack have require browser guard
- api client differs abort from network error
- Modal onpointerdown on backdrop replaced with onclick
- ConfirmModal disables buttons while making operation
- gps gets proper error descriptions at error callback
- websocket url creating fixed
- EphemeralStorage has guard for browser
- app-id has guard for browser and returns new or existing appId
- api client download file method fallback fixed, filename cleans unwanted characters

## Changed

- .gitignore updated

## 1.1.0

### Added

- Added request-aware API cache keys and cache invalidation hooks for successful mutations.
- Added stable offline action identifiers, creation timestamps, preserved headers and bodies, and optional idempotency keys.
- Added modal focus management, focus trapping, focus restoration, document scroll locking, and action error reporting.
- Exported `closeAlertModal` and `closeConfirmModal` from the package entry point.

### Changed

- Made offline request queuing explicitly opt-in and limited persisted request bodies to safely replayable strings.
- Hardened browser-only loader, modal, toast, storage, and application identity APIs for SSR environments.
- Normalized carousel, circular timer, and toast durations and consolidated toast dismissal into a single timeout owner.
- Made ephemeral storage a best-effort utility that safely tolerates unavailable, malformed, or failing browser storage.

### Fixed

- Fixed API download cancellation handling, filename sanitization, save picker and share cancellation, fallback anchor cleanup, and delayed object URL revocation.
- Fixed API header merging, JSON serialization failures, cache error isolation, and offline request replay metadata.
- Fixed modal stacking, topmost modal behavior, duplicate confirmation settlement, body scroll restoration, repeated confirmation actions, and close button colors.
- Fixed carousel behavior for empty and single-slide inputs, invalid timeouts, failed transitions, asynchronous GSAP cleanup, and stable slide navigation keys.
- Fixed circular timer cleanup and synchronous or asynchronous timeout callback failures.
- Fixed toast ID collisions, stale timeout cleanup, queue limit cleanup, and invalid durations.
- Fixed `CollapsibleCard` browser-safe IDs, toggle handlers, labels, ARIA relationships, and footer rendering.
- Fixed application identity and ephemeral storage failures caused by unavailable browser storage.
- Fixed AVIF extension detection, the `SizeView` default border color, and several CSS variable and selector inconsistencies.

### Removed

- Removed unused Vitest example files and dead modal position selectors.

## 1.1.1

### Added

- isModalOpen reactive selector to determine modal is visible or closed

### Fixed

- ApiClient get<T> method returns ApiHttpResponse to avoid queue
- ApiClient queue is optional and must be run locally for single request

## 1.1.2

### Added

- dark mode token definitions

### Fixed

- dark mode init and switch support
