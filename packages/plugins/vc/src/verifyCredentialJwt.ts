import type { VC, VerificationCheck } from '@learncard/types';
import { isStoredCredentialEnvelope } from '@learncard/types';
import type { ProofOptions } from '@learncard/didkit-plugin';

import type { VCDependentLearnCard } from './types';

/**
 * LC-2195 verified VC-JWT normalization.
 *
 * The compact token is the source of truth. This module:
 *
 * 1. Extracts the exact compact JWS bytes from a raw token, a canonical
 *    `{ format: 'jwt-vc-json', data }` storage envelope, or a legacy
 *    `JwtProof2020`/`proof.jwt` projection.
 * 2. Rejects structurally unsupported profiles and algorithms before any
 *    caller-supplied metadata can be used.
 * 3. Verifies the token with the existing DIDKit/SSI primitive
 *    (`initLearnCard.invoke.verifyCredential(token, { proofFormat: 'jwt' })`).
 *    Signature, issuer authorization and key resolution are entirely delegated
 *    to that verifier — no custom cryptography lives here.
 * 4. Reconciles the registered JOSE claims (`iss`, `sub`, `jti`, `iat`, `nbf`,
 *    `exp`) against the embedded `vc` claim and fails closed on contradictions,
 *    ambiguous subject bindings and malformed NumericDates.
 * 5. Returns a typed normalized credential derived only from the verified
 *    payload, plus the exact original token. Caller mutations of a display
 *    object never influence the result.
 *
 * Successful verification currently reports `checks: ['JWS']`. Verification
 * failures follow the existing `VerificationCheck` convention
 * (`{ checks, warnings, errors }`).
 */

const COMPACT_JWS_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Symmetric and unsigned algorithms are never acceptable for a VC-JWT. */
const UNSUPPORTED_JWT_ALGORITHMS = new Set(['none', 'hs256', 'hs384', 'hs512']);

const VCDM_1_CONTEXT = 'https://www.w3.org/2018/credentials/v1';
const VCDM_2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';

export type VerifiedCredentialProfile = 'vc-jwt-1.1' | 'vc-jwt-2.0-legacy';

/**
 * Authoritative, token-derived metadata. Every field here comes from the
 * cryptographically verified compact token payload — never from a caller's
 * mutable display object.
 */
export type VerifiedCredentialMetadata = {
    /** VCDM major version established from the verified payload context. */
    version: '1.1' | '2.0';
    /** Explicit securing profile. The only supported V2 profile is legacy JOSE wrapping. */
    profile: VerifiedCredentialProfile;
    /** Normalized issuer identifier (registered `iss`, else embedded `issuer`). */
    issuer: string;
    /** Normalized credential subject identifiers, in credential order. */
    subjectIds: string[];
    /** Normalized credential id (registered `jti`, else embedded `id`). */
    id?: string;
    /** Normalized issuance time (embedded, cross-checked against `iat`/`nbf`). */
    issuedAt?: string;
    /** Registered `nbf`, when present. May legitimately differ from `iat`. */
    notBefore?: string;
    /** Normalized expiration time (embedded, cross-checked against `exp`). */
    expiresAt?: string;
    /** JOSE `alg` from the verified protected header. */
    algorithm: string;
    /** JOSE `kid` from the verified protected header, when present. */
    keyId?: string;
};

export type VerifiedCredentialJwt = {
    /** The exact compact JWS bytes that were cryptographically verified. */
    token: string;
    /** Authoritative normalized credential derived from the verified token. */
    credential: VC;
    /** Token-derived authoritative metadata. */
    metadata: VerifiedCredentialMetadata;
};

export type VerifiedCredentialJwtResult =
    ({ verified: true } & VerifiedCredentialJwt) | { verified: false; check: VerificationCheck };

export type VerifyCredentialJwtOptions = {
    /** Proof options forwarded to the existing verifier. `proofFormat` is always forced to `jwt`. */
    proofOptions?: Partial<ProofOptions>;
    /**
     * Temporal policy for this verification.
     *
     * Defaults to `'strict'`. `'allow-expired-for-renewal'` additionally accepts
     * an already-expired but signature-valid token as **renewal-only valid**,
     * reporting the `JWSRenewalExpired` check. It is used only by
     * `refreshCredential` for the held credential; replacements and ordinary
     * verification are always strict. The value is a typed, explicit opt-in and
     * the low-level `allowExpiredCredential` field is never forwarded from
     * caller-supplied `proofOptions`.
     */
    policy?: VerifyCredentialJwtPolicy;
};

export type VerifyCredentialJwtPolicy = 'strict' | 'allow-expired-for-renewal';

export type VerifiedCredentialTemporalStatus = 'valid' | 'expired' | 'not-yet-valid';

const failure = (errors: string[]): { verified: false; check: VerificationCheck } => ({
    verified: false,
    check: { checks: [], warnings: [], errors },
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const asProofEntries = (proof: unknown): unknown[] => {
    if (Array.isArray(proof)) return proof;
    return proof === undefined || proof === null ? [] : [proof];
};

const extractJwtFromProof = (proof: unknown): string | undefined => {
    for (const entry of asProofEntries(proof)) {
        if (!isPlainObject(entry)) continue;
        if (entry.type !== 'JwtProof2020') continue;
        if (typeof entry.jwt === 'string' && entry.jwt.length > 0) return entry.jwt;
    }

    return undefined;
};

/**
 * Extract the exact compact JWS bytes from a supported JWT-backed input.
 *
 * Accepts a raw compact token, a `jwt-vc-json` storage envelope, or a legacy
 * `JwtProof2020`/`proof.jwt` projection. Returns `undefined` when the input is
 * not JWT-backed (callers fall back to the JSON-LD path). SD-JWT compact forms
 * are explicitly out of scope and never extracted here.
 */
export const extractCompactJwt = (input: unknown): string | undefined => {
    if (typeof input === 'string') return COMPACT_JWS_RE.test(input) ? input : undefined;

    if (isStoredCredentialEnvelope(input)) {
        if (input.format !== 'jwt-vc-json') return undefined;
        if (typeof input.data !== 'string') return undefined;

        return COMPACT_JWS_RE.test(input.data) ? input.data : undefined;
    }

    if (isPlainObject(input)) return extractJwtFromProof(input.proof);

    return undefined;
};

const base64UrlDecode = (segment: string): Uint8Array => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

    if (typeof atob === 'function') {
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }

        return bytes;
    }

    return Uint8Array.from(Buffer.from(padded, 'base64'));
};

const decodeBase64UrlJson = (segment: string): unknown => {
    const json = new TextDecoder().decode(base64UrlDecode(segment));

    return JSON.parse(json) as unknown;
};

type DecodedJws = { header: Record<string, unknown>; payload: Record<string, unknown> };

const decodeJws = (
    token: string
): { decoded: DecodedJws; errors?: undefined } | { decoded?: undefined; errors: string[] } => {
    const parts = token.split('.');

    if (parts.length !== 3) return { errors: ['Compact VC-JWT must have three segments'] };

    const [headerSegment, payloadSegment] = parts;

    if (!headerSegment || !payloadSegment) {
        return { errors: ['Compact VC-JWT is missing a header or payload segment'] };
    }

    let header: unknown;
    let payload: unknown;

    try {
        header = decodeBase64UrlJson(headerSegment);
    } catch {
        return { errors: ['Compact VC-JWT protected header is not valid base64url JSON'] };
    }

    try {
        payload = decodeBase64UrlJson(payloadSegment);
    } catch {
        return { errors: ['Compact VC-JWT payload is not valid base64url JSON'] };
    }

    if (!isPlainObject(header))
        return { errors: ['Compact VC-JWT protected header must be an object'] };
    if (!isPlainObject(payload)) return { errors: ['Compact VC-JWT payload must be an object'] };

    return { decoded: { header, payload } };
};

const validateHeader = (header: Record<string, unknown>): string[] => {
    const errors: string[] = [];
    const alg = header.alg;

    if (typeof alg !== 'string' || alg.length === 0) {
        errors.push('Compact VC-JWT protected header is missing a string "alg"');
    } else if (UNSUPPORTED_JWT_ALGORITHMS.has(alg.toLowerCase())) {
        errors.push(`Unsupported VC-JWT algorithm "${alg}"`);
    }

    if (header.kid !== undefined && typeof header.kid !== 'string') {
        errors.push('Compact VC-JWT protected header "kid" must be a string when present');
    }

    return errors;
};

const getContextValues = (vc: Record<string, unknown>): string[] => {
    const context = vc['@context'];

    if (Array.isArray(context))
        return context.filter((entry): entry is string => typeof entry === 'string');
    if (typeof context === 'string') return [context];

    return [];
};

const detectProfile = (
    vc: Record<string, unknown>
): { version: '1.1' | '2.0'; profile: VerifiedCredentialProfile } | { errors: string[] } => {
    const contexts = getContextValues(vc);

    if (contexts.some(context => context.startsWith(VCDM_2_CONTEXT))) {
        return { version: '2.0', profile: 'vc-jwt-2.0-legacy' };
    }

    if (contexts.some(context => context.startsWith(VCDM_1_CONTEXT))) {
        return { version: '1.1', profile: 'vc-jwt-1.1' };
    }

    return {
        errors: [
            'Unsupported credential securing profile: payload context is neither VCDM 1.1 nor VCDM 2.0',
        ],
    };
};

const getIssuerId = (issuer: unknown): string | undefined => {
    if (typeof issuer === 'string') return issuer.length > 0 ? issuer : undefined;

    if (isPlainObject(issuer) && typeof issuer.id === 'string' && issuer.id.length > 0) {
        return issuer.id;
    }

    return undefined;
};

const getSubjectIds = (credentialSubject: unknown): string[] | undefined => {
    const subjects = Array.isArray(credentialSubject) ? credentialSubject : [credentialSubject];

    if (subjects.length === 0) return [];

    const ids: string[] = [];

    for (const subject of subjects) {
        if (subject === undefined || subject === null) continue;
        if (!isPlainObject(subject)) return undefined;

        if (subject.id === undefined) continue;
        if (typeof subject.id !== 'string' || subject.id.length === 0) return undefined;

        ids.push(subject.id);
    }

    return ids;
};

const parseEmbeddedTimestamp = (
    value: unknown,
    label: string
): { seconds?: number; errors: string[] } => {
    if (value === undefined || value === null) return { errors: [] };

    if (typeof value !== 'string' || value.length === 0) {
        return { errors: [`Embedded ${label} must be a non-empty string when present`] };
    }

    const parsed = Date.parse(value);

    if (!Number.isFinite(parsed)) return { errors: [`Embedded ${label} is not a valid date`] };

    return { seconds: Math.floor(parsed / 1000), errors: [] };
};

const readNumericDate = (
    payload: Record<string, unknown>,
    name: 'iat' | 'nbf' | 'exp'
): { seconds?: number; errors: string[] } => {
    if (!(name in payload)) return { errors: [] };

    const value = payload[name];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { errors: [`Registered claim "${name}" must be a finite NumericDate`] };
    }

    return { seconds: Math.floor(value), errors: [] };
};

const buildVerificationMethod = (issuer: string, keyId?: string): string => {
    if (!keyId) return issuer;
    if (keyId.startsWith('#')) return `${issuer}${keyId}`;

    return keyId;
};

const assertKeyIdAuthorizedForIssuer = (issuer: string, keyId: string | undefined): string[] => {
    if (!keyId || !issuer.startsWith('did:') || !keyId.startsWith('did:')) return [];

    const keyDid = keyId.includes('#') ? keyId.slice(0, keyId.indexOf('#')) : keyId;

    return keyDid === issuer
        ? []
        : [`JWT "kid" (${keyId}) is not authorized by the normalized issuer (${issuer})`];
};

type Reconciled =
    | { ok: true; credential: VC; metadata: VerifiedCredentialMetadata }
    | { ok: false; errors: string[] };

/**
 * Reconcile registered JOSE claims with the embedded `vc` claim and build the
 * authoritative normalized credential + metadata. The input payload has already
 * been signature-verified; this function only enforces internal consistency.
 */
const reconcileVerifiedClaims = (
    token: string,
    header: Record<string, unknown>,
    payload: Record<string, unknown>
): Reconciled => {
    const errors: string[] = [];

    const embedded = payload.vc;

    if (!isPlainObject(embedded)) {
        return {
            ok: false,
            errors: ['Compact VC-JWT payload is missing the required object "vc" claim'],
        };
    }

    const profile = detectProfile(embedded);

    if ('errors' in profile) return { ok: false, errors: profile.errors };

    const typeValue = embedded.type;
    const typeEntries = Array.isArray(typeValue)
        ? typeValue
        : typeValue === undefined
          ? []
          : [typeValue];

    if (
        typeEntries.length === 0 ||
        typeEntries.some(entry => typeof entry !== 'string' || entry.length === 0)
    ) {
        return { ok: false, errors: ['Verified VC-JWT is missing a usable credential "type"'] };
    }

    // --- issuer -------------------------------------------------------------
    let issuer: string | undefined;
    const embeddedIssuer = getIssuerId(embedded.issuer);

    if ('iss' in payload) {
        if (typeof payload.iss !== 'string' || payload.iss.length === 0) {
            errors.push('Registered claim "iss" must be a non-empty string');
        } else if (embeddedIssuer !== undefined && embeddedIssuer !== payload.iss) {
            errors.push(
                `Registered claim "iss" (${payload.iss}) conflicts with embedded issuer (${embeddedIssuer})`
            );
        } else {
            issuer = payload.iss;
        }
    } else {
        issuer = embeddedIssuer;
    }

    if (!issuer) errors.push('Verified VC-JWT has no usable issuer');

    // --- credential id ------------------------------------------------------
    let id: string | undefined;
    const embeddedId = typeof embedded.id === 'string' ? embedded.id : undefined;

    if ('jti' in payload) {
        if (typeof payload.jti !== 'string' || payload.jti.length === 0) {
            errors.push('Registered claim "jti" must be a non-empty string');
        } else if (embeddedId !== undefined && embeddedId !== payload.jti) {
            errors.push(
                `Registered claim "jti" (${payload.jti}) conflicts with embedded id (${embeddedId})`
            );
        } else {
            id = payload.jti;
        }
    } else {
        id = embeddedId;
    }

    // --- credentialSubject / sub -------------------------------------------
    const embeddedSubject = embedded.credentialSubject;

    if (embeddedSubject !== undefined && embeddedSubject !== null) {
        if (getSubjectIds(embeddedSubject) === undefined) {
            errors.push('Embedded credentialSubject contains a malformed "id"');
        }
    }

    let normalizedSubject = embeddedSubject;

    if ('sub' in payload) {
        if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
            errors.push('Registered claim "sub" must be a non-empty string');
        } else {
            const subjects = Array.isArray(embeddedSubject)
                ? embeddedSubject
                : embeddedSubject === undefined || embeddedSubject === null
                  ? []
                  : [embeddedSubject];

            if (subjects.length > 1) {
                errors.push(
                    'Registered claim "sub" is ambiguous: embedded credential has multiple subjects'
                );
            } else if (subjects.length === 1) {
                const only = subjects[0];

                if (isPlainObject(only)) {
                    if (only.id !== undefined && only.id !== payload.sub) {
                        errors.push(
                            `Registered claim "sub" (${payload.sub}) conflicts with embedded subject id (${String(
                                only.id
                            )})`
                        );
                    } else {
                        normalizedSubject = { ...only, id: payload.sub };
                    }
                }
            } else {
                normalizedSubject = { id: payload.sub };
            }
        }
    }

    // --- temporal claims ----------------------------------------------------
    const iat = readNumericDate(payload, 'iat');
    const nbf = readNumericDate(payload, 'nbf');
    const exp = readNumericDate(payload, 'exp');

    errors.push(...iat.errors, ...nbf.errors, ...exp.errors);

    const issuanceDate = parseEmbeddedTimestamp(embedded.issuanceDate, 'issuanceDate');
    const validFrom = parseEmbeddedTimestamp(embedded.validFrom, 'validFrom');
    const expirationDate = parseEmbeddedTimestamp(embedded.expirationDate, 'expirationDate');
    const validUntil = parseEmbeddedTimestamp(embedded.validUntil, 'validUntil');

    errors.push(
        ...issuanceDate.errors,
        ...validFrom.errors,
        ...expirationDate.errors,
        ...validUntil.errors
    );

    const isV1 = profile.version === '1.1';
    const embeddedIssuedAt = isV1
        ? issuanceDate.seconds
        : (issuanceDate.seconds ?? validFrom.seconds);
    const embeddedExpiresAt = expirationDate.seconds ?? validUntil.seconds;
    const registeredIssuedAt = isV1 ? nbf.seconds : (iat.seconds ?? nbf.seconds);

    // VCDM 1.1 maps `nbf` to issuanceDate. `iat` dates the JWT itself and must
    // neither replace that mapping nor suppress its consistency check.
    // Preserve the separately supported legacy V2 profile's existing mapping.
    if (
        !isV1 &&
        iat.seconds !== undefined &&
        embeddedIssuedAt !== undefined &&
        iat.seconds !== embeddedIssuedAt
    ) {
        errors.push(
            `Registered claim "iat" (${iat.seconds}) conflicts with embedded issuance timeline (${embeddedIssuedAt})`
        );
    }

    if (
        (isV1 || iat.seconds === undefined) &&
        nbf.seconds !== undefined &&
        embeddedIssuedAt !== undefined &&
        nbf.seconds !== embeddedIssuedAt
    ) {
        errors.push(
            `Registered claim "nbf" (${nbf.seconds}) conflicts with embedded issuance timeline (${embeddedIssuedAt})`
        );
    }

    if (isV1 && embeddedIssuedAt === undefined && nbf.seconds === undefined) {
        errors.push('VC 1.1 requires issuanceDate or its mapped registered claim "nbf"');
    }

    if (
        exp.seconds !== undefined &&
        embeddedExpiresAt !== undefined &&
        exp.seconds !== embeddedExpiresAt
    ) {
        errors.push(
            `Registered claim "exp" (${exp.seconds}) conflicts with embedded expiration timeline (${embeddedExpiresAt})`
        );
    }

    const issuedAtSeconds = embeddedIssuedAt ?? registeredIssuedAt;
    const expiresAtSeconds = embeddedExpiresAt ?? exp.seconds;

    if (
        expiresAtSeconds !== undefined &&
        issuedAtSeconds !== undefined &&
        issuedAtSeconds > expiresAtSeconds
    ) {
        errors.push('Verified VC-JWT issuance time is after its expiration time');
    }

    if (
        expiresAtSeconds !== undefined &&
        nbf.seconds !== undefined &&
        nbf.seconds > expiresAtSeconds
    ) {
        errors.push('Registered claim "nbf" is after registered claim "exp"');
    }

    // --- key authorization binding -----------------------------------------
    const keyId = typeof header.kid === 'string' ? header.kid : undefined;

    if (issuer) errors.push(...assertKeyIdAuthorizedForIssuer(issuer, keyId));

    if (errors.length > 0) return { ok: false, errors };

    const algorithm = header.alg as string;

    const normalized: Record<string, unknown> = { ...embedded };

    if (issuer) normalized.issuer = issuer;
    if (id !== undefined) normalized.id = id;
    if (normalizedSubject !== undefined) normalized.credentialSubject = normalizedSubject;

    if (registeredIssuedAt !== undefined) {
        const seconds = registeredIssuedAt;

        if (
            embedded.issuanceDate === undefined &&
            (isV1 || embedded.validFrom === undefined) &&
            seconds !== undefined
        ) {
            normalized.issuanceDate = new Date(seconds * 1000).toISOString();
        }
    }

    if (exp.seconds !== undefined) {
        if (embedded.expirationDate === undefined && embedded.validUntil === undefined) {
            normalized.expirationDate = new Date(exp.seconds * 1000).toISOString();
        }
    }

    normalized.proof = {
        type: 'JwtProof2020',
        created:
            issuedAtSeconds !== undefined
                ? new Date(issuedAtSeconds * 1000).toISOString()
                : new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: buildVerificationMethod(issuer as string, keyId),
        jwt: token,
    };

    const subjectIds =
        normalizedSubject !== undefined ? (getSubjectIds(normalizedSubject) ?? []) : [];

    return {
        ok: true,
        credential: normalized as VC,
        metadata: {
            version: profile.version,
            profile: profile.profile,
            issuer: issuer as string,
            subjectIds,
            ...(id !== undefined ? { id } : {}),
            ...(issuedAtSeconds !== undefined
                ? { issuedAt: new Date(issuedAtSeconds * 1000).toISOString() }
                : {}),
            ...(nbf.seconds !== undefined
                ? { notBefore: new Date(nbf.seconds * 1000).toISOString() }
                : {}),
            ...(expiresAtSeconds !== undefined
                ? { expiresAt: new Date(expiresAtSeconds * 1000).toISOString() }
                : {}),
            algorithm,
            ...(keyId !== undefined ? { keyId } : {}),
        },
    };
};

const proofVerified = (check: VerificationCheck | null | undefined): boolean =>
    !!check &&
    check.errors.length === 0 &&
    check.warnings.length === 0 &&
    check.checks.includes('JWS');

/**
 * Verify and normalize a JWT-backed credential.
 *
 * On success returns the exact original token, the authoritative normalized
 * credential and token-derived metadata. On failure returns the existing
 * `VerificationCheck` convention with additive reconciliation errors. Never
 * throws for malformed tokens — callers receive `verified: false`.
 *
 * `initLearnCard` must be the DIDKit-backed dependent methods object (the VC
 * plugin's injected dependency), NOT the merged top-level LearnCard, so that
 * the call cannot recurse into this plugin's own `verifyCredential`.
 */
export const verifyCredentialJwt = async (
    initLearnCard: VCDependentLearnCard,
    input: unknown,
    options: VerifyCredentialJwtOptions = {}
): Promise<VerifiedCredentialJwtResult> => {
    const token = extractCompactJwt(input);

    if (!token) {
        return failure([
            'Input is not a supported JWT-backed credential (expected a compact JWS, a jwt-vc-json envelope, or a JwtProof2020 proof.jwt)',
        ]);
    }

    const decoded = decodeJws(token);

    if (!decoded.decoded) return failure(decoded.errors);

    const headerErrors = validateHeader(decoded.decoded.header);

    if (headerErrors.length > 0) return failure(headerErrors);

    // Structural/claim reconciliation runs on the decoded payload before crypto
    // so unsupported profiles, algorithms already rejected above, malformed
    // NumericDates and claim contradictions fail with precise errors. It is
    // only ever used to REJECT: the normalized credential below is not returned
    // until the signature has been verified by the existing DIDKit primitive.
    const reconciled = reconcileVerifiedClaims(
        token,
        decoded.decoded.header,
        decoded.decoded.payload
    );

    if (!reconciled.ok) return failure(reconciled.errors);

    let check: VerificationCheck;

    // Never forward a caller-supplied low-level renewal opt-in. Renewal is
    // selected only by the typed `policy` through the dedicated renewal method.
    const forwardedOptions: Partial<ProofOptions> = {
        ...options.proofOptions,
        proofFormat: 'jwt',
    };
    delete (forwardedOptions as Record<string, unknown>).allowExpiredCredential;

    try {
        if (options.policy === 'allow-expired-for-renewal') {
            check = await initLearnCard.invoke.verifyCredentialForRenewal(token, forwardedOptions);
        } else {
            check = await initLearnCard.invoke.verifyCredential(token, forwardedOptions);
        }
    } catch (error) {
        return failure([
            `VC-JWT verification failed: ${
                error instanceof Error ? error.message : 'unknown verifier error'
            }`,
        ]);
    }

    if (!proofVerified(check)) {
        return { verified: false, check };
    }

    return {
        verified: true,
        token,
        credential: reconciled.credential,
        metadata: reconciled.metadata,
    };
};

/**
 * Evaluates the verified token's temporal position without re-parsing
 * unverified bytes.
 *
 * A token verified with `policy: 'allow-expired-for-renewal'` returns
 * `'expired'` here; that is expected and is what lets `refreshCredential` renew
 * an expired held credential while still rejecting a replacement that is not
 * temporally valid.
 */
export const getVerifiedCredentialTemporalStatus = (
    verified: VerifiedCredentialJwt,
    at: Date = new Date()
): VerifiedCredentialTemporalStatus => {
    const now = at.getTime();

    const expiresAt = verified.metadata.expiresAt
        ? Date.parse(verified.metadata.expiresAt)
        : undefined;

    if (expiresAt !== undefined && Number.isFinite(expiresAt) && now >= expiresAt) return 'expired';

    const notBefore = verified.metadata.notBefore
        ? Date.parse(verified.metadata.notBefore)
        : undefined;

    if (notBefore !== undefined && Number.isFinite(notBefore) && now < notBefore)
        return 'not-yet-valid';

    return 'valid';
};
