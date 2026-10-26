#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const didkitDir = path.resolve(scriptDir, '..', 'src', 'didkit', 'pkg');
const wasmModule = await import(
    `${pathToFileURL(path.join(didkitDir, 'didkit_wasm.js')).href}?probe=${Date.now()}`
);
const wasmBytes = new Uint8Array(await readFile(path.join(didkitDir, 'didkit_wasm_bg.wasm')));

await wasmModule.default({ module_or_path: wasmBytes });

const w3cCredential = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://www.w3.org/ns/credentials/examples/v2',
        'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: 'urn:uuid:58172aac-d8ba-11ed-83dd-0b3aef56cc33',
    type: ['VerifiableCredential', 'AlumniCredential'],
    name: 'Alumni Credential',
    description: 'A minimum viable example of an Alumni Credential.',
    issuer: 'https://vc.example/issuers/5678',
    validFrom: '2023-01-01T00:00:00Z',
    credentialSubject: {
        id: 'did:example:abcdefgh',
        alumniOf: 'The School of Examples',
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2023-02-24T23:36:38Z',
        verificationMethod:
            'did:key:z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2#z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z57Mm1vboMtZiCyJ4aReZsv8co4Re64Y8GEjL1ZARzMbXZgkARFLqFs1P345NpPGG2hgCrS4nNdvJhpwnrNyG3kEF',
    },
};
const w3cResult = JSON.parse(
    await wasmModule.verifyCredential(
        JSON.stringify(w3cCredential),
        JSON.stringify({ checks: ['proof'] }),
        '{}'
    )
);

if (w3cResult.errors.length !== 0 || !w3cResult.checks.includes('proof')) {
    throw new Error(`URL issuer proof regression: ${JSON.stringify(w3cResult)}`);
}

if (!w3cResult.warnings.some(warning => warning.includes('Issuer authorization'))) {
    throw new Error(`Missing URL issuer warning: ${JSON.stringify(w3cResult)}`);
}

const w3cIssuerDocument = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: w3cCredential.issuer,
    assertionMethod: [w3cCredential.proof.verificationMethod],
};
const w3cAuthorizedResult = JSON.parse(
    await wasmModule.verifyCredential(
        JSON.stringify(w3cCredential),
        JSON.stringify({ checks: ['proof', 'issuerAuthorization'] }),
        JSON.stringify({
            [w3cCredential.issuer]: JSON.stringify(w3cIssuerDocument),
        })
    )
);

if (
    w3cAuthorizedResult.errors.length !== 0 ||
    !w3cAuthorizedResult.checks.includes('proof') ||
    !w3cAuthorizedResult.checks.includes('issuerAuthorization')
) {
    throw new Error(
        `URL issuer DID key authorization regression: ${JSON.stringify(w3cAuthorizedResult)}`
    );
}

const issuer = 'https://issuer.example/keys';
const verificationMethod = `${issuer}#key-1`;
const key = JSON.parse(wasmModule.generateEd25519KeyFromBytes(new Uint8Array(32).fill(7)));
const publicKey = { ...key };
delete publicKey.d;

const issuerDocument = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: issuer,
    verificationMethod: [
        {
            id: verificationMethod,
            controller: issuer,
            type: 'JsonWebKey2020',
            publicKeyJwk: publicKey,
        },
    ],
    assertionMethod: [verificationMethod],
};
const documentMap = { [issuer]: JSON.stringify(issuerDocument) };
const credential = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    type: ['VerifiableCredential'],
    issuer,
    validFrom: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
};
const issued = JSON.parse(
    await wasmModule.issueCredential(
        JSON.stringify(credential),
        JSON.stringify({
            type: 'Ed25519Signature2020',
            proofPurpose: 'assertionMethod',
            verificationMethod,
        }),
        JSON.stringify(key),
        JSON.stringify(documentMap)
    )
);
const authorizedResult = JSON.parse(
    await wasmModule.verifyCredential(
        JSON.stringify(issued),
        JSON.stringify({ checks: ['proof', 'issuerAuthorization'] }),
        JSON.stringify(documentMap)
    )
);

if (
    authorizedResult.errors.length !== 0 ||
    !authorizedResult.checks.includes('proof') ||
    !authorizedResult.checks.includes('issuerAuthorization')
) {
    throw new Error(`Issuer authorization regression: ${JSON.stringify(authorizedResult)}`);
}

const unauthorizedResult = JSON.parse(
    await wasmModule.verifyCredential(
        JSON.stringify(issued),
        JSON.stringify({ checks: ['proof', 'issuerAuthorization'] }),
        JSON.stringify({
            [issuer]: JSON.stringify({ ...issuerDocument, assertionMethod: [] }),
        })
    )
);

if (unauthorizedResult.errors.length === 0) {
    throw new Error(`Unauthorized issuer was accepted: ${JSON.stringify(unauthorizedResult)}`);
}

console.log('DIDKit WASM verifies URL issuers and enforces issuerAuthorization on demand.');
