import { findAuthSubjectByIdentityKey, getAuthSubjectsCollection } from '../models/AuthSubject';
import {
    deleteClassLinkIdentitiesByIdentityKeys,
    getClassLinkIdentitiesCollection,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { CLASSLINK_PRIVACY_LOCK_SOURCE, clearPrivacyLocks } from '../models/Preferences';
import { deleteTranscriptRequestsForAccount } from '../models/TranscriptRequest';
import {
    findUserKeyByContactMethod,
    findUserKeyByDid,
    type MongoUserKeyType,
} from '../models/UserKey';
import {
    getAccountDids,
    getOwningFirebaseUids,
    matchClassLinkIdentitiesForAccount,
} from './classlinkContext.helpers';
import {
    demotePersonalEmail,
    markDemotePending,
    withEmailChangeLockRetry,
} from './classlinkPrimaryEmail.helpers';
import { getAdminAuth } from './firebaseAdminAuth.helpers';

export type ClassLinkDeletionAccount = Pick<
    MongoUserKeyType,
    'authProviders' | 'primaryDid' | 'linkedDids'
> &
    Partial<Pick<MongoUserKeyType, 'contactMethod'>>;

export interface ClassLinkDeletionResult {
    identities: number;
    transcriptRequests: number;
    authSubjects: number;
    /** Preferences records whose ClassLink privacy lock was removed. */
    privacyLocks: number;
}

/**
 * Whether `email:<address>` may be removed with the ClassLink data. It is kept when it is
 * (or may be) another sign-in for a live account: the account's own contact email, or any
 * account's contact email. Only a personal email that the personal-email flow linked to
 * this identity's subject, and that nothing else signs in with, is removed. Also used when
 * a student replaces their personal email, to release the old address.
 *
 * `accountDeleted`: the account itself is gone, so its (former) contact no longer signs in
 * and is not checked; any other account's contact still keeps the subject.
 */
export const canDeletePersonalEmailSubject = async (
    address: string,
    subject: string,
    account: ClassLinkDeletionAccount,
    { accountDeleted = false }: { accountDeleted?: boolean } = {}
): Promise<boolean> => {
    const record = await findAuthSubjectByIdentityKey(`email:${address}`);
    if (!record || record.subject !== subject) return false;
    const contact = account.contactMethod;
    if (
        !accountDeleted &&
        contact?.type === 'email' &&
        contact.value.trim().toLowerCase() === address
    )
        return false;
    return !(await findUserKeyByContactMethod({ type: 'email', value: address }));
};

/**
 * LC-2409: put each promoted identity's Firebase user (T) and the account's contact back
 * before the identity (and its `primaryEmail` record) is deleted, so T does not keep a minor's
 * personal address. A busy lock is retried briefly. Returns the identity keys that still could
 * not be demoted (busy lock, no Firebase Admin, Firebase error): those are kept, with
 * `demotePending`, so the orphan guard keeps blocking the address; the orphan guard's own
 * demote at the next login with the address, or `cleanupOrphanClassLinkData`, finishes it.
 */
const demoteBeforeDeletion = async (
    account: ClassLinkDeletionAccount,
    identities: MongoClassLinkIdentityType[],
    reason: string
): Promise<Set<string>> => {
    const failed = new Set<string>();
    const promoted = identities.filter(identity => identity.primaryEmail);
    if (!promoted.length) return failed;
    const auth = getAdminAuth();
    for (const identity of promoted) {
        try {
            // Retried briefly while busy: once the account is deleted no route can finish it.
            await withEmailChangeLockRetry(
                account.primaryDid || identity.primaryDid || identity.identityKey,
                async lock => {
                    const fresh = await getClassLinkIdentitiesCollection().findOne({
                        identityKey: identity.identityKey,
                    });
                    if (fresh?.primaryEmail)
                        await demotePersonalEmail({ auth, identity: fresh, reason, lock });
                }
            );
        } catch {
            failed.add(identity.identityKey);
            console.warn('classlink.primary_email.demote_deferred', { reason });
            await markDemotePending(identity.identityKey, reason).catch(() => undefined);
        }
    }
    return failed;
};

/**
 * Server-side cascade for deleting an account's ClassLink data. Removes every ClassLink
 * identity the account owns (by Firebase uid, Keycloak subject or recorded DID; never one whose
 * recorded DID belongs to another live account, see `findClassLinkIdentitiesForAccount`), the
 * `classlink:` AuthSubjects for those identities, the `email:` AuthSubject the
 * personal-email flow created (only when no account signs in with that address), the
 * account's transcript requests, and (with `clearPrivacyLock`, only when the account itself
 * has been deleted) the ClassLink-sourced privacy lock on the account's preferences. The
 * minor preference values are left as they are, so nothing is silently re-enabled.
 *
 * Deliberately kept: school-email `email:` subjects, which may be the user's existing
 * email-code sign-in, and Google/Apple subjects. Idempotent: a second call deletes nothing.
 *
 * LC-2409: a promoted personal email is demoted first (`demotePersonalEmail`, reason
 * `account_deleted` or `data_deleted`). An identity whose demote fails is kept for a retry.
 * On a live account the demote revokes T's sessions (its email changes back). `accountDeleted`
 * (the account's key is already gone) lets the personal `email:` subject go even though the
 * deleted account's contact was that address.
 */
export const deleteClassLinkDataForAccount = async (
    account: ClassLinkDeletionAccount,
    options: { clearPrivacyLock?: boolean; accountDeleted?: boolean } = {}
): Promise<ClassLinkDeletionResult> => {
    const matched = await matchClassLinkIdentitiesForAccount(account);
    // Orphaned matches (their recorded account was deleted and its cascade did not finish)
    // are removed too: no live account loses anything, and leaving them would keep a deleted
    // account's school data with nobody able to delete it.
    const candidates = [...matched.identities, ...matched.orphaned];
    const accountDeleted = options.accountDeleted ?? false;
    const deferred = await demoteBeforeDeletion(
        account,
        candidates,
        accountDeleted ? 'account_deleted' : 'data_deleted'
    );
    const identities = candidates.filter(identity => !deferred.has(identity.identityKey));
    // A demote on a live account restored its contact: check subjects against the fresh one.
    const demoted = identities.some(identity => identity.primaryEmail);
    const live =
        demoted && !accountDeleted && account.primaryDid
            ? await findUserKeyByDid(account.primaryDid)
            : null;
    const current: ClassLinkDeletionAccount = live
        ? { ...account, contactMethod: live.contactMethod }
        : account;
    let authSubjects = 0;
    for (const identity of identities) {
        const address = identity.personalEmail?.trim().toLowerCase();
        if (
            address &&
            (await canDeletePersonalEmailSubject(address, identity.subject, current, {
                accountDeleted,
            }))
        )
            authSubjects += (
                await getAuthSubjectsCollection().deleteOne({
                    identityKey: `email:${address}`,
                    subject: identity.subject,
                })
            ).deletedCount;
    }
    const identityKeys = identities.map(identity => identity.identityKey);
    if (identityKeys.length)
        authSubjects += (
            await getAuthSubjectsCollection().deleteMany({ identityKey: { $in: identityKeys } })
        ).deletedCount;

    // Includes the identities' uids unless another live account owns their history; never
    // re-add them here, or a stale-uid wallet could delete the owner's transcript rows.
    const firebaseUids = await getOwningFirebaseUids(account, matched);
    const dids = [
        ...getAccountDids(account),
        ...identities.map(identity => identity.primaryDid ?? ''),
    ];
    const transcriptRequests = await deleteTranscriptRequestsForAccount({ firebaseUids, dids });
    const deletedIdentities = await deleteClassLinkIdentitiesByIdentityKeys(identityKeys);
    // Only lift the lock once the account itself is gone. A live student calling
    // deleteMyData must not be able to unlock minor preferences with one API call.
    const privacyLocks = options.clearPrivacyLock
        ? await clearPrivacyLocks(dids, CLASSLINK_PRIVACY_LOCK_SOURCE)
        : 0;
    return { identities: deletedIdentities, transcriptRequests, authSubjects, privacyLocks };
};
