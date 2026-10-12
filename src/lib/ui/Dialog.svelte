<script lang="ts">
	import { onDestroy, tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { canReceiveFocus, getTabbableElements } from '../utils/focus.ts';
	import {
		registerOverlay,
		isActiveOverlay,
		containsActiveOverlay
	} from '../utils/overlays.svelte.ts';
	import { modalStack, registerModal, unregisterModal } from '../stores/modal.svelte.ts';
	import { createControllableState } from './internal/controllable.svelte.ts';
	import type { OpenChangeDetails, ChangeHandler, ButtonPartProps } from './contracts.ts';
	import Icon from './internal/Icon.svelte';
	import { syncInert } from './internal/inert.ts';
	const componentId = $props.id();
	let {
		id = componentId,
		open,
		defaultOpen = false,
		onOpenChange,
		openingKey,
		busy = false,
		disabled = false,
		ariaLabel,
		ariaLabelledby,
		size = 'wide',
		position = 'center',
		fullHeight = false,
		confirmButtonLabel = 'Potwierdź',
		cancelButtonLabel = 'Anuluj',
		closeLabel = 'Zamknij',
		headerClass,
		onConfirm,
		onCancel,
		onActionError,
		closeIcon,
		header,
		content,
		children,
		footer,
		backdropProps = {},
		headerProps = {},
		bodyProps = {},
		footerProps = {},
		closeButtonProps = {},
		confirmButtonProps = {},
		cancelButtonProps = {},
		class: cssClass,
		style,
		...rest
	}: Omit<
		HTMLAttributes<HTMLDivElement>,
		'children' | 'role' | 'aria-modal' | 'aria-busy' | 'aria-hidden' | 'inert' | 'tabindex'
	> & {
		id?: string;
		open?: boolean;
		defaultOpen?: boolean;
		onOpenChange?: ChangeHandler<boolean, OpenChangeDetails>;
		openingKey?: unknown;
		busy?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		ariaLabelledby?: string;
		size?: 'wide' | 'narrow' | 'full';
		position?: 'center' | 'top' | 'bottom';
		fullHeight?: boolean;
		confirmButtonLabel?: string;
		cancelButtonLabel?: string;
		closeLabel?: string;
		headerClass?: string;
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
		onActionError?: (error: unknown, action: 'confirm' | 'cancel') => void;
		closeIcon?: Snippet;
		header?: Snippet;
		content?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		backdropProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
		headerProps?: HTMLAttributes<HTMLDivElement>;
		bodyProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
		footerProps?: HTMLAttributes<HTMLDivElement>;
		closeButtonProps?: ButtonPartProps;
		confirmButtonProps?: ButtonPartProps;
		cancelButtonProps?: ButtonPartProps;
	} = $props();
	const openState = createControllableState<boolean, OpenChangeDetails>({
		value: () => open,
		defaultValue: () => defaultOpen,
		onChange: (next, details) => onOpenChange?.(next, details)
	});
	const isOpen = $derived(openState.value);
	const stackIndex = $derived(modalStack.indexOf(id));
	const isTopMost = $derived(stackIndex !== -1 && stackIndex === modalStack.length - 1);
	const titleId = `${componentId}-title`;
	let dialogEl: HTMLDivElement | null = $state(null);
	let backdropEl: HTMLDivElement | null = $state(null);
	type Action = { id: string; key: unknown; generation: number };
	let confirmingAction = $state.raw<Action | null>(null);
	let generation = 0;
	let destroyed = false;
	const actionPending = $derived(
		busy ||
			disabled ||
			(confirmingAction !== null &&
				confirmingAction.id === id &&
				confirmingAction.key === openingKey)
	);
	onDestroy(() => {
		destroyed = true;
		confirmingAction = null;
	});
	function owns(action: Action): boolean {
		return (
			!destroyed &&
			isOpen &&
			id === action.id &&
			openingKey === action.key &&
			generation === action.generation
		);
	}
	function canAct(): boolean {
		return !actionPending && isOpen && isTopMost && isActiveOverlay(backdropEl);
	}
	function report(error: unknown, action: 'confirm' | 'cancel'): void {
		try {
			if (onActionError) onActionError(error, action);
			else console.error(`Modal ${action} callback failed: `, error);
		} catch (failure) {
			console.error('Modal error handler failed: ', failure);
		}
	}
	async function confirm(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (!canAct() || confirmButtonProps.disabled) return;
		confirmButtonProps.onclick?.(event);
		if (event.defaultPrevented) return;
		const action: Action = { id, key: openingKey, generation };
		confirmingAction = action;
		try {
			await onConfirm?.();
			if (owns(action) && confirmingAction === action)
				openState.request(false, { reason: 'confirm', event });
		} catch (error) {
			report(error, 'confirm');
		} finally {
			if (confirmingAction === action) confirmingAction = null;
		}
	}
	function cancel(reason: OpenChangeDetails['reason'], event?: Event) {
		if (!canAct()) return;
		const action: Action = { id, key: openingKey, generation };
		try {
			onCancel?.();
		} catch (error) {
			report(error, 'cancel');
		} finally {
			if (owns(action)) openState.request(false, { reason, event });
		}
	}
	function closeFromButton(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (!canAct() || closeButtonProps.disabled) return;
		closeButtonProps.onclick?.(event);
		if (event.defaultPrevented) return;
		event.stopPropagation();
		cancel('close-button', event);
	}
	function cancelFromButton(
		event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
	) {
		if (!canAct() || cancelButtonProps.disabled) return;
		cancelButtonProps.onclick?.(event);
		if (!event.defaultPrevented) cancel('cancel', event);
	}
	function closeFromBackdrop(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		backdropProps.onclick?.(event);
		if (!event.defaultPrevented && event.target === event.currentTarget) cancel('backdrop', event);
	}
	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen || !isTopMost || !isActiveOverlay(backdropEl) || event.defaultPrevented) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			cancel('escape', event);
		}
		// Actual DOM events are already trapped by the document overlay guard.
		if (event.key === 'Tab' && dialogEl) {
			const candidates = getTabbableElements(dialogEl);
			const current = candidates.indexOf(document.activeElement as HTMLElement);
			const target =
				current === -1
					? event.shiftKey
						? candidates.at(-1)
						: candidates[0]
					: candidates[
							(current + (event.shiftKey ? -1 : 1) + candidates.length) % candidates.length
						];
			event.preventDefault();
			(target ?? dialogEl).focus();
		}
	}
	$effect(() => {
		void openingKey;
		void id;
		if (!isOpen) confirmingAction = null;
		generation++;
	});
	$effect(() => {
		const modalId = id;
		if (!isOpen) return;
		untrack(() => registerModal(modalId, dialogEl));
		return () => untrack(() => unregisterModal(modalId));
	});
	$effect(() => {
		const backdrop = backdropEl,
			dialog = dialogEl;
		if (!isOpen || !backdrop || !dialog) return;
		return untrack(() => registerOverlay(backdrop, dialog));
	});
	let initialFocusApplied = false;
	$effect(() => {
		if (!isOpen) {
			initialFocusApplied = false;
			return;
		}
		if (!isTopMost || !isActiveOverlay(backdropEl) || initialFocusApplied) return;
		let cancelled = false;
		void tick().then(() => {
			if (cancelled || !isOpen || !isTopMost || !isActiveOverlay(backdropEl)) return;
			const autofocus = dialogEl?.querySelector<HTMLElement>('[autofocus]');
			const target =
				autofocus && canReceiveFocus(autofocus)
					? autofocus
					: (dialogEl && getTabbableElements(dialogEl)[0]) || dialogEl;
			target?.focus();
			initialFocusApplied = true;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />
{#if isOpen}
	<div
		{...backdropProps}
		bind:this={backdropEl}
		class={['modal-backdrop', `mp-${position}`, isTopMost && 'is-topmost', backdropProps.class]}
		style={`--modal-depth: ${Math.max(stackIndex, 0)}; ${backdropProps.style ?? ''}`}
		onclick={closeFromBackdrop}
	>
		<div
			{...rest}
			{id}
			bind:this={dialogEl}
			class={['modal-content', size, fullHeight && 'full-height', cssClass]}
			{style}
			data-state="open"
			data-disabled={disabled || undefined}
			role="dialog"
			aria-label={rest['aria-label'] ??
				ariaLabel ??
				(!header && !ariaLabelledby && !rest['aria-labelledby'] ? 'Dialog' : undefined)}
			aria-labelledby={rest['aria-labelledby'] ??
				ariaLabelledby ??
				(!rest['aria-label'] && !ariaLabel && header ? titleId : undefined)}
			aria-busy={actionPending}
			aria-modal={isTopMost && isActiveOverlay(backdropEl)}
			aria-hidden={!isTopMost && !containsActiveOverlay(dialogEl)}
			inert={!isTopMost && !containsActiveOverlay(dialogEl) ? true : undefined}
			use:syncInert={!isTopMost && !containsActiveOverlay(dialogEl)}
			tabindex="-1"
		>
			<div {...headerProps} class={['modal-header', headerProps.class ?? headerClass]}>
				<div id={titleId}>{@render header?.()}</div>
				<button
					{...closeButtonProps}
					type="button"
					class={['button-close', closeButtonProps.class]}
					aria-label={closeButtonProps['aria-label'] ?? closeLabel}
					onclick={closeFromButton}
					disabled={actionPending || closeButtonProps.disabled}
				>
					{#if closeIcon}{@render closeIcon()}{:else}<Icon name="close" />{/if}
				</button>
			</div>
			<div {...bodyProps} class={['modal-body', bodyProps.class]}>
				{@render (content ?? children)?.()}
			</div>
			<div {...footerProps} class={['modal-footer', footerProps.class]}>
				{#if footer}{@render footer()}{:else}
					<span
						><button
							{...cancelButtonProps}
							type="button"
							class={['outline', 'neutral', cancelButtonProps.class]}
							onclick={cancelFromButton}
							disabled={actionPending || cancelButtonProps.disabled}>{cancelButtonLabel}</button
						></span
					>
					<span
						><button
							{...confirmButtonProps}
							type="button"
							class={['brand', confirmButtonProps.class]}
							onclick={confirm}
							disabled={actionPending || confirmButtonProps.disabled}>{confirmButtonLabel}</button
						></span
					>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: var(--sc-top-bar-height, 0px) 0 var(--sc-bottom-bar-height, 0px);
		box-sizing: border-box;
		padding: var(--size-3);
		overflow: hidden;
		background-color: var(--sc-modal-backdrop);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: calc(var(--zi-modal-base) + var(--modal-depth, 0));
		pointer-events: auto;
		opacity: 1;
	}
	.modal-backdrop.mp-center {
		justify-content: center;
		align-items: center;
	}
	.modal-backdrop.mp-top {
		justify-content: center;
		align-items: flex-start;
	}
	.modal-backdrop.mp-bottom {
		justify-content: center;
		align-items: flex-end;
	}
	.modal-backdrop:not(.is-topmost) {
		backdrop-filter: none;
	}

	.modal-content {
		--modal-width: clamp(18rem, 55vw, 55rem);
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: min(100%, var(--modal-width));
		max-height: 100%;
		padding: 0;
		box-shadow: var(--sc-modal-content-shadow);
		pointer-events: auto;
		border-radius: var(--radius-2);
		overflow: hidden;
	}
	.modal-content.wide {
		--modal-width: clamp(18rem, 90vw, 90rem);
	}
	.modal-content.narrow {
		--modal-width: clamp(18rem, 30vw, 32rem);
	}
	.modal-content.full {
		--modal-width: 100%;
		height: 100%;
	}
	.modal-content.full-height {
		height: 100%;
	}

	@media (max-width: 768px) {
		.modal-backdrop {
			padding: var(--size-2);
		}
	}

	.modal-header,
	.modal-footer {
		flex: 0 0 auto;
	}
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--size-2) var(--size-3);
		color: var(--sc-modal-header-text);
		background-color: var(--sc-modal-header-bg);
		font-size: var(--size-4);
		font-weight: 400;
		gap: var(--size-2);
	}
	.modal-header.alert-error {
		background-color: var(--sc-color-danger);
		color: var(--sc-color-on-danger);
	}
	.modal-header.alert-error .button-close {
		color: var(--sc-color-on-danger);
	}
	.modal-header.alert-warning {
		background-color: var(--sc-color-warning);
		color: var(--sc-color-on-warning);
	}
	.modal-header.alert-warning .button-close {
		color: var(--sc-color-on-warning);
	}
	.modal-header.alert-success {
		background-color: var(--sc-color-success);
		color: var(--sc-color-on-success);
	}
	.modal-header.alert-success .button-close {
		color: var(--sc-color-on-success);
	}
	.modal-header.alert-info {
		background-color: var(--sc-color-info);
		color: var(--sc-color-on-info);
	}
	.modal-header.alert-info .button-close {
		color: var(--sc-color-on-info);
	}
	.modal-header .button-close {
		color: var(--sc-modal-header-button-text, var(--sc-modal-header-text));
		border: none;
		background-color: transparent;
		font-size: var(--size-5);
		padding: 0;
		box-shadow: none;
		cursor: pointer;
	}

	.modal-body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
		padding: var(--size-3);
		background-color: var(--sc-modal-body-bg);
		font-family: var(--sc-font-body);
		overflow-wrap: anywhere;
	}
	.modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--size-2) var(--size-3);
		background-color: var(--sc-modal-footer-bg);
	}
	.modal-footer button {
		min-width: 100px;
	}

	@media (max-width: 768px) {
		.modal-header {
			font-size: var(--size-3) !important;
		}
	}
</style>
