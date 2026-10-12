<script lang="ts">
	import Accordion from '../Accordion/Accordion.svelte';
	import AccordionItem from '../Accordion/AccordionItem.svelte';
	let {
		initiallyOpen = false,
		secondInitiallyOpen = false,
		defaults = [],
		multiple = false,
		onOpenChange
	}: {
		initiallyOpen?: boolean;
		secondInitiallyOpen?: boolean;
		defaults?: string[];
		multiple?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();
</script>

<Accordion defaultOpen={defaults} {multiple}>
	<AccordionItem id="one" title="One" isOpen={initiallyOpen} {onOpenChange}
		>One content</AccordionItem
	>
	<AccordionItem id="two" title="Two" isOpen={secondInitiallyOpen}>Two content</AccordionItem>
</Accordion>
