// src/lib/stores/toaststack.svelte.ts

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

export const getVisibleToasts = () => visibleToasts;

export function showToast(
	input: Omit<UIToast, 'id' | 'timestamp'> & Partial<Pick<UIToast, 'id' | 'timestamp'>>
) {
	const t: UIToast = {
		id: input.id || crypto.randomUUID(),
		timestamp: input.timestamp || Date.now(),
		duration: input.duration ?? (input.type === 'error' ? 8000 : TOAST_VIEW_DURATION_MS),
		...input
	};

	toasts = [t, ...toasts].slice(0, TOAST_QUEUE_LENGTH);

	if (t.autoClose && t.duration !== null) {
		const ms = typeof t.duration === 'number' ? t.duration : TOAST_VIEW_DURATION_MS;
		const timeout = setTimeout(() => dismissToast(t.id), ms);
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
	const timeout = timeouts.get(id);
	if (timeout) {
		clearTimeout(timeout);
		timeouts.delete(id);
	}

	const index = toasts.findIndex((n) => n.id === id);
	if (index !== -1) toasts.splice(index, 1);
}

export function clearToasts() {
	for (const t of timeouts.values()) clearTimeout(t);
	timeouts.clear();
	toasts = [];
}
