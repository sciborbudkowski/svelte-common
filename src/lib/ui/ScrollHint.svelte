<!-- src/lib/ui/ScrollHint.svelte -->

<script lang="ts">
    let {
        target = null,
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
        size = '1.25rem',
        fadingTime = '300ms',
        bounce = 'var(--size-2)'
    }: {
        target?: HTMLElement | null;
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
        fadingTime?: string;
        bounce?: string;
    } = $props();

    let visible = $state(false);
    let ready = $state(false);

    function update(): void {
        if(!target) {
            const scrollTop = window.scrollY;
            const viewportHeight = window.innerHeight;
            const scrollHeight = document.documentElement.scrollHeight;

            visible =
                scrollHeight > viewportHeight &&
                scrollTop + viewportHeight < scrollHeight - threshold;

            return;
        }

        visible =
            target.scrollHeight > target.clientHeight &&
            target.scrollTop + target.clientHeight < target.scrollHeight - threshold;
    }

    $effect(() => {
        update();

        target?.addEventListener('scroll', update, { passive: true });

        const observer = new ResizeObserver(update);
        if(!target) {
            observer.observe(document.documentElement);
        } else {
            observer.observe(target);
        }

        return () => {
            target?.removeEventListener('scroll', update);
            observer.disconnect();
        };
    });

    $effect(() => {
        const id = setTimeout(() => {
            ready = true;
            update();
        }, timeout);

        return () => clearTimeout(id);
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
        --size: ${size};
        --ft: ${fadingTime};
        --bounce: ${bounce};
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
        font-size: var(--size);

        opacity: 0;
        transform: translateX(-50%) translateY(.5rem);

        transition: opacity var(--ft) ease, transform var(--ft) ease;

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
            translate: 0 var(--bounce);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scroll-hint.visible {
            animation: none;
        }
    }
</style>