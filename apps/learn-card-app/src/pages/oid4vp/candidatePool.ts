/**
 * Build the candidate-credential pool the OpenID4VP plugin matches the
 * verifier's request against.
 *
 * The plugin's `prepareVerifiablePresentation` and `presentCredentials`
 * both consume {@link CandidateCredential}[] (PEX) or `AdaptableCredential[]`
 * (DCQL); the two types are structurally identical for our purposes:
 * `{ credential: unknown; format?: string; id?: string }`.
 *
 * We pull every credential the wallet has indexed (LearnCloud + SQLite),
 * keeping the URI on `id` so the consent screen can later round-trip a
 * pick back to its store-plane URI for telemetry / undo.
 *
 * Format is left undefined so the plugin's `inferCredentialFormat`
 * decides on shape: a compact JWS string lands as `jwt_vc_json`, a
 * JSON-LD VC object lands as `ldp_vc`, anything with `proof.jwt` is
 * unwrapped to its inner JWS by the plugin before signing.
 */

import type { CandidateCredential } from '@learncard/openid4vc-plugin';

/**
 * Minimal wallet shape we touch. Mirrors the runtime API of
 * `BespokeLearnCard` without dragging in its full plugin chain \u2014
 * lets the helper be unit-tested with a hand-built fake.
 */
export interface WalletForCandidates {
    index: {
        LearnCloud: { get: () => Promise<IndexEntry[]> };
        SQLite?: { get: () => Promise<IndexEntry[]> };
    };
    read: { get: (uri: string) => Promise<unknown> };
}

interface IndexEntry {
    uri: string;
    /** Optional title / category surfaced by the wallet's index plane. */
    title?: string;
    category?: string;
}

export interface PooledCandidate extends CandidateCredential {
    /** Always populated for our pool; carries the storage URI back to UI. */
    id: string;
    /** Index-record metadata so the consent screen can show titles. */
    title?: string;
    category?: string;
}

export interface LoadCandidatePoolOptions {
    /**
     * Which storage planes to pull from. `'all'` deduplicates by URI so a
     * credential mirrored across LearnCloud + SQLite isn\u2019t presented
     * twice.
     */
    location?: 'LearnCloud' | 'SQLite' | 'all';

    /**
     * Drop credentials whose `read.get(uri)` returned null/undefined.
     * Defaults to `true` \u2014 a missing fetch is treated as a stale index
     * record rather than a fatal error.
     */
    skipMissing?: boolean;
}

/**
 * Load every credential currently in the wallet, paired with its URI, in
 * a shape the OpenID4VC plugin\u2019s selector accepts.
 */
export const loadCandidatePool = async (
    wallet: WalletForCandidates,
    options: LoadCandidatePoolOptions = {}
): Promise<PooledCandidate[]> => {
    const location = options.location ?? 'LearnCloud';
    const skipMissing = options.skipMissing ?? true;

    const entries = await collectIndexEntries(wallet, location);

    // Deduplicate by URI \u2014 the SQLite mirror often shadows LearnCloud
    // for the same credential, and the verifier shouldn\u2019t see two
    // identical candidates.
    const dedupedByUri = new Map<string, IndexEntry>();
    for (const entry of entries) {
        if (!entry.uri) continue;
        if (!dedupedByUri.has(entry.uri)) dedupedByUri.set(entry.uri, entry);
    }

    const candidates = await Promise.all(
        Array.from(dedupedByUri.values()).map(async (entry) => {
            try {
                const credential = await wallet.read.get(entry.uri);
                if (!credential && skipMissing) return null;

                const candidate: PooledCandidate = {
                    id: entry.uri,
                    credential,
                    title: entry.title,
                    category: entry.category,
                };
                return candidate;
            } catch (err) {
                // A single broken read shouldn\u2019t poison the whole pool;
                // surfacing it would prevent the user from sharing
                // unrelated credentials.
                console.warn('OID4VP candidate read failed', entry.uri, err);
                return null;
            }
        })
    );

    return candidates.filter((c): c is PooledCandidate => Boolean(c));
};

const collectIndexEntries = async (
    wallet: WalletForCandidates,
    location: 'LearnCloud' | 'SQLite' | 'all'
): Promise<IndexEntry[]> => {
    if (location === 'LearnCloud') {
        return wallet.index.LearnCloud.get();
    }
    if (location === 'SQLite') {
        return wallet.index.SQLite ? wallet.index.SQLite.get() : [];
    }

    const [cloud, sqlite] = await Promise.all([
        wallet.index.LearnCloud.get().catch(() => [] as IndexEntry[]),
        wallet.index.SQLite ? wallet.index.SQLite.get().catch(() => [] as IndexEntry[]) : Promise.resolve([] as IndexEntry[]),
    ]);
    return [...cloud, ...sqlite];
};
