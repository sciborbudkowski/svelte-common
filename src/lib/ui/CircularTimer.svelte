<!-- src/lib/ui/CircularTimer.svelte -->

<script lang="ts">
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

	const sizes: Record<UISize, number> = {
		xs: 20,
		sm: 30,
		md: 50,
		lg: 100,
		xl: 200
	};

	const strokes: Record<UISize, number> = {
		xs: 2,
		sm: 3,
		md: 5,
		lg: 10,
		xl: 20
	};

	const timeLeft: Record<UISize, string> = {
		xs: '.325rem',
		sm: '.5rem',
		md: '1rem',
		lg: '2rem',
		xl: '4rem'
	};

	const normalizedDuration = $derived(Number.isFinite(duration) && duration > 0 ? duration : 0);
	const pixelSize = $derived(sizes[size]);
	const strokeWidth = $derived(strokes[size]);
	const center = $derived(pixelSize / 2);
	const radius = $derived(center - strokeWidth / 2);
	const circumference = $derived(2 * Math.PI * radius);

	let remainingTime = $derived(normalizedDuration);
	let progress = $state(0);

	const strokeDshOffset = $derived(circumference - progress * circumference);

	$effect(() => {
		const total = normalizedDuration;
		if (total === 0) {
			remainingTime = 0;
			progress = 1;
			return;
		}

		const startedAt = performance.now();
		let frame: number;
		let finished = false;

		function tick(now: number) {
			const elapsed = now - startedAt;
			remainingTime = Math.max(0, total - elapsed);
			progress = Math.min(1, elapsed / total);

			if (remainingTime > 0) {
				frame = requestAnimationFrame(tick);
			} else if (!finished) {
				finished = true;
				void Promise.resolve(onTimeout?.()).catch((error) => {
					console.error('CircularTimer onTimeout failed: ', error);
				});
			}
		}

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
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
			<circle
				cx={center}
				cy={center}
				r={radius}
				stroke-width={strokes[size]}
				fill="transparent"
				class="progress-ring__background"
			/>
			<circle
				cx={center}
				cy={center}
				r={radius}
				stroke-width={strokes[size]}
				fill="transparent"
				class="progress-ring__progress"
			/>
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
		opacity: 0.25;
	}

	.progress-ring__progress {
		stroke: currentColor;
		opacity: 0.9;
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
		color: var(--sc-circular-timer-remaining-time-color);
		line-height: 0;
		margin: 0;
		padding: 0;
	}

	.time-unit {
		display: none;
		font-size: calc(var(--fs-timer) * 0.7);
		color: var(--sc-circular-timer-color);
		margin-left: 0.1em;
		line-height: 1;
	}
</style>
