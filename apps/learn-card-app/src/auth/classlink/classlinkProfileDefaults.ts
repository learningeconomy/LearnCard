import { getLogger } from 'learn-card-base';
import { auth } from '../../firebase/firebase';

const log = getLogger('classlink-profile');

/**
 * Network profile defaults for accounts created through ClassLink sign-in. School accounts
 * start private (hidden from search and other users); students can change it later.
 * lca-api marks these accounts with the `classlink` custom claim on the sign-in token.
 */
export const getClassLinkProfileDefaults = async (): Promise<
    { isPrivate: true; profileVisibility: 'private' } | Record<string, never>
> => {
    try {
        const user = auth().currentUser;
        if (!user) return {};
        const { claims } = await user.getIdTokenResult();
        return claims.classlink === true ? { isPrivate: true, profileVisibility: 'private' } : {};
    } catch (error) {
        log.warn('classlink.profile.defaults.unavailable', error);
        return {};
    }
};
