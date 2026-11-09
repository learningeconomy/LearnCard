import cache from '@cache';
import { resolveAccountDid } from '@helpers/accountDid.helpers';
import { getClassLinkStudentStatus } from '@helpers/classlinkContext.helpers';
import { isPrivacyLocked, type MongoPreferencesType } from '../../models/Preferences';

/**
 * Where a DID's preferences stand relative to the privacy lock:
 * - `locked`: the stored record already carries a server-owned lock.
 * - `student`: no lock yet, but the DID belongs to a ClassLink student; the caller must lock it.
 * - `unlocked`: no lock applies (not a ClassLink student, or no account holds the DID yet).
 * - `unknown`: account resolution or the student lookup failed; callers must fail safe.
 */
export type PrivacyLockState = 'locked' | 'student' | 'unlocked' | 'unknown';

/** How long a "not a ClassLink student" answer is reused before looking it up again. */
export const NOT_STUDENT_CACHE_TTL_SECS = 5 * 60;

const NOT_STUDENT = 'not_student';

export const getNotStudentCacheKey = (did: string): string => `classlink-not-student|${did}`;

const isCachedNotStudent = async (did: string): Promise<boolean> => {
    try {
        return (await cache.get(getNotStudentCacheKey(did))) === NOT_STUDENT;
    } catch {
        return false;
    }
};

const cacheNotStudent = async (did: string): Promise<void> => {
    try {
        await cache.set(getNotStudentCacheKey(did), NOT_STUDENT, NOT_STUDENT_CACHE_TTL_SECS);
    } catch {
        // Caching is an optimisation only; the next request looks it up again.
    }
};

/**
 * Forget a cached "not a ClassLink student" answer for an account DID. Call this when an account gains a
 * ClassLink identity outside a path that already locks its preferences.
 */
export const clearNotStudentCache = async (did: string): Promise<void> => {
    try {
        await cache.delete([getNotStudentCacheKey(did)]);
    } catch {
        // The entry expires on its own within NOT_STUDENT_CACHE_TTL_SECS.
    }
};

/**
 * Decide whether a DID's preferences are privacy locked. Never writes preferences.
 *
 * A stored lock wins without any lookup. Otherwise resolve the caller to its account DID
 * using the verified request's owner key, then look up ClassLink student status,
 * whatever the current ClassLink configuration: a student's identity outlives a missing or
 * invalid config, and a failure never unlocks a student. A "not a student" answer for an
 * existing account is cached briefly under the resolved account DID, not the caller DID; a DID
 * with no account yet is never cached, because a new ClassLink student's wallet has no UserKey
 * until key storage finishes. Resolution errors return unknown; preferences remain keyed
 * by the caller DID and this helper never changes their storage key.
 */
export const getPrivacyLockState = async (
    did: string,
    stored: MongoPreferencesType | null | undefined,
    authorizationHeader?: string
): Promise<PrivacyLockState> => {
    if (isPrivacyLocked(stored)) return 'locked';
    let accountDid: string;
    try {
        accountDid = await resolveAccountDid(did, authorizationHeader, { strict: true });
    } catch {
        return 'unknown';
    }
    if (await isCachedNotStudent(accountDid)) return 'unlocked';

    const status = await getClassLinkStudentStatus(accountDid);
    if (status === 'student') return 'student';
    if (status === 'unknown') return 'unknown';
    if (status === 'no_account') return 'unlocked';

    await cacheNotStudent(accountDid);
    return 'unlocked';
};
