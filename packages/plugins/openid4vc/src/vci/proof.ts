import { importJWK, SignJWT, JWTHeaderParameters, JWTPayload } from 'jose';
import { JWKWithPrivateKey } from '@learncard/types';

import { DiVpProofSigner, KeyProofSelection, ProofJwtSigner } from './types';
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
        throw new VciError(
            'proof_signing_failed',
            'Proof JWT `audience` must be a non-empty string'
        );
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
 * Data Integrity cryptosuites the default LearnCard signer can produce,
 * in preference order. Matched against the issuer's
 * `proof_signing_alg_values_supported` for the `di_vp` proof type.
 */
export const DI_VP_SUPPORTED_CRYPTOSUITES = [
    'eddsa-rdfc-2022',
    'eddsa-2022',
    'json-eddsa-2022',
] as const;

/**
 * Choose which key proof type to present for a credential configuration,
 * per OID4VCI 1.0 §8.2.1: the issuer advertises acceptable proof types in
 * `proof_types_supported`; the wallet MUST pick one of them.
 *
 * Selection policy:
 * - No `proof_types_supported` → `jwt` (historical default; most issuers).
 * - `jwt` advertised with a mutually supported signing algorithm → `jwt`.
 *   Per §8.2.1 each proof-type entry carries
 *   `proof_signing_alg_values_supported`; when `signerAlg` is provided and
 *   the issuer's list doesn't include it, `jwt` is skipped so a viable
 *   `di_vp` path can be used instead of sending a proof the issuer must
 *   reject.
 * - `di_vp` advertised (and `jwt` unavailable or alg-incompatible) →
 *   `di_vp`, with a cryptosuite picked from the intersection of the
 *   issuer's `proof_signing_alg_values_supported` and
 *   {@link DI_VP_SUPPORTED_CRYPTOSUITES}.
 * - No mutually supported proof type → `proof_signing_failed` error.
 */
export const selectKeyProofType = (
    configDef: Record<string, unknown> | undefined,
    signerAlg?: string
): KeyProofSelection => {
    const proofTypes = configDef?.proof_types_supported;

    if (!proofTypes || typeof proofTypes !== 'object') return { proofType: 'jwt' };

    const entries = proofTypes as Record<string, unknown>;

    const jwtAdvertised = 'jwt' in entries;

    if (jwtAdvertised && jwtEntryAcceptsAlg(entries.jwt, signerAlg)) return { proofType: 'jwt' };

    if ('di_vp' in entries) {
        const diVpEntry = entries.di_vp;
        const advertised =
            diVpEntry && typeof diVpEntry === 'object'
                ? (diVpEntry as Record<string, unknown>).proof_signing_alg_values_supported
                : undefined;

        if (!Array.isArray(advertised) || advertised.length === 0) {
            return { proofType: 'di_vp' };
        }

        const cryptosuite = DI_VP_SUPPORTED_CRYPTOSUITES.find(suite => advertised.includes(suite));

        if (!cryptosuite) {
            throw new VciError(
                'proof_signing_failed',
                `Issuer requires a di_vp key proof but none of its cryptosuites are supported (issuer: ${advertised.join(
                    ', '
                )}; wallet: ${DI_VP_SUPPORTED_CRYPTOSUITES.join(', ')})`
            );
        }

        return { proofType: 'di_vp', cryptosuite };
    }

    if (jwtAdvertised) {
        throw new VciError(
            'proof_signing_failed',
            `Issuer accepts jwt key proofs but not the wallet signer's algorithm "${signerAlg}" (issuer: ${describeJwtAlgs(
                entries.jwt
            )})`
        );
    }

    throw new VciError(
        'proof_signing_failed',
        `Issuer's proof_types_supported advertises none of the wallet's key proof types (issuer: ${Object.keys(
            entries
        ).join(', ')}; wallet: jwt, di_vp)`
    );
};

/**
 * OID4VCI 1.0 §8.2.1: a proof-type entry's
 * `proof_signing_alg_values_supported` constrains which algorithms the
 * issuer accepts. Missing/empty lists are treated as unrestricted
 * (lenient — several live issuers omit the field), as is an absent
 * `signerAlg` (callers that don't know their algorithm keep the historical
 * behavior).
 */
const jwtEntryAcceptsAlg = (jwtEntry: unknown, signerAlg?: string): boolean => {
    if (!signerAlg) return true;

    const advertised =
        jwtEntry && typeof jwtEntry === 'object'
            ? (jwtEntry as Record<string, unknown>).proof_signing_alg_values_supported
            : undefined;

    if (!Array.isArray(advertised) || advertised.length === 0) return true;

    return advertised.includes(signerAlg);
};

const describeJwtAlgs = (jwtEntry: unknown): string => {
    const advertised =
        jwtEntry && typeof jwtEntry === 'object'
            ? (jwtEntry as Record<string, unknown>).proof_signing_alg_values_supported
            : undefined;

    return Array.isArray(advertised) ? advertised.join(', ') : 'unspecified';
};

/**
 * Build a `di_vp` key proof per OID4VCI 1.0 §8.2.1.3: a W3C Verifiable
 * Presentation (no credentials) secured with a Data Integrity proof where
 * `proofPurpose = authentication`, `domain` = Credential Issuer Identifier,
 * and `challenge` = the issuer `c_nonce`.
 */
export const buildDiVpProof = async (args: {
    signer: DiVpProofSigner;
    audience: string;
    nonce?: string;
    cryptosuite?: string;
}): Promise<Record<string, unknown>> => {
    const { signer, audience, nonce, cryptosuite } = args;

    if (typeof audience !== 'string' || audience.length === 0) {
        throw new VciError(
            'proof_signing_failed',
            'di_vp proof `audience` must be a non-empty string'
        );
    }

    const unsignedVp: Record<string, unknown> = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiablePresentation'],
        holder: signer.holder,
    };

    try {
        return await signer.signPresentation(unsignedVp, {
            domain: audience,
            challenge: nonce,
            cryptosuite,
        });
    } catch (e) {
        throw new VciError(
            'proof_signing_failed',
            `Failed to sign di_vp proof: ${e instanceof Error ? e.message : String(e)}`,
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

    const key = await importJWK(
        { kty: keypair.kty, crv: keypair.crv, x: keypair.x, d: keypair.d },
        'EdDSA'
    );

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
