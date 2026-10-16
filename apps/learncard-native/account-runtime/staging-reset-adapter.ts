import type { ConsumerWallet } from './consumer-apps';
import type { ResetWallet } from './staging-reset';
import { ResetFailure } from './staging-reset';
import { getClient } from '@learncard/network-brain-client';
import { initLearnCard } from '@learncard/init';

export interface ResetSigner {
    did: string;
    proof: (challenge?: string) => Promise<string>;
}
/** Seed-only signer stays resolvable after the network profile's DID document is removed. */
export const createResetSigner = async (
    seed: string,
    wasm: Uint8Array,
    expectedDid: string
): Promise<ResetSigner> => {
    const signing = await initLearnCard({ seed, didkit: wasm });
    if (signing.id.did() !== expectedDid || !expectedDid.startsWith('did:key:'))
        throw new ResetFailure('changed');
    return {
        did: expectedDid,
        proof: async challenge => {
            const vp = await signing.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
            if (typeof vp !== 'string') throw new ResetFailure('recovery');
            return vp;
        },
    };
};

export const resetWalletAdapter = async (
    wallet: ConsumerWallet,
    signer: ResetSigner
): Promise<ResetWallet> => {
    if (!wallet.index.LearnCloud.getPage || !wallet.index.LearnCloud.remove)
        throw new ResetFailure('unavailable');
    const client = await getClient('https://staging.network.learncard.com/trpc', signer.proof);
    return {
        did: () => signer.did,
        // The network plugin caches getProfile(). Reconciliation must read the server.
        profile: () => client.profile.getProfile.query(),
        collectionEmpty: async () =>
            (await wallet.index.LearnCloud.getPage!({}, { limit: 1 })).records.length === 0,
        clearCollection: () => clearResetCollection(wallet.index.LearnCloud),
        deleteProfile: () => client.profile.deleteProfile.mutate(),
    };
};

/** removeAll only clears the current DID; per-record remove also covers associated DIDs. */
export const clearResetCollection = async (index: ConsumerWallet['index']['LearnCloud']) => {
    if (!index.getPage || !index.remove) throw new ResetFailure('unavailable');
    // Always reread the first page after deleting; cursors from a changing index are unsafe.
    // A very large cleanup can require another explicit Continue reset, retaining its receipt.
    for (let page = 0; page < 10; page++) {
        const records = (await index.getPage({}, { limit: 50 })).records;
        if (!records.length) return;
        const ids = [...new Set(records.map(record => record.id))];
        if (ids.some(id => typeof id !== 'string' || !id)) throw new ResetFailure('changed');
        for (let start = 0; start < ids.length; start += 10) {
            const results = await Promise.allSettled(
                ids.slice(start, start + 10).map(id => index.remove!(id))
            );
            if (results.some(result => result.status === 'rejected' || result.value === false))
                throw new ResetFailure('connection');
        }
    }
};

/** Current DID-challenge API only. Firebase's identity-management host is intentionally absent. */
export const deleteStagingRecovery = async (
    signer: ResetSigner,
    token: string,
    expectedDid: string,
    request: typeof fetch = fetch
) => {
    const did = signer.did;
    if (did !== expectedDid || !token) throw new ResetFailure('changed');
    const headers = (vp: string) => ({
        Authorization: `Bearer ${vp}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': 'learncard',
    });
    const response = await request('https://staging.api.learncard.app/api/keys/challenge', {
        method: 'POST',
        headers: headers(await signer.proof()),
        body: JSON.stringify({ did }),
    });
    if (!response.ok) throw new ResetFailure('connection');
    const { challenge } = (await response.json()) as { challenge?: string };
    if (!challenge || challenge.length > 1024) throw new ResetFailure('connection');
    const removed = await request('https://staging.api.learncard.app/api/keys/delete', {
        method: 'POST',
        headers: headers(await signer.proof(challenge)),
        body: JSON.stringify({ authToken: token, providerType: 'firebase', challenge }),
    });
    if (!removed.ok || ((await removed.json()) as { success?: boolean }).success !== true)
        throw new ResetFailure('connection');
};
