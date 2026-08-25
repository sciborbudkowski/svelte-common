<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeTheme } from '../lib/index.js';

	let { children } = $props();

	onMount(initializeTheme);
</script>

{@render children()}
