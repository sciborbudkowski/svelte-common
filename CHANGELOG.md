# Changelog

## 1.0.0 - 2026-08-10

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
