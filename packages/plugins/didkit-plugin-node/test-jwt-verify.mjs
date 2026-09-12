// LC-2195 Task 1: real native-addon compact VC-JWT verification parity matrix.
//
// Exercises the built N-API addon through the package's public plugin API with
// generated Ed25519 did:key fixtures. Run after `bunx nx run didkit-plugin-node:build`
// so that ./dist and the platform .node binary exist.
import assert from 'node:assert/strict';

import { getDidKitPlugin } from './dist/plugin.js';

const SEED = new Uint8Array(32).fill(7);
const OTHER_SEED = new Uint8Array(32).fill(9);

const v1Credential = did => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
    type: ['VerifiableCredential'],
    issuer: did,
    issuanceDate: '2020-01-01T00:00:00Z',
    expirationDate: '2100-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
});

const v2Credential = did => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:22222222-2222-2222-2222-222222222222',
    type: ['VerifiableCredential'],
    issuer: did,
    validFrom: '2020-01-01T00:00:00Z',
    validUntil: '2100-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
});

const plugin = await getDidKitPlugin();

const fakeLearnCard = {
    context: {
        resolveDocument: async (url, _allowRemoteContexts) => {
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
const otherKey = plugin.methods.generateEd25519KeyFromBytes(fakeLearnCard, OTHER_SEED);
const otherVerificationMethod = await plugin.methods.keyToVerificationMethod(
    fakeLearnCard,
    'key',
    otherKey
);

const issueJwt = credential =>
    plugin.methods.issueCredential(
        fakeLearnCard,
        credential,
        { proofFormat: 'jwt', verificationMethod, proofPurpose: 'assertionMethod' },
        key
    );

const verifyJwt = (credential, options = {}) =>
    plugin.methods.verifyCredential(fakeLearnCard, credential, { proofFormat: 'jwt', ...options });

const expectFailure = (result, label) => {
    assert.ok(!result.checks.includes('JWS'), `${label}: JWS must not be reported as checked`);
    assert.ok(result.errors.length > 0, `${label}: expected a verification error`);
};

const checks = [];
const record = (label, fn) => {
    checks.push(
        (async () => {
            await fn();
            console.log(`✓ ${label}`);
        })()
    );
};

record('issues a compact VCDM 1.1 VC-JWT', async () => {
    const jwt = await issueJwt(v1Credential(did));
    assert.equal(jwt.split('.').length, 3);
});

record('verifies a raw compact VCDM 1.1 VC-JWT', async () => {
    const jwt = await issueJwt(v1Credential(did));
    const result = await verifyJwt(jwt);
    assert.deepEqual(result.errors, []);
    assert.ok(result.checks.includes('JWS'));
});

record('verifies a compact VCDM 2.0 VC-JWT', async () => {
    const jwt = await issueJwt(v2Credential(did));
    const result = await verifyJwt(jwt);
    assert.deepEqual(result.errors, []);
    assert.ok(result.checks.includes('JWS'));
});

record('rejects a tampered signature', async () => {
    const jwt = await issueJwt(v1Credential(did));
    const [header, payload, signature] = jwt.split('.');
    const tampered = `${header}.${payload}.${signature.slice(0, -4)}AAAA`;
    expectFailure(await verifyJwt(tampered), 'tampered signature');
});

record('rejects a tampered payload', async () => {
    const jwt = await issueJwt(v1Credential(did));
    const [header, payload, signature] = jwt.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    claims.sub = 'did:example:attacker';
    const tampered = `${header}.${Buffer.from(JSON.stringify(claims)).toString(
        'base64url'
    )}.${signature}`;
    expectFailure(await verifyJwt(tampered), 'tampered payload');
});

record('rejects a token authorized to a different key', async () => {
    const jwt = await issueJwt(v1Credential(did));
    expectFailure(
        await verifyJwt(jwt, { verificationMethod: otherVerificationMethod }),
        'wrong key'
    );
});

record('rejects an expired compact VC-JWT', async () => {
    const jwt = await issueJwt({ ...v1Credential(did), expirationDate: '2000-01-01T00:00:00Z' });
    expectFailure(await verifyJwt(jwt), 'expired');
});

record('rejects an alg=none token', async () => {
    const jwt = await issueJwt(v1Credential(did));
    const [, payload] = jwt.split('.');
    const header = Buffer.from(JSON.stringify({ alg: 'none', kid: verificationMethod })).toString(
        'base64url'
    );
    expectFailure(await verifyJwt(`${header}.${payload}.`), 'alg none');
});

record('rejects an HS256 symmetric-confusion token', async () => {
    const { createHmac } = await import('node:crypto');
    const jwt = await issueJwt(v1Credential(did));
    const [, payload] = jwt.split('.');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', kid: verificationMethod })).toString(
        'base64url'
    );
    const signingInput = `${header}.${payload}`;
    const secret = Buffer.from(key.x, 'base64url');
    const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
    expectFailure(await verifyJwt(`${signingInput}.${signature}`), 'HS256 confusion');
});

record('rejects an unsupported proof format', async () => {
    const jwt = await issueJwt(v1Credential(did));
    await assert.rejects(
        plugin.methods.verifyCredential(fakeLearnCard, jwt, { proofFormat: 'cose' })
    );
});

record('still verifies JSON-LD linked-data-proof credentials', async () => {
    const signed = await plugin.methods.issueCredential(
        fakeLearnCard,
        v1Credential(did),
        { proofFormat: 'ldp', verificationMethod, proofPurpose: 'assertionMethod' },
        key
    );
    const result = await plugin.methods.verifyCredential(fakeLearnCard, signed, {
        proofFormat: 'ldp',
    });
    assert.deepEqual(result.errors, []);
    assert.ok(result.checks.includes('proof'));
});

record('still verifies compact JWT presentations', async () => {
    const presentation = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: did,
    };
    const jwt = await plugin.methods.issuePresentation(
        fakeLearnCard,
        presentation,
        {
            proofFormat: 'jwt',
            verificationMethod,
            proofPurpose: 'authentication',
        },
        key
    );
    assert.equal(typeof jwt, 'string');
    const result = await plugin.methods.verifyPresentation(fakeLearnCard, jwt, {
        proofFormat: 'jwt',
        proofPurpose: 'authentication',
    });
    assert.deepEqual(result.errors, []);
    assert.ok(result.checks.includes('JWS'));
});

await Promise.all(checks);

console.log('\nNative compact VC-JWT parity matrix passed.');
