import { APP_IDENTITY_KEY } from './configuration';

export function setupAppIdentity() {
    const appId = localStorage.getItem(APP_IDENTITY_KEY) ?? null;
    if(!appId) {
        const newAppId = crypto.randomUUID();
        localStorage.setItem(APP_IDENTITY_KEY, newAppId);
    }
}