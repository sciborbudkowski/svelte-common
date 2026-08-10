// src/lib/services/storage.ts

type Box<T> = {
	value: T;
	expiresAt: number;
};

export class EphemeralStorage {
	static async set<T>(key: string, value: T, ttlMs = 1000 * 60 * 60) {
		const payload: Box<T> = {
			value,
			expiresAt: Date.now() + ttlMs
		};

		localStorage.setItem(key, JSON.stringify(payload));
	}

	static async get<T>(key: string): Promise<T | null> {
		const raw = localStorage.getItem(key);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as Partial<Box<T>>;

			if (typeof parsed.expiresAt !== 'number') {
				localStorage.removeItem(key);
				return null;
			}
			if (Date.now() > parsed.expiresAt) {
				localStorage.removeItem(key);
				return null;
			}

			return (parsed.value as T) ?? null;
		} catch {
			localStorage.removeItem(key);
			return null;
		}
	}

	static async delete(key: string): Promise<void> {
		localStorage.removeItem(key);
	}
}
