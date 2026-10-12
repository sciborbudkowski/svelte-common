<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import {
		getVisibleToasts,
		getToastGeneration,
		dismissToast
	} from '../stores/toaststack.svelte.ts';
	import ToastStackView from './ToastStackView.svelte';
	let props: Omit<
		ComponentProps<typeof ToastStackView>,
		'items' | 'onDismiss' | 'getGeneration'
	> = $props();
</script>

<ToastStackView
	{...props}
	items={getVisibleToasts()}
	onDismiss={dismissToast}
	getGeneration={getToastGeneration}
/>
