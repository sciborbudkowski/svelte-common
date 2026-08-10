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



## 1.02 - 2026-08-10

### Added

- styles.css aggregates import of all css files

### Changed

- package.json exports styles.css properly


## 1.03 - 2026-08-10

### Fixed

- CSS color variables fixed for loader (colors)

# 1.04 - 2026-08-10

## Fixed

- CSS colors
- Modal has no more isOpen props and takes care of everything inside
- Removed export of closeAlertModal function and modalsState store

# 1.05 - 2026-08-10

## Added

- ConfirmModal and AlertModal
- buttons.css with button full default styling

## Fixed

- minor fixes in css colors
- Modal.svelte got optional prop for ConfirmModal and AlertModal