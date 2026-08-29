<!-- src/lib/ui/Modal.svelte -->
<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import {
		closeModal,
		modalsState,
		modalStack,
		registerModal,
		unregisterModal
	} from '$lib/stores/modal.svelte';

	let {
		id,
		open = undefined,
		size = undefined,
		position = 'center',
		fullHeight = false,
		confirmButtonLabel = 'Potwierdź',
		cancelButtonLabel = 'Anuluj',
		headerClass = undefined,
		onConfirm = undefined,
		onCancel = undefined,
		onActionError = undefined,
		header,
		content,
		footer
	}: {
		id: string;
		open?: boolean;
		size?: 'wide' | 'narrow' | 'full' | undefined;
		position?: 'center' | 'top' | 'bottom' | undefined;
		fullHeight?: boolean;
		headerClass?: string;
		confirmButtonLabel?: string;
		cancelButtonLabel?: string;
		onConfirm?: (() => Promise<void> | void) | undefined;
		onCancel?: (() => void) | undefined;
		onActionError?: (error: unknown, action: 'confirm' | 'cancel') => void;
		header?: Snippet;
		content?: Snippet;
		footer?: Snippet;
	} = $props();

	const modal = $derived(modalsState.customModal[id]);
	const controlled = $derived(open !== undefined);
	const isOpen = $derived(open ?? modal?.isOpen ?? false);
	const stackIndex = $derived(modalStack.indexOf(id));
	const isTopMost = $derived(stackIndex !== -1 && stackIndex === modalStack.length - 1);

	const FOCUSABLE_SELECTOR = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(',');

	let dialogEl: HTMLDivElement | null = $state(null);
	let confirming = $state(false);
	let initialFocusApplied = false;

	function getFocusableElements(): HTMLElement[] {
		if (!dialogEl) return [];

		return Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
			(element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true'
		);
	}

	function close() {
		cancel();
	}

	function closeFromBackdrop(e: MouseEvent) {
		if (!isTopMost) return;
		if (e.target !== e.currentTarget) return;

		close();
	}

	function closeFromButton(e: Event) {
		e.stopPropagation();
		close();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen || !isTopMost) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}

		if (e.key !== 'Tab') return;

		const focusable = getFocusableElements();

		if (focusable.length === 0) {
			e.preventDefault();
			dialogEl?.focus();
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;

		if (!dialogEl?.contains(active)) {
			e.preventDefault();

			if (e.shiftKey) {
				last?.focus();
			} else {
				first?.focus();
			}

			return;
		}

		if (e.shiftKey && active === first) {
			e.preventDefault();
			last?.focus();
			return;
		}

		if (!e.shiftKey && active === last) {
			e.preventDefault();
			first?.focus();
		}
	}

	function reportActionError(error: unknown, action: 'confirm' | 'cancel'): void {
		if (onActionError) {
			try {
				onActionError(error, action);
			} catch (reportingError) {
				console.error('Modal error handler failed: ', reportingError);
			}

			return;
		}

		console.error(`Modal ${action} callback failed: `, error);
	}

	async function confirm() {
		if (confirming) return;
		confirming = true;

		try {
			const callback = onConfirm ?? modal?.onConfirm;
			await callback?.(modal?.context);
			if (!controlled) closeModal(id);
		} catch (error) {
			reportActionError(error, 'confirm');
		} finally {
			confirming = false;
		}
	}

	function cancel() {
		if (confirming) return;

		const callback = onCancel ?? modal?.onCancel;

		try {
			callback?.(modal?.context);
		} catch (error) {
			reportActionError(error, 'cancel');
		} finally {
			if (!controlled) closeModal(id);
		}
	}

	$effect(() => {
		const modalId = id;
		if (!isOpen) return;

		const previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;

		untrack(() => registerModal(modalId));

		return () => {
			const wasTopMost = untrack(() => modalStack.at(-1) === modalId);

			untrack(() => unregisterModal(modalId));

			if (!wasTopMost) return;

			void tick().then(() => {
				if (previouslyFocused?.isConnected) {
					previouslyFocused.focus();
				}
			});
		};
	});

	$effect(() => {
		if (!isOpen) {
			initialFocusApplied = false;
			return;
		}

		if (!isTopMost || initialFocusApplied) return;

		initialFocusApplied = true;

		let cancelled = false;

		void tick().then(() => {
			if (cancelled || !isOpen || !isTopMost) return;

			const autofocus = dialogEl?.querySelector<HTMLElement>('[autofocus]');
			const target = autofocus ?? getFocusableElements()[0] ?? dialogEl;
			target?.focus();
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (backdrop click is a shortcut) -->
	<div
		class="modal-backdrop mp-{position} {isTopMost ? 'is-topmost' : ''}"
		style={`--modal-depth: ${Math.max(stackIndex, 0)}`}
		onclick={closeFromBackdrop}
	>
		<div
			bind:this={dialogEl}
			class="modal-content {size} {fullHeight ? 'full-height' : ''}"
			role="dialog"
			aria-modal={isTopMost}
			aria-hidden={!isTopMost}
			inert={!isTopMost}
			tabindex="-1"
		>
			<div class="modal-header {headerClass}">
				{@render header?.()}
				<button type="button" class="button-close" aria-label="Zamknij" onclick={closeFromButton}>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
			<div class="modal-body">{@render content?.()}</div>
			<div class="modal-footer">
				{#if footer}
					{@render footer()}
				{:else}
					<span
						><button type="button" class="outline neutral" onclick={cancel} disabled={confirming}
							>{cancelButtonLabel}</button
						></span
					>
					<span
						><button type="button" class="brand" onclick={confirm} disabled={confirming}
							>{confirmButtonLabel}</button
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
		color: var(--sc-color-modal-header-text);
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
