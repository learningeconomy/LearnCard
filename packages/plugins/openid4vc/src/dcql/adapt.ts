/**
 * Credential-shape adapter: held credentials → DCQL `DcqlCredential`.
 *
 * The `dcql` library matches credentials via a normalized representation
 * (`DcqlCredential`, a discriminated union over `credential_format`).
 * Our plugin holds credentials in their wire shape — JWT-VC compact
 * strings, JSON-LD VC objects, sometimes a JWT-VC nested inside an
 * LDP envelope's `proof.jwt`. Before DCQL's `query()` matcher can run,
 * we have to translate.
 *
 * # Why this lives in `dcql/` and not in `vp/select.ts`
 *
 * The PEX selector (`vp/select.ts`) decodes credentials internally for
 * its own JSONPath matcher, but its decoded shape (the raw JWT payload
 * verbatim) is not the same as what DCQL wants (a normalized
 * `{ credential_format, type, claims, cryptographic_holder_binding }`).
 * Sharing a single decoder leaks PEX assumptions into DCQL — which is
 * the whole reason DCQL exists as a separate query language. They get
 * separate adapters.
 *
 * # In scope today
 *
 * - `jwt_vc_json` (compact JWT, VCDM §6.3.1 payload).
 * - `ldp_vc`     (JSON-LD VC object with a Data Integrity proof or the
 *                 `proof.type === 'JwtProof2020'` legacy envelope).
 *
 * # Out of scope (deferred)
 *
 * - `vc+sd-jwt` — supported by the `dcql` library but the plugin
 *   doesn't yet build SD-JWT *presentations* (KB-JWT signing path
 *   is its own slice). Adapter returns `undefined` for these for now
 *   so they're transparently skipped during DCQL matching.
 * - `mso_mdoc` — we don't issue or hold mDL credentials yet; the
 *   `DcqlMdocCredential` shape requires a CBOR-decoded namespace
 *   tree we don't compute.
 */
import type { DcqlW3cVcCredential } from './types';

/** Subset of {@link CandidateCredential} this adapter consumes. */
export interface AdaptableCredential {
    /** Wire-shape credential — string for JWT-VCs, object for LD-VCs. */
    credential: unknown;
    /**
     * Optional explicit format hint. When omitted the adapter infers
     * via the same heuristics PEX selector uses (`inferCredentialFormat`).
     * Provide explicitly when the wire shape is ambiguous (e.g. a
     * compact JWS that the caller has reason to believe is SD-JWT, not
     * jwt_vc_json).
     */
    format?: string;
}

/**
 * Convert a single held credential into a `DcqlW3cVcCredential` ready
 * for `DcqlQuery.query()` to evaluate.
 *
 * Returns `undefined` when:
 *   - format is unrecognized / unsupported (sd-jwt-vc, mdoc, raw JSON
 *     without VC shape)
 *   - JWT decoding fails (malformed compact JWS, non-JSON payload)
 *   - decoded payload has no `vc` claim or `type` array
 *
 * `undefined` results are silently dropped from the candidate pool by
 * downstream selector code — same convention as `vp/select.ts`'s
 * `decodeCandidateForMatching`. Throwing here would force every
 * caller to wrap in try/catch and degrade UX for "I have a weird
 * credential" cases that are otherwise harmless.
 */
export const adaptCredentialForDcql = (
    candidate: AdaptableCredential
): DcqlW3cVcCredential | undefined => {
    const format = candidate.format ?? inferDcqlFormat(candidate.credential);

    if (format === 'jwt_vc_json') {
        return adaptJwtVc(candidate.credential);
    }

    if (format === 'ldp_vc') {
        return adaptLdpVc(candidate.credential);
    }

    // sd-jwt-vc, mso_mdoc, unknown — caller's pool drops this entry.
    return undefined;
};

/**
 * Batch adapter — runs {@link adaptCredentialForDcql} over a candidate
 * pool, dropping any that don't normalize. Returns the filtered list
 * pair-wise with the original candidate so callers can reconnect a
 * DCQL match back to the wire-shape credential they actually want to
 * present (the matcher only sees the normalized shape; submission
 * needs the original).
 */
export const adaptCredentialsForDcql = (
    candidates: readonly AdaptableCredential[]
): Array<{ original: AdaptableCredential; adapted: DcqlW3cVcCredential }> => {
    const out: Array<{ original: AdaptableCredential; adapted: DcqlW3cVcCredential }> = [];

    for (const candidate of candidates) {
        const adapted = adaptCredentialForDcql(candidate);
        if (adapted) out.push({ original: candidate, adapted });
    }

    return out;
};

/* -------------------------------------------------------------------------- */
/*                                  internals                                 */
/* -------------------------------------------------------------------------- */

const adaptJwtVc = (credential: unknown): DcqlW3cVcCredential | undefined => {
    // Accept either a bare JWT string (the OID4VCI/walt.id default)
    // or a JSON object with `proof.jwt` (the legacy LDP-envelope-around-
    // JWT-VC variant). Both deserialize to the same VCDM §6.3.1 payload.
    let payload: Record<string, unknown> | undefined;

    if (typeof credential === 'string') {
        payload = decodeJwtPayload(credential);
    } else if (credential && typeof credential === 'object') {
        const proof = (credential as { proof?: unknown }).proof;
        if (proof && typeof proof === 'object') {
            const jwt = (proof as { jwt?: unknown }).jwt;
            if (typeof jwt === 'string') {
                payload = decodeJwtPayload(jwt);
            }
        }
    }

    if (!payload) return undefined;

    // VCDM §6.3.1: the W3C VC body lives under `vc`. We use that as
    // the `claims` object — DCQL paths drill via dot-notation into
    // exactly the credentialSubject + metadata structure verifiers
    // typically target (`type`, `credentialSubject.degreeName`, etc.).
    const vc = payload.vc;
    if (!vc || typeof vc !== 'object' || Array.isArray(vc)) return undefined;

    const vcObj = vc as Record<string, unknown>;
    const types = extractTypes(vcObj.type);
    if (types.length === 0) return undefined;

    return {
        credential_format: 'jwt_vc_json',
        type: types,
        // The dcql library types `claims` as `Record<string, Json>`
        // (its own recursive Json alias). Anything we get back from
        // JSON.parse is valid Json by construction, but TypeScript
        // can't infer that without a cast. The runtime data is
        // unaltered.
        claims: vcObj as DcqlW3cVcCredential['claims'],
        // The plugin always issues VPs with cryptographic holder
        // binding (we sign with the holder key during presentation),
        // so this is `true` for every credential the plugin emits or
        // imports. If we ever support bearer credentials this needs
        // a per-credential signal.
        cryptographic_holder_binding: true,
    };
};

const adaptLdpVc = (credential: unknown): DcqlW3cVcCredential | undefined => {
    if (!credential || typeof credential !== 'object' || Array.isArray(credential)) {
        return undefined;
    }

    const vcObj = credential as Record<string, unknown>;
    const types = extractTypes(vcObj.type);
    if (types.length === 0) return undefined;

    return {
        credential_format: 'ldp_vc',
        type: types,
        claims: vcObj as DcqlW3cVcCredential['claims'],
        cryptographic_holder_binding: true,
    };
};

const extractTypes = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((t): t is string => typeof t === 'string');
    }
    if (typeof value === 'string') return [value];
    return [];
};

/**
 * Local format inference — intentionally narrower than the PEX
 * selector's `inferCredentialFormat`, since DCQL only cares about
 * `jwt_vc_json` and `ldp_vc` (and eventually `vc+sd-jwt` / `mso_mdoc`).
 *
 * Re-implemented here rather than imported to avoid a cross-module
 * cycle (`vp/select.ts` already imports VP types; pulling DCQL types
 * in would create a `vp ↔ dcql` cycle).
 */
const inferDcqlFormat = (credential: unknown): string | undefined => {
    if (typeof credential === 'string') {
        // Compact JWS has exactly three `.`-delimited segments. Anything
        // else is either malformed or a different envelope (SD-JWT
        // separates with `~`, mdoc is binary).
        if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential)) {
            return 'jwt_vc_json';
        }
        return undefined;
    }

    if (credential && typeof credential === 'object' && !Array.isArray(credential)) {
        const proof = (credential as { proof?: unknown }).proof;

        if (proof && typeof proof === 'object') {
            const proofType = (proof as { type?: unknown }).type;

            // Legacy LDP-envelope-around-JWT-VC.
            if (proofType === 'JwtProof2020') return 'jwt_vc_json';

            // Anything else with a proof.type is a Data Integrity / LD
            // signature variant; treat as ldp_vc.
            return 'ldp_vc';
        }
    }

    return undefined;
};

const decodeJwtPayload = (jwt: string): Record<string, unknown> | undefined => {
    const parts = jwt.split('.');
    if (parts.length !== 3) return undefined;

    try {
        const json = JSON.parse(base64UrlDecode(parts[1]!));
        return json && typeof json === 'object' && !Array.isArray(json)
            ? (json as Record<string, unknown>)
            : undefined;
    } catch {
        return undefined;
    }
};

const base64UrlDecode = (input: string): string => {
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob === 'function') return atob(normalized);
    return Buffer.from(normalized, 'base64').toString('binary');
};
