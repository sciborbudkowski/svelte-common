<!-- src/lib/ui/Accordion/AccordionItem.svelte -->

<script lang="ts">
	import { getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	const ACCORDION = 'accordion-context';

	type AccordionContext = {
		isOpen: (id: string) => boolean;
		toggle: (id: string) => void;
	};

	const ctx = getContext<AccordionContext>(ACCORDION);

	let {
		id,
		title,
		subTitle = '',
		icon,
		children,
		isOpen = false
	}: {
		id: string;
		title: string;
		subTitle?: string;
		icon?: string;
		children?: Snippet;
		isOpen?: boolean;
	} = $props();

	const handleClick = () => ctx.toggle(id);
	const openState = () => ctx.isOpen(id) || isOpen || false;
</script>

<section class="accrd-item">
	<div class="accrd-header">
		<button
			type="button"
			class="accrd-trigger"
			onclick={handleClick}
			aria-expanded={openState()}
			aria-controls={`acc-panel-${id}`}
			id={`acc-header-${id}`}
		>
			<span class="w-100 d-flex flex-row justify-content-between">
				<span class="accrd-title">
					{#if icon}
						<i class="{icon} me-1"></i>
					{/if}
					{title}
				</span>
				<span class="accrd-icon">
					{#if openState()}
						<i class="fa-regular fa-square-minus"></i>
					{:else}
						<i class="fa-regular fa-square-plus"></i>
					{/if}
				</span>
			</span>
			{#if subTitle}
				<span class="accrd-header2">{subTitle}</span>
			{/if}
		</button>
	</div>

	{#if openState()}
		<div
			id={`acc-panel-${id}`}
			role="region"
			aria-labelledby={`acc-header-${id}`}
			class="accrd-panel"
			transition:slide={{ duration: 200 }}
		>
			{@render children?.()}
		</div>
	{/if}
</section>

<style>
	.accrd-header {
		background-color: var(--sc-accordion-header-bg);
		font-size: var(--font-size-2);
		margin: 0;
	}

	.accrd-trigger {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: start;
		width: 100%;
		gap: var(--size-2);
		padding: calc(var(--size-2) * 1.5) var(--size-3);
		background-color: var(--sc-accordion-trigger-bg);
		color: var(--sc-accordion-trigger-color);
		border: none;
		text-align: left;
		cursor: pointer;
	}
	.accrd-trigger:hover {
		background-color: var(--sc-accordion-trigger-hover-bg);
	}
	.accrd-trigger[aria-expanded='true'] {
		background-color: var(--sc-accordion-trigger-expanded-bg);
	}
	.accrd-trigger:focus-visible {
		outline: var(--border-2) solid var(--sc-accordion-trigger-focus-visible-outline);
		outline-offset: 2px;
	}
	.accrd-panel {
		padding: calc(var(--size-2) * 1.5) var(--size-3);
		background-color: var(--sc-accordion-panel-bg);
		color: var(--sc-accordion-panel-color);
	}

	.accrd-header2 {
		font-size: var(--font-size-0);
		color: var(--sc-accorion-header-color);
	}
</style>
