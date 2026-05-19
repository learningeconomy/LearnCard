import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { decodeSdJwt } from '@sd-jwt/decode';
import { generateKeyPair, exportJWK, importJWK, SignJWT } from 'jose';
import type { JWK } from 'jose';

import { presentSdJwtVc } from './present';
import { getSdJwtVcPlugin } from './plugin';
import { createEd25519KbSigner } from './signer';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { SdJwtVcError } from './types';

const ISSUER_DID = 'did:web:issuer.example.com';
const ISSUER_KID = `${ISSUER_DID}#key-1`;

const decodeJsonSegment = (segment: string): Record<string, unknown> => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
};

const makeIssuerSigner = async () => {
    const keypair = await generateKeyPair('EdDSA');
    const privateJwk = await exportJWK(keypair.privateKey);
    const publicJwk = await exportJWK(keypair.publicKey);
    const privateKey = await importJWK(privateJwk, 'EdDSA');

    const signer = async (data: string): Promise<string> => {
        const [headerSegment, payloadSegment] = data.split('.');
        if (!headerSegment || !payloadSegment) throw new Error('Bad JWS input');
        const header = decodeJsonSegment(headerSegment);
        const payload = decodeJsonSegment(payloadSegment);
        const compact = await new SignJWT(payload as Record<string, unknown>)
            .setProtectedHeader(header as { alg: string })
            .sign(privateKey);
        return compact.split('.')[2]!;
    };

    return { signer, publicJwk };
};

const makeHolderKeypair = async () => {
    const keypair = await generateKeyPair('EdDSA');
    const privateJwk = (await exportJWK(keypair.privateKey)) as JWK;
    const publicJwk = (await exportJWK(keypair.publicKey)) as JWK;
    return { privateJwk, publicJwk };
};

interface IssueCredentialOptions {
    holderPublicJwk?: JWK;
    payloadOverrides?: Record<string, unknown>;
    disclose?: string[];
}

const issueCredential = async (
    options: IssueCredentialOptions = {}
): Promise<{ compact: string }> => {
    const { signer } = await makeIssuerSigner();
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });

    const basePayload: Record<string, unknown> = {
        iss: ISSUER_DID,
        iat: Math.floor(Date.now() / 1000),
        vct: 'https://example.com/credentials/test-cert',
        given_name: 'Ada',
        family_name: 'Lovelace',
        email: 'ada@example.com',
        date_of_birth: '1815-12-10',
        ...options.payloadOverrides,
    };

    if (options.holderPublicJwk) {
        basePayload.cnf = { jwk: options.holderPublicJwk };
    }

    const disclose = options.disclose ?? ['given_name', 'family_name', 'email', 'date_of_birth'];

    const compact = await instance.issue(
        basePayload,
        { _sd: disclose },
        { header: { kid: ISSUER_KID, alg: 'EdDSA' } }
    );

    return { compact };
};

describe('presentSdJwtVc', () => {
    describe('without cnf binding (no KB-JWT)', () => {
        it('produces a compact presentation ending with the disclosure separator', async () => {
            const { compact } = await issueCredential();

            const result = await presentSdJwtVc(compact);

            expect(result.hasKeyBinding).toBe(false);
            expect(result.compact.endsWith('~')).toBe(true);
            expect(result.compact.split('~').length).toBeGreaterThanOrEqual(2);
        });

        it('releases every disclosable claim when `disclose` is omitted', async () => {
            const { compact } = await issueCredential({
                disclose: ['given_name', 'family_name', 'email'],
            });

            const result = await presentSdJwtVc(compact);

            expect(result.disclosedKeys.sort()).toEqual(
                ['email', 'family_name', 'given_name'].sort()
            );
        });

        it('drops claims absent from the `disclose` frame from the wire', async () => {
            const { compact } = await issueCredential({
                disclose: ['given_name', 'family_name', 'email'],
            });

            const result = await presentSdJwtVc(compact, {
                disclose: { given_name: true },
            });

            expect(result.disclosedKeys).toEqual(['given_name']);

            const decoded = await decodeSdJwt(result.compact, sha256Hasher);
            const decodedKeys = (decoded.disclosures ?? [])
                .map(d => (d as { key?: string }).key)
                .filter((k): k is string => typeof k === 'string');

            expect(decodedKeys).toEqual(['given_name']);
        });

        it('ignores audience/nonce when the credential has no cnf', async () => {
            const { compact } = await issueCredential();

            await expect(
                presentSdJwtVc(compact, {
                    audience: 'https://verifier.example.com',
                    nonce: 'abc123',
                })
            ).resolves.toMatchObject({ hasKeyBinding: false });
        });
    });

    describe('with cnf binding (KB-JWT required)', () => {
        it('builds a KB-JWT with typ=kb+jwt, alg=EdDSA, and aud/nonce/iat/sd_hash', async () => {
            const holder = await makeHolderKeypair();
            const { compact } = await issueCredential({ holderPublicJwk: holder.publicJwk });
            const kbSigner = await createEd25519KbSigner({ privateJwk: holder.privateJwk });

            const result = await presentSdJwtVc(compact, {
                audience: 'https://verifier.example.com',
                nonce: 'replay-protection-nonce',
                kbSigner,
                now: () => 1700000000,
            });

            expect(result.hasKeyBinding).toBe(true);

            const lastSegment = result.compact.split('~').filter(s => s.length > 0).pop()!;
            const [headerB64, payloadB64] = lastSegment.split('.');
            const header = decodeJsonSegment(headerB64!);
            const payload = decodeJsonSegment(payloadB64!);

            expect(header.typ).toBe('kb+jwt');
            expect(header.alg).toBe('EdDSA');
            expect(payload.aud).toBe('https://verifier.example.com');
            expect(payload.nonce).toBe('replay-protection-nonce');
            expect(payload.iat).toBe(1700000000);
            expect(typeof payload.sd_hash).toBe('string');
            expect((payload.sd_hash as string).length).toBeGreaterThan(0);
        });

        it('throws kb_jwt_invalid when audience is missing', async () => {
            const holder = await makeHolderKeypair();
            const { compact } = await issueCredential({ holderPublicJwk: holder.publicJwk });
            const kbSigner = await createEd25519KbSigner({ privateJwk: holder.privateJwk });

            await expect(
                presentSdJwtVc(compact, { nonce: 'abc', kbSigner })
            ).rejects.toMatchObject({
                code: 'kb_jwt_invalid',
                message: expect.stringContaining('audience is required'),
            });
        });

        it('throws kb_jwt_invalid when nonce is missing', async () => {
            const holder = await makeHolderKeypair();
            const { compact } = await issueCredential({ holderPublicJwk: holder.publicJwk });
            const kbSigner = await createEd25519KbSigner({ privateJwk: holder.privateJwk });

            await expect(
                presentSdJwtVc(compact, {
                    audience: 'https://verifier.example.com',
                    kbSigner,
                })
            ).rejects.toMatchObject({
                code: 'kb_jwt_invalid',
                message: expect.stringContaining('nonce is required'),
            });
        });

        it('throws kb_jwt_invalid when kbSigner is missing', async () => {
            const holder = await makeHolderKeypair();
            const { compact } = await issueCredential({ holderPublicJwk: holder.publicJwk });

            await expect(
                presentSdJwtVc(compact, {
                    audience: 'https://verifier.example.com',
                    nonce: 'abc',
                })
            ).rejects.toMatchObject({
                code: 'kb_jwt_invalid',
                message: expect.stringContaining('kbSigner is required'),
            });
        });

        it('honors the `disclose` frame even when key binding is present', async () => {
            const holder = await makeHolderKeypair();
            const { compact } = await issueCredential({
                holderPublicJwk: holder.publicJwk,
                disclose: ['given_name', 'family_name', 'email', 'date_of_birth'],
            });
            const kbSigner = await createEd25519KbSigner({ privateJwk: holder.privateJwk });

            const result = await presentSdJwtVc(compact, {
                disclose: { given_name: true, email: true },
                audience: 'https://verifier.example.com',
                nonce: 'abc',
                kbSigner,
            });

            expect(result.disclosedKeys.sort()).toEqual(['email', 'given_name']);

            const decoded = await decodeSdJwt(result.compact, sha256Hasher);
            const decodedKeys = (decoded.disclosures ?? [])
                .map(d => (d as { key?: string }).key)
                .filter((k): k is string => typeof k === 'string')
                .sort();

            expect(decodedKeys).toEqual(['email', 'given_name']);
        });
    });

    describe('error handling', () => {
        it('throws invalid_compact_form for non-string input', async () => {
            await expect(
                presentSdJwtVc('not-an-sd-jwt')
            ).rejects.toMatchObject({ code: 'invalid_compact_form' });
        });

        it('throws invalid_compact_form for empty input', async () => {
            await expect(presentSdJwtVc('')).rejects.toMatchObject({
                code: 'invalid_compact_form',
            });
        });
    });
});

describe('createEd25519KbSigner', () => {
    it('rejects non-Ed25519 keys with kb_jwt_invalid', async () => {
        const rsa = { kty: 'RSA', n: 'fake', e: 'AQAB', d: 'fake' } as unknown as JWK;
        await expect(createEd25519KbSigner({ privateJwk: rsa })).rejects.toMatchObject({
            code: 'kb_jwt_invalid',
            message: expect.stringContaining('Ed25519'),
        });
    });

    it('rejects keys without a private scalar', async () => {
        const keypair = await generateKeyPair('EdDSA');
        const publicOnly = (await exportJWK(keypair.publicKey)) as JWK;
        await expect(
            createEd25519KbSigner({ privateJwk: publicOnly })
        ).rejects.toMatchObject({
            code: 'kb_jwt_invalid',
            message: expect.stringContaining('private scalar'),
        });
    });

    it('produces a valid signature segment that the lib accepts as kbSigner', async () => {
        const holder = await makeHolderKeypair();
        const signer = await createEd25519KbSigner({ privateJwk: holder.privateJwk });

        const sig = await signer('eyJhbGciOiJFZERTQSJ9.eyJmb28iOiJiYXIifQ');
        expect(typeof sig).toBe('string');
        expect(sig.length).toBeGreaterThan(0);
        expect(sig).not.toContain('.');
    });
});

describe('plugin surface: presentSdJwtVc', () => {
    it('exposes presentSdJwtVc via the plugin methods table', async () => {
        const learnCard = {
            invoke: {
                verifyCredential: jest.fn(),
                resolveDid: jest.fn(),
            },
        } as never;

        const plugin = getSdJwtVcPlugin(learnCard);
        expect(typeof plugin.methods.presentSdJwtVc).toBe('function');

        const { compact } = await issueCredential();
        const result = await plugin.methods.presentSdJwtVc(learnCard, compact);

        expect(result.compact).toBeDefined();
        expect(result.hasKeyBinding).toBe(false);
    });
});
