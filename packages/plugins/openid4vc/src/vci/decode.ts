import { decodeJwt, decodeProtectedHeader } from 'jose';

import { VciError } from './errors';

/**
 * Normalized representation of an issued credential, suitable for handing
 * to the LearnCard store plane.
 *
 * Fields:
 * - `vc` — W3C VC JSON-LD object (what the wallet UI renders / validates).
 * - `rawFormat` — the format id the issuer returned it in (e.g. `jwt_vc_json`).
 * - `jwt` — original compact JWS, preserved only for jwt-based formats so
 *   downstream verification can re-check the signature without re-fetching.
 */
export interface NormalizedCredential {
    vc: W3CVerifiableCredential;
    rawFormat: string;
    jwt?: string;
}

/**
 * W3C VC Data Model shape. Only the fields we actually touch are typed —
 * everything else passes through as `unknown` so issuer-specific extensions
 * aren't clobbered.
 */
export interface W3CVerifiableCredential {
    '@context': unknown;
    type: string[] | string;
    id?: string;
    issuer?: string | { id?: string; [k: string]: unknown };
    issuanceDate?: string;
    expirationDate?: string;
    validFrom?: string;
    validUntil?: string;
    credentialSubject?: { id?: string; [k: string]: unknown } | Array<{ id?: string; [k: string]: unknown }>;
    credentialStatus?: unknown;
    credentialSchema?: unknown;
    proof?: unknown;
    [k: string]: unknown;
}

/**
 * Decode a credential returned from the issuer into the wallet's native
 * W3C VC shape.
 *
 * Supports:
 * - `jwt_vc_json` (and the draft-11 alias `jwt_vc`): compact JWS per VCDM
 *   §6.3.1. Mapped claims: `iss` → `issuer`, `sub` → `credentialSubject.id`,
 *   `jti` → `id`, `nbf`/`iat` → `issuanceDate`, `exp` → `expirationDate`.
 *   The raw JWT is preserved in `jwt` so the store can re-verify later.
 * - `ldp_vc`: the credential is already a JSON-LD VC object — pass through.
 *
 * Unknown formats throw `unsupported_format` so callers can decide whether
 * to fail the batch or skip the entry.
 *
 * NOTE: This function deliberately does NOT verify the JWT signature. The
 * issuer is trusted to return a valid credential for the pre-authorized
 * code flow; downstream verification (via `learnCard.invoke.verifyCredential`)
 * will re-check against the proof when the user views the credential.
 */
export const normalizeIssuedCredential = (
    credential: unknown,
    format: string
): NormalizedCredential => {
    switch (format) {
        case 'jwt_vc_json':
        case 'jwt_vc': // draft-11 alias — we normalize offers but issuers may echo the legacy id back
        case 'jwt_vc_json-ld':
            return decodeJwtVc(credential, format);

        case 'ldp_vc':
            if (!isVcObject(credential)) {
                throw new VciError(
                    'unsupported_format',
                    `ldp_vc credential was not a JSON-LD object (received ${typeof credential})`
                );
            }
            return { vc: credential, rawFormat: format };

        default:
            throw new VciError(
                'unsupported_format',
                `Credential format "${format}" is not yet supported by the openid4vc plugin`
            );
    }
};

const decodeJwtVc = (credential: unknown, format: string): NormalizedCredential => {
    if (typeof credential !== 'string') {
        throw new VciError(
            'unsupported_format',
            `${format} credential must be a compact JWS string (received ${typeof credential})`
        );
    }

    let payload: Record<string, unknown>;

    try {
        payload = decodeJwt(credential) as Record<string, unknown>;
    } catch (e) {
        throw new VciError(
            'unsupported_format',
            `Failed to decode ${format} credential as a JWT: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    const vcClaim = payload.vc;

    if (!isVcObject(vcClaim)) {
        throw new VciError(
            'unsupported_format',
            `${format} credential JWT is missing the required \`vc\` claim`
        );
    }

    // VCDM §6.3.1: JWT claims override/supply missing VC fields.
    const vc: W3CVerifiableCredential = { ...vcClaim };

    if (typeof payload.jti === 'string' && !vc.id) {
        vc.id = payload.jti;
    }

    if (typeof payload.iss === 'string' && !hasIssuer(vc)) {
        vc.issuer = payload.iss;
    }

    if (typeof payload.sub === 'string') {
        // Only replace credentialSubject.id when the VC didn't set it explicitly.
        // Array subjects are left alone — multi-subject credentials shouldn't
        // collapse to one `sub` claim.
        if (vc.credentialSubject && !Array.isArray(vc.credentialSubject)) {
            const subj = vc.credentialSubject as { id?: string; [k: string]: unknown };
            if (!subj.id) subj.id = payload.sub;
        } else if (!vc.credentialSubject) {
            vc.credentialSubject = { id: payload.sub };
        }
    }

    // `nbf` takes precedence over `iat` per the spec.
    const issuedAt =
        typeof payload.nbf === 'number'
            ? payload.nbf
            : typeof payload.iat === 'number'
            ? payload.iat
            : undefined;

    if (issuedAt !== undefined && !vc.issuanceDate && !vc.validFrom) {
        vc.issuanceDate = new Date(issuedAt * 1000).toISOString();
    }

    if (typeof payload.exp === 'number' && !vc.expirationDate && !vc.validUntil) {
        vc.expirationDate = new Date(payload.exp * 1000).toISOString();
    }

    // Preserve the original JWS as a JwtProof2020 so verifiers that only
    // accept JSON-LD proofs see the signature, and anyone re-parsing from
    // `proof.jwt` can verify against the issuer's key.
    //
    // We populate the full set of fields the wallet's `ProofValidator`
    // (zod, packages/learn-card-types/src/vc.ts) marks as required
    // — `created`, `proofPurpose`, `verificationMethod`. Without them,
    // `learnCard.read.get(uri)` calls `VCValidator.parseAsync(...)` on
    // the decrypted JWE, the strict parse throws on the missing fields,
    // LearnCloud's `read.get` swallows the throw with `return undefined`,
    // and the credential becomes indexed-but-unreadable (the lc-1794
    // empty-JSON symptom). The strings here are correctness-preserving
    // placeholders — actual signature verification re-parses
    // `proof.jwt` against the issuer's key, so the JsonLD-flavored
    // metadata only needs to satisfy the schema, not the cryptography.
    const created =
        vc.issuanceDate ??
        (typeof vc.validFrom === 'string' ? vc.validFrom : undefined) ??
        new Date().toISOString();

    const issuerId = pickIssuerId(vc.issuer) ?? (typeof payload.iss === 'string' ? payload.iss : undefined);

    let kid: string | undefined;
    try {
        const header = decodeProtectedHeader(credential) as { kid?: unknown };
        if (typeof header?.kid === 'string' && header.kid.length > 0) {
            kid = header.kid;
        }
    } catch {
        // Header malformed — fall through to the issuer-derived placeholder.
    }

    const verificationMethod = kid
        ? // Absolute kid (e.g. `did:jwk:...#0`) — use as-is. Relative kid
          // (e.g. `#key-1`) — anchor to the issuer DID.
          kid.startsWith('#') && issuerId
            ? `${issuerId}${kid}`
            : kid
        : issuerId
        ? `${issuerId}#0`
        : 'urn:openid4vci:unknown-verification-method';

    vc.proof = {
        type: 'JwtProof2020',
        created,
        proofPurpose: 'assertionMethod',
        verificationMethod,
        jwt: credential,
    };

    return { vc, rawFormat: format, jwt: credential };
};

const pickIssuerId = (issuer: unknown): string | undefined => {
    if (typeof issuer === 'string') return issuer;
    if (issuer && typeof issuer === 'object') {
        const id = (issuer as Record<string, unknown>).id;
        if (typeof id === 'string' && id.length > 0) return id;
    }
    return undefined;
};

const isVcObject = (value: unknown): value is W3CVerifiableCredential => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    // Very loose — VCs in the wild often drop `@context` or `type`. We check
    // for at least one of the two so we don't silently accept arbitrary objects.
    return '@context' in obj || 'type' in obj || 'credentialSubject' in obj;
};

const hasIssuer = (vc: W3CVerifiableCredential): boolean => {
    if (!vc.issuer) return false;
    if (typeof vc.issuer === 'string') return vc.issuer.length > 0;
    if (typeof vc.issuer === 'object' && vc.issuer !== null) {
        return typeof vc.issuer.id === 'string' && vc.issuer.id.length > 0;
    }
    return false;
};
