// src/lib/index.ts

// UI
export { default as Carousel } from './ui/Carousel.svelte';
export { default as CircularTimer } from './ui/CircularTimer.svelte';
export { default as FloatingButton } from './ui/FloatingButton.svelte';
export { default as Loader } from './ui/Loader.svelte';
export { default as Modal } from './ui/Modal.svelte';
export { default as AlertModal } from './ui/Modals/AlertModal.svelte';
export { default as ConfirmModal } from './ui/Modals/ConfirmModal.svelte';
export { default as ToastStack } from './ui/ToastStack.svelte';
export { default as CollapsibleCard } from './ui/CollapsibleCard.svelte';
export { default as Accordion } from './ui/Accordion/Accordion.svelte';
export { default as AccordionItem } from './ui/Accordion/AccordionItem.svelte';
export { default as Spinner } from './ui/Spinner.svelte';

// Types
export type { CacheAdapter } from './services/cache.ts';

// Services
export * from './services/api.ts';
export * from './services/websockets.svelte.ts';
export * from './services/storage.ts';

// Stores
export * from './stores/loader.svelte.ts';
export * from './stores/toaststack.svelte.ts';
export * from './stores/gps.svelte.ts';
export {
	openModal,
	openAlertModal,
	closeAlertModal,
	openConfirmModal,
	closeConfirmModal,
	closeModal,
	getModalContext,
	requestConfirmation,
	isModalOpen
} from './stores/modal.svelte.ts';

// Utils
export * from './utils/app-id.ts';
export * from './utils/date.ts';
export * from './utils/styles.ts';
export * from './utils/text.ts';
export * from './utils/token.ts';
export * from './utils/files.ts';
export * from './utils/lang.ts';
export * from './utils/scroll.ts';

// Debug
export { default as SizeView } from './debug/SizeView.svelte';
