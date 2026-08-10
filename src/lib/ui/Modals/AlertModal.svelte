<!-- src/lib/ui/Modals/AlertModal.svelte -->

<script lang="ts">
    import { modalsState, closeAlertModal } from '../../stores/modal.svelte.ts';
    import { textToHtml } from '../../utils/text.ts';
    import Modal from '../Modal.svelte';

    const id = 'defaultAlertModalId';
    const modal = $derived(modalsState.confirmModal);

    const alertClass = $derived(() => {
        switch(modalsState.alertModal.type) {
            case 'error': return 'alert-error';
            case 'info': return 'alert-info';
            case 'success': return 'alert-success';
            case 'warning': return 'alert-warning';
        }
    });

    const icon = $derived(() => {
        switch(modalsState.alertModal.type) {
            case 'error': return 'fa-times-circle';
            case 'info': return 'fa-info-circle';
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
        }
    });

    const title = $derived(() => {
        switch(modalsState.alertModal.type) {
            case 'error': return 'Błąd';
            case 'info': return 'Informacja';
            case 'success': return 'Suckes';
            case 'warning': return 'Uwaga';
        }
    });

    async function confirm() {
        await modal.onConfirm?.(modal.context);
        closeAlertModal();
    }
</script>

<Modal
    id={id}
    {header}
    {content}
    {footer}
/>

{#snippet header()}<i class="fa-solid {icon} me-2"></i>{title}{/snippet}

{#snippet content()}
     <div class="alert {alertClass}" role="alert">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches here -->
        {@html textToHtml(modal.message)}
    </div>
{/snippet}

{#snippet footer()}<div class="center"><button type="button" onclick={confirm}>Potwierdź</button></div>{/snippet}