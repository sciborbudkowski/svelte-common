import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';

export type TriggerState = Readonly<{ open: boolean; disabled: boolean }>;

export type ChangeDetails<Reason extends string> = { reason: Reason; event?: Event };
export type ChangeHandler<T, Details> = (next: T, details: Details) => void | Promise<void>;
export type OpenChangeDetails = ChangeDetails<
	'trigger' | 'escape' | 'backdrop' | 'close-button' | 'confirm' | 'cancel'
>;
export type AccordionChangeDetails = ChangeDetails<'trigger'> & { itemId: string };
export type CarouselIndexChangeDetails = ChangeDetails<
	'previous' | 'next' | 'pagination' | 'autoplay'
>;
export type CarouselPauseChangeDetails = ChangeDetails<'rotation-control'>;
export type DragPosition = { left: number; top: number };
export type DragPositionChangeDetails = ChangeDetails<'drag'>;
export type ButtonPartProps = Omit<
	HTMLButtonAttributes,
	'children' | 'id' | 'type' | 'aria-expanded' | 'aria-controls'
>;
export type PanelPartProps = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'id' | 'role' | 'aria-labelledby' | 'aria-hidden' | 'inert'
>;

/** Isolate notification failures without delaying the state owner's commit. */
export function notify<Args extends unknown[]>(
	callback: ((...args: Args) => void | Promise<void>) | undefined,
	...args: Args
): void {
	try {
		void Promise.resolve(callback?.(...args)).catch((error) =>
			console.error('Component callback failed:', error)
		);
	} catch (error) {
		console.error('Component callback failed:', error);
	}
}
