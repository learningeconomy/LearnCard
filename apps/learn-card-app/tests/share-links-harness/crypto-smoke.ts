/** Run from repository root: bun --conditions=development apps/learn-card-app/tests/share-links-harness/crypto-smoke.ts */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import {
    prepareShare,
    shareWallet,
    verifyCredentialTree,
    verifySharedPresentation,
} from '../../src/components/share-links/shareLinkFlow';
import {
    decryptSharePayload,
    validateShareManifest,
} from '../../../../packages/learn-card-base/src/helpers/share-links';

const wallet = await initLearnCard({
    seed: 'a'.repeat(64),
    didkit: readFile('packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'),
});
const credential = await wallet.invoke.issueCredential({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    id: 'urn:lc2187:ui-fixture',
    issuanceDate: new Date().toISOString(),
    issuer: wallet.id.did(),
    credentialSubject: { id: wallet.id.did() },
});
const adapter = shareWallet({
    id: wallet.id,
    read: { get: async () => credential },
    index: { LearnCloud: { get: async () => [] } },
    invoke: {
        getProfile: async () => ({ profileId: 'fixture-owner', displayName: 'Fixture Owner' }),
        issuePresentation: wallet.invoke.issuePresentation,
        createDagJwe: wallet.invoke.createDagJwe,
        decryptDagJwe: wallet.invoke.decryptDagJwe,
        verifyCredential: wallet.invoke.verifyCredential,
        verifyPresentation: wallet.invoke.verifyPresentation,
    },
});
const prepared = await prepareShare(adapter, ['private:fixture-only'], 'Fixture', '');
const plaintext = await decryptSharePayload({
    shareId: prepared.input.id,
    contentVersion: 1,
    key: prepared.key,
    envelope: prepared.input.envelope,
});
const validated = validateShareManifest(plaintext, {
    shareId: prepared.input.id,
    contentVersion: 1,
});
assert(validated.ok);
assert.deepEqual(validated.manifest.presentation.verifiableCredential[0], credential);
assert.equal(await verifySharedPresentation(adapter, validated.manifest), 'verified');
assert.equal(await verifyCredentialTree(adapter, credential), 'verified');
const tampered = structuredClone(credential);
tampered.credentialSubject = { id: 'did:example:someone-else' };
assert.equal(await verifyCredentialTree(adapter, tampered), 'failed');
const recovery = await wallet.invoke.decryptDagJwe<{
    selection: { ref: string }[];
    latest: { key: string };
}>(prepared.input.ownerEncryptedRecovery);
assert.equal(recovery.selection[0].ref, 'private:fixture-only');
assert.equal(recovery.latest.key, prepared.key);
assert(!JSON.stringify(plaintext).includes('private:fixture-only'));
console.log(
    'PASS: real DIDKit holder/issuer proofs, tamper rejection, AES-GCM roundtrip, owner DAG-JWE recovery, original preservation.'
);
