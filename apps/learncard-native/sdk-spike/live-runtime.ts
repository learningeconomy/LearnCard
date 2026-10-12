import type { LiveVectors } from './contracts';
import { initLearnCard } from '@learncard/init';
import { canonicalJSON, installStagingFetch, staging } from './staging';

let holder: Awaited<ReturnType<typeof initLearnCard>>;
let config: LiveVectors;
let wasm: Uint8Array;
installStagingFetch();

const methods = {
    initialize: async (input: { wasmBase64: string; vectors: LiveVectors }) => {
        config = input.vectors;
        if (config.environment !== 'staging' || Date.now() > config.expiresAt) {
            throw new Error('Missing or expired staging test configuration');
        }
        wasm = Uint8Array.from(atob(input.wasmBase64), c => c.charCodeAt(0));
        holder = await initLearnCard({
            seed: config.holderSeed,
            didkit: wasm,
            network: staging.network,
            trustedBoostRegistry: '',
            cloud: { url: staging.cloud },
            allowRemoteContexts: false,
        });
        const profile = await holder.invoke.getProfile();
        if (!profile) throw new Error('Native staging profile lookup failed');
        const keyOnly = await initLearnCard({ seed: config.holderSeed, didkit: wasm });
        return {
            existingProfileMatches: profile?.profileId === config.holderProfileId,
            signingDidMatches: keyOnly.id.did() === config.holderSigningDid,
            profileDidMatches: holder.id.did() === config.holderProfileDid,
        };
    },
    exchange: async () => {
        const incoming = await holder.invoke.getIncomingCredentials();
        const pendingFound = incoming.some(item => item.uri === config.incomingUri);
        if (!pendingFound) throw new Error('Expected staging test offer was not found');
        const credential = await holder.read.get(config.incomingUri);
        const proof = await holder.invoke.verifyCredential(credential, { checks: ['proof'] });
        if (proof.errors.length) throw new Error('Staging credential signature failed');
        const payloadMatches =
            canonicalJSON(credential) === canonicalJSON(config.incomingCredential);
        if (!payloadMatches) throw new Error('Staging credential payload changed');
        const accepted = await holder.invoke.acceptCredential(config.incomingUri, {
            skipNotification: true,
        });
        const indexed = await holder.index.LearnCloud.add({
            id: config.recordId,
            uri: config.incomingUri,
            title: 'Native staging interoperability test',
            category: 'Achievement',
        });
        const records = await holder.index.LearnCloud.get({ id: config.recordId });
        const received = await holder.invoke.getReceivedCredentials();
        const after = await holder.invoke.getIncomingCredentials();
        const outbound = await holder.invoke.issueCredential({
            ...config.outgoingUnsigned,
            issuer: holder.id.did(),
        });
        const outgoingUri = await holder.invoke.sendCredential(config.issuerProfileId, outbound);
        // Reinitialize from the same disposable identity to exercise existing profile/cloud association.
        const restarted = await initLearnCard({
            seed: config.holderSeed,
            didkit: wasm,
            network: staging.network,
            trustedBoostRegistry: '',
            cloud: { url: staging.cloud },
        });
        await restarted.invoke.getProfile();
        const resumed = await restarted.index.LearnCloud.get({ id: config.recordId });
        const restored = await restarted.read.get(config.incomingUri);
        return {
            pendingFound,
            payloadMatches,
            proofVerified: proof.errors.length === 0,
            accepted,
            indexed,
            collectionFound: records.some(item => item.uri === config.incomingUri),
            receivedFound: received.some(item => item.uri === config.incomingUri),
            pendingCleared: !after.some(item => item.uri === config.incomingUri),
            resumedCollection: resumed.some(item => item.uri === config.incomingUri),
            resumedPayload: canonicalJSON(restored) === canonicalJSON(config.incomingCredential),
            outgoingUri,
            outgoingCredential: outbound,
        };
    },
};

Object.defineProperty(globalThis, 'LearnCardSpike', {
    value: {
        call: async (method: string, input: unknown) => {
            if (!Object.hasOwn(methods, method))
                throw new Error('Unsupported staging test command');
            if (method !== 'initialize' && !holder)
                throw new Error('Initialize the staging test first');
            return JSON.stringify(
                await methods[method as keyof typeof methods](
                    input as Parameters<typeof methods.initialize>[0]
                )
            );
        },
    },
    writable: false,
});
