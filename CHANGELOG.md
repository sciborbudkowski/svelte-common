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

- minor fixes in css colors
- Modal.svelte got optional prop for ConfirmModal and AlertModal
- alert and button colors
- fixed CSS classes and layout in CollapsibleCard
- all CSS variables have the same --sc prefix

# 1.0.6

## Changed

- upgrade to Vite 8
- libraries upgraded

## Fixed

- gps.svelte.ts uses esm-env instead of $app/env (deprecated)
