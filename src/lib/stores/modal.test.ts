// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('esm-env', async (importOriginal) => {
	const actual = await importOriginal<typeof import('esm-env')>();

	return { ...actual, BROWSER: true };
});

import {
	modalStack,
	registerModal,
	setModalScrollLockTarget,
	unregisterModal
} from './modal.svelte.js';

describe('modal scroll locking', () => {
	afterEach(() => {
		for (const id of [...modalStack]) unregisterModal(id);
		setModalScrollLockTarget(null);
		document.body.removeAttribute('style');
	});

	it('locks the configured container without changing body overflow', () => {
		const main = document.createElement('main');
		main.style.overflow = 'auto';
		document.body.style.overflow = 'scroll';

		setModalScrollLockTarget(main);
		expect(main.style.overflow).toBe('auto');

		registerModal('first');
		expect(main.style.overflow).toBe('hidden');
		expect(document.body.style.overflow).toBe('scroll');

		unregisterModal('first');
		expect(main.style.overflow).toBe('auto');
	});

	it('keeps the container locked until the last modal closes, including out of order', () => {
		const main = document.createElement('main');
		main.style.overflow = 'auto';
		setModalScrollLockTarget(main);

		registerModal('first');
		registerModal('second');
		registerModal('third');
		registerModal('second');
		expect([...modalStack]).toEqual(['first', 'second', 'third']);

		unregisterModal('first');
		unregisterModal('unknown');
		unregisterModal('third');
		expect(main.style.overflow).toBe('hidden');
		expect([...modalStack]).toEqual(['second']);

		unregisterModal('second');
		expect(main.style.overflow).toBe('auto');
		expect(modalStack).toHaveLength(0);
	});

	it('restores separate overflow axes and priorities without overwriting other styles', () => {
		const main = document.createElement('main');
		main.style.setProperty('overflow-x', 'clip', 'important');
		main.style.setProperty('overflow-y', 'scroll');
		setModalScrollLockTarget(main);

		registerModal('first');
		main.style.color = 'red';
		unregisterModal('first');

		expect(main.style.getPropertyValue('overflow-x')).toBe('clip');
		expect(main.style.getPropertyPriority('overflow-x')).toBe('important');
		expect(main.style.getPropertyValue('overflow-y')).toBe('scroll');
		expect(main.style.getPropertyPriority('overflow-y')).toBe('');
		expect(main.style.color).toBe('red');
	});

	it('preserves an important overflow shorthand', () => {
		const main = document.createElement('main');
		main.style.setProperty('overflow', 'auto', 'important');
		setModalScrollLockTarget(main);

		registerModal('first');
		expect(main.style.overflow).toBe('hidden');
		unregisterModal('first');

		expect(main.style.overflow).toBe('auto');
		expect(main.style.getPropertyPriority('overflow')).toBe('important');
	});

	it('moves an active lock when the configured target changes', () => {
		const first = document.createElement('main');
		const second = document.createElement('main');
		first.style.overflow = 'auto';
		second.style.overflow = 'scroll';
		setModalScrollLockTarget(first);
		registerModal('first');
		registerModal('second');

		setModalScrollLockTarget(second);
		expect(first.style.overflow).toBe('auto');
		expect(second.style.overflow).toBe('hidden');

		setModalScrollLockTarget(second);
		unregisterModal('second');
		expect(second.style.overflow).toBe('hidden');

		setModalScrollLockTarget(null);
		expect(second.style.overflow).toBe('scroll');
		expect(document.body.style.overflow).toBe('hidden');

		unregisterModal('first');
		expect(document.body.style.overflow).toBe('');
	});

	it('uses body by default and takes a new snapshot for each opening', () => {
		registerModal('first');
		expect(document.body.style.overflow).toBe('hidden');
		unregisterModal('first');
		expect(document.body.style.overflow).toBe('');

		document.body.style.overflow = 'scroll';
		registerModal('second');
		unregisterModal('second');
		expect(document.body.style.overflow).toBe('scroll');
	});
});
