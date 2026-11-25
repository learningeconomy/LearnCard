import type { BespokeLearnCard } from '../types/learn-card';

/**
 * Stable ordering for accepted field answers. The digest is an opaque tie-breaker:
 * the holder's private storage URI must not be disclosed in consent terms.
 */
export const getProfileFieldGeneration = async (
    uri: string,
    issuanceDate: string
): Promise<string> => {
    const date = new Date(issuanceDate);
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid profile answer timestamp.');
    const bytes = new TextEncoder().encode(uri);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');
    return `${date.toISOString()}:${hash}`;
};
/** Derive the generation from the encrypted source, not from a cached grant. */
export const getProfileFieldGenerationForUri = async (
    wallet: BespokeLearnCard,
    uri: string
): Promise<string> => {
    const credential = await wallet.read.get(uri);
    if (!credential?.validFrom) throw new Error('Profile answer timestamp is unavailable.');
    return getProfileFieldGeneration(uri, credential.validFrom);
};
