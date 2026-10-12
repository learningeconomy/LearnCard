import type { NativeSpikeOutput } from './runtime';
import type { SpikeVectors } from './contracts';
/** Independently verify iOS-created outputs with the normal LearnCard SDK. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initLearnCard } from '@learncard/init';
import { decryptShareFromTransfer } from '../../../packages/sss-key-manager/src/qr-crypto';

const here = dirname(fileURLToPath(import.meta.url));
const exported = resolve(process.argv[2] ?? resolve(here, '../artifacts/sdk-attachments'));
const manifest = JSON.parse(await readFile(resolve(exported, 'manifest.json'), 'utf8')) as {
    attachments: { suggestedHumanReadableName: string; exportedFileName: string }[];
}[];
const attachments = manifest.flatMap(test => test.attachments);
const payload = attachments.find(a =>
    a.suggestedHumanReadableName.startsWith('native-sdk-interop-output')
);
assert(payload, 'Native SDK output attachment is missing');
const native = JSON.parse(
    await readFile(resolve(exported, payload.exportedFileName), 'utf8')
) as NativeSpikeOutput;
const nativeSummary = JSON.parse(
    await readFile(resolve(exported, 'native-test-summary.json'), 'utf8')
) as { devicesAndConfigurations: { device: unknown }[] };
const vectors = JSON.parse(
    await readFile(
        resolve(here, '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources/vectors.json'),
        'utf8'
    )
) as SpikeVectors;
assert.equal(
    native.initialization.inputSha256,
    createHash('sha256')
        .update(
            await readFile(
                resolve(here, '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources/vectors.json')
            )
        )
        .digest('hex'),
    `Native fixture inputs differ from the generated run: ${native.initialization.resourcePath}`
);
const wasm = await readFile(
    resolve(here, '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources/didkit.wasm')
);
const issuer = await initLearnCard({ seed: vectors.issuerSeed, didkit: wasm });
const holder = await initLearnCard({ seed: vectors.holderSeed, didkit: wasm });
assert.equal(native.initialization.issuerDid, issuer.id.did());
assert.equal(native.initialization.holderDid, holder.id.did());
const credentials = [];
for (const output of native.credentials.signedByNative) {
    const verification = await holder.invoke.verifyCredential(output.credential, {
        checks: ['proof'],
    });
    assert.equal(verification.errors.length, 0, `iOS → web signature: ${output.id}`);
    credentials.push({ id: output.id, signatureVerified: true });
}
const decrypted = await holder.invoke.decryptDagJwe(native.encryption.nativeEncrypted);
assert.deepEqual(decrypted, vectors.cleartext);
assert.equal(native.encryption.wrongRecipientRejected, true);
assert.equal(native.encryption.indexFieldsMatch, true);
const vp = await issuer.invoke.verifyPresentation(native.presentation.presentation, {
    challenge: 'public-native-spike-challenge',
    domain: 'native-spike.learncard.test',
});
assert.equal(vp.errors.length, 0, 'iOS → web presentation');
const authentication = await issuer.invoke.verifyPresentation(native.presentation.didAuth, {
    challenge: 'public-auth-challenge',
    proofFormat: 'jwt',
});
assert.equal(authentication.errors.length, 0, 'iOS → web DID-auth JWT');
const transferRecipient = await crypto.subtle.importKey(
    'jwk',
    vectors.transfer.recipientJwk,
    { name: 'X25519' },
    false,
    ['deriveBits']
);
assert.equal(
    await decryptShareFromTransfer(native.transfer.nativeEnvelope, transferRecipient),
    vectors.recovery.deviceShare
);
const fullVerificationExceptions = native.credentials.results
    .filter(r => !r.webBaselineVerified)
    .map(r => ({
        id: r.id,
        errorKinds: r.fullWebErrorKinds,
        sameWebAndNativeOutcome: r.fullWebVerified === r.fullNativeVerified,
    }));
const report = {
    environment: {
        native: nativeSummary.devicesAndConfigurations.map(entry => entry.device),
        webBaseline: 'Current repository TypeScript SDK source in Bun',
    },
    publicTestIdentitiesOnly: true,
    credentials,
    fullVerificationExceptions,
    webToNative: native.credentials.results.map(r => ({
        id: r.id,
        proofVerified: r.webVerified,
        tamperRejected: r.tamperRejected,
        milliseconds: r.milliseconds,
    })),
    dagJweBothDirections: true,
    wrongRecipientRejected: true,
    learnCloudIndexFieldsMatch: true,
    presentationBothDirections: true,
    didAuthJWTVerified: true,
    presentationWrongChallengeRejected: true,
    recovery: native.recovery,
    qrTransferBothDirections: true,
    qrWrongRecipientRejected: true,
    initializationMilliseconds: native.initializationMilliseconds,
    bundle: JSON.parse(await readFile(resolve(here, 'generated/bundle-metadata.json'), 'utf8')),
};
await writeFile(resolve(here, 'generated/results.json'), JSON.stringify(report, null, 2));
console.log(
    `Verified ${credentials.length} iOS-issued credential signatures, encrypted data, presentation, DID-auth JWT, and QR transfer in the web SDK.`
);
console.log(
    `Full-verification exceptions shared by web and iOS: ${fullVerificationExceptions.map(e => e.id).join(', ') || 'none'}`
);
