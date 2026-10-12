<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
	import FloatingButton from './FloatingButton.svelte';
	type Props = Omit<
		ComponentProps<typeof FloatingButton>,
		| keyof HTMLAttributes<HTMLElement>
		| 'type'
		| 'name'
		| 'value'
		| 'form'
		| 'formaction'
		| 'formmethod'
		| 'formenctype'
		| 'formnovalidate'
		| 'formtarget'
	> &
		HTMLAnchorAttributes & { id: string; href: string };
	let props: Props = $props();
</script>

<FloatingButton {...props as ComponentProps<typeof FloatingButton>} />
