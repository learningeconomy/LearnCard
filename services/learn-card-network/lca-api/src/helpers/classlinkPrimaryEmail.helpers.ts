import { createHash, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type admin from 'firebase-admin';

import cache from '@cache';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import { getAccountDids } from '@helpers/classlinkContext.helpers';
import { firebaseErrorCode } from '@helpers/classlinkFirebaseUser.helpers';
import { isSyntheticEmail, syntheticEmailForUid } from '@helpers/syntheticEmail.helpers';
import { getAdminAuth, type AdminAuth } from '@helpers/firebaseAdminAuth.helpers';
import { DEFAULT_SCHOOL_EMAIL_ALIAS_MAX_IDLE_DAYS } from 'types/classlink';
import { findAuthSubjectByIdentityKey } from '../models/AuthSubject';
import {
    ensureClassLinkIdentityIndexes,
    getClassLinkIdentitiesCollection,
    type ClassLinkPrimaryEmail,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import {
    findUserKeyByAuthProvider,
    findUserKeyByContactMethod,
    findUserKeyByDid,
    setContactMethodIfUnchanged,
    type ContactMethod,
    type MongoUserKeyType,
} from '../models/UserKey';

/**
 * A verified personal email becomes the sign-in email of a ClassLink account (LC-2409).
 *
 * T is `identity.firebaseUid`, the Firebase user ClassLink sign-in mints tokens for. Promotion
 * makes the personal address T's Firebase email and the account's `contactMethod`, recording
 * the previous values on `identity.primaryEmail` so a demote restores them exactly. The school
 * email keeps signing in through `resolveClassLinkAliasUid` while the alias rules hold.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const normalize = (email: string | null | undefined): string | undefined =>
    email?.trim().toLowerCase() || undefined;

const conflict = (): never => {
    throw new TRPCError({
        code: 'CONFLICT',
        message: 'This email is already used by another account.',
    });
};

const isUserNotFound = (error: unknown): boolean =>
    firebaseErrorCode(error) === 'auth/user-not-found';

/** T's user record, or undefined when it does not exist. */
export const getFirebaseUserOrUndefined = (
    auth: AdminAuth,
    uid: string
): Promise<admin.auth.UserRecord | undefined> =>
    auth.getUser(uid).catch((error: unknown) => {
        if (isUserNotFound(error)) return undefined;
        throw error;
    });

const getFirebaseUserByEmailOrUndefined = (
    auth: AdminAuth,
    email: string
): Promise<admin.auth.UserRecord | undefined> =>
    auth.getUserByEmail(email).catch((error: unknown) => {
        if (isUserNotFound(error)) return undefined;
        throw error;
    });

const hasFirebaseProvider = (
    userKey: Pick<MongoUserKeyType, 'authProviders'> | null | undefined,
    uid: string
): boolean =>
    (userKey?.authProviders ?? []).some(
        provider => provider.type === 'firebase' && provider.id === uid
    );

// ---------------------------------------------------------------------------------------
// Per-account lock
// ---------------------------------------------------------------------------------------

/** Longest a sign-in email change may hold the per-account lock (safety expiry). */
export const EMAIL_CHANGE_LOCK_SECONDS = 120;
const RELEASE_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0
`;

const getRedis = () => cache.redis ?? cache.node;

export interface EmailChangeLock {
    /**
     * Fencing: throws `PRECONDITION_FAILED` unless this call still holds the lock. Call before
     * each write step, so a change that outlived the lock stops and its retry converges.
     */
    assertHeld: () => Promise<void>;
}

const lockBusy = (): never => {
    throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Another change to your email is in progress. Please try again.',
        cause: { reason: 'busy' },
    });
};

/**
 * Run a sign-in email change while holding a per-account Redis lock, so verify, remove and
 * every demote (School Connect, rebind, revoke, reconcile) never interleave. `accountKey` is
 * the account's `primaryDid`. Fails closed: when the lock is held or Redis is down, nothing
 * is written and the caller is asked to retry (`PRECONDITION_FAILED`, reason `busy`).
 */
export const withEmailChangeLock = async <T>(
    accountKey: string,
    fn: (lock: EmailChangeLock) => Promise<T>
): Promise<T> => {
    const key = `classlink:lock:personal-email:${createHash('sha256')
        .update(accountKey)
        .digest('hex')}`;
    const token = randomUUID();
    let acquired: unknown;
    try {
        acquired = await getRedis().set(key, token, 'EX', EMAIL_CHANGE_LOCK_SECONDS, 'NX');
    } catch {
        lockBusy();
    }
    if (!acquired) lockBusy();
    const lock: EmailChangeLock = {
        assertHeld: async () => {
            let holder: unknown;
            try {
                holder = await getRedis().get(key);
            } catch {
                holder = undefined;
            }
            if (holder !== token) lockBusy();
        },
    };
    try {
        return await fn(lock);
    } finally {
        await getRedis()
            .eval(RELEASE_LOCK, 1, key, token)
            .catch(() => undefined);
    }
};

/** The lock key for the account a DID belongs to (its `primaryDid`, else the DID). */
export const getEmailChangeLockKey = async (did: string): Promise<string> =>
    (await findUserKeyByDid(did))?.primaryDid ?? did;

// ---------------------------------------------------------------------------------------
// School email trust and alias limits
// ---------------------------------------------------------------------------------------

type IdentitySchool = Pick<MongoClassLinkIdentityType, 'tenantId' | 'email' | 'lastAuthTime'>;

const getTenant = (tenantId: string) => {
    const config = getClassLinkConfig();
    return config ? getClassLinkTenant(config, tenantId) : undefined;
};

/** The sign-in trust rule (`classlink.ts`): the school email's domain is on the allowlist now. */
export const isTrustedSchoolEmail = (identity: IdentitySchool): boolean => {
    const email = normalize(identity.email);
    if (!email || isSyntheticEmail(email)) return false;
    const domain = email.split('@')[1];
    return Boolean(
        getTenant(identity.tenantId)?.allowedEmailDomains.some(
            allowed => allowed.toLowerCase() === domain
        )
    );
};

/** The district's `schoolEmailAliasMaxIdleDays` (default 365; 0 turns the alias off). */
export const getSchoolEmailAliasMaxIdleDays = (tenantId: string): number =>
    getTenant(tenantId)?.schoolEmailAliasMaxIdleDays ?? DEFAULT_SCHOOL_EMAIL_ALIAS_MAX_IDLE_DAYS;

/** Trusted domain, alias on for the district, and a ClassLink sign-in within the idle limit. */
export const isSchoolEmailAliasLive = (identity: IdentitySchool, now = new Date()): boolean => {
    if (!isTrustedSchoolEmail(identity)) return false;
    const days = getSchoolEmailAliasMaxIdleDays(identity.tenantId);
    const last = identity.lastAuthTime instanceof Date ? identity.lastAuthTime.getTime() : NaN;
    return days > 0 && Number.isFinite(last) && now.getTime() - last <= days * DAY_MS;
};

/** `isSchoolEmailAliasLive` plus an `email:<school>` sign-in subject linked to the identity. */
export const hasLiveSchoolEmailAlias = async (
    identity: IdentitySchool & Pick<MongoClassLinkIdentityType, 'subject'>,
    now = new Date()
): Promise<boolean> => {
    const school = normalize(identity.email);
    if (!school || !isSchoolEmailAliasLive(identity, now)) return false;
    const subject = await findAuthSubjectByIdentityKey(`email:${school}`);
    return Boolean(subject?.emailVerified && subject.subject === identity.subject);
};

/**
 * School addresses that also get the account's security notices (LC-2409): for each ClassLink
 * identity of the account with an active promotion, its school email under the same rules as
 * the sign-in alias (`hasLiveSchoolEmailAlias`: trusted domain, not idle, a verified
 * `email:<school>` subject linked to the identity; and exactly one identity with the address,
 * so a recycled school inbox hears nothing). Best effort: never throws, and never helps
 * against a compromised lca-api (it sends these itself).
 */
export const getSchoolNoticeRecipients = async (
    userKey: Pick<MongoUserKeyType, 'primaryDid' | 'linkedDids'> | null | undefined,
    now = new Date()
): Promise<string[]> => {
    try {
        if (!userKey?.primaryDid) return [];
        const identities = await getClassLinkIdentitiesCollection()
            .find({
                primaryDid: { $in: getAccountDids(userKey) },
                'primaryEmail.state': 'active',
            })
            .toArray();
        const recipients = new Set<string>();
        for (const identity of identities) {
            const school = normalize(identity.email);
            if (!school || !(await hasLiveSchoolEmailAlias(identity, now))) continue;
            const holders = await getClassLinkIdentitiesCollection()
                .find({ email: school }, { projection: { _id: 1 } })
                .limit(2)
                .toArray();
            if (holders.length === 1) recipients.add(school);
        }
        return [...recipients];
    } catch {
        console.warn('classlink.school_notice.lookup_failed');
        return [];
    }
};

// ---------------------------------------------------------------------------------------
// Plan, promote, demote
// ---------------------------------------------------------------------------------------

export type PrimaryEmailPlan =
    /** T (or another uid of the account) already signs in with a real email: alias only. */
    | { kind: 'own-email' }
    | {
          kind: 'primary';
          uid: string;
          email: string;
          prevFirebaseEmail: string | null;
          prevContactMethod?: ContactMethod;
          /** An empty email-code user holding the address, deleted at promote time. */
          reclaimUid?: string;
      };

/**
 * A Firebase user nobody depends on: no account, no ClassLink identity, and no linked
 * providers (it was made by an email-code login that never created a wallet).
 */
const isStrayFirebaseUser = async (user: admin.auth.UserRecord): Promise<boolean> =>
    (user.providerData ?? []).length === 0 &&
    !(await findUserKeyByAuthProvider('firebase', user.uid)) &&
    !(await getClassLinkIdentitiesCollection().findOne({ firebaseUid: user.uid }));

/**
 * Decide, after the code proof and before any write, whether `email` can become the sign-in
 * email of T (`identity.firebaseUid`). Throws `PRECONDITION_FAILED` (reason `account_moved`)
 * when T is not a login of the account, `CONFLICT` when another account uses the address.
 */
export const planPrimaryEmail = async ({
    auth,
    identity,
    userKey,
    email: rawEmail,
}: {
    auth: AdminAuth;
    identity: MongoClassLinkIdentityType;
    userKey: MongoUserKeyType;
    email: string;
}): Promise<PrimaryEmailPlan> => {
    const email = normalize(rawEmail) as string;
    const uid = identity.firebaseUid;
    const moved = () =>
        new TRPCError({
            code: 'PRECONDITION_FAILED',
            message:
                'Your school sign-in is not linked to this account any more. Reconnect it from School Connect.',
            cause: { reason: 'account_moved' },
        });
    if (!hasFirebaseProvider(userKey, uid)) throw moved();
    const user = await getFirebaseUserOrUndefined(auth, uid);
    if (!user) throw moved();
    const current = normalize(user.email);
    const replaceable =
        !current ||
        isSyntheticEmail(current) ||
        current === normalize(identity.email) ||
        current === normalize(identity.primaryEmail?.email) ||
        current === email;
    if (!replaceable) return { kind: 'own-email' };

    let reclaimUid: string | undefined;
    const holder = await getFirebaseUserByEmailOrUndefined(auth, email);
    if (holder && holder.uid !== uid) {
        if (hasFirebaseProvider(userKey, holder.uid)) return { kind: 'own-email' };
        if (await isStrayFirebaseUser(holder)) reclaimUid = holder.uid;
        else conflict();
    }
    const contactHolder = await findUserKeyByContactMethod({ type: 'email', value: email });
    if (contactHolder && String(contactHolder._id) !== String(userKey._id)) conflict();

    return {
        kind: 'primary',
        uid,
        email,
        prevFirebaseEmail: user.email ?? null,
        ...(userKey.contactMethod ? { prevContactMethod: userKey.contactMethod } : {}),
        ...(reclaimUid ? { reclaimUid } : {}),
    };
};

/**
 * Write the pending marker, then make the address T's Firebase email. Keeps the `prev*`
 * values of an earlier record for the same uid, so changing the address still restores the
 * original on demote. Returns the pending record, the record it replaced (for rollback) and
 * whether Firebase changed (T's sessions were revoked).
 */
export const promotePersonalEmail = async ({
    auth,
    identity,
    plan,
    lock,
}: {
    auth: AdminAuth;
    identity: MongoClassLinkIdentityType;
    plan: Extract<PrimaryEmailPlan, { kind: 'primary' }>;
    lock: EmailChangeLock;
}): Promise<{
    record: ClassLinkPrimaryEmail;
    previous?: ClassLinkPrimaryEmail;
    firebaseChanged: boolean;
}> => {
    let previous = identity.primaryEmail;
    if (previous && previous.uid !== plan.uid) {
        // A record left on another uid: put that uid back first.
        await demotePersonalEmail({ auth, identity, reason: 'uid_changed', lock });
        previous = undefined;
    }
    const record: ClassLinkPrimaryEmail = {
        email: plan.email,
        uid: plan.uid,
        prevFirebaseEmail: previous ? previous.prevFirebaseEmail : plan.prevFirebaseEmail,
        ...((previous ? previous.prevContactMethod : plan.prevContactMethod)
            ? {
                  prevContactMethod: (previous
                      ? previous.prevContactMethod
                      : plan.prevContactMethod) as ContactMethod,
              }
            : {}),
        state: 'pending',
        at: new Date(),
    };
    await lock.assertHeld();
    await ensureClassLinkIdentityIndexes();
    await getClassLinkIdentitiesCollection().updateOne(
        { identityKey: identity.identityKey },
        { $set: { primaryEmail: record, updatedAt: new Date() } }
    );

    if (plan.reclaimUid) {
        await lock.assertHeld();
        const stray = await getFirebaseUserOrUndefined(auth, plan.reclaimUid);
        if (stray) {
            if (normalize(stray.email) !== plan.email || !(await isStrayFirebaseUser(stray)))
                conflict();
            await auth.deleteUser(plan.reclaimUid);
            console.info('classlink.primary_email.stray_reclaimed');
        }
    }

    let firebaseChanged = false;
    const user = await getFirebaseUserOrUndefined(auth, plan.uid);
    if (normalize(user?.email) !== plan.email) {
        await lock.assertHeld();
        try {
            await auth.updateUser(plan.uid, { email: plan.email, emailVerified: true });
        } catch (error) {
            if (firebaseErrorCode(error) === 'auth/email-already-exists') conflict();
            throw error;
        }
        firebaseChanged = true;
    }
    // Firebase has no compare-and-set: re-read to make sure the write is the one that stuck.
    const after = await getFirebaseUserOrUndefined(auth, plan.uid);
    if (normalize(after?.email) !== plan.email) conflict();
    return { record, ...(previous ? { previous } : {}), firebaseChanged };
};

/**
 * Undo a failed promote's marker: restore the record it replaced, or remove it. Only while
 * the stored record is still the one this call wrote.
 */
export const rollbackPrimaryEmailRecord = async (
    identityKey: string,
    record: Pick<ClassLinkPrimaryEmail, 'email' | 'uid' | 'at'>,
    previous?: ClassLinkPrimaryEmail
): Promise<void> => {
    await getClassLinkIdentitiesCollection().updateOne(
        {
            identityKey,
            'primaryEmail.email': record.email,
            'primaryEmail.uid': record.uid,
            'primaryEmail.at': record.at,
        },
        previous
            ? { $set: { primaryEmail: previous, updatedAt: new Date() } }
            : { $unset: { primaryEmail: '' }, $set: { updatedAt: new Date() } }
    );
};

/** The Firebase email demote puts back on T (see `demotePersonalEmail`). */
const resolveRestoredEmail = async (
    auth: AdminAuth,
    identity: MongoClassLinkIdentityType,
    record: ClassLinkPrimaryEmail
): Promise<{ email: string; emailVerified: boolean }> => {
    const synthetic = { email: syntheticEmailForUid(record.uid), emailVerified: false };
    const previous = normalize(record.prevFirebaseEmail);
    // Firebase Admin cannot remove an email: an empty previous email becomes the reserved,
    // undeliverable synthetic address (the contact method is restored exactly).
    if (!previous || isSyntheticEmail(previous)) return synthetic;
    const holder = await getFirebaseUserByEmailOrUndefined(auth, previous);
    if (holder && holder.uid !== record.uid) return synthetic;
    if (previous === normalize(identity.email) && !isTrustedSchoolEmail(identity)) return synthetic;
    return { email: previous, emailVerified: true };
};

/**
 * Put T back exactly as it was before the promotion, then clear `primaryEmail` and
 * `demotePending`. Each step is idempotent and only acts while T / the contact still hold the
 * personal address, so a retry converges. Returns a custom token for T when T is still a
 * login of the account and its Firebase email changed (the change revoked T's sessions).
 * Without Firebase Admin, the Firebase step is skipped and the record is kept as
 * `demotePending`, so the reconcile retries it.
 */
export const demotePersonalEmail = async ({
    auth,
    identity,
    userKey,
    reason,
    lock,
}: {
    auth: AdminAuth | undefined;
    identity: MongoClassLinkIdentityType;
    userKey?: MongoUserKeyType | null;
    reason: string;
    lock?: EmailChangeLock;
}): Promise<{ customToken?: string }> => {
    const record = identity.primaryEmail;
    if (!record) {
        if (identity.demotePending)
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey: identity.identityKey },
                { $unset: { demotePending: '' } }
            );
        return {};
    }
    if (!auth) {
        await markDemotePending(identity.identityKey, `${reason}:no_admin`);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Your email could not be changed right now. Please try again.',
        });
    }
    let firebaseChanged = false;
    const user = await getFirebaseUserOrUndefined(auth, record.uid);
    if (user && normalize(user.email) === record.email) {
        const restored = await resolveRestoredEmail(auth, identity, record);
        await lock?.assertHeld();
        await auth.updateUser(record.uid, restored);
        firebaseChanged = true;
    }

    const account =
        userKey ??
        (await findUserKeyByAuthProvider('firebase', record.uid)) ??
        (identity.primaryDid ? await findUserKeyByDid(identity.primaryDid) : null);
    if (account?._id && record.prevContactMethod) {
        await lock?.assertHeld();
        await setContactMethodIfUnchanged(
            account._id,
            { type: 'email', value: record.email },
            record.prevContactMethod
        );
    }

    await lock?.assertHeld();
    await getClassLinkIdentitiesCollection().updateOne(
        { identityKey: identity.identityKey, 'primaryEmail.uid': record.uid },
        { $unset: { primaryEmail: '', demotePending: '' }, $set: { updatedAt: new Date() } }
    );
    console.info('classlink.primary_email.demoted', { reason });

    const live = account?._id ? await findUserKeyByDid(account.primaryDid) : null;
    if (!firebaseChanged || !hasFirebaseProvider(live, record.uid)) return {};
    return { customToken: await auth.createCustomToken(record.uid) };
};

/** Record a demote that could not run, for the reconcile and the login orphan guard. */
export const markDemotePending = async (identityKey: string, reason: string): Promise<void> => {
    await getClassLinkIdentitiesCollection().updateOne(
        { identityKey, primaryEmail: { $exists: true } },
        { $set: { demotePending: { reason, at: new Date() }, updatedAt: new Date() } }
    );
};

/**
 * After a rebind or revoke: demote every identity whose promoted uid is no longer a Firebase
 * login of the account. A busy lock or a failure sets `demotePending` (the reconcile and the
 * login orphan guard cover the gap). Never throws.
 */
export const demoteUnlinkedPrimaryEmails = async (
    accountDid: string,
    reason: string
): Promise<void> => {
    try {
        const userKey = await findUserKeyByDid(accountDid);
        const dids = userKey ? getAccountDids(userKey) : [accountDid];
        const identities = await getClassLinkIdentitiesCollection()
            .find({ primaryDid: { $in: dids }, primaryEmail: { $exists: true } })
            .toArray();
        const stale = identities.filter(
            identity => !hasFirebaseProvider(userKey, identity.primaryEmail!.uid)
        );
        if (!stale.length) return;
        const auth = getAdminAuth();
        const lockKey = userKey?.primaryDid ?? accountDid;
        for (const identity of stale) {
            try {
                await withEmailChangeLock(lockKey, async lock => {
                    const fresh = await getClassLinkIdentitiesCollection().findOne({
                        identityKey: identity.identityKey,
                    });
                    if (fresh?.primaryEmail)
                        await demotePersonalEmail({
                            auth,
                            identity: fresh,
                            userKey,
                            reason,
                            lock,
                        });
                });
            } catch {
                console.warn('classlink.primary_email.demote_deferred', { reason });
                await markDemotePending(identity.identityKey, reason).catch(() => undefined);
            }
        }
    } catch {
        console.error('classlink.primary_email.demote_failed', { reason });
    }
};

// ---------------------------------------------------------------------------------------
// Login-time resolution
// ---------------------------------------------------------------------------------------

/**
 * The uid a school email signs in to through the alias, `'moved'` when the identity's account
 * moved off that uid, or undefined when no alias applies. Requires a verified `email:<school>`
 * subject, exactly one identity with that email (school addresses can be recycled), a trusted
 * domain, an active promotion on the identity's own uid, its subject, and a ClassLink sign-in
 * within the district's idle limit.
 */
export const resolveClassLinkAliasUid = async (
    rawEmail: string,
    now = new Date()
): Promise<string | 'moved' | undefined> => {
    const email = normalize(rawEmail);
    if (!email || isSyntheticEmail(email)) return undefined;
    const subject = await findAuthSubjectByIdentityKey(`email:${email}`);
    if (!subject?.emailVerified) return undefined;
    const matches = await getClassLinkIdentitiesCollection().find({ email }).limit(2).toArray();
    if (matches.length !== 1) return undefined;
    const identity = matches[0]!;
    if (
        identity.subject !== subject.subject ||
        identity.primaryEmail?.state !== 'active' ||
        identity.primaryEmail.uid !== identity.firebaseUid ||
        !isSchoolEmailAliasLive(identity, now)
    )
        return undefined;
    if (identity.primaryDid) {
        const account = await findUserKeyByAuthProvider('firebase', identity.firebaseUid);
        if (!account || !getAccountDids(account).includes(identity.primaryDid)) {
            console.warn('classlink.alias.account_moved', { tenantId: identity.tenantId });
            return 'moved';
        }
    }
    console.info('classlink.alias.resolved', { tenantId: identity.tenantId });
    return identity.firebaseUid;
};

export type FirebaseUserResolution =
    | { status: 'found' | 'alias' | 'created'; uid: string }
    | { status: 'moved' | 'blocked' | 'missing' };

/**
 * The one server-side way to turn a sign-in email into a Firebase user (email-code login,
 * network hand-off, Keycloak bridge):
 *
 * 1. an existing user with the address wins, unless it is a promoted uid that no longer holds
 *    its identity's account (orphan guard: `'blocked'`, and the identity gets `demotePending`),
 *    or it never verified the address and a school-email alias resolves for it;
 * 2. otherwise the school-email alias (`resolveClassLinkAliasUid`), `'moved'` included;
 * 3. otherwise a new user when `allowCreate` (`create` overrides the request).
 */
export const resolveOrCreateFirebaseUserByEmail = async (
    auth: AdminAuth,
    rawEmail: string,
    { allowCreate, create }: { allowCreate: boolean; create?: admin.auth.CreateRequest } = {
        allowCreate: true,
    }
): Promise<FirebaseUserResolution> => {
    const email = normalize(rawEmail) as string;
    const found = await getFirebaseUserByEmailOrUndefined(auth, email);
    if (found) {
        const promoted = await getClassLinkIdentitiesCollection()
            .find({ 'primaryEmail.uid': found.uid, primaryDid: { $exists: true } })
            .toArray();
        if (promoted.length) {
            const account = await findUserKeyByAuthProvider('firebase', found.uid);
            const dids = account ? getAccountDids(account) : [];
            const orphaned = promoted.filter(
                identity => !dids.includes(identity.primaryDid as string)
            );
            if (orphaned.length) {
                console.warn('classlink.primary_email.orphan_blocked');
                await Promise.all(
                    orphaned.map(identity =>
                        markDemotePending(identity.identityKey, 'orphaned_login')
                    )
                );
                return { status: 'blocked' };
            }
        }
        // A user that holds the address without having verified it (e.g. one made by the
        // Keycloak bridge before it stopped writing unverified emails) never beats a live
        // school-email alias: the alias owner proved this inbox through ClassLink.
        if (!found.emailVerified) {
            const alias = await resolveClassLinkAliasUid(email);
            if (alias === 'moved') return { status: 'moved' };
            if (alias && alias !== found.uid) {
                console.warn('classlink.alias.unverified_holder');
                return { status: 'alias', uid: alias };
            }
        }
        return { status: 'found', uid: found.uid };
    }
    const alias = await resolveClassLinkAliasUid(email);
    if (alias === 'moved') return { status: 'moved' };
    if (alias) return { status: 'alias', uid: alias };
    if (!allowCreate) return { status: 'missing' };
    try {
        return { status: 'created', uid: (await auth.createUser(create ?? { email })).uid };
    } catch (error) {
        // A concurrent sign-in created it first.
        if (firebaseErrorCode(error) !== 'auth/email-already-exists') throw error;
        const raced = await getFirebaseUserByEmailOrUndefined(auth, email);
        if (!raced) throw error;
        return { status: 'found', uid: raced.uid };
    }
};
