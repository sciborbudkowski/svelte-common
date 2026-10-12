<!-- src/lib/ui/ScrollHint.svelte -->

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from './internal/Icon.svelte';
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
		maxVisibility = 0.5,
		size = '1.25rem',
		fadingTime = '300ms',
		bounce = 'var(--size-2)',
		class: cssClass,
		style,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
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
		if (!target) {
			const scrollTop = window.scrollY;
			const viewportHeight = window.innerHeight;
			const scrollHeight = document.documentElement.scrollHeight;

			visible =
				scrollHeight > viewportHeight && scrollTop + viewportHeight < scrollHeight - threshold;

			return;
		}

		visible =
			target.scrollHeight > target.clientHeight &&
			target.scrollTop + target.clientHeight < target.scrollHeight - threshold;
	}

	$effect(() => {
		const node = target ?? document.documentElement;
		const scrollTarget = target ?? window;
		void threshold;
		let frame = 0;
		let disposed = false;
		const scheduleUpdate = () => {
			if (disposed || frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				if (!disposed) update();
			});
		};
		const resizeObserver = new ResizeObserver(scheduleUpdate);
		const observeContent = () => {
			resizeObserver.disconnect();
			resizeObserver.observe(node);
			for (const child of node.querySelectorAll('*')) resizeObserver.observe(child);
		};
		const mutationObserver = new MutationObserver(() => {
			observeContent();
			scheduleUpdate();
		});
		mutationObserver.observe(target ?? document.body, {
			childList: true,
			subtree: true,
			characterData: true
		});
		observeContent();
		scheduleUpdate();
		scrollTarget.addEventListener('scroll', scheduleUpdate, { passive: true });
		window.addEventListener('resize', scheduleUpdate);
		node.addEventListener('load', scheduleUpdate, true);
		node.addEventListener('transitionend', scheduleUpdate, true);
		document.fonts?.addEventListener('loadingdone', scheduleUpdate);
		return () => {
			disposed = true;
			cancelAnimationFrame(frame);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			scrollTarget.removeEventListener('scroll', scheduleUpdate);
			window.removeEventListener('resize', scheduleUpdate);
			node.removeEventListener('load', scheduleUpdate, true);
			node.removeEventListener('transitionend', scheduleUpdate, true);
			document.fonts?.removeEventListener('loadingdone', scheduleUpdate);
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
	{...rest}
	class:visible={visible && ready}
	class={['scroll-hint', cssClass]}
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
        ${style ?? ''}
    `}
>
	<Icon name="chevron-down" />
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
		transform: translateX(-50%) translateY(0.5rem);

		transition:
			opacity var(--ft) ease,
			transform var(--ft) ease;

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
