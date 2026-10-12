# Migration and troubleshooting

[Documentation index](README.md) · [Audit fix status](component-audit-fixes-2026-10-10.md)

The [API migration guide](api-migration.md) covers subsequent controlled-state,
attribute-forwarding and independent-renderer changes.

## Migrating from behavior before the October 2026 audit fixes

These describe changes in the current working tree; they are not a claim that a
separate release version has already been published.

| Area              | Integration change                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Svelte peer       | Minimum is now 5.25 within Svelte 5 because of APIs used by the components.                                                                                                                                    |
| Private API cache | Default credential-bearing requests skip cache without scope/custom key. Add a non-secret session scope, rotate it on account/authorization changes and clear old unscoped private entries.                    |
| Offline actions   | New records carry joined URL and credentials. Migrate old persisted actions before replay. Default stable Idempotency-Key is sent on the initial attempt; server support is required for duplicate prevention. |
| Save flow         | Picker can appear before the network response. Supply suggestedName for the early prompt; Content-Disposition cannot determine the already chosen handle's name.                                               |
| AccordionItem     | isOpen is an initialization alias, not a permanent open override; prefer defaultOpen. Parent policy controls later state.                                                                                      |
| Toast callbacks   | onClose receives a removal reason on every removal path, including replacement, eviction and clearing. Callbacks that ignore arguments still work. Avoid assuming only manual dismissal invokes them.          |
| Avatar            | Image alt defaults to decorative empty text; supply meaningful alt when needed. Class/style now combine with component sizing.                                                                                 |
| Icons             | Standard controls bundle SVGs. Existing custom icon-font class props still need their external stylesheet; toast icon is text.                                                                                 |
| Floating position | Keys use the actual ID. Old shared malformed keys are ignored; users may need to drag again.                                                                                                                   |
| WebSocket init    | Changing token/UUID replaces an active/retrying connection immediately. Retry settings are normalized and constructor failures disable automatic retry.                                                        |
| Overlay focus     | Background branches become inert and programmatic focus is contained. Keep popup interactions inside the active dialog's DOM subtree; arbitrary external portals are not a declared integration API.           |
| CircularTimer     | Nonpositive/nonfinite duration completes asynchronously with a callback, rather than silently disabling timing. Omit/unmount the timer to disable it.                                                          |
| Layout heights    | Use CSS lengths for top/bottom bar variables, including 0px.                                                                                                                                                   |

See [services](services.md), [components](components.md) and
[modals and feedback](overlays-and-feedback.md) for complete contracts.

## Integration problems

| Symptom                                                | Check / resolution                                                                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components appear unstyled                             | Import `svelte-common/styles.css` once; verify global tokens are available and not overridden with invalid values.                                                     |
| Application buttons/inputs changed                     | The stylesheet includes global element styling/reset. Review layers and application overrides rather than assuming styles are component-only.                          |
| Importing an internal file fails                       | Only the root and documented CSS entry points are package exports. Use root imports or ComponentProps-derived types.                                                   |
| Svelte compiler rejects derived assignment/props ID    | Ensure consumer Svelte satisfies ^5.25.0. Plain Node cannot compile root Svelte exports by itself.                                                                     |
| Confirmation promise never settles                     | Mount one ConfirmModal. Without a renderer/user response or programmatic close, a request can remain pending.                                                          |
| Alert/toast/loader not visible                         | Mount its singleton renderer and invoke its browser action after mount/from an event. Store mutation alone does not supply UI.                                         |
| Browser-only action throws during SSR                  | Move it to onMount/event handlers; avoid mutating shared UI state during server rendering.                                                                             |
| Controlled Modal refuses to close                      | Update your parent-owned open value in callbacks. It is not bindable and store close cannot override it.                                                               |
| Modal stays open after confirmation failure            | Intended retry behavior. Supply onActionError/log feedback, correct the action, or close programmatically.                                                             |
| Background link/widget cannot receive focus            | Active modal/loader isolates background with inert. Finish/close the owning overlay or render relevant content within it.                                              |
| Modal locks the wrong scroll container                 | SetModalScrollLockTarget must receive your actual scrolling element; null selects body. Reset it on layout cleanup.                                                    |
| Loader hides unexpectedly after manual concurrent work | Sequence run IDs guard sequence ownership; direct show/hide/update calls still share one singleton. Coordinate independent manual operations.                          |
| More than five toasts disappear                        | The queue is capped at five and evicts oldest entries with an evicted callback.                                                                                        |
| Same-ID toast callback runs during update              | The old instance is replaced and receives replaced; the new one has a fresh lifecycle/timers.                                                                          |
| Floating buttons share a position                      | Give independently movable buttons distinct stable IDs. The storage key depends on ID.                                                                                 |
| Carousel buttons do not navigate routes                | Their target is a DOM selector/top marker for scrollToTarget, not a URL/router action.                                                                                 |
| Carousel does not rotate                               | Check slide count, autoplay, reduced motion, hover and persistent focus pause. Use Resume after focus pause; check console for animation initialization failure.       |
| ScrollIndicator is absent                              | It needs a non-null overflowing target and hover/fine-pointer media matching. Auto-hide defaults true. It is intentionally absent on touch-only devices.               |
| ScrollHint sits outside its target                     | It is fixed to the viewport center/bottom offset; target changes measurement, not placement.                                                                           |
| Private offline GET has no cache fallback              | Supply scope/getKey, use the same adapter/scope as the successful request, and check TTL. Only thrown fetch failures use fallback; HTTP errors do not.                 |
| API marks a normal REST response invalid               | The default parser expects the JSON error/data envelope. Supply parseResponse for another protocol or 204 responses.                                                   |
| Queue result has no data                               | queued:true is accepted for replay, not a server success. Narrow error, then queued, before accessing data.                                                            |
| Offline requests never replay                          | The library supplies only enqueue. Implement persistent adapter/replay worker, session ownership and server idempotency.                                               |
| WebSocket remains disconnected                         | Set nonempty token/UUID, call init then connect after mount, inspect state.error, and verify server URL/authentication. init alone does not perform the first connect. |
| Socket stops automatic attempts                        | Constructor errors disable retry; unexpected closes respect retry limits/visibility. Correct configuration or manually reconnect.                                      |
| GPS coordinates look old                               | Coordinates persist after stop/error. Check active, updatedAt, accuracy and error; verify permission and release ownership.                                            |
| Theme does not follow the OS                           | Initialize theme listeners and select system preference. Toggle chooses an explicit light/dark preference.                                                             |
| Initial light flash                                    | Apply the documented startup theme script in app.html head before initialization.                                                                                      |
| Storage write appears successful but no data remains   | EphemeralStorage is best effort; storage can be blocked/full or value serialization can fail. It does not report write success.                                        |

## Current limits

`CollapsibleTabBar` is unfinished, has placeholder rendering and unresolved state/
CSS/timer behavior. It was deliberately excluded from the audit fixes and is now excluded from public
exports and the packed package. Do not rely
on it as a complete tab system; document any application experimentation separately.

The source does not declare a tested browser matrix. The prior verification uses
unit tests, jsdom, mocks, SSR and build checks, not proof of native browser layout,
screen-reader output or mobile save/share behavior. Validate those flows on the
application's target devices. There is no global localization provider, automatic
WebSocket heartbeat/message buffer, offline replay worker or image upload validator.

See [selective imports](selective-imports.md) for the new public subpaths and removal
of the unfinished CollapsibleTabBar export. Its source file remains in the repository.
