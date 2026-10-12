<!-- src/lib/ui/Spinner.svelte -->

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	let {
		width = '2rem',
		height = '2rem',
		border = '5px solid var(--sc-color-background)',
		spinnerColor = 'var(--sc-color-brand)',
		animationType = 'linear',
		durationMs = 1000,
		initialRotation = 180,
		ariaLabel = undefined,
		class: cssClass,
		style,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		width?: string;
		height?: string;
		border?: string;
		spinnerColor?: string;
		animationType?: 'linear' | 'ease' | 'ease-in' | 'ease-in-out';
		durationMs?: number;
		initialRotation?: number;
		ariaLabel?: string;
	} = $props();
</script>

<div
	{...rest}
	class={['spinner', cssClass]}
	role={(rest['aria-label'] ?? ariaLabel) ? 'status' : undefined}
	aria-label={rest['aria-label'] ?? ariaLabel}
	aria-hidden={!(rest['aria-label'] ?? ariaLabel)}
	style="
        --w: {width};
        --h: {height};
        --b: {border};
        --c: {spinnerColor};
        --at: {animationType};
        --d: {durationMs}ms;
        --ir: {initialRotation}deg; {style ?? ''}"
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
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
