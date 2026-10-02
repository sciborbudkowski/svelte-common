<!-- src/lib/ui/FloatingButton.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { EphemeralStorage } from '$lib/services/storage.js';
	import type { Snippet } from 'svelte';

	type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

	type StoredPosition = {
		left: number;
		top: number;
	};

	const POSITION_TTL = 1000 * 60 * 60 * 24 *365;
	const VIEWPORT_MARGIN = 0;
	const DRAG_TRESHOLD = 4;

	let {
		id,
		href,
		ariaLabel = 'Floating Button',
		icon = 'fa-solid fa-plus',
		position = 'bottom-right',
		disabled = false,
		backgroundColor = 'var(--sc-color-brand)',
		color = 'var(--sc-color-text-inverted)',
		opacity = 1,
		onclick,
		children
	}: {
		id: string;
		href?: string;
		ariaLabel?: string;
		icon?: string;
		position?: Position;
		disabled?: boolean;
		backgroundColor?: string;
		color?: string;
		opacity?: number;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	} = $props();

	const STORAGE_KEY = `monster-button-position-${() => id}`;
	let element = $state<HTMLElement>();
	let customPosition: StoredPosition | null = $state(null);
	let isDragging = $state(false);

	let storedPosition: StoredPosition | null = null;
	let pointerId: number | null = null;
	let dragOffsetX = 0;
	let dragOffsetY = 0;
	let pointerStartX = 0;
	let pointerStartY = 0;
	let buttonWidth = 0;
	let buttonHeight = 0;
	let didDrag = false;
	let lastDragEndedAt = 0;

	function isPositionVisible(value: StoredPosition): boolean {
		if(!element) return false;

		const width = element.offsetWidth;
		const height = element.offsetHeight;

		return (
			Number.isFinite(value.left) &&
			Number.isFinite(value.top) &&
			value.left >= VIEWPORT_MARGIN &&
			value.top >= VIEWPORT_MARGIN &&
			value.left + width <= window.innerWidth - VIEWPORT_MARGIN &&
			value.top + height <= window.innerHeight - VIEWPORT_MARGIN
		);
	}

	function applyStoredPosition() {
		if(storedPosition && isPositionVisible(storedPosition)) {
			customPosition = storedPosition;
		} else {
			customPosition = null;
		}
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function handlePointerDown(event: PointerEvent) {
		if(!event.isPrimary || event.button !== 0) return;

		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		pointerId = event.pointerId;
		pointerStartX = event.clientX;
		pointerStartY = event.clientY;
		dragOffsetX = event.clientX - rect.left;
		dragOffsetY = event.clientY - rect.top;
		buttonWidth = rect.width;
		buttonHeight = rect.height;

		target.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if(event.pointerId !== pointerId) return;

		const distance = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);

		if(!didDrag && distance < DRAG_TRESHOLD) return;

		didDrag = true;
		isDragging = true;

		const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - buttonWidth - VIEWPORT_MARGIN);
		const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - buttonHeight - VIEWPORT_MARGIN);

		customPosition = {
			left: clamp(event.clientX - dragOffsetX, VIEWPORT_MARGIN, maxLeft),
			top: clamp(event.clientY - dragOffsetY, VIEWPORT_MARGIN, maxTop)
		};
	}

	function handlePointerUp(event: PointerEvent) {
		if(event.pointerId !== pointerId) return;

		pointerId = null;
		isDragging = false;

		if(!didDrag || !customPosition) return;

		lastDragEndedAt = performance.now();

		storedPosition = { ...customPosition };

		void EphemeralStorage.set(STORAGE_KEY, storedPosition, POSITION_TTL);
	}

	function handlePointerCancel(event: PointerEvent) {
		if(event.pointerId !== pointerId) return;

		pointerId = null;
		isDragging = false;
		didDrag = false;

		applyStoredPosition();
	}

	function handleClick(event: MouseEvent) {
		if(performance.now() - lastDragEndedAt < 500) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onclick?.(event);
	}

	function buttonStyle() {
		const coordinates = customPosition
			? `
				left: ${customPosition.left}px;
				top: ${customPosition.top}px;
				right: auto;
				bottom: auto;
			`
			: '';

		return `
			--c: ${color};
			--b: ${backgroundColor};
			--o: ${opacity};
			${coordinates}
		`;
	}

	onMount(() => {
		let mounted = true;

		void(async () => {
			storedPosition = await EphemeralStorage.get<StoredPosition>(STORAGE_KEY);
			
			if(mounted) applyStoredPosition();
		})();

		function handleResize() {
			if(!isDragging) applyStoredPosition();
		}

		window.addEventListener('resize', handleResize);

		return () => {
			mounted = false;
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

{#if href}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		bind:this={element}
		class="floating-button {position}"
		class:dragging={isDragging}
		{href}
		aria-label={ariaLabel}
		title={ariaLabel}
		style={buttonStyle()}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
		onclick={handleClick}
	>
			{#if children}
				{@render children()}
			{:else}
				<i class={icon} aria-hidden="true"></i>
			{/if}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={element}
		type="button"
		class="floating-button {position}"
		class:dragging={isDragging}
		aria-label={ariaLabel}
		title={ariaLabel}
		{disabled}
		onclick={handleClick}
		style={buttonStyle()}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
	>
		{#if children}
			{@render children()}
		{:else}
			<i class={icon} aria-hidden="true"></i>
		{/if}
	</button>
{/if}

<style>
	.floating-button {
		position: fixed;
		z-index: var(--zi-5);
		inline-size: var(--size-9);
		block-size: var(--size-9);
		display: grid;
		place-items: center;
		border: 0;
		border-radius: var(--radius-round);
		background-color: var(--b, --sc-floating-button-bg);
		color: var(--c, --sc-floating-button-text);
		box-shadow: var(--sc-shadow-4);
		cursor: pointer;
		text-decoration: none;
		font-size: var(--font-size-5);
		padding: 0;
		line-height: 1;
		transition: var(--sc-floating-button-transition);
		opacity: var(--o);
		touch-action: none;
		user-select: none;
		cursor: grab;
	}

	.floating-button.dragging {
		cursor: grabbing;
		transition: none;
	}

	.floating-button:hover {
		background-color: var(--sc-floating-button-hover-bg);
		transform: translateY(-2px);
		box-shadow: var(--sc-shadow-5);
	}
	.floating-button:active {
		transform: translateY(0);
		box-shadow: var(--sc-shadow-3);
	}
	.floating-button:focus-visible {
		outline: var(--border-2) solid var(--sc-floating-button-focus-outline);
		outline-offset: var(--size-1);
	}
	.floating-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: var(--sc-shadow-2);
	}

	.bottom-right {
		right: var(--size-5);
		bottom: calc(var(--size-5) + var(--sc-bottom-bar-height));
	}
	.bottom-left {
		left: var(--size-5);
		bottom: calc(var(--size-5) + var(--sc-bottom-bar-height));
	}
	.top-right {
		right: var(--size-5);
		top: var(--size-5);
	}
	.top-left {
		left: var(--size-5);
		top: var(--size-5);
	}

	@media (max-width: 640px) {
		.bottom-right {
			right: var(--size-4);
			bottom: calc(var(--size-4) + var(--sc-bottom-bar-height));
		}
		.bottom-left {
			left: var(--size-4);
			bottom: calc(var(--size-4) + var(--sc-bottom-bar-height));
		}
	}
</style>
