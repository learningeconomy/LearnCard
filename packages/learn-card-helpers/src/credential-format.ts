import { sha256 } from '@noble/hashes/sha2';
import { decodeSdJwtSync, getClaimsSync } from '@sd-jwt/decode';
import type {
    CredentialRecord,
    StoredCredential,
    StoredCredentialEnvelope,
    VC,
} from '@learncard/types';
import { isStoredCredentialEnvelope } from '@learncard/types';

const SD_JWT_RESERVED_CLAIMS = new Set([
    'iss',
    'iat',
    'exp',
    'nbf',
    'sub',
    'vct',
    'cnf',
    '_sd_alg',
    '_sd',
    '...',
    'status',
]);

const SD_JWT_FALLBACK_ISSUED_AT_ISO = '1970-01-01T00:00:00.000Z';

const SUPPORTED_SD_JWT_HASH_ALGS = new Set(['sha-256', 'SHA-256', 'sha256']);

const sha256HasherSync = (data: string | ArrayBuffer, alg: string): Uint8Array => {
    if (!SUPPORTED_SD_JWT_HASH_ALGS.has(alg)) {
        throw new Error(`Unsupported hash algorithm: "${alg}". Only sha-256 is supported.`);
    }

    const bytes =
        typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
    return sha256(bytes);
};

/**
 * Project a `CredentialRecord` into a format-discriminated read view.
 *
 * Two paths into the same output:
 *
 * 1. **Explicit format**: if the record carries an explicit `format`
 *    discriminator (and `rawWireForm` where required), the projector
 *    trusts it. This is the path new format-aware writers take.
 *
 * 2. **Inferred from shape** (legacy fallback): for records that
 *    pre-date format-tagging, the projector inspects `record.vc` and
 *    infers the format. W3C VCs → `w3c-vc-2.0` / `w3c-vc-1.1` based
 *    on `@context`; transitional SD-JWT wrappers (which never shipped
 *    but exist on branch `lc-1796-3`) → `dc+sd-jwt` with the compact
 *    extracted from `proof.jwt`; legacy JWT-VC envelopes → `jwt-vc-json`.
 *
 * Returns a `StoredCredential` for every conceivable record. Never
 * throws — credentials with unrecognizable shape fall back to
 * `w3c-vc-1.1` with `data = record.vc` so legacy consumers keep
 * something they can read.
 *
 * This projector is the SAFETY NET that makes the format-tagging
 * migration non-breaking: writers can adopt format-tagging at their
 * own pace; readers using this projector see the right discriminator
 * either way.
 */
export const toStoredCredential = (record: CredentialRecord): StoredCredential => {
    if (record.format) {
        if (
            record.format === 'dc+sd-jwt' ||
            record.format === 'vc+sd-jwt' ||
            record.format === 'jwt-vc-json' ||
            record.format === 'mso_mdoc'
        ) {
            const wireForm = record.rawWireForm ?? extractWireFormFromVc(record.vc);
            if (typeof wireForm === 'string' && wireForm.length > 0) {
                return { format: record.format, data: wireForm };
            }
        }

        if (record.format === 'w3c-vc-2.0' || record.format === 'w3c-vc-1.1') {
            return { format: record.format, data: record.vc as VC };
        }
    }

    const vc = record.vc as unknown;

    if (typeof vc === 'string') {
        if (looksLikeSdJwtCompact(vc)) {
            return { format: 'dc+sd-jwt', data: vc };
        }
        if (looksLikeJwsCompact(vc)) {
            return { format: 'jwt-vc-json', data: vc };
        }
    }

    if (vc && typeof vc === 'object') {
        const wireFromProof = extractWireFormFromVc(vc);
        if (wireFromProof) {
            const proof = getProofObject(vc);
            const proofType = proof?.type;
            if (proofType === 'SdJwtCompactProof') {
                return { format: 'dc+sd-jwt', data: wireFromProof };
            }
            if (proofType === 'JwtProof2020') {
                return { format: 'jwt-vc-json', data: wireFromProof };
            }
        }

        const inferred = inferW3cVersionFromContext(vc);
        return { format: inferred, data: vc as VC };
    }

    return { format: 'w3c-vc-1.1', data: vc as VC };
};

const SD_JWT_COMPACT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+~/;
const JWS_COMPACT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const looksLikeSdJwtCompact = (value: string): boolean => SD_JWT_COMPACT_RE.test(value);
const looksLikeJwsCompact = (value: string): boolean => JWS_COMPACT_RE.test(value);

const getProofObject = (vc: unknown): { type?: unknown; jwt?: unknown } | undefined => {
    if (!vc || typeof vc !== 'object') return undefined;
    const proof = (vc as { proof?: unknown }).proof;
    const flat = Array.isArray(proof)
        ? proof.find(p => p && typeof p === 'object')
        : proof;
    return flat && typeof flat === 'object'
        ? (flat as { type?: unknown; jwt?: unknown })
        : undefined;
};

const extractWireFormFromVc = (vc: unknown): string | undefined => {
    const proof = getProofObject(vc);
    if (proof && typeof proof.jwt === 'string' && proof.jwt.length > 0) {
        return proof.jwt;
    }
    return undefined;
};

/**
 * Extract the meaningful identifying segment from an SD-JWT-VC `vct` claim
 * so it can be projected onto the W3C-VC `type` array and `name` field.
 *
 * Returns `undefined` for vct values where no meaningful name can be
 * derived (numeric-only URN tails, empty string). Shared between the
 * receipt-time wrapper synthesizer and the read-time display projector
 * so SD-JWT credentials produce the same wrapper shape on both paths.
 */
export const extractVctSegment = (vct: string): string | undefined => {
    let segment: string | undefined;

    try {
        const url = new URL(vct);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length > 0) segment = parts[parts.length - 1]!;
        }
    } catch {
        // Not URL-shaped — fall through to URN / plain-string handling.
    }

    if (segment === undefined) {
        if (vct.includes(':')) {
            const parts = vct.split(':').filter(Boolean);
            const last = parts[parts.length - 1];
            // Skip purely numeric trailing segments (e.g., URN version tags like
            // "urn:eudi:pid:1") — the semantically meaningful name is one up.
            if (last && !/^\d+$/.test(last)) {
                segment = last;
            } else if (parts.length >= 2) {
                segment = parts[parts.length - 2];
            }
        } else {
            segment = vct;
        }
    }

    return segment && segment.length > 0 ? segment : undefined;
};

/**
 * PascalCase identifier suitable for the W3C-VC `type` array. Picks acronyms
 * for short single-word lowercase segments ("pid" → "PID") and otherwise
 * concatenates capitalized words ("playground-credential" → "PlaygroundCredential").
 */
export const deriveTypeFromVct = (vct: string | undefined): string | undefined => {
    if (!vct || typeof vct !== 'string') return undefined;
    const segment = extractVctSegment(vct);
    if (!segment) return undefined;

    const normalized = segment
        .replace(/[-_.]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim();
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) return undefined;

    if (words.length === 1 && words[0]!.length <= 4 && words[0] === words[0]!.toLowerCase()) {
        return words[0]!.toUpperCase();
    }
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};

/**
 * Human-readable display name for the `name` field. Same input handling
 * as {@link deriveTypeFromVct} but keeps spaces between words so it reads
 * naturally in UIs ("Playground Credential" not "PlaygroundCredential").
 */
export const deriveNameFromVct = (vct: string | undefined): string | undefined => {
    if (!vct || typeof vct !== 'string') return undefined;
    const segment = extractVctSegment(vct);
    if (!segment) return undefined;

    const normalized = segment
        .replace(/[-_.]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim();
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) return undefined;

    if (words.length === 1 && words[0]!.length <= 4 && words[0] === words[0]!.toLowerCase()) {
        return words[0]!.toUpperCase();
    }
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const stripSdJwtReservedClaims = (
    claims: Record<string, unknown>
): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(claims)) {
        if (!SD_JWT_RESERVED_CLAIMS.has(key)) out[key] = value;
    }
    return out;
};

const PRIVATE_JWK_FIELDS = new Set(['d', 'dp', 'dq', 'p', 'q', 'qi', 'oth', 'k']);

const bytesToBase64Url = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    const base64 =
        typeof btoa === 'function'
            ? btoa(binary)
            : Buffer.from(binary, 'binary').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const synthesizeDidJwk = (jwk: Record<string, unknown>): string | undefined => {
    if (typeof jwk.kty !== 'string') return undefined;

    const publicOnly: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(jwk)) {
        if (!PRIVATE_JWK_FIELDS.has(key)) publicOnly[key] = value;
    }

    try {
        const sortedKeys = Object.keys(publicOnly).sort();
        const canonical: Record<string, unknown> = {};
        for (const key of sortedKeys) canonical[key] = publicOnly[key];
        return `did:jwk:${bytesToBase64Url(new TextEncoder().encode(JSON.stringify(canonical)))}`;
    } catch {
        return undefined;
    }
};

export const deriveSdJwtIssuedAtIso = (options: {
    issuedAt?: Date;
    notBefore?: Date;
    iat?: number;
    nbf?: number;
}): string => {
    if (options.issuedAt) return options.issuedAt.toISOString();
    if (options.notBefore) return options.notBefore.toISOString();
    if (typeof options.iat === 'number') return new Date(options.iat * 1000).toISOString();
    if (typeof options.nbf === 'number') return new Date(options.nbf * 1000).toISOString();
    return SD_JWT_FALLBACK_ISSUED_AT_ISO;
};

const deriveVerificationMethodFromIssuer = (options: {
    issuer: string;
    headerKid?: unknown;
}): string | undefined => {
    if (!options.issuer.startsWith('did:') || typeof options.headerKid !== 'string') {
        return undefined;
    }

    return options.headerKid.startsWith('#')
        ? `${options.issuer}${options.headerKid}`
        : options.headerKid;
};

/**
 * Read-path shim: when a storage plugin returns a `StoredCredentialEnvelope` (because we
 * wrote a native non-W3C format like SD-JWT-VC), legacy UI components
 * that read `.credentialSubject` / `.issuer` / `.proof` need a VC-shaped
 * object. This projector synthesizes a minimal display-only VC from the
 * envelope so existing consumers keep working without per-component
 * format awareness.
 *
 * For SD-JWT-VC: decodes the unsigned JWS payload (signature is NOT
 * verified here — verification belongs to the dedicated verify chain),
 * surfaces the disclosed claims under `credentialSubject`, preserves
 * the compact form under `proof.jwt` and `proof.type = 'SdJwtCompactProof'`
 * so anything that already understands the SD-JWT-Compact-Proof shape
 * keeps working.
 *
 * For JWT-VC: decodes the JWS payload, returns its `vc` claim.
 *
 * For mDoc / unknown formats: returns `undefined` — the caller MUST
 * branch on format (`record.format === 'mso_mdoc'`) and use a
 * format-specific display path. We don't fabricate a fake VC for
 * binary credentials.
 *
 * This projector is intentionally LOSSY for SD-JWT — it produces a
 * display-only view, NOT a re-issuable credential. Egress paths
 * (sharing, presenting, re-uploading) MUST go through
 * `serializeForWire(stored)` (Phase 3) to recover the canonical
 * compact form from `envelope.data`. NEVER re-serialize from the
 * projected VC.
 */
export const projectEnvelopeToDisplayVc = (
    envelope: StoredCredentialEnvelope
): VC | undefined => {
    if (envelope.format === 'mso_mdoc') return undefined;

    const data = envelope.data;
    if (typeof data !== 'string' || data.length === 0) return undefined;

    if (envelope.format === 'dc+sd-jwt' || envelope.format === 'vc+sd-jwt') {
        return projectSdJwtCompactToVc(data);
    }

    if (envelope.format === 'jwt-vc-json') {
        return projectJwtVcCompactToVc(data);
    }

    return undefined;
};

const decodeJwsPayload = (compact: string): Record<string, unknown> | undefined => {
    const firstTilde = compact.indexOf('~');
    const jws = firstTilde >= 0 ? compact.slice(0, firstTilde) : compact;
    const parts = jws.split('.');
    if (parts.length !== 3) return undefined;
    try {
        const payloadJson = base64UrlDecodeToString(parts[1]!);
        const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
        return parsed && typeof parsed === 'object' ? parsed : undefined;
    } catch {
        return undefined;
    }
};

const base64UrlDecodeToString = (b64url: string): string => {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(padded)));
    return Buffer.from(padded, 'base64').toString('utf-8');
};

const projectSdJwtCompactToVc = (compact: string): VC | undefined => {
    let decoded;
    try {
        decoded = decodeSdJwtSync(compact, sha256HasherSync);
    } catch {
        return undefined;
    }

    const payload = decoded.jwt?.payload;
    if (!payload || typeof payload !== 'object') return undefined;

    const issuer = typeof payload.iss === 'string' ? payload.iss : 'unknown';
    const issuedAtIso = deriveSdJwtIssuedAtIso({
        iat: typeof payload.iat === 'number' ? payload.iat : undefined,
        nbf: typeof payload.nbf === 'number' ? payload.nbf : undefined,
    });
    const expiresAtSec = typeof payload.exp === 'number' ? payload.exp : undefined;

    let reconstructedClaims = payload as Record<string, unknown>;
    try {
        reconstructedClaims = getClaimsSync<Record<string, unknown>>(
            payload as Record<string, unknown>,
            decoded.disclosures ?? [],
            sha256HasherSync
        );
    } catch {
        // Fail closed on disclosures: keep only issuer-payload claims. A disclosure
        // whose digest doesn't match MUST NOT appear in the projected subject.
    }

    const credentialSubject: Record<string, unknown> = stripSdJwtReservedClaims(reconstructedClaims);
    const cnf = payload.cnf;
    const holderPublicKey =
        cnf && typeof cnf === 'object' && 'jwk' in cnf && cnf.jwk && typeof cnf.jwk === 'object'
            ? (cnf.jwk as Record<string, unknown>)
            : undefined;
    const holderDid = holderPublicKey ? synthesizeDidJwk(holderPublicKey) : undefined;
    if (holderDid) credentialSubject.id = holderDid;

    const vct = typeof payload.vct === 'string' ? payload.vct : undefined;

    const derivedType = deriveTypeFromVct(vct);
    const derivedName = deriveNameFromVct(vct);
    const typeArray = ['VerifiableCredential', 'SdJwtVcCredential'];
    if (derivedType && derivedType !== 'SdJwtVcCredential') typeArray.push(derivedType);

    const verificationMethod = deriveVerificationMethodFromIssuer({
        issuer,
        headerKid: decoded.jwt?.header?.kid,
    });

    const proof: Record<string, unknown> = {
        type: 'SdJwtCompactProof',
        created: issuedAtIso,
        proofPurpose: 'assertionMethod',
        jwt: compact,
    };
    if (verificationMethod) proof.verificationMethod = verificationMethod;

    const vc: VC = {
        '@context': ['https://www.w3.org/ns/credentials/v2' as string],
        type: typeArray,
        issuer,
        validFrom: issuedAtIso,
        credentialSubject,
        proof: proof as VC['proof'],
    };

    if (vct) (vc as Record<string, unknown>).sdJwtVct = vct;
    if (derivedName) (vc as Record<string, unknown>).name = derivedName;
    if (expiresAtSec) {
        (vc as Record<string, unknown>).validUntil = new Date(expiresAtSec * 1000).toISOString();
    }

    return vc;
};

const projectJwtVcCompactToVc = (compact: string): VC | undefined => {
    const payload = decodeJwsPayload(compact);
    if (!payload) return undefined;
    const vcClaim = payload.vc;
    if (!vcClaim || typeof vcClaim !== 'object') return undefined;
    return vcClaim as VC;
};

/**
 * Convenience: detect an envelope on the wire and return a legacy VC
 * shape suitable for downstream W3C-only consumers. Returns the input
 * unchanged if it's not an envelope (so callers can wrap any
 * `read.get` result without branching themselves).
 */
export const resolveStorageReadResult = (
    value: VC | StoredCredentialEnvelope | undefined
): VC | StoredCredentialEnvelope | undefined => {
    if (!value) return value;
    if (!isStoredCredentialEnvelope(value)) return value;
    const projected = projectEnvelopeToDisplayVc(value);
    return projected ?? value;
};

const inferW3cVersionFromContext = (vc: unknown): 'w3c-vc-2.0' | 'w3c-vc-1.1' => {
    if (!vc || typeof vc !== 'object') return 'w3c-vc-1.1';
    const contextRaw = (vc as { '@context'?: unknown })['@context'];
    const contexts = Array.isArray(contextRaw)
        ? contextRaw
        : contextRaw !== undefined
          ? [contextRaw]
          : [];
    const isV2 = contexts.some(
        c => typeof c === 'string' && c.includes('w3.org/ns/credentials/v2')
    );
    return isV2 ? 'w3c-vc-2.0' : 'w3c-vc-1.1';
};
