/** Run from repository root: bun --conditions=development apps/learn-card-app/tests/share-links-harness/crypto-smoke.ts */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import {
    prepareShare,
    createVerificationBudget,
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
assert.equal(
    await verifySharedPresentation(adapter, validated.manifest, createVerificationBudget()),
    'verified'
);
assert.equal(
    await verifyCredentialTree(adapter, credential, createVerificationBudget()),
    'verified'
);
const tampered = structuredClone(credential);
tampered.credentialSubject = { id: 'did:example:someone-else' };
assert.equal(await verifyCredentialTree(adapter, tampered, createVerificationBudget()), 'failed');
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

// Real JSON-LD signing regression: v2-only and mixed-version collections.
const credentialV2 = await wallet.invoke.issueCredential({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: wallet.id.did(),
    credentialSubject: { id: wallet.id.did() },
});
for (const credentials of [[credentialV2], [credential, credentialV2]]) {
    const mixedAdapter = {
        ...adapter,
        read: { get: async (ref: string) => credentials[Number(ref)] },
    };
    const mixed = await prepareShare(
        mixedAdapter,
        credentials.map((_, i) => String(i)),
        'Mixed',
        ''
    );
    const payload = await decryptSharePayload({
        shareId: mixed.input.id,
        contentVersion: 1,
        key: mixed.key,
        envelope: mixed.input.envelope,
    });
    const result = validateShareManifest(payload, { shareId: mixed.input.id, contentVersion: 1 });
    assert(result.ok);
    assert.deepEqual(result.manifest.presentation.verifiableCredential, credentials);
    assert.equal(
        await verifySharedPresentation(mixedAdapter, result.manifest, createVerificationBudget()),
        'verified'
    );
    for (const vc of credentials)
        assert.equal(
            await verifyCredentialTree(mixedAdapter, vc, createVerificationBudget()),
            'verified'
        );
}
console.log('PASS: v2 and mixed-version presentations preserve originals and verify.');
