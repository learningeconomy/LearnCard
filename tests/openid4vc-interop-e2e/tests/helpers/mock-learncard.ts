/**
 * Thin mock of the host LearnCard the OpenID4VC plugin depends on.
 *
 * Shares its shape with the in-process e2e mock so interop tests and
 * unit tests exercise the same LearnCard surface. Real Ed25519
 * keypair + JWK so walt.id can actually verify wallet-signed proofs
 * and VPs.
 */
import { exportJWK, generateKeyPair, importJWK, SignJWT } from 'jose';
import type { JWK } from 'jose';
import type { UnsignedVP, VP, JWKWithPrivateKey } from '@learncard/types';

export interface MockLearnCardHandle {
    learnCard: any;
    did: string;
    kid: string;
    publicJwk: JWK;
    privateJwk: JWKWithPrivateKey;
}

export const buildMockLearnCard = async (): Promise<MockLearnCardHandle> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const privateJwk = (await exportJWK(privateKey)) as JWKWithPrivateKey;
    const publicJwk = await exportJWK(publicKey);

    // did:jwk embeds the public JWK.
    const did = 'did:jwk:' + toB64url(JSON.stringify(publicJwk));
    const kid = `${did}#0`;

    const learnCard = {
        id: {
            did: () => did,
            keypair: (_type?: string) => ({ ...privateJwk }),
        },
        invoke: {
            didToVerificationMethod: async (d: string) => `${d}#0`,
            issuePresentation: async (
                vp: UnsignedVP,
                options?: { domain?: string; challenge?: string }
            ): Promise<VP> => {
                // Interop tests go through the JWT presentation path
                // — the plugin only calls `issuePresentation` when
                // building an LD-proof VP, which we don't exercise
                // against walt.id. Keep the mock anyway so the plugin
                // stays happy if it ever dispatches here.
                return {
                    ...vp,
                    proof: {
                        type: 'Ed25519Signature2020',
                        created: new Date().toISOString(),
                        verificationMethod: kid,
                        proofPurpose: 'authentication',
                        domain: options?.domain,
                        challenge: options?.challenge,
                        proofValue: 'z-interop-mock-proof',
                    },
                } as unknown as VP;
            },
            issueCredential: async (c: unknown) => c,
        },
    };

    return { learnCard, did, kid, publicJwk, privateJwk };
};

/**
 * JWT-VP signer so interop specs can round-trip a VP through walt.id's
 * verifier. Mirrors what the plugin's internal signer would do — we
 * expose it separately so tests can also construct JWTs by hand when
 * driving a flow outside the plugin.
 */
export const signJwtAsHolder = async (
    mock: MockLearnCardHandle,
    payload: Record<string, unknown>,
    extraHeader: Record<string, unknown> = {}
): Promise<string> => {
    const key = await importJWK(mock.privateJwk, 'EdDSA');
    return new SignJWT(payload)
        .setProtectedHeader({
            alg: 'EdDSA',
            kid: mock.kid,
            typ: 'JWT',
            ...extraHeader,
        })
        .sign(key);
};

const toB64url = (input: string | Buffer): string => {
    const buf = typeof input === 'string' ? Buffer.from(input) : input;
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};
