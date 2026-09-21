/**
 * sessionStorage key the developer sign-in page uses to carry a seed across its
 * "sign out and switch" reload. The logout callback in AuthCoordinatorProvider
 * clears sessionStorage, so it must explicitly preserve this key.
 */
export const PENDING_SEED_STORAGE_KEY = 'lc:developer-sign-in:pending-seed';

/** Reading during mount must survive a second mount before logout's hard reload. */
export const readPendingDeveloperSeed = (): string | null =>
    window.sessionStorage.getItem(PENDING_SEED_STORAGE_KEY);

/** Only clear the handoff after success, and never erase a newer account switch. */
export const consumePendingDeveloperSeed = (seed: string): void => {
    if (readPendingDeveloperSeed() === seed) {
        window.sessionStorage.removeItem(PENDING_SEED_STORAGE_KEY);
    }
};
