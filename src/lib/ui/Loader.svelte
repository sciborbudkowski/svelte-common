<!-- src/lib/ui/Loader.svelte -->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { loaderState } from '$lib/stores/loader.svelte';
</script>

{#if loaderState.isVisible}
	<div class="loader-overlay" transition:fade={{ duration: 150, easing: (t) => t * (2 - t) }}>
		<div class="loader-content" transition:fly={{ y: 20, duration: 400 }}>
			<div class="spinner"></div>
			<h4>{loaderState.message}</h4>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {loaderState.progress}%"></div>
			</div>
			<p class="status">{loaderState.status}</p>
		</div>
	</div>
{/if}

<style>
	.loader-overlay {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		background-color: var(--sc-loader-overlay) !important;
		display: flex !important;
		flex-direction: column !important;
		justify-content: center !important;
		align-items: center !important;
		z-index: 10001 !important;
		visibility: visible !important;
		pointer-events: auto !important;
		backdrop-filter: blur(4px);
		padding: 0 1rem;
		box-sizing: border-box;
	}

	.loader-content {
		background: var(--sc-loader-content);
		backdrop-filter: var(--backdrop-filter);
		padding: 2.5rem;
		border-radius: 16px;
		text-align: center;
		min-width: 320px;
		max-width: 380px;
		box-shadow: 0 8px 32px var(--sc-loader-content);
		border: 1px solid var(--sc-loader-content-border);
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 6px solid var(--sc-loader-spinner);
		border-top: 6px solid var(--sc-loader-spinner-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	h4 {
		margin-bottom: 1rem;
		color: var(--sc-loader-title);
	}

	.progress-bar {
		width: 100%;
		height: 10px;
		background: var(--sc-loader-progress-bar);
		border-radius: 5px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%);
		transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 5px;
		position: relative;
		overflow: hidden;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgb(var(--clr-white-rgb) / 0.4), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.status {
		color: var(--sc-loader-status);
		font-size: var(--font-size-1);
		margin: 0;
	}
</style>
