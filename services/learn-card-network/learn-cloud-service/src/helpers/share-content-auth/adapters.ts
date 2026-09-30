import type { PresentationVerificationResult, PresentationVerifier, ReplayStore } from './types';

/**
 * Thin, injectable adapters over the existing LearnCloud primitives.
 *
 * These are the seams the future service routes will wire. They are not
 * registered anywhere in this batch: no router, no server entrypoint, no
 * environment bootstrap.
 */

/** Minimal structural view of `getEmptyLearnCard()` for presentation verification. */
export type LearnCardLike = {
    invoke: {
        verifyPresentation: (
            token: string,
            options: { proofFormat: 'jwt' }
        ) => Promise<PresentationVerificationResult>;
    };
};

/**
 * Adapter for the existing DIDKit verification used by LearnCloud's context:
 * `learnCard.invoke.verifyPresentation(jwt, { proofFormat: 'jwt' })`.
 *
 * This adapter is intentionally not constructed at import time and is not
 * registered on any route in this batch.
 */
export const createDidkitPresentationVerifier = (
    getLearnCard: () => Promise<LearnCardLike>
): PresentationVerifier => {
    return async (token: string) => {
        const learnCard = await getLearnCard();

        return learnCard.invoke.verifyPresentation(token, { proofFormat: 'jwt' });
    };
};

/**
 * `SET key value NX EX ttl` style atomic primitive. Must resolve `true` only
 * when the key was absent and this call created it, and must throw when the
 * store is unavailable.
 */
export type SetIfAbsent = (key: string, ttlSeconds: number) => Promise<boolean>;

/** Adapt an atomic set-if-absent primitive (e.g. Redis) into a `ReplayStore`. */
export const createSetIfAbsentReplayStore = (setIfAbsent: SetIfAbsent): ReplayStore => ({
    consumeOnce: (key, ttlSeconds) => setIfAbsent(key, ttlSeconds),
});
