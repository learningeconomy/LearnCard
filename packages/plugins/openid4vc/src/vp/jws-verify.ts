/**
 * Pure-JS compact JWS signature verification.
 *
 * **Why this exists:** `jose.jwtVerify` routes every signature check
 * through `crypto.subtle.importKey` + `crypto.subtle.verify`. That works
 * in Node and in browsers running over HTTPS / `localhost` /
 * `capacitor://localhost`, but **`crypto.subtle` is `undefined` on iOS
 * WKWebView when the page is loaded over a non-secure origin** (the
 * `pnpm start --host` dev workflow that points Capacitor at
 * `http://<LAN-IP>:3000`). Signed-Request-Object verification in OID4VP
 * was failing there with the same shape as the OID4VCI proof-signing
 * bug.
 *
 * This module re-implements the holder-side JWS verification path in
 * pure JS for the algorithms OID4VP verifiers actually use today:
 *
 *   - `EdDSA` (Ed25519) — `did:jwk`, `did:web` with OKP keys
 *   - `ES256`  (P-256), `ES384` (P-384), `ES512` (P-521) — `did:web`
 *      with EC keys, x509 leaf certs
 *   - `ES256K` (secp256k1) — `did:key:zQ3` and ecosystems pinned to
 *      Bitcoin-style curves
 *
 * RSA-based algorithms (`RS256`, `PS256`, …) intentionally fall
 * through to a typed error. Pure-JS RSA verification is feasible but
 * substantial; verifiers that mandate RSA tend to be production-grade
 * (EUDI / government PKI) and the wallet will encounter them over
 * HTTPS in production where `crypto.subtle` is available. Holders
 * testing such verifiers in iOS dev mode should switch to HTTPS dev
 * (`vite --https`).
 */
import * as ed from '@noble/ed25519';
import { p256, p384, p521 } from '@noble/curves/nist';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';
import type { JWK } from 'jose';

export type SupportedJwsAlg = 'EdDSA' | 'ES256' | 'ES256K' | 'ES384' | 'ES512';

export type JwsVerifyErrorCode =
    | 'unsupported_alg'
    | 'invalid_jws'
    | 'invalid_jwk'
    | 'signature_invalid';

export class JwsVerifyError extends Error {
    readonly code: JwsVerifyErrorCode;

    constructor(
        code: JwsVerifyErrorCode,
        message: string,
        options?: { cause?: unknown }
    ) {
        super(message);
        this.name = 'JwsVerifyError';
        this.code = code;
        if (options?.cause !== undefined) {
            (this as { cause?: unknown }).cause = options.cause;
        }
    }
}

const SUPPORTED_ALGS: readonly SupportedJwsAlg[] = [
    'EdDSA',
    'ES256',
    'ES256K',
    'ES384',
    'ES512',
];

export const isSupportedAlg = (alg: string): alg is SupportedJwsAlg =>
    (SUPPORTED_ALGS as readonly string[]).includes(alg);

/**
 * Verify a compact JWS. Resolves on success; throws {@link JwsVerifyError}
 * on any failure (malformed input, unsupported algorithm, signature
 * mismatch).
 *
 * The verifier intentionally does NOT enforce JWT claim-set checks
 * (`exp`, `nbf`, `iss`, etc.). Callers that need those should layer
 * them on top — for OID4VP Request Object verification the claim
 * checks are handled upstream in `request-object.ts`.
 */
export const verifyCompactJws = async (args: {
    jws: string;
    publicKeyJwk: JWK;
    alg: string;
}): Promise<void> => {
    const { jws, publicKeyJwk, alg } = args;

    if (!isSupportedAlg(alg)) {
        throw new JwsVerifyError(
            'unsupported_alg',
            `Algorithm ${alg} is not supported by the pure-JS JWS verifier. Supported: ${SUPPORTED_ALGS.join(', ')}.`
        );
    }

    const parts = jws.split('.');
    if (parts.length !== 3) {
        throw new JwsVerifyError(
            'invalid_jws',
            `Expected a compact JWS with 3 parts, got ${parts.length}`
        );
    }

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];
    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = decodeBase64Url(signatureB64);

    if (alg === 'EdDSA') {
        await verifyEd25519({
            signingInput,
            signatureBytes,
            publicKeyJwk,
        });
        return;
    }

    await verifyEcdsa({
        alg,
        signingInput,
        signatureBytes,
        publicKeyJwk,
    });
};

const verifyEd25519 = async (args: {
    signingInput: Uint8Array;
    signatureBytes: Uint8Array;
    publicKeyJwk: JWK;
}): Promise<void> => {
    const { signingInput, signatureBytes, publicKeyJwk } = args;

    if (publicKeyJwk.kty !== 'OKP' || publicKeyJwk.crv !== 'Ed25519') {
        throw new JwsVerifyError(
            'invalid_jwk',
            `EdDSA requires an OKP/Ed25519 JWK (got kty=${publicKeyJwk.kty}, crv=${publicKeyJwk.crv})`
        );
    }

    if (typeof publicKeyJwk.x !== 'string' || publicKeyJwk.x.length === 0) {
        throw new JwsVerifyError(
            'invalid_jwk',
            'Ed25519 JWK is missing the public coordinate `x`'
        );
    }

    const publicKey = decodeBase64Url(publicKeyJwk.x);
    if (publicKey.length !== 32) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `Ed25519 public key must be 32 bytes (got ${publicKey.length})`
        );
    }

    if (signatureBytes.length !== 64) {
        throw new JwsVerifyError(
            'signature_invalid',
            `Ed25519 signature must be 64 bytes (got ${signatureBytes.length})`
        );
    }

    let isValid: boolean;
    try {
        isValid = await ed.verifyAsync(signatureBytes, signingInput, publicKey);
    } catch (e) {
        throw new JwsVerifyError(
            'signature_invalid',
            `Ed25519 signature verification threw: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!isValid) {
        throw new JwsVerifyError(
            'signature_invalid',
            'Ed25519 signature verification failed'
        );
    }
};

interface EcdsaCurveSpec {
    curve: typeof p256;
    hash: (msg: Uint8Array) => Uint8Array;
    coordByteLength: number;
    expectedJwkCrv: string;
}

const ECDSA_CURVES: Record<Exclude<SupportedJwsAlg, 'EdDSA'>, EcdsaCurveSpec> = {
    ES256: {
        curve: p256,
        hash: sha256,
        coordByteLength: 32,
        expectedJwkCrv: 'P-256',
    },
    ES256K: {
        curve: secp256k1 as unknown as typeof p256,
        hash: sha256,
        coordByteLength: 32,
        expectedJwkCrv: 'secp256k1',
    },
    ES384: {
        curve: p384 as unknown as typeof p256,
        hash: sha384,
        coordByteLength: 48,
        expectedJwkCrv: 'P-384',
    },
    ES512: {
        curve: p521 as unknown as typeof p256,
        hash: sha512,
        coordByteLength: 66,
        expectedJwkCrv: 'P-521',
    },
};

const verifyEcdsa = async (args: {
    alg: Exclude<SupportedJwsAlg, 'EdDSA'>;
    signingInput: Uint8Array;
    signatureBytes: Uint8Array;
    publicKeyJwk: JWK;
}): Promise<void> => {
    const { alg, signingInput, signatureBytes, publicKeyJwk } = args;
    const spec = ECDSA_CURVES[alg];

    if (publicKeyJwk.kty !== 'EC' || publicKeyJwk.crv !== spec.expectedJwkCrv) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `${alg} requires an EC/${spec.expectedJwkCrv} JWK (got kty=${publicKeyJwk.kty}, crv=${publicKeyJwk.crv})`
        );
    }

    if (
        typeof publicKeyJwk.x !== 'string' ||
        publicKeyJwk.x.length === 0 ||
        typeof publicKeyJwk.y !== 'string' ||
        publicKeyJwk.y.length === 0
    ) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `${alg} JWK is missing public coordinates x or y`
        );
    }

    const x = decodeBase64Url(publicKeyJwk.x);
    const y = decodeBase64Url(publicKeyJwk.y);

    if (x.length !== spec.coordByteLength || y.length !== spec.coordByteLength) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `${alg} JWK coordinates must be ${spec.coordByteLength} bytes (got x=${x.length}, y=${y.length})`
        );
    }

    // SEC1 uncompressed point: 0x04 || X || Y.
    const publicKey = new Uint8Array(1 + x.length + y.length);
    publicKey[0] = 0x04;
    publicKey.set(x, 1);
    publicKey.set(y, 1 + x.length);

    if (signatureBytes.length !== spec.coordByteLength * 2) {
        throw new JwsVerifyError(
            'signature_invalid',
            `${alg} signature must be ${spec.coordByteLength * 2} bytes (got ${signatureBytes.length})`
        );
    }

    const messageHash = spec.hash(signingInput);

    let isValid: boolean;
    try {
        isValid = spec.curve.verify(signatureBytes, messageHash, publicKey);
    } catch (e) {
        throw new JwsVerifyError(
            'signature_invalid',
            `${alg} signature verification threw: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!isValid) {
        throw new JwsVerifyError(
            'signature_invalid',
            `${alg} signature verification failed`
        );
    }
};

/**
 * Extract a JWK from an X.509 leaf certificate's public key without
 * routing through `crypto.subtle`. Supports Ed25519 and the NIST EC
 * curves the rest of this module knows about; anything else raises
 * `invalid_jwk`.
 *
 * The caller (request-object.ts x509 path) needs this because the
 * existing flow used `jose.importX509` to obtain a verify-able key
 * handle, which depends on `subtle.importKey`. Going through a JWK
 * keeps us on the pure-JS verification path.
 */
export const jwkFromX509SubjectPublicKey = (
    cert: { publicKey: { algorithm: { name: string; namedCurve?: string }; rawData: ArrayBuffer } }
): JWK => {
    const algName = cert.publicKey.algorithm.name;
    const spkiBytes = new Uint8Array(cert.publicKey.rawData);

    if (algName === 'Ed25519') {
        const ed25519PublicKey = extractEd25519PublicKeyFromSpki(spkiBytes);
        return {
            kty: 'OKP',
            crv: 'Ed25519',
            x: encodeBase64Url(ed25519PublicKey),
        };
    }

    if (algName === 'ECDSA') {
        const namedCurve = cert.publicKey.algorithm.namedCurve;
        const curveInfo = NAMED_CURVE_TO_JWK[namedCurve ?? ''];
        if (!curveInfo) {
            throw new JwsVerifyError(
                'invalid_jwk',
                `Unsupported ECDSA named curve in x509 cert: ${namedCurve}`
            );
        }

        const point = extractEcPointFromSpki(spkiBytes, curveInfo.coordByteLength);
        return {
            kty: 'EC',
            crv: curveInfo.jwkCrv,
            x: encodeBase64Url(point.x),
            y: encodeBase64Url(point.y),
        };
    }

    throw new JwsVerifyError(
        'invalid_jwk',
        `Unsupported x509 leaf cert public-key algorithm for pure-JS verify: ${algName}`
    );
};

const NAMED_CURVE_TO_JWK: Record<
    string,
    { jwkCrv: string; coordByteLength: number }
> = {
    'P-256': { jwkCrv: 'P-256', coordByteLength: 32 },
    'P-384': { jwkCrv: 'P-384', coordByteLength: 48 },
    'P-521': { jwkCrv: 'P-521', coordByteLength: 66 },
    'K-256': { jwkCrv: 'secp256k1', coordByteLength: 32 },
};

/**
 * Locate the raw 32-byte Ed25519 public key inside an SPKI DER blob.
 *
 * SPKI shape (RFC 5280):
 *   SubjectPublicKeyInfo ::= SEQUENCE {
 *     algorithm        AlgorithmIdentifier,
 *     subjectPublicKey BIT STRING
 *   }
 *
 * Ed25519 SPKI is a fixed 44-byte structure where the last 32 bytes are
 * the public key (the BIT STRING's content after the leading "unused
 * bits" byte). Rather than build a full ASN.1 parser, we exploit the
 * fixed layout: the public key always lives at `spki.length - 32`.
 */
const extractEd25519PublicKeyFromSpki = (spki: Uint8Array): Uint8Array => {
    if (spki.length < 32) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `SPKI blob too short for Ed25519 (got ${spki.length} bytes)`
        );
    }
    return spki.slice(spki.length - 32);
};

/**
 * Locate the EC public-key point inside an SPKI DER blob.
 *
 * The BIT STRING at the end of the SPKI carries the SEC1 uncompressed
 * point `0x04 || X || Y` (each coordinate is `coordByteLength` bytes).
 * Total point length = `1 + 2*coordByteLength`. We pull that off the
 * tail of the SPKI without parsing the algorithm identifier.
 */
const extractEcPointFromSpki = (
    spki: Uint8Array,
    coordByteLength: number
): { x: Uint8Array; y: Uint8Array } => {
    const pointLength = 1 + 2 * coordByteLength;
    if (spki.length < pointLength) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `SPKI blob too short for EC point (got ${spki.length} bytes, need ${pointLength})`
        );
    }

    const point = spki.slice(spki.length - pointLength);
    if (point[0] !== 0x04) {
        throw new JwsVerifyError(
            'invalid_jwk',
            `EC point in SPKI is not uncompressed (leading byte=0x${point[0]?.toString(16)})`
        );
    }

    return {
        x: point.slice(1, 1 + coordByteLength),
        y: point.slice(1 + coordByteLength),
    };
};

const decodeBase64Url = (input: string): Uint8Array => {
    const pad = input.length % 4;
    const padded = pad === 0 ? input : input + '='.repeat(4 - pad);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');

    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }

    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
};

const encodeBase64Url = (bytes: Uint8Array): string => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const describe = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);
