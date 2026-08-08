<script lang="ts">
    import type { Snippet } from 'svelte';

    type Position =
        | 'bottom-right'
        | 'bottom-left'
        | 'top-right'
        | 'top-left';

    let {
        href,
        ariaLabel,
        icon = 'fa-solid fa-plus',
        position = 'bottom-right',
        disabled = false,
        onclick,
        children
    }: {
        href?: string;
        ariaLabel: string;
        icon?: string;
        position?: Position;
        disabled?: boolean;
        onclick?: (event: MouseEvent) => void;
        children?: Snippet;
    } = $props();
</script>

{#if href}
    <a class="floating-button {position}" href={href} aria-label={ariaLabel} title={ariaLabel}>
        {#if children}
            {@render children()}
        {:else}
            <i class={icon} aria-hidden="true"></i>
        {/if}
    </a>
{:else}
    <button
        type="button"
        class="floating-button {position}"
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled}
        {onclick}>
            {#if children}
                {@render children()}
            {:else}
                <i class={icon} aria-hidden="true"></i>
            {/if}
    </button>
{/if}

<style lang="scss">
    .floating-button {
        position: fixed;
        z-index: var(--layer-5);
        inline-size: var(--size-9);
        block-size: var(--size-9);
        display: grid;
        place-items: center;
        border: 0;
        border-radius: var(--radius-round);
        background-color: rgb(var(--clr-primary-rgb) / var(--darker));
        color: var(--c-white);
        box-shadow: var(--shadow-4);
        cursor: pointer;
        text-decoration: none;
        font-size: var(--font-size-5);
        padding: 0;
        line-height: 1;
        transition: transform 120ms ease, box-shadow 120ms ease, background-color 120mx ease;

        &:hover {
            background-color: rgb(var(--clr-primary-rgb));
            transform: translateY(-2px);
            box-shadow: var(--shadow-5);
        }
        &:active {
            transform: translateY(0);
            box-shadow: var(--shadow-3);
        }
        &:focus-visible {
            outline: var(--border-size-2) solid var(--c-white);
            outline-offset: var(--size-1);
        }
        &:disabled {
            opacity: .5;
            cursor: not-allowed;
            transform: none;
            box-shadow: var(--shadow-2);
        }
    }

    .bottom-right {
        right: var(--size-5);
        bottom: calc(var(--size-5) + var(--bottom-bar-height));
    }
    .bottom-left {
        left: var(--size-5);
        bottom: calc(var(--size-5) + var(--bottom-bar-height));
    }
    .top-right {
        right: var(--size-5);
        top: var(--size-5);
    }
    .top-left {
        left: var(--size-5);
        top: var(--size-5);
    }

    @media(max-width: 640px) {
        .bottom-right {
            right: var(--size-4);
            bottom: calc(var(--size-4) + var(--bottom-bar-height));
        }
        .bottom-left {
            left: var(--size-4);
            bottom: calc(var(--size-4) + var(--bottom-bar-height));
        }
    }
</style>
