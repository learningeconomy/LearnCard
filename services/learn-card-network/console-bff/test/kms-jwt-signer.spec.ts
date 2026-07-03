import { describe, it, expect } from 'vitest';
import { createPublicKey, verify as nodeVerify } from 'crypto';

import { LocalKeyManagementService } from '@kms';
import { KmsJwtSigner } from '@brain';

const decodeSegment = (segment: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(segment, 'base64url').toString());

describe('KmsJwtSigner', () => {
    it('produces a well-formed ES256 JWT whose signature verifies against the DID doc key', async () => {
        const kms = new LocalKeyManagementService();
        const did = 'did:web:console.lef.org:p:01';
        const keyRef = await kms.generateSigningKey({ tenantId: 'lef', alias: 'p:01' });
        const signer = new KmsJwtSigner(kms);

        const jwt = await signer.sign({
            did,
            keyRef,
            payload: { iss: did, nonce: 'challenge-abc', vp: { holder: did } },
        });

        const [headerB64, payloadB64, signatureB64] = jwt.split('.');

        expect(decodeSegment(headerB64!)).toEqual({
            alg: 'ES256',
            typ: 'JWT',
            kid: `${did}#key-1`,
        });
        expect(decodeSegment(payloadB64!)).toMatchObject({ iss: did, nonce: 'challenge-abc' });

        const publicKey = createPublicKey({
            key: (await kms.getPublicKeyJwk(keyRef)) as any,
            format: 'jwk',
        });
        const signingInput = `${headerB64}.${payloadB64}`;
        const signature = Buffer.from(signatureB64!, 'base64url');

        expect(signature.length).toBe(64);
        expect(
            nodeVerify(
                'SHA256',
                Buffer.from(signingInput),
                { key: publicKey, dsaEncoding: 'ieee-p1363' },
                signature
            )
        ).toBe(true);
    });

    it('fails verification if the signing input is tampered with', async () => {
        const kms = new LocalKeyManagementService();
        const did = 'did:web:console.lef.org:p:01';
        const keyRef = await kms.generateSigningKey({ tenantId: 'lef', alias: 'p:01' });
        const jwt = await new KmsJwtSigner(kms).sign({ did, keyRef, payload: { iss: did } });

        const [headerB64, , signatureB64] = jwt.split('.');
        const forgedPayload = Buffer.from(JSON.stringify({ iss: 'did:web:evil' })).toString(
            'base64url'
        );
        const publicKey = createPublicKey({
            key: (await kms.getPublicKeyJwk(keyRef)) as any,
            format: 'jwk',
        });

        expect(
            nodeVerify(
                'SHA256',
                Buffer.from(`${headerB64}.${forgedPayload}`),
                { key: publicKey, dsaEncoding: 'ieee-p1363' },
                Buffer.from(signatureB64!, 'base64url')
            )
        ).toBe(false);
    });
});
