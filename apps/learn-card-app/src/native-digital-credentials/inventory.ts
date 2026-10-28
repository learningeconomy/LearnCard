import type { ParsedSdJwtVc, PresentSdJwtVcOptions } from '@learncard/sd-jwt-vc-plugin';
import type { VerificationCheck } from '@learncard/types';
import type { WalletForCandidates, PooledCandidate } from '../pages/oid4vp/candidatePool';
import { loadCandidatePool } from '../pages/oid4vp/candidatePool';
import type { AndroidCredentialEntry } from './types';

export interface DigitalCredentialWallet extends WalletForCandidates {
    id: {
        did: () => string;
        keypair: (algorithm: 'ed25519') => { kty: string; crv: string; x: string; d: string };
    };
    invoke: {
        parseSdJwtVc: (compact: string) => Promise<ParsedSdJwtVc>;
        verifySdJwtVc: (compact: string) => Promise<VerificationCheck>;
        presentSdJwtVc: (
            compact: string,
            options: PresentSdJwtVcOptions
        ) => Promise<{ compact: string }>;
    };
}

export interface RegisteredCredential {
    id: string;
    uri: string;
    digest: string;
    projection: AndroidCredentialEntry;
}

export interface AccountInventory {
    owner: string;
    entries: RegisteredCredential[];
}

export const compactCredential = (credential: unknown): string | undefined => {
    if (typeof credential === 'string' && credential.includes('~')) return credential;
    if (!credential || typeof credential !== 'object') return undefined;
    const proof = (credential as { proof?: unknown }).proof;
    const proofs = Array.isArray(proof) ? proof : [proof];
    for (const item of proofs) {
        if (
            item &&
            typeof item === 'object' &&
            item.type === 'SdJwtCompactProof' &&
            typeof item.jwt === 'string'
        )
            return item.jwt;
    }
    return undefined;
};

export const credentialDigest = async (value: string): Promise<string> => {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
};

export const accountOwner = (wallet: DigitalCredentialWallet): string =>
    `${wallet.id.did()}::${wallet.id.keypair('ed25519').x}`;

const metadata = new Set(['iss', 'vct', 'iat', 'exp', 'nbf', 'cnf', '_sd', '_sd_alg']);
export const isFlatClaim = (key: string, value: unknown): boolean =>
    /^[A-Za-z_][A-Za-z0-9_-]*$/.test(key) &&
    !['__proto__', 'constructor', 'prototype'].includes(key) &&
    !metadata.has(key) &&
    (value === null || ['string', 'number', 'boolean'].includes(typeof value));

/** First native profile: flat selectively disclosable claims, bound to the active account key. */
export const eligibleCredential = async (
    wallet: DigitalCredentialWallet,
    candidate: PooledCandidate
) => {
    const compact = compactCredential(candidate.credential);
    if (!compact) return undefined;
    const parsed = await wallet.invoke.parseSdJwtVc(compact);
    const holder = parsed.holderPublicKey;
    if (
        holder?.kty !== 'OKP' ||
        holder.crv !== 'Ed25519' ||
        holder.x !== wallet.id.keypair('ed25519').x
    )
        return undefined;
    if (!parsed.disclosureKeys.length || parsed.disclosureKeys.length > 32) return undefined;
    // Do not quietly expose non-selective personal claims or nested containers in this profile.
    if (Object.keys(parsed.rawPayload).some(key => !metadata.has(key))) return undefined;
    const fields = parsed.disclosureKeys.filter(key => isFlatClaim(key, parsed.claims[key]));
    if (!fields.length) return undefined;
    const verification = await wallet.invoke.verifySdJwtVc(compact);
    if (verification.errors.length) return undefined;
    return { compact, parsed, fields };
};

/** Credentials are read through the account's actual encrypted read plane. No bodies/keys enter the registry. */
export const buildAccountInventory = async (
    wallet: DigitalCredentialWallet,
    previous: AccountInventory | undefined,
    genericTitle: string
): Promise<AccountInventory> => {
    const owner = accountOwner(wallet);
    const old = previous?.owner === owner ? previous.entries : [];
    const entries: RegisteredCredential[] = [];
    for (const candidate of await loadCandidatePool(wallet)) {
        if (entries.length === 100) break;
        try {
            const eligible = await eligibleCredential(wallet, candidate);
            if (!eligible) continue;
            const id = old.find(entry => entry.uri === candidate.id)?.id ?? crypto.randomUUID();
            entries.push({
                id,
                uri: candidate.id,
                digest: await credentialDigest(eligible.compact),
                projection: {
                    id,
                    title: genericTitle,
                    vct: eligible.parsed.vct,
                    claims: eligible.fields.map(key => ({
                        path: [key],
                        displayName: key.replace(/[_-]/g, ' '),
                    })),
                },
            });
        } catch {
            /* An invalid/ineligible credential must not break the remaining inventory. */
        }
    }
    return { owner, entries };
};
