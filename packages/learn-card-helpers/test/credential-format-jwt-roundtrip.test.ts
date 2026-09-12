import { describe, expect, it } from 'vitest';

import { projectEnvelopeToDisplayVc, toStoredCredential } from '../src';

const base64UrlJson = (value: unknown): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

const makeJwtVcCompact = (vcClaim: Record<string, unknown>): string =>
    `${base64UrlJson({ alg: 'EdDSA', typ: 'JWT' })}.${base64UrlJson({ vc: vcClaim })}.AAAA`;

describe('jwt-vc-json projection keeps the signed wire bytes', () => {
    it('re-attaches the compact token when the embedded vc claim carries a proof', () => {
        const compact = makeJwtVcCompact({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:web:university.example',
            credentialSubject: { degree: 'BS' },
            proof: {
                type: 'Ed25519Signature2020',
                created: '2020-01-01T00:00:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:web:university.example#key-1',
                proofValue: 'z-stale',
            },
        });

        const projected = projectEnvelopeToDisplayVc({ format: 'jwt-vc-json', data: compact });

        expect(projected).toBeDefined();
        expect(projected!.proof).toMatchObject({ type: 'JwtProof2020', jwt: compact });

        const stored = toStoredCredential({
            id: 'test-id',
            uri: 'lc:test',
            vc: projected,
        } as never);

        expect(stored.format).toBe('jwt-vc-json');
        if (stored.format === 'jwt-vc-json') expect(stored.data).toBe(compact);
    });
});
