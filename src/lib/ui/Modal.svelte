<script lang="ts">
	import { untrack, type ComponentProps } from 'svelte';
	import Dialog from './Dialog.svelte';
	import { modalsState, getModalContext, closeModal } from '../stores/modal.svelte.ts';
	import { notify, type OpenChangeDetails } from './contracts.ts';
	type Props = Omit<ComponentProps<typeof Dialog>, 'id' | 'defaultOpen'> & {
		id: string;
		defaultOpen?: boolean;
	};
	let {
		id,
		open,
		defaultOpen,
		onOpenChange,
		onConfirm,
		onCancel,
		openingKey,
		size,
		fullHeight,
		...props
	}: Props = $props();
	const local = untrack(() => defaultOpen !== undefined && open === undefined);
	const modal = $derived(modalsState.customModal[id]);
	const context = $derived(
		getModalContext<{ size?: 'wide' | 'narrow' | 'full'; fullHeight?: boolean }>(id)
	);
	const effectiveOpen = $derived(local ? undefined : (open ?? modal?.isOpen ?? false));
	const effectiveKey = $derived(openingKey ?? modal);
	function changed(next: boolean, details: OpenChangeDetails) {
		if (!local && open === undefined && !next) closeModal(id);
		notify(onOpenChange, next, details);
	}
	async function confirm() {
		const callback = onConfirm ?? modal?.onConfirm;
		await callback?.(modal?.context);
	}
	function cancel() {
		(onCancel ?? modal?.onCancel)?.(modal?.context);
	}
</script>

<Dialog
	{...props}
	{id}
	open={effectiveOpen}
	{defaultOpen}
	openingKey={effectiveKey}
	size={context?.size ?? size}
	fullHeight={context?.fullHeight ?? fullHeight}
	onOpenChange={changed}
	onConfirm={confirm}
	onCancel={cancel}
/>
