<!-- src/lib/ui/Modal.svelte -->
<script lang="ts">
	import { closeModal, modalsState, modalStack, registerModal, unregisterModal } from '$lib/stores/modal.svelte';
	import { untrack, type Snippet } from 'svelte';

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
		header?: Snippet;
		content?: Snippet;
		footer?: Snippet;
	} = $props();

	const modal = $derived(modalsState.customModal[id]);
	const controlled = $derived(open !== undefined);
	const isOpen = $derived(open ?? modal?.isOpen ?? false);
	const stackIndex = $derived(modalStack.indexOf(id));
	const isTopMost = $derived(stackIndex !== -1 && stackIndex === modalStack.length - 1);

	function close() {
		cancel();
	}

	function closeFromBackdrop(e: PointerEvent) {
		if (!isTopMost) return;
		if (e.target !== e.currentTarget) return;
		if (e.pointerType === 'touch') return;

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
	}

	function handleBackdropKeyDown(e: KeyboardEvent) {
		if (e.target !== e.currentTarget || !isTopMost) return;
		if (e.key == 'Enter' || e.key === ' ') {
			e.preventDefault();
			close();
		}
	}

	async function confirm() {
		const callback = onConfirm ?? modal?.onConfirm;
		await callback?.(modal?.context);
		if(!controlled) closeModal(id);
	}

	function cancel() {
		const callback = onCancel ?? modal?.onCancel;
		callback?.(modal?.context);
		if(!controlled) closeModal(id);
	}

	$effect(() => {
		const modalId = id;
		if (!isOpen) return;

		untrack(() => registerModal(modalId));

		return () => {
			untrack(() => unregisterModal(modalId));
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<div
		class="modal-backdrop mp-{position} {isTopMost ? 'is-topmost' : ''}"
		style={`--modal-depth: ${Math.max(stackIndex, 0)}`}
		onpointerdown={closeFromBackdrop}
		onkeydown={handleBackdropKeyDown}
		tabindex="-1"
		aria-modal="true"
		role="dialog"
	>
		<div class="modal-content {size} {fullHeight ? 'full-height' : ''}" role="document">
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
					<span><button type="button" onclick={cancel}>{cancelButtonLabel}</button></span>
					<span><button type="button" onclick={confirm}>{confirmButtonLabel}</button></span>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset:
			var(--sc-top-bar-height, 0px)
			0
			var(--sc-bottom-bar-height, 0px);
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
	.modal-backdrop.mp-left {
		justify-content: flex-start;
		align-items: center;
	}
	.modal-backdrop.mp-right {
		justify-content: flex-end;
		align-items: center;
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
		color: var(--sc-color-warning);
	}
	.modal-header.alert-success {
		background-color: var(--sc-color-success);
		color: var(--sc-color-on-success);
	}
	.modal-header.alert-success .button-close {
		color: var(--sc-color-success);
	}
	.modal-header.alert-info {
		background-color: var(--sc-color-info);
		color: var(--sc-color-on-info);
	}
	.modal-header.alert-info .button-close {
		color: var(--sc-color-info);
	}
	.modal-header .button-close {
		color: var(--sc-color-text);
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