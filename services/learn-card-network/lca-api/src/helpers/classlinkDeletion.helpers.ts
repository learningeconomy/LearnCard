import { findAuthSubjectByIdentityKey, getAuthSubjectsCollection } from '../models/AuthSubject';
import { deleteClassLinkIdentitiesByIdentityKeys } from '../models/ClassLinkIdentity';
import { deleteTranscriptRequestsForAccount } from '../models/TranscriptRequest';
import { findUserKeyByContactMethod, type MongoUserKeyType } from '../models/UserKey';
import { findClassLinkIdentitiesForAccount, getAccountDids } from './classlinkContext.helpers';

export type ClassLinkDeletionAccount = Pick<
    MongoUserKeyType,
    'authProviders' | 'primaryDid' | 'linkedDids'
> &
    Partial<Pick<MongoUserKeyType, 'contactMethod'>>;

export interface ClassLinkDeletionResult {
    identities: number;
    transcriptRequests: number;
    authSubjects: number;
}

/**
 * Whether `email:<address>` may be removed with the ClassLink data. It is kept when it is
 * (or may be) another sign-in for a live account: the account's own contact email, or any
 * account's contact email. Only a personal email that the personal-email flow linked to
 * this identity's subject, and that nothing else signs in with, is removed.
 */
const canDeletePersonalEmailSubject = async (
    address: string,
    subject: string,
    account: ClassLinkDeletionAccount
): Promise<boolean> => {
    const record = await findAuthSubjectByIdentityKey(`email:${address}`);
    if (!record || record.subject !== subject) return false;
    const contact = account.contactMethod;
    if (contact?.type === 'email' && contact.value.trim().toLowerCase() === address) return false;
    return !(await findUserKeyByContactMethod({ type: 'email', value: address }));
};

/**
 * Server-side cascade for deleting an account's ClassLink data. Removes every ClassLink
 * identity linked to the account (by Firebase uid, Keycloak subject or recorded DID), the
 * `classlink:` AuthSubjects for those identities, the `email:` AuthSubject the
 * personal-email flow created (only when no account signs in with that address), and the
 * account's transcript requests.
 *
 * Deliberately kept: school-email `email:` subjects, which may be the user's existing
 * email-code sign-in, and Google/Apple subjects. Idempotent: a second call deletes nothing.
 */
export const deleteClassLinkDataForAccount = async (
    account: ClassLinkDeletionAccount
): Promise<ClassLinkDeletionResult> => {
    const identities = await findClassLinkIdentitiesForAccount(account);
    let authSubjects = 0;
    for (const identity of identities) {
        const address = identity.personalEmail?.trim().toLowerCase();
        if (address && (await canDeletePersonalEmailSubject(address, identity.subject, account)))
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

    const firebaseUids = [
        ...account.authProviders.filter(p => p.type === 'firebase').map(p => p.id),
        ...identities.map(identity => identity.firebaseUid),
    ];
    const dids = [
        ...getAccountDids(account),
        ...identities.map(identity => identity.primaryDid ?? ''),
    ];
    const transcriptRequests = await deleteTranscriptRequestsForAccount({ firebaseUids, dids });
    const deletedIdentities = await deleteClassLinkIdentitiesByIdentityKeys(identityKeys);
    return { identities: deletedIdentities, transcriptRequests, authSubjects };
};
