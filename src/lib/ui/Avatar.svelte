<!-- src/lib/ui/Avatar.svelte -->

<script lang="ts">
	import type { HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	let {
		initials = null,
		imageUrl = null,
		type = 'initials',
		size = 'normal',
		withShadow = '1',
		initialsColor = '#ffffff',
		backgroundColor = '#a5a320',
		alt = '',
		imageProps = {},
		fallback,
		class: cssClass = '',
		style = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
		initials?: string | null;
		imageUrl?: string | null;
		type?: 'initials' | 'image' | 'mixed';
		size?: 'xxs' | 'xs' | 'normal' | 'xl' | 'xxl';
		withShadow?: string;
		initialsColor?: string;
		backgroundColor?: string;
		alt?: string;
		imageProps?: Omit<HTMLImgAttributes, 'src' | 'alt'>;
		fallback?: Snippet;
		style?: string;
	} = $props();
</script>

<div
	{...rest}
	class={['avatar', `size-${size}`, cssClass]}
	style={`
        --s: var(--sc-shadow-${withShadow});
        --ic: ${initialsColor};
        --bc: ${backgroundColor};
		${style}
    `}
>
	{#if type === 'initials'}
		<div class="content">
			{#if initials != null}{initials}{:else if fallback}{@render fallback()}{:else}??{/if}
		</div>
	{:else if type === 'image'}
		{#if imageUrl}
			<img {...imageProps} src={imageUrl} {alt} class={['image', imageProps.class]} />
		{/if}
	{:else if type === 'mixed'}
		<div
			class="background"
			style:background-image={imageUrl ? `url(${JSON.stringify(imageUrl)})` : 'none'}
		>
			{#if initials != null}{initials}{:else if fallback}{@render fallback()}{:else}??{/if}
		</div>
	{/if}
</div>

<style>
	.avatar {
		font-family: var(--sc-font-body);

		display: flex;
		align-items: center;
		justify-content: center;

		background-color: var(--bc);
		box-shadow: var(--s);
		color: var(--ic);
		border-radius: 50%;
		border: none;
	}

	.size-xxs {
		width: 1rem;
		height: 1rem;
		font-size: 0.5rem;
		font-weight: 200;
	}
	.size-xs {
		width: 2rem;
		height: 2rem;
		font-size: 1rem;
		font-weight: 200;
	}
	.size-normal {
		width: 3rem;
		height: 3rem;
		font-size: 1.5rem;
		font-weight: 400;
	}
	.size-xl {
		width: 4rem;
		height: 4rem;
		font-size: 2rem;
		font-weight: 600;
	}
	.size-xxl {
		width: 5rem;
		height: 5rem;
		font-size: 2.5rem;
		font-weight: 800;
	}

	.image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
	}

	.background {
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;

		background-position: center;
		background-repeat: no-repeat;
		background-size: cover;
		border-radius: inherit;

		color: var(--ic);
		text-shadow: 0 1px 3px rgb(0 0 0 / 0.7);
	}
</style>
