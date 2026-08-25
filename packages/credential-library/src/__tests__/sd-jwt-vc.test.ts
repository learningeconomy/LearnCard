import { describe, expect, it } from 'vitest';
import { exportJWK, generateKeyPair, type JWK } from 'jose';
import {
    createEd25519KbSigner,
    parseSdJwtVc,
    presentSdJwtVc,
    verifySdJwtVc,
} from '@learncard/sd-jwt-vc-plugin';

import {
    getFixture,
    isSdJwtVcFixture,
    materializeSdJwtVcFixture,
    type SdJwtVcFixture,
} from '../index';

const ISSUED_AT = 1_787_616_000;

const fixture = getFixture('sd-jwt-vc/course-completion');
if (!isSdJwtVcFixture(fixture)) throw new Error('Expected SD-JWT VC fixture');

const makeKeypair = async (): Promise<{
    privateJwk: JWK;
    publicJwk: JWK;
}> => {
    const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    return {
        privateJwk: await exportJWK(pair.privateKey),
        publicJwk: await exportJWK(pair.publicKey),
    };
};

const toDidJwk = (jwk: JWK): string =>
    `did:jwk:${Buffer.from(JSON.stringify(jwk)).toString('base64url')}`;

const makeMaterializerSigner = async (privateJwk: JWK) => {
    const signer = await createEd25519KbSigner({ privateJwk });
    return async (signingInput: string): Promise<string> => signer(signingInput);
};

const materializeFixture = async () => {
    const issuer = await makeKeypair();
    const holder = await makeKeypair();
    const issuerDid = toDidJwk(issuer.publicJwk);
    const issuerKid = `${issuerDid}#0`;
    const result = await materializeSdJwtVcFixture(fixture, {
        issuerDid,
        issuerKid,
        issuerSigner: await makeMaterializerSigner(issuer.privateJwk),
        holderPublicJwk: { ...holder.publicJwk },
        issuedAt: ISSUED_AT,
    });

    return { issuer, holder, issuerDid, issuerKid, result };
};

describe('materializeSdJwtVcFixture', () => {
    it('issues a parseable, holder-bound dc+sd-jwt envelope that verifies against its issuer DID', async () => {
        const { issuer, holder, issuerDid, issuerKid, result } = await materializeFixture();

        expect(result.vct).toBe(fixture.template.vct);
        expect(result.envelope).toEqual({ format: 'dc+sd-jwt', data: result.compact });
        expect(result.compact).toContain('~');

        const parsed = await parseSdJwtVc(result.compact);
        expect(parsed.vct).toBe(fixture.template.vct);
        expect(parsed.issuer).toBe(issuerDid);
        expect(parsed.issuedAt?.getTime()).toBe(ISSUED_AT * 1_000);
        expect(parsed.holderPublicKey).toEqual({ ...holder.publicJwk });
        expect(parsed.disclosureKeys.sort()).toEqual(
            fixture.template.selectivelyDisclosable.slice().sort()
        );
        expect(parsed.hasKeyBinding).toBe(false);
        expect(parsed.header).toMatchObject({ typ: 'dc+sd-jwt', alg: 'EdDSA', kid: issuerKid });

        const verifierLearnCard = {
            invoke: {
                resolveDid: async () => ({
                    '@context': ['https://www.w3.org/ns/did/v1'],
                    id: issuerDid,
                    verificationMethod: [
                        {
                            id: issuerKid,
                            type: 'JsonWebKey2020',
                            controller: issuerDid,
                            publicKeyJwk: { ...issuer.publicJwk, alg: 'EdDSA' },
                        },
                    ],
                    assertionMethod: [issuerKid],
                    authentication: [issuerKid],
                }),
            },
        };

        const verification = await verifySdJwtVc(verifierLearnCard as never, result.compact, {
            expectedVct: fixture.template.vct,
        });
        expect(verification.errors).toEqual([]);

        const presentation = await presentSdJwtVc(result.compact, {
            audience: 'https://verifier.example.com',
            nonce: 'phase-0-nonce',
            kbSigner: await createEd25519KbSigner({ privateJwk: holder.privateJwk }),
            activeHolderPublicJwk: { ...holder.publicJwk },
            verify: async () => verification,
            now: () => ISSUED_AT,
        });

        expect(presentation.hasKeyBinding).toBe(true);
        const kbJwt = presentation.compact.split('~').filter(Boolean).at(-1)!;
        const [, payloadSegment] = kbJwt.split('.');
        const kbPayload = JSON.parse(
            Buffer.from(payloadSegment!, 'base64url').toString('utf8')
        ) as Record<string, unknown>;
        expect(kbPayload.aud).toBe('https://verifier.example.com');
        expect(kbPayload.nonce).toBe('phase-0-nonce');
    });

    it('rejects fixture templates that override reserved SD-JWT claims', async () => {
        const issuer = await makeKeypair();
        const holder = await makeKeypair();
        const issuerDid = toDidJwk(issuer.publicJwk);
        const reservedClaimFixture: SdJwtVcFixture = {
            ...fixture,
            template: {
                ...fixture.template,
                claims: { ...fixture.template.claims, iss: 'did:example:override' },
            },
        };

        await expect(
            materializeSdJwtVcFixture(reservedClaimFixture, {
                issuerDid,
                issuerKid: `${issuerDid}#0`,
                issuerSigner: await makeMaterializerSigner(issuer.privateJwk),
                holderPublicJwk: { ...holder.publicJwk },
            })
        ).rejects.toThrow(/reserved/i);
    });

    it.each([
        { crv: 'Ed25519', x: 'abc' },
        { kty: 'OKP', x: 'abc' },
        { kty: 'OKP', crv: 'Ed25519' },
    ])('rejects malformed holder public JWK %j', async holderPublicJwk => {
        const issuer = await makeKeypair();
        const issuerDid = toDidJwk(issuer.publicJwk);

        await expect(
            materializeSdJwtVcFixture(fixture, {
                issuerDid,
                issuerKid: `${issuerDid}#0`,
                issuerSigner: await makeMaterializerSigner(issuer.privateJwk),
                holderPublicJwk,
            })
        ).rejects.toThrow(/holder.*JWK|Ed25519/i);
    });

    it('rejects a holder JWK containing private key material', async () => {
        const issuer = await makeKeypair();
        const holder = await makeKeypair();
        const issuerDid = toDidJwk(issuer.publicJwk);

        await expect(
            materializeSdJwtVcFixture(fixture, {
                issuerDid,
                issuerKid: `${issuerDid}#0`,
                issuerSigner: await makeMaterializerSigner(issuer.privateJwk),
                holderPublicJwk: { ...holder.privateJwk },
            })
        ).rejects.toThrow('holder key must be public and must not include private key material');
    });

    it.each([
        ['issuer DID', { issuerDid: '', issuerKid: 'did:example:issuer#0' }],
        ['issuer KID', { issuerDid: 'did:example:issuer', issuerKid: '' }],
    ] as const)('rejects an empty %s', async (_name, issuer) => {
        const keypair = await makeKeypair();
        const holder = await makeKeypair();

        await expect(
            materializeSdJwtVcFixture(fixture, {
                ...issuer,
                issuerSigner: await makeMaterializerSigner(keypair.privateJwk),
                holderPublicJwk: { ...holder.publicJwk },
            })
        ).rejects.toThrow(/issuer/i);
    });
});
