<!-- src/lib/ui/ScrollHint.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';

    let {
        threshold = 40,
        timeout = 1000,
        bgColor = 'oklch(from rgb(0 0 0) l c h / .1)',
        color = '#fff',
        shadow = 'none',
        width = '50px',
        height = '50px',
        offset = '75px',
        minVisibility = 0,
        maxVisibility = .5,
        size = '1.25rem'
    }: {
        threshold?: number;
        timeout?: number;
        bgColor?: string;
        color?: string;
        shadow?: string;
        width?: string;
        height?: string;
        offset?: string;
        minVisibility?: number;
        maxVisibility?: number;
        size?: string;
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

<div
    class:visible={visible && ready}
    class="scroll-hint"
    aria-hidden="true"
    style={`
        --c: ${color};
        --b: ${bgColor};
        --s: ${shadow};
        --w: ${width};
        --h: ${height};
        --o: ${offset};
        --min: ${minVisibility};
        --max: ${maxVisibility};
        --s: ${size};
    `}>
        <i class="fa-solid fa-chevron-down"></i>
</div>

<style>
    .scroll-hint {
        position: fixed;
        left: 50%;
        bottom: var(--o);
        z-index: 1000;

        display: flex;
        align-items: center;
        justify-content: center;

        width: var(--w);
        height: var(--h);

        border-radius: 50%;

        background: var(--b);
        backdrop-filter: blur(6px);
        box-shadow: var(--s);

        color: var(--c);
        font-size: var(--s);

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
            opacity: var(--min);
            translate: 0 0;
        }
        50% {
            opacity: var(--max);
            translate: 0 .3rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scroll-hint.visible {
            animation: none;
        }
    }
</style>