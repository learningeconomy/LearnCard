import { SignJWT, generateKeyPair } from 'jose';

import { normalizeIssuedCredential } from './decode';

const signVcJwt = async (payload: Record<string, unknown>): Promise<string> => {
    const { privateKey } = await generateKeyPair('EdDSA', { extractable: true });
    return new SignJWT(payload).setProtectedHeader({ alg: 'EdDSA' }).sign(privateKey);
};

describe('normalizeIssuedCredential — jwt_vc_json', () => {
    it('extracts the `vc` claim and preserves the JWT under proof.jwt', async () => {
        const jwt = await signVcJwt({
            iss: 'did:web:issuer.example.com',
            sub: 'did:key:z6Mkholder',
            jti: 'urn:uuid:abc',
            nbf: 1_700_000_000,
            exp: 1_800_000_000,
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'UniversityDegreeCredential'],
                credentialSubject: { name: 'Alice' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');

        expect(result.rawFormat).toBe('jwt_vc_json');
        expect(result.jwt).toBe(jwt);
        expect(result.vc.type).toEqual(['VerifiableCredential', 'UniversityDegreeCredential']);
        expect(result.vc.id).toBe('urn:uuid:abc');
        expect(result.vc.issuer).toBe('did:web:issuer.example.com');
        expect(result.vc.issuanceDate).toBe('2023-11-14T22:13:20.000Z');
        expect(result.vc.expirationDate).toBe('2027-01-15T08:00:00.000Z');
        const subject = result.vc.credentialSubject as { id?: string; name?: string };
        expect(subject.id).toBe('did:key:z6Mkholder');
        expect(subject.name).toBe('Alice');
        // Proof block must carry every field the wallet's strict
        // ProofValidator (packages/learn-card-types/src/vc.ts) marks
        // as required — missing any of them caused
        // `learnCard.read.get(uri)` to silently return undefined
        // (lc-1794 “indexed but unreadable” symptom).
        expect(result.vc.proof).toEqual({
            type: 'JwtProof2020',
            created: result.vc.issuanceDate,
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:web:issuer.example.com#0',
            jwt,
        });
    });

    it('uses the JWT `kid` header verbatim when it is an absolute identifier', async () => {
        const { privateKey } = await generateKeyPair('EdDSA', { extractable: true });
        const jwt = await new SignJWT({
            iss: 'did:jwk:abc',
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        })
            .setProtectedHeader({ alg: 'EdDSA', kid: 'did:jwk:abc#key-7' })
            .sign(privateKey);

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');
        const proof = result.vc.proof as Record<string, unknown>;

        expect(proof.verificationMethod).toBe('did:jwk:abc#key-7');
    });

    it('anchors a relative `#kid` header to the issuer DID', async () => {
        const { privateKey } = await generateKeyPair('EdDSA', { extractable: true });
        const jwt = await new SignJWT({
            iss: 'did:web:issuer.example.com',
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        })
            .setProtectedHeader({ alg: 'EdDSA', kid: '#key-1' })
            .sign(privateKey);

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');
        const proof = result.vc.proof as Record<string, unknown>;

        expect(proof.verificationMethod).toBe('did:web:issuer.example.com#key-1');
    });

    it('does not overwrite an explicitly-set vc.issuer with the iss claim', async () => {
        const jwt = await signVcJwt({
            iss: 'did:web:jwt-issuer.example.com',
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: { id: 'did:web:vc-issuer.example.com', name: 'Example U' },
                credentialSubject: { id: 'did:key:z6Mkholder' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');

        expect(result.vc.issuer).toEqual({ id: 'did:web:vc-issuer.example.com', name: 'Example U' });
    });

    it('does not overwrite an explicitly-set credentialSubject.id with sub', async () => {
        const jwt = await signVcJwt({
            sub: 'did:key:z6Mkjwt',
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6Mkvc', name: 'Alice' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');

        const subject = result.vc.credentialSubject as { id?: string };
        expect(subject.id).toBe('did:key:z6Mkvc');
    });

    it('prefers iat when nbf is absent', async () => {
        const jwt = await signVcJwt({
            iat: 1_700_000_000,
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');

        expect(result.vc.issuanceDate).toBe('2023-11-14T22:13:20.000Z');
    });

    it('leaves VCDM 2.0 fields (validFrom/validUntil) untouched when present', async () => {
        const jwt = await signVcJwt({
            iat: 1_700_000_000,
            exp: 1_800_000_000,
            vc: {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                validFrom: '2024-01-01T00:00:00Z',
                validUntil: '2030-01-01T00:00:00Z',
                credentialSubject: { id: 'did:key:z6M' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc_json');

        expect(result.vc.validFrom).toBe('2024-01-01T00:00:00Z');
        expect(result.vc.validUntil).toBe('2030-01-01T00:00:00Z');
        // Should not double-set the legacy fields when VCDM 2.0 fields already present.
        expect(result.vc.issuanceDate).toBeUndefined();
        expect(result.vc.expirationDate).toBeUndefined();
    });

    it('throws unsupported_format when the JWT has no `vc` claim', async () => {
        const jwt = await signVcJwt({ iss: 'did:web:issuer', sub: 'did:key:z6M' });

        expect(() => normalizeIssuedCredential(jwt, 'jwt_vc_json')).toThrow(
            /missing the required `vc` claim/
        );
    });

    it('throws unsupported_format when the credential is not a string', () => {
        expect(() => normalizeIssuedCredential({ foo: 'bar' }, 'jwt_vc_json')).toThrow(
            /must be a compact JWS string/
        );
    });

    it('throws unsupported_format on malformed JWT input', () => {
        expect(() => normalizeIssuedCredential('not.a.jwt', 'jwt_vc_json')).toThrow(
            /Failed to decode/
        );
    });

    it('accepts the draft-11 jwt_vc alias', async () => {
        const jwt = await signVcJwt({
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        });

        const result = normalizeIssuedCredential(jwt, 'jwt_vc');

        expect(result.rawFormat).toBe('jwt_vc');
        expect(result.jwt).toBe(jwt);
    });
});

describe('normalizeIssuedCredential — ldp_vc', () => {
    it('passes through a JSON-LD VC object unchanged', () => {
        const vc = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:web:issuer.example.com',
            credentialSubject: { id: 'did:key:z6M', name: 'Alice' },
            proof: { type: 'Ed25519Signature2020' },
        };

        const result = normalizeIssuedCredential(vc, 'ldp_vc');

        expect(result.rawFormat).toBe('ldp_vc');
        expect(result.jwt).toBeUndefined();
        expect(result.vc).toEqual(vc);
    });

    it('throws unsupported_format when ldp_vc credential is not an object', () => {
        expect(() => normalizeIssuedCredential('not-an-object', 'ldp_vc')).toThrow(
            /was not a JSON-LD object/
        );
    });
});

describe('normalizeIssuedCredential — unknown formats', () => {
    it('throws unsupported_format for unrecognized formats', () => {
        expect(() => normalizeIssuedCredential('anything', 'mso_mdoc')).toThrow(
            /not yet supported/
        );
    });
});
