<!-- src/lib/ui/Modal.svelte -->
<script lang="ts">
	import { closeModal, modalsState } from '$lib/stores/modal.svelte';
	import type { Snippet } from 'svelte';

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

	function close() {
		cancel();
	}

	function closeFromBackdrop(e: PointerEvent) {
		if (e.target !== e.currentTarget) return;
		if (e.pointerType === 'touch') return;
		close();
	}

	function closeFromButton(e: Event) {
		e.stopPropagation();
		close();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') close();
	}

	function handleBackdropKeyDown(e: KeyboardEvent) {
		if (e.target !== e.currentTarget) return;
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
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<div
		class="modal-backdrop mp-{position} {fullHeight ? 'full-height' : ''}"
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
		inset: 0;
		background-color: var(--sc-modal-backdrop);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
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

	.modal-content {
		display: flex;
		flex-direction: column;
		padding: 0;
		box-shadow: var(--sc-modal-content-shadow);
		width: 100%;
		min-width: 300px;
		max-width: 55vw;
		max-height: 80vh;
		max-height: 80dvh;
		pointer-events: auto;
		border-radius: var(--radius-2);
		overflow: hidden;
	}

	.modal-content.wide {
		max-width: 90vw;
	}

	.modal-content.narrow {
		max-width: 30vw;
	}

	.modal-content.full {
		max-width: 90vw;
		max-height: 90vh;
		height: 100%;
	}

	@media (max-width: 768px) {
		.modal-content {
			max-height: 95vh;
			max-width: 85vw;
		}
	}

	.modal-header,
	.modal-footer {
		flex: 0 0 auto;
	}
	.modal-header {
		display: flex;
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		justify-content: space-between;
		align-items: center;
		padding: var(--size-2) var(--size-3);
		color: var(--sc-modal-header-text);
		background-color: var(--sc-modal-header-bg);
		font-size: var(--size-4);
		font-weight: 400;
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
	@media (width > 768px) {
		.modal-content { width: auto; }
	}

	.modal-body {
		padding: var(--size-3);
		background-color: var(--sc-modal-body-bg);
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		font-family: var(--sc-font-body);
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
	.modal-footer.full-height {
		height: 100vh;
	}

	@media (max-width: 768px) {
		.modal-header {
			font-size: var(--size-3) !important;
		}
	}
</style>