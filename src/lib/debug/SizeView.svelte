<!-- src/lib/debug/SizeView.svelte -->
<script lang="ts">
    let {
        color = '#fff',
        backgroundColor = 'transparent',
        borderColor = 'fff',
        left = '10px',
        bottom = '10px',
        right = '',
        top = '',
        fontSize = '.75rem'
    }: {
        color?: string;
        backgroundColor?: string;
        borderColor?: string;
        left?: string;
        bottom?: string;
        right?: string;
        top?: string;
        fontSize?: string;
    } = $props();

    let w = $state(0);
    let h = $state(0);
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div
    class="indicator"
    style={`
        --sv-color: ${color};
        --sv-background-color: ${backgroundColor};
        --sv-border-color: ${borderColor};
        --sv-left: ${left};
        --sv-bottom: ${bottom};
        --sv-right: ${right};
        --sv-top: ${top};
        --sv-font-size: ${fontSize};
    `}
    >
    [W: {w} | H: {h}]
</div>

<style>
    .indicator {
        z-index: calc(var(--zi-always-top) + 1);
        color: var(--sv-color);
        background-color: var(--sv-background-color);
        border: 1px solid var(--sv-border-color);
        padding: 5px;
        position: absolute;
        left: var(--sv-left);
        bottom: var(--sv-bottom);
        right: var(--sv-right);
        top: var(--sv-top);
        font-size: var(--sv-font-size);
    }
</style>