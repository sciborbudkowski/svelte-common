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

		try {
			const payload: Box<T> = {
				value,
				expiresAt: Date.now() + ttlMs
			};

			storage.setItem(key, JSON.stringify(payload));
		} catch {
			// storage is optional
		}
	}

	static async get<T>(key: string): Promise<T | null> {
		const storage = getLocalStorage();
		if (!storage) return null;

		try {
			const raw = storage.getItem(key);
			if (!raw) return null;

			const parsed = JSON.parse(raw) as Partial<Box<T>>;

			if (typeof parsed.expiresAt !== 'number') {
				await this.safeDelete(storage, key);
				return null;
			}
			if (Date.now() > parsed.expiresAt) {
				await this.safeDelete(storage, key);
				return null;
			}

			return (parsed.value as T) ?? null;
		} catch {
			await this.safeDelete(storage, key);
			return null;
		}
	}

	static async delete(key: string): Promise<void> {
		const storage = getLocalStorage();
		if (!storage) return;

		await this.safeDelete(storage, key);
	}

	private static async safeDelete(storage: Storage, key: string): Promise<void> {
		try {
			storage.removeItem(key);
		} catch {
			// storage is optional
		}
	}
}
