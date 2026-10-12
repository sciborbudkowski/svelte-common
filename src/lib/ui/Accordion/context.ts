export const ACCORDION = Symbol('svelte-common accordion');

export interface AccordionContext {
	id: string;
	isOpen: (id: string) => boolean;
	toggle: (id: string, event?: Event) => void;
	open: (id: string) => void;
	isDisabled: () => boolean;
}
