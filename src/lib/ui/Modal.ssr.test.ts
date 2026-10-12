// src/lib/ui/Modal.ssr.test.ts

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Modal from './Modal.svelte';
import ConfirmModal from './Modals/ConfirmModal.svelte';
import AlertModal from './Modals/AlertModal.svelte';

describe('modal server rendering', () => {
	it.each([ConfirmModal, AlertModal])(
		'renders a closed built-in modal without browser globals',
		(component) => {
			expect(render(component).body).not.toContain('role="dialog"');
		}
	);

	it('renders a controlled custom modal with an accessible name', () => {
		const output = render(Modal, { props: { id: 'preview', open: true, ariaLabel: 'Preview' } });
		expect(output.body).toContain('role="dialog"');
		expect(output.body).toContain('aria-label="Preview"');
	});
});
