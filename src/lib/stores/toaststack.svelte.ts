// src/lib/stores/toaststack.svelte.ts

import { BROWSER } from 'esm-env';

export type UIToastType = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const TOAST_VIEW_DURATION_MS = 5000;
const TOAST_QUEUE_LENGTH = 5;

export interface UIToast {
	id: string;
	title?: string;
	message: string;
	type: UIToastType;
	timestamp: number;
	autoClose?: boolean;
	duration?: number;
	data?: unknown;
	icon?: string;
}

let toasts: UIToast[] = $state([]);

// eslint-disable-next-line svelte/prefer-svelte-reactivity -- timeout handles are private bookkeeping, not reactive UI state
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();
const visibleToasts = $derived(toasts.slice(0, TOAST_QUEUE_LENGTH));

function requireBrowser(operation: string): void {
	if (!BROWSER) throw new Error(`${operation} can only be used in the browser.`);
}

export const getVisibleToasts = () => visibleToasts;

export function showToast(
	input: Omit<UIToast, 'id' | 'timestamp'> & Partial<Pick<UIToast, 'id' | 'timestamp'>>
) {
	requireBrowser('showToast');

	const defaultDuration = input.type === 'error' ? 8000 : TOAST_VIEW_DURATION_MS;
	const requestedDuration = input.duration;

	const duration =
		typeof requestedDuration === 'number' &&
		Number.isFinite(requestedDuration) &&
		requestedDuration > 0
			? requestedDuration
			: defaultDuration;

	const t: UIToast = {
		...input,
		id: input.id || crypto.randomUUID(),
		timestamp: input.timestamp || Date.now(),
		duration
	};

	const existingTimeout = timeouts.get(t.id);
	if (existingTimeout !== undefined) {
		clearTimeout(existingTimeout);
		timeouts.delete(t.id);
	}

	const existingIndex = toasts.findIndex((toast) => toast.id === t.id);
	if (existingIndex !== -1) toasts.splice(existingIndex, 1);

	const next = [t, ...toasts];
	const removed = next.slice(TOAST_QUEUE_LENGTH);
	for (const toast of removed) {
		const timeout = timeouts.get(toast.id);
		if (timeout !== undefined) clearTimeout(timeout);
		timeouts.delete(toast.id);
	}

	toasts = next.slice(0, TOAST_QUEUE_LENGTH);

	if (t.autoClose) {
		const timeout = setTimeout(() => dismissToast(t.id), duration);
		timeouts.set(t.id, timeout);
	}

	return t.id;
}

export function showSuccessToast(
	message: string,
	title: string = 'Sukces',
	autoClose: boolean = true,
	duration: number = 4000
) {
	showToast({
		type: 'success',
		title,
		message,
		autoClose,
		duration
	});
}

export function showErrorToast(
	message: string,
	title: string = 'Error!',
	autoClose: boolean = true,
	duration: number = 8000
) {
	showToast({
		type: 'error',
		title: title === 'Error!' ? 'Błąd!' : title,
		message,
		autoClose,
		duration
	});
}

export function dismissToast(id: string) {
	requireBrowser('dismissToast');

	const timeout = timeouts.get(id);
	if (timeout !== undefined) {
		clearTimeout(timeout);
		timeouts.delete(id);
	}

	const index = toasts.findIndex((n) => n.id === id);
	if (index !== -1) toasts.splice(index, 1);
}

export function clearToasts() {
	requireBrowser('clearToasts');

	for (const t of timeouts.values()) clearTimeout(t);
	timeouts.clear();
	toasts = [];
}
