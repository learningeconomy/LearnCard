import { importJWK, SignJWT, JWTHeaderParameters, JWTPayload } from 'jose';
import { JWKWithPrivateKey } from '@learncard/types';

import { ProofJwtSigner } from './types';
import { VciError } from './errors';

/**
 * The `typ` value required by OID4VCI Draft 13 §7.2.1.1 for JWT
 * proof-of-possession signatures.
 */
export const OID4VCI_PROOF_TYP = 'openid4vci-proof+jwt';

/**
 * Build an OID4VCI proof-of-possession JWT per Draft 13 §7.2.1.1.
 *
 * Header fields set by this function:
 * - `alg` — from signer
 * - `kid` — from signer (MUST point to a verification method the issuer can resolve)
 * - `typ` — `openid4vci-proof+jwt` (per spec)
 *
 * Payload fields set by this function:
 * - `aud` — the credential issuer identifier
 * - `iat` — current unix time
 * - `nonce` — the `c_nonce` returned by the token endpoint (REQUIRED when the issuer supplied one)
 * - `iss` — only when `clientId` is provided (pre-auth anonymous flows omit it)
 *
 * The signer contract is deliberately narrow so tests can exercise this
 * function without any real crypto.
 */
export const buildProofJwt = async (args: {
    signer: ProofJwtSigner;
    audience: string;
    nonce?: string;
    clientId?: string;
    /** Override `iat` for deterministic tests. */
    now?: () => number;
}): Promise<string> => {
    const { signer, audience, nonce, clientId } = args;
    const now = args.now ?? (() => Math.floor(Date.now() / 1000));

    if (typeof audience !== 'string' || audience.length === 0) {
        throw new VciError('proof_signing_failed', 'Proof JWT `audience` must be a non-empty string');
    }

    const header = {
        alg: signer.alg,
        kid: signer.kid,
        typ: OID4VCI_PROOF_TYP,
    };

    const payload: Record<string, unknown> = {
        aud: audience,
        iat: now(),
    };

    if (typeof nonce === 'string' && nonce.length > 0) payload.nonce = nonce;
    if (typeof clientId === 'string' && clientId.length > 0) payload.iss = clientId;

    try {
        return await signer.sign(header, payload);
    } catch (e) {
        throw new VciError(
            'proof_signing_failed',
            `Failed to sign proof JWT: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }
};

/**
 * Default {@link ProofJwtSigner} implementation backed by a LearnCard
 * Ed25519 keypair and `jose`. Host plugins that use a different key type
 * or an HSM should construct their own signer.
 */
export const createJoseEd25519Signer = async (args: {
    keypair: JWKWithPrivateKey;
    /** Verification method URL, e.g. `did:key:z6M...#z6M...`. */
    kid: string;
}): Promise<ProofJwtSigner> => {
    const { keypair, kid } = args;

    if (keypair.kty !== 'OKP' || keypair.crv !== 'Ed25519') {
        throw new VciError(
            'proof_signing_failed',
            `createJoseEd25519Signer only supports Ed25519 OKP keys (got kty=${keypair.kty}, crv=${keypair.crv})`
        );
    }

    const key = await importJWK({ kty: keypair.kty, crv: keypair.crv, x: keypair.x, d: keypair.d }, 'EdDSA');

    return {
        alg: 'EdDSA',
        kid,
        sign: async (header, payload) => {
            return new SignJWT(payload as JWTPayload)
                .setProtectedHeader({ ...header, alg: 'EdDSA' } as JWTHeaderParameters)
                .sign(key);
        },
    };
};
