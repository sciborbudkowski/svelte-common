<!-- src/lib/ui/FloatingButton.svelte -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { EphemeralStorage } from '$lib/services/storage.js';
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { createControllableState } from './internal/controllable.svelte.ts';
	import {
		notify,
		type DragPosition,
		type DragPositionChangeDetails,
		type ChangeHandler
	} from './contracts.ts';
	import Icon from './internal/Icon.svelte';

	type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

	type StoredPosition = {
		left: number;
		top: number;
	};

	const POSITION_TTL = 1000 * 60 * 60 * 24 * 365;
	const VIEWPORT_MARGIN = 0;
	const DRAG_TRESHOLD = 4;

	let {
		id,
		href,
		ariaLabel = 'Floating Button',
		icon = 'plus',
		position = 'bottom-right',
		disabled = false,
		hidden = false,
		backgroundColor = 'var(--sc-color-brand)',
		color = 'var(--sc-color-text-inverted)',
		opacity = 1,
		onclick,
		children,
		dragPosition,
		defaultDragPosition,
		onDragPositionChange,
		onDragMove,
		persistPosition = true,
		storageKey: suppliedStorageKey,
		class: cssClass,
		style,
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		...rest
	}: HTMLAttributes<HTMLElement> &
		Pick<HTMLAnchorAttributes, 'target' | 'download' | 'rel' | 'hreflang' | 'referrerpolicy'> &
		Pick<
			HTMLButtonAttributes,
			| 'type'
			| 'name'
			| 'value'
			| 'form'
			| 'formaction'
			| 'formmethod'
			| 'formenctype'
			| 'formnovalidate'
			| 'formtarget'
		> & {
			href?: string;
			dragPosition?: DragPosition | null;
			defaultDragPosition?: DragPosition | null;
			onDragPositionChange?: ChangeHandler<DragPosition | null, DragPositionChangeDetails>;
			onDragMove?: ChangeHandler<DragPosition, DragPositionChangeDetails>;
			persistPosition?: boolean;
			storageKey?: string;
			id: string;
			ariaLabel?: string;
			icon?: string;
			position?: Position;
			disabled?: boolean;
			hidden?: boolean;
			backgroundColor?: string;
			color?: string;
			opacity?: number;
			onclick?: (event: MouseEvent) => void;
			children?: Snippet;
		} = $props();

	const storageKey = $derived(suppliedStorageKey ?? `monster-button-position-${id}`);
	const buttonAttrs = $derived(rest as HTMLButtonAttributes);
	const anchorAttrs = $derived(rest as HTMLAnchorAttributes);
	const initialDragPosition = untrack(() =>
		defaultDragPosition ? { ...defaultDragPosition } : null
	);
	const hasDefaultDragPosition = untrack(() => defaultDragPosition !== undefined);
	const coordinates = createControllableState<DragPosition | null, DragPositionChangeDetails>({
		value: () => dragPosition,
		defaultValue: () => initialDragPosition,
		onChange: (next, details) => onDragPositionChange?.(next ? { ...next } : null, details),
		equals: (a, b) => a === b || (!!a && !!b && a.left === b.left && a.top === b.top)
	});
	let element = $state<HTMLElement>();
	let dragPreview: DragPosition | null = $state.raw(null);
	let isDragging = $state(false);
	const customPosition = $derived(
		!coordinates.controlled && isDragging ? dragPreview : coordinates.value
	);

	let storedPosition: StoredPosition | null = null;
	let pointerId: number | null = null;
	let dragOffsetX = 0;
	let dragOffsetY = 0;
	let pointerStartX = 0;
	let pointerStartY = 0;
	let buttonWidth = 0;
	let buttonHeight = 0;
	let didDrag = false;
	let lastDragEndedAt: number | null = null;

	function isPositionVisible(value: StoredPosition): boolean {
		if (!element) return false;

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
		if (storedPosition && isPositionVisible(storedPosition)) {
			coordinates.replace({ ...storedPosition });
		} else {
			coordinates.replace(initialDragPosition ? { ...initialDragPosition } : null);
		}
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function handlePointerDown(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		if (disabled || !event.isPrimary || event.button !== 0) return;
		onpointerdown?.(event);
		if (event.defaultPrevented) return;

		didDrag = false;

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

	function handlePointerMove(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		onpointermove?.(event);
		if (event.defaultPrevented || disabled || event.pointerId !== pointerId) return;

		const distance = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);

		if (!didDrag && distance < DRAG_TRESHOLD) return;

		didDrag = true;
		isDragging = true;

		const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - buttonWidth - VIEWPORT_MARGIN);
		const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - buttonHeight - VIEWPORT_MARGIN);

		dragPreview = {
			left: clamp(event.clientX - dragOffsetX, VIEWPORT_MARGIN, maxLeft),
			top: clamp(event.clientY - dragOffsetY, VIEWPORT_MARGIN, maxTop)
		};
		notify(onDragMove, { ...dragPreview }, { reason: 'drag', event });
	}

	function releasePointer(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		if (event.currentTarget.hasPointerCapture?.(event.pointerId))
			event.currentTarget.releasePointerCapture(event.pointerId);
		pointerId = null;
		isDragging = false;
	}
	function handlePointerUp(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		onpointerup?.(event);
		if (event.pointerId !== pointerId) return;
		const proposed = dragPreview;
		releasePointer(event);
		dragPreview = null;
		if (disabled || event.defaultPrevented || !didDrag || !proposed) return;
		lastDragEndedAt = performance.now();
		coordinates.request({ ...proposed }, { reason: 'drag', event });
		if (!coordinates.controlled) {
			storedPosition = coordinates.value ? { ...coordinates.value } : null;
			if (persistPosition && storedPosition)
				void EphemeralStorage.set(storageKey, storedPosition, POSITION_TTL);
		}
	}
	function handlePointerCancel(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		onpointercancel?.(event);
		if (event.pointerId !== pointerId) return;
		releasePointer(event);
		dragPreview = null;
		didDrag = false;
	}
	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLElement }) {
		if (disabled || (lastDragEndedAt !== null && performance.now() - lastDragEndedAt < 500)) {
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
			${style ?? ''}
		`;
	}

	$effect(() => {
		const key = storageKey;
		if (coordinates.controlled || !persistPosition || hasDefaultDragPosition) return;
		let mounted = true;
		const initialPosition = storedPosition;
		void (async () => {
			const position = await EphemeralStorage.get<StoredPosition>(key);
			if (mounted && !isDragging && storedPosition === initialPosition) {
				storedPosition = position;
				applyStoredPosition();
			}
		})();
		return () => {
			mounted = false;
		};
	});

	onMount(() => {
		function handleResize() {
			if (!isDragging && !coordinates.controlled) applyStoredPosition();
		}

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (pointerId !== null && element?.hasPointerCapture?.(pointerId))
				element.releasePointerCapture(pointerId);
		};
	});
</script>

{#if href !== undefined}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		{...anchorAttrs}
		{id}
		draggable="false"
		bind:this={element}
		class={['floating-button', position, cssClass]}
		class:dragging={isDragging}
		class:hidden
		href={disabled ? undefined : href}
		aria-disabled={disabled || undefined}
		tabindex={disabled ? -1 : rest.tabindex}
		aria-label={rest['aria-label'] ?? ariaLabel}
		title={rest.title ?? ariaLabel}
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
			<Icon name={icon} />
		{/if}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		{...buttonAttrs}
		{id}
		bind:this={element}
		type={buttonAttrs.type ?? 'button'}
		class={['floating-button', position, cssClass]}
		class:dragging={isDragging}
		class:hidden
		aria-label={rest['aria-label'] ?? ariaLabel}
		title={rest.title ?? ariaLabel}
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
			<Icon name={icon} />
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
		background-color: var(--b, var(--sc-floating-button-bg));
		color: var(--c, var(--sc-floating-button-text));
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

	/* .floating-button:hover {
		background-color: var(--sc-floating-button-hover-bg);
		transform: translateY(-2px);
		box-shadow: var(--sc-shadow-5);
	} */
	.floating-button:active {
		transform: translateY(0);
		box-shadow: var(--sc-shadow-3);
	}
	.floating-button:focus-visible {
		outline: var(--border-2) solid var(--sc-floating-button-focus-outline);
		outline-offset: var(--size-1);
	}
	.floating-button:disabled,
	.floating-button[aria-disabled='true'] {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: var(--sc-shadow-2);
	}
	.floating-button:not(.dragging):hover {
		background-color: var(--sc-floating-button-hover-bg);
		transform: translateY(-2px);
		box-shadow: var(--sc-shadow-5);
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

	.hidden {
		display: none;
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
