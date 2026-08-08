// src/lib/utils/app-id.ts

export function setupAppIdentity(idKey: string) {
    const appId = localStorage.getItem(idKey) ?? null;
    if(!appId) {
        const newAppId = crypto.randomUUID();
        localStorage.setItem(idKey, newAppId);
    }
}