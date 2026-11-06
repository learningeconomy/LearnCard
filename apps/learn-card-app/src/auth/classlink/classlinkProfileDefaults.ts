import { authStore, getLogger, SocialLoginTypes } from 'learn-card-base';
import { auth } from '../../firebase/firebase';

const log = getLogger('classlink-profile');

/** Private network-profile settings applied to ClassLink accounts. */
export const CLASSLINK_PRIVATE_PROFILE = { isPrivate: true, profileVisibility: 'private' } as const;

type ClassLinkPrivateProfile = typeof CLASSLINK_PRIVATE_PROFILE;
type Claims = Record<string, unknown>;

/**
 * Reads the current Firebase user's custom claims, retrying once with a forced token
 * refresh. Returns `null` when signed out; throws when both attempts fail.
 */
const readClaims = async (): Promise<Claims | null> => {
    const user = auth().currentUser;
    if (!user) return null;
    try {
        return (await user.getIdTokenResult()).claims;
    } catch (error) {
        log.warn('classlink.claims.retry', error);
        return (await user.getIdTokenResult(true)).claims;
    }
};

/** True when this session was recorded as a ClassLink sign-in (see ClassLinkCallback). */
const isClassLinkLogin = (): boolean => {
    try {
        return authStore.get.typeOfLogin() === SocialLoginTypes.classlink;
    } catch {
        return false;
    }
};

/**
 * Network profile defaults for accounts created through ClassLink sign-in. School accounts
 * start private (hidden from search and other users); students can change it later.
 * lca-api marks these accounts with the `classlink` custom claim on the sign-in token.
 *
 * Client-side only: brain-service does not yet enforce LCN profile visibility for
 * ClassLink accounts (follow-up). If the claims cannot be read even after one retry, this
 * falls back to the recorded login method, so a ClassLink session still starts private.
 */
export const getClassLinkProfileDefaults = async (): Promise<
    ClassLinkPrivateProfile | Record<string, never>
> => {
    try {
        const claims = await readClaims();
        if (!claims) return {};
        return claims.classlink === true || isClassLinkLogin() ? CLASSLINK_PRIVATE_PROFILE : {};
    } catch (error) {
        const classlink = isClassLinkLogin();
        log.error('classlink.profile.defaults.unavailable', { classlink, error });
        return classlink ? CLASSLINK_PRIVATE_PROFILE : {};
    }
};

/** The subset of the LearnCard Network plugin used to apply the private profile. */
export type ClassLinkProfileWallet = {
    invoke: {
        getProfile: () => Promise<{ profileId?: string } | undefined | null>;
        updateProfile: (profile: ClassLinkPrivateProfile) => Promise<boolean>;
    };
};

/**
 * School Connect path: a student's ClassLink account was attached to an account that
 * already exists, so creation-time defaults never ran. Makes the existing network
 * profile private, retrying once. Returns whether the profile is now private (`true`
 * when there is no profile yet: none is visible). Never throws; failures are logged.
 */
export const applyClassLinkPrivateProfile = async (
    wallet: ClassLinkProfileWallet
): Promise<boolean> => {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            const profile = await wallet.invoke.getProfile();
            if (!profile?.profileId) return true;
            if (await wallet.invoke.updateProfile(CLASSLINK_PRIVATE_PROFILE)) return true;
            throw new Error('updateProfile returned false');
        } catch (error) {
            if (attempt === 2) {
                log.error('classlink.profile.private.failed', error);
                return false;
            }
            log.warn('classlink.profile.private.retry', error);
        }
    }
    return false;
};

/**
 * Whether the current Firebase session is a ClassLink sign-in, and whether lca-api
 * marked it as a student. Fails closed (`student: true`) when the claims cannot be read
 * for a ClassLink login, so student-gated UI stays hidden.
 */
export const getClassLinkSession = async (): Promise<{ classlink: boolean; student: boolean }> => {
    try {
        const claims = await readClaims();
        if (!claims) return { classlink: false, student: false };
        return {
            classlink: claims.classlink === true || isClassLinkLogin(),
            student: claims.classlinkStudent === true,
        };
    } catch (error) {
        const classlink = isClassLinkLogin();
        log.warn('classlink.session.unavailable', { classlink, error });
        return { classlink, student: classlink };
    }
};

/**
 * True when this session came from a ClassLink student sign-in. lca-api sets the
 * `classlinkStudent` claim, and enforces the same settings on the server.
 */
export const isClassLinkStudentSession = async (): Promise<boolean> => {
    try {
        const user = auth().currentUser;
        if (!user) return false;
        const { claims } = await user.getIdTokenResult();
        return claims.classlinkStudent === true;
    } catch (error) {
        log.warn('classlink.student.claim.unavailable', error);
        return false;
    }
};
