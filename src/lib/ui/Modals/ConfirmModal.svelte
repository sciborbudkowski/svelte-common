<!-- src/lib/ui/Modals/ConfirmModal.svelte -->

<script lang="ts">
	import { modalsState, closeConfirmModal } from '../../stores/modal.svelte.ts';
	import { textToHtml } from '../../utils/text.ts';
	import Modal from '../Modal.svelte';

	const modalId = '__confirm_modal_id';

	let {
		id = modalId,
		title = 'Potwierdzenie'
	}: {
		id?: string;
		title?: string;
	} = $props();

	const modal = $derived(modalsState.confirmModal);

	let confirming = $state(false);

	async function confirm() {
		if (confirming) return;
		confirming = true;

		try {
			await modal.onConfirm?.(modal.context);
			closeConfirmModal();
		} catch (error) {
			console.error('Error in ConfirmModal::confirm() - ', error);
		} finally {
			confirming = false;
		}
	}

	function cancel() {
		modal.onCancel?.();
		closeConfirmModal();
	}
</script>

<Modal {id} open={modal.isOpen} onCancel={cancel} {header} {content} {footer} />

{#snippet header()}{title}{/snippet}

{#snippet content()}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches here -->
	{@html textToHtml(modal.message)}
{/snippet}

{#snippet footer()}
	<button type="button" class="outline neutral" onclick={cancel} disabled={confirming}>Anuluj</button>
	<button type="button" class="brand" onclick={confirm} disabled={confirming}>Potwierdź</button>
{/snippet}
