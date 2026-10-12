<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeTheme } from '$lib/stores/theme.svelte.js';
	import '$lib/styles.css';

	let { children } = $props();

	onMount(initializeTheme);
</script>

{@render children()}
