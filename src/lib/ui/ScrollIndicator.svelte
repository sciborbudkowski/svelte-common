<!-- src/lib/ui/ScrollIndicator.svelte -->

<script lang="ts">
    let {
        target = null,
        width = 5,
        inset = 4,
        minThumbSize = 28,
        autoHide = true,
        hideDelay = 2500,
        showDuration = 90,
        hideDuration = 600
    }: {
        target?: HTMLElement | null;
        width?: number;
        inset?: number;
        minThumbSize?: number;
        autoHide?: boolean;
        hideDelay?: number;
        showDuration?: number;
        hideDuration?: number;
    } = $props();

    let trackTop = $state(0);
    let trackLeft = $state(0);
    let trackHeight = $state(0);
    let thumbHeight = $state(0);
    let thumbTop = $state(0);
    let isScrollable = $state(false);
    let isShown = $state(false);

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    function clearHideTimer(): void {
        if(hideTimer === null) return;

        clearTimeout(hideTimer);
        hideTimer = null;
    }

    function revealIndicator(): void {
        isShown = true;
        clearHideTimer();

        if(!autoHide) return;

        hideTimer = setTimeout(() => {
            isShown = false;
            hideTimer = null;
        }, hideDelay);
    }

    function measure(node: HTMLElement): void {
        const rect = node.getBoundingClientRect();
        const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
        const availableTrackHeight = Math.max(0, rect.height - inset * 2);

        const scrollable = maxScroll > 1 && availableTrackHeight > 0;

        isScrollable = scrollable;

        if(!scrollable) {
            isShown = false;
            clearHideTimer();
            return;
        }

        if(!autoHide) {
            isShown = true;
        }

        const calculatedThumbHeight = availableTrackHeight * (node.clientHeight / node.scrollHeight);

        thumbHeight = Math.min(availableTrackHeight, Math.max(minThumbSize, calculatedThumbHeight));

        const maxThumbTop = Math.max(0, availableTrackHeight - thumbHeight);
        const scrollProgress = maxScroll > 0 ? node.scrollTop / maxScroll : 0;

        trackTop = rect.top + inset;
        trackLeft = rect.right - inset - width;
        trackHeight = availableTrackHeight;
        thumbTop = scrollProgress * maxThumbTop;
    }

    $effect(() => {
        const node = target;

        void width;
        void inset;
        void minThumbSize;
        void autoHide;
        void hideDelay;
        void showDuration;
        void hideDuration;

        if(!node) {
            isScrollable = false;
            isShown = false;
            clearHideTimer();
            return;
        }

        let frameId = 0;

        const scheduleMeasure = () => {
            cancelAnimationFrame(frameId);

            frameId = requestAnimationFrame(() => {
                measure(node);
            });
        };

        const handleScroll = () => {
            revealIndicator();
            scheduleMeasure();
        }

        const resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(node);

        const mutationObserver = new MutationObserver(scheduleMeasure);
        mutationObserver.observe(node, {
            subtree: true,
            childList: true,
            characterData: true
        });

        node.addEventListener('scroll', handleScroll, { passive: true });
        node.addEventListener('transitionend', scheduleMeasure, true);
        node.addEventListener('load', scheduleMeasure, true);
        window.addEventListener('resize', scheduleMeasure);

        scheduleMeasure();

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();

            node.removeEventListener('scroll', handleScroll);
            node.removeEventListener('transitionend', scheduleMeasure, true);
            node.removeEventListener('load', scheduleMeasure, true);
            window.removeEventListener('resize', scheduleMeasure);

            isShown = false;
        };
    });
</script>

{#if isScrollable}
    <div
        class="scroll-indicator"
        class:shown={isShown}
        aria-hidden="true"
        style:top={`${trackTop}px`}
        style:left={`${trackLeft}px`}
        style:width={`${width}px`}
        style:height={`${trackHeight}px`}
        style={`
            --scroll-indicator-show-duration: ${showDuration}ms;
            --scroll-indicator-hide-duration: ${hideDuration}ms;
        `}>
            <div
                class="scroll-indicator-thumb"
                style:height={`${thumbHeight}px`}
                style:transform={`translateY(${thumbTop}px)`}>
            </div>
    </div>
{/if}

<style lang="scss">
    .scroll-indicator {
        position: fixed;
        z-index: var(--sc-scroll-indicator-z-index, 10000);
        border-radius: 999px;
        background-color: var(--sc-scroll-indicator-track, oklch(from var(--sc-color-text) l c h / .08));
        pointer-events: none;
        opacity: 0;
        will-change: opacity;
        transition: opacity var(--scroll-indicator-hide-duration, 600ms) ease-in;
    }

    .scroll-indicator.shown {
        opacity: 1;
        transition-duration: var(--scroll-indicator-show-duration, 90ms);
        transition-timing-function: ease-out;
    }

    .scroll-indicator-thumb {
        position: absolute;
        inset: 0 0 auto;
        width: 100%;
        border-radius: inherit;
        background-color: var(--sc-scroll-indicator-thumb, oklch(from var(--sc-color-text) l c h / .45));
        will-change: transform;
        transition: height 120ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        .scroll-indicator, .scroll-indicator-thumb {
            transition: none;
        }
    }
</style>