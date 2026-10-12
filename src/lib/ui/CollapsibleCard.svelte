<!-- src/lib/ui/CollapsibleCard.svelte -->

<script lang="ts">
	import { slide } from 'svelte/transition';
	import Icon from './internal/Icon.svelte';
	import { syncInert } from './internal/inert.ts';
	import type { HTMLAttributes } from 'svelte/elements';
	import { createControllableState } from './internal/controllable.svelte.ts';
	import type {
		ButtonPartProps,
		PanelPartProps,
		ChangeHandler,
		ChangeDetails
	} from './contracts.ts';

	const componentId = $props.id();

	let {
		id = componentId,
		panelId: suppliedPanelId,
		trigger,
		visibleContent,
		hiddenContent,
		open,
		defaultOpen = false,
		onOpenChange,
		disabled = false,
		triggerProps = {},
		panelProps = {},
		headerProps = {},
		footerProps = {},
		class: cssClass,
		style,
		header = null,
		footer = null,
		padding = '1rem',
		chevronPosition = 'right',
		isVisibleContentClickable = false,
		showMoreLabel = 'Pokaż więcej',
		showLessLabel = 'Pokaż mniej',
		showMoreLessLabelClass = 'link',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		id?: string;
		panelId?: string;
		trigger?: import('svelte').Snippet<[import('./contracts.ts').TriggerState]>;
		open?: boolean;
		onOpenChange?: ChangeHandler<boolean, ChangeDetails<'trigger'>>;
		disabled?: boolean;
		triggerProps?: ButtonPartProps;
		panelProps?: PanelPartProps;
		headerProps?: HTMLAttributes<HTMLDivElement>;
		footerProps?: HTMLAttributes<HTMLDivElement>;
		/** Must contain no interactive elements when isVisibleContentClickable is true. */
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
	} = $props();

	const state = createControllableState<boolean, ChangeDetails<'trigger'>>({
		value: () => open,
		defaultValue: () => defaultOpen,
		onChange: (next, details) => onOpenChange?.(next, details)
	});
	const isOpen = $derived(state.value);
	const panelId = $derived(suppliedPanelId ?? `${id}-panel`);
	const toggleLabel = $derived(isOpen ? showLessLabel : showMoreLabel);
	function toggle(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }): void {
		if (disabled || triggerProps.disabled) return;
		triggerProps.onclick?.(event);
		if (!event.defaultPrevented) state.request(!isOpen, { reason: 'trigger', event });
	}
</script>

<div
	{...rest}
	{id}
	class={['card', cssClass]}
	{style}
	data-state={isOpen ? 'open' : 'closed'}
	data-disabled={disabled || undefined}
>
	{#if header}
		<div {...headerProps} class={['card-header', headerProps.class]}>{@render header?.()}</div>
	{/if}
	<div class="card-body" style={padding ? `--cbp: ${padding}` : ''}>
		{#if chevronPosition === 'right'}
			<div class="flex-r j-content-between a-center w-100">
				{#if isVisibleContentClickable}
					<button
						{...triggerProps}
						disabled={disabled || triggerProps.disabled}
						type="button"
						class={[
							'sc-collapsible-trigger',
							triggerProps.class !== undefined ? triggerProps.class : showMoreLessLabelClass
						]}
						aria-expanded={isOpen}
						aria-controls={panelId}
						onclick={toggle}
					>
						{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
				<button
					{...triggerProps}
					disabled={disabled || triggerProps.disabled}
					type="button"
					class={[
						'sc-collapsible-trigger',
						triggerProps.class !== undefined ? triggerProps.class : showMoreLessLabelClass
					]}
					aria-expanded={isOpen}
					aria-label={toggleLabel}
					aria-controls={panelId}
					onclick={toggle}
				>
					{#if trigger}{@render trigger({
							open: isOpen,
							disabled: disabled || !!triggerProps.disabled
						})}{:else}<Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />{toggleLabel}{/if}
				</button>
			</div>
		{:else if chevronPosition === 'left'}
			<div class="flex-r gap-2">
				<button
					{...triggerProps}
					disabled={disabled || triggerProps.disabled}
					type="button"
					class={[
						'sc-collapsible-trigger',
						triggerProps.class !== undefined ? triggerProps.class : showMoreLessLabelClass
					]}
					aria-expanded={isOpen}
					aria-label={toggleLabel}
					aria-controls={panelId}
					style={`padding: 0; ${triggerProps.style ?? ''}`}
					onclick={toggle}
				>
					{#if trigger}{@render trigger({
							open: isOpen,
							disabled: disabled || !!triggerProps.disabled
						})}{:else}<Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />{toggleLabel}{/if}
				</button>
				{#if isVisibleContentClickable}
					<button
						{...triggerProps}
						disabled={disabled || triggerProps.disabled}
						type="button"
						class={[
							'sc-collapsible-trigger',
							triggerProps.class !== undefined ? triggerProps.class : showMoreLessLabelClass
						]}
						aria-expanded={isOpen}
						aria-controls={panelId}
						onclick={toggle}
					>
						{@render visibleContent?.()}
					</button>
				{:else}
					{@render visibleContent?.()}
				{/if}
			</div>
		{/if}
		<div
			{...panelProps}
			id={panelId}
			aria-hidden={!isOpen}
			inert={!isOpen ? true : undefined}
			use:syncInert={!isOpen}
			data-state={isOpen ? 'open' : 'closed'}
		>
			{#if isOpen}
				<div transition:slide={{ duration: 300 }}>
					{@render hiddenContent?.()}
				</div>
			{/if}
		</div>
	</div>
	{#if footer}
		<div {...footerProps} class={['card-footer', footerProps.class]}>{@render footer?.()}</div>
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
