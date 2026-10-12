const TABBABLE_SELECTOR = [
	'a[href]',
	'area[href]',
	'button',
	'input',
	'select',
	'textarea',
	'[tabindex]',
	'[contenteditable]:not([contenteditable="false"])',
	'details > summary:first-of-type',
	'audio[controls]',
	'video[controls]',
	'iframe'
].join(',');

/** Check visibility and disabled state without relying on layout measurements. */
export function canReceiveFocus(element: HTMLElement): boolean {
	if (!element.isConnected || element.matches(':disabled, input[type="hidden"]')) return false;

	const visibility = getComputedStyle(element).visibility;
	if (visibility === 'hidden' || visibility === 'collapse') return false;

	for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
		if (
			ancestor.hidden ||
			ancestor.inert ||
			ancestor.hasAttribute('inert') ||
			ancestor.getAttribute('aria-hidden') === 'true' ||
			getComputedStyle(ancestor).display === 'none'
		)
			return false;
		if (ancestor !== element && ancestor instanceof HTMLDetailsElement && !ancestor.open) {
			const summary = Array.from(ancestor.children).find((child) => child.tagName === 'SUMMARY');
			if (!summary?.contains(element)) return false;
		}
	}

	return true;
}

export function getTabbableElements(root: HTMLElement): HTMLElement[] {
	const tabIndex = (element: HTMLElement): number => {
		if (element.hasAttribute('tabindex')) return element.tabIndex;
		if (element.matches('[contenteditable]:not([contenteditable="false"])')) {
			const editingParent = element.parentElement?.closest('[contenteditable]');
			return editingParent &&
				editingParent.getAttribute('contenteditable')?.toLowerCase() !== 'false'
				? -1
				: 0;
		}
		if (element.matches('summary, audio[controls], video[controls]')) return 0;
		return element.tabIndex;
	};
	const candidates = Array.from(root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
		(element) => tabIndex(element) >= 0 && canReceiveFocus(element)
	);
	const radioIsTabbable = (element: HTMLElement): boolean => {
		if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name)
			return true;
		const group = candidates.filter(
			(other): other is HTMLInputElement =>
				other instanceof HTMLInputElement &&
				other.type === 'radio' &&
				other.name === element.name &&
				other.form === element.form
		);
		return element === (group.find((radio) => radio.checked) ?? group[0]);
	};
	return candidates.filter(radioIsTabbable).sort((a, b) => {
		const aIndex = tabIndex(a);
		const bIndex = tabIndex(b);
		return (aIndex > 0 ? aIndex : Infinity) - (bIndex > 0 ? bIndex : Infinity) || 0;
	});
}
