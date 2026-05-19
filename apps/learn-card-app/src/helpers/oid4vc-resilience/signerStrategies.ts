import {
    createJoseEd25519Signer,
    type ProofJwtSigner,
} from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export type SignerStrategyId = 'did:web' | 'did:key';

/**
 * Preferred signer order for OID4VCI/VP. `did:web` first (matches
 * the user's network identity), then `did:key` as the universally-
 * resolvable fallback. Single source of truth — `getApplicableSigner
 * Strategies` filters this list rather than maintaining its own order.
 *
 * To add a new strategy: append it here, then extend the `switch`
 * statements in `buildSignerForStrategy` + `getHolderDidForStrategy`
 * AND the applicability check in `getApplicableSignerStrategies`.
 * The TypeScript compiler will fail any partial extension because
 * `SignerStrategyId` is exhaustively switched.
 */
export const SIGNER_STRATEGY_PREFERENCE: readonly SignerStrategyId[] = [
    'did:web',
    'did:key',
];

const buildEd25519Signer = async (
    wallet: BespokeLearnCard,
    did: string
): Promise<ProofJwtSigner> => {
    const kid = await wallet.invoke.didToVerificationMethod(did);
    const keypair = wallet.id.keypair('ed25519');
    return createJoseEd25519Signer({ keypair, kid });
};

const isStrategyApplicable = (
    wallet: BespokeLearnCard,
    strategyId: SignerStrategyId
): boolean => {
    switch (strategyId) {
        case 'did:web':
            return wallet.id.did().startsWith('did:web:');
        case 'did:key':
            return true;
    }
};

/**
 * Compute the strategy list applicable to the active wallet, derived
 * from `SIGNER_STRATEGY_PREFERENCE` (not a separate hardcoded list).
 * Always returns at least `['did:key']` since did:key works for any
 * wallet.
 */
export const getApplicableSignerStrategies = (
    wallet: BespokeLearnCard
): SignerStrategyId[] =>
    SIGNER_STRATEGY_PREFERENCE.filter(strategy => isStrategyApplicable(wallet, strategy));

/**
 * Build a `ProofJwtSigner` for a given strategy id. Returns `undefined`
 * when the strategy isn't constructible (e.g. did:web requested but
 * the active DID isn't did:web) — callers should pass `undefined`
 * straight through to the plugin so the plugin's default signer takes
 * over rather than crashing.
 */
export const buildSignerForStrategy = async (
    wallet: BespokeLearnCard,
    strategyId: SignerStrategyId
): Promise<ProofJwtSigner | undefined> => {
    switch (strategyId) {
        case 'did:web': {
            const did = wallet.id.did();
            if (!did.startsWith('did:web:')) return undefined;
            return buildEd25519Signer(wallet, did);
        }
        case 'did:key': {
            const did = wallet.id.did('key');
            return buildEd25519Signer(wallet, did);
        }
    }
};

/**
 * Best-effort identifier of the holder DID for a given signer strategy.
 * Used to set the VP's `holder` field in OID4VP flows so it matches
 * the proof JWT's `kid`.
 */
export const getHolderDidForStrategy = (
    wallet: BespokeLearnCard,
    strategyId: SignerStrategyId
): string | undefined => {
    switch (strategyId) {
        case 'did:web': {
            const did = wallet.id.did();
            return did.startsWith('did:web:') ? did : undefined;
        }
        case 'did:key':
            return wallet.id.did('key');
    }
};
