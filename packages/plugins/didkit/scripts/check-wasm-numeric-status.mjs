#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const didkitDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'didkit');
const wasmModule = await import(pathToFileURL(path.join(didkitDir, 'pkg', 'didkit_wasm.js')));
const wasmBytes = await readFile(path.join(didkitDir, 'pkg', 'didkit_wasm_bg.wasm'));

await wasmModule.default({ module_or_path: wasmBytes });

const key = JSON.parse(wasmModule.generateEd25519KeyFromBytes(new Uint8Array(32).fill(1)));
const issuer = wasmModule.keyToDID('key', JSON.stringify(key));
const verificationMethod = await wasmModule.keyToVerificationMethod('key', JSON.stringify(key));
const contextUrl = 'https://www.w3.org/ns/credentials/v2';
const contextMap = { [contextUrl]: await wasmModule.contextLoader(contextUrl) };
const statusListCredential = 'did:example:status-list';
const credential = {
    '@context': [contextUrl],
    type: ['VerifiableCredential'],
    issuer,
    validFrom: '2026-08-03T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
    credentialStatus: {
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: 436,
        statusListCredential,
    },
};
const proofOptions = {
    proofFormat: 'ldp',
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-rdfc-2022',
    verificationMethod,
};
const issued = JSON.parse(
    await wasmModule.issueCredential(
        JSON.stringify(credential),
        JSON.stringify(proofOptions),
        JSON.stringify(key),
        JSON.stringify(contextMap)
    )
);
const result = JSON.parse(
    await wasmModule.verifyCredential(
        JSON.stringify(issued),
        JSON.stringify({ checks: ['credentialStatus'] }),
        JSON.stringify(contextMap)
    )
);
const expectedError = `Invalid schema: ${statusListCredential}`;

if (!result.errors.includes(expectedError)) {
    console.error(
        [
            'The checked-in DIDKit WASM does not accept numeric Bitstring Status List indexes.',
            `Expected status validation to reach: ${expectedError}`,
            `Received: ${JSON.stringify(result.errors)}`,
            '',
            'Rebuild and optimize lib/didkit/lib/web, then copy the generated glue and WASM',
            'into packages/plugins/didkit/src/didkit/pkg.',
        ].join('\n')
    );
    process.exit(1);
}

console.log('DIDKit WASM accepts numeric Bitstring Status List indexes.');
