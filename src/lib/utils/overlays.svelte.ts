import { tick } from 'svelte';
import { canReceiveFocus, getTabbableElements } from './focus.ts';

type Overlay = {
	element: HTMLElement;
	focusTarget: HTMLElement;
	priority: number;
	previous: HTMLElement | null;
	previousOverlay: Overlay | null;
};
const overlays: Overlay[] = [];
let activeOverlay = $state.raw<Overlay | null>(null);
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- DOM restoration bookkeeping
const inertElements = new Map<HTMLElement, { attribute: string | null; inert: boolean }>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- reference counts do not drive rendering
const scrollLocks = new Map<HTMLElement, { count: number; styles: [string, string, string][] }>();
let observer: MutationObserver | null = null;

export function acquireScrollLock(target: HTMLElement): () => void {
	let lock = scrollLocks.get(target);
	if (lock) lock.count++;
	else {
		lock = {
			count: 1,
			styles: ['overflow', 'overflow-x', 'overflow-y'].map((property) => [
				property,
				target.style.getPropertyValue(property),
				target.style.getPropertyPriority(property)
			])
		};
		scrollLocks.set(target, lock);
		target.style.setProperty('overflow', 'hidden', 'important');
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--lock.count > 0) return;
		for (const [property] of lock.styles) target.style.removeProperty(property);
		for (const [property, value, priority] of lock.styles) {
			if (value) target.style.setProperty(property, value, priority);
		}
		scrollLocks.delete(target);
	};
}

export function isActiveOverlay(element: HTMLElement | null): boolean {
	return activeOverlay?.element === element;
}

export function containsActiveOverlay(element: HTMLElement | null): boolean {
	return !!activeOverlay && (element?.contains(activeOverlay.element) ?? false);
}

function focusOverlay(): void {
	const active = activeOverlay;
	if (!active) return;
	const target = getTabbableElements(active.focusTarget)[0] ?? active.focusTarget;
	if (canReceiveFocus(target)) target.focus({ preventScroll: true });
}

function containFocus(event: FocusEvent): void {
	if (activeOverlay && !activeOverlay.focusTarget.contains(event.target as Node)) focusOverlay();
}

function trapTab(event: KeyboardEvent): void {
	const active = activeOverlay;
	if (!active || event.key !== 'Tab') return;
	const elements = getTabbableElements(active.focusTarget);
	const index = elements.indexOf(document.activeElement as HTMLElement);
	event.preventDefault();
	event.stopPropagation();
	const next =
		index === -1
			? event.shiftKey
				? elements.at(-1)
				: elements[0]
			: elements[(index + (event.shiftKey ? -1 : 1) + elements.length) % elements.length];
	(next ?? active.focusTarget).focus({ preventScroll: true });
}

function updateBackground(): void {
	const active = overlays
		.filter((entry) => entry.element.isConnected)
		.reduce<Overlay | null>(
			(top, entry) => (!top || entry.priority >= top.priority ? entry : top),
			null
		);
	activeOverlay = active;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local DOM traversal
	const blocked = new Set<HTMLElement>();
	if (active) {
		for (
			let branch: HTMLElement | null = active.element;
			branch && branch !== document.body;
			branch = branch.parentElement
		) {
			for (const sibling of branch.parentElement?.children ?? []) {
				if (sibling !== branch && sibling instanceof HTMLElement) blocked.add(sibling);
			}
		}
	}
	for (const [element, previous] of inertElements) {
		if (blocked.has(element)) continue;
		element.inert = previous.inert;
		if (previous.attribute === null) element.removeAttribute('inert');
		else element.setAttribute('inert', previous.attribute);
		inertElements.delete(element);
	}
	for (const element of blocked) {
		if (!inertElements.has(element))
			inertElements.set(element, {
				attribute: element.getAttribute('inert'),
				inert: element.inert ?? false
			});
		element.inert = true;
		element.setAttribute('inert', '');
	}
}

/** Isolate the active overlay, even when components live in different DOM branches. */
export function registerOverlay(
	element: HTMLElement,
	focusTarget: HTMLElement,
	priority = 0,
	restoreFocus = false
): () => void {
	const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const entry: Overlay = {
		element,
		focusTarget,
		priority,
		previous,
		previousOverlay:
			overlays
				.slice()
				.reverse()
				.find((overlay) => previous && overlay.focusTarget.contains(previous)) ?? null
	};
	overlays.push(entry);
	if (!observer) {
		observer = new MutationObserver(updateBackground);
		observer.observe(document.body, { childList: true, subtree: true });
		document.addEventListener('focusin', containFocus, true);
		document.addEventListener('keydown', trapTab, true);
	}
	updateBackground();
	let released = false;
	return () => {
		if (released) return;
		released = true;
		for (const other of overlays) {
			if (
				other !== entry &&
				(other.previousOverlay === entry ||
					(other.previous && entry.focusTarget.contains(other.previous)))
			) {
				other.previous = entry.previous;
				other.previousOverlay = entry.previousOverlay;
			}
		}
		overlays.splice(overlays.indexOf(entry), 1);
		updateBackground();
		if (overlays.length === 0) {
			observer?.disconnect();
			observer = null;
			document.removeEventListener('focusin', containFocus, true);
			document.removeEventListener('keydown', trapTab, true);
		}
		void tick().then(() => {
			const previous = entry.previous;
			if (
				restoreFocus &&
				previous &&
				canReceiveFocus(previous) &&
				(!activeOverlay || activeOverlay.focusTarget.contains(previous))
			)
				previous.focus({ preventScroll: true });
			else if (activeOverlay && !activeOverlay.focusTarget.contains(document.activeElement))
				focusOverlay();
		});
	};
}
