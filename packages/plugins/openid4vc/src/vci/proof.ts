import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2';
import { JWKWithPrivateKey } from '@learncard/types';

import { ProofJwtSigner } from './types';
import { VciError } from './errors';

/**
 * Wire `@noble/ed25519`'s SHA-512 dependency to a pure-JS implementation
 * from `@noble/hashes`.
 *
 * Why: `@noble/ed25519` v2 defaults to `crypto.subtle.digest('SHA-512', ...)`
 * for its hashing step. That works in Node and in browsers running over
 * HTTPS / `localhost` / `capacitor://localhost`, but **fails on iOS
 * WKWebView when the page is loaded over a non-secure origin** (notably
 * the `pnpm start --host` dev workflow that points Capacitor at
 * `http://<LAN-IP>:3000` — `crypto.subtle` is `undefined` in that
 * context). Overriding the hash callback makes `signAsync` work in any
 * context, secure or not.
 *
 * Module-load side effect: `ed.etc` is a shared mutable object, so this
 * is global once any consumer imports this file. That's fine — SHA-512
 * from `@noble/hashes` is functionally identical to WebCrypto's; we just
 * don't want to depend on WebCrypto being available.
 */
ed.etc.sha512Async = async (...messages: Uint8Array[]): Promise<Uint8Array> =>
    sha512(ed.etc.concatBytes(...messages));

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
 * Default {@link ProofJwtSigner} backed by a LearnCard Ed25519 keypair.
 *
 * **Implementation note — why pure JS and not `jose`?**
 *
 * This used to route through `jose.importJWK` + `SignJWT.sign`, which
 * call `crypto.subtle.importKey({ name: 'Ed25519' }, ...)` under the
 * hood. That path fails on iOS WKWebView in two distinct ways:
 *
 *   1. **Non-secure context** (dev hot-reload via `http://<LAN-IP>:3000`)
 *      — `crypto.subtle` is `undefined`, producing the exact error
 *      `"undefined is not an object (evaluating webcrypto_default.subtle.importKey)"`.
 *
 *   2. **iOS < 17** — WebCrypto Ed25519 isn't implemented at all, so
 *      even in a secure context `importKey` throws `NotSupportedError`.
 *
 * Switching to `@noble/ed25519` (a ~4 KB pure-JS RFC 8032 implementation)
 * sidesteps both. Output is a byte-for-byte compatible compact JWS that
 * any Ed25519 verifier — including jose's own `jwtVerify` — accepts.
 *
 * Host plugins that use a different key type (HSM, secp256k1, etc.)
 * should construct their own `ProofJwtSigner` and pass it in via
 * `acceptCredentialOffer({ signer })`.
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

    if (typeof keypair.d !== 'string' || keypair.d.length === 0) {
        throw new VciError(
            'proof_signing_failed',
            'Ed25519 JWK is missing the private scalar `d`'
        );
    }

    const privateKey = decodeBase64Url(keypair.d);
    if (privateKey.length !== 32) {
        throw new VciError(
            'proof_signing_failed',
            `Ed25519 private scalar must be 32 bytes (got ${privateKey.length})`
        );
    }

    return {
        alg: 'EdDSA',
        kid,
        sign: async (header, payload) => {
            const finalHeader = { ...header, alg: 'EdDSA' };
            const headerB64 = encodeBase64UrlString(JSON.stringify(finalHeader));
            const payloadB64 = encodeBase64UrlString(JSON.stringify(payload));
            const signingInput = `${headerB64}.${payloadB64}`;

            const signatureBytes = await ed.signAsync(
                utf8Encode(signingInput),
                privateKey
            );

            const signatureB64 = encodeBase64UrlBytes(signatureBytes);
            return `${signingInput}.${signatureB64}`;
        },
    };
};

const utf8Encode = (input: string): Uint8Array => new TextEncoder().encode(input);

const encodeBase64UrlString = (input: string): string =>
    encodeBase64UrlBytes(utf8Encode(input));

const encodeBase64UrlBytes = (bytes: Uint8Array): string => {
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
