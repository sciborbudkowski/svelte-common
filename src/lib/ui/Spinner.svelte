<!-- src/lib/ui/Spinner.svelte -->

<script lang="ts">
	let {
		width = '2rem',
		height = '2rem',
		border = '5px solid var(--sc-color-background)',
		spinnerColor = 'var(--sc-color-brand)',
		animationType = 'linear',
		durationMs = 1000,
		initialRotation = 180
	}: {
		width?: string;
		height?: string;
		border?: string;
		spinnerColor?: string;
		animationType?: 'linear' | 'ease' | 'ease-in' | 'ease-in-out';
		durationMs?: number;
		initialRotation?: number;
	} = $props();
</script>

<div
	class="spinner"
	style="
        --w: {width};
        --h: {height};
        --b: {border};
        --c: {spinnerColor};
        --at: {animationType};
        --d: {durationMs}ms;
        --ir: {initialRotation}deg;"
></div>

<style>
	.spinner {
		width: var(--w);
		height: var(--h);
		border: var(--b);
		border-bottom-color: var(--c);
		border-radius: 50%;
		display: inline-block;
		animation: rotation var(--d) var(--at) infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(var(--ir));
		}
		100% {
			transform: rotate(calc(var(--ir) + 360deg));
		}
	}
</style>
