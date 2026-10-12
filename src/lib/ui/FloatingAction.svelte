<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAttributes } from 'svelte/elements';
	import FloatingButton from './FloatingButton.svelte';
	type Props = Omit<
		ComponentProps<typeof FloatingButton>,
		| keyof HTMLAttributes<HTMLElement>
		| 'href'
		| 'target'
		| 'download'
		| 'rel'
		| 'hreflang'
		| 'referrerpolicy'
	> &
		HTMLButtonAttributes & { id: string };
	let props: Props = $props();
</script>

<FloatingButton {...props as ComponentProps<typeof FloatingButton>} href={undefined} />
