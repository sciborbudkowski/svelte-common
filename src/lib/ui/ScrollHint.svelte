<!-- src/lib/ui/ScrollHint.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';

    let {
        threshold = 40,
        timeout = 1000
    }: {
        threshold?: number;
        timeout?: number;
    } = $props();

    let visible = $state(false);
    let ready = $state(false);

    function update() {
        const scrollBottom = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        visible =
            documentHeight > window.innerHeight &&
            scrollBottom < documentHeight - threshold;
    }

    onMount(() => {
        const t = setTimeout(() => {
            ready = true;
            update();
        }, timeout);

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        const observer = new ResizeObserver(update);
        observer.observe(document.documentElement);

        return () => {
            clearTimeout(t);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            observer.disconnect();
        };
    });
</script>

<div class:visible={visible && ready} class="scroll-hint" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z"/></svg>
</div>

<style>
    .scroll-hint {
        position: fixed;
        left: 50%;
        bottom: calc(var(--sc-bottom-bar-height) + var(--size-4));
        z-index: 1000;

        display: flex;
        align-items: center;
        justify-content: center;

        width: var(--size-6);
        height: var(--size-6);

        border-radius: 50%;

        background: var(--sc-color-surface-semitransparent);
        backdrop-filter: blut(6px);
        box-shadow: var(--sc-shadow-2);

        color: var(--clr-bg-a4);
        font-size: var(--font-size-3);

        opacity: 0;
        transform: translateX(-50%) translateY(.5rem);

        transition: opacity 300ms ease, transform 300ms ease;

        pointer-events: none;
    }

    .visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        animation: scroll-hint 2s ease-in-out infinite;
    }

    @keyframes scroll-hint {
        0%,
        100% {
            opacity: .4;
            translate: 0 0;
        }
        50% {
            opacity: 1;
            translate: 0 .3rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scroll-hint.visible {
            animation: none;
        }
    }
</style>