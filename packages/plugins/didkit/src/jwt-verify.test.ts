import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { JWKWithPrivateKey, UnsignedVC, VC } from '@learncard/types';
import { beforeAll, describe, expect, it } from 'vitest';

import {
    contextLoader,
    generateEd25519KeyFromBytes,
    keyToDID,
    keyToVerificationMethod,
} from './didkit/index';
import { getDidKitPlugin } from './plugin';
import { ProofOptions } from './types';

const FIXTURE_SEED = new Uint8Array(32).fill(7);
const OTHER_SEED = new Uint8Array(32).fill(9);

type DidKit = Awaited<ReturnType<typeof getDidKitPlugin>>;
type LearnCardArg = Parameters<DidKit['methods']['issueCredential']>[0];

/**
 * Minimal stand-in for the LearnCard core context plugin. DIDKit's static
 * context loader covers the W3C credential contexts used by these fixtures, so
 * the plugin can issue and verify without any network access.
 */
const fakeLearnCard = {
    context: {
        resolveDocument: async (url: string) => {
            try {
                return JSON.parse((await contextLoader(url)) ?? '') || undefined;
            } catch {
                return undefined;
            }
        },
    },
    debug: () => undefined,
} as unknown as LearnCardArg;

let plugin: DidKit;
let key: JWKWithPrivateKey;
let did: string;
let verificationMethod: string;
let otherVerificationMethod: string;

const issueOptions = (): ProofOptions => ({
    proofFormat: 'jwt',
    verificationMethod,
    proofPurpose: 'assertionMethod',
});

const v1Credential = (): UnsignedVC =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
        type: ['VerifiableCredential'],
        issuer: did,
        issuanceDate: '2020-01-01T00:00:00Z',
        expirationDate: '2100-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject' },
    }) as unknown as UnsignedVC;

const v2Credential = (): UnsignedVC =>
    ({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:22222222-2222-2222-2222-222222222222',
        type: ['VerifiableCredential'],
        issuer: did,
        validFrom: '2020-01-01T00:00:00Z',
        validUntil: '2100-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject' },
    }) as unknown as UnsignedVC;

const issueJwt = async (credential: UnsignedVC) =>
    (await plugin.methods.issueCredential(
        fakeLearnCard,
        credential,
        issueOptions(),
        key
    )) as unknown as string;

const verify = (credential: VC | string, options: ProofOptions = {}) =>
    plugin.methods.verifyCredential(fakeLearnCard, credential, options);

const expectFailure = (result: { checks: string[]; errors: string[] }) => {
    expect(result.checks).not.toContain('JWS');
    expect(result.errors.length).toBeGreaterThan(0);
};

beforeAll(async () => {
    const wasmBytes = new Uint8Array(
        await readFile(new URL('./didkit/pkg/didkit_wasm_bg.wasm', import.meta.url))
    );

    plugin = await getDidKitPlugin(wasmBytes);

    const keyJson = generateEd25519KeyFromBytes(FIXTURE_SEED) as unknown as string;
    key = JSON.parse(keyJson) as JWKWithPrivateKey;
    did = keyToDID('key', keyJson);
    verificationMethod = (await keyToVerificationMethod('key', keyJson)) as string;

    const otherKeyJson = generateEd25519KeyFromBytes(OTHER_SEED) as unknown as string;
    otherVerificationMethod = (await keyToVerificationMethod('key', otherKeyJson)) as string;
});

describe('didkit-plugin compact VC-JWT verification', () => {
    it('issues and verifies a raw compact VCDM 1.1 VC-JWT without JSON-stringifying it', async () => {
        const jwt = await issueJwt(v1Credential());

        expect(jwt.split('.')).toHaveLength(3);

        const result = await verify(jwt, { proofFormat: 'jwt' });

        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('JWS');
    });

    it('verifies a compact VCDM 2.0 VC-JWT', async () => {
        const jwt = await issueJwt(v2Credential());

        const result = await verify(jwt, { proofFormat: 'jwt' });

        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('JWS');
    });

    it('rejects a tampered signature', async () => {
        const jwt = await issueJwt(v1Credential());
        const [header, payload, signature] = jwt.split('.');
        const tampered = `${header}.${payload}.${signature.slice(0, -4)}AAAA`;

        expectFailure(await verify(tampered, { proofFormat: 'jwt' }));
    });

    it('rejects a tampered payload', async () => {
        const jwt = await issueJwt(v1Credential());
        const [header, payload, signature] = jwt.split('.');
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        claims.sub = 'did:example:attacker';
        const tampered = `${header}.${Buffer.from(JSON.stringify(claims)).toString(
            'base64url'
        )}.${signature}`;

        expectFailure(await verify(tampered, { proofFormat: 'jwt' }));
    });

    it('rejects a token authorized to a different key', async () => {
        const jwt = await issueJwt(v1Credential());

        expectFailure(
            await verify(jwt, { proofFormat: 'jwt', verificationMethod: otherVerificationMethod })
        );
    });

    it('rejects a token whose issuer claim was swapped', async () => {
        const jwt = await issueJwt(v1Credential());
        const [header, payload, signature] = jwt.split('.');
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        claims.iss = 'did:example:attacker';
        claims.vc.issuer = 'did:example:attacker';
        const tampered = `${header}.${Buffer.from(JSON.stringify(claims)).toString(
            'base64url'
        )}.${signature}`;

        expectFailure(await verify(tampered, { proofFormat: 'jwt' }));
    });

    it('rejects an expired compact VC-JWT', async () => {
        const jwt = await issueJwt({ ...v1Credential(), expirationDate: '2000-01-01T00:00:00Z' });

        expectFailure(await verify(jwt, { proofFormat: 'jwt' }));
    });

    it('rejects an alg=none token instead of accepting an unsigned credential', async () => {
        const jwt = await issueJwt(v1Credential());
        const [, payload] = jwt.split('.');
        const header = Buffer.from(
            JSON.stringify({ alg: 'none', kid: verificationMethod })
        ).toString('base64url');

        expectFailure(await verify(`${header}.${payload}.`, { proofFormat: 'jwt' }));
    });

    it('rejects an HS256 symmetric-confusion token signed with the public key', async () => {
        const jwt = await issueJwt(v1Credential());
        const [, payload] = jwt.split('.');
        const header = Buffer.from(
            JSON.stringify({ alg: 'HS256', kid: verificationMethod })
        ).toString('base64url');
        const signingInput = `${header}.${payload}`;
        const secret = new Uint8Array(Buffer.from(key.x, 'base64url'));
        const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

        expectFailure(await verify(`${signingInput}.${signature}`, { proofFormat: 'jwt' }));
    });

    it('rejects an unsupported proof format clearly', async () => {
        const jwt = await issueJwt(v1Credential());

        await expect(verify(jwt, { proofFormat: 'cose' })).rejects.toThrow();
    });

    it('still verifies JSON-LD linked-data-proof credentials', async () => {
        const signed = await plugin.methods.issueCredential(
            fakeLearnCard,
            v1Credential(),
            { proofFormat: 'ldp', verificationMethod, proofPurpose: 'assertionMethod' },
            key
        );

        const result = await verify(signed, { proofFormat: 'ldp' });

        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('proof');

        const tampered: VC = { ...signed, expirationDate: '2001-01-01T00:00:00Z' };
        expectFailure(await verify(tampered, { proofFormat: 'ldp' }));
    });
});
