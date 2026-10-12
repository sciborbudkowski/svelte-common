<!-- src/lib/ui/Modals/AlertModal.svelte -->

<script lang="ts">
	import { modalsState, closeAlertModal } from '../../stores/modal.svelte.ts';
	import { textToHtml } from '../../utils/text.ts';
	import Dialog from '../Dialog.svelte';
	import type { ComponentProps } from 'svelte';
	import Icon from '../internal/Icon.svelte';

	let {
		id = 'defaultAlertModalId',
		titles = {},
		okLabel = 'OK',
		headerProps = {},
		...props
	}: Omit<
		ComponentProps<typeof Dialog>,
		| 'open'
		| 'defaultOpen'
		| 'openingKey'
		| 'onConfirm'
		| 'onCancel'
		| 'onOpenChange'
		| 'header'
		| 'content'
		| 'children'
		| 'footer'
	> & {
		titles?: Partial<Record<'info' | 'success' | 'warning' | 'error', string>>;
		okLabel?: string;
	} = $props();
	const modal = $derived(modalsState.alertModal);

	const alertClass = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'alert-error';
			case 'info':
				return 'alert-info';
			case 'success':
				return 'alert-success';
			case 'warning':
				return 'alert-warning';
		}
	});

	const icon = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'error';
			case 'info':
				return 'info';
			case 'success':
				return 'success';
			case 'warning':
				return 'warning';
		}
	});

	const title = $derived.by(() => {
		switch (modalsState.alertModal.type) {
			case 'error':
				return 'Błąd';
			case 'info':
				return 'Informacja';
			case 'success':
				return 'Sukces';
			case 'warning':
				return 'Uwaga';
		}
	});
</script>

<Dialog
	{...props}
	{id}
	open={modal.isOpen}
	openingKey={modal}
	onCancel={closeAlertModal}
	headerProps={{ ...headerProps, class: [alertClass, headerProps.class ?? props.headerClass] }}
	{header}
	{content}
	{footer}
/>

{#snippet header()}<div>
		<Icon name={icon} class="me-2" />{titles[modal.type] ?? title}
	</div>{/snippet}

{#snippet content()}
	<div role="alert">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- slide.description is sanitized before it reaches here -->
		{@html textToHtml(modal.message)}
	</div>
{/snippet}

{#snippet footer()}
	<div class="w-100 py-1 text-center">
		<button type="button" class="btn" onclick={closeAlertModal}>{okLabel}</button>
	</div>
{/snippet}

<style>
	.btn {
		min-width: 100px;
	}
</style>
