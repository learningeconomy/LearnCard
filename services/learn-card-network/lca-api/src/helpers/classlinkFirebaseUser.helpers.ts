import type admin from 'firebase-admin';

import { classLinkFirebaseUid } from '@helpers/classlinkPii.helpers';
import { isSyntheticEmail, syntheticEmailForUid } from '@helpers/syntheticEmail.helpers';

type FirebaseAuth = admin.auth.Auth;

/** The `code` of a Firebase Admin error (or any object with one), else undefined. */
export const firebaseErrorCode = (error: unknown): unknown =>
    typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;

const getUserOrUndefined = (
    auth: FirebaseAuth,
    uid: string
): Promise<admin.auth.UserRecord | undefined> =>
    auth.getUser(uid).catch((error: unknown) => {
        if (firebaseErrorCode(error) === 'auth/user-not-found') return undefined;
        throw error;
    });

/**
 * Make sure the Firebase user a ClassLink sign-in will mint a token for exists and has an
 * email, so wallet key storage (which needs an email or phone contact) works. Trusted school
 * emails are used as-is (verified); everyone else gets the reserved synthetic address
 * (unverified).
 *
 * Only the identity's own deterministic user (`classLinkFirebaseUid(identityKey)`) is ever
 * changed. The uid of an existing identity can also be the account's own Firebase user (from
 * School Connect, an email join or a recovery rebind, e.g. a phone account); its profile is
 * never touched, because writing an email onto it would change its contact method and make it
 * reachable by email-code sign-in.
 *
 * For the deterministic user:
 * - an existing user with that uid is the same person (left behind when the ClassLinkIdentity
 *   row was deleted), so it is reused rather than failing on `auth/uid-already-exists`;
 * - an empty email is backfilled;
 * - a synthetic email is upgraded to the school email once that email is trusted, so a later
 *   email-code sign-in lands on the same account. The caller must already have checked that no
 *   other Firebase user holds `trustedEmail`.
 */
export const ensureClassLinkFirebaseUser = async (
    auth: FirebaseAuth,
    uid: string,
    {
        identityKey,
        displayName,
        trustedEmail,
        isNew,
    }: { identityKey: string; displayName?: string; trustedEmail?: string; isNew: boolean }
): Promise<void> => {
    const contact = trustedEmail
        ? { email: trustedEmail, emailVerified: true }
        : { email: syntheticEmailForUid(uid), emailVerified: false };

    let user = isNew ? undefined : await getUserOrUndefined(auth, uid);
    if (!user) {
        try {
            await auth.createUser({ uid, displayName, ...contact });
            return;
        } catch (error) {
            if (firebaseErrorCode(error) !== 'auth/uid-already-exists') throw error;
            console.info('classlink.firebase_user.reused');
            user = await getUserOrUndefined(auth, uid);
            if (!user) throw error;
        }
    }
    if (uid !== classLinkFirebaseUid(identityKey)) return;
    const upgrade = Boolean(trustedEmail) && isSyntheticEmail(user.email);
    if (!user.email || upgrade) {
        await auth.updateUser(uid, contact);
        console.info(
            upgrade
                ? 'classlink.firebase_user.email_upgraded'
                : 'classlink.firebase_user.email_backfilled',
            { synthetic: !trustedEmail }
        );
    }
};

/**
 * Put the identity's deterministic Firebase user back on its synthetic address after the
 * identity moved to another Firebase uid (School Connect refresh after a recovery rebind), so
 * the school email no longer resolves to a user the account has left behind. No-op when that
 * user is gone or already synthetic. Best effort: failures are logged without values.
 */
export const releaseClassLinkFirebaseEmail = async (
    auth: FirebaseAuth,
    identityKey: string
): Promise<void> => {
    const uid = classLinkFirebaseUid(identityKey);
    try {
        const user = await getUserOrUndefined(auth, uid);
        if (!user?.email || isSyntheticEmail(user.email)) return;
        await auth.updateUser(uid, { email: syntheticEmailForUid(uid), emailVerified: false });
        console.info('classlink.firebase_user.email_released');
    } catch (error) {
        const code = firebaseErrorCode(error);
        console.warn('classlink.firebase_user.email_release_failed', {
            ...(typeof code === 'string' ? { code } : {}),
        });
    }
};
