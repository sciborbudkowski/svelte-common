// src/lib/stores/modal.svelte.ts
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

export function registerModal(id: string) {
	if (!modalStack.includes(id)) modalStack.push(id);
}

export function unregisterModal(id: string) {
	const index = modalStack.indexOf(id);
	if (index !== -1) modalStack.splice(index, 1);
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
	modalsState.confirmModal = {
		isOpen: true,
		id: '__confirm_modal_id',
		message,
		onConfirm,
		onCancel: options?.onCancel ?? null,
		context: options?.context ?? null
	};
};

export const requestConfirmation = (message: string): Promise<boolean> =>
	new Promise((resolve) => {
		openConfirmModal(message, () => resolve(true), { onCancel: () => resolve(false) });
	});

export const openAlertModal = (message: string, type: AlertModalType = 'info') => {
	modalsState.alertModal = { isOpen: true, id: '__alert_modal_id', message, type };
};

export const openModal = (modalId: string, options?: ModalOptions) => {
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
	modalsState.alertModal = { isOpen: false, id: '__alert_modal_id', message: '', type: 'info' };
};

export const closeModal = (modalId: string) => {
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
