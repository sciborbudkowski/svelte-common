<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Dialog from './Dialog.svelte';
	import { modalsState, getModalContext, closeModal } from '../stores/modal.svelte.ts';
	import { notify, type OpenChangeDetails } from './contracts.ts';
	type Props = Omit<ComponentProps<typeof Dialog>, 'open' | 'defaultOpen'> & { modalId: string };
	let {
		modalId,
		onConfirm,
		onCancel,
		onOpenChange,
		openingKey,
		size,
		fullHeight,
		...props
	}: Props = $props();
	const modal = $derived(modalsState.customModal[modalId]);
	const context = $derived(
		getModalContext<{ size?: 'wide' | 'narrow' | 'full'; fullHeight?: boolean }>(modalId)
	);
	function changed(next: boolean, details: OpenChangeDetails) {
		if (!next) closeModal(modalId);
		notify(onOpenChange, next, details);
	}
	async function confirm() {
		await (onConfirm ?? modal?.onConfirm)?.(modal?.context);
	}
	function cancel() {
		(onCancel ?? modal?.onCancel)?.(modal?.context);
	}
</script>

<Dialog
	{...props}
	open={modal?.isOpen ?? false}
	openingKey={openingKey ?? modal}
	size={context?.size ?? size}
	fullHeight={context?.fullHeight ?? fullHeight}
	onOpenChange={changed}
	onConfirm={confirm}
	onCancel={cancel}
/>
