<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import Accordion from '$lib/ui/Accordion/Accordion.svelte';
	import AccordionItem from '$lib/ui/Accordion/AccordionItem.svelte';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Carousel from '$lib/ui/Carousel.svelte';
	import CircularTimer from '$lib/ui/CircularTimer.svelte';
	import CollapsibleCard from '$lib/ui/CollapsibleCard.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ManagedModal from '$lib/ui/ManagedModal.svelte';
	import AlertModal from '$lib/ui/Modals/AlertModal.svelte';
	import ConfirmModal from '$lib/ui/Modals/ConfirmModal.svelte';
	import FloatingButton from '$lib/ui/FloatingButton.svelte';
	import FloatingAction from '$lib/ui/FloatingAction.svelte';
	import FloatingLink from '$lib/ui/FloatingLink.svelte';
	import Loader from '$lib/ui/Loader.svelte';
	import LoaderView from '$lib/ui/LoaderView.svelte';
	import ScrollHint from '$lib/ui/ScrollHint.svelte';
	import ScrollIndicator from '$lib/ui/ScrollIndicator.svelte';
	import Spinner from '$lib/ui/Spinner.svelte';
	import ToastStack from '$lib/ui/ToastStack.svelte';
	import ToastStackView from '$lib/ui/ToastStackView.svelte';
	import SizeView from '$lib/debug/SizeView.svelte';
	import { themeState, setTheme, type ThemePreference } from '$lib/stores/theme.svelte.js';
	import {
		openModal,
		closeModal,
		openAlertModal,
		closeAlertModal,
		requestConfirmation
	} from '$lib/stores/modals.js';
	import {
		showToast,
		clearToasts,
		type UIToast,
		type UIToastType
	} from '$lib/stores/toaststack.svelte.js';
	import { showLoaderSequence, hideLoader } from '$lib/stores/loader.svelte.js';
	import type { Slide } from '$lib/ui/Carousel.svelte';
	import type { OpenChangeDetails } from '$lib/ui/contracts.js';
	import landscape from './demo/landscape.svg?url';
	import portrait from './demo/avatar.svg?url';

	const codeExamples = [
		`import Avatar from 'svelte-common/components/Avatar';\n\n<Avatar initials="SC" size="xl" />`,
		`import Spinner from 'svelte-common/components/Spinner';\n\n<Spinner width="50px" height="50px" aria-label="Loading" />`,
		`<CollapsibleCard {open} onOpenChange={(next) => { open = next; }}>\n  {#snippet visibleContent()}Summary{/snippet}\n  {#snippet hiddenContent()}Details{/snippet}\n</CollapsibleCard>`,
		`<Accordion {value} onValueChange={(next) => { value = next; }}>\n  <AccordionItem id="details" title="Details">Content</AccordionItem>\n</Accordion>`,
		`import Dialog from 'svelte-common/components/Dialog';\n\n<Dialog {open} onOpenChange={(next) => { open = next; }}>\n  {#snippet header()}Your dialog{/snippet}\n  <p>Your content</p>\n</Dialog>`,
		`import { requestConfirmation } from 'svelte-common/stores/modals';\n\nconst accepted = await requestConfirmation('Continue?');\n// Mount <ConfirmModal /> once.`,
		`import { showToast } from 'svelte-common/stores/toasts';\n\nshowToast({ type: 'success', message: 'Saved.', autoClose: true });\n// Mount <ToastStack /> once.`,
		`<button class="brand">Primary</button>\n<button class="success outline">Secondary</button>\n<div class="btn-group">...</div>`,
		`<div class="grid-2x2 gap-3">\n  <div class="p-3 br-3">One</div>\n  ...\n</div>\n<div class="flex-r a-center j-content-between">...</div>`,
		`.my-component {\n  color: var(--sc-color-text);\n  background: var(--sc-color-surface);\n  padding: var(--size-3);\n}`,
		`import Avatar from 'svelte-common/components/Avatar';\nimport { ApiClient } from 'svelte-common/services/api';\nimport { friendlyFileSize } from 'svelte-common/utils/file-size';\n\nimport 'svelte-common/tokens.css';\nimport 'svelte-common/styles/buttons.css';`
	];

	const sections = [
		['components', 'Components'],
		['overlays', 'Dialogs & feedback'],
		['motion', 'Motion & scrolling'],
		['styles', 'CSS helpers'],
		['imports', 'Imports']
	] as const;
	const avatarSizes = ['xxs', 'xs', 'normal', 'xl', 'xxl'] as const;
	const spinnerSizes = [20, 30, 50, 70, 90] as const;
	const toastTypes: UIToastType[] = ['info', 'success', 'warning', 'error', 'neutral'];
	const themeOptions: ThemePreference[] = ['light', 'dark', 'system'];
	let cardOpen = $state(false);
	let rejectCardChanges = $state(false);
	let cardMessage = $state('Ready to expand');
	let accordionValue = $state<string[]>(['delivery']);
	let multiple = $state(false);
	let dialogOpen = $state(false);
	let localDialogKey = $state(0);
	let localDialogOpen = $state(false);
	let dialogName = $state('Alex');
	let dialogMessage = $state('No action yet');
	let confirmationMessage = $state('No confirmation yet');
	let confirming = $state(false);
	let loaderRunning = $state(false);
	let localLoaderOpen = $state(false);
	let localProgress = $state(50);
	let localToasts = $state<UIToast[]>([]);
	let localToastId = 0;
	let slideIndex = $state(0);
	let slidePaused = $state(true);
	let timerRun = $state(0);
	let timerActive = $state(false);
	let timerFinished = $state(false);
	let floatingVisible = $state(false);
	let scrollTarget = $state<HTMLDivElement>();
	let showHint = $state(true);
	let showSize = $state(false);
	let email = $state('');
	let notifications = $state(true);
	let plan = $state('starter');
	let volume = $state(50);
	let formMessage = $state('Try the controls, then submit.');
	let selectedButton = $state('None');
	let disposed = false;
	// Promises resolve on teardown so a sequence never retains an abandoned page.
	const waits: { timer: ReturnType<typeof setTimeout>; resolve: () => void }[] = [];
	function delay(ms: number) {
		return new Promise<void>((resolve) => {
			const pending = {
				timer: setTimeout(() => {
					waits.splice(waits.indexOf(pending), 1);
					resolve();
				}, ms),
				resolve
			};
			waits.push(pending);
		});
	}
	function changeCard(next: boolean) {
		if (rejectCardChanges) {
			cardMessage = 'Change rejected by the parent';
		} else {
			cardOpen = next;
			cardMessage = next ? 'Expanded by the parent' : 'Collapsed by the parent';
		}
	}
	function changeDialog(next: boolean, details: OpenChangeDetails) {
		dialogOpen = next;
		dialogMessage = `Visibility changed: ${details.reason}`;
	}
	async function confirmDemo() {
		confirming = true;
		try {
			const accepted = await requestConfirmation('Apply these demonstration settings?');
			if (!disposed)
				confirmationMessage = accepted
					? 'Confirmed. Settings applied.'
					: 'Cancelled. Settings kept.';
		} finally {
			if (!disposed) confirming = false;
		}
	}
	function toast(type: UIToastType) {
		showToast({
			type,
			title: `${type[0].toUpperCase()}${type.slice(1)} toast`,
			message: 'A **store-backed** notification. Close it or wait five seconds.',
			autoClose: true,
			duration: 5000
		});
	}
	function addLocalToast() {
		const id = `local-${++localToastId}`;
		localToasts = [
			{
				id,
				message: 'This toast belongs to this page.',
				type: 'info' as const,
				timestamp: Date.now(),
				autoClose: false
			},
			...localToasts
		].slice(0, 3);
	}
	async function runLoader() {
		if (loaderRunning) return;
		loaderRunning = true;
		try {
			await showLoaderSequence(
				[
					{ progress: 15, status: 'Preparing', callback: () => delay(600) },
					{ progress: 65, status: 'Applying settings', callback: () => delay(600) },
					{ progress: 100, status: 'Complete', callback: () => delay(400) }
				],
				{ message: 'A short demonstration' }
			);
		} finally {
			if (!disposed) loaderRunning = false;
		}
	}
	function startTimer() {
		timerFinished = false;
		timerRun++;
		timerActive = true;
	}
	const slides: Slide[] = [
		{
			id: 'compose',
			image: landscape,
			header: '01 / Compose',
			title: 'Small pieces.\nUseful interfaces.',
			descriptionHtml: 'Components with **typed props** and customizable content.',
			buttons: []
		},
		{
			id: 'control',
			image: landscape,
			filter: 'hue-rotate(35deg)',
			header: '02 / Control',
			title: 'Your state.\nYour decisions.',
			descriptionHtml: 'Accept a change proposal, or keep your current state.',
			buttons: []
		},
		{
			id: 'theme',
			image: landscape,
			filter: 'hue-rotate(290deg)',
			header: '03 / Theme',
			title: 'One palette.\nTwo themes.',
			descriptionHtml: 'Shared CSS tokens adapt to light and dark mode.',
			buttons: []
		}
	];
	onDestroy(() => {
		disposed = true;
		for (const pending of waits.splice(0)) {
			clearTimeout(pending.timer);
			pending.resolve();
		}
		if (browser) {
			if (loaderRunning) hideLoader();
			clearToasts();
			closeAlertModal();
			closeModal('demo-legacy');
			closeModal('demo-managed');
		}
	});
</script>

<svelte:head>
	<title>svelte-common · Component playground</title>
	<meta
		name="description"
		content="Interactive Svelte 5 component examples, dialogs, feedback, shared styles and CSS helpers from svelte-common."
	/>
</svelte:head>

<a class="skip-link" href="#main">Skip to examples</a>
<div class="playground">
	<header class="site-header">
		<a class="wordmark" href="#main"
			><span class="brand-mark" aria-hidden="true">sc</span>svelte-common</a
		>
		<div class="header-actions">
			<span class="version">Svelte 5</span>
			<fieldset class="theme-picker">
				<legend class="sr-only">Color theme</legend>
				{#each themeOptions as preference (preference)}
					<button
						type="button"
						aria-pressed={themeState.preference === preference}
						onclick={() => setTheme(preference)}>{preference}</button
					>
				{/each}
			</fieldset>
		</div>
	</header>
	<main id="main">
		<section class="hero" aria-labelledby="page-title">
			<div>
				<p class="eyebrow">THE COMPONENT PLAYGROUND</p>
				<h1 id="page-title">A little common ground<br />for your next interface.</h1>
				<p class="hero-description">
					Explore the components, try their interactions, and see what a few shared CSS classes can
					do. Everything here runs on svelte-common.
				</p>
			</div>
			<div class="hero-note">
				<span class="status-dot" aria-hidden="true"></span><span
					>Interactive examples<br /><small>Light, dark, and your own state</small></span
				>
			</div>
		</section>
		<nav class="section-nav" aria-label="Example sections">
			{#each sections as [id, title] (id)}<a href={`#${id}`}>{title}</a>{/each}
		</nav>

		<section id="components" class="demo-section" aria-labelledby="components-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow">01 / THE BASICS</p>
					<h2 id="components-heading">Components, up close.</h2>
				</div>
				<p>Real components. A few controls to make them your own.</p>
			</div>
			<div class="demo-grid">
				<article class="example-card">
					<div class="example-heading">
						<h3>Avatar</h3>
						<span class="tag">presentation</span>
					</div>
					<p class="description">
						Initials, images and mixed content, from extra small to extra large.
					</p>
					<div class="preview avatar-preview">
						{#each avatarSizes as size (size)}<div class="sample">
								<Avatar
									initials="SC"
									{size}
									backgroundColor="var(--sc-color-brand)"
									aria-label={`Initials avatar, ${size}`}
								/><span>{size}</span>
							</div>{/each}
					</div>
					<div class="avatar-modes">
						<Avatar type="image" imageUrl={portrait} alt="Illustrated profile" /><Avatar
							type="mixed"
							initials="AB"
							imageUrl={portrait}
							aria-label="Mixed avatar"
						/><Avatar aria-label="Custom fallback">{#snippet fallback()}?{/snippet}</Avatar><span
							class="text-muted">Image · mixed · fallback</span
						>
					</div>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[0]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Spinner</h3>
						<span class="tag">feedback</span>
					</div>
					<p class="description">
						The same loading indicator in five sizes. Label it when it conveys status.
					</p>
					<div class="preview spinner-preview">
						{#each spinnerSizes as size (size)}<div class="sample">
								<Spinner
									width={`${size}px`}
									height={`${size}px`}
									aria-label={`Loading, ${size} pixels`}
								/><span>{size}</span>
							</div>{/each}
					</div>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[1]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>CollapsibleCard</h3>
						<span class="tag">controlled</span>
					</div>
					<p class="description">
						The parent decides whether to accept a change. Switch on the lock to try rejecting one.
					</p>
					<div class="preview block-preview">
						<CollapsibleCard
							open={cardOpen}
							onOpenChange={changeCard}
							showMoreLabel="Show details"
							showLessLabel="Hide details"
						>
							{#snippet visibleContent()}<strong>A little more information</strong>{/snippet}
							{#snippet hiddenContent()}<p class="expanded-copy">
									This content follows the accepted open prop. A rejected toggle leaves it closed or
									open exactly as it was.
								</p>{/snippet}
						</CollapsibleCard>
					</div>
					<label class="switch"
						><input type="checkbox" bind:checked={rejectCardChanges} />Reject toggle requests</label
					>
					<p class="readout" role="status">{cardMessage} · open = {String(cardOpen)}</p>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[2]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Accordion</h3>
						<span class="tag">controlled</span>
					</div>
					<p class="description">One parent selection, with either one open panel or several.</p>
					<div class="preview block-preview">
						<Accordion
							value={accordionValue}
							{multiple}
							onValueChange={(next) => {
								accordionValue = next;
							}}
						>
							<AccordionItem id="delivery" title="Delivery" icon="plus"
								><p class="expanded-copy">
									Reusable components with shared styles, typed props and accessible controls.
								</p></AccordionItem
							>
							<AccordionItem id="returns" title="Returns" icon="plus"
								><p class="expanded-copy">
									State belongs to the parent when value is supplied. Defaults initialize local
									state only.
								</p></AccordionItem
							>
							<AccordionItem id="support" title="Support" icon="plus"
								><p class="expanded-copy">
									Root attributes and part props let each application adapt the presentation.
								</p></AccordionItem
							>
						</Accordion>
					</div>
					<label class="switch"
						><input
							type="checkbox"
							checked={multiple}
							onchange={(event) => {
								multiple = event.currentTarget.checked;
								if (!multiple) accordionValue = accordionValue.slice(0, 1);
							}}
						/>Allow multiple panels</label
					>
					<p class="readout">Selected: {accordionValue.join(', ') || 'none'}</p>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[3]}</code></pre>
					</details>
				</article>
			</div>
		</section>

		<section id="overlays" class="demo-section" aria-labelledby="overlays-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow">02 / FEEDBACK & FOCUS</p>
					<h2 id="overlays-heading">Make the next step clear.</h2>
				</div>
				<p>Dialogs, notifications, and progress that you can actually try.</p>
			</div>
			<div class="demo-grid">
				<article class="example-card">
					<div class="example-heading">
						<h3>Dialogs</h3>
						<span class="tag">local + managed</span>
					</div>
					<p class="description">
						Explore a controlled Dialog, local defaults, and both store-backed adapters.
					</p>
					<div class="preview button-preview">
						<button type="button" class="brand" onclick={() => (dialogOpen = true)}
							>Controlled dialog</button
						>
						<button
							type="button"
							class="outline"
							onclick={() => {
								localDialogKey++;
								localDialogOpen = true;
							}}>Local dialog</button
						>
						<button type="button" class="outline" onclick={() => openModal('demo-legacy')}
							>Legacy Modal</button
						>
						<button type="button" class="outline" onclick={() => openModal('demo-managed')}
							>ManagedModal</button
						>
					</div>
					<p class="readout" role="status">{dialogMessage}</p>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[4]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Alert & confirmation</h3>
						<span class="tag">store-backed</span>
					</div>
					<p class="description">
						Simple shared renderers for messages and promise-based decisions.
					</p>
					<div class="preview button-preview">
						<button
							type="button"
							class="info"
							onclick={() => openAlertModal('A simple **informational** alert.', 'info')}
							>Info alert</button
						>
						<button
							type="button"
							class="success outline"
							onclick={() => openAlertModal('Your changes were saved.', 'success')}
							>Success alert</button
						>
						<button type="button" class="brand outline" disabled={confirming} onclick={confirmDemo}
							>Request confirmation</button
						>
					</div>
					<p class="readout" role="status">{confirmationMessage}</p>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[5]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>ToastStack</h3>
						<span class="tag">five variants</span>
					</div>
					<p class="description">
						Try the global queue. Toasts close automatically or can be dismissed by hand.
					</p>
					<div class="preview button-preview">
						{#each toastTypes as type (type)}<button
								type="button"
								class={type === 'error' ? 'danger outline' : `${type} outline`}
								onclick={() => toast(type)}>{type}</button
							>{/each}
					</div>
					<button type="button" class="link" onclick={clearToasts}>Clear notifications</button>
					<details class="code-example">
						<summary>Usage</summary>
						<pre><code>{codeExamples[6]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>ToastStackView</h3>
						<span class="tag">independent</span>
					</div>
					<p class="description">
						This inline collection has its own owner and leaves the global queue alone.
					</p>
					<div class="preview block-preview local-toast-preview">
						{#if localToasts.length === 0}<p class="empty-state">
								Your local notifications will appear here.
							</p>{/if}
						<ToastStackView
							items={localToasts}
							onDismiss={(id) => {
								localToasts = localToasts.filter((item) => item.id !== id);
							}}
							closeLabel="Dismiss local notification"
							style="position: relative; left: auto; bottom: auto; transform: none; width: 100%; z-index: auto;"
						/>
					</div>
					<button type="button" class="outline" onclick={addLocalToast}
						>Add local notification</button
					>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Loader & LoaderView</h3>
						<span class="tag">progress</span>
					</div>
					<p class="description">
						Run a short store-owned sequence, or open an independent view at a chosen progress.
					</p>
					<div class="preview button-preview">
						<button type="button" class="brand" disabled={loaderRunning} onclick={runLoader}
							>Run loader sequence</button
						><button type="button" class="outline" onclick={() => (localLoaderOpen = true)}
							>Open independent loader</button
						>
					</div>
					<label class="field"
						>Independent progress: {localProgress}%<input
							type="range"
							min="0"
							max="100"
							bind:value={localProgress}
						/></label
					>
					<p class="description">
						The independent view closes after two seconds; the sequence finishes on its own.
					</p>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Floating controls</h3>
						<span class="tag">button + link</span>
					</div>
					<p class="description">
						Use native button or link attributes. Show the floating action to try dragging it.
					</p>
					<div class="preview button-preview">
						<FloatingButton
							id="demo-combined"
							persistPosition={false}
							style="position: relative; inset: auto;"
							ariaLabel="Combined floating button"
							onpointerdown={(event) => event.preventDefault()}
							onclick={() => toast('success')}
						/>
						<FloatingLink
							id="demo-link"
							href="#styles"
							persistPosition={false}
							style="position: relative; inset: auto;"
							aria-label="Go to CSS helper examples"
							onpointerdown={(event) => event.preventDefault()}
							><span aria-hidden="true">↓</span></FloatingLink
						>
						<button
							type="button"
							class="outline"
							onclick={() => (floatingVisible = !floatingVisible)}
							>{floatingVisible ? 'Hide' : 'Show'} floating action</button
						>
					</div>
					<p class="readout">Dragging is temporary in this demo; no position is saved.</p>
				</article>
			</div>
		</section>

		<section id="motion" class="demo-section" aria-labelledby="motion-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow">03 / A LITTLE MOVEMENT</p>
					<h2 id="motion-heading">Follow the flow.</h2>
				</div>
				<p>Choose a slide, restart a timer, or scroll a container.</p>
			</div>
			<article class="example-card carousel-card">
				<div class="example-heading">
					<h3>Carousel</h3>
					<span class="tag">controlled index</span>
				</div>
				<p class="description">
					Starts paused. Enable rotation or change the parent index. Focus, hover and reduced-motion
					preferences also pause automatic rotation.
				</p>
				<div class="carousel-preview">
					<Carousel
						{slides}
						index={slideIndex}
						onIndexChange={(next) => {
							slideIndex = next;
						}}
						paused={slidePaused}
						onPausedChange={(next) => {
							slidePaused = next;
						}}
						style="height: 26rem; min-height: 0;"
						aria-label="Feature slides"
						labels={{
							region: 'carousel',
							slideRoleDescription: 'slide',
							navigation: 'Choose a slide',
							previous: 'Previous slide',
							next: 'Next slide',
							pause: 'Pause',
							resume: 'Resume',
							pauseAction: 'Pause rotation',
							resumeAction: 'Resume rotation',
							slide: (index, total) => `${index + 1} of ${total}`,
							goToSlide: (index) => `Go to slide ${index + 1}`
						}}
					>
						{#snippet slideContent(slide, index)}<div class="custom-slide">
								<span class="slide-number">{String(index + 1).padStart(2, '0')}</span>
								<h4>{slide.header}</h4>
								<h3>{slide.title}</h3>
								<p>{slide.descriptionHtml.replaceAll('**', '')}</p>
							</div>{/snippet}
					</Carousel>
				</div>
				<div class="carousel-controls">
					<label class="field"
						>Parent index<select
							value={slideIndex}
							onchange={(event) => (slideIndex = Number(event.currentTarget.value))}
							>{#each slides as slide, index (slide.id)}<option value={index}
									>{index + 1} · {slide.id}</option
								>{/each}</select
						></label
					><label class="switch"
						><input
							type="checkbox"
							checked={!slidePaused}
							onchange={(event) => (slidePaused = !event.currentTarget.checked)}
						/>Automatic rotation</label
					>
				</div>
			</article>
			<div class="demo-grid">
				<article class="example-card">
					<div class="example-heading">
						<h3>CircularTimer</h3>
						<span class="tag">restartable</span>
					</div>
					<p class="description">
						A five-second visual countdown. resetKey restarts the same duration.
					</p>
					<div class="preview timer-preview">
						{#if timerActive}<CircularTimer
								size="lg"
								durationMs={5000}
								resetKey={timerRun}
								withNumericTimer
								aria-label="Five second countdown"
								onTimeout={() => {
									timerFinished = true;
								}}
							/>{:else}<div class="timer-placeholder">5<span>seconds</span></div>{/if}
					</div>
					<div class="button-row">
						<button type="button" class="brand outline" onclick={startTimer}
							>{timerActive ? 'Restart' : 'Start'} timer</button
						>
						<p class="readout" role="status">
							{timerFinished ? 'Finished' : timerActive ? 'Counting down' : 'Ready'}
						</p>
					</div>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>ScrollHint & ScrollIndicator</h3>
						<span class="tag">measurements</span>
					</div>
					<p class="description">
						Scroll the panel to see the hint disappear at the bottom. The custom thumb is visible on
						desktop pointers.
					</p>
					<div class="scroll-preview">
						<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus this scroll container.) -->
						<div
							class="scroll-content native-scrollbar-remove"
							bind:this={scrollTarget}
							tabindex="0"
							role="region"
							aria-label="Scrollable demonstration text"
						>
							{#each ['A shared vocabulary', 'A clear owner', 'Useful defaults', 'A thoughtful finish'] as title, index (title)}<section
								>
									<span class="eyebrow">0{index + 1}</span>
									<h4>{title}</h4>
									<p>
										Small components become more useful when their props, behavior and styles work
										together. Keep scrolling to explore the rest of this panel.
									</p>
								</section>{/each}
						</div>
						<ScrollIndicator target={scrollTarget} autoHide={false} />
						{#if showHint && scrollTarget}<ScrollHint
								target={scrollTarget}
								timeout={0}
								color="var(--sc-color-brand)"
								bgColor="var(--sc-color-surface)"
								width="36px"
								height="36px"
								style="position: absolute; left: 50%; bottom: 12px;"
							/>{/if}
					</div>
					<label class="switch"
						><input type="checkbox" bind:checked={showHint} />Show scroll hint</label
					>
				</article>
			</div>
			<div class="debug-row">
				<div>
					<strong>SizeView</strong>
					<p class="description">Enable the viewport readout, then resize your window.</p>
				</div>
				<label class="switch"
					><input type="checkbox" bind:checked={showSize} />Show viewport size</label
				>
			</div>
		</section>

		<section id="styles" class="demo-section" aria-labelledby="styles-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow">04 / SHARED STYLES</p>
					<h2 id="styles-heading">A few classes go a long way.</h2>
				</div>
				<p>These examples use the library’s actual CSS helpers.</p>
			</div>
			<div class="demo-grid">
				<article class="example-card">
					<div class="example-heading">
						<h3>Buttons</h3>
						<span class="tag">semantic colors</span>
					</div>
					<p class="description">Variants, outlines, sizes and groups on ordinary buttons.</p>
					<div class="preview button-preview">
						{#each ['brand', 'info', 'success', 'warning', 'danger', 'neutral'] as variant (variant)}<button
								type="button"
								class={variant}
								onclick={() => (selectedButton = variant)}>{variant}</button
							>{/each}
						<button type="button" class="brand outline" onclick={() => (selectedButton = 'outline')}
							>outline</button
						><button type="button" class="brand xs" onclick={() => (selectedButton = 'xs')}
							>small</button
						><button type="button" class="brand xl" onclick={() => (selectedButton = 'xl')}
							>large</button
						><button type="button" disabled>disabled</button>
					</div>
					<div class="btn-group">
						{#each ['One', 'Two', 'Three'] as label (label)}<button
								type="button"
								class="outline"
								aria-pressed={selectedButton === label}
								onclick={() => (selectedButton = label)}>{label}</button
							>{/each}
					</div>
					<p class="readout" role="status">Last button: {selectedButton}</p>
					<details class="code-example">
						<summary>Classes</summary>
						<pre><code>{codeExamples[7]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Forms</h3>
						<span class="tag">native markup</span>
					</div>
					<p class="description">
						Inputs, switches, radio marks and a range slider. All state stays on this page.
					</p>
					<form
						class="form-preview"
						onsubmit={(event) => {
							event.preventDefault();
							formMessage = `${plan} plan · notifications ${notifications ? 'on' : 'off'} · volume ${volume}%${email ? ` · ${email}` : ''}`;
						}}
					>
						<label class="field"
							>Email<input type="email" placeholder="you@example.com" bind:value={email} /></label
						>
						<label class="switch"
							><input type="checkbox" bind:checked={notifications} />Notifications</label
						>
						<fieldset class="radio-options">
							<legend>Plan</legend>{#each ['starter', 'team'] as option (option)}<label
									class="radio"
									><input type="radio" name="demo-plan" value={option} bind:group={plan} /><span
										class="radio-mark"
										aria-hidden="true"
									></span><span>{option}</span></label
								>{/each}
						</fieldset>
						<label class="field"
							>Volume: {volume}%<input type="range" min="0" max="100" bind:value={volume} /></label
						>
						<button type="submit" class="brand outline">Preview settings</button>
						<p class="readout" role="status">{formMessage}</p>
					</form>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Spacing & layout</h3>
						<span class="tag">utilities</span>
					</div>
					<p class="description">
						A real grid-2x2 with gap-3, p-3 and br-3. Flex helpers align the row below.
					</p>
					<div class="preview block-preview">
						<div class="grid-2x2 gap-3">
							{#each ['One', 'Two', 'Three', 'Four'] as cell (cell)}<div
									class="utility-cell p-3 br-3"
								>
									{cell}
								</div>{/each}
						</div>
						<div class="flex-r a-center j-content-between gap-2 mt-3">
							<span class="text-muted">Aligned with flex-r</span><span class="badge utility-badge"
								>badge</span
							>
						</div>
					</div>
					<details class="code-example">
						<summary>Classes</summary>
						<pre><code>{codeExamples[8]}</code></pre>
					</details>
				</article>
				<article class="example-card">
					<div class="example-heading">
						<h3>Tokens & text</h3>
						<span class="tag">theme-aware</span>
					</div>
					<p class="description">
						Shared semantic colors follow the theme selected at the top of this page.
					</p>
					<div class="preview token-preview">
						{#each ['brand', 'info', 'success', 'warning', 'danger'] as color (color)}<div
								class="swatch"
							>
								<span style={`background: var(--sc-color-${color})`}></span><code>{color}</code>
							</div>{/each}
					</div>
					<div class="text-examples">
						<span class="text-muted">text-muted</span><span class="text-info">text-info</span><span
							class="text-success">text-success</span
						><span class="text-danger">text-danger</span>
					</div>
					<details class="code-example">
						<summary>Tokens</summary>
						<pre><code>{codeExamples[9]}</code></pre>
					</details>
				</article>
			</div>
		</section>

		<section id="imports" class="import-section" aria-labelledby="imports-heading">
			<div>
				<p class="eyebrow">05 / TAKE WHAT YOU NEED</p>
				<h2 id="imports-heading">Start with a single piece.</h2>
				<p>
					Import one component, one service, or just the styles your interface uses. Your app
					doesn’t need this entire playground.
				</p>
			</div>
			<pre><code>{codeExamples[10]}</code></pre>
		</section>
	</main>
	<footer class="site-footer">
		<span>svelte-common · Component playground</span><a
			href="https://github.com/sciborbudkowski/svelte-common">Source & documentation ↗</a
		>
	</footer>
</div>

<Dialog
	id="demo-controlled"
	open={dialogOpen}
	onOpenChange={changeDialog}
	size="narrow"
	confirmButtonLabel="Save"
	cancelButtonLabel="Cancel"
	closeLabel="Close dialog"
	onConfirm={async () => {
		await delay(300);
		if (!disposed) dialogMessage = `Saved ${dialogName || 'your profile'}`;
	}}
>
	{#snippet header()}Edit a profile{/snippet}
	<label class="field">Name<input bind:value={dialogName} autocomplete="off" /></label>
	<p class="description">Try Save, Cancel, Escape, or clicking the backdrop.</p>
</Dialog>
{#if localDialogOpen}{#key localDialogKey}<Dialog
			id="demo-local"
			defaultOpen
			size="narrow"
			closeLabel="Close local dialog"
			confirmButtonLabel="Done"
			cancelButtonLabel="Cancel"
			onOpenChange={(next) => {
				localDialogOpen = next;
			}}
			>{#snippet header()}Local state{/snippet}
			<p>
				This Dialog owns its open state. Remounting starts a fresh defaultOpen lifetime.
			</p></Dialog
		>{/key}{/if}
<Modal
	id="demo-legacy"
	size="narrow"
	confirmButtonLabel="Done"
	cancelButtonLabel="Cancel"
	closeLabel="Close legacy dialog"
	>{#snippet header()}The existing Modal API{/snippet}
	<p>openModal('demo-legacy') controls this compatibility adapter.</p></Modal
>
<ManagedModal
	modalId="demo-managed"
	id="demo-managed-dialog"
	size="narrow"
	confirmButtonLabel="Done"
	cancelButtonLabel="Cancel"
	closeLabel="Close managed dialog"
	>{#snippet header()}An explicit store adapter{/snippet}
	<p>The modalId owns store identity. The DOM id can be different.</p></ManagedModal
>
<AlertModal
	titles={{ info: 'Information', success: 'Success', warning: 'Warning', error: 'Error' }}
	okLabel="Got it"
	closeLabel="Close alert"
/>
<ConfirmModal
	title="Confirm your choice"
	confirmButtonLabel="Apply"
	cancelButtonLabel="Keep settings"
	closeLabel="Close confirmation"
/>
<Loader />
<ToastStack closeLabel="Dismiss notification" />
{#if localLoaderOpen}<LoaderView
		open
		message="Independent progress"
		progress={localProgress}
		status="Closing in two seconds"
	/><span class="sr-only"
		><CircularTimer
			durationMs={2000}
			onTimeout={() => {
				localLoaderOpen = false;
			}}
		/></span
	>{/if}
{#if floatingVisible}<FloatingAction
		id="demo-floating-action"
		persistPosition={false}
		aria-label="Show a success notification"
		onclick={() => toast('success')}
	/>{/if}
{#if showSize}<SizeView
		style="position: fixed; z-index: 50;"
		bottom="1rem"
		left="1rem"
		color="var(--sc-color-text)"
		backgroundColor="var(--sc-color-surface)"
		borderColor="var(--sc-color-border)"
	/>{/if}

<style>
	.playground {
		color: var(--sc-color-text);
		--demo-muted: var(--sc-color-text-muted);
		--demo-border: var(--sc-color-border);
	}
	.site-header,
	main,
	.site-footer {
		max-width: 1200px;
		margin-inline: auto;
		padding-inline: 32px;
	}
	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		min-height: 96px;
		border-bottom: 1px solid var(--demo-border);
	}
	.wordmark {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		color: inherit;
		font-weight: 600;
		text-decoration: none;
		letter-spacing: -0.025em;
	}
	.brand-mark {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		background: var(--sc-color-brand);
		color: var(--sc-color-text-inverted);
		font-size: 16px;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.version {
		color: var(--demo-muted);
		font-size: 12px;
	}
	.theme-picker {
		display: flex;
		border: 1px solid var(--demo-border);
		padding: 4px;
		border-radius: 8px;
		gap: 4px;
	}
	.theme-picker button {
		padding: 6px 10px;
		background: transparent;
		border: 0;
		box-shadow: none;
		color: var(--demo-muted);
		font-size: 12px;
		text-transform: capitalize;
		border-radius: 5px;
	}
	.theme-picker button[aria-pressed='true'] {
		background: var(--sc-color-surface-muted);
		color: var(--sc-color-text);
	}
	.hero {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 48px;
		padding-block: 64px 48px;
	}
	.eyebrow {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		color: var(--demo-muted);
		margin-bottom: 12px;
	}
	h1 {
		font-size: clamp(32px, 4.5vw, 52px);
		font-weight: 500;
		line-height: 1.12;
		letter-spacing: -0.045em;
	}
	.hero-description {
		max-width: 60ch;
		margin-top: 24px;
		font-size: 16px;
		line-height: 1.7;
		color: var(--demo-muted);
	}
	.hero-note {
		flex-shrink: 0;
		display: flex;
		gap: 10px;
		align-items: flex-start;
		font-size: 13px;
		line-height: 1.6;
	}
	.hero-note small {
		color: var(--demo-muted);
	}
	.status-dot {
		flex-shrink: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--sc-color-success);
		margin-top: 7px;
	}
	.section-nav {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		padding-block: 16px;
		border-block: 1px solid var(--demo-border);
	}
	.section-nav a {
		padding: 8px 12px;
		text-decoration: none;
		font-size: 13px;
		color: var(--demo-muted);
		border-radius: 6px;
	}
	.section-nav a:hover {
		color: var(--sc-color-text);
		background: var(--sc-color-surface-muted);
	}
	.demo-section {
		padding-block: 64px 0;
		scroll-margin-top: 24px;
	}
	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 32px;
		margin-bottom: 24px;
	}
	h2 {
		font-size: 28px;
		line-height: 1.2;
		font-weight: 500;
		letter-spacing: -0.025em;
	}
	.section-heading > p {
		max-width: 32ch;
		color: var(--demo-muted);
		font-size: 13px;
		line-height: 1.6;
	}
	.demo-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
	}
	.example-card {
		min-width: 0;
		padding: 24px;
		border: 1px solid var(--demo-border);
		border-radius: 12px;
		background: var(--sc-color-surface);
	}
	.example-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	h3 {
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.tag {
		font-size: 10px;
		padding: 4px 8px;
		border: 1px solid var(--demo-border);
		border-radius: 20px;
		color: var(--demo-muted);
	}
	.description {
		font-size: 13px;
		color: var(--demo-muted);
		line-height: 1.65;
		margin-top: 12px;
		max-width: 65ch;
	}
	.preview {
		margin-block: 24px;
		padding: 24px;
		min-height: 128px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		border-radius: 8px;
		background: var(--sc-color-background);
		border: 1px solid var(--demo-border);
	}
	.sample {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.sample > span {
		font-size: 11px;
		color: var(--demo-muted);
	}
	.avatar-preview,
	.spinner-preview {
		min-height: 184px;
		flex-wrap: wrap;
	}
	.avatar-modes {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 12px;
		flex-wrap: wrap;
	}
	.block-preview {
		display: block;
		padding: 16px;
	}
	.expanded-copy {
		font-size: 13px;
		line-height: 1.7;
		padding-block: 12px;
	}
	.readout {
		font-family: var(--sc-font-body);
		font-size: 12px;
		line-height: 1.6;
		color: var(--demo-muted);
		margin-top: 12px;
		overflow-wrap: anywhere;
	}
	.code-example {
		border-top: 1px solid var(--demo-border);
		margin-top: 24px;
		padding-top: 16px;
		font-size: 12px;
	}
	.code-example summary {
		cursor: pointer;
		color: var(--demo-muted);
		width: fit-content;
	}
	pre {
		overflow: auto;
		max-width: 100%;
		background: var(--sc-color-background);
		border-radius: 8px;
		padding: 16px;
		font-size: 12px;
		line-height: 1.8;
		margin-top: 16px;
		tab-size: 2;
	}
	code {
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
	}
	.button-preview {
		flex-wrap: wrap;
		justify-content: flex-start;
		align-content: center;
	}
	.button-preview button,
	.button-row button {
		font-size: 12px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 12px;
		color: var(--demo-muted);
	}
	.field input,
	.field select {
		width: 100%;
		min-width: 0;
		color: var(--sc-color-text);
		font-size: 14px;
		padding: 10px 12px;
	}
	.field input[type='range'] {
		padding: 0;
	}
	.example-card > :global(.switch),
	.form-preview :global(.switch),
	.carousel-controls :global(.switch),
	.debug-row :global(.switch) {
		justify-content: flex-start;
		font-size: 12px;
	}
	.local-toast-preview {
		min-height: 150px;
	}
	.empty-state {
		text-align: center;
		font-size: 13px;
		line-height: 1.6;
		color: var(--demo-muted);
		padding: 24px 8px;
	}
	.carousel-card {
		margin-bottom: 24px;
	}
	.carousel-preview {
		position: relative;
		margin-top: 24px;
		border-radius: 8px;
		overflow: hidden;
	}
	.carousel-preview :global(.mc-progress-bar) {
		position: absolute;
	}
	.custom-slide {
		max-width: 48ch;
		color: #fff;
	}
	.slide-number {
		font-size: 11px;
		opacity: 0.7;
	}
	.custom-slide h4 {
		font-size: 12px;
		font-weight: 400;
		letter-spacing: 0.14em;
		margin-top: 24px;
	}
	.custom-slide h3 {
		font-size: clamp(24px, 4vw, 40px);
		font-weight: 500;
		line-height: 1.15;
		white-space: pre-line;
		margin-block: 16px;
	}
	.custom-slide p {
		font-size: 14px;
		line-height: 1.7;
		max-width: 45ch;
		opacity: 0.85;
	}
	.carousel-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		margin-top: 24px;
	}
	.carousel-controls .field {
		min-width: 180px;
	}
	.timer-preview {
		min-height: 184px;
	}
	.timer-placeholder {
		width: 100px;
		height: 100px;
		border: 5px solid var(--demo-border);
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-size: 24px;
	}
	.timer-placeholder span {
		font-size: 11px;
		color: var(--demo-muted);
	}
	.button-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.button-row .readout {
		margin-top: 0;
	}
	.scroll-preview {
		position: relative;
		margin-block: 24px;
	}
	.scroll-content {
		height: 240px;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid var(--demo-border);
		background: var(--sc-color-background);
	}
	.scroll-content section + section {
		margin-top: 32px;
	}
	.scroll-content h4 {
		font-size: 16px;
		margin-bottom: 12px;
	}
	.scroll-content p {
		font-size: 13px;
		line-height: 1.8;
		color: var(--demo-muted);
	}
	.debug-row {
		display: flex;
		gap: 24px;
		justify-content: space-between;
		align-items: center;
		padding: 24px;
		border-bottom: 1px solid var(--demo-border);
	}
	.debug-row .description {
		margin-top: 4px;
	}
	.form-preview {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 24px;
	}
	.form-preview button {
		align-self: flex-start;
		font-size: 12px;
	}
	.form-preview .readout {
		margin-top: 0;
	}
	.radio-options {
		display: flex;
		gap: 16px;
		font-size: 12px;
	}
	.radio-options legend {
		color: var(--demo-muted);
		margin-bottom: 8px;
	}
	.utility-cell {
		min-width: 0;
		background: var(--sc-color-surface);
		color: var(--demo-muted);
		border: 1px solid var(--demo-border);
		font-size: 13px;
	}
	.utility-badge {
		background: var(--sc-color-brand);
		color: var(--sc-color-text-inverted);
	}
	.token-preview {
		padding: 24px 12px;
		flex-wrap: wrap;
		gap: 12px;
	}
	.swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.swatch > span {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		border: 1px solid var(--demo-border);
	}
	.swatch code {
		font-size: 10px;
		color: var(--demo-muted);
	}
	.text-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		font-size: 13px;
	}
	.import-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		align-items: center;
		padding-block: 64px;
		margin-top: 64px;
		border-top: 1px solid var(--demo-border);
	}
	.import-section p:not(.eyebrow) {
		color: var(--demo-muted);
		font-size: 14px;
		line-height: 1.8;
		margin-top: 16px;
		max-width: 50ch;
	}
	.import-section pre {
		margin-top: 0;
		border: 1px solid var(--demo-border);
	}
	.site-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		min-height: 96px;
		border-top: 1px solid var(--demo-border);
		color: var(--demo-muted);
		font-size: 12px;
	}
	.site-footer a {
		color: inherit;
		text-decoration: none;
	}
	.site-footer a:hover {
		text-decoration: underline;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
	.skip-link {
		position: fixed;
		z-index: 10002;
		top: 8px;
		left: 8px;
		transform: translateY(-200%);
		padding: 12px 16px;
		background: var(--sc-color-surface);
		color: var(--sc-color-text);
		border-radius: 8px;
	}
	.skip-link:focus {
		transform: translateY(0);
	}
	@media (max-width: 800px) {
		.hero-note {
			display: none;
		}
		.section-heading > p {
			max-width: 25ch;
		}
		.demo-grid {
			gap: 16px;
		}
		.example-card {
			padding: 20px;
		}
		.preview {
			padding: 16px;
		}
		.import-section {
			gap: 24px;
		}
	}
	@media (max-width: 640px) {
		.site-header,
		main,
		.site-footer {
			padding-inline: 16px;
		}
		.site-header {
			min-height: 80px;
			gap: 12px;
			flex-wrap: wrap;
			padding-block: 16px;
		}
		.version {
			display: none;
		}
		.hero {
			padding-block: 48px 32px;
		}
		.hero-description {
			font-size: 14px;
		}
		.section-nav {
			gap: 4px;
		}
		.section-nav a {
			padding: 8px;
			font-size: 12px;
		}
		.demo-section {
			padding-top: 48px;
		}
		.section-heading {
			display: block;
		}
		.section-heading > p {
			max-width: none;
			margin-top: 12px;
		}
		h2 {
			font-size: 24px;
		}
		.demo-grid,
		.import-section {
			grid-template-columns: 1fr;
		}
		.example-card {
			padding: 20px;
		}
		.custom-slide h3 {
			font-size: 26px;
		}
		.debug-row,
		.site-footer {
			align-items: flex-start;
			flex-direction: column;
		}
		.site-footer {
			justify-content: center;
			padding-block: 24px;
		}
		.import-section {
			padding-block: 48px;
			margin-top: 48px;
		}
	}
</style>
