<!-- src/lib/ui/ToastStack.svelte -->
<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { notify, type ButtonPartProps } from './contracts.ts';
	import type { UIToast, ToastCloseReason } from '../stores/toaststack.svelte.ts';
	let {
		items = [],
		content,
		icon,
		onDismiss,
		getGeneration = (toast: UIToast) => toast,
		closeLabel = 'Zamknij',
		closeButtonProps = {},
		toastProps = {},
		class: cssClass,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		items?: readonly UIToast[];
		content?: Snippet<[UIToast]>;
		icon?: Snippet<[UIToast]>;
		onDismiss?: (id: string, reason: ToastCloseReason) => void | Promise<void>;
		getGeneration?: (toast: UIToast) => unknown;
		closeLabel?: string;
		closeButtonProps?: ButtonPartProps;
		toastProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'>;
	} = $props();
	let cleanupSwipe: (() => void) | undefined;
	onDestroy(() => cleanupSwipe?.());
	function dismiss(id: string, reason: ToastCloseReason = 'dismissed') {
		notify(onDismiss, id, reason);
	}
	function close(
		event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
		id: string
	) {
		if (closeButtonProps.disabled) return;
		closeButtonProps.onclick?.(event);
		if (!event.defaultPrevented) dismiss(id);
	}
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { textToHtml } from '../utils/text.ts';
	import type { UIToastType } from '$lib/stores/toaststack.svelte';

	import CircularTimer from './CircularTimer.svelte';
	import Icon from './internal/Icon.svelte';

	const SWIPE_THRESHOLD = 40;

	function handlePointerDown(event: PointerEvent, id: string) {
		const target = event.target as HTMLElement | null;
		if (target?.closest('button, a, input, textarea, select, [role="button"]')) return;

		cleanupSwipe?.();
		const startY = event.clientY;
		const currentTarget = event.currentTarget as HTMLElement;
		currentTarget.setPointerCapture(event.pointerId);

		const onMove = (e: PointerEvent) => {
			const deltaY = e.clientY - startY;
			if (deltaY < -SWIPE_THRESHOLD) {
				cleanup();
				dismiss(id);
			}
		};

		const onUp = () => cleanup();

		const cleanup = () => {
			if (currentTarget.hasPointerCapture?.(event.pointerId))
				currentTarget.releasePointerCapture(event.pointerId);
			cleanupSwipe = undefined;
			currentTarget.removeEventListener('pointermove', onMove);
			currentTarget.removeEventListener('pointerup', onUp);
			currentTarget.removeEventListener('pointercancel', onUp);
		};

		cleanupSwipe = cleanup;
		currentTarget.addEventListener('pointermove', onMove);
		currentTarget.addEventListener('pointerup', onUp);
		currentTarget.addEventListener('pointercancel', onUp);
	}

	function getIcon(forType: UIToastType): string {
		switch (forType) {
			case 'success':
				return 'success';
			case 'error':
				return forType;
			case 'warning':
				return forType;
			case 'info':
				return 'info';
			case 'neutral':
				return 'arrow-right';
		}
	}
</script>

<div
	{...rest}
	class={['toast-stack', cssClass]}
	aria-live="polite"
	aria-relevant="additions removals"
>
	{#each items as t (t.id)}
		<div
			{...toastProps}
			class={['toast', t.type, toastProps.class]}
			in:fly={{ y: 8, duration: 150, easing: cubicOut }}
			out:fly={{ y: -8, duration: 125, easing: cubicOut }}
			animate:flip={{ duration: 200, easing: cubicOut }}
			onpointerdown={(e) => {
				toastProps.onpointerdown?.(e);
				if (!e.defaultPrevented) handlePointerDown(e, t.id);
			}}
			role="status"
		>
			<div class="icon">
				{#if icon}{@render icon(t)}{:else if t.icon}
					<span>{t.icon}</span>
				{:else}
					<Icon name={getIcon(t.type)} />
				{/if}
			</div>
			<div class="content">
				{#if content}{@render content(t)}{:else}
					<div class="title">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html textToHtml(t.title) ?? ''}
					</div>
					{#if t.message}
						<div class="message">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html textToHtml(t.message)}
						</div>
					{/if}
					{#if t.systemMessage}
						<div class="system-message">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html textToHtml(t.systemMessage)}
						</div>
					{/if}
				{/if}
			</div>
			<div class="x">
				{#if t.autoClose}
					<div class="timer-ring">
						{#key getGeneration(t)}
							<CircularTimer duration={t.duration} size="sm" />
						{/key}
					</div>
				{/if}
				<button
					{...closeButtonProps}
					type="button"
					class={['close', closeButtonProps.class]}
					aria-label={closeButtonProps['aria-label'] ?? closeLabel}
					onclick={(e) => close(e, t.id)}
				>
					<Icon name="close" />
				</button>
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.toast-stack {
		position: fixed;
		z-index: var(--zi-always-top);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: min(20rem, calc(100vw - 2rem));
		gap: var(--size-2);
		left: 50%;
		bottom: calc(var(--sc-bottom-bar-height) + 1rem);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.toast {
		border-radius: var(--sc-border-radius);
		pointer-events: auto;
		display: flex;
		flex-direction: row;
		padding: var(--size-2);
		gap: var(--size-2);
		align-items: center;
		position: relative;
		overflow: hidden;
		width: 100%;
		min-width: 0;
		box-shadow: var(--sc-toast-shadow);
		pointer-events: auto;
	}

	.toast.error {
		color: var(--sc-toast-error-text);
		background-color: var(--sc-toast-error-bg);
	}
	.toast.warning {
		color: var(--sc-toast-warning-text);
		background-color: var(--sc-toast-warning-bg);
	}
	.toast.success {
		color: var(--sc-toast-success-text);
		background-color: var(--sc-toast-success-bg);
	}
	.toast.info {
		color: var(--sc-toast-info-text);
		background-color: var(--sc-toast-info-bg);
	}
	.toast.neutral {
		color: var(--sc-toast-neutral-text);
		background-color: var(--sc-toast-neutral-bg);
	}

	.toast .icon {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
	}

	.toast .icon {
		font-size: var(--font-size-5);
	}

	.toast .content {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		min-width: 0;
	}

	.toast .content .title {
		font-size: var(--font-size-1);
		font-weight: 600;
	}
	.toast .content .message {
		font-size: var(--font-size-0);
		font-weight: 400;
	}
	.toast .content .system-message {
		font-size: var(--font-size-0);
		font-style: italic;
		color: var(--sc-color-text);

		&::before {
			content: '[ ';
		}
		&::after {
			content: ' ]';
		}
	}

	.toast .x {
		position: relative;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
	}

	.toast .timer-ring {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
	}

	.toast .x button {
		position: relative;
		z-index: var(--zi-1);
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-3);
		padding: 0;
		color: inherit;
		background: transparent;
		border: none;
		line-height: 1;
	}

	.toast .x button :global(.sc-icon) {
		display: block;
		line-height: 1;
	}
</style>
