import { z } from 'zod';
import type { VC } from './vc';

/**
 * Wire-format identifier for a credential at rest in the wallet.
 *
 * Optional metadata on `CredentialRecord`. Existing W3C records work
 * without it. Format-aware code paths use this value to dispatch on
 * the correct wire-form representation. See ADR-0001 for rationale.
 *
 * Values follow OID4VCI / OID4VP draft-16 conventions:
 *   - `w3c-vc-2.0`  — JSON-LD VC, VCDM 2.0 `@context`
 *   - `w3c-vc-1.1`  — JSON-LD VC, VCDM 1.1 `@context` (legacy)
 *   - `jwt-vc-json` — compact JWS string, VCDM §6.3.1 payload shape
 *   - `dc+sd-jwt`   — SD-JWT-VC compact form (draft-16 canonical name)
 *   - `vc+sd-jwt`   — SD-JWT-VC compact form (legacy alias accepted on read)
 *   - `mso_mdoc`    — ISO 18013-5 mDoc, CBOR-encoded (stored base64)
 */
export const CredentialFormatValidator = z.enum([
    'w3c-vc-2.0',
    'w3c-vc-1.1',
    'jwt-vc-json',
    'dc+sd-jwt',
    'vc+sd-jwt',
    'mso_mdoc',
]);
export type CredentialFormat = z.infer<typeof CredentialFormatValidator>;

/**
 * Storage-plane envelope for native (non-W3C) credential formats.
 *
 * The storage plane previously accepted only `VC | VP`, which forced
 * SD-JWT-VC to synthesize a JSON-LD wrapper around the compact form
 * just to satisfy the type — even though the underlying transport
 * (LearnCloud tRPC) accepts any JSON-serializable value.
 *
 * The envelope is the on-wire shape for any credential that is NOT a
 * W3C VC/VP. Consumers identify the envelope by the presence of both
 * `format` and `data` fields (use `isStoredCredentialEnvelope`).
 *
 * Per-format `data` conventions:
 *   - `dc+sd-jwt` / `vc+sd-jwt`: the compact `<JWT>~<disclosures>~`
 *     string (no KB-JWT — that is per-presentation).
 *   - `jwt-vc-json`: the compact JWS string.
 *   - `mso_mdoc`: base64url-encoded CBOR bytes. The TypeScript type
 *     allows `Uint8Array` for in-memory ergonomics; storage plugins
 *     MUST convert to a base64url string at the transport boundary.
 *     The Zod validator (used at the wire layer) is string-only.
 *
 * W3C VCs continue to flow through `upload(vc: VC)` directly — they
 * do not use the envelope. This keeps the legacy partner surface
 * untouched.
 */
// Wire validator: data is `string` only because JSON transport (tRPC, OpenAPI)
// cannot carry Uint8Array natively. Storage plugins encode binary `Uint8Array`
// data to base64url BEFORE the validator runs at the transport boundary.
// The TypeScript type below is intentionally wider (`string | Uint8Array`) to
// preserve in-memory ergonomics for plugins doing the conversion.
export const StoredCredentialEnvelopeValidator = z
    .object({
        format: CredentialFormatValidator,
        data: z.string(),
    })
    .passthrough();
export type StoredCredentialEnvelope = {
    format: CredentialFormat;
    data: string | Uint8Array;
    [key: string]: unknown;
};

/**
 * Runtime typeguard for the storage envelope shape. Storage plugins
 * use this to branch in `upload`/`read.get` between the legacy W3C
 * path and the envelope path. Performs a shallow structural check —
 * does not validate `data` semantics for the chosen format.
 */
export const isStoredCredentialEnvelope = (
    value: unknown
): value is StoredCredentialEnvelope => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.format !== 'string') return false;
    if (!CredentialFormatValidator.safeParse(candidate.format).success) return false;
    return typeof candidate.data === 'string' || candidate.data instanceof Uint8Array;
};

/**
 * Format-discriminated read view over a stored credential. Returned
 * by `toStoredCredential(record)` in `@learncard/helpers`.
 *
 * The `data` field carries the correct wire-form representation for
 * the credential's format:
 *   - W3C VCs: the JSON-LD VC object (also what `record.vc` holds)
 *   - JWT-VC: the compact JWS string (extracted from `record.vc.proof.jwt`
 *     if the record uses the legacy LDP-around-JWT envelope, otherwise
 *     the raw string from `record.rawWireForm`)
 *   - SD-JWT-VC: the compact `<JWT>~<disclosures>~` string
 *   - mDoc: base64url-encoded CBOR bytes (stored as a string for
 *     LearnCloud's JSON-only encrypted store; consumers base64-decode
 *     when they need raw bytes)
 *
 * Format-aware consumers pattern-match on `format` and use `data`.
 * Legacy consumers continue to read `record.vc` directly — the
 * projector is opt-in, never required.
 */
export type StoredCredential =
    | { format: 'w3c-vc-2.0'; data: VC }
    | { format: 'w3c-vc-1.1'; data: VC }
    | { format: 'jwt-vc-json'; data: string }
    | { format: 'dc+sd-jwt'; data: string }
    | { format: 'vc+sd-jwt'; data: string }
    | { format: 'mso_mdoc'; data: string };

/**
 * Unified display projection for any credential format. Returned by
 * the `toDisplayViewModel(stored, learnCard)` adapter that lands in
 * UI components consume this shape regardless of underlying format,
 * so the same BoostEarnedCard / category view / search index works
 * across all credential types. The format-specific decoding logic
 * lives in the per-format display adapter, not the UI.
 */
export interface CredentialDisplayViewModel {
    /** Source format of the underlying credential. */
    format: CredentialFormat;
    /** Best-effort issuer display name (resolved DID document or HTTPS metadata). */
    issuerName?: string;
    /** Raw DID or URL identifier of the issuer. */
    issuerDid?: string;
    /** Human-readable title (from credential `name`, derived from vct, or humanized type). */
    title?: string;
    /** Wallet category (e.g., `'Achievement'`, `'ID'`) used by the wallet's category tabs. */
    category?: string;
    /** Issuance time, if present in the credential. */
    issuedAt?: Date;
    /** Expiration time, if present. */
    expiresAt?: Date;
    /**
     * Reconstructed claims. For W3C VCs this mirrors `credentialSubject`;
     * for SD-JWT this is the payload + reconstructed disclosable claims;
     * for mDoc it's the decoded namespace tree projected as a flat record.
     */
    claims: Record<string, unknown>;
    /**
     * Whether the credential supports selective disclosure at presentation
     * time. SD-JWT-VC and mDoc → true; W3C VCs → false. UI components use
     * this to decide whether to show per-claim consent checkboxes.
     */
    isSelectivelyDisclosable: boolean;
    /**
     * The on-the-wire form for re-serialization at egress time. Apps
     * preparing outbound presentations should NEVER reconstruct from
     * `claims` — always re-serialize from this field via
     * `serializeForWire(stored)` (Phase 3).
     */
    rawWireForm: string | VC;
}
