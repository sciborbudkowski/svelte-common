// src/lib/utils/styles.ts

export function cssVarRgb(root: CSSStyleDeclaration, name: string): string | null {
	const v = root.getPropertyValue(name).trim();
	return v || null;
}

export function rgba(rgbTriplet: string, alpha: number): string {
	return `rgba(${rgbTriplet.replace(/\s+/g, ',')},${alpha})`;
}

type Reader<T> = { [K in keyof T]: (css: CSSStyleDeclaration) => T[K] };

export function readThemeColors<T>(reader: Reader<T>): T {
	const css = getComputedStyle(document.documentElement);
	const out = {} as T;

	for (const key in reader) {
		out[key] = reader[key](css);
	}

	return out;
}
