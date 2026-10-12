import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from './+page.svelte';

describe('component playground', () => {
	it('renders the composed demos during SSR with overlays initially closed', () => {
		const { body, head } = render(Page);
		expect(head).toContain('Component playground');
		for (const id of ['components', 'overlays', 'motion', 'styles', 'imports']) {
			expect(body).toContain(`id="${id}"`);
		}
		expect(body).toContain('aria-label="Feature slides"');
		expect(body).toContain('svelte-common/components/Avatar');
		expect(body).not.toContain('aria-modal="true"');
	});
});
