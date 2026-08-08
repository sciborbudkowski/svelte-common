<script lang="ts">
    import { onMount } from 'svelte';
    
    export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    let {
        duration = 5000,
        size = 'sm',
        onTimeout = undefined,
        withNumericTimer = false
    }: {
        duration?: number;
        size?: UISize;
        onTimeout?: () => void | Promise<void>;
        withNumericTimer?: boolean;
    } = $props();

    const getDuration = () => duration;
    const getSize = () => size;

    let startTime: number | null = $state(null);
    let remainingTime = $state(getDuration());
    let progress = $state(0);
    let animationFrame: number | null = $state(null);
    let intervalId: ReturnType<typeof setInterval> | null = $state(null);

    const sizes: Record<UISize, number> = {
        'xs': 20,
        'sm': 30,
        'md': 50,
        'lg': 100,
        'xl': 200
    };

    const strokes: Record<UISize, number> = {
        'xs': 2,
        'sm': 3,
        'md': 5,
        'lg': 10,
        'xl': 20
    };

    const timeLeft: Record<UISize, string> = {
        'xs': '.325rem;',
        'sm': '.5rem',
        'md': '1rem',
        'lg': '2rem',
        'xl': '4rem'
    };

    const center = sizes[getSize()] / 2;
    const radius = center - strokes[getSize()] / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDshOffset = $derived(circumference - (progress * circumference));

    function startTimer() {
        if(animationFrame) return;
        startTime = Date.now();
        tick();
    }

    function stopTimer() {
        if(animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if(intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // function resetTimer() {
    //     stopTimer();
    //     remainingTime = duration;
    //     progress = 0;
    //     startTime = null;
    // }

    function tick() {
        if(!startTime) return;

        const elapsed = Date.now() - startTime;
        remainingTime = Math.max(0, duration - elapsed);
        progress = Math.min(1, elapsed / duration);

        if(remainingTime > 0) {
            animationFrame = requestAnimationFrame(tick);
        } else {
            stopTimer();
            onTimeout?.();
        }
    }

    onMount(() => {
        startTimer();
        intervalId = setInterval(() => {
            if(startTime && remainingTime > 0) {
                remainingTime = Math.max(0, duration - (Date.now() - startTime));
            }
        }, 100);

        return () => stopTimer();
    });
</script>

<div style={`--fs-timer:${timeLeft[size]}`}>
    <div class="circular-progress-timer">
        <svg
            width={sizes[size]}
            height={sizes[size]}
            class="progress-ring"
            style={`--stroke-dashoffset:${strokeDshOffset}px; --circumference:${circumference}px;`}
        >
            <circle cx={center} cy={center} r={radius} stroke-width={strokes[size]} fill="transparent" class="progress-ring__background" />
            <circle cx={center} cy={center} r={radius} stroke-width={strokes[size]} fill="transparent" class="progress-ring__progress" />
        </svg>
        <div class="timer" style={`display:${withNumericTimer ? 'flex' : 'none'};`}>
            <span class="remaining-time">{(remainingTime / 1000).toFixed(1)}</span>
            <span class="time-unit">s</span>
        </div>
    </div>
</div>

<style>
    .circular-progress-timer {
        position: relative;
        display: block;
        line-height: 0;
    }
  
    .progress-ring {
        display: block;
        transform: rotate(-90deg);
    }
  
    .progress-ring__background {
        stroke: currentColor;
        opacity: .25;
    }
  
    .progress-ring__progress {
        stroke: currentColor;
        opacity: .9;
        stroke-dasharray: var(--circumference);
        stroke-dashoffset: var(--stroke-dashoffset);
        transition: stroke-dashoffset 0.1s linear;
        stroke-linecap: round;
    }
  
     .timer {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: monospace;
        width: 100%;
        height: 100%;
        pointer-events: none;
        margin: 0;
        padding: 0;
     }
  
    .remaining-time {
        font-size: var(--fs-timer);
        font-weight: bold;
        color: rgb(var(--clr-darkgray-rgb) / .75);
        line-height: 0;
        margin: 0;
        padding: 0;
    }
  
    .time-unit {
        display: none;
        font-size: calc(var(--fs-timer) * 0.7);
        color: rgb(var(--clr-darkgray-rgb) / .5);
        margin-left: 0.1em;
        line-height: 1;
    }
</style>
