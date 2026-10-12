// Public controller facade; stack and focus bookkeeping stay private.
export {
	openModal,
	openAlertModal,
	closeAlertModal,
	openConfirmModal,
	closeConfirmModal,
	closeModal,
	getModalContext,
	requestConfirmation,
	isModalOpen,
	setModalScrollLockTarget
} from './modal.svelte.ts';
