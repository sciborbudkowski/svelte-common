import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import * as lib from '../index.ts';
import MigrationAccordionFixture from './fixtures/MigrationAccordionFixture.svelte';
import AccordionFixture from './fixtures/AccordionFixture.svelte';

const content = createRawSnippet(() => ({ render: () => '<span>Content</span>' }));
const cases: [string, () => ReturnType<typeof render>][] = [
	[
		'Carousel',
		() =>
			render(lib.Carousel, {
				props: {
					slides: [
						{
							id: 'one',
							image: 'image.jpg',
							header: 'Header',
							title: 'Title',
							descriptionHtml: 'Text',
							buttons: []
						}
					]
				}
			})
	],
	['CircularTimer', () => render(lib.CircularTimer)],
	['FloatingButton', () => render(lib.FloatingButton, { props: { id: 'ssr' } })],
	['Loader', () => render(lib.Loader)],
	['LoaderView', () => render(lib.LoaderView, { props: { open: true, message: 'Local loader' } })],
	[
		'ToastStackView',
		() =>
			render(lib.ToastStackView, {
				props: { items: [{ id: 'local', type: 'info', message: 'Local toast', timestamp: 1 }] }
			})
	],
	[
		'Dialog',
		() => render(lib.Dialog, { props: { defaultOpen: true, 'aria-label': 'Local dialog' } })
	],
	['ManagedModal', () => render(lib.ManagedModal, { props: { modalId: 'ssr-managed' } })],
	['FloatingAction', () => render(lib.FloatingAction, { props: { id: 'ssr-action' } })],
	['FloatingLink', () => render(lib.FloatingLink, { props: { id: 'ssr-link', href: '/link' } })],
	['Modal', () => render(lib.Modal, { props: { id: 'ssr', open: true, ariaLabel: 'Preview' } })],
	['AlertModal', () => render(lib.AlertModal)],
	['ConfirmModal', () => render(lib.ConfirmModal)],
	['ToastStack', () => render(lib.ToastStack)],
	[
		'CollapsibleCard',
		() =>
			render(lib.CollapsibleCard, { props: { visibleContent: content, hiddenContent: content } })
	],
	['Accordion/AccordionItem', () => render(AccordionFixture)],
	['Spinner', () => render(lib.Spinner)],
	['Avatar', () => render(lib.Avatar)],
	['ScrollIndicator', () => render(lib.ScrollIndicator)],
	['ScrollHint', () => render(lib.ScrollHint)],
	['SizeView', () => render(lib.SizeView)]
];

describe('component SSR', () => {
	it('honors a controlled empty selection during SSR despite legacy item defaults', () => {
		expect(
			render(MigrationAccordionFixture, { props: { value: [], legacyItemOpen: true } }).body
		).not.toContain('aria-expanded="true"');
	});
	it('renders the controlled carousel index and stable card relationships during SSR', () => {
		const output = render(lib.Carousel, {
			props: {
				index: 1,
				slides: [0, 1].map((i) => ({
					id: String(i),
					image: 'x',
					title: 'x',
					header: 'x',
					descriptionHtml: 'x',
					buttons: []
				}))
			}
		}).body;
		expect(output).toContain('data-index="1"');
		const card = render(lib.CollapsibleCard, {
			props: {
				id: 'stable-card',
				visibleContent: content,
				hiddenContent: content,
				defaultOpen: true
			}
		}).body;
		expect(card).toContain('aria-controls="stable-card-panel"');
		expect(card).toContain('id="stable-card-panel"');
	});
	it.each(cases)('renders %s without browser globals', (_name, output) => {
		expect(output().body).toBeTypeOf('string');
	});
	it('keeps the single-open invariant when several items request initial opening', () => {
		expect(
			render(AccordionFixture, {
				props: { initiallyOpen: true, secondInitiallyOpen: true }
			}).body.match(/aria-expanded="true"/g)
		).toHaveLength(1);
	});
});
