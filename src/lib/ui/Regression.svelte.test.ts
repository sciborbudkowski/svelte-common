import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount, type Component } from 'svelte';
import FloatingButton from './FloatingButton.svelte';
import Avatar from './Avatar.svelte';
import AccordionFixture from './fixtures/AccordionFixture.svelte';
import NestedModalFixture from './fixtures/NestedModalFixture.svelte';
import ToastStack from './ToastStack.svelte';
import CircularTimer from './CircularTimer.svelte';
import Spinner from './Spinner.svelte';
import Loader from './Loader.svelte';
import Modal from './Modal.svelte';
import Carousel from './Carousel.svelte';
import ScrollHint from './ScrollHint.svelte';
import ScrollIndicator from './ScrollIndicator.svelte';
import { EphemeralStorage } from '../services/storage.ts';
import {
	clearToasts,
	dismissToast,
	getVisibleToasts,
	showToast
} from '../stores/toaststack.svelte.ts';
import { hideLoader, showLoader, updateLoaderProgress } from '../stores/loader.svelte.ts';
import { openModal, closeModal } from '../stores/modal.svelte.ts';
import { getTabbableElements } from '../utils/focus.ts';

vi.mock('svelte/transition', () => ({
	fly: () => ({ duration: 0 }),
	fade: () => ({ duration: 0 }),
	slide: () => ({ duration: 0 })
}));
vi.mock('svelte/animate', () => ({ flip: () => ({ duration: 0 }) }));
const animations = vi.hoisted(() => ({
	set: vi.fn(),
	to: vi.fn(),
	killTweensOf: vi.fn(),
	context: vi.fn()
}));
vi.mock('gsap', () => ({
	gsap: {
		...animations,
		timeline: () => {
			const timers: ReturnType<typeof setTimeout>[] = [];
			const timeline = {
				to: (_target: unknown, options: { onComplete?: () => void }) => {
					if (options.onComplete) timers.push(setTimeout(options.onComplete, 20));
					return timeline;
				},
				kill: () => timers.forEach(clearTimeout)
			};
			return timeline;
		}
	}
}));

const mounted: Record<string, unknown>[] = [];
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;
let reduced = false;
let motionChange: (() => void) | undefined;
function render<P extends Record<string, unknown>>(component: Component<P>, props: P) {
	const target = document.createElement('div');
	document.body.append(target);
	const instance = mount(component, { target, props });
	mounted.push(instance);
	flushSync();
	return { target, instance };
}
async function update() {
	flushSync();
	await tick();
	await import('gsap');
	await tick();
	await tick();
	flushSync();
}
async function remove(instance: Record<string, unknown>) {
	await unmount(instance);
	mounted.splice(mounted.indexOf(instance), 1);
	await update();
}
function scrollingNode(height = 1000) {
	const node = document.createElement('div');
	document.body.append(node);
	Object.defineProperties(node, {
		scrollHeight: { value: height, configurable: true },
		clientHeight: { value: 100, configurable: true }
	});
	vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
		top: 10,
		left: 0,
		right: 100,
		bottom: 110,
		width: 100,
		height: 100,
		x: 0,
		y: 10,
		toJSON() {}
	});
	return node;
}
function runFrames(time = performance.now()) {
	const queued = [...frames.values()];
	frames.clear();
	for (const cb of queued) cb(time);
}
const slides = [0, 1].map((i) => ({
	id: String(i),
	image: 'image.jpg',
	header: 'Header',
	title: 'Title',
	descriptionHtml: 'Description',
	buttons: [{ id: `button-${i}`, title: 'Go', class: '', target: 'top' }]
}));

beforeEach(() => {
	vi.useFakeTimers();
	frames.clear();
	frameId = 0;
	reduced = false;
	motionChange = undefined;
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		const id = ++frameId;
		frames.set(id, cb);
		return id;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.stubGlobal('matchMedia', () => ({
		get matches() {
			return reduced;
		},
		addEventListener: (_event: string, callback: () => void) => {
			motionChange = callback;
		},
		removeEventListener: vi.fn()
	}));
	animations.context.mockImplementation((callback: () => void) => {
		callback();
		return { revert: vi.fn() };
	});
	animations.to.mockImplementation((_target: unknown, options: { onComplete?: () => void }) => {
		if (options.onComplete) setTimeout(options.onComplete, 20);
	});
});
afterEach(async () => {
	for (const instance of mounted.splice(0)) await unmount(instance);
	closeModal('audit');
	closeModal('first');
	closeModal('nested');
	clearToasts();
	hideLoader();
	await update();
	document.body.innerHTML = '';
	document.body.removeAttribute('style');
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	for (const mock of Object.values(animations)) mock.mockReset();
});

describe('floating buttons, avatars and accordions', () => {
	it('stores floating button positions under their own IDs', async () => {
		const read = vi.spyOn(EphemeralStorage, 'get').mockResolvedValue(null);
		render(FloatingButton, { id: 'one' });
		render(FloatingButton, { id: 'two' });
		await update();
		expect(read.mock.calls.map(([key]) => key)).toEqual([
			'monster-button-position-one',
			'monster-button-position-two'
		]);
	});
	it('honors disabled links and handles the first legitimate click before 500ms', async () => {
		vi.spyOn(performance, 'now').mockReturnValue(100);
		const click = vi.fn();
		const disabled = render(FloatingButton, {
			id: 'one',
			href: '#target',
			disabled: true,
			onclick: click
		});
		const enabled = render(FloatingButton, { id: 'two', onclick: click });
		await update();
		const link = disabled.target.querySelector('a')!;
		link.click();
		expect(click).not.toHaveBeenCalled();
		expect(link.hasAttribute('href')).toBe(false);
		expect(link.getAttribute('aria-disabled')).toBe('true');
		enabled.target.querySelector('button')!.click();
		expect(click).toHaveBeenCalledTimes(1);
		expect(enabled.target.querySelector('svg')).not.toBeNull();
	});
	it('preserves avatar classes, HTML attributes, custom styles and meaningful image alt text', async () => {
		const { target } = render(Avatar, {
			type: 'image',
			imageUrl: 'photo.jpg',
			alt: 'Alice',
			class: 'custom',
			style: 'border: 2px solid red',
			title: 'Profile'
		});
		await update();
		const avatar = target.firstElementChild as HTMLElement;
		expect(avatar.classList.contains('avatar')).toBe(true);
		expect(avatar.classList.contains('size-normal')).toBe(true);
		expect(avatar.classList.contains('custom')).toBe(true);
		expect(avatar.style.border).toBe('2px solid red');
		expect(avatar.title).toBe('Profile');
		expect(target.querySelector('img')!.alt).toBe('Alice');
	});
	it('uses an empty alternative for a decorative avatar', () => {
		expect(
			render(Avatar, { type: 'image', imageUrl: 'photo.jpg' }).target.querySelector('img')!.alt
		).toBe('');
	});
	it('allows a legacy initially open accordion item to close', async () => {
		const changed = vi.fn();
		const { target } = render(AccordionFixture, { initiallyOpen: true, onOpenChange: changed });
		await update();
		const button = target.querySelector('button')!;
		expect(button.getAttribute('aria-expanded')).toBe('true');
		button.click();
		await update();
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(changed).toHaveBeenCalledWith(false);
	});
	it('normalizes multiple defaults in single-open mode and preserves multiple-open mode', async () => {
		const single = render(AccordionFixture, { defaults: ['one', 'two'] });
		const multiple = render(AccordionFixture, { defaults: ['one', 'two'], multiple: true });
		await update();
		expect(single.target.querySelectorAll('[aria-expanded="true"]')).toHaveLength(1);
		expect(multiple.target.querySelectorAll('[aria-expanded="true"]')).toHaveLength(2);
	});
	it('generates unique ARIA targets for independent accordions with the same local IDs', async () => {
		const first = render(AccordionFixture, { defaults: ['one'] });
		const second = render(AccordionFixture, { defaults: ['one'] });
		await update();
		const targets = [first, second].map(({ target }) =>
			target.querySelector('button')!.getAttribute('aria-controls')
		);
		expect(targets[0]).not.toBe(targets[1]);
		for (const id of targets)
			expect(document.getElementById(id!)?.getAttribute('role')).toBe('region');
	});
});

describe('toast and timer ownership', () => {
	it('restarts the visual timer when replacing a same-ID, same-duration toast', async () => {
		const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
		render(ToastStack, {});
		showToast({ id: 'same', type: 'info', message: 'First', autoClose: true, duration: 5000 });
		await update();
		const count = now.mock.calls.length;
		showToast({ id: 'same', type: 'info', message: 'Second', autoClose: true, duration: 5000 });
		await update();
		expect(now.mock.calls.length).toBeGreaterThan(count);
		expect(frames.size).toBe(1);
	});
	it('notifies replacement, eviction, clearing and timeout exactly once with their reasons', () => {
		const replaced = vi.fn();
		showToast({ id: 'same', type: 'info', message: 'Old', onClose: replaced });
		showToast({ id: 'same', type: 'info', message: 'New' });
		expect(replaced).toHaveBeenCalledWith('replaced');
		const evicted = vi.fn();
		showToast({ type: 'info', message: 'Evict', onClose: evicted });
		for (let i = 0; i < 5; i++) showToast({ type: 'info', message: String(i) });
		expect(evicted).toHaveBeenCalledExactlyOnceWith('evicted');
		const cleared = vi.fn();
		showToast({ type: 'info', message: 'Clear', onClose: cleared });
		clearToasts();
		expect(cleared).toHaveBeenCalledExactlyOnceWith('cleared');
		const timed = vi.fn();
		const id = showToast({
			type: 'info',
			message: 'Timeout',
			onClose: timed,
			autoClose: true,
			duration: 1000
		});
		vi.advanceTimersByTime(1000);
		dismissToast(id);
		expect(timed).toHaveBeenCalledExactlyOnceWith('timeout');
	});
	it('isolates synchronous and asynchronous callback failures', async () => {
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
		const id = showToast({
			type: 'info',
			message: 'Sync',
			onClose: () => {
				throw new Error('sync');
			}
		});
		expect(() => dismissToast(id)).not.toThrow();
		const asyncId = showToast({
			type: 'info',
			message: 'Async',
			onClose: async () => {
				throw new Error('async');
			}
		});
		dismissToast(asyncId);
		await update();
		expect(errors).toHaveBeenCalledTimes(2);
		expect(getVisibleToasts()).toHaveLength(0);
	});
	it('preserves a toast created reentrantly by a replacement callback', () => {
		showToast({
			id: 'same',
			type: 'info',
			message: 'Old',
			onClose: () => {
				showToast({
					id: 'same',
					type: 'info',
					message: 'Callback',
					autoClose: true,
					duration: 2000
				});
			}
		});
		showToast({
			id: 'same',
			type: 'info',
			message: 'Replacement',
			autoClose: true,
			duration: 1000
		});
		vi.advanceTimersByTime(1000);
		expect(getVisibleToasts()[0].message).toBe('Callback');
		vi.advanceTimersByTime(1000);
		expect(getVisibleToasts()).toHaveLength(0);
	});
	it('completes a zero-duration timer once and cancels queued completion on unmount', async () => {
		const done = vi.fn();
		render(CircularTimer, { duration: 0, onTimeout: done });
		await update();
		expect(done).toHaveBeenCalledTimes(1);
		const cancelled = vi.fn();
		const { instance } = render(CircularTimer, { duration: 0, onTimeout: cancelled });
		await remove(instance);
		expect(cancelled).not.toHaveBeenCalled();
	});
	it('allows accessible timer/spinner labels while hiding decorative instances', () => {
		expect(
			render(Spinner, { ariaLabel: 'Loading' })
				.target.querySelector('[role="status"]')
				?.getAttribute('aria-label')
		).toBe('Loading');
		expect(
			render(CircularTimer, { duration: 2000, ariaLabel: 'Remaining' })
				.target.querySelector('[role="timer"]')
				?.getAttribute('aria-label')
		).toContain('Remaining');
		expect(render(Spinner, {}).target.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
	});
});

describe('blocking overlays and keyboard focus', () => {
	it('keeps a nested top dialog interactive and restores its parent when it closes', async () => {
		const { target } = render(NestedModalFixture, {});
		openModal('first');
		await update();
		openModal('nested');
		await update();
		const nested = target.querySelector<HTMLElement>('[aria-label="Nested"]')!;
		const outer = target.querySelector<HTMLElement>('[aria-label="Outer"]')!;
		expect(nested.contains(document.activeElement)).toBe(true);
		expect(outer.inert).toBe(false);
		closeModal('nested');
		await update();
		expect(outer.contains(document.activeElement)).toBe(true);
		expect(outer.getAttribute('aria-modal')).toBe('true');
	});
	it('makes the background inert, redirects escaped focus and restores prior inert attributes', async () => {
		const background = document.createElement('button');
		document.body.append(background);
		const alreadyInert = document.createElement('div');
		alreadyInert.setAttribute('inert', '');
		document.body.append(alreadyInert);
		background.focus();
		const { target } = render(Modal, { id: 'audit' });
		openModal('audit');
		await update();
		expect(background.hasAttribute('inert')).toBe(true);
		background.focus();
		expect(target.contains(document.activeElement)).toBe(true);
		const late = document.createElement('button');
		document.body.append(late);
		await update();
		expect(late.hasAttribute('inert')).toBe(true);
		closeModal('audit');
		await update();
		expect(background.hasAttribute('inert')).toBe(false);
		expect(late.hasAttribute('inert')).toBe(false);
		expect(alreadyInert.hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(background);
	});
	it('coordinates loaders and modals without unlocking scroll or focus prematurely', async () => {
		const opener = document.createElement('button');
		document.body.append(opener);
		opener.focus();
		document.body.style.overflow = 'auto';
		const modal = render(Modal, { id: 'audit' });
		const loader = render(Loader, {});
		openModal('audit');
		await update();
		showLoader();
		await update();
		opener.focus();
		expect(loader.target.contains(document.activeElement)).toBe(true);
		expect(modal.target.querySelector('[role="dialog"]')!.getAttribute('aria-modal')).toBe('false');
		closeModal('audit');
		await update();
		expect(document.body.style.overflow).toBe('hidden');
		hideLoader();
		await update();
		expect(document.body.style.overflow).toBe('auto');
		expect(document.activeElement).toBe(opener);
	});
	it('provides loader progress semantics and clamps invalid values', async () => {
		const { target } = render(Loader, {});
		showLoader();
		updateLoaderProgress(150);
		await update();
		const progress = target.querySelector('[role="progressbar"]')!;
		expect(progress.getAttribute('aria-valuenow')).toBe('100');
		updateLoaderProgress(-1);
		await update();
		expect(progress.getAttribute('aria-valuenow')).toBe('0');
		updateLoaderProgress(NaN);
		await update();
		expect(progress.getAttribute('aria-valuenow')).toBe('0');
		expect(target.querySelector('[role="status"]')).not.toBeNull();
	});
	it('orders positive tabindex, supports native summaries/editing hosts, and skips closed details content', () => {
		const root = document.createElement('div');
		document.body.append(root);
		root.innerHTML =
			'<button id="zero">Zero</button><button id="two" tabindex="2">Two</button><button id="one" tabindex="1">One</button><details><summary id="summary">Summary</summary><button id="hidden">Hidden</button></details><div id="editor" contenteditable>Text</div><input id="unchecked" type="radio" name="group"><input id="checked" type="radio" name="group" checked>';
		expect(getTabbableElements(root).map((node) => node.id)).toEqual([
			'one',
			'two',
			'zero',
			'summary',
			'editor',
			'checked'
		]);
	});
	it('traps document Tab events inside an otherwise empty loader dialog', async () => {
		const { target } = render(Loader, {});
		showLoader();
		await update();
		const dialog = target.querySelector<HTMLElement>('[role="dialog"]')!;
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
		);
		expect(document.activeElement).toBe(dialog);
	});
});

describe('carousel behavior', () => {
	it('hides inactive controls from interaction and pauses rotation after focus until explicit resume', async () => {
		const { target } = render(Carousel, { slides, timeout: 1000 });
		await update();
		const inactive = target.querySelector<HTMLElement>('.mc-slide:not(.is-active)')!;
		expect(inactive.inert).toBe(true);
		expect(inactive.getAttribute('aria-hidden')).toBe('true');
		target.querySelector<HTMLButtonElement>('.mc-slide.is-active button')!.focus();
		await update();
		vi.advanceTimersByTime(2000);
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('1 z 2');
		const resume = target.querySelector<HTMLButtonElement>('.mc-rotation-control')!;
		resume.click();
		await update();
		vi.advanceTimersByTime(1000);
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('2 z 2');
	});
	it('pauses on hover and resumes after leaving without requiring focus', async () => {
		const { target } = render(Carousel, { slides, timeout: 1000 });
		await update();
		const region = target.querySelector('.modern-carousel')!;
		region.dispatchEvent(new MouseEvent('mouseenter'));
		await update();
		vi.advanceTimersByTime(2000);
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('1 z 2');
		region.dispatchEvent(new MouseEvent('mouseleave'));
		await update();
		vi.advanceTimersByTime(1000);
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('2 z 2');
	});
	it('honors reduced motion initially and when the preference changes during use', async () => {
		reduced = true;
		const { target } = render(Carousel, { slides, timeout: 1000 });
		await update();
		vi.advanceTimersByTime(2000);
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('1 z 2');
		(target.querySelector('[aria-label="Następny slajd"]') as HTMLButtonElement).click();
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('2 z 2');
		expect(animations.to).not.toHaveBeenCalled();
		reduced = false;
		motionChange?.();
		await update();
		expect(vi.getTimerCount()).toBeGreaterThan(0);
		reduced = true;
		motionChange?.();
		await update();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('retains manual navigation when animation initialization fails', async () => {
		animations.context.mockImplementation(() => {
			throw new Error('animation unavailable');
		});
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { target } = render(Carousel, { slides });
		await update();
		(target.querySelector('[aria-label="Następny slajd"]') as HTMLButtonElement).click();
		await update();
		expect(target.querySelector('.mc-slide.is-active')!.getAttribute('aria-label')).toBe('2 z 2');
		expect(errors).toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('cancels rotation work on unmount', async () => {
		const { instance } = render(Carousel, { slides });
		await update();
		expect(vi.getTimerCount()).toBeGreaterThan(0);
		await remove(instance);
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('scroll measurement lifecycle', () => {
	it('remeasures the indicator when the window or an ancestor scrolls', async () => {
		const node = scrollingNode();
		const { target } = render(ScrollIndicator, { target: node, autoHide: false });
		runFrames();
		await update();
		vi.mocked(node.getBoundingClientRect).mockReturnValue({
			top: 110,
			left: 0,
			right: 100,
			bottom: 210,
			width: 100,
			height: 100,
			x: 0,
			y: 110,
			toJSON() {}
		});
		document.dispatchEvent(new Event('scroll'));
		runFrames();
		await update();
		expect((target.querySelector('.scroll-indicator') as HTMLElement).style.top).toBe('114px');
	});
	it('clears indicator hide timers when unmounted', async () => {
		const node = scrollingNode();
		const { instance } = render(ScrollIndicator, { target: node });
		runFrames();
		await update();
		node.dispatchEvent(new Event('scroll'));
		expect(vi.getTimerCount()).toBe(1);
		await remove(instance);
		expect(vi.getTimerCount()).toBe(0);
	});
	it('refreshes a hint when an existing image loads and cancels pending frames on cleanup', async () => {
		const node = scrollingNode(100);
		const image = document.createElement('img');
		node.append(image);
		const { target, instance } = render(ScrollHint, { target: node, timeout: 0 });
		runFrames();
		vi.advanceTimersByTime(0);
		await update();
		expect(target.querySelector('.scroll-hint')!.classList.contains('visible')).toBe(false);
		Object.defineProperty(node, 'scrollHeight', { value: 1000, configurable: true });
		image.dispatchEvent(new Event('load'));
		image.dispatchEvent(new Event('load'));
		expect(frames.size).toBe(1);
		runFrames();
		await update();
		expect(target.querySelector('.scroll-hint')!.classList.contains('visible')).toBe(true);
		image.dispatchEvent(new Event('load'));
		await remove(instance);
		expect(frames.size).toBe(0);
	});
});
