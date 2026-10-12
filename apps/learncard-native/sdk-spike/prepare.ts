/** Generate disposable, public test vectors from the current SDK, and bundle the same source for iOS. */
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { initLearnCard } from '@learncard/init';
import { getFixture, prepareFixture } from '@learncard/credential-library';
import { splitPrivateKey } from '../../../packages/sss-key-manager/src/sss';
import { encryptWithPassword, bufferToBase64 } from '../../../packages/sss-key-manager/src/crypto';
import { shareToRecoveryPhrase } from '../../../packages/sss-key-manager/src/recovery-phrase';
import { generateEncryptedFieldsArray } from '../../../packages/plugins/learn-cloud/src/helpers';
import { encryptShareForTransfer } from '../../../packages/sss-key-manager/src/qr-crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const resources = resolve(here, '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources');
await mkdir(resources, { recursive: true });
const wasmPath = resolve(root, 'packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm');
const wasm = await readFile(wasmPath);
const publicIssuerSeed = 'a'.repeat(64);
const publicHolderSeed = 'b'.repeat(64);
const issuer = await initLearnCard({
    seed: publicIssuerSeed,
    didkit: wasm,
    allowRemoteContexts: false,
});
const holder = await initLearnCard({
    seed: publicHolderSeed,
    didkit: wasm,
    allowRemoteContexts: false,
});
const fixtureIDs = [
    'vc-v1/basic',
    'vc-v2/basic',
    'vc-v2/with-evidence',
    'vc-v2/multiple-subjects',
    'obv3/minimal-badge',
    'obv3/full-badge',
    'boost/basic',
    'boost/with-skills',
    'clr/minimal',
    'clr/westbridge-full',
];
const fixtures = [];
for (const id of fixtureIDs) {
    const unsigned = prepareFixture(getFixture(id), {
        issuerDid: issuer.id.did(),
        subjectDid: holder.id.did(),
    });
    try {
        const signed = await issuer.invoke.issueCredential(unsigned);
        const verified = await holder.invoke.verifyCredential(signed);
        const proof = await holder.invoke.verifyCredential(signed, { checks: ['proof'] });
        fixtures.push({
            id,
            unsigned,
            signed,
            webVerification: verified,
            webProofVerification: proof,
        });
    } catch (error) {
        // Synthetic input only. Fail the spike preparation on an unexpected web baseline failure.
        throw new Error(`Web SDK baseline failed for ${id}`, { cause: error });
    }
}
const cleartext = {
    title: 'LearnCard interoperability sample 🧭',
    count: 7,
    nested: { complete: true },
};
const encrypted = await issuer.invoke.createDagJwe(cleartext, [holder.id.did()]);
const indexRecord = {
    id: 'native-spike-index-record',
    uri: 'lc:test:fixture',
    category: 'Achievement',
};
const encryptedIndexFields = await generateEncryptedFieldsArray(holder, indexRecord);
const publicPassword = 'native-spike-public-test-password';
const shares = await splitPrivateKey(publicHolderSeed);
const encryptedRecovery = await encryptWithPassword(shares.recoveryShare, publicPassword);
const recoveryPhrase = await shareToRecoveryPhrase(shares.recoveryShare);
// Only the synthetic interoperability fixture is extractable so both runtimes can import it.
// Production QR code uses generateEphemeralKeypair(), which keeps private keys nonextractable.
const transferKeys = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
    'deriveBits',
])) as CryptoKeyPair;
const transferPublicKey = bufferToBase64(
    await crypto.subtle.exportKey('raw', transferKeys.publicKey)
);
const transfer = {
    recipientJwk: await crypto.subtle.exportKey('jwk', transferKeys.privateKey),
    recipientPublicKey: transferPublicKey,
    encryptedShare: await encryptShareForTransfer(shares.deviceShare, transferPublicKey),
};
const vectors = {
    notice: 'Disposable public test identities only. Never replace these with a real account seed or recovery data.',
    issuerSeed: publicIssuerSeed,
    holderSeed: publicHolderSeed,
    issuerDid: issuer.id.did(),
    holderDid: holder.id.did(),
    fixtures,
    cleartext,
    encrypted,
    indexRecord,
    encryptedIndexFields,
    recovery: {
        publicPassword,
        authShare: shares.authShare,
        deviceShare: shares.deviceShare,
        recoveryShare: shares.recoveryShare,
        encryptedRecovery,
        recoveryPhrase,
    },
    transfer,
    wasmSha256: createHash('sha256').update(wasm).digest('hex'),
};
await writeFile(resolve(resources, 'vectors.json'), JSON.stringify(vectors));
await copyFile(wasmPath, resolve(resources, 'didkit.wasm'));
await build({
    entryPoints: [resolve(here, 'runtime.ts')],
    outfile: resolve(resources, 'sdk.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['safari18'],
    conditions: ['development', 'browser'],
    alias: { '@learncard/didkit-plugin-node': resolve(here, 'node-unavailable.ts') },
    logLevel: 'warning',
});
const bundle = await readFile(resolve(resources, 'sdk.js'));
await mkdir(resolve(here, 'generated'), { recursive: true });
await writeFile(
    resolve(here, 'generated/bundle-metadata.json'),
    JSON.stringify(
        {
            wasmBytes: wasm.length,
            sdkBytes: bundle.length,
            fixtureCount: fixtures.length,
            wasmSha256: vectors.wasmSha256,
            builtFrom: 'current repository TypeScript source, conditions=development',
        },
        null,
        2
    )
);
console.log(
    `Prepared ${fixtures.length} SDK fixtures; SDK ${bundle.length} bytes; WASM ${wasm.length} bytes.`
);
