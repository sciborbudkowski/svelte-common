// src/lib/services/storage.ts

import { BROWSER } from 'esm-env';

type Box<T> = {
	value: T;
	expiresAt: number;
};

function getLocalStorage(): Storage | null {
	if (!BROWSER) return null;

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class EphemeralStorage {
	static async set<T>(key: string, value: T, ttlMs = 1000 * 60 * 60) {
		const storage = getLocalStorage();
		if (!storage) return;

		const payload: Box<T> = {
			value,
			expiresAt: Date.now() + ttlMs
		};

		storage.setItem(key, JSON.stringify(payload));
	}

	static async get<T>(key: string): Promise<T | null> {
		const storage = getLocalStorage();
		if (!storage) return null;

		const raw = storage.getItem(key);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as Partial<Box<T>>;

			if (typeof parsed.expiresAt !== 'number') {
				storage.removeItem(key);
				return null;
			}
			if (Date.now() > parsed.expiresAt) {
				storage.removeItem(key);
				return null;
			}

			return (parsed.value as T) ?? null;
		} catch {
			storage.removeItem(key);
			return null;
		}
	}

	static async delete(key: string): Promise<void> {
		const storage = getLocalStorage();
		if (!storage) return;

		storage.removeItem(key);
	}
}
