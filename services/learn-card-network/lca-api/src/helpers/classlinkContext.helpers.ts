import { TRPCError } from '@trpc/server';
import type { Filter } from 'mongodb';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';
import {
    clearStateStudentIdIfUnchanged,
    findClassLinkIdentitiesByPrimaryDids,
    findClassLinkIdentitiesBySubjects,
    getClassLinkIdentitiesCollection,
    setClassLinkIdentityPrimaryDid,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { getTranscriptRequestsCollection } from '../models/TranscriptRequest';
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

export interface AccountClassLinkIdentities {
    /** Identities the account owns, in the order described on `findClassLinkIdentitiesForAccount`. */
    identities: MongoClassLinkIdentityType[];
    /**
     * Identities that matched only by a Firebase uid or Keycloak subject while their recorded
     * DID belongs to a different live account (e.g. a fresh wallet made for a uid that a
     * recovery rebind or "Secure my account" removed from its owner). They grant nothing.
     */
    heldElsewhere: MongoClassLinkIdentityType[];
}

/**
 * Whether an identity matched by uid/subject is owned by another live account: its recorded
 * DID is not one of this account's DIDs and some account still holds it.
 */
const isHeldByOtherAccount = async (
    identity: MongoClassLinkIdentityType,
    accountDids: string[]
): Promise<boolean> => {
    const recorded = identity.primaryDid;
    if (!recorded || accountDids.includes(recorded)) return false;
    return Boolean(await findUserKeyByDid(recorded));
};

/** See `findClassLinkIdentitiesForAccount`; also returns the matches held elsewhere. */
export const matchClassLinkIdentitiesForAccount = async (
    userKey: AccountKey
): Promise<AccountClassLinkIdentities> => {
    const providers = userKey.authProviders ?? [];
    const firebaseUids = providers.filter(p => p.type === 'firebase').map(p => p.id);
    const keycloakIds = providers.filter(p => p.type === 'keycloak').map(p => p.id);
    const accountDids = getAccountDids(userKey);
    const [byFirebase, byKeycloak, byDid] = await Promise.all([
        firebaseUids.length
            ? getClassLinkIdentitiesCollection()
                  .find({ firebaseUid: { $in: firebaseUids } })
                  .toArray()
            : Promise.resolve([]),
        findClassLinkIdentitiesBySubjects(keycloakIds),
        findClassLinkIdentitiesByPrimaryDids(accountDids),
    ]);
    const found = new Map<string, MongoClassLinkIdentityType>();
    for (const group of [byFirebase, byKeycloak, byDid])
        for (const identity of [...group].sort(byCreatedAt))
            if (!found.has(identity.identityKey)) found.set(identity.identityKey, identity);
    const all = [...found.values()];
    // Lookup errors propagate: callers fail closed (no access, privacy lock kept).
    const held = await Promise.all(all.map(item => isHeldByOtherAccount(item, accountDids)));
    return {
        identities: all.filter((_, index) => !held[index]),
        heldElsewhere: all.filter((_, index) => held[index]),
    };
};

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
 * Within each step, older identities come first. A uid/subject match whose recorded DID
 * belongs to a different live account is left out (see `matchClassLinkIdentitiesForAccount`):
 * after a recovery rebind or revoke, a fresh wallet made for the stale Firebase uid must not
 * reach the owner's school data. School Connect from the owner is the way to move an identity.
 */
export const findClassLinkIdentitiesForAccount = async (
    userKey: AccountKey
): Promise<MongoClassLinkIdentityType[]> =>
    (await matchClassLinkIdentitiesForAccount(userKey)).identities;

/**
 * The Firebase uids that may prove ownership of ClassLink-era records (e.g. transcript
 * requests): the account's Firebase providers and its owned identities' uids, except a uid
 * that another live account owns.
 * A uid is foreign when
 *
 * - it only belongs to an identity held by another live account, or
 * - a transcript request stored under it records a DID (`primaryDid` or `did`) that another
 *   live account holds. This covers the history left on a stale uid after its owner re-links
 *   from School Connect: the identity then moves to the owner's new uid, so the first check
 *   no longer sees the stale uid, but the owner's requests still carry it.
 *
 * Lookup errors propagate, so callers fail closed.
 */
export const getOwningFirebaseUids = async (
    userKey: Pick<MongoUserKeyType, 'authProviders' | 'primaryDid' | 'linkedDids'>,
    { identities, heldElsewhere }: AccountClassLinkIdentities
): Promise<string[]> => {
    const owned = new Set(identities.map(identity => identity.firebaseUid));
    const foreign = new Set(
        heldElsewhere.map(identity => identity.firebaseUid).filter(uid => !owned.has(uid))
    );
    // The owned identities' uids are candidates too (after a recovery rebind the identity
    // keeps the old uid while the account has a new one), but they get exactly the same
    // foreign check: an identity this account owns can carry a uid whose history belongs
    // to another live account (e.g. School Connect from a stale-uid wallet stores that uid).
    const candidates = [
        ...new Set([
            ...(userKey.authProviders ?? [])
                .filter(provider => provider.type === 'firebase')
                .map(provider => provider.id),
            ...identities.map(identity => identity.firebaseUid),
        ]),
    ].filter(uid => Boolean(uid) && !foreign.has(uid));
    if (candidates.length === 0) return [];

    const accountDids = getAccountDids(userKey);
    const rows = await getTranscriptRequestsCollection()
        .find(
            {
                firebaseUid: { $in: candidates },
                $or: [
                    { primaryDid: { $exists: true, $nin: accountDids } },
                    { did: { $nin: accountDids } },
                ],
            },
            { projection: { firebaseUid: 1, primaryDid: 1, did: 1 } }
        )
        .toArray();
    const liveElsewhere = new Map<string, Promise<boolean>>();
    const isLiveElsewhere = (did: string): Promise<boolean> => {
        if (!liveElsewhere.has(did))
            liveElsewhere.set(
                did,
                findUserKeyByDid(did).then(holder => Boolean(holder))
            );
        return liveElsewhere.get(did)!;
    };
    for (const row of rows) {
        if (foreign.has(row.firebaseUid)) continue;
        const dids = [row.primaryDid, row.did].filter(
            (did): did is string => Boolean(did) && !accountDids.includes(did as string)
        );
        for (const did of dids)
            if (await isLiveElsewhere(did)) {
                foreign.add(row.firebaseUid);
                break;
            }
    }
    return candidates.filter(uid => !foreign.has(uid));
};

/** The account's ClassLink identity (see `findClassLinkIdentitiesForAccount`), or null. */
export const findClassLinkIdentityForAccount = async (
    userKey: AccountKey
): Promise<MongoClassLinkIdentityType | null> =>
    (await findClassLinkIdentitiesForAccount(userKey))[0] ?? null;

/**
 * Record the account's primary DID on an identity so the link survives provider changes.
 *
 * An unset DID is filled. A recorded DID is replaced only when no account holds it any more,
 * or when it belongs to this same account (e.g. its primary DID changed). While another
 * account still holds it, that account keeps the identity: an account that matches only by a
 * stale Firebase uid (e.g. a fresh wallet made for the old uid after a recovery rebind) must
 * not take it over. School Connect is the explicit way to move an identity.
 *
 * Best effort: a failure is logged (no values) and retried on the next resolution.
 */
export const recordClassLinkIdentityDid = async (
    identity: Pick<MongoClassLinkIdentityType, 'identityKey' | 'primaryDid'>,
    userKey: Pick<MongoUserKeyType, 'primaryDid'>
): Promise<void> => {
    const did = userKey.primaryDid;
    const recorded = identity.primaryDid;
    if (!did || recorded === did) return;
    try {
        if (!recorded) {
            await setClassLinkIdentityPrimaryDid(identity.identityKey, did);
            return;
        }
        const holder = await findUserKeyByDid(recorded);
        if (holder && !getAccountDids(holder).includes(did)) {
            console.warn('classlink.identity.did_kept');
            return;
        }
        await setClassLinkIdentityPrimaryDid(identity.identityKey, did, { replace: recorded });
    } catch {
        console.warn('classlink.identity.did_backfill_failed');
    }
};

/** Whether the DID belongs to a ClassLink student. Lookup failures return 'unknown'. */
export const getClassLinkStudentStatus = async (did: string): Promise<ClassLinkStudentStatus> => {
    try {
        const userKey = await findUserKeyByDid(did);
        if (!userKey) return 'no_account';
        const { identities, heldElsewhere } = await matchClassLinkIdentitiesForAccount(userKey);
        await Promise.all(
            identities.map(identity => recordClassLinkIdentityDid(identity, userKey))
        );
        // Any student identity locks the account, so a second link can never unlock it. An
        // identity held by another account grants no access, but it still marks the same
        // person (same sign-in) as a student: a fresh wallet made for the owner's old uid
        // stays locked rather than escaping the lock.
        return [...identities, ...heldElsewhere].some(identity => identity.isMinorHint === true)
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
    /**
     * Firebase uids that prove ownership of the account's ClassLink-era records: the
     * account's and its identities' uids, minus any whose history another live account owns
     * (see `getOwningFirebaseUids`).
     */
    ownerFirebaseUids: string[];
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
    const matched = await matchClassLinkIdentitiesForAccount(userKey);
    const identity = matched.identities[0];
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
    return {
        userKey,
        firebaseUid: identity.firebaseUid,
        identity,
        tenant,
        // Never re-add identity.firebaseUid here: getOwningFirebaseUids already considers it
        // and may have excluded it as another live account's history.
        ownerFirebaseUids: await getOwningFirebaseUids(userKey, matched),
    };
};

/**
 * Record the account's DID on its ClassLink identities that do not have one yet (fill-only).
 * Called before a recovery rebind or "Secure my account" removes a Firebase login, so a later
 * wallet created with that stale uid is recognised as not owning the identity (see
 * `findClassLinkIdentitiesForAccount`). This can be the identity's first DID binding, so it
 * must be durable before the login is removed: a failure throws, and the key operation must
 * not proceed. The rebind pins before it spends the recovery token, so the same token can be
 * retried.
 */
export const pinClassLinkIdentitiesToAccount = async (
    userKey: Pick<MongoUserKeyType, 'authProviders' | 'primaryDid'>
): Promise<void> => {
    const did = userKey.primaryDid;
    const uids = (userKey.authProviders ?? [])
        .filter(provider => provider.type === 'firebase' && provider.id)
        .map(provider => provider.id);
    if (!did || !uids.length) return;
    try {
        await getClassLinkIdentitiesCollection().updateMany(
            {
                firebaseUid: { $in: uids },
                $or: [{ primaryDid: { $exists: false } }, { primaryDid: null }],
            } as Filter<MongoClassLinkIdentityType>,
            { $set: { primaryDid: did, updatedAt: new Date() } }
        );
    } catch {
        // Log no values; the cause may carry identifiers.
        console.error('classlink.identity.pin_failed');
        throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Your account could not be updated right now. Please try again.',
        });
    }
};
