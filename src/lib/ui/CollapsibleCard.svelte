<!-- src/lib/ui/CollapsibleCard.svelte -->

<script lang="ts">
	import { slide } from 'svelte/transition';

	let {
		visibleContent,
		hiddenContent,
		defaultOpen = false,
		header = null,
		footer = null,
		padding = '1rem',
		chevronPosition = 'right',
		isVisibleContentClickable = false,
		showMoreLabel = 'Pokaż więcej',
		showLessLabel = 'Pokaż mniej',
		showMoreLessLabelClass = 'link',
		...rest
	}: {
		visibleContent: import('svelte').Snippet;
		hiddenContent: import('svelte').Snippet;
		defaultOpen?: boolean;
		header?: import('svelte').Snippet | null;
		footer?: import('svelte').Snippet | null;
		padding?: string | null;
		chevronPosition?: 'bottom' | 'left' | 'right';
		isVisibleContentClickable?: boolean;
		showMoreLabel?: string;
		showLessLabel?: string;
		showMoreLessLabelClass?: string | null;
		class?: string | null;
	} = $props();

	let isOpen = $state((() => defaultOpen)());

	const buttonAriaLabel = $derived(isOpen ? showLessLabel : showMoreLabel);
</script>

<div class={'card ' + (rest.class ?? '')}>
	{#if header}
		<div class="card-header">{@render header?.()}</div>
	{/if}
	<div class="card-body" style={padding ? `--cbp: ${padding}` : ''}>
		{#if chevronPosition === 'bottom'}
			<div class="text-end">
				<button
					type="button"
					class={showMoreLessLabelClass}
					aria-expanded={isOpen}
					aria-label={buttonAriaLabel}
					onclick={() => (isOpen = !isOpen)}>
						<i class={'fa-solid ' + (isOpen ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
						{showMoreLabel}
				</button>
			</div>
		{:else if chevronPosition === 'right'}
			<div class="flex-r j-content-between a-center w-100">
				{#if isVisibleContentClickable}
					<button
						type="button"
						class={showMoreLessLabelClass}
						aria-expanded={isOpen}
						onclick={() => (isOpen = !isOpen)}>
							{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
				<button
					type="button"
					class={showMoreLessLabelClass}
					aria-expanded={isOpen}
					aria-label={buttonAriaLabel}
					onclick={() => (isOpen = !isOpen)}>
						<i class={'fa-solid ' + (isOpen ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
						{showMoreLabel}
				</button>
			</div>
		{:else if chevronPosition === 'left'}
			<div class="flex-r gap-2">
				<button
					type="button"
					class={showMoreLessLabelClass}
					aria-expanded={isOpen}
					aria-label={buttonAriaLabel}
					style="padding: 0;"
					onclick={() => (isOpen = !isOpen)}>
						<i class={'fa-solid ' + (isOpen ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
						{showMoreLabel}
				</button>
				{#if isVisibleContentClickable}
					<button
						type="button"
						class={showMoreLessLabelClass}
						aria-expanded={isOpen}
						onclick={() => (isOpen = !isOpen)}>
							{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
			</div>
		{/if}
		{#if isOpen}
			<div transition:slide={{ duration: 300 }}>
				{@render hiddenContent?.()}
			</div>
		{/if}
	</div>
	{#if footer}
		<div class="card-header">{@render footer?.()}</div>
	{/if}
</div>

<style>
	.card-header {
		font-weight: bold;
		background-color: var(--sc-collapsible-card-header-bg);
	}

	.card-body {
		padding: var(--cbp) !important;
	}
	.card-body.compact {
		padding: var(--size-1) var(--size-2) !important;
	}
</style>
