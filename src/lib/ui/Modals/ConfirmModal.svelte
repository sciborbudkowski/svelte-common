<!-- src/lib/ui/Modals/ConfirmModal.svelte -->

<script lang="ts">
	import { onDestroy, type ComponentProps } from 'svelte';
	import { BROWSER } from 'esm-env';
	import { modalsState, closeConfirmModal } from '../../stores/modal.svelte.ts';
	import { textToHtml } from '../../utils/text.ts';
	import Dialog from '../Dialog.svelte';

	const modalId = '__confirm_modal_id';

	let {
		id = modalId,
		title = 'Potwierdzenie',
		onActionError,
		...props
	}: Omit<
		ComponentProps<typeof Dialog>,
		| 'open'
		| 'defaultOpen'
		| 'openingKey'
		| 'busy'
		| 'onConfirm'
		| 'onCancel'
		| 'onOpenChange'
		| 'header'
		| 'content'
		| 'children'
		| 'footer'
	> & {
		id?: string;
		title?: string;
	} = $props();

	const modal = $derived(modalsState.confirmModal);

	let confirmingModal = $state.raw<typeof modal | null>(null);
	const confirming = $derived(confirmingModal !== null && confirmingModal === modal);
	let destroyed = false;

	onDestroy(() => {
		destroyed = true;
		if (BROWSER) closeConfirmModal();
	});

	async function confirm() {
		if (confirming || !modal.isOpen) return;
		const opening = modal;
		confirmingModal = opening;

		try {
			await opening.onConfirm?.(opening.context);
			if (!destroyed && modalsState.confirmModal === opening) closeConfirmModal();
		} finally {
			if (confirmingModal === opening) confirmingModal = null;
		}
	}

	function cancel() {
		if (confirming || !modal.isOpen) return;
		const opening = modal;
		try {
			opening.onCancel?.();
		} catch (error) {
			console.error('Error in ConfirmModal::cancel() - ', error);
		} finally {
			if (modalsState.confirmModal === opening) closeConfirmModal();
		}
	}
</script>

<Dialog
	{...props}
	{id}
	open={modal.isOpen}
	openingKey={modal}
	busy={confirming}
	onConfirm={confirm}
	onCancel={cancel}
	onActionError={(error, action) => {
		if (onActionError) onActionError(error, action);
		else console.error(`Error in ConfirmModal::${action}() - `, error);
	}}
	{header}
	{content}
/>

{#snippet header()}{title}{/snippet}

{#snippet content()}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches here -->
	{@html textToHtml(modal.message)}
{/snippet}
