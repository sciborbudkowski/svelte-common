<script lang="ts">
	let { name, class: cssClass = '' }: { name: string; class?: string } = $props();
	const paths: Record<string, string> = {
		close: 'M6 6l12 12M6 18L18 6',
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		'chevron-up': 'M5 15l7-7 7 7',
		'chevron-down': 'M5 9l7 7 7-7',
		'arrow-right': 'M4 12h16M13 5l7 7-7 7',
		info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 11v6M12 7h.01',
		error: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M8 8l8 8M8 16l8-8',
		success: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M7 12l3 3 7-7',
		warning: 'M12 3L2 21h20L12 3M12 9v5M12 17h.01'
	};
	const path = $derived(Object.hasOwn(paths, name) ? paths[name] : undefined);
</script>

{#if path}
	<svg
		class="sc-icon {cssClass}"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<path d={path} />
	</svg>
{:else}
	<i class="{name} {cssClass}" aria-hidden="true"></i>
{/if}

<style>
	.sc-icon {
		display: inline-block;
		flex-shrink: 0;
		vertical-align: middle;
	}
</style>
