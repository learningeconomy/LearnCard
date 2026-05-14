import {
    createJoseEd25519Signer,
    type ProofJwtSigner,
} from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export type SignerStrategyId = 'did:web' | 'did:key' | 'did:jwk';

/**
 * Preferred signer order for OID4VCI/VP. did:web first (matches the
 * user's network identity), then did:key as the universally-resolvable
 * fallback. did:jwk is reserved for verifiers that explicitly reject
 * key-based identifiers — gated behind a user prompt because it
 * surfaces a different identity to the counterparty.
 */
export const SIGNER_STRATEGY_PREFERENCE: SignerStrategyId[] = [
    'did:web',
    'did:key',
    'did:jwk',
];

const buildEd25519Signer = async (
    wallet: BespokeLearnCard,
    did: string
): Promise<ProofJwtSigner> => {
    const kid = await wallet.invoke.didToVerificationMethod(did);
    const keypair = wallet.id.keypair('ed25519');
    return createJoseEd25519Signer({ keypair, kid });
};

/**
 * Compute the strategy list applicable to the active wallet. Always
 * returns at least one entry (did:key works for any wallet). did:web
 * is included only when the active DID is a did:web (typically for
 * users with a network profile).
 */
export const getApplicableSignerStrategies = (
    wallet: BespokeLearnCard
): SignerStrategyId[] => {
    const activeDid = wallet.id.did();
    const strategies: SignerStrategyId[] = [];
    if (activeDid.startsWith('did:web:')) strategies.push('did:web');
    strategies.push('did:key');
    return strategies;
};

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
        case 'did:jwk': {
            // did:jwk requires a different verification-method shape that
            // we don't currently emit. Falls back to undefined so the
            // plugin uses its default — this is a placeholder for future
            // expansion when a verifier explicitly demands did:jwk.
            return undefined;
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
        case 'did:jwk':
            return undefined;
    }
};
