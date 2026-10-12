<!-- src/lib/ui/Accordion/AccordionItem.svelte -->

<script lang="ts">
	import { getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	import { ACCORDION, type AccordionContext } from './context.ts';
	import Icon from '../internal/Icon.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { notify, type ButtonPartProps, type PanelPartProps } from '../contracts.ts';

	const ctx = getContext<AccordionContext>(ACCORDION);
	if (!ctx) throw new Error('AccordionItem must be rendered inside Accordion.');

	let {
		id,
		title,
		subTitle = '',
		icon,
		children,
		trigger,
		isOpen = false,
		defaultOpen = isOpen,
		onOpenChange,
		disabled = false,
		triggerProps = {},
		panelProps = {},
		class: cssClass,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
		disabled?: boolean;
		triggerProps?: ButtonPartProps;
		panelProps?: PanelPartProps;
		id: string;
		title: string;
		subTitle?: string;
		icon?: string;
		children?: Snippet;
		trigger?: Snippet<[import('../contracts.ts').TriggerState]>;
		/** Legacy alias for defaultOpen; read only during initialization. */
		isOpen?: boolean;
		/** Initial state request, subject to the parent Accordion's single-open policy. */
		defaultOpen?: boolean;
		/** Called after this item's trigger is activated. */
		onOpenChange?: (open: boolean) => void | Promise<void>;
	} = $props();

	// Both defaults are initialization inputs; the parent owns subsequent open state.
	(() => {
		if (defaultOpen) ctx.open(id);
	})();
	const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
		if (disabled || ctx.isDisabled() || triggerProps.disabled) return;
		triggerProps.onclick?.(event);
		if (event.defaultPrevented) return;
		const proposed = !ctx.isOpen(id);
		ctx.toggle(id, event);
		notify(onOpenChange, proposed);
	};
	const openState = () => ctx.isOpen(id);
	const panelId = $derived(`${ctx.id}-acc-panel-${id}`);
	const headerId = $derived(`${ctx.id}-acc-header-${id}`);
</script>

<section
	{...rest}
	{id}
	class={['accrd-item', cssClass]}
	data-state={openState() ? 'open' : 'closed'}
	data-disabled={disabled || ctx.isDisabled() || undefined}
>
	<div class="accrd-header">
		<button
			{...triggerProps}
			disabled={disabled || ctx.isDisabled() || triggerProps.disabled}
			type="button"
			class={['accrd-trigger', triggerProps.class]}
			onclick={handleClick}
			aria-label={triggerProps['aria-label'] ?? (trigger ? title : undefined)}
			aria-expanded={openState()}
			aria-controls={panelId}
			id={headerId}
		>
			{#if trigger}{@render trigger({
					open: openState(),
					disabled: disabled || ctx.isDisabled() || !!triggerProps.disabled
				})}{:else}
				<span class="flex-r j-content-between w-100">
					<span class="accrd-title">
						{#if icon}
							<Icon name={icon} class="me-1" />
						{/if}
						{title}
					</span>
					<span class="accrd-icon">
						{#if openState()}
							<Icon name="minus" />
						{:else}
							<Icon name="plus" />
						{/if}
					</span>
				</span>
				{#if subTitle}
					<span class="accrd-header2">{subTitle}</span>
				{/if}
			{/if}
		</button>
	</div>

	{#if openState()}
		<div
			{...panelProps}
			id={panelId}
			role="region"
			aria-labelledby={headerId}
			class={['accrd-panel', panelProps.class]}
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
		color: var(--sc-accordion-header-color);
	}
</style>
