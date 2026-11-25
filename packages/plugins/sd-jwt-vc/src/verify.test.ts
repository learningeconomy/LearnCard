import { deflateSync } from 'node:zlib';
import { vi } from 'vitest';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { generateKeyPair, exportJWK, importJWK, SignJWT } from 'jose';
import { base58 } from '@scure/base';

import { verifySdJwtVc } from './verify';
import { getSdJwtVcPlugin } from './plugin';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';

type LearnCardMock = any;

const ISSUER_DID = 'did:web:issuer.example.com';
const ISSUER_KID = `${ISSUER_DID}#key-1`;

const makeIssuerSigner = async (crv = 'Ed25519') => {
    const keypair = await generateKeyPair('EdDSA', { crv });
    const privateJwk = await exportJWK(keypair.privateKey);
    const publicJwk = await exportJWK(keypair.publicKey);
    const privateKey = await importJWK(privateJwk, 'EdDSA');

    const signer = async (data: string): Promise<string> => {
        const [headerSegment, payloadSegment] = data.split('.');
        if (!headerSegment || !payloadSegment) throw new Error('Bad JWS input');
        const decode = (segment: string) =>
            JSON.parse(
                Buffer.from(
                    segment.replace(/-/g, '+').replace(/_/g, '/') +
                        '='.repeat((4 - (segment.length % 4)) % 4),
                    'base64'
                ).toString('utf-8')
            );
        const header = decode(headerSegment);
        const payload = decode(payloadSegment);
        const compact = await new SignJWT(payload).setProtectedHeader(header).sign(privateKey);
        return compact.split('.')[2]!;
    };

    return { signer, publicJwk };
};

const buildLearnCardMock = (publicJwk: Record<string, unknown>): LearnCardMock => {
    const didDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: ISSUER_DID,
        verificationMethod: [
            {
                id: ISSUER_KID,
                type: 'JsonWebKey2020',
                controller: ISSUER_DID,
                publicKeyJwk: { ...publicJwk, alg: 'EdDSA' },
            },
        ],
        authentication: [ISSUER_KID],
        assertionMethod: [ISSUER_KID],
    };

    const learnCard = {
        invoke: {
            resolveDid: vi.fn(async (did: string) => {
                if (did !== ISSUER_DID) throw new Error(`Unexpected DID resolve: ${did}`);
                return didDocument;
            }),
        },
    };

    return learnCard as unknown as LearnCardMock;
};

const issueTestCredential = async (
    overrides: Record<string, unknown> = {},
    crv = 'Ed25519'
): Promise<{
    compact: string;
    publicJwk: Record<string, unknown>;
    signer: (data: string) => Promise<string>;
}> => {
    const { signer, publicJwk } = await makeIssuerSigner(crv);

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });

    const compact = await instance.issue(
        {
            iss: ISSUER_DID,
            iat: Math.floor(Date.now() / 1000),
            vct: 'https://example.com/credentials/test-cert',
            given_name: 'Ada',
            family_name: 'Lovelace',
            ...overrides,
        },
        { _sd: ['given_name', 'family_name'] },
        { header: { kid: ISSUER_KID, alg: 'EdDSA' } }
    );

    return { compact, publicJwk, signer };
};

const STATUS_LIST_URI = 'https://status.example.com/lists/1';

const signStatusListJwt = async (
    signer: (data: string) => Promise<string>,
    statusBytes: number[]
): Promise<string> => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const data = `${encode({ alg: 'EdDSA', typ: 'statuslist+jwt', kid: ISSUER_KID })}.${encode({
        iss: ISSUER_DID,
        sub: STATUS_LIST_URI,
        iat: Math.floor(Date.now() / 1000),
        status_list: {
            bits: 1,
            lst: deflateSync(Buffer.from(statusBytes)).toString('base64url'),
        },
    })}`;
    return `${data}.${await signer(data)}`;
};

const stubStatusListFetch = (statusListJwt: string) => {
    const fetchMock = vi.fn(
        async () =>
            new Response(statusListJwt, {
                headers: { 'content-type': 'application/statuslist+jwt' },
            })
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

describe('verifySdJwtVc', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('verifies a credential whose status list is signed by the issuer', async () => {
        const { compact, publicJwk, signer } = await issueTestCredential({
            status: { status_list: { idx: 0, uri: STATUS_LIST_URI } },
        });
        const fetchMock = stubStatusListFetch(await signStatusListJwt(signer, [0]));

        const result = await verifySdJwtVc(buildLearnCardMock(publicJwk), compact);

        expect(fetchMock).toHaveBeenCalledWith(STATUS_LIST_URI, expect.anything());
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });

    it('retains verification of an Ed448-signed credential from a resolvable DID issuer', async () => {
        const { compact, publicJwk } = await issueTestCredential({}, 'Ed448');
        expect(publicJwk.crv).toBe('Ed448');
        const result = await verifySdJwtVc(buildLearnCardMock(publicJwk), compact);
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });

    it.each([[], ['sign']].map(keyOps => ({ keyOps })))(
        'rejects a valid issuer signature when its DID key excludes verification: $keyOps',
        async ({ keyOps }) => {
            const { compact, publicJwk } = await issueTestCredential();
            const learnCard = buildLearnCardMock({ ...publicJwk, key_ops: keyOps });
            await expect(verifySdJwtVc(learnCard, compact)).rejects.toMatchObject({
                code: 'verification_method_not_found',
            });
        }
    );

    it('verifies a DID issuer key that explicitly permits verification', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const result = await verifySdJwtVc(
            buildLearnCardMock({ ...publicJwk, key_ops: ['verify'] }),
            compact
        );
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });

    it('verifies authorized LearnCard Ed25519 multibase keys and rejects a different codec', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);
        const document = await learnCard.invoke.resolveDid(ISSUER_DID);
        const method = document.verificationMethod[0];
        const bytes = new Uint8Array(Buffer.from(publicJwk.x as string, 'base64url'));
        delete method.publicKeyJwk;
        method.type = 'Ed25519VerificationKey2020';
        method.publicKeyMultibase = `z${base58.encode(new Uint8Array([0xed, 0x01, ...bytes]))}`;
        expect((await verifySdJwtVc(learnCard, compact)).errors).toEqual([]);
        method.publicKeyMultibase = `z${base58.encode(new Uint8Array([0xec, 0x01, ...bytes]))}`;
        expect((await verifySdJwtVc(learnCard, compact)).errors.join()).toContain(
            'verification_method_not_found'
        );
    });

    it('retains assertion-method authorization for decoded Ed25519 keys', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);
        const document = await learnCard.invoke.resolveDid(ISSUER_DID);
        const method = document.verificationMethod[0];
        delete method.publicKeyJwk;
        method.type = 'Ed25519VerificationKey2018';
        method.publicKeyBase58 = base58.encode(
            new Uint8Array(Buffer.from(publicJwk.x as string, 'base64url'))
        );
        expect((await verifySdJwtVc(learnCard, compact)).errors).toEqual([]);
        document.assertionMethod = [];
        expect((await verifySdJwtVc(learnCard, compact)).errors.join()).toContain(
            'verification_method_not_authorized'
        );
    });

    it('verifies a well-formed SD-JWT-VC issued by a resolvable DID', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, compact);

        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('parse');
        expect(result.checks).toContain('issuer_resolved');
        expect(result.checks).toContain('issuer_signature');
        expect(result.checks).toContain('disclosure_hash_integrity');
        expect(result.checks).toContain('expiration');
    });

    it('records an error when issuer DID cannot be resolved', async () => {
        const { compact } = await issueTestCredential();
        const learnCard = {
            invoke: {
                resolveDid: vi.fn(async () => {
                    throw new Error('DNS lookup failed');
                }),
            },
        } as unknown as LearnCardMock;

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('issuer_resolution_failed'))).toBe(true);
    });

    it('records an error when the resolved DID document has no matching verificationMethod', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = {
            invoke: {
                resolveDid: vi.fn(async () => ({
                    '@context': ['https://www.w3.org/ns/did/v1'],
                    id: ISSUER_DID,
                    verificationMethod: [
                        {
                            id: `${ISSUER_DID}#wrong-key`,
                            type: 'JsonWebKey2020',
                            controller: ISSUER_DID,
                            publicKeyJwk: { ...publicJwk, alg: 'EdDSA' },
                        },
                    ],
                })),
            },
        } as unknown as LearnCardMock;

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('verification_method_not_found'))).toBe(true);
    });

    it('records an error when the signature does not validate against the resolved key', async () => {
        const { compact } = await issueTestCredential();
        const { publicJwk: otherKey } = await makeIssuerSigner();
        const learnCard = buildLearnCardMock(otherKey);

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('signature_invalid'))).toBe(true);
    });

    it('reports expiration', async () => {
        const expired = Math.floor(Date.now() / 1000) - 3600;
        const { compact, publicJwk } = await issueTestCredential({ exp: expired });
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('expired'))).toBe(true);
    });

    it('reports vct mismatch when expectedVct is set', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, compact, {
            expectedVct: 'https://example.com/credentials/different',
        });
        expect(result.errors.some(e => e.includes('vct_mismatch'))).toBe(true);
    });

    it('rejects an SD-JWT-VC with a tampered disclosure (specific error)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const tamperedDisclosure = compact.replace(/~([A-Za-z0-9_-]{4,})~/, '~XXXTAMPEREDXXX~');
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, tamperedDisclosure);
        const allMsgs = result.errors.join(' | ');
        expect(allMsgs).toMatch(/invalid_compact_form|disclosure_hash_mismatch/);
    });

    it('rejects a disclosure re-encoded with a new value instead of dropping it (GHSA-f9j6-8p6x-r9j6)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const parts = compact.split('~');
        const index = parts.findIndex((part, i) => i > 0 && part.length > 0);
        const [salt, key] = JSON.parse(Buffer.from(parts[index]!, 'base64url').toString('utf8'));
        parts[index] = Buffer.from(JSON.stringify([salt, key, 'tampered'])).toString('base64url');
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, parts.join('~'));

        expect(result.errors).toEqual([
            expect.stringMatching(/^disclosure_hash_mismatch: .*Unreferenced disclosure/),
        ]);
        expect(result.checks).not.toContain('issuer_signature');
    });

    it('rejects an SD-JWT-VC with a tampered JWT payload (signature path)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const [jwt, ...rest] = compact.split('~');
        const [header, payload, signature] = jwt!.split('.');
        // Keep _sd and _sd_alg so every disclosure stays referenced and only the signature fails.
        const fakePayload = Buffer.from(
            JSON.stringify({
                ...JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8')),
                attacker: 'forged',
            })
        )
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        const tampered = [`${header}.${fakePayload}.${signature}`, ...rest].join('~');
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, tampered);
        expect(result.errors.some(e => e.startsWith('signature_invalid:'))).toBe(true);
    });

    it('rejects when iss is an HTTPS URL (only DID-based issuers supported in Slice 1)', async () => {
        const { signer } = await makeIssuerSigner();
        const instance = new SDJwtVcInstance({
            hasher: sha256Hasher,
            hashAlg: 'sha-256',
            saltGenerator: randomSalt,
            signer,
            signAlg: 'EdDSA',
        });
        const compact = await instance.issue(
            {
                iss: 'https://issuer.example.com',
                iat: Math.floor(Date.now() / 1000),
                vct: 'https://example.com/credentials/test-cert',
                given_name: 'Ada',
            },
            { _sd: ['given_name'] },
            { header: { alg: 'EdDSA' } }
        );
        const learnCard = buildLearnCardMock({});

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('issuer_resolution_failed'))).toBe(true);
    });

    it('returns hard error when audience option is provided in read path (no KB-JWT)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, compact, {
            audience: 'https://verifier.example.com',
        });
        expect(result.errors.some(e => e.includes('audience_or_nonce_requires_kb_jwt'))).toBe(true);
    });

    it('returns hard error when nonce option is provided in read path (no KB-JWT)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, compact, { nonce: 'abc' });
        expect(result.errors.some(e => e.includes('audience_or_nonce_requires_kb_jwt'))).toBe(true);
    });

    it('rejects when the resolved key is not in assertionMethod (W3C DID §5.3.2)', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = {
            invoke: {
                resolveDid: vi.fn(async () => ({
                    '@context': ['https://www.w3.org/ns/did/v1'],
                    id: ISSUER_DID,
                    verificationMethod: [
                        {
                            id: ISSUER_KID,
                            type: 'JsonWebKey2020',
                            controller: ISSUER_DID,
                            publicKeyJwk: { ...publicJwk, alg: 'EdDSA' },
                        },
                    ],
                    keyAgreement: [ISSUER_KID],
                })),
            },
        } as unknown as LearnCardMock;

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors.some(e => e.includes('verification_method_not_authorized'))).toBe(
            true
        );
    });

    it('accepts a fragment-only ("#key-1") reference in assertionMethod', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = {
            invoke: {
                resolveDid: vi.fn(async () => ({
                    '@context': ['https://www.w3.org/ns/did/v1'],
                    id: ISSUER_DID,
                    verificationMethod: [
                        {
                            id: ISSUER_KID,
                            type: 'JsonWebKey2020',
                            controller: ISSUER_DID,
                            publicKeyJwk: { ...publicJwk, alg: 'EdDSA' },
                        },
                    ],
                    assertionMethod: ['#key-1'],
                })),
            },
        } as unknown as LearnCardMock;

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });

    it('relies on parsed.header.alg when the DID-document JWK omits alg', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const { alg: _omittedAlg, ...jwkWithoutAlg } = publicJwk as Record<string, unknown> & {
            alg?: unknown;
        };
        const learnCard = {
            invoke: {
                resolveDid: vi.fn(async (did: string) => {
                    if (did !== ISSUER_DID) throw new Error(`Unexpected DID resolve: ${did}`);
                    return {
                        '@context': ['https://www.w3.org/ns/did/v1'],
                        id: ISSUER_DID,
                        verificationMethod: [
                            {
                                id: ISSUER_KID,
                                type: 'JsonWebKey2020',
                                controller: ISSUER_DID,
                                publicKeyJwk: jwkWithoutAlg,
                            },
                        ],
                        authentication: [ISSUER_KID],
                        assertionMethod: [ISSUER_KID],
                    };
                }),
            },
        } as unknown as LearnCardMock;

        const result = await verifySdJwtVc(learnCard, compact);
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });
});

describe('decodeSdJwtClaims (via plugin surface)', () => {
    it('returns the fully-reconstructed claims', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const learnCard = buildLearnCardMock(publicJwk);
        const plugin = getSdJwtVcPlugin(learnCard);

        const claims = await plugin.methods.decodeSdJwtClaims(learnCard as never, compact);
        expect(claims.given_name).toBe('Ada');
        expect(claims.family_name).toBe('Lovelace');
        expect(claims.iss).toBe(ISSUER_DID);
        expect(claims.vct).toBe('https://example.com/credentials/test-cert');
    });

    it('throws SdJwtVcError when input is not a valid compact form', async () => {
        const learnCard = buildLearnCardMock({});
        const plugin = getSdJwtVcPlugin(learnCard);

        await expect(
            plugin.methods.decodeSdJwtClaims(learnCard as never, 'not-an-sd-jwt')
        ).rejects.toMatchObject({ code: 'invalid_compact_form' });
    });
});
