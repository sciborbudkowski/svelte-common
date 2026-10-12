<!-- src/lib/ui/CollapsibleTabBar.svelte -->

<script lang="ts">
    let {
        target = null,
        collapseAt = 40,
        // expandAt = 10,
        timeout = 500,
        bgColor = 'oklch(from rgb(0 0 0) l c h / .8',
        maxWidth = '500px'

    }: {
        target?: HTMLElement | null;
        collapseAt?: number;
        // expandAt?: number;
        timeout?: number;
        bgColor?: string;
        maxWidth?: string;
    } = $props();

    type Visibility =
        | 'auto'            // target element position < threshold
        | 'minimized'       // target element position >= threshold
        | 'opened';         // target element position >= threshold, but user opened the bar

    let visibility = $state<Visibility>('auto');
    let ready = $state(false);

    function update(): void {
        if(!target) {
            const scrollTop = window.scrollY;
            const viewportHeight = window.innerHeight;
            const scrollHeight = document.documentElement.scrollHeight;

            visibility =
                scrollHeight > viewportHeight &&
                scrollTop >= collapseAt
                    ? 'auto' : 'minimized'

            switchBar();

            return;
        }

        visibility =
            target.scrollHeight > target.clientHeight &&
            target.scrollTop >= collapseAt
                ? 'auto' : 'minimized';

        switchBar();
    }

    function switchBar(): void {
        if(visibility === 'auto') return;

        if(visibility === 'minimized') {
            visibility = 'opened';
        } else {
            visibility = 'minimized';
        }
    }

    $effect(() => {
        const scrollTarget = target ?? window;

        const scheduleUpdate = () => {
            requestAnimationFrame(update);
        };

        scheduleUpdate();

        scrollTarget.addEventListener('scroll', update, { passive: true });

        const resizeObserver = new ResizeObserver(scheduleUpdate);
        const mutationObserver = new MutationObserver(scheduleUpdate);

        if(target) {
            resizeObserver.observe(target);
            mutationObserver.observe(target, { childList: true, subtree: true });
        } else {
            resizeObserver.observe(document.documentElement);
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }

        return () => {
            scrollTarget?.removeEventListener('scroll', update);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    });

    $effect(() => {
        if(!timeout || timeout <= 0) return;

        const id = setTimeout(() => {
            ready = true;
            update();
        }, timeout);

        return () => clearTimeout(id);
    });
</script>

{#if ready}
    <div
        class="bar"
        style={`
            --mw: ${maxWidth};
            --bg: ${bgColor};
        `}>
        {#if visibility === 'auto'}
            <div>AUTO</div>
        {:else if visibility === 'minimized'}
            <button type="button" onclick={switchBar}>minimized</button>
        {:else}
            <div>Opened</div>
        {/if}
    </div>
{/if}

<style>
    .bar {
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        max-width: var(--mw);
        background: var(--bg);
    }
</style>