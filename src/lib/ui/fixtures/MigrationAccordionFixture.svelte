<script lang="ts">
	import Accordion from '../Accordion/Accordion.svelte';
	import AccordionItem from '../Accordion/AccordionItem.svelte';
	import type { AccordionProps } from '../types.ts';
	let {
		value,
		defaultValue,
		defaultOpen,
		multiple = false,
		disabled = false,
		onValueChange,
		legacyItemOpen = false
	}: Pick<
		AccordionProps,
		'value' | 'defaultValue' | 'defaultOpen' | 'multiple' | 'disabled' | 'onValueChange'
	> & { legacyItemOpen?: boolean } = $props();
</script>

<Accordion
	{value}
	{defaultValue}
	{defaultOpen}
	{multiple}
	{disabled}
	{onValueChange}
	class="custom-accordion"
	data-testid="selection"
>
	<AccordionItem
		id="one"
		title="One"
		defaultOpen={legacyItemOpen}
		triggerProps={{ class: 'custom-trigger' }}
		panelProps={{ class: 'custom-panel' }}>One content</AccordionItem
	>
	<AccordionItem id="two" title="Two">Two content</AccordionItem>
</Accordion>
