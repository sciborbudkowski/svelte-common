<!-- src/lib/ui/Modals/AlertModal.svelte -->

<script lang="ts">
	import { modalsState, closeAlertModal } from '../../stores/modal.svelte.ts';
	import { textToHtml } from '../../utils/text.ts';
	import Modal from '../Modal.svelte';

	const id = 'defaultAlertModalId';
	const modal = $derived(modalsState.alertModal);

	const alertClass = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'alert-error';
			case 'info':
				return 'alert-info';
			case 'success':
				return 'alert-success';
			case 'warning':
				return 'alert-warning';
		}
	});

	const icon = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'fa-times-circle';
			case 'info':
				return 'fa-info-circle';
			case 'success':
				return 'fa-check-circle';
			case 'warning':
				return 'fa-exclamation-triangle';
		}
	});

	const title = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'Błąd';
			case 'info':
				return 'Informacja';
			case 'success':
				return 'Sukces';
			case 'warning':
				return 'Uwaga';
		}
	});
</script>

<Modal
	{id}
	open={modal.isOpen}
	onCancel={closeAlertModal}
	headerClass={alertClass}
	{header}
	{content}
	{footer}
/>

{#snippet header()}<div><i class="fa-solid {icon} me-2"></i>{title}</div>{/snippet}

{#snippet content()}
	<div role="alert">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches here -->
		{@html textToHtml(modal.message)}
	</div>
{/snippet}

{#snippet footer()}
	<div class="w-100 py-1 text-center">
		<button type="button" class="btn" onclick={closeAlertModal}>OK</button>
	</div>
{/snippet}

<style>
	.btn {
		min-width: 100px;
	}
</style>