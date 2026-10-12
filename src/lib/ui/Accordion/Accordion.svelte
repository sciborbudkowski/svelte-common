<script lang="ts">
	import { setContext, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { createControllableState } from '../internal/controllable.svelte.ts';
	import type { ChangeHandler, AccordionChangeDetails } from '../contracts.ts';
	import { ACCORDION, type AccordionContext } from './context.ts';
	const componentId = $props.id();
	let {
		children,
		multiple = false,
		value,
		defaultValue,
		defaultOpen = [],
		onValueChange,
		disabled = false,
		cssClass = '',
		class: className,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		children?: Snippet;
		multiple?: boolean;
		value?: readonly string[];
		defaultValue?: readonly string[];
		/** @deprecated Use defaultValue. */ defaultOpen?: string | string[];
		onValueChange?: ChangeHandler<string[], AccordionChangeDetails>;
		disabled?: boolean;
		/** @deprecated Use class. */ cssClass?: string;
	} = $props();
	function normalize(ids: readonly string[]): string[] {
		const unique = [...new Set(ids)];
		return multiple ? unique : unique.slice(0, 1);
	}
	const allowItemDefaults = untrack(() => value === undefined && defaultValue === undefined);
	const state = createControllableState<readonly string[], AccordionChangeDetails>({
		value: () => value,
		defaultValue: () =>
			normalize(
				defaultValue ??
					(Array.isArray(defaultOpen) ? defaultOpen : defaultOpen ? [defaultOpen] : [])
			),
		equals: (a, b) => a.length === b.length && a.every((id, i) => id === b[i]),
		onChange: (next, details) => onValueChange?.([...next], details)
	});
	const selected = $derived(normalize(state.value));
	function toggle(id: string, event?: Event) {
		if (disabled) return;
		const current = normalize(state.value);
		const next = current.includes(id)
			? current.filter((item) => item !== id)
			: multiple
				? [...current, id]
				: [id];
		state.request(next, { reason: 'trigger', itemId: id, event });
	}
	function open(id: string) {
		if (!allowItemDefaults || state.controlled) return;
		const current = normalize(state.value);
		if (current.includes(id) || (!multiple && current.length)) return;
		state.replace(multiple ? [...current, id] : [id]);
	}
	$effect(() => {
		const normalized = normalize(state.value);
		if (!state.controlled && normalized.length !== state.value.length) state.replace(normalized);
	});
	setContext<AccordionContext>(ACCORDION, {
		id: componentId,
		isOpen: (id) => normalize(state.value).includes(id),
		toggle,
		open,
		isDisabled: () => disabled
	});
</script>

<div
	{...rest}
	class={['accrd', className !== undefined ? className : cssClass]}
	data-state={selected.length ? 'open' : 'closed'}
	data-disabled={disabled || undefined}
>
	{@render children?.()}
</div>

<style>
	.accrd {
		border-radius: 6px;
		overflow: hidden;
	}

	:global(.accrd-item + .accrd-item) {
		border-top: var(--sc-border-ws) var(--sc-accordion-item-border-top-color);
	}
</style>
