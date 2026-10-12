# Documentation

These guides describe the current source tree of `svelte-common` version `1.2.0`.
The public package surface is defined by [src/lib/index.ts](../src/lib/index.ts).
Import supported APIs from `svelte-common`; import shared CSS from
`svelte-common/styles.css`, `svelte-common/styles-without-reset.css`,
`svelte-common/tokens.css` or `svelte-common/reset.css`. Individual components, services, stores, utilities and CSS modules also have
[explicit public subpaths](selective-imports.md).

## Guides

- [Getting started](getting-started.md)
- [Components](components.md)
- [Modals and feedback](overlays-and-feedback.md)
- [Services](services.md)
- [Stores](stores.md)
- [Utilities](utilities.md)
- [Styling](styling.md)
- [CSS token reference](css-reference.md)
- [Development](development.md)
- [Selective imports and bundles](selective-imports.md)
- [Licensing](licensing.md)
- [GitHub Actions CI](github-actions.md)
- [Migration and troubleshooting](migration-and-troubleshooting.md)
- [API migration](api-migration.md) (implemented contracts and compatibility)
- [Original API flexibility design guide](api-flexibility-guide.md)

## Public API map

| Exports                                                                                                                                                                                                                                                      | Reference                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `Accordion`, `AccordionItem`                                                                                                                                                                                                                                 | [Accordion](components.md#accordion-and-accordionitem) |
| `Avatar`                                                                                                                                                                                                                                                     | [Avatar](components.md#avatar)                         |
| `Carousel`                                                                                                                                                                                                                                                   | [Carousel](components.md#carousel)                     |
| `CircularTimer`                                                                                                                                                                                                                                              | [CircularTimer](components.md#circulartimer)           |
| `CollapsibleCard`                                                                                                                                                                                                                                            | [CollapsibleCard](components.md#collapsiblecard)       |
| `FloatingButton`                                                                                                                                                                                                                                             | [FloatingButton](components.md#floatingbutton)         |
| `Spinner`                                                                                                                                                                                                                                                    | [Spinner](components.md#spinner)                       |
| `ScrollHint`, `ScrollIndicator`                                                                                                                                                                                                                              | [Scrolling](components.md#scrollhint)                  |
| `SizeView`                                                                                                                                                                                                                                                   | [SizeView](components.md#sizeview)                     |
| `Modal`, `openModal`, `closeModal`, `getModalContext`, `isModalOpen`, `setModalScrollLockTarget`                                                                                                                                                             | [Modals](overlays-and-feedback.md#modal)               |
| `AlertModal`, `openAlertModal`, `closeAlertModal`                                                                                                                                                                                                            | [Alerts](overlays-and-feedback.md#alertmodal)          |
| `ConfirmModal`, `requestConfirmation`, `openConfirmModal`, `closeConfirmModal`                                                                                                                                                                               | [Confirmations](overlays-and-feedback.md#confirmmodal) |
| `Loader`, `loaderState`, `LoaderStep`, `showLoader`, `hideLoader`, `updateLoaderProgress`, `updateLoaderMessage`, `showLoaderSequence`                                                                                                                       | [Loader](overlays-and-feedback.md#loader)              |
| `ToastStack`, `UIToast`, `UIToastType`, `ToastCloseReason`, `showToast`, `showSuccessToast`, `showErrorToast`, `dismissToast`, `clearToasts`, `getVisibleToasts`, `getToastGeneration`                                                                       | [Toasts](overlays-and-feedback.md#toaststack)          |
| `ApiClient`, `ApiClientOptions`, `ApiResponseOk`, `ApiResponseError`, `ApiHttpResponse`, `ApiQueuedResponse`, `ApiResponse`, `ApiDownloadResponse`, `DownloadOptions`, `ApiRequestInit`, `DirectApiRequestInit`, `QueuedApiRequestInit`, `ApiResponseParser` | [HTTP client](services.md#apiclient)                   |
| `CacheAdapter`, `ApiCacheOptions`, `ApiCacheKeyContext`, `ApiCacheMutationContext`                                                                                                                                                                           | [Cache](services.md#cache)                             |
| `OfflineMethod`, `OfflineAction`, `OfflineQueueAdapter`                                                                                                                                                                                                      | [Offline queue](services.md#offline-queue)             |
| `WebSocketClient`, `SocketStatus`                                                                                                                                                                                                                            | [WebSockets](services.md#websocketclient)              |
| `EphemeralStorage`                                                                                                                                                                                                                                           | [Storage](services.md#ephemeralstorage)                |
| `THEME_STORAGE_KEY`, `ThemePreference`, `ResolvedTheme`, `ThemeState`, `themeState`, `initializeTheme`, `destroyTheme`, `setTheme`, `toggleTheme`, `useSystemTheme`                                                                                          | [Theme](stores.md#theme)                               |
| `Gps`, `GpsPosition`, `GpsCoords`, `GpsMode`, `GpsState`, `GpsOptions`                                                                                                                                                                                       | [GPS](stores.md#gps)                                   |
| `setupAppIdentity`                                                                                                                                                                                                                                           | [Identity](utilities.md#application-identity)          |
| `formatDate`, `toYMDHMDate`, `toHMSTime`, `getDistanceToNow`, `formatDateDifference`, `getTimeDifference`                                                                                                                                                    | [Dates](utilities.md#dates)                            |
| `cssVarRgb`, `rgba`, `readThemeColors`                                                                                                                                                                                                                       | [CSS readers](utilities.md#css-color-readers)          |
| `textToHtml`, `friendlyFileSize`                                                                                                                                                                                                                             | [Text](utilities.md#text-and-file-size)                |
| `generateToken`, `generateSha`                                                                                                                                                                                                                               | [Tokens](utilities.md#tokens-and-hashes)               |
| `isImageFile`, `isVideoFile`                                                                                                                                                                                                                                 | [Files](utilities.md#file-classification)              |
| `Gender`, `PolishDictionary`, `createPolish`                                                                                                                                                                                                                 | [Language](utilities.md#polish-language-helper)        |
| `scrollToTarget`                                                                                                                                                                                                                                             | [Scrolling](utilities.md#scrolling)                    |

Named component prop types, Slide, UISize and state/reason/part types are now
root exports. ComponentProps<typeof Component> remains supported for inference. Internal modal state, stack
registration, focus helpers, overlay helpers, accordion context and `Icon` are
implementation details, even where their source modules export a symbol.

## Migration exports

| Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Reference                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Dialog`, `ManagedModal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | [Dialogs](api-migration.md#dialog-and-managed-modal-apis)                         |
| `LoaderView`, `ToastStackView`, `ManagedLoader`, `ManagedToastStack`                                                                                                                                                                                                                                                                                                                                                                                                                      | [Independent feedback](api-migration.md#independent-feedback-renderers)           |
| `FloatingAction`, `FloatingLink`                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [Native floating controls](api-migration.md#carousel-and-floating-controls)       |
| `Slide`, `UISize`, `CarouselLabels`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [Component contracts](api-migration.md#native-props-composition-and-public-types) |
| `TriggerState`, `ChangeDetails`, `ChangeHandler`, `OpenChangeDetails`, `AccordionChangeDetails`, `CarouselIndexChangeDetails`, `CarouselPauseChangeDetails`, `DragPosition`, `DragPositionChangeDetails`, `ButtonPartProps`, `PanelPartProps`                                                                                                                                                                                                                                             | [State and parts](api-migration.md#native-props-composition-and-public-types)     |
| `CarouselProps`, `CircularTimerProps`, `FloatingButtonProps`, `LoaderProps`, `LoaderViewProps`, `ModalProps`, `DialogProps`, `ManagedModalProps`, `AlertModalProps`, `ConfirmModalProps`, `ToastStackProps`, `ToastStackViewProps`, `CollapsibleCardProps`, `AccordionProps`, `AccordionItemProps`, `AvatarProps`, `SpinnerProps`, `ScrollHintProps`, `ScrollIndicatorProps`, `SizeViewProps`, `ManagedLoaderProps`, `ManagedToastStackProps`, `FloatingActionProps`, `FloatingLinkProps` | [Named prop types](../src/lib/ui/types.ts)                                        |

## Documentation conventions

Props are optional unless marked required. Defaults match the implementation;
`undefined` means omitted. Durations are milliseconds unless identified as CSS
duration strings. Examples target Svelte 5 snippets and callback props.

Reference pages link to source for implementation details. Historical audit reports
are snapshots and should not be used as current API specifications. Update guides
and examples alongside public API changes.
