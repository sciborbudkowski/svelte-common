<!-- src/lib/ui/Carousel.svelte -->
<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { createControllableState } from './internal/controllable.svelte.ts';
	import type {
		ChangeHandler,
		CarouselIndexChangeDetails,
		CarouselPauseChangeDetails,
		ButtonPartProps
	} from './contracts.ts';
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

	export type CarouselLabels = {
		region: string;
		slideRoleDescription: string;
		navigation: string;
		previous: string;
		next: string;
		pause: string;
		resume: string;
		pauseAction: string;
		resumeAction: string;
		slide: (index: number, total: number) => string;
		goToSlide: (index: number) => string;
	};
	let {
		slides,
		slideContent,
		timeout = 5000,
		autoplay = true,
		ariaLabel = 'Karuzela',
		index,
		defaultIndex = 0,
		onIndexChange,
		paused,
		defaultPaused = false,
		onPausedChange,
		disabled = false,
		autoplayIntervalMs,
		labels = {},
		previousButtonProps = {},
		nextButtonProps = {},
		paginationButtonProps = {},
		rotationButtonProps = {},
		class: cssClass,
		onfocusin,
		onmouseenter,
		onmouseleave,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		index?: number;
		defaultIndex?: number;
		onIndexChange?: ChangeHandler<number, CarouselIndexChangeDetails>;
		paused?: boolean;
		defaultPaused?: boolean;
		onPausedChange?: ChangeHandler<boolean, CarouselPauseChangeDetails>;
		disabled?: boolean;
		autoplayIntervalMs?: number;
		labels?: Partial<CarouselLabels>;
		previousButtonProps?: ButtonPartProps;
		nextButtonProps?: ButtonPartProps;
		paginationButtonProps?: ButtonPartProps;
		rotationButtonProps?: ButtonPartProps;
		/**
		 * Slides array must stay constant after component mount.
		 */
		slides: Slide[];
		slideContent?: Snippet<[Slide, number]>;
		timeout?: number;
		autoplay?: boolean;
		ariaLabel?: string;
	} = $props();

	const text = $derived({
		region: 'karuzela',
		slideRoleDescription: 'slajd',
		navigation: 'Nawigacja karuzeli',
		previous: 'Poprzedni slajd',
		next: 'Następny slajd',
		pause: 'Wstrzymaj',
		resume: 'Wznów',
		pauseAction: 'Wstrzymaj pokaz slajdów',
		resumeAction: 'Wznów pokaz slajdów',
		slide: (index: number, total: number) => `${index + 1} z ${total}`,
		goToSlide: (index: number) => `Przejdź do slajdu ${index + 1}`,
		...labels
	});
	const effectiveTimeout = $derived(autoplayIntervalMs ?? timeout);
	const DEFAULT_SLIDE_TIMEOUT = 5000;
	const slideTimeout = $derived(
		Number.isFinite(effectiveTimeout) && effectiveTimeout > 0
			? effectiveTimeout
			: DEFAULT_SLIDE_TIMEOUT
	);

	function normalizeIndex(value: number) {
		return Number.isFinite(value) ? Math.max(0, Math.min(slides.length - 1, Math.floor(value))) : 0;
	}
	const indexState = createControllableState<number, CarouselIndexChangeDetails>({
		value: () => index,
		defaultValue: () => normalizeIndex(defaultIndex),
		onChange: (next, details) => onIndexChange?.(next, details)
	});
	const pauseState = createControllableState<boolean, CarouselPauseChangeDetails>({
		value: () => paused,
		defaultValue: () => defaultPaused,
		onChange: (next, details) => onPausedChange?.(next, details)
	});
	const currentSlide = $derived(normalizeIndex(indexState.value));
	let renderedIndex = untrack(() => currentSlide);
	let currentLabel = $state(untrack(() => slideNumber(currentSlide)));
	let progressFill = $state(0);
	let isAnimating = $state(false);
	const pausedByUser = $derived(pauseState.value);
	let pausedByFocus = $state(false);
	let hovered = $state(false);
	let reducedMotion = $state(false);
	let motionReady = $state(false);
	const rotating = $derived(
		autoplay &&
			!disabled &&
			motionReady &&
			!pausedByUser &&
			!pausedByFocus &&
			!hovered &&
			!reducedMotion &&
			slides.length > 1
	);
	let transitionTimelines: { kill: () => void }[] = [];

	function pauseForFocus(event: FocusEvent): void {
		if (!(event.target instanceof Element) || !event.target.closest('.mc-rotation-control'))
			pausedByFocus = true;
	}
	function toggleRotation(
		event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
	): void {
		if (disabled || reducedMotion || !motionReady || rotationButtonProps.disabled) return;
		rotationButtonProps.onclick?.(event);
		if (event.defaultPrevented) return;
		if (pausedByFocus && !pauseState.value) {
			pausedByFocus = false;
			return;
		}
		pauseState.request(!pauseState.value, { reason: 'rotation-control', event });
		if (!pauseState.value) pausedByFocus = false;
	}
	function clearAnimationStyles(): void {
		gsapRef?.killTweensOf([...slideElements, ...contentElements, ...bgElements, currentCounterEl]);
		for (const timeline of transitionTimelines) timeline.kill();
		transitionTimelines = [];
		gsapRef?.set(
			[...slideElements, ...contentElements, ...bgElements, currentCounterEl].filter(Boolean),
			{ clearProps: 'transform,opacity' }
		);
		isAnimating = false;
		currentLabel = slideNumber(currentSlide);
	}
	$effect(() => {
		void slideTimeout;
		if (!rotating) {
			clearAutoplay();
			stopCounterProgress();
			gsapRef?.killTweensOf(bgElements);
		} else if (!isAnimating) {
			startCounterProgress();
			startBgZoom(currentSlide);
		}
	});
	$effect(() => {
		if (reducedMotion && motionReady) clearAnimationStyles();
	});

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
		if (!rotating) return;
		autoplayTimeout = setTimeout(() => {
			if (!isAnimating && rotating) {
				nextSlide(undefined, 'autoplay');
			}
		}, slideTimeout);
	}

	function startCounterProgress() {
		stopCounterProgress();
		if (!rotating) return;

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
		if (reducedMotion) {
			gsapRef.set(progressBarEl, { scaleX: (currentSlide + 1) / totalSlides });
			return;
		}
		if (totalSlides === 0) return;

		gsapRef.to(progressBarEl, {
			scaleX: (currentSlide + 1) / totalSlides,
			duration: 0.8,
			ease: 'power2.out'
		});
	}

	function updateCounter() {
		const nextLabel = slideNumber(currentSlide);
		if (!gsapRef || !currentCounterEl || reducedMotion) {
			currentLabel = nextLabel;
			return;
		}

		gsapRef.to(currentCounterEl, {
			y: -20,
			opacity: 0,
			duration: 0.3,
			onComplete: () => {
				if (!motionReady) return;
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
		if (!gsapRef || reducedMotion || !motionReady) return false;

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
		transitionTimelines.push(tlOut);
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
		transitionTimelines.push(tlIn);
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
						if (!motionReady) return;
						transitionTimelines = transitionTimelines.filter(
							(timeline) => timeline !== tlIn && timeline !== tlOut
						);
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
		if (!gsapRef || !rotating) return;
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

	type ButtonEvent = MouseEvent & { currentTarget: EventTarget & HTMLButtonElement };
	function goToSlide(
		next: number,
		reason: CarouselIndexChangeDetails['reason'],
		event?: ButtonEvent
	) {
		if (
			disabled ||
			totalSlides < 2 ||
			next < 0 ||
			next >= totalSlides ||
			next === currentSlide ||
			isAnimating
		)
			return;
		indexState.request(next, { reason, event });
		// A rejected automatic proposal must retain a fresh rotation deadline.
		if (reason === 'autoplay' && currentSlide !== next) startCounterProgress();
	}
	function nextSlide(event?: ButtonEvent, reason: CarouselIndexChangeDetails['reason'] = 'next') {
		if (event) {
			if (nextButtonProps.disabled) return;
			nextButtonProps.onclick?.(event);
			if (event.defaultPrevented) return;
		}
		if (totalSlides) goToSlide((currentSlide + 1) % totalSlides, reason, event);
	}
	function previousSlide(event?: ButtonEvent) {
		if (event) {
			if (previousButtonProps.disabled) return;
			previousButtonProps.onclick?.(event);
			if (event.defaultPrevented) return;
		}
		if (totalSlides) goToSlide((currentSlide - 1 + totalSlides) % totalSlides, 'previous', event);
	}
	function paginate(next: number, event: ButtonEvent) {
		if (paginationButtonProps.disabled) return;
		paginationButtonProps.onclick?.(event);
		if (!event.defaultPrevented) goToSlide(next, 'pagination', event);
	}
	$effect(() => {
		const next = currentSlide;
		void motionReady;
		if (next === renderedIndex) return;
		const previous = renderedIndex;
		renderedIndex = next;
		untrack(() => {
			clearAnimationStyles();
			stopCounterProgress();
			clearAutoplay();
			isAnimating = animateTransition(previous, next, next > previous ? 1 : -1);
			if (!isAnimating) startCounterProgress();
			updateCounter();
			updateProgressBar();
		});
	});

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
		const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
		reducedMotion = query?.matches ?? false;
		const handleMotion = () => {
			reducedMotion = query?.matches ?? false;
		};
		query?.addEventListener('change', handleMotion);

		void (async () => {
			const { gsap } = await import('gsap');
			if (disposed || !carouselEl) return;
			if (totalSlides === 0) return;

			renderedIndex = currentSlide;
			gsapRef = gsap;
			motionReady = true;
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

					if (index === currentSlide) {
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

				if (reducedMotion) clearAnimationStyles();
			}, carouselEl);
		})().catch((error) => {
			if (disposed) return;
			clearAutoplay();
			stopCounterProgress();
			clearAnimationStyles();
			gsapContext?.revert();
			gsapRef = null;
			motionReady = false;
			console.error('Carousel animation initialization failed: ', error);
		});

		return () => {
			disposed = true;
			motionReady = false;
			query?.removeEventListener('change', handleMotion);
			for (const timeline of transitionTimelines) timeline.kill();
			transitionTimelines = [];
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
	<div
		{...rest}
		class={['modern-carousel', cssClass]}
		data-index={currentSlide}
		data-paused={pausedByUser || pausedByFocus || undefined}
		data-disabled={disabled || undefined}
		bind:this={carouselEl}
		role="region"
		aria-roledescription={text.region}
		aria-label={rest['aria-label'] ?? ariaLabel}
		onfocusin={(event) => {
			onfocusin?.(event);
			pauseForFocus(event);
		}}
		onmouseenter={(event) => {
			onmouseenter?.(event);
			hovered = true;
		}}
		onmouseleave={(event) => {
			onmouseleave?.(event);
			hovered = false;
		}}
	>
		{#each slides as slide, index (slide.id)}
			<div
				class="mc-slide"
				class:is-active={index === currentSlide}
				role="group"
				aria-roledescription={text.slideRoleDescription}
				aria-label={text.slide(index, totalSlides)}
				aria-hidden={index !== currentSlide}
				inert={index !== currentSlide}
			>
				<div
					class="mc-slide-bg"
					style={createSlideStyle(slide.image, slide.filter, slide.backgroundPosition)}
				></div>
				<div class="mc-slide-content">
					{#if slideContent}{@render slideContent(slide, index)}{:else}
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
					{/if}
				</div>
			</div>
		{/each}

		{#if totalSlides > 1}
			<div class="mc-navigation" aria-label={text.navigation}>
				{#each slides as _, index (_.id)}
					<button
						type="button"
						{...paginationButtonProps}
						class={['mc-nav-item', paginationButtonProps.class]}
						disabled={disabled || paginationButtonProps.disabled}
						class:active={index === currentSlide}
						aria-label={paginationButtonProps['aria-label'] ?? text.goToSlide(index)}
						aria-pressed={index === currentSlide}
						onclick={(event) => paginate(index, event)}
					></button>
				{/each}
			</div>

			<div class="mc-slide-counter" aria-live={rotating ? 'off' : 'polite'}>
				{#if autoplay}
					<button
						type="button"
						{...rotationButtonProps}
						class={['mc-rotation-control', rotationButtonProps.class]}
						disabled={disabled || reducedMotion || !motionReady || rotationButtonProps.disabled}
						onclick={toggleRotation}
						aria-label={rotationButtonProps['aria-label'] ??
							(pausedByUser || pausedByFocus ? text.resumeAction : text.pauseAction)}
						>{pausedByUser || pausedByFocus ? text.resume : text.pause}</button
					>
				{/if}
				<button
					{...previousButtonProps}
					class={['counter-button', previousButtonProps.class]}
					type="button"
					disabled={disabled || previousButtonProps.disabled}
					aria-label={previousButtonProps['aria-label'] ?? text.previous}
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
					{...nextButtonProps}
					class={['counter-button', nextButtonProps.class]}
					type="button"
					disabled={disabled || nextButtonProps.disabled}
					aria-label={nextButtonProps['aria-label'] ?? text.next}
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
	.mc-rotation-control {
		color: inherit;
		background: transparent;
		border: 1px solid currentColor;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
	}
	@media (prefers-reduced-motion: reduce) {
		.mc-slide-bg {
			transform: none;
		}
	}

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
		opacity: 1;
		transform: translateY(0);
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
