<!-- src/lib/ui/FloatingButton.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

	let {
		href,
		ariaLabel,
		icon = 'fa-solid fa-plus',
		position = 'bottom-right',
		disabled = false,
		backgroundColor = 'var(--sc-color-brand)',
		color = 'var(--sc-color-text-inverted)',
		onclick,
		children
	}: {
		href?: string;
		ariaLabel: string;
		icon?: string;
		position?: Position;
		disabled?: boolean;
		backgroundColor?: string;
		color?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	} = $props();
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a class="floating-button {position}" {href} aria-label={ariaLabel} title={ariaLabel}>
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
		{disabled}
		{onclick}
		style={`
			--c: ${color};
			--b: ${backgroundColor}
		`}
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
