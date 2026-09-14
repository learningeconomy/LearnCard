#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import init, {
    generateEd25519Key,
    getVersion,
    issueCredential,
    issuePresentation,
    keyToDID,
    keyToVerificationMethod,
    verifyPresentation,
} from '../src/didkit/pkg/didkit_wasm.js';

const wasmPath = new URL('../src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url);
const wasm = new Uint8Array(await readFile(wasmPath));

await init({ module_or_path: wasm });

const key = generateEd25519Key();
const did = keyToDID('key', key);

if (!did.startsWith('did:key:')) throw new Error(`DIDKit generated an invalid DID: ${did}`);

console.log(`DIDKit WASM ${getVersion()} generated ${did}`);

// Exercise the CLR sharing path, not just initialization: an embedded signed
// credential must survive presentation issuance unchanged and remain verifiable.
const credential = JSON.parse(
    await readFile(new URL('../../../../lib/ssi/examples/vc-clr.jsonld', import.meta.url), 'utf8')
);
delete credential.proof;
credential.issuer.id = did;
const options = JSON.stringify({
    type: 'Ed25519Signature2020',
    verificationMethod: await keyToVerificationMethod('key', key),
    proofPurpose: 'assertionMethod',
});
const signedCredential = JSON.parse(
    await issueCredential(JSON.stringify(credential), options, key, '{}')
);
const presentation = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiablePresentation'],
    holder: did,
    verifiableCredential: [signedCredential],
};
const signed = JSON.parse(
    await issuePresentation(JSON.stringify(presentation), options, key, '{}')
);
assert.deepEqual(signed.verifiableCredential, presentation.verifiableCredential);
const verification = JSON.parse(await verifyPresentation(JSON.stringify(signed), options, '{}'));
assert.deepEqual(verification.errors, []);
assert.ok(verification.checks.includes('proof'));

signed.verifiableCredential[0].name = 'Changed transcript';
const tampered = JSON.parse(await verifyPresentation(JSON.stringify(signed), options, '{}'));
assert.ok(tampered.errors.length > 0, 'A modified embedded credential must fail verification');
console.log('DIDKit WASM issued and verified a CLR presentation and rejected tampering.');
