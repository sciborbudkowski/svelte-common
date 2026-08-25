// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('esm-env', async (importOriginal) => {
	const actual = await importOriginal<typeof import('esm-env')>();

	return {
		...actual,
		BROWSER: true
	};
});

import {
	THEME_STORAGE_KEY,
	destroyTheme,
	initializeTheme,
	setTheme,
	themeState,
	toggleTheme,
	useSystemTheme
} from './theme.svelte.js';

describe('theme', () => {
	let systemDark = false;
	let systemChange: (() => void) | null = null;
	let storedValues: Map<string, string>;

	beforeEach(() => {
		systemDark = false;
		systemChange = null;
		storedValues = new Map();
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			value: {
				get length() {
					return storedValues.size;
				},
				clear: vi.fn(() => storedValues.clear()),
				getItem: vi.fn((key: string) => storedValues.get(key) ?? null),
				key: vi.fn((index: number) => [...storedValues.keys()][index] ?? null),
				removeItem: vi.fn((key: string) => storedValues.delete(key)),
				setItem: vi.fn((key: string, value: string) => storedValues.set(key, value))
			} satisfies Storage
		});
		delete document.documentElement.dataset.theme;

		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation(() => ({
				get matches() {
					return systemDark;
				},
				media: '(prefers-color-scheme: dark)',
				onchange: null,
				addEventListener: vi.fn((_event: string, listener: () => void) => {
					systemChange = listener;
				}),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		);
	});

	afterEach(() => {
		destroyTheme();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('odtwarza zapisany motyw', () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

		initializeTheme();

		expect(themeState).toMatchObject({
			preference: 'dark',
			resolved: 'dark',
			initialized: true
		});
		expect(document.documentElement.dataset.theme).toBe('dark');
	});

	it('śledzi ustawienie systemowe tylko dla preferencji system', () => {
		initializeTheme();
		systemDark = true;
		systemChange?.();

		expect(themeState.resolved).toBe('dark');
		expect(document.documentElement.dataset.theme).toBe('dark');

		setTheme('light');
		systemDark = false;
		systemChange?.();

		expect(themeState.resolved).toBe('light');
	});

	it('ustawia, przełącza i przywraca motyw systemowy', () => {
		initializeTheme();

		setTheme('dark');
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
		expect(themeState.resolved).toBe('dark');

		toggleTheme();
		expect(themeState.resolved).toBe('light');

		systemDark = true;
		useSystemTheme();
		expect(themeState.preference).toBe('system');
		expect(themeState.resolved).toBe('dark');
	});
});
