// src/lib/stores/modal.svelte.ts

import { BROWSER } from 'esm-env';
import { tick } from 'svelte';
import { canReceiveFocus } from '../utils/focus.ts';
import { acquireScrollLock } from '../utils/overlays.svelte.ts';

type AlertModalType = 'info' | 'success' | 'warning' | 'error';
type MaybePromise<T> = T | Promise<T>;

interface CustomModalState {
	isOpen: boolean;
	id: string;
	context?: unknown;
	onConfirm: ((context?: unknown) => MaybePromise<void>) | null;
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
	onConfirm?: (context?: unknown) => MaybePromise<void>;
	onCancel?: (context?: unknown) => void;
	context?: unknown;
}

let scrollLockTarget: HTMLElement | null = null;
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- private focus history does not drive rendering
const focusHistory = new Map<
	string,
	{ dialog: HTMLElement | null; previous: HTMLElement | null }
>();
let releaseScrollLock: (() => void) | null = null;

function lockScroll(): void {
	if (releaseScrollLock) return;
	releaseScrollLock = acquireScrollLock(scrollLockTarget ?? document.body);
}

function unlockScroll(): void {
	releaseScrollLock?.();
	releaseScrollLock = null;
}

function requireBrowser(operation: string): void {
	if (!BROWSER) throw new Error(`${operation} can only be used in the browser.`);
}

/** Configure the shared scroll container for all modals. Null restores the body default. */
export function setModalScrollLockTarget(target: HTMLElement | null): void {
	requireBrowser('setModalScrollLockTarget');

	if (scrollLockTarget === target) return;

	unlockScroll();
	scrollLockTarget = target;
	if (modalStack.length > 0) lockScroll();
}

export function registerModal(id: string, dialog: HTMLElement | null = null) {
	requireBrowser('registerModal');

	if (modalStack.includes(id)) return;
	if (modalStack.length === 0) lockScroll();

	focusHistory.set(id, {
		dialog,
		previous: document.activeElement instanceof HTMLElement ? document.activeElement : null
	});
	modalStack.push(id);
}

export function unregisterModal(id: string) {
	requireBrowser('unregisterModal');

	const index = modalStack.indexOf(id);
	if (index === -1) return;

	const wasTopMost = index === modalStack.length - 1;
	const removed = focusHistory.get(id);
	if (removed?.dialog) {
		for (const entry of focusHistory.values()) {
			if (entry.previous && removed.dialog.contains(entry.previous)) {
				entry.previous = removed.previous;
			}
		}
	}
	focusHistory.delete(id);
	modalStack.splice(index, 1);

	if (modalStack.length === 0) unlockScroll();

	if (wasTopMost && removed) {
		void tick().then(() => {
			const topDialog = focusHistory.get(modalStack.at(-1) ?? '')?.dialog;
			const previous = removed.previous;
			if (previous && canReceiveFocus(previous) && (!topDialog || topDialog.contains(previous))) {
				previous.focus();
			} else if (topDialog && canReceiveFocus(topDialog)) {
				topDialog.focus();
			}
		});
	}
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
	settleConfirmation(false);

	modalsState.confirmModal = {
		isOpen: true,
		id: '__confirm_modal_id',
		message,
		onConfirm,
		onCancel: options?.onCancel ?? null,
		context: options?.context ?? null
	};
};

type ConfirmationRequest = { resolve: (result: boolean) => void };
let pendingConfirmation: ConfirmationRequest | null = null;

function settleConfirmation(result: boolean, request = pendingConfirmation): void {
	if (!request || request !== pendingConfirmation) return;
	pendingConfirmation = null;
	request.resolve(result);
}

export function requestConfirmation(message: string): Promise<boolean> {
	requireBrowser('requestConfirmation');
	return new Promise((resolve) => {
		const request = { resolve };
		openConfirmModal(message, () => settleConfirmation(true, request), {
			onCancel: () => settleConfirmation(false, request)
		});
		pendingConfirmation = request;
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
