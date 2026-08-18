// src/lib/utils/scroll.ts

export function scrollToTarget(target: string | HTMLElement) {
	if (typeof window === 'undefined') return;

	if (target === 'top' || target === '#stop') {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		return;
	}

	const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
	element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
