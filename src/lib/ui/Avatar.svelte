<!-- src/lib/ui/Avatar.svelte -->

<script lang="ts">
    let {
        initials = null,
        imageUrl = null,
        type = 'initials',
        size = 'normal',
        withShadow = '1',
        initialsColor = '#ffffff',
        backgroundColor = '#a5a320',
        ...rest
    }: {
        initials?: string | null;
        imageUrl?: string | null;
        type?: 'initials' | 'image' | 'mixed';
        size?: 'xxs' | 'xs' | 'normal' | 'xl' | 'xxl';
        withShadow?: string;
        initialsColor?: string;
        backgroundColor?: string;
    } = $props();
</script>

<div 
    class="avatar size-{size}"
    {...rest}
    style={`
        --s: var(--sc-shadow-${withShadow});
        --ic: ${initialsColor};
        --bc: ${backgroundColor};
    `}>
        {#if type === 'initials'}
            <div class="content">{initials ?? '??'}</div>
        {:else if type === 'image'}
            <img src={imageUrl} alt="avatar" class="image">
        {:else if type === 'mixed'}
            <div class="background" style:background-image={imageUrl ? `url('${imageUrl}')` : 'none'}>
                {initials ?? '??'}
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
        font-size: .5rem;
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
        border-radius: 50%;
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
        text-shadow: 0 1px 3px rgb(0 0 0 / .7);
    }
</style>