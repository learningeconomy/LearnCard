/**
 * Thin mock of the host LearnCard the OpenID4VC plugin depends on.
 *
 * Uses real Ed25519 keypairs from `jose` so signatures round-trip
 * through our in-process issuer + verifier, which actually verify
 * them. Everything else is a minimal stub tailored to what the
 * plugin needs (`id.did()`, `id.keypair()`,
 * `invoke.didToVerificationMethod`, `invoke.issuePresentation`).
 */
import { exportJWK, generateKeyPair, importJWK, SignJWT } from 'jose';
import type { JWK } from 'jose';
import type { UnsignedVP, VP, JWKWithPrivateKey } from '@learncard/types';

export interface MockLearnCardHandle {
    // Intentionally typed as `any` at the boundary — the plugin's
    // OpenID4VCDependentLearnCard widens over the host's full surface,
    // which we can't satisfy from a minimal mock. Tests care about
    // behavior, not type narrowing.
    learnCard: any;
    did: string;
    kid: string;
    publicJwk: JWK;
    privateJwk: JWKWithPrivateKey;
    ldpIssueCalls: Array<{
        vp: UnsignedVP;
        options?: { domain?: string; challenge?: string };
    }>;
}

export const buildMockLearnCard = async (): Promise<MockLearnCardHandle> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const privateJwk = (await exportJWK(privateKey)) as JWKWithPrivateKey;
    const publicJwk = await exportJWK(publicKey);

    const did = 'did:jwk:' + toB64url(JSON.stringify(publicJwk));
    const kid = `${did}#0`;

    const ldpIssueCalls: MockLearnCardHandle['ldpIssueCalls'] = [];

    // The plugin's ensureVpJwtSigner() uses learnCard.id.keypair('ed25519')
    // → { kty, crv, x, d, ... }. It then calls createJoseEd25519Signer(),
    // which re-imports via importJWK. We can hand back the exact JWK.
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
                ldpIssueCalls.push({ vp, options });
                return {
                    ...vp,
                    proof: {
                        type: 'Ed25519Signature2020',
                        created: new Date().toISOString(),
                        verificationMethod: kid,
                        proofPurpose: 'authentication',
                        domain: options?.domain,
                        challenge: options?.challenge,
                        proofValue: 'z-e2e-mock-proof',
                    },
                } as unknown as VP;
            },
            issueCredential: async (c: unknown) => c,
        },
    };

    return { learnCard, did, kid, publicJwk, privateJwk, ldpIssueCalls };
};

/**
 * Helper for the plugin's auth-code path: produce the `code_verifier` +
 * S256 `code_challenge` the way the plugin does internally, so tests
 * can also drive the flow by hand if needed.
 */
export const makePkcePair = async (): Promise<{
    verifier: string;
    challenge: string;
}> => {
    const { randomBytes, subtle } = await import('node:crypto');
    const verifier = toB64url(randomBytes(32).toString('base64'));
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = Buffer.from(digest)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return { verifier, challenge };
};

/**
 * Test helper that mirrors `createJoseEd25519Signer`. Used for
 * hand-building SIOPv2 ID tokens in tests that haven't yet had
 * the plugin method wired through.
 */
export const signAsHolder = async (
    mock: MockLearnCardHandle,
    payload: Record<string, unknown>
): Promise<string> => {
    const key = await importJWK(mock.privateJwk, 'EdDSA');
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'EdDSA', kid: mock.kid, typ: 'JWT' })
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
