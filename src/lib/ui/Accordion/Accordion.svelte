<!-- src/lib/ui/Accordion/Accordion.svelte -->

<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';

	const ACCORDION = 'accordion-context';

	type AccordionContext = {
		isOpen: (id: string) => boolean;
		toggle: (id: string) => void;
	};

	let {
		children,
		multiple = false,
		defaultOpen = [],
		cssClass = ''
	}: {
		children?: Snippet;
		multiple?: boolean;
		defaultOpen?: string | string[];
		cssClass?: string;
	} = $props();

	function getDefaultOpenItems() {
		return Array.isArray(defaultOpen) ? defaultOpen : defaultOpen ? [defaultOpen] : [];
	}

	let openItems = $state(new Set<string>(getDefaultOpenItems()));

	function toggle(id: string) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local immutable-update copy, reassigned to $state below
		const next = new Set(openItems);

		if (multiple) {
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
		} else {
			if (next.has(id)) {
				next.clear();
			} else {
				next.clear();
				next.add(id);
			}
		}

		openItems = next;
	}

	const isOpen = (id: string) => openItems.has(id);

	setContext<AccordionContext>(ACCORDION, { isOpen, toggle });
</script>

<div class={`accrd ${cssClass}`}>
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
