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
		chevronPosition = 'bottom',
		isVisibleContentClickable = false,
		showMoreLabel = 'Pokaż więcej',
		showLessLabel = 'Pokaż mniej',
		showMoreLessLabelClass = null,
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
			{@render visibleContent?.()}
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
			<div class="flex-r j-content-between w-100">
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
			<div class="flex-r j-content-between">
				<div class="text-end">
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

	.btn-link {
		padding: 0;
		text-decoration: none;
		color: var(--sc-collapsible-card-button-link-color);
		font-size: 1rem;
		border-bottom: 1px solid var(--clr-primary-a40);
		border-radius: 0;
		transition: all var(--sc-transition-duration) var(--sc-transition-type);
	}

	.btn-link:hover {
		color: var(--sc-collapsible-card-button-link-hover-color);
		border-bottom: 1px solid var(--sc-collapsible-card-button-link-hover-color);
	}
	.btn-link,
	.btn-link:hover,
	.btn-link:active,
	.btn-link:focus {
		border-bottom: 0;
		padding: 0 !important;
		margin: 0 !important;
	}
</style>
