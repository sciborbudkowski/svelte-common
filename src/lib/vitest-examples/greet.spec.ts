// src/lib/vitest-examples/greet.spec.ts
import { describe, it, expect } from 'vitest';
import { greet } from './greet.ts';

describe('greet', () => {
	it('returns a greeting', () => {
		expect(greet('Svelte')).toBe('Hello, Svelte!');
	});
});
