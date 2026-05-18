import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { generateKeyPair, exportJWK, importJWK, SignJWT } from 'jose';

import { parseSdJwtVc } from './parse';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { SdJwtVcError } from './types';

const b64url = (obj: object): string =>
    Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

const handCraftSdJwt = (
    payload: Record<string, unknown>,
    header: Record<string, unknown> = { alg: 'EdDSA', typ: 'dc+sd-jwt' }
): string => `${b64url(header)}.${b64url(payload)}.fake-signature~`;

const buildIssuerInstance = async () => {
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
        const parts = compact.split('.');
        return parts[2]!;
    };

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });

    return { instance, publicJwk };
};

describe('parseSdJwtVc', () => {
    let issued: string;

    beforeAll(async () => {
        const { instance } = await buildIssuerInstance();
        issued = await instance.issue(
            {
                iss: 'did:jwk:eyJpc3N1ZXItdGVzdC1maXh0dXJlIjp0cnVlfQ',
                iat: Math.floor(Date.now() / 1000),
                vct: 'https://example.com/credentials/test-cert',
                given_name: 'Ada',
                family_name: 'Lovelace',
                degree: {
                    type: 'BachelorDegree',
                    name: 'Bachelor of Science',
                },
            },
            {
                _sd: ['given_name', 'family_name', 'degree'],
            }
        );
    });

    it('decodes a valid SD-JWT-VC compact form', async () => {
        const parsed = await parseSdJwtVc(issued);

        expect(parsed.vct).toBe('https://example.com/credentials/test-cert');
        expect(parsed.issuer).toMatch(/^did:jwk:/);
        expect(parsed.format).toBe('dc+sd-jwt');
        expect(parsed.hasKeyBinding).toBe(false);
        expect(parsed.rawSdJwt).toBe(issued);
    });

    it('reconstructs all disclosed claims', async () => {
        const parsed = await parseSdJwtVc(issued);

        expect(parsed.claims.given_name).toBe('Ada');
        expect(parsed.claims.family_name).toBe('Lovelace');
        expect(parsed.claims.degree).toEqual({
            type: 'BachelorDegree',
            name: 'Bachelor of Science',
        });
    });

    it('lists the disclosure keys', async () => {
        const parsed = await parseSdJwtVc(issued);
        const keys = new Set(parsed.disclosureKeys);

        expect(keys.has('given_name')).toBe(true);
        expect(keys.has('family_name')).toBe(true);
        expect(keys.has('degree')).toBe(true);
    });

    it('exposes the JWT header with alg', async () => {
        const parsed = await parseSdJwtVc(issued);
        expect(parsed.header.alg).toBe('EdDSA');
    });

    it('rejects non-compact inputs', async () => {
        await expect(parseSdJwtVc('not-an-sd-jwt')).rejects.toMatchObject({
            code: 'invalid_compact_form',
        });
    });

    it('rejects an SD-JWT missing iss', async () => {
        const noIss = handCraftSdJwt({
            iat: 1700000000,
            vct: 'https://example.com/credentials/test-cert',
        });
        await expect(parseSdJwtVc(noIss)).rejects.toBeInstanceOf(SdJwtVcError);
        await expect(parseSdJwtVc(noIss)).rejects.toMatchObject({ code: 'missing_iss' });
    });

    it('rejects an SD-JWT missing vct', async () => {
        const noVct = handCraftSdJwt({
            iss: 'did:jwk:test',
            iat: 1700000000,
        });
        await expect(parseSdJwtVc(noVct)).rejects.toMatchObject({ code: 'missing_vct' });
    });

    it('rejects an SD-JWT missing alg in the header', async () => {
        const noAlg = handCraftSdJwt(
            { iss: 'did:jwk:test', iat: 1700000000, vct: 'https://example.com/' },
            { typ: 'dc+sd-jwt' }
        );
        await expect(parseSdJwtVc(noAlg)).rejects.toMatchObject({ code: 'missing_alg' });
    });

    it('preserves legacy vc+sd-jwt format tag when requested', async () => {
        const parsed = await parseSdJwtVc(issued, 'vc+sd-jwt');
        expect(parsed.format).toBe('vc+sd-jwt');
    });

    it('extracts holderPublicKey from a cnf.jwk claim', async () => {
        const holderJwk = {
            kty: 'OKP',
            crv: 'Ed25519',
            x: 'fXYZ-test-only-not-a-real-key-value',
        };
        const { instance } = await buildIssuerInstance();
        const withCnf = await instance.issue(
            {
                iss: 'did:jwk:eyJpc3N1ZXItdGVzdC1maXh0dXJlIjp0cnVlfQ',
                iat: Math.floor(Date.now() / 1000),
                vct: 'https://example.com/credentials/test-cert',
                given_name: 'Ada',
                cnf: { jwk: holderJwk },
            },
            { _sd: ['given_name'] }
        );

        const parsed = await parseSdJwtVc(withCnf);
        expect(parsed.holderPublicKey).toEqual(holderJwk);
    });

    it('leaves holderPublicKey undefined when cnf is absent', async () => {
        const parsed = await parseSdJwtVc(issued);
        expect(parsed.holderPublicKey).toBeUndefined();
    });
});
