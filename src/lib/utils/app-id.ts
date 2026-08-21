// src/lib/utils/app-id.ts

import { BROWSER } from 'esm-env';

function getLocalStorage(): Storage | null {
	if(!BROWSER) return null;

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function setupAppIdentity(idKey: string): string | null {
	const storage = getLocalStorage();
	if(!storage) return null;

	let appId = storage.getItem(idKey) ?? null;
	if (!appId) {
		appId = crypto.randomUUID();
		storage.setItem(idKey, appId);
	}

	return appId;
}
