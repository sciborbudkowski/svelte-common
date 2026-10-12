// src/lib/stores/toaststack.svelte.ts

import { BROWSER } from 'esm-env';

export type ToastCloseReason = 'dismissed' | 'timeout' | 'evicted' | 'replaced' | 'cleared';

export type UIToastType = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const TOAST_VIEW_DURATION_MS = 5000;
const TOAST_QUEUE_LENGTH = 5;

export interface UIToast {
	id: string;
	title?: string;
	message: string;
	systemMessage?: string | null;
	type: UIToastType;
	timestamp: number;
	autoClose?: boolean;
	duration?: number;
	data?: unknown;
	icon?: string;
	onClose?: (reason: ToastCloseReason) => void | Promise<void>;
}

let toasts: UIToast[] = $state([]);

// eslint-disable-next-line svelte/prefer-svelte-reactivity -- timeout handles are private bookkeeping, not reactive UI state
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();
let nextGeneration = 0;
const generations = new WeakMap<UIToast, number>();
const visibleToasts = $derived(toasts.slice(0, TOAST_QUEUE_LENGTH));

function requireBrowser(operation: string): void {
	if (!BROWSER) throw new Error(`${operation} can only be used in the browser.`);
}

export const getVisibleToasts = () => visibleToasts;
export const getToastGeneration = (toast: UIToast) => generations.get(toast);

function clearToastTimer(id: string): void {
	const timeout = timeouts.get(id);
	if (timeout !== undefined) clearTimeout(timeout);
	timeouts.delete(id);
}

function notifyClose(toast: UIToast, reason: ToastCloseReason): void {
	try {
		void Promise.resolve(toast.onClose?.(reason)).catch((error) => {
			console.error('Toast onClose failed: ', error);
		});
	} catch (error) {
		console.error('Toast onClose failed: ', error);
	}
}

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
		timestamp: input.timestamp ?? Date.now(),
		duration
	};

	const replaced = toasts.find((toast) => toast.id === t.id);
	const next = [t, ...toasts.filter((toast) => toast.id !== t.id)];
	const evicted = next.slice(TOAST_QUEUE_LENGTH);
	if (replaced) clearToastTimer(replaced.id);
	for (const toast of evicted) clearToastTimer(toast.id);
	toasts = next.slice(0, TOAST_QUEUE_LENGTH);
	generations.set(toasts[0], ++nextGeneration);
	if (t.autoClose) {
		timeouts.set(
			t.id,
			setTimeout(() => dismissToast(t.id, 'timeout'), duration)
		);
	}
	// Notify after committing state/timers, so callbacks can safely create new toasts.
	if (replaced) notifyClose(replaced, 'replaced');
	for (const toast of evicted) notifyClose(toast, 'evicted');

	return t.id;
}

export function showSuccessToast(
	message: string,
	title: string = 'Sukces',
	autoClose: boolean = true,
	duration: number = 4000,
	systemMessage: string | null = null
) {
	return showToast({
		type: 'success',
		title,
		message,
		systemMessage,
		autoClose,
		duration
	});
}

export function showErrorToast(
	message: string,
	title: string = 'Error!',
	autoClose: boolean = true,
	duration: number = 8000,
	systemMessage: string | null = null
) {
	return showToast({
		type: 'error',
		title: title === 'Error!' ? 'Błąd!' : title,
		message,
		systemMessage,
		autoClose,
		duration
	});
}

export function dismissToast(id: string, reason: ToastCloseReason = 'dismissed') {
	requireBrowser('dismissToast');

	clearToastTimer(id);

	const index = toasts.findIndex((n) => n.id === id);
	if (index === -1) return;

	const [toast] = toasts.splice(index, 1);
	notifyClose(toast, reason);
}

export function clearToasts() {
	requireBrowser('clearToasts');

	const removed = [...toasts];
	for (const t of timeouts.values()) clearTimeout(t);
	timeouts.clear();
	toasts = [];
	for (const toast of removed) notifyClose(toast, 'cleared');
}
