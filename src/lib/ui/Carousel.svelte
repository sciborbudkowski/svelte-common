<!-- src/lib/ui/Carousel.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scrollToTarget } from '../utils/scroll.ts';
	import { textToHtml } from '../utils/text.ts';

	export type Slide = {
		id: string;
		image: string;
		filter?: string;
		header: string;
		title: string;
		descriptionHtml: string;
		backgroundPosition?: 'left' | 'right' | 'center';
		buttons: {
			id: string;
			title: string;
			class: string;
			target: string;
			customStyle?: string;
		}[];
	};

	let {
		slides,
		timeout = 5000
	}: {
		/**
		 * Slides array must stay constant after component mount.
		 */
		slides: Slide[];
		timeout?: number;
	} = $props();

	const DEFAULT_SLIDE_TIMEOUT = 5000;
	const slideTimeout = $derived(
		Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_SLIDE_TIMEOUT
	);

	let currentSlide = $state(0);
	let currentLabel = $state('01');
	let progressFill = $state(0);
	let isAnimating = $state(false);

	let gsapRef: (typeof import('gsap'))['gsap'] | null = null;
	let autoplayTimeout: ReturnType<typeof setTimeout> | null = null;
	let progressInterval: ReturnType<typeof setInterval> | null = null;

	let progressBarEl: HTMLDivElement | null = $state(null);
	let currentCounterEl: HTMLSpanElement | null = $state(null);
	let carouselEl: HTMLDivElement | null = $state(null);
	let slideElements: HTMLDivElement[] = [];
	let bgElements: HTMLDivElement[] = [];
	let contentElements: HTMLDivElement[] = [];

	const totalSlides = $derived(slides.length);

	function slideNumber(index: number) {
		return String(index + 1).padStart(2, '0');
	}

	function clearAutoplay() {
		if (autoplayTimeout) {
			clearTimeout(autoplayTimeout);
			autoplayTimeout = null;
		}
	}

	function stopCounterProgress() {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		progressFill = 0;
	}

	function queueAutoplay() {
		clearAutoplay();
		autoplayTimeout = setTimeout(() => {
			if (!isAnimating) {
				nextSlide();
			}
		}, slideTimeout);
	}

	function startCounterProgress() {
		stopCounterProgress();
		if (totalSlides < 2) return;

		const increment = 100 / (slideTimeout / 50);
		progressInterval = setInterval(() => {
			progressFill = Math.min(progressFill + increment, 100);
			if (progressFill >= 100) {
				stopCounterProgress();
			}
		}, 50);

		queueAutoplay();
	}

	function updateProgressBar() {
		if (!gsapRef || !progressBarEl) return;
		if (totalSlides === 0) return;

		gsapRef.to(progressBarEl, {
			scaleX: (currentSlide + 1) / totalSlides,
			duration: 0.8,
			ease: 'power2.out'
		});
	}

	function updateCounter() {
		const nextLabel = slideNumber(currentSlide);
		if (!gsapRef || !currentCounterEl) {
			currentLabel = nextLabel;
			return;
		}

		gsapRef.to(currentCounterEl, {
			y: -20,
			opacity: 0,
			duration: 0.3,
			onComplete: () => {
				currentLabel = nextLabel;
				gsapRef?.set(currentCounterEl, { y: 20 });
				gsapRef?.to(currentCounterEl, {
					y: 0,
					opacity: 1,
					duration: 0.3
				});
			}
		});
	}

	function animateTransition(fromIndex: number, toIndex: number, direction: 1 | -1): boolean {
		if (!gsapRef) return false;

		const fromSlide = slideElements[fromIndex];
		const toSlide = slideElements[toIndex];
		const fromContent = contentElements[fromIndex];
		const toContent = contentElements[toIndex];
		const fromBg = bgElements[fromIndex];
		const toBg = bgElements[toIndex];

		if (!fromSlide || !toSlide || !fromContent || !toContent || !fromBg || !toBg) return false;
		gsapRef.killTweensOf(fromBg);
		gsapRef.killTweensOf(toBg);

		const tlOut = gsapRef.timeline();
		tlOut
			.to(fromContent, {
				y: direction * -100,
				opacity: 0,
				duration: 0.6,
				ease: 'power2.in'
			})
			.to(
				fromBg,
				{
					scale: 1.2,
					duration: 0.8,
					ease: 'power2.inOut'
				},
				0
			)
			.to(
				fromSlide,
				{
					y: `${direction * -100}vh`,
					opacity: 0,
					duration: 0.8,
					ease: 'power2.inOut'
				},
				0.2
			);

		gsapRef.set(toSlide, { y: `${direction * 100}vh`, opacity: 0 });
		gsapRef.set(toContent, { y: direction * 100, opacity: 0 });
		gsapRef.set(toBg, { scale: 1.2, y: 0 });

		const tlIn = gsapRef.timeline({ delay: 0.3 });
		tlIn
			.to(toSlide, {
				y: '0vh',
				opacity: 1,
				duration: 0.8,
				ease: 'power2.out'
			})
			.to(
				toBg,
				{
					scale: 1.1,
					duration: 1,
					ease: 'power2.out'
				},
				0
			)
			.to(
				toContent,
				{
					y: 0,
					opacity: 1,
					duration: 0.8,
					ease: 'power2.out',
					onComplete: () => {
						isAnimating = false;
						startCounterProgress();
						startBgZoom(toIndex);
					}
				},
				0.2
			);

		gsapRef.to(toBg, {
			y: direction * -50,
			duration: 2,
			ease: 'power1.out'
		});

		return true;
	}

	function startBgZoom(index: number) {
		if (!gsapRef) return;
		const bg = bgElements[index];
		if (!bg) return;

		gsapRef.killTweensOf(bg);
		gsapRef.to(bg, {
			scale: 1.22,
			duration: slideTimeout / 1000,
			ease: 'none',
			overwrite: 'auto'
		});
	}

	function goToSlide(index: number, forcedDirection?: 1 | -1) {
		if (totalSlides < 2) return;
		if (index < 0 || index >= totalSlides) return;
		if (index === currentSlide || isAnimating) return;

		isAnimating = true;
		stopCounterProgress();

		const fromIndex = currentSlide;
		const direction = forcedDirection ?? (index > currentSlide ? 1 : -1);

		const animating = animateTransition(fromIndex, index, direction);
		if (!animating) {
			isAnimating = false;
			startCounterProgress();
			return;
		}

		currentSlide = index;
		updateCounter();
		updateProgressBar();
	}

	function nextSlide() {
		if (totalSlides === 0) return;
		goToSlide((currentSlide + 1) % totalSlides, 1);
	}

	function previousSlide() {
		if (totalSlides === 0) return;
		goToSlide((currentSlide - 1 + totalSlides) % totalSlides, -1);
	}

	function cssUrl(value: string): string {
		return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
	}

	function createSlideStyle(image: string, filter?: string, bgPosition?: string): string {
		return `
			background-image: url("${cssUrl(image)}");
			${filter ? `filter: ${filter};` : ''}
			--bp: ${bgPosition ?? 'center'};`;
	}

	onMount(() => {
		let disposed = false;
		let gsapContext: { revert: () => void } | undefined;

		void (async () => {
			const { gsap } = await import('gsap');
			if (disposed || !carouselEl) return;
			if (totalSlides === 0) return;

			gsapRef = gsap;
			gsapContext = gsap.context(() => {
				slideElements = Array.from(carouselEl?.querySelectorAll<HTMLDivElement>('.mc-slide') ?? []);
				bgElements = Array.from(carouselEl?.querySelectorAll<HTMLDivElement>('.mc-slide-bg') ?? []);
				contentElements = Array.from(
					carouselEl?.querySelectorAll<HTMLDivElement>('.mc-slide-content') ?? []
				);

				slideElements.forEach((slide, index) => {
					const content = contentElements[index];
					const bg = bgElements[index];

					if (!slide || !content || !bg) return;

					if (index === 0) {
						gsap.set(slide, { y: '0vh', opacity: 1 });
						gsap.set(content, { y: 0, opacity: 1 });
						gsap.set(bg, { scale: 1.1, y: 0 });
					} else {
						gsap.set(slide, { y: '100vh', opacity: 0 });
						gsap.set(content, { y: 100, opacity: 0 });
						gsap.set(bg, { scale: 1.1, y: 0 });
					}
				});

				if (progressBarEl) {
					gsap.set(progressBarEl, {
						scaleX: (currentSlide + 1) / totalSlides,
						transformOrigin: 'left center'
					});
				}

				startCounterProgress();
				startBgZoom(currentSlide);
			}, carouselEl);
		})();

		return () => {
			disposed = true;
			clearAutoplay();
			stopCounterProgress();

			const targets = [
				...slideElements,
				...bgElements,
				...contentElements,
				progressBarEl,
				currentCounterEl
			].filter((element): element is HTMLElement => element !== null);

			gsapRef?.killTweensOf(targets);
			gsapContext?.revert();

			gsapRef = null;
			slideElements = [];
			bgElements = [];
			contentElements = [];
		};
	});
</script>

{#if totalSlides > 0}
	<div class="mc-progress-bar" bind:this={progressBarEl}></div>
	<div class="modern-carousel" bind:this={carouselEl}>
		{#each slides as slide, index (slide.id)}
			<div class="mc-slide" class:is-active={index === currentSlide}>
				<div
					class="mc-slide-bg"
					style={createSlideStyle(slide.image, slide.filter, slide.backgroundPosition)}
				></div>
				<div class="mc-slide-content">
					<h4>{slide.header}</h4>
					<h1>{slide.title}</h1>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches Carousel -->
					<p>{@html textToHtml(slide.descriptionHtml)}</p>
					<div class="buttons">
						{#each slide.buttons as button (button.id)}
							<button
								type="button"
								class={button.class}
								style={button.customStyle}
								onclick={() => scrollToTarget(button.target)}>{button.title}</button
							>
						{/each}
					</div>
				</div>
			</div>
		{/each}

		{#if totalSlides > 1}
			<div class="mc-navigation" aria-label="Nawigacja karuzeli">
				{#each slides as _, index (_.id)}
					<button
						type="button"
						class="mc-nav-item"
						class:active={index === currentSlide}
						aria-label={`Przejdź do slajdu ${index + 1}`}
						aria-pressed={index === currentSlide}
						onclick={() => goToSlide(index, index > currentSlide ? 1 : -1)}
					></button>
				{/each}
			</div>

			<div class="mc-slide-counter" aria-live="polite">
				<button
					class="counter-button"
					type="button"
					aria-label="Poprzedni slajd"
					onclick={previousSlide}
				>
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
						><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
							d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"
						/></svg
					>
				</button>
				<span class="current" bind:this={currentCounterEl}>{currentLabel}</span>
				<span class="separator">/</span>
				<span class="total">{slideNumber(totalSlides - 1)}</span>
				<button
					class="counter-button"
					type="button"
					aria-label="Następny slajd"
					onclick={nextSlide}
				>
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
						><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
							d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"
						/></svg
					>
				</button>
				<div class="mc-counter-progress">
					<span class="mc-counter-progress-fill" style={`width: ${progressFill}%;`}></span>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	h4 {
		display: inline-block;
		padding: var(--size-2) var(--size-3);
		margin-bottom: var(--size-4);
		font-family: var(--sc-carousel-font) !important;
		font-size: calc(var(--size-2) * 1.5);
		font-weight: 700;
		letter-spacing: var(--font-ls-5);
		text-transform: uppercase;
		background-color: var(--sc-carousel-header-bg);
		border: var(--sc-border-ws) var(--sc-carousel-header-border);
		border-radius: var(--sc-border-radius);
		color: var(--sc-color-brand);
	}

	h1 {
		font-family: var(--sc-font-header) !important;
		font-size: clamp(2.3rem, 9vw, 5.35rem);
		font-weight: 700;
		letter-spacing: calc(var(--font-ls-0) * 0.5);
		line-height: 1.05;
		margin-bottom: var(--size-7);
		text-transform: uppercase;
		background: var(--sc-carousel-title-bg);
		background-size: 400% 400%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradientShift 6s ease infinite;
		white-space: normal;
		word-break: normal;
		filter: var(--sc-carousel-title-filter);
	}

	.modern-carousel {
		height: 100vh;
		overflow: hidden;
		position: relative;
		background-color: var(--sc-carousel-bg);
		width: 100%;
	}

	.mc-slide {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: translateY(100vh);
		max-width: 100vw;
		overflow: hidden;
		pointer-events: none;
	}

	.mc-slide.is-active {
		pointer-events: auto;
	}

	.mc-slide-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 120%;
		background-size: cover;
		background-position: var(--bp);
		filter: brightness(0.7);
		transform: scale(1.1);
		z-index: var(--zi-1);
	}

	.mc-slide-content {
		font-family: var(--sc-font-code);
		position: relative;
		z-index: var(--zi-2);
		text-align: center;
		color: var(--sc-carousel-slide-content-text);
		max-width: 900px;
		padding: var(--size-7) var(--size-3);
		border-radius: var(--size-3);
	}

	.mc-slide-content p {
		max-width: 42rem;
		margin: 0 auto 2.25rem;
		font-size: clamp(1rem, 1.5vw, 1.2rem);
		font-weight: 400;
		color: var(--sc-carousel-slide-content-text);
		text-align: center;
	}

	.mc-slide-content .buttons {
		display: flex;
		flex-direction: row;
		gap: var(--size-2);
		justify-content: center;
	}

	.mc-slide-subtitle {
		font-size: clamp(1.2rem, 3vw, 2rem);
		font-weight: 400;
		letter-spacing: var(--font-ls-2);
		opacity: 0.85;
		margin-bottom: var(--size-3);
		text-indent: 0;
		text-align: center;
		border-radius: var(--sc-border-radius);
		padding: var(--size-3);
		background-color: var(--sc-carousel-slide-subtitle-bg);
	}

	.mc-navigation {
		position: absolute;
		right: 2.5rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: var(--zi-2);
	}

	.mc-nav-item {
		width: calc(var(--size-2) * 1.5);
		height: calc(var(--size-2) * 1.5);
		aspect-ratio: 1 / 1;
		border: var(--sc-border-ws) var(--sc-carousel-nav-item-border);
		border-radius: var(--sc-border-radius);
		margin: var(--size-3) 0;
		cursor: pointer;
		transition: all var(--sc-transition-duration) var(--sc-transition-type);
		position: relative;
		display: block;
		background: transparent;
		padding: 0;
		box-sizing: border-box;
		appearance: none;
		flex-shrink: 0;
	}

	.mc-nav-item.active {
		background-color: var(--sc-carousel-nav-item-active-bg);
		border-color: var(--sc-carousel-nav-item-active-border-color);
		transform: scale(1.65);
	}

	.mc-nav-item:hover {
		border-color: var(--sc-carousel-nav-item-hover-border-color);
		transform: scale(2);
	}

	.mc-progress-bar {
		position: fixed;
		right: 0;
		top: 0;
		width: 100%;
		height: 3px;
		background: var(--sc-carousel-progress-bar-background);
		z-index: var(--zi-2);
		transform-origin: left;
		transform: scaleX(0);
	}

	.mc-slide-counter {
		position: absolute;
		bottom: 2.5rem;
		right: 2.5rem;
		color: var(--sc-carousel-slide-counter-color);
		font-size: var(--font-size-3);
		font-weight: 300;
		z-index: var(--zi-2);
		display: grid;
		grid-template-columns: auto auto auto auto auto;
		gap: var(--size-2);
		align-items: center;
		min-width: 10rem;
	}

	.counter-button {
		border: 0;
		background-color: var(--sc-carousel-counter-button-bg);
		color: var(--sc-carousel-counter-button-color);
		padding: 0;
		transition: transform 0.2s ease;
	}

	.counter-button:hover {
		transform: scale(1.15);
	}

	.current,
	.total,
	.separator {
		display: inline-block;
	}

	.mc-counter-progress {
		grid-column: 1 / -1;
		width: 100%;
		height: 4px;
		background-color: var(--sc-carousel-counter-progress-bg);
		margin-top: var(--size-2);
		border-radius: 4px;
		overflow: hidden;
	}

	.mc-counter-progress-fill {
		display: block;
		height: 100%;
		background-color: var(--sc-carousel-counter-progress-fill-bg);
		border-radius: 1px;
		transition: width 50ms linear;
	}

	.main-logo-container {
		position: absolute;
		bottom: var(--size-7);
		left: var(--size-7);
		z-index: var(--zi-1);
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--size-3);
	}

	.main-logo {
		width: 100%;
		text-align: center;
	}

	.main-description {
		font-weight: 600;
		font-style: italic;
		color: var(--sc-carousel-main-description-color);
		padding: var(--size-2) var(--size-3);
		font-size: clamp(1rem, 4vw, 1.5rem);
		border-radius: 4px;
		text-align: center;
		text-shadow: 3px 3px 3px var(--sc-carousel-main-description-shadow-color);
	}

	@keyframes gradientShift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	@media (max-width: 991px) {
		.main-logo-container {
			bottom: var(--size-3);
			left: var(--size-3);
			right: var(--size-3);
		}

		.mc-slide-content {
			padding: 0 20px;
			max-width: 100%;
		}

		.mc-navigation {
			right: var(--size-3);
		}

		.mc-nav-item {
			width: var(--size-2);
			height: var(--size-2);
			margin: calc(var(--size-2) * 1.5) 0;
		}

		.mc-nav-item.active {
			transform: scale(1.5);
		}

		.mc-slide-counter {
			bottom: var(--size-5);
			right: var(--size-5);
			font-size: var(--size-3);
		}
	}

	@media (max-width: 640px) {
		.modern-carousel {
			min-height: 100svh;
			height: 100svh;
		}

		.mc-slide-counter {
			right: var(--size-3);
			left: auto;
			bottom: calc(var(--size-3) * 4);
			min-width: 8.25rem;
		}
	}
</style>
