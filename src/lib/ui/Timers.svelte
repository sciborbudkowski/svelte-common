<script lang="ts">
    import { onMount } from 'svelte';
    import { data } from '$lib/stores/data.svelte';
    import { toHMSTime, getTimeDifference } from '$lib/utils/date';

    let currentTime = $state('');
    let currentExerciseTime = $state('');

    onMount(() => {
        const ctt = setInterval(() => {
            currentTime = toHMSTime(Date.now());
            currentExerciseTime = getTimeDifference(Date.now(), data.exercise?.live_started_at);
        }, 1000);

        return () => {
            clearInterval(ctt);
        };
    });
</script>

<div class="timers">
    <div class="current">
        <i class="fa-solid fa-clock"></i>
        {currentTime}
    </div>
    <div class="exercise">
        <i class="fa-solid fa-hourglass-start"></i>
        {currentExerciseTime}
    </div>
</div>

<style lang="scss">
    .timers {
        display: flex;
        flex-direction: row;
        margin-left: 3rem;

        .current, .exercise {
            font-size: var(--font-size-4);
        }
        .current {
            font-weight: 200;
        }

        .exercise {
            font-weight: 400;
            margin-left: 2rem;
        }
    }
</style>