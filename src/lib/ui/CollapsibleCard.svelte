<!-- src/lib/ui/CollapsibleCard.svelte -->

<script lang="ts">
	import { slide } from 'svelte/transition';

	const componentId = $props.id();

	let {
		id = componentId,
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
		id?: string;
		visibleContent: import('svelte').Snippet;
		hiddenContent: import('svelte').Snippet;
		defaultOpen?: boolean;
		header?: import('svelte').Snippet | null;
		footer?: import('svelte').Snippet | null;
		padding?: string | null;
		chevronPosition?: 'left' | 'right';
		isVisibleContentClickable?: boolean;
		showMoreLabel?: string;
		showLessLabel?: string;
		showMoreLessLabelClass?: string | null;
		class?: string | null;
	} = $props();

	let isOpen = $state((() => defaultOpen)());

	const toggleLabel = $derived(isOpen ? showLessLabel : showMoreLabel);

	function toggle(): void {
		isOpen = !isOpen;
	}
</script>

<div class={'card ' + (rest.class ?? '')}>
	{#if header}
		<div class="card-header">{@render header?.()}</div>
	{/if}
	<div class="card-body" style={padding ? `--cbp: ${padding}` : ''}>
		{#if chevronPosition === 'right'}
			<div class="flex-r j-content-between a-center w-100">
				{#if isVisibleContentClickable}
					<button
						type="button"
						class={showMoreLessLabelClass}
						aria-expanded={isOpen}
						aria-controls={id}
						onclick={toggle}
					>
						{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
				<button
					type="button"
					class={showMoreLessLabelClass}
					aria-expanded={isOpen}
					aria-label={toggleLabel}
					aria-controls={id}
					onclick={toggle}
				>
					<i class={'fa-solid ' + (isOpen ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
					{toggleLabel}
				</button>
			</div>
		{:else if chevronPosition === 'left'}
			<div class="flex-r gap-2">
				<button
					type="button"
					class={showMoreLessLabelClass}
					aria-expanded={isOpen}
					aria-label={toggleLabel}
					aria-controls={id}
					style="padding: 0;"
					onclick={toggle}
				>
					<i class={'fa-solid ' + (isOpen ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
					{toggleLabel}
				</button>
				{#if isVisibleContentClickable}
					<button
						type="button"
						class={showMoreLessLabelClass}
						aria-expanded={isOpen}
						aria-controls={id}
						onclick={toggle}
					>
						{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
			</div>
		{/if}
		<div {id} aria-hidden={!isOpen}>
			{#if isOpen}
				<div transition:slide={{ duration: 300 }}>
					{@render hiddenContent?.()}
				</div>
			{/if}
		</div>
	</div>
	{#if footer}
		<div class="card-footer">{@render footer?.()}</div>
	{/if}
</div>

<style>
	.card-header {
		font-weight: bold;
		background-color: var(--sc-collapsible-card-header-bg);
	}
	.card-footer {
		background-color: var(--sc-collapsible-card-footer-bg);
	}

	.card-body {
		padding: var(--cbp) !important;
	}
	.card-body.compact {
		padding: var(--size-1) var(--size-2) !important;
	}
</style>
