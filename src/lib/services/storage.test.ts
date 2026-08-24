// src/lib/services/storage.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('esm-env', async (importOriginal) => {
	const actual = await importOriginal<typeof import('esm-env')>();

	return {
		...actual,
		BROWSER: true
	};
});

import { EphemeralStorage } from './storage.js';

describe('EphemeralStorage', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = {
			length: 0,
			clear: vi.fn(),
			getItem: vi.fn(),
			key: vi.fn(),
			removeItem: vi.fn(),
			setItem: vi.fn()
		};

		vi.stubGlobal('window', {
			localStorage: storage
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('set nie rzuca gdy localStorage.setItem rzuca wyjątkiem', async () => {
		vi.mocked(storage.setItem).mockImplementation(() => {
			throw new DOMException('Storage unavailable', 'SecurityError');
		});

		await expect(
			EphemeralStorage.set('test', {
				value: 123
			})
		).resolves.toBeUndefined();
	});

	it('get zwraca null gdy localStorage.getItem rzuca wyjątkiem', async () => {
		vi.mocked(storage.getItem).mockImplementation(() => {
			throw new DOMException('Storage unavailable', 'SecurityError');
		});

		await expect(EphemeralStorage.get('test')).resolves.toBeNull();
	});

	it('delete nie rzuca gdy localStorage.removeItem rzuca wyjątkiem', async () => {
		vi.mocked(storage.removeItem).mockImplementation(() => {
			throw new DOMException('Storage unavailable', 'SecurityError');
		});

		await expect(EphemeralStorage.delete('test')).resolves.toBeUndefined();
	});
});
