// src/lib/services/ssr.test.ts

import { describe, expect, it } from 'vitest';

import { EphemeralStorage } from './storage.js';
import { Gps } from '../stores/gps.svelte.js';

describe('SSR', () => {
	it('storage i GPS działają bez window/localStorage/navigator', async () => {
		const descriptors = new Map(
			['window', 'localStorage', 'navigator'].map((name) => [
				name,
				Object.getOwnPropertyDescriptor(globalThis, name)
			])
		);

		for (const name of descriptors.keys()) {
			Reflect.deleteProperty(globalThis, name);
		}

		try {
			await expect(EphemeralStorage.set('test', { value: 123 })).resolves.toBeUndefined();

			await expect(EphemeralStorage.get('test')).resolves.toBeNull();

			await expect(EphemeralStorage.delete('test')).resolves.toBeUndefined();

			const gps = new Gps();

			expect(gps.state.supported).toBe(false);

			expect(() => gps.start()).not.toThrow();

			expect(gps.state.active).toBe(false);
			expect(gps.state.error).toBe('Brak obsługi GPS na tym urządzeniu.');

			const cleanup = gps.init('precise');

			expect(() => cleanup()).not.toThrow();
		} finally {
			for (const [name, descriptor] of descriptors) {
				if (descriptor) {
					Object.defineProperty(globalThis, name, descriptor);
				}
			}
		}
	});
});
