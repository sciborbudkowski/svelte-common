// src/lib/stores/theme.svelte.ts

import { BROWSER } from 'esm-env';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export interface ThemeState {
	preference: ThemePreference;
	resolved: ResolvedTheme;
	initialized: boolean;
}

export const THEME_STORAGE_KEY = 'sc-theme';

export const themeState: ThemeState = $state({
	preference: 'system',
	resolved: 'light',
	initialized: false
});

let mediaQuery: MediaQueryList | null = null;
let removeListeners: (() => void) | null = null;

function isThemePreference(value: unknown): value is ThemePreference {
	return value === 'light' || value === 'dark' || value === 'system';
}

function getStoredPreference(): ThemePreference {
	if (!BROWSER) return 'system';

	try {
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
		return isThemePreference(stored) ? stored : 'system';
	} catch {
		return 'system';
	}
}

function storePreference(preference: ThemePreference): void {
	if (!BROWSER) return;

	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// Persisting the preference is optional.
	}
}

function getSystemTheme(): ResolvedTheme {
	return mediaQuery?.matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
	return preference === 'system' ? getSystemTheme() : preference;
}

function applyTheme(preference: ThemePreference): void {
	const resolved = resolveTheme(preference);

	themeState.preference = preference;
	themeState.resolved = resolved;

	if (BROWSER) document.documentElement.dataset.theme = resolved;
}

export function setTheme(preference: ThemePreference): void {
	if (!isThemePreference(preference)) return;

	storePreference(preference);
	applyTheme(preference);
}

export function toggleTheme(): void {
	setTheme(themeState.resolved === 'dark' ? 'light' : 'dark');
}

export function useSystemTheme(): void {
	setTheme('system');
}

export function destroyTheme(): void {
	removeListeners?.();
	removeListeners = null;
	mediaQuery = null;
	themeState.initialized = false;
}

export function initializeTheme(): () => void {
	if (!BROWSER) return () => {};

	destroyTheme();
	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const handleSystemChange = (): void => {
		if (themeState.preference === 'system') applyTheme('system');
	};

	const handleStorage = (event: StorageEvent): void => {
		if (event.key !== THEME_STORAGE_KEY) return;
		applyTheme(isThemePreference(event.newValue) ? event.newValue : 'system');
	};

	mediaQuery.addEventListener('change', handleSystemChange);
	window.addEventListener('storage', handleStorage);

	removeListeners = () => {
		mediaQuery?.removeEventListener('change', handleSystemChange);
		window.removeEventListener('storage', handleStorage);
	};

	applyTheme(getStoredPreference());
	themeState.initialized = true;

	return destroyTheme;
}
