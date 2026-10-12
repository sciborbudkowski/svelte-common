<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { loaderState } from '../stores/loader.svelte.ts';
	import LoaderView from './LoaderView.svelte';
	let props: Omit<
		ComponentProps<typeof LoaderView>,
		'open' | 'message' | 'progress' | 'status'
	> = $props();
</script>

<LoaderView
	{...props}
	open={loaderState.isVisible}
	message={loaderState.message}
	progress={loaderState.progress}
	status={loaderState.status}
/>
