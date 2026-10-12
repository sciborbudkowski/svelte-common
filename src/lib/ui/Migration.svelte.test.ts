import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount, flushSync, tick, createRawSnippet, type Component } from 'svelte';
import { createProps } from './fixtures/props.svelte.ts';
import { createControllableState } from './internal/controllable.svelte.ts';
import CollapsibleCard from './CollapsibleCard.svelte';
import AccordionFixture from './fixtures/MigrationAccordionFixture.svelte';
import Dialog from './Dialog.svelte';
import Modal from './Modal.svelte';
import ManagedModal from './ManagedModal.svelte';
import Carousel from './Carousel.svelte';
import FloatingButton from './FloatingButton.svelte';
import FloatingLink from './FloatingLink.svelte';
import FloatingAction from './FloatingAction.svelte';
import LoaderView from './LoaderView.svelte';
import ToastStackView from './ToastStackView.svelte';
import Spinner from './Spinner.svelte';
import Avatar from './Avatar.svelte';
import ScrollHint from './ScrollHint.svelte';
import CircularTimer from './CircularTimer.svelte';
import { EphemeralStorage } from '../services/storage.ts';
import { openModal, closeModal } from '../stores/modal.svelte.ts';
import { hideLoader, loaderState } from '../stores/loader.svelte.ts';
import { clearToasts, getVisibleToasts, type UIToast } from '../stores/toaststack.svelte.ts';

vi.mock('svelte/transition', () => ({
	slide: () => ({ duration: 0 }),
	fade: () => ({ duration: 0 }),
	fly: () => ({ duration: 0 })
}));
vi.mock('svelte/animate', () => ({ flip: () => ({ duration: 0 }) }));
const animation = vi.hoisted(() => ({ timeline: vi.fn(), set: vi.fn(), killTweensOf: vi.fn() }));
vi.mock('gsap', () => ({
	gsap: {
		...animation,
		to: vi.fn(),
		context: (callback: () => void) => {
			callback();
			return { revert: vi.fn() };
		}
	}
}));
const mounted: Record<string, unknown>[] = [];
const content = createRawSnippet(() => ({ render: () => '<span>Details</span>' }));
const slides = [0, 1, 2].map((index) => ({
	id: String(index),
	image: 'image.jpg',
	header: 'Header',
	title: 'Title',
	descriptionHtml: 'Description',
	buttons: []
}));
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
	flushSync();
}
function button(target: HTMLElement): HTMLButtonElement {
	return target.querySelector('button')!;
}
function pointer(target: HTMLElement, type: string, x = 10, y = 10) {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperties(event, {
		pointerId: { value: 1 },
		isPrimary: { value: true },
		button: { value: 0 },
		clientX: { value: x },
		clientY: { value: y }
	});
	target.dispatchEvent(event);
	return event;
}
const originalAnimations = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getAnimations');
beforeEach(() => {
	Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
		configurable: true,
		value: () => []
	});
	vi.useFakeTimers();
	animation.timeline.mockImplementation(() => {
		const timeline = { to: () => timeline, kill: vi.fn() };
		return timeline;
	});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	vi.stubGlobal('requestAnimationFrame', () => 1);
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
	vi.stubGlobal('matchMedia', () => ({
		matches: false,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	}));
});
afterEach(async () => {
	for (const instance of mounted.splice(0)) await unmount(instance);
	closeModal('managed');
	closeModal('legacy');
	clearToasts();
	hideLoader();
	await update();
	document.body.replaceChildren();
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	animation.timeline.mockClear();
	animation.set.mockClear();
	animation.killTweensOf.mockClear();
	if (originalAnimations)
		Object.defineProperty(HTMLElement.prototype, 'getAnimations', originalAnimations);
	else Reflect.deleteProperty(HTMLElement.prototype, 'getAnimations');
});

describe('shared state contract', () => {
	it('commits locally before notifying and ignores default changes', () => {
		let initial = 0;
		let observed = -1;
		const callback = vi.fn(() => {
			observed = control.value;
		});
		const control = createControllableState<number, string>({
			value: () => undefined,
			defaultValue: () => initial,
			onChange: callback
		});
		initial = 1;
		expect(control.value).toBe(0);
		control.request(2, 'test');
		control.request(2, 'test');
		expect(callback).toHaveBeenCalledOnce();
		expect(observed).toBe(2);
	});
	it('preserves controlled zero and rejects ownership switches', () => {
		const parent = createProps<{ value: number | undefined }>({ value: 0 });
		const changed = vi.fn();
		const control = createControllableState<number, string>({
			value: () => parent.value,
			defaultValue: () => 10,
			onChange: changed
		});
		control.request(2, 'test');
		expect(control.value).toBe(0);
		expect(changed).toHaveBeenCalledWith(2, 'test');
		parent.value = 3;
		expect(control.value).toBe(3);
		expect(changed).toHaveBeenCalledOnce();
		parent.value = undefined;
		expect(() => control.value).toThrow('ownership');
	});
});

describe('card and selection APIs', () => {
	it('supports rejected requests, accepted parent updates and default-only initialization', async () => {
		const changed = vi.fn();
		const props = createProps({
			open: false,
			defaultOpen: true,
			onOpenChange: changed,
			visibleContent: content,
			hiddenContent: content
		});
		const { target } = render(CollapsibleCard, props);
		button(target).click();
		await update();
		expect(button(target).getAttribute('aria-expanded')).toBe('false');
		expect(changed).toHaveBeenCalledOnce();
		props.open = true;
		await update();
		expect(button(target).getAttribute('aria-expanded')).toBe('true');
		expect(changed).toHaveBeenCalledOnce();
		const local = createProps({
			defaultOpen: true,
			visibleContent: content,
			hiddenContent: content
		});
		const other = render(CollapsibleCard, local);
		local.defaultOpen = false;
		await update();
		expect(button(other.target).getAttribute('aria-expanded')).toBe('true');
		button(other.target).click();
		await update();
		expect(button(other.target).getAttribute('aria-expanded')).toBe('false');
	});
	it('merges classes/styles, preserves targets, and allows native cancellation', async () => {
		const native = vi.fn((event: MouseEvent) => event.preventDefault());
		const changed = vi.fn();
		const { target } = render(CollapsibleCard, {
			id: 'card',
			visibleContent: content,
			hiddenContent: content,
			class: 'custom',
			style: '--custom: red;',
			'data-testid': 'card',
			triggerProps: { onclick: native, class: 'trigger' },
			onOpenChange: changed
		});
		button(target).click();
		await update();
		expect(native).toHaveBeenCalledOnce();
		expect(changed).not.toHaveBeenCalled();
		const root = target.querySelector<HTMLElement>('#card')!;
		expect(root.classList.contains('card')).toBe(true);
		expect(root.classList.contains('custom')).toBe(true);
		expect(root.style.getPropertyValue('--custom')).toBe('red');
		expect(button(target).getAttribute('aria-controls')).toBe('card-panel');
		expect(target.querySelector('#card-panel')?.hasAttribute('inert')).toBe(true);
	});
	it('requests complete accordion selections without mutating a controlled array', async () => {
		const changed = vi.fn();
		const props = createProps({ value: ['one'], onValueChange: changed });
		const { target } = render(AccordionFixture, props);
		target.querySelectorAll<HTMLButtonElement>('button')[1].click();
		await update();
		expect(changed).toHaveBeenCalledWith(
			['two'],
			expect.objectContaining({ reason: 'trigger', itemId: 'two' })
		);
		expect(props.value).toEqual(['one']);
		expect(button(target).getAttribute('aria-expanded')).toBe('true');
		props.value = ['two'];
		await update();
		expect(button(target).getAttribute('aria-expanded')).toBe('false');
		expect(changed).toHaveBeenCalledOnce();
	});
	it('honors controlled empty selection over legacy item defaults and blocks disabled triggers', async () => {
		const changed = vi.fn();
		const { target } = render(AccordionFixture, {
			value: [],
			legacyItemOpen: true,
			disabled: true,
			onValueChange: changed
		});
		button(target).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await update();
		expect(target.querySelectorAll('[aria-expanded="true"]')).toHaveLength(0);
		expect(changed).not.toHaveBeenCalled();
		expect(
			target.querySelector('[data-testid="selection"]')?.classList.contains('custom-accordion')
		).toBe(true);
	});
});

describe('pure dialogs and managed adapters', () => {
	it('does not release an overlay for rejected close proposals and does not echo parent updates', async () => {
		const outside = document.createElement('button');
		document.body.append(outside);
		const changed = vi.fn();
		const props = createProps({
			open: true,
			onOpenChange: changed,
			'aria-label': 'Independent',
			class: 'custom-dialog',
			closeLabel: 'Close editor'
		});
		const { target } = render(Dialog, props);
		await update();
		button(target).click();
		await update();
		expect(changed).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'close-button' })
		);
		expect(target.querySelector('[role="dialog"]')).not.toBeNull();
		expect(outside.hasAttribute('inert')).toBe(true);
		props.open = false;
		await update();
		expect(outside.hasAttribute('inert')).toBe(false);
		expect(changed).toHaveBeenCalledOnce();
	});
	it('closes uncontrolled dialogs and legacy local-default modals', async () => {
		const plain = render(Dialog, { defaultOpen: true, closeLabel: 'Close' });
		await update();
		button(plain.target).click();
		await update();
		expect(plain.target.querySelector('[role="dialog"]')).toBeNull();
		const legacy = render(Modal, { id: 'legacy', defaultOpen: true });
		await update();
		button(legacy.target).click();
		await update();
		expect(legacy.target.querySelector('[role="dialog"]')).toBeNull();
	});
	it('keeps controller identity separate from managed modal DOM identity', async () => {
		const { target } = render(ManagedModal, {
			modalId: 'managed',
			id: 'dialog-dom',
			closeLabel: 'Close managed'
		});
		openModal('managed');
		await update();
		expect(target.querySelector('#dialog-dom')?.getAttribute('role')).toBe('dialog');
		button(target).click();
		await update();
		expect(target.querySelector('[role="dialog"]')).toBeNull();
	});
	it('does not close a replacement when old asynchronous confirmation finishes', async () => {
		let finish!: () => void;
		const action = new Promise<void>((resolve) => {
			finish = resolve;
		});
		const changed = vi.fn();
		const props = createProps({
			open: true,
			openingKey: 'one',
			onConfirm: () => action,
			onOpenChange: changed
		});
		const { target } = render(Dialog, props);
		await update();
		target.querySelector<HTMLButtonElement>('button.brand')!.click();
		await update();
		expect(button(target).disabled).toBe(true);
		props.openingKey = 'two';
		await update();
		expect(button(target).disabled).toBe(false);
		finish();
		await update();
		expect(changed).not.toHaveBeenCalled();
		expect(target.querySelector('[role="dialog"]')).not.toBeNull();
	});
});

describe('carousel ownership', () => {
	it('animates accepted index changes only and supports parent navigation', async () => {
		const changed = vi.fn();
		const props = createProps({ slides, index: 0, autoplay: false, onIndexChange: changed });
		const { target } = render(Carousel, props);
		await update();
		animation.timeline.mockClear();
		target.querySelector<HTMLButtonElement>('[aria-label="Następny slajd"]')!.click();
		await update();
		expect(changed).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'next' }));
		expect(target.querySelector('.modern-carousel')?.getAttribute('data-index')).toBe('0');
		expect(animation.timeline).not.toHaveBeenCalled();
		props.index = 2;
		await update();
		expect(target.querySelector('.modern-carousel')?.getAttribute('data-index')).toBe('2');
		expect(animation.timeline).toHaveBeenCalledTimes(2);
		expect(changed).toHaveBeenCalledOnce();
	});
	it('uses defaults once and supports caller-provided labels', async () => {
		const props = createProps({
			slides,
			defaultIndex: 1,
			autoplay: false,
			labels: { next: 'Next item', slideRoleDescription: 'slide' }
		});
		const { target } = render(Carousel, props);
		await update();
		props.defaultIndex = 0;
		await update();
		expect(target.querySelector('.modern-carousel')?.getAttribute('data-index')).toBe('1');
		expect(target.querySelector('[aria-label="Next item"]')).not.toBeNull();
		expect(target.querySelector('.mc-slide')?.getAttribute('aria-roledescription')).toBe('slide');
	});
	it('does not bypass a controlled user pause', async () => {
		const changed = vi.fn();
		const props = createProps({ slides, paused: true, onPausedChange: changed });
		const { target } = render(Carousel, props);
		await update();
		target.querySelector<HTMLButtonElement>('.mc-rotation-control')!.click();
		await update();
		expect(changed).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'rotation-control' })
		);
		expect(target.querySelector('.modern-carousel')?.getAttribute('data-paused')).toBe('true');
		props.paused = false;
		await update();
		expect(changed).toHaveBeenCalledOnce();
	});
});

describe('controlled drag and typed native wrappers', () => {
	it('keeps the initial default drag coordinates through parent changes and resize', async () => {
		const read = vi.spyOn(EphemeralStorage, 'get');
		const props = createProps({ id: 'default-drag', defaultDragPosition: { left: 20, top: 30 } });
		const { target } = render(FloatingButton, props);
		await update();
		props.defaultDragPosition = { left: 50, top: 60 };
		await update();
		window.dispatchEvent(new Event('resize'));
		await update();
		expect(button(target).style.left).toBe('20px');
		expect(button(target).style.top).toBe('30px');
		expect(read).not.toHaveBeenCalled();
	});
	it('does not read or write storage or display rejected drag coordinates', async () => {
		const read = vi.spyOn(EphemeralStorage, 'get');
		const write = vi.spyOn(EphemeralStorage, 'set');
		const changed = vi.fn();
		const props = createProps<{
			id: string;
			dragPosition: { left: number; top: number } | null;
			onDragPositionChange: typeof changed;
		}>({ id: 'drag', dragPosition: null, onDragPositionChange: changed });
		const { target } = render(FloatingButton, props);
		await update();
		const node = button(target);
		Object.defineProperty(node, 'setPointerCapture', { value: vi.fn() });
		Object.defineProperty(node, 'hasPointerCapture', { value: () => false });
		vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			width: 20,
			height: 20,
			right: 20,
			bottom: 20,
			toJSON() {}
		});
		pointer(node, 'pointerdown');
		pointer(node, 'pointermove', 50, 60);
		await update();
		expect(node.style.left).toBe('');
		pointer(node, 'pointerup', 50, 60);
		await update();
		expect(changed).toHaveBeenCalledWith(
			{ left: 40, top: 50 },
			expect.objectContaining({ reason: 'drag' })
		);
		expect(node.style.left).toBe('');
		props.dragPosition = { left: 25, top: 35 };
		await update();
		expect(node.style.left).toBe('25px');
		expect(changed).toHaveBeenCalledOnce();
		expect(read).not.toHaveBeenCalled();
		expect(write).not.toHaveBeenCalled();
	});
	it('forwards native form/link attributes and treats an empty href as a link', async () => {
		const link = render(FloatingLink, {
			id: 'link',
			href: '',
			target: '_blank',
			rel: 'noopener',
			class: 'custom-link',
			'aria-label': 'Open link'
		});
		expect(link.target.querySelector('a')?.getAttribute('href')).toBe('');
		expect(link.target.querySelector('a')?.getAttribute('target')).toBe('_blank');
		const action = render(FloatingAction, {
			id: 'action',
			form: 'settings',
			name: 'save',
			type: 'submit' as const
		});
		await update();
		expect(button(action.target).type).toBe('submit');
		expect(button(action.target).getAttribute('form')).toBe('settings');
	});
});

describe('independent renderers and native presentation props', () => {
	it('renders independent loaders without changing the singleton', async () => {
		const props = createProps({
			open: true,
			message: 'Local work',
			progress: 200,
			status: 'Preparing',
			class: 'custom-loader'
		});
		const { target } = render(LoaderView, props);
		await update();
		expect(loaderState.isVisible).toBe(false);
		expect(target.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
		props.open = false;
		await update();
		expect(target.querySelector('[role="dialog"]')).toBeNull();
	});
	it('requests dismissal without removing supplied items or invoking lifecycle callbacks', async () => {
		const closed = vi.fn();
		const dismissed = vi.fn();
		const toast: UIToast = {
			id: 'local',
			type: 'info',
			message: 'Local toast',
			timestamp: 1,
			onClose: closed
		};
		const props = createProps({
			items: [toast],
			onDismiss: dismissed,
			closeLabel: 'Dismiss notification'
		});
		const { target } = render(ToastStackView, props);
		button(target).click();
		await update();
		expect(dismissed).toHaveBeenCalledWith('local', 'dismissed');
		expect(target.querySelector('.toast')).not.toBeNull();
		expect(closed).not.toHaveBeenCalled();
		expect(getVisibleToasts()).toHaveLength(0);
		props.items = [];
		await update();
		expect(target.querySelector('.toast')).toBeNull();
		expect(closed).not.toHaveBeenCalled();
	});
	it('merges presentation classes and supports native labels', () => {
		const spinner = render(Spinner, {
			class: 'custom-spinner',
			style: '--brand: red;',
			'aria-label': 'Working',
			'data-testid': 'spinner'
		});
		expect(spinner.target.querySelector('.spinner')?.classList.contains('custom-spinner')).toBe(
			true
		);
		expect(spinner.target.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe(
			'Working'
		);
		const avatar = render(Avatar, {
			class: { 'custom-avatar': true },
			type: 'image',
			imageUrl: '/image.png',
			imageProps: { loading: 'lazy', class: 'custom-image' }
		});
		expect(avatar.target.querySelector('.avatar')?.classList.contains('custom-avatar')).toBe(true);
		expect(avatar.target.querySelector('img')?.getAttribute('loading')).toBe('lazy');
	});
	it('supports explicit timer restart keys', async () => {
		const completed = vi.fn();
		const props = createProps({ durationMs: 0, resetKey: 1, onTimeout: completed });
		render(CircularTimer, props);
		await update();
		expect(completed).toHaveBeenCalledOnce();
		props.resetKey = 2;
		await update();
		expect(completed).toHaveBeenCalledTimes(2);
	});
	it('forwards decorative root attributes without changing measurement ownership', () => {
		const hint = render(ScrollHint, {
			class: 'custom-hint',
			'data-testid': 'hint',
			style: '--hint-color: blue;'
		});
		expect(hint.target.querySelector('.scroll-hint')?.classList.contains('custom-hint')).toBe(true);
		expect(hint.target.querySelector('[data-testid="hint"]')?.getAttribute('aria-hidden')).toBe(
			'true'
		);
	});
});
