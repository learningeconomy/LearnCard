import type { ParsedSdJwtVc, PresentSdJwtVcOptions } from '@learncard/sd-jwt-vc-plugin';
import type { VerificationCheck } from '@learncard/types';
import type { WalletForCandidates, PooledCandidate } from '../pages/oid4vp/candidatePool';
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

export interface InventoryCacheEntry {
    checkedAt: number;
    expiresAt: number;
    /** Inconclusive results are retried, never reused as a negative decision. */
    retryRequired?: boolean;
    entry?: RegisteredCredential;
}

/** Scan continuation outlives the short verification cache; contains no credential body. */
export interface InventoryScanProgress {
    owner?: string;
    nextUri?: string;
}

export interface InventoryRefreshOptions {
    /** Metadata/negative-result cache only; never stores credential bodies or keys. */
    cache?: Map<string, InventoryCacheEntry>;
    scanProgress?: InventoryScanProgress;
    now?: () => number;
    onIssue?: (reason: 'unavailable' | 'projection' | 'read_budget') => void;
}

export interface InventoryRefresh extends AccountInventory {
    retryRequired: boolean;
}

export const INVENTORY_READ_CONCURRENCY = 4;
export const INVENTORY_READ_BUDGET = 200;
export const INVENTORY_CACHE_MS = 60_000;

class InventoryUnavailableError extends Error {}

// The verifier reports machine-readable prefixes. Unknown errors are treated as
// inconclusive, never as proof of deletion. Approval always verifies again.
const confirmedInvalid = (error: string): boolean =>
    /^(invalid_compact_form|invalid_jwt|invalid_typ|missing_iss|missing_vct|missing_alg|unsupported_alg|unsupported_sd_alg|invalid_disclosure|disclosure_hash_mismatch|signature_invalid|expired|not_yet_valid|vct_mismatch):/.test(
        error
    );

/** Keep this boundary aligned with Kotlin RegistryProjection.validate. */
export const validRegistryProjection = (entry: AndroidCredentialEntry): boolean =>
    /^[A-Za-z0-9_-]{16,64}$/.test(entry.id) &&
    typeof entry.vct === 'string' &&
    entry.vct.length >= 1 &&
    entry.vct.length <= 512 &&
    entry.title.length >= 1 &&
    entry.title.length <= 100 &&
    entry.claims.length >= 1 &&
    entry.claims.length <= 32 &&
    entry.claims.every(
        claim =>
            claim.displayName.length >= 1 &&
            claim.displayName.length <= 100 &&
            claim.path.length >= 1 &&
            claim.path.length <= 8 &&
            claim.path.every(
                part => typeof part === 'string' && part.length >= 1 && part.length <= 100
            )
    );

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

// A personal account restores first as did:key and then as its network did:web
// alias. Ownership follows the credential-bound signing key, not that alias.
// Switched/managed profiles are independently excluded by the host listener.
export const accountOwner = (wallet: DigitalCredentialWallet): string =>
    `ed25519:${wallet.id.keypair('ed25519').x}`;

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
    if (verification.errors.length) {
        if (verification.errors.every(confirmedInvalid)) return undefined;
        throw new InventoryUnavailableError('Credential verification unavailable');
    }
    return { compact, parsed, fields };
};

/**
 * Reconcile against the authoritative index with bounded reads. Indexed entries
 * with inconclusive reads/verification retain their old opaque handle; absent
 * URIs and confirmed invalid credentials are removed. Retained entries still
 * require a fresh body, digest, index and signature check at approval.
 */
export const buildAccountInventory = async (
    wallet: DigitalCredentialWallet,
    previous: AccountInventory | undefined,
    genericTitle: string,
    options: InventoryRefreshOptions = {}
): Promise<InventoryRefresh> => {
    const owner = accountOwner(wallet);
    const old = new Map(
        (previous?.owner === owner ? previous.entries : []).map(entry => [entry.uri, entry])
    );
    // An index failure aborts the refresh before any replacement/clear.
    const indexed = new Set(
        (await wallet.index.LearnCloud.get()).map(entry => entry.uri).filter(Boolean)
    );
    const cache = options.cache ?? new Map<string, InventoryCacheEntry>();
    const scanProgress = options.scanProgress;
    if (scanProgress && scanProgress.owner !== owner) {
        // The runtime also replaces both objects on account change. Keep this
        // helper safe if a caller accidentally lends the state to another owner.
        cache.clear();
        scanProgress.owner = owner;
        delete scanProgress.nextUri;
    }
    for (const uri of cache.keys()) if (!indexed.has(uri)) cache.delete(uri);
    // Recheck previously advertised credentials first so a full registry doesn't
    // displace a temporarily unavailable credential with an unrelated new one.
    const uris = [...old.keys()].filter(uri => indexed.has(uri));
    const newlyIndexed = [...indexed].filter(uri => !old.has(uri));
    // Failed new candidates go behind unexamined ones on the next bounded pass;
    // otherwise an unavailable prefix could starve the rest of a large account.
    newlyIndexed.sort((a, b) => {
        const left = cache.get(a);
        const right = cache.get(b);
        return (
            (left?.retryRequired ? left.checkedAt : 0) -
            (right?.retryRequired ? right.checkedAt : 0)
        );
    });
    const continuation = scanProgress?.nextUri;
    const nextIndex = continuation ? newlyIndexed.indexOf(continuation) : -1;
    // A finite retry burst can scan only 800 uncached entries. Keep the next
    // unread URI independently of the 60-second cache, so a later foreground
    // continues rather than repeatedly scanning an ineligible prefix.
    const remaining =
        nextIndex > 0
            ? newlyIndexed.slice(nextIndex).concat(newlyIndexed.slice(0, nextIndex))
            : newlyIndexed;
    for (const uri of remaining) uris.push(uri);
    const now = options.now ?? Date.now;
    const entries: RegisteredCredential[] = [];
    let retryRequired = false;
    let reads = 0;
    let cursor = 0;
    const read = async (uri: string): Promise<RegisteredCredential | undefined> => {
        try {
            const credential = await wallet.read.get(uri);
            // A null read is not authoritative removal while the URI is indexed.
            if (!credential) throw new InventoryUnavailableError('Credential read unavailable');
            const eligible = await eligibleCredential(wallet, { id: uri, credential });
            let entry: RegisteredCredential | undefined;
            if (eligible) {
                const id = old.get(uri)?.id ?? crypto.randomUUID();
                const projection = {
                    id,
                    title: genericTitle,
                    vct: eligible.parsed.vct,
                    claims: eligible.fields.map(key => ({
                        path: [key],
                        displayName: key.replace(/[_-]/g, ' '),
                    })),
                };
                if (validRegistryProjection(projection)) {
                    entry = {
                        id,
                        uri,
                        digest: await credentialDigest(eligible.compact),
                        projection,
                    };
                } else options.onIssue?.('projection');
            }
            cache.set(uri, {
                checkedAt: now(),
                expiresAt: eligible?.parsed.expiresAt?.getTime() ?? Infinity,
                ...(entry ? { entry } : {}),
            });
            return entry;
        } catch (error) {
            if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                confirmedInvalid(`${error.code}:`)
            ) {
                cache.set(uri, { checkedAt: now(), expiresAt: Infinity });
                return undefined;
            }
            // Preserve only same-account, still-indexed entries. Never cache a
            // transient failure as an authoritative negative result.
            retryRequired = true;
            options.onIssue?.('unavailable');
            const prior = old.get(uri);
            const retained = prior && validRegistryProjection(prior.projection) ? prior : undefined;
            cache.set(uri, {
                checkedAt: now(),
                expiresAt: Infinity,
                retryRequired: true,
                ...(retained ? { entry: retained } : {}),
            });
            return retained;
        }
    };
    while (cursor < uris.length && entries.length < 100) {
        const batch: Array<Promise<RegisteredCredential | undefined>> = [];
        while (
            cursor < uris.length &&
            batch.length < Math.min(INVENTORY_READ_CONCURRENCY, 100 - entries.length)
        ) {
            const uri = uris[cursor];
            const cached = cache.get(uri);
            if (
                cached &&
                !cached.retryRequired &&
                now() - cached.checkedAt < INVENTORY_CACHE_MS &&
                now() < cached.expiresAt
            ) {
                cursor++;
                const entry = cached.entry;
                const updated = entry
                    ? { ...entry, projection: { ...entry.projection, title: genericTitle } }
                    : undefined;
                if (updated && !validRegistryProjection(updated.projection)) {
                    options.onIssue?.('projection');
                    batch.push(Promise.resolve(undefined));
                } else batch.push(Promise.resolve(updated));
            } else {
                if (reads === INVENTORY_READ_BUDGET) break;
                reads++;
                cursor++;
                batch.push(read(uri));
            }
        }
        if (!batch.length) break;
        entries.push(
            ...(await Promise.all(batch)).filter((entry): entry is RegisteredCredential =>
                Boolean(entry)
            )
        );
    }
    if (scanProgress) {
        if (entries.length < 100 && cursor < uris.length) scanProgress.nextUri = uris[cursor];
        else delete scanProgress.nextUri;
    }
    if (entries.length < 100 && cursor < uris.length) {
        retryRequired = true;
        options.onIssue?.('read_budget');
        // The read budget must not imply removal of unexamined indexed entries.
        for (const uri of uris.slice(cursor)) {
            const prior = old.get(uri);
            if (entries.length === 100) break;
            if (prior && validRegistryProjection(prior.projection)) entries.push(prior);
        }
    }
    return { owner, entries, retryRequired };
};
