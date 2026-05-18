import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { generateKeyPair, exportJWK, importJWK, SignJWT } from 'jose';

import { verifySdJwtVc } from './verify';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';

type LearnCardMock = any;

const ISSUER_DID = 'did:web:issuer.example.com';
const ISSUER_KID = `${ISSUER_DID}#key-1`;

const makeIssuerSigner = async () => {
    const keypair = await generateKeyPair('EdDSA');
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
        const compact = await new SignJWT(payload)
            .setProtectedHeader(header)
            .sign(privateKey);
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
            resolveDid: jest.fn(async (did: string) => {
                if (did !== ISSUER_DID) throw new Error(`Unexpected DID resolve: ${did}`);
                return didDocument;
            }),
        },
    };

    return learnCard as unknown as LearnCardMock;
};

const issueTestCredential = async (
    overrides: Record<string, unknown> = {}
): Promise<{ compact: string; publicJwk: Record<string, unknown> }> => {
    const { signer, publicJwk } = await makeIssuerSigner();

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

    return { compact, publicJwk };
};

describe('verifySdJwtVc', () => {
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
                resolveDid: jest.fn(async () => {
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
                resolveDid: jest.fn(async () => ({
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
        expect(
            result.errors.some(e => e.includes('verification_method_not_found'))
        ).toBe(true);
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

    it('rejects an SD-JWT-VC tampered after signing', async () => {
        const { compact, publicJwk } = await issueTestCredential();
        const tampered = compact.replace(/~([A-Za-z0-9_-]+)~/, '~XXXTAMPEREDXXX~');
        const learnCard = buildLearnCardMock(publicJwk);

        const result = await verifySdJwtVc(learnCard, tampered);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});
