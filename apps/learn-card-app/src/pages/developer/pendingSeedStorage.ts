/**
 * sessionStorage key the developer sign-in page uses to carry a seed across its
 * "sign out and switch" reload. The logout callback in AuthCoordinatorProvider
 * clears sessionStorage, so it must explicitly preserve this key.
 */
export const PENDING_SEED_STORAGE_KEY = 'lc:developer-sign-in:pending-seed';
