/**
 * Web3Auth Key Derivation Strategy
 *
 * Implements KeyDerivationStrategy using Web3Auth Single Factor Auth (SFA).
 * The key is derived deterministically from the Firebase auth token + verifier,
 * so there are no persistent local shares and no server-side key components
 * to manage.
 *
 * This strategy enables a smooth rollout path:
 *   1. Deploy with VITE_KEY_DERIVATION=web3auth  (existing behavior)
 *   2. Test SSS in staging
 *   3. Flip to  VITE_KEY_DERIVATION=sss  with VITE_ENABLE_MIGRATION=true
 *
 * Recovery is handled internally by Web3Auth's MPC network and is not
 * exposed through the KeyDerivationStrategy recovery interface.
 */

import { Web3Auth } from '@web3auth/single-factor-auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

import type { KeyDerivationStrategy, ServerKeyStatus } from '@learncard/auth-types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface Web3AuthStrategyConfig {
    /** Web3Auth client ID from the dashboard */
    clientId: string;

    /** Web3Auth network (e.g. 'sapphire_mainnet', 'sapphire_devnet', 'testnet', 'cyan') */
    web3AuthNetwork: string;

    /** Firebase verifier name registered with Web3Auth */
    verifier: string;

    /**
     * When true (default), returns the same key as the PnP Web SDK.
     * Set to false to get the CoreKit key instead.
     */
    usePnPKey?: boolean;

    /** Optional Ethereum chain config overrides */
    chainConfig?: {
        chainId?: string;
        rpcTarget?: string;
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the `sub` (subject / uid) claim from a JWT without any dependencies.
 * Only the payload is parsed — no signature verification (the server already verified it).
 */
const decodeJwtSub = (token: string): string => {
    const parts = token.split('.');

    if (parts.length !== 3) {
        throw new Error('Invalid JWT format — expected 3 parts');
    }

    const payload = parts[1]!;

    // base64url → base64 → decode
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed: Record<string, unknown> = JSON.parse(decoded);

    if (!parsed.sub || typeof parsed.sub !== 'string') {
        throw new Error('JWT missing `sub` claim (uid)');
    }

    return parsed.sub;
};

// ---------------------------------------------------------------------------
// Strategy factory
// ---------------------------------------------------------------------------

/**
 * Create a Web3Auth key derivation strategy.
 *
 * The strategy caches the Firebase ID token from `fetchServerKeyStatus` and
 * uses it in `reconstructKey` to connect to Web3Auth SFA and derive the
 * private key.
 *
 * @example
 * ```ts
 * import { createWeb3AuthStrategy } from 'learn-card-base';
 *
 * const strategy = createWeb3AuthStrategy({
 *     clientId: 'BPi5PB_...',
 *     web3AuthNetwork: 'sapphire_devnet',
 *     verifier: 'learncardapp-firebase',
 * });
 * ```
 */
export const createWeb3AuthStrategy = (
    config: Web3AuthStrategyConfig
): KeyDerivationStrategy<never, never, never> => {
    // Cached credentials from fetchServerKeyStatus → used by reconstructKey
    let cachedToken: string | null = null;
    let cachedUid: string | null = null;

    /**
     * Connect to Web3Auth SFA and extract the Ethereum private key.
     */
    const deriveKeyFromWeb3Auth = async (idToken: string, uid: string): Promise<string> => {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
            config: {
                chainConfig: {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: config.chainConfig?.chainId ?? '0x1',
                    rpcTarget: config.chainConfig?.rpcTarget ?? 'https://rpc.ankr.com/eth',
                },
            },
        });

        const web3auth = new Web3Auth({
            clientId: config.clientId,
            web3AuthNetwork: config.web3AuthNetwork as Parameters<typeof Web3Auth>[0]['web3AuthNetwork'],
            privateKeyProvider,
            usePnPKey: config.usePnPKey ?? true,
        });

        await web3auth.init();

        await web3auth.connect({
            verifier: config.verifier,
            verifierId: uid,
            idToken,
        });

        const provider = web3auth.provider;

        if (!provider) {
            throw new Error('Web3Auth provider unavailable after connect');
        }

        const privateKey = await provider.request({ method: 'eth_private_key' });

        if (!privateKey || typeof privateKey !== 'string') {
            throw new Error('Failed to extract private key from Web3Auth provider');
        }

        return privateKey;
    };

    // -----------------------------------------------------------------------
    // KeyDerivationStrategy implementation
    // -----------------------------------------------------------------------

    return {
        name: 'web3auth',

        // --- Key lifecycle ---
        // Web3Auth derives keys on-demand from the auth token. There are no
        // persistent local shares to manage — these are all no-ops.

        hasLocalKey: async () => true,

        getLocalKey: async () => cachedUid ?? 'web3auth',

        storeLocalKey: async () => {},

        clearLocalKeys: async () => {
            cachedToken = null;
            cachedUid = null;
        },

        splitKey: async (privateKey: string) => ({
            localKey: privateKey,
            remoteKey: privateKey,
        }),

        reconstructKey: async (_localKey: string, _remoteKey: string): Promise<string> => {
            if (!cachedToken || !cachedUid) {
                throw new Error(
                    'Web3Auth credentials not available — fetchServerKeyStatus must be called first'
                );
            }

            return deriveKeyFromWeb3Auth(cachedToken, cachedUid);
        },

        // --- Server communication ---

        fetchServerKeyStatus: async (token: string, _providerType: string): Promise<ServerKeyStatus> => {
            // Cache the token and decode the uid for use in reconstructKey
            cachedToken = token;
            cachedUid = decodeJwtSub(token);

            // Web3Auth always has a key for any authenticated user —
            // the key is derived deterministically from token + verifier.
            return {
                exists: true,
                needsMigration: false,
                primaryDid: null,
                recoveryMethods: [],
                authShare: 'web3auth', // placeholder — coordinator requires non-null to proceed
            };
        },

        storeAuthShare: async () => {},

        // --- Recovery ---
        // Web3Auth handles key recovery internally via its MPC network.

        executeRecovery: async (): Promise<never> => {
            throw new Error(
                'Recovery is not supported with the Web3Auth strategy. ' +
                'Web3Auth handles key availability internally via its MPC network.'
            );
        },

        // --- Cleanup ---

        getPreservedStorageKeys: () => [],
    };
};
