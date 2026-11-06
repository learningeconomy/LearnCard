import { TRPCError } from '@trpc/server';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';
import {
    clearStateStudentIdIfUnchanged,
    findClassLinkIdentitiesByPrimaryDids,
    findClassLinkIdentitiesBySubjects,
    getClassLinkIdentitiesCollection,
    setClassLinkIdentityPrimaryDid,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { hasExpiredStateStudentId } from '@helpers/classlinkPii.helpers';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import { maybeClearExpiredStateStudentIds } from '@helpers/classlinkCleanup.helpers';
import type { ClassLinkTenantConfig } from 'types/classlink';

/**
 * - `student` / `not_student`: the DID's account was found and checked.
 * - `no_account`: no UserKey holds the DID yet (e.g. a new wallet whose keys are still being
 *   stored). Not a student today, but it may become one as soon as the account exists, so
 *   callers must not cache this answer.
 * - `unknown`: the lookup failed.
 */
export type ClassLinkStudentStatus = 'student' | 'not_student' | 'no_account' | 'unknown';

type AccountKey = Pick<MongoUserKeyType, 'authProviders' | 'primaryDid' | 'linkedDids'>;

const byCreatedAt = (a: MongoClassLinkIdentityType, b: MongoClassLinkIdentityType): number =>
    (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0);

/** The wallet DIDs that belong to an account. */
export const getAccountDids = (userKey: Pick<MongoUserKeyType, 'primaryDid' | 'linkedDids'>) =>
    [userKey.primaryDid, ...(userKey.linkedDids ?? [])].filter(
        (did): did is string => typeof did === 'string' && did.length > 0
    );

/**
 * Every ClassLink identity linked to an account, in a deterministic order:
 *
 * 1. its Firebase providers (`identity.firebaseUid`), the link made at sign-in/connect;
 * 2. its Keycloak providers (`identity.subject`). This matches only when the Keycloak user
 *    id equals the person's AuthSubject subject; provisioned Keycloak users get their own
 *    ids (the subject is the `lca-api` federated-identity `userId`), so step 3 is what keeps
 *    those accounts linked after cutover;
 * 3. the account's DIDs (`identity.primaryDid`), recorded whenever an identity is resolved
 *    for an authenticated DID, which survives a recovery rebind that drops the Firebase
 *    provider.
 *
 * Within each step, older identities come first.
 */
export const findClassLinkIdentitiesForAccount = async (
    userKey: AccountKey
): Promise<MongoClassLinkIdentityType[]> => {
    const providers = userKey.authProviders ?? [];
    const firebaseUids = providers.filter(p => p.type === 'firebase').map(p => p.id);
    const keycloakIds = providers.filter(p => p.type === 'keycloak').map(p => p.id);
    const [byFirebase, byKeycloak, byDid] = await Promise.all([
        firebaseUids.length
            ? getClassLinkIdentitiesCollection()
                  .find({ firebaseUid: { $in: firebaseUids } })
                  .toArray()
            : Promise.resolve([]),
        findClassLinkIdentitiesBySubjects(keycloakIds),
        findClassLinkIdentitiesByPrimaryDids(getAccountDids(userKey)),
    ]);
    const found = new Map<string, MongoClassLinkIdentityType>();
    for (const group of [byFirebase, byKeycloak, byDid])
        for (const identity of [...group].sort(byCreatedAt))
            if (!found.has(identity.identityKey)) found.set(identity.identityKey, identity);
    return [...found.values()];
};

/** The account's ClassLink identity (see `findClassLinkIdentitiesForAccount`), or null. */
export const findClassLinkIdentityForAccount = async (
    userKey: AccountKey
): Promise<MongoClassLinkIdentityType | null> =>
    (await findClassLinkIdentitiesForAccount(userKey))[0] ?? null;

/**
 * Record the account's primary DID on an identity so the link survives provider changes.
 * Best effort: a failure is logged (no values) and retried on the next resolution.
 */
export const recordClassLinkIdentityDid = async (
    identity: Pick<MongoClassLinkIdentityType, 'identityKey' | 'primaryDid'>,
    userKey: Pick<MongoUserKeyType, 'primaryDid'>
): Promise<void> => {
    if (!userKey.primaryDid || identity.primaryDid === userKey.primaryDid) return;
    await setClassLinkIdentityPrimaryDid(identity.identityKey, userKey.primaryDid).catch(() =>
        console.warn('classlink.identity.did_backfill_failed')
    );
};

/** Whether the DID belongs to a ClassLink student. Lookup failures return 'unknown'. */
export const getClassLinkStudentStatus = async (did: string): Promise<ClassLinkStudentStatus> => {
    try {
        const userKey = await findUserKeyByDid(did);
        if (!userKey) return 'no_account';
        const identities = await findClassLinkIdentitiesForAccount(userKey);
        if (!identities.length) return 'not_student';
        await Promise.all(
            identities.map(identity => recordClassLinkIdentityDid(identity, userKey))
        );
        // Any student identity locks the account, so a second link can never unlock it.
        return identities.some(identity => identity.isMinorHint === true)
            ? 'student'
            : 'not_student';
    } catch {
        console.warn('classlink.student_lookup.failed');
        return 'unknown';
    }
};

/**
 * True when the DID belongs to a ClassLink student. Fails safe: a lookup error counts as a
 * student, so a failure can never unlock student privacy settings.
 */
export const isClassLinkStudentDid = async (did: string): Promise<boolean> => {
    const status = await getClassLinkStudentStatus(did);
    return status === 'student' || status === 'unknown';
};

export interface ClassLinkContext {
    userKey: MongoUserKeyType;
    /** The Firebase uid the identity was created for (`identity.firebaseUid`). */
    firebaseUid: string;
    identity: MongoClassLinkIdentityType;
    tenant: ClassLinkTenantConfig | undefined;
}

/** Resolve account ownership from the authenticated DID, never a client-supplied identity. */
export const resolveClassLinkContext = async (did: string): Promise<ClassLinkContext> => {
    const userKey = await findUserKeyByDid(did);
    if (!userKey) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Finish setting up your account first.',
        });
    }
    const identity = await findClassLinkIdentityForAccount(userKey);
    if (!identity) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Sign in with ClassLink to request your transcript.',
        });
    }
    await recordClassLinkIdentityDid(identity, userKey);
    if (hasExpiredStateStudentId(identity)) {
        // Readers already ignore expired IDs, so a failed clear is retried by the sweep.
        await clearStateStudentIdIfUnchanged(identity).catch(() =>
            console.warn('classlink.pii.clear_failed')
        );
    }
    await maybeClearExpiredStateStudentIds();
    const config = getClassLinkConfig();
    const tenant = config ? getClassLinkTenant(config, identity.tenantId) : undefined;
    return { userKey, firebaseUid: identity.firebaseUid, identity, tenant };
};
