// LC-2195: native-addon end-to-end expired-held -> HTTP response -> valid replacement.
//
// Runs the real VC-plugin `refreshCredential` primitive against the freshly built
// N-API addon over a loopback text/plain 1EdTech endpoint. This proves the native
// artifact exercises the renewal path and the full refresh flow, not just the
// low-level verifyCredentialForRenewal binding.
//
// Run after `bunx nx run didkit-plugin-node:build` and `bunx nx run vc-plugin:build`.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { refreshCredential } from '@learncard/vc-plugin';

import { getDidKitPlugin } from './dist/plugin.js';

const SEED = new Uint8Array(32).fill(23);

const plugin = await getDidKitPlugin();

const fakeLearnCard = {
    context: {
        resolveDocument: async url => {
            try {
                return await plugin.methods.contextLoader(fakeLearnCard, url);
            } catch {
                return undefined;
            }
        },
    },
    debug: () => undefined,
};

const key = plugin.methods.generateEd25519KeyFromBytes(fakeLearnCard, SEED);
const did = plugin.methods.keyToDid(fakeLearnCard, 'key', key);
const verificationMethod = await plugin.methods.keyToVerificationMethod(fakeLearnCard, 'key', key);

const issue = credential =>
    plugin.methods.issueCredential(
        fakeLearnCard,
        credential,
        { proofFormat: 'jwt', verificationMethod, proofPurpose: 'assertionMethod' },
        key
    );

const v1 = (overrides = {}) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
    type: ['VerifiableCredential'],
    issuer: did,
    issuanceDate: '2026-01-01T00:00:00Z',
    expirationDate: '2100-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:holder' },
    ...overrides,
});

let replacementToken = '';
let hits = 0;

const server = createServer((req, res) => {
    if (req.url !== '/refresh') {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('not found');
        return;
    }

    hits += 1;
    res.writeHead(200, {
        'content-type': 'text/plain; charset=UTF-8',
        'cache-control': 'no-store',
    });
    res.end(replacementToken);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const refreshUrl = `http://127.0.0.1:${server.address().port}/refresh`;

try {
    replacementToken = await issue(
        v1({
            issuanceDate: '2026-06-01T00:00:00Z',
            credentialSubject: { id: 'did:example:holder', achievement: { name: 'Renewed' } },
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );

    const held = await issue(
        v1({
            issuanceDate: '2019-01-01T00:00:00Z',
            expirationDate: '2020-01-01T00:00:00Z',
            refreshService: { id: refreshUrl, type: '1EdTechCredentialRefresh' },
        })
    );

    const lc = {
        id: { did: () => did },
        invoke: {
            verifyCredential: (credential, options) =>
                plugin.methods.verifyCredential(fakeLearnCard, credential, options),
            verifyCredentialForRenewal: (credential, options) =>
                plugin.methods.verifyCredentialForRenewal(fakeLearnCard, credential, options),
        },
    };

    const result = await refreshCredential(lc)(lc, held, {
        allowInsecureHttp: true,
        allowPrivateAddresses: true,
    });

    assert.equal(result.status, 'updated', JSON.stringify(result));
    assert.equal(result.credential.proof.jwt, replacementToken);
    assert.equal(hits, 1, 'expected exactly one refresh request');

    console.log('✓ native expired-held -> HTTP text/plain -> valid replacement refresh');
    console.log('✓ native addon exercised verifyCredentialForRenewal end to end');
} finally {
    await new Promise(resolve => server.close(resolve));
}

console.log('\nNative renewal refresh matrix passed.');
