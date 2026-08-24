// src/lib/stores/modal.svelte.ts

import { BROWSER } from 'esm-env';

type AlertModalType = 'info' | 'success' | 'warning' | 'error';
type MaybePromise<T> = T | Promise<T>;

interface CustomModalState {
	isOpen: boolean;
	id: string;
	context?: unknown;
	onConfirm: ((context?: unknown) => void) | null;
	onCancel: ((context?: unknown) => void) | null;
}

interface ModalState {
	confirmModal: {
		isOpen: boolean;
		id: string;
		message: string;
		onConfirm: ((context?: unknown) => MaybePromise<void>) | null;
		onCancel?: (() => void) | null;
		context?: unknown;
	};
	alertModal: {
		isOpen: boolean;
		id: string;
		message: string;
		type: AlertModalType;
	};
	customModal: Record<string, CustomModalState>;
}

interface ModalOptions {
	onConfirm?: (context?: unknown) => void;
	onCancel?: (context?: unknown) => void;
	context?: unknown;
}

let previousBodyOverflow: string | null = null;

function lockBodyScroll(): void {
	if (previousBodyOverflow !== null) return;

	previousBodyOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';
}

function unlockBodyScroll(): void {
	if (previousBodyOverflow === null) return;

	document.body.style.overflow = previousBodyOverflow;
	previousBodyOverflow = null;
}

function requireBrowser(operation: string): void {
	if (!BROWSER) throw new Error(`${operation} can only be used in the browser.`);
}

export function registerModal(id: string) {
	requireBrowser('registerModal');

	if (modalStack.includes(id)) return;
	if (modalStack.length === 0) lockBodyScroll();

	modalStack.push(id);
}

export function unregisterModal(id: string) {
	requireBrowser('unregisterModal');

	const index = modalStack.indexOf(id);
	if (index === -1) return;

	modalStack.splice(index, 1);

	if (modalStack.length === 0) unlockBodyScroll();
}

export const modalsState = $state<ModalState>({
	confirmModal: {
		isOpen: false,
		id: '__confirm_modal_id',
		message: '',
		onConfirm: null,
		onCancel: null,
		context: null
	},
	alertModal: { isOpen: false, id: '__alert_modal_id', message: '', type: 'info' },
	customModal: {}
});

export const modalStack = $state<string[]>([]);

const ensureCustomModal = (modalId?: string) => {
	if (!modalId) return;
	if (!modalsState.customModal[modalId])
		modalsState.customModal[modalId] = {
			isOpen: false,
			id: modalId,
			context: undefined,
			onConfirm: null,
			onCancel: null
		};
};

export const openConfirmModal = (
	message: string,
	onConfirm: (context?: unknown) => MaybePromise<void>,
	options?: { onCancel?: () => void; context?: unknown }
) => {
	requireBrowser('openConfirmModal');

	modalsState.confirmModal = {
		isOpen: true,
		id: '__confirm_modal_id',
		message,
		onConfirm,
		onCancel: options?.onCancel ?? null,
		context: options?.context ?? null
	};
};

let pendingConfirmation: ((result: boolean) => void) | null = null;

function settleConfirmation(result: boolean): void {
	const resolve = pendingConfirmation;
	pendingConfirmation = null;
	resolve?.(result);
}

export function requestConfirmation(message: string): Promise<boolean> {
	requireBrowser('requestConfirmation');
	settleConfirmation(false);

	return new Promise((resolve) => {
		pendingConfirmation = resolve;
		openConfirmModal(message, () => settleConfirmation(true), {
			onCancel: () => settleConfirmation(false)
		});
	});
}

export const openAlertModal = (message: string, type: AlertModalType = 'info') => {
	requireBrowser('openAlertModal');
	modalsState.alertModal = { isOpen: true, id: '__alert_modal_id', message, type };
};

export const openModal = (modalId: string, options?: ModalOptions) => {
	requireBrowser('openModal');

	ensureCustomModal(modalId);
	modalsState.customModal[modalId] = {
		isOpen: true,
		id: modalId,
		context: options?.context ?? null,
		onConfirm: options?.onConfirm ?? null,
		onCancel: options?.onCancel ?? null
	};
};

export const closeConfirmModal = (): void => {
	requireBrowser('closeConfirmModal');

	settleConfirmation(false);

	modalsState.confirmModal = {
		isOpen: false,
		id: '__confirm_modal_id',
		message: '',
		onConfirm: null,
		onCancel: null,
		context: null
	};
};

export const closeAlertModal = (): void => {
	requireBrowser('closeAlertModal');

	modalsState.alertModal = { isOpen: false, id: '__alert_modal_id', message: '', type: 'info' };
};

export const closeModal = (modalId: string) => {
	requireBrowser('closeModal');
	ensureCustomModal(modalId);

	modalsState.customModal[modalId] = {
		isOpen: false,
		id: modalId,
		context: undefined,
		onConfirm: null,
		onCancel: null
	};
};

export const getModalContext = <T = unknown>(modalId: string): T | undefined =>
	modalsState.customModal[modalId]?.context as T | undefined;

export const isModalOpen = (modalId: string): boolean =>
	modalsState.customModal[modalId]?.isOpen ?? false;