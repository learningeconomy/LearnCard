/**
 * Web3Auth → SSS migration helpers: derive the legacy key, and check that a
 * key about to be migrated really belongs to the signed-in account.
 *
 * The first DID written to lca-api for an account is permanent, so the
 * coordinator asks `createMigrationIdentityVerifier` before any write (see
 * AuthCoordinatorConfig.verifyMigrationIdentity in learn-card-base).
 */
import {
    deriveWeb3AuthKey,
    getAuthConfig,
    resolveAuthProvider,
    type AuthProvider,
    type MigrationIdentityCheck,
    type MigrationIdentityVerdict,
} from 'learn-card-base';
import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';

const PROFILE_CHECK_TIMEOUT_MS = 5000;

/**
 * Derive the account's Web3Auth key with the tenant's legacy settings. These
 * must stay byte-identical to what web3auth-mode builds use, or the user gets
 * a different key (and DID).
 */
export const deriveLegacyMigrationKey = async (
    authProvider: Pick<AuthProvider, 'getIdToken'>
): Promise<string | null> => {
    const w3a = getAuthConfig().providerConfig.web3Auth ?? {};
    // Preserve each app's existing token refresh policy, including native
    // token retrieval through the provider abstraction.
    const token = await authProvider.getIdToken(true);
    if (!token) return null;

    return deriveWeb3AuthKey(
        {
            clientId: (w3a.clientId as string) ?? '',
            web3AuthNetwork: (w3a.network as string) ?? '',
            verifier: (w3a.verifierId as string) ?? '',
            usePnPKey: true,
            chainConfig: {
                rpcTarget: (w3a.rpcTarget as string) ?? 'https://rpc.ankr.com/eth',
            },
            isSessionCurrent: async uid => {
                const provider = resolveAuthProvider(getAuthConfig());
                if (!provider) return false;
                return (await provider.getCurrentUser())?.id === uid;
            },
        },
        token
    );
};

/**
 * Whether the LearnCard Network has a profile for this key's did:key. Uses a
 * single DID-authenticated `profile.getProfile` call (no challenge needed).
 * Throws on network/HTTP failure so callers can tell "no" from "couldn't ask".
 */
export const hasNetworkProfile = async ({
    privateKey,
    networkUrl,
    headers = {},
    fetchFn = fetch,
    timeoutMs = PROFILE_CHECK_TIMEOUT_MS,
}: {
    privateKey: string;
    networkUrl: string;
    headers?: Record<string, string>;
    fetchFn?: typeof fetch;
    timeoutMs?: number;
}): Promise<boolean> => {
    const lc = await getSigningLearnCard(privateKey);
    const jwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });
    if (typeof jwt !== 'string') throw new Error('Could not sign DID-Auth JWT');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchFn(`${networkUrl.replace(/\/+$/, '')}/profile.getProfile`, {
            headers: { ...headers, Authorization: `Bearer ${jwt}` },
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`profile.getProfile returned ${response.status}`);

        const body = (await response.json()) as { result?: { data?: unknown } };
        const profile = body?.result?.data;

        return !!profile && typeof profile === 'object';
    } finally {
        clearTimeout(timer);
    }
};

export interface MigrationIdentityVerifierDeps {
    didFromPrivateKey: (privateKey: string) => Promise<string>;
    /** Re-derives the signed-in account's Web3Auth key; null when no session. */
    deriveLegacyKey: () => Promise<string | null>;
    /** Whether a network profile exists for the key's DID; throws when unknown. */
    hasProfile: (privateKey: string) => Promise<boolean>;
}

/**
 * - A **cached** key (from device storage) is compared with a fresh Web3Auth
 *   derivation for the signed-in account. The cache is one device-wide slot, so
 *   this catches another account's key left on the device.
 * - A **derived** key came from that derivation already, so the remaining
 *   anchor is the network profile: one under this DID is a match; none (users
 *   who never finished onboarding) or an unreachable network is `unknown`.
 */
export const createMigrationIdentityVerifier =
    ({ didFromPrivateKey, deriveLegacyKey, hasProfile }: MigrationIdentityVerifierDeps) =>
    async ({
        privateKey,
        did,
        source,
    }: MigrationIdentityCheck): Promise<MigrationIdentityVerdict> => {
        if (source === 'cached') {
            const legacyKey = await deriveLegacyKey();
            if (!legacyKey) return 'unknown';

            return (await didFromPrivateKey(legacyKey)) === did ? 'match' : 'mismatch';
        }

        return (await hasProfile(privateKey)) ? 'match' : 'unknown';
    };
