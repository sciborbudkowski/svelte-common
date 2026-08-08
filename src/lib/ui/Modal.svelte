<script lang="ts">
    import { closeModal } from '$lib/stores/modal.svelte';
    import type { Snippet } from 'svelte';

    let {
        id = crypto.randomUUID(),
        isOpen = false,
        size = undefined,
        position = 'center',
        fullHeight = false,
        confirmButtonLabel = 'Potwierdź',
        onConfirm = undefined,
        onCancel = undefined,
        header,
        content,
        footer
    }: {
        id?: string;
        isOpen?: boolean;
        size?: 'wide' | 'narrow' | 'full' | undefined;
        position?: 'center' | 'top' | 'bottom' | undefined;
        fullHeight?: boolean;
        confirmButtonLabel?: string;
        onConfirm?: (() => Promise<void> | void) | undefined;
        onCancel?: (() => void) | undefined;
        header?: Snippet;
        content?: Snippet;
        footer?: Snippet;
    } = $props();

    function cancel() {
        onCancel?.();
        closeModal(id);
    }

    function close() {
        cancel();
    }

    function closeFromBackdrop(e: PointerEvent) {
        if(e.target !== e.currentTarget) return;
        if(e.pointerType === 'touch') return;
        close();
    }

    function closeFromButton(e: Event) {
        e.stopPropagation();
        close();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if(!isOpen) return;
        if(e.key === 'Escape') close();
    }

    function handleBackdropKeyDown(e: KeyboardEvent) {
        if(e.target !== e.currentTarget) return;
        if(e.key == 'Enter' || e.key === ' ') {
            e.preventDefault();
            close();
        }
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
        role="dialog">
        <div
            class="modal-content {size} {fullHeight? 'full-height' : ''}"
            role="document">
            <div class="modal-header">
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
                    <span><button type="button" class="lightgray bordered" onclick={cancel}>Anuluj</button></span>
                    <span><button type="button" class="primary bordered" onclick={() => onConfirm?.()}>{confirmButtonLabel}</button></span>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgb(var(--clr-black-rgb) / .75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        pointer-events: auto;
        opacity: 1;

        &.mp-center {
            justify-content: center;
            align-items: center;
        }
        &.mp-top {
            justify-content: center;
            align-items: flex-start;
        }
        &.mp-bottom {
            justify-content: center;
            align-items: flex-end;
        }
        &.mp-left {
            justify-content: flex-start;
            align-items: center;
        }
        &.mp-right {
            justify-content: flex-end;
            align-items: center;
        }
    }

    .modal-content {
        display: flex;
        flex-direction: column;
        padding: 0;
        border-radius: 0.5rem;
        box-shadow: var(--modal-shadow);
        width: 100%;
        min-width: 300px;
        max-width: 55vw;
        max-height: 80vh;
        pointer-events: auto;

        &.wide {
            max-width: 90vw;
        }

        &.narrow {
            max-width: 30vw;
        }

        &.full {
            max-width: 90vw;
            max-height: 90vh;
            height: 100%;
        }

        @media (max-width: 768px) {
            max-height: 95vh;
            max-width: 85vw;
        }
    }
    .modal-header, .modal-footer {
        flex: 0 0 auto;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--size-2) var(--size-3);
        color: var(--c-white);
        background-color: var(--c-slate);
        font-size: var(--size-4);
        font-weight: 400;

        .button-close {
            color: var(--c-white);
            font-size: var(--size-5);
            padding: 0;
        }
    }
    .modal-body {
        padding: var(--size-3);
        background-color: rgb(var(--clr-black-rgb));
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
    }
    .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--size-2) var(--size-3);
        background-color: var(--c-slate);

        button {
            min-width: 100px;
        }
    }
    .full-height {
        height: 100vh;
    }

    @media (max-width: 768px) {
        .modal-header {
            font-size: var(--size-3) !important;
        }
    }
</style>
