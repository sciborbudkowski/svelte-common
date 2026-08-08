<script lang="ts">
    let w = $state(0);
    let h = $state(0);
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div class="indicator">
    [W: {w} | H: {h}]
</div>

<style>
    .indicator {
        z-index: 999;
        color: white;
        border: 1px solid white;
        padding: 6px;
        position: absolute;
        left: 10px;
        bottom: 10px;
        font-size: .66rem;
    }
</style>