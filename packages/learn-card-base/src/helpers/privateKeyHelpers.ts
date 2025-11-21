import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { getPlatformPrivateKey } from 'learn-card-base/security/platformPrivateKeyStorage';

/**
 * Centralized helper to retrieve the current user's private key.
 * Order of precedence:
 * 1) Explicit override argument
 * 2) In-memory store: `currentUserStore.currentUserPK` or `currentUser.privateKey`
 * 3) Platform-aware secure storage (web: AES-GCM + IndexedDB; native: encrypted SQLite)
 */
export const getCurrentUserPrivateKey = async (
    override?: string
): Promise<string | null> => {
    // 1) Direct override
    if (override && typeof override === 'string' && override.length > 0) return override;

    // 2) Try in-memory store(s)
    const storePk = currentUserStore.get.currentUserPK();
    if (storePk && storePk.length > 0) return storePk;

    const storeUserPk = currentUserStore.get.currentUser()?.privateKey;
    if (storeUserPk && storeUserPk.length > 0) return storeUserPk;

    // 3) Try platform-aware secure storage
    try {
        const pk = await getPlatformPrivateKey();
        if (pk && pk.length > 0) return pk;
    } catch (e) {
        console.warn('getCurrentUserPrivateKey::secureStorage', e);
    }

    return null;
};

export const requireCurrentUserPrivateKey = async (override?: string): Promise<string> => {
    const pk = await getCurrentUserPrivateKey(override);
    if (!pk) throw new Error('Error, no valid private key found');
    return pk;
};
