import {
    createJoseEd25519Signer,
    type ProofJwtSigner,
} from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

/**
 * Detect a local-development `did:web` DID (hostname is `localhost`
 * or `127.0.0.1`, with or without a port component encoded as
 * `:PORT` or `%3APORT`).
 *
 * These DIDs are served by the developer's brain-service but are
 * unreachable by OID4VC issuers / verifiers running in Docker — the
 * walt.id and EUDI reference implementations both resolve did:web
 * over HTTPS only, and the host's brain-service terminates plaintext.
 * Even with the `host-bridge` socat sidecar in
 * `tests/openid4vc-interop-e2e/compose.yaml` (which solves the TCP
 * half), there's no clean way to make those verifiers trust a
 * self-signed cert for `localhost` without invasive truststore
 * plumbing per vendor image.
 *
 * The caller's only reliable options are (a) use a DID method the
 * verifier can self-resolve from the DID string (did:key, did:jwk),
 * or (b) stand up real HTTPS for brain-service. For local dev (a) is
 * the right call — this helper powers that fallback.
 */
export const isLocalDidWeb = (did: string): boolean =>
    /^did:web:(localhost|127\.0\.0\.1)(?::|%3A|$)/i.test(did);

/**
 * Build an Ed25519 {@link ProofJwtSigner} whose `kid` resolves to
 * the wallet's `did:key` identity, when the wallet's active profile
 * is a local `did:web:localhost…`. Returns `undefined` otherwise, so
 * callers can pass the result straight into the OID4VC plugin's
 * `options.signer` (undefined lets the plugin's default signer take
 * over).
 *
 * The underlying keypair is the same Ed25519 material the wallet
 * already holds — `did:key` is deterministically derived from that
 * key, so the user's cryptographic identity is unchanged; only the
 * DID method surfaced to the foreign verifier changes.
 *
 * For OID4VP flows, callers should also pass
 * `holder: wallet.id.did('key')` alongside this signer so the VP's
 * `holder` field matches the proof JWT's issuer — otherwise the
 * verifier will complain about the mismatch between the outer VP
 * holder and the JWT signer.
 */
export const buildLocalDidWebSignerOverride = async (
    wallet: BespokeLearnCard
): Promise<ProofJwtSigner | undefined> => {
    const activeDid = wallet.id.did();
    if (!isLocalDidWeb(activeDid)) return undefined;

    const didKey = wallet.id.did('key');
    const kid = await wallet.invoke.didToVerificationMethod(didKey);
    const keypair = wallet.id.keypair('ed25519');

    return createJoseEd25519Signer({ keypair, kid });
};
