// src/lib/ui/Modal.svelte.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, flushSync, mount, tick, unmount, type Component } from 'svelte';
import Modal from './Modal.svelte';
import ConfirmModal from './Modals/ConfirmModal.svelte';
import AlertModal from './Modals/AlertModal.svelte';
import {
	closeAlertModal,
	closeConfirmModal,
	closeModal,
	modalStack,
	modalsState,
	openAlertModal,
	openConfirmModal,
	openModal,
	requestConfirmation,
	setModalScrollLockTarget,
	unregisterModal
} from '../stores/modal.svelte.ts';

const mounted: Record<string, unknown>[] = [];

function render<Props extends Record<string, unknown>>(component: Component<Props>, props: Props) {
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
	await tick();
}

function deferred() {
	let resolve!: () => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<void>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function button(target: HTMLElement, selector: string) {
	return target.querySelector<HTMLButtonElement>(selector)!;
}

afterEach(async () => {
	for (const instance of mounted.splice(0)) await unmount(instance);
	for (const id of [...modalStack]) unregisterModal(id);
	closeConfirmModal();
	closeAlertModal();
	for (const id of Object.keys(modalsState.customModal)) closeModal(id);
	setModalScrollLockTarget(null);
	await update();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('modal actions and lifetime', () => {
	it('keeps a follow-up confirmation open until the user answers it', async () => {
		const { target } = render(ConfirmModal, {});
		const first = requestConfirmation('First');
		const second = first.then(() => requestConfirmation('Second'));
		await update();
		button(target, '.brand').click();
		await update();
		expect(await first).toBe(true);
		expect(modalsState.confirmModal.message).toBe('Second');
		expect(modalsState.confirmModal.isOpen).toBe(true);
		button(target, '.brand').click();
		await update();
		expect(await second).toBe(true);
	});

	it('ignores callbacks belonging to a replaced confirmation request', async () => {
		render(ConfirmModal, {});
		const first = requestConfirmation('First');
		const oldConfirm = modalsState.confirmModal.onConfirm!;
		const second = requestConfirmation('Second');
		let secondResult: boolean | undefined;
		void second.then((result) => {
			secondResult = result;
		});
		oldConfirm();
		await update();
		expect(await first).toBe(false);
		expect(secondResult).toBeUndefined();
		closeConfirmModal();
		expect(await second).toBe(false);
	});

	it('settles a pending request when replaced by a callback-based confirmation', async () => {
		render(ConfirmModal, {});
		const request = requestConfirmation('First');
		openConfirmModal('Replacement', () => {});
		expect(await request).toBe(false);
		expect(modalsState.confirmModal.message).toBe('Replacement');
		expect(modalsState.confirmModal.isOpen).toBe(true);
	});

	it.each(['Escape', 'backdrop', 'close button', 'cancel button'])(
		'blocks %s while confirming',
		async (dismissal) => {
			const { target } = render(ConfirmModal, {});
			const action = deferred();
			const onCancel = vi.fn();
			openConfirmModal('First', () => action.promise, { onCancel });
			await update();
			button(target, '.brand').click();
			await update();
			if (dismissal === 'Escape')
				window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			else if (dismissal === 'backdrop')
				(target.querySelector('.modal-backdrop') as HTMLElement).click();
			else button(target, dismissal === 'close button' ? '.button-close' : '.outline').click();
			await update();
			expect(onCancel).not.toHaveBeenCalled();
			expect(modalsState.confirmModal.isOpen).toBe(true);
			expect(button(target, '.button-close').disabled).toBe(true);
			action.resolve();
			await update();
			expect(modalsState.confirmModal.isOpen).toBe(false);
		}
	);

	it('does not let an old async confirmation close or unlock its replacement', async () => {
		const { target } = render(ConfirmModal, {});
		const first = deferred();
		const second = deferred();
		openConfirmModal('First', () => first.promise);
		await update();
		button(target, '.brand').click();
		closeConfirmModal();
		openConfirmModal('Second', () => second.promise);
		await update();
		expect(button(target, '.brand').disabled).toBe(false);
		button(target, '.brand').click();
		first.resolve();
		await update();
		expect(modalsState.confirmModal.message).toBe('Second');
		expect(modalsState.confirmModal.isOpen).toBe(true);
		expect(button(target, '.brand').disabled).toBe(true);
		second.resolve();
		await update();
		expect(modalsState.confirmModal.isOpen).toBe(false);
	});

	it('does not close a reopened custom modal when its earlier action completes', async () => {
		const { target } = render(Modal, { id: 'custom' });
		const action = deferred();
		openModal('custom', { onConfirm: () => action.promise });
		await update();
		button(target, '.brand').click();
		closeModal('custom');
		openModal('custom', { context: 'replacement' });
		await update();
		expect(button(target, '.brand').disabled).toBe(false);
		action.resolve();
		await update();
		expect(modalsState.customModal.custom.isOpen).toBe(true);
		expect(modalsState.customModal.custom.context).toBe('replacement');
	});

	it('runs a custom confirmation once and closes it after success', async () => {
		const { target } = render(Modal, { id: 'custom' });
		const action = deferred();
		const callback = vi.fn(() => action.promise);
		openModal('custom', { onConfirm: callback, context: { value: 42 } });
		await update();
		button(target, '.brand').click();
		button(target, '.brand').click();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		await update();
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith({ value: 42 });
		expect(modalsState.customModal.custom.isOpen).toBe(true);
		action.resolve();
		await update();
		expect(modalsState.customModal.custom.isOpen).toBe(false);
	});

	it('reports custom confirmation failures and leaves the modal usable', async () => {
		const onActionError = vi.fn();
		const { target } = render(Modal, { id: 'custom', onActionError });
		const action = deferred();
		const error = new Error('failed');
		openModal('custom', { onConfirm: () => action.promise });
		await update();
		button(target, '.brand').click();
		action.reject(error);
		await update();
		expect(onActionError).toHaveBeenCalledWith(error, 'confirm');
		expect(modalsState.customModal.custom.isOpen).toBe(true);
		expect(button(target, '.brand').disabled).toBe(false);
	});

	it('preserves a custom modal reopened by its cancel callback', async () => {
		const { target } = render(Modal, { id: 'custom' });
		openModal('custom', { onCancel: () => openModal('custom', { context: 'replacement' }) });
		await update();
		button(target, '.outline').click();
		await update();
		expect(modalsState.customModal.custom.isOpen).toBe(true);
		expect(modalsState.customModal.custom.context).toBe('replacement');
	});

	it.each(['close button', 'cancel button'])(
		'closes through %s even when onCancel throws',
		async (dismissal) => {
			const { target } = render(ConfirmModal, {});
			const error = new Error('cancel failed');
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			openConfirmModal('First', () => {}, {
				onCancel: () => {
					throw error;
				}
			});
			await update();
			button(target, dismissal === 'close button' ? '.button-close' : '.outline').click();
			await update();
			expect(modalsState.confirmModal.isOpen).toBe(false);
			expect(errorSpy).toHaveBeenCalledWith(expect.any(String), error);
		}
	);

	it('preserves a new confirmation opened by onCancel', async () => {
		const { target } = render(ConfirmModal, {});
		openConfirmModal('First', () => {}, { onCancel: () => openConfirmModal('Second', () => {}) });
		await update();
		button(target, '.outline').click();
		await update();
		expect(modalsState.confirmModal.message).toBe('Second');
		expect(modalsState.confirmModal.isOpen).toBe(true);
	});

	it('settles a request and releases the scroll lock when its renderer unmounts', async () => {
		const { instance } = render(ConfirmModal, {});
		const request = requestConfirmation('First');
		await update();
		await unmount(instance);
		mounted.splice(mounted.indexOf(instance), 1);
		await update();
		expect(await request).toBe(false);
		expect(modalsState.confirmModal.isOpen).toBe(false);
		expect(modalStack).toHaveLength(0);
		expect(document.body.style.overflow).toBe('');
	});

	it('keeps a failed confirmation open and allows another attempt', async () => {
		const { target } = render(ConfirmModal, {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const callback = vi
			.fn()
			.mockRejectedValueOnce(new Error('failed'))
			.mockResolvedValueOnce(undefined);
		openConfirmModal('First', callback);
		await update();
		button(target, '.brand').click();
		await update();
		expect(modalsState.confirmModal.isOpen).toBe(true);
		expect(button(target, '.brand').disabled).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
		button(target, '.brand').click();
		await update();
		expect(modalsState.confirmModal.isOpen).toBe(false);
	});
});

describe('modal focus and accessible names', () => {
	it('restores the original opener when lower modals close first', async () => {
		const opener = document.createElement('button');
		document.body.append(opener);
		opener.focus();
		render(Modal, { id: 'first' });
		render(Modal, { id: 'second' });
		openModal('first');
		await update();
		openModal('second');
		await update();
		closeModal('first');
		await update();
		closeModal('second');
		await update();
		expect(document.activeElement).toBe(opener);
	});

	it('returns focus to the underlying dialog when the top modal closes', async () => {
		const { target: first } = render(Modal, { id: 'first' });
		render(Modal, { id: 'second' });
		openModal('first');
		await update();
		const previous = button(first, '.outline');
		previous.focus();
		openModal('second');
		await update();
		closeModal('second');
		await update();
		expect(document.activeElement).toBe(previous);
	});

	it('keeps focus in a new modal opened during the previous modal closing', async () => {
		const { target: first } = render(Modal, { id: 'first' });
		const { target: second } = render(Modal, { id: 'second' });
		openModal('first');
		await update();
		expect(first.contains(document.activeElement)).toBe(true);
		closeModal('first');
		openModal('second');
		await update();
		expect(second.contains(document.activeElement)).toBe(true);
	});

	it.each([ConfirmModal, AlertModal])(
		'labels built-in dialogs with their visible header',
		async (component) => {
			const { target } = render(component, {});
			if (component === ConfirmModal) openConfirmModal('Confirm', () => {});
			else openAlertModal('Alert');
			await update();
			const dialog = target.querySelector('[role="dialog"]')!;
			const labelId = dialog.getAttribute('aria-labelledby')!;
			expect(labelId).toBeTruthy();
			expect(document.getElementById(labelId)?.textContent?.trim()).toBeTruthy();
		}
	);

	it('accepts an explicit name for a custom dialog without a header', async () => {
		const { target } = render(Modal, { id: 'custom', ariaLabel: 'Edit profile' });
		openModal('custom');
		await update();
		expect(target.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
			'Edit profile'
		);
	});

	it('skips hidden, inert and disabled controls when wrapping keyboard focus', async () => {
		const footer = createRawSnippet(() => ({
			render: () => `<div>
				<button id="last-visible">Visible</button>
				<input type="hidden">
				<div hidden><button>Hidden ancestor</button></div>
				<div inert><button>Inert ancestor</button></div>
				<div aria-hidden="true"><button>ARIA hidden ancestor</button></div>
				<div style="display:none"><button>CSS hidden ancestor</button></div>
				<button style="visibility:hidden">Hidden visibility</button>
				<fieldset disabled><button>Disabled fieldset</button></fieldset>
				<button tabindex="-2">Negative tab index</button>
			</div>`
		}));
		const { target } = render(Modal, { id: 'custom', footer });
		openModal('custom');
		await update();
		const first = button(target, '.button-close');
		first.focus();
		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true })
		);
		expect(document.activeElement).toBe(document.getElementById('last-visible'));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
		expect(document.activeElement).toBe(first);
	});
});
