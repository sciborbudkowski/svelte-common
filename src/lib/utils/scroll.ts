// src/lib/utils/scroll.ts
import type Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
	lenisInstance = instance;
}

export function destroyLenis() {
	lenisInstance?.destroy();
	lenisInstance = null;
}

export function scrollToTarget(
	target: string | HTMLElement,
	options?: Parameters<Lenis['scrollTo']>[1]
) {
	if (typeof window === 'undefined') return;

	if (lenisInstance) {
		lenisInstance.scrollTo(target, {
			duration: 1,
			easing: (t: number) => 1 - Math.pow(1 - t, 4),
			...options
		});
		return;
	}

	if (typeof target === 'string') {
		if (target === '#stop' || target === 'top') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		document
			.querySelector<HTMLElement>(target)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return;
	}

	target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
