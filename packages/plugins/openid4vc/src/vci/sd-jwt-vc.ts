import type { LearnCard } from '@learncard/core';
import {
    deriveNameFromVct as deriveNameFromVctImpl,
    deriveTypeFromVct as deriveTypeFromVctImpl,
} from '@learncard/helpers';

import { VciError } from './errors';
import type { NormalizedCredential, W3CVerifiableCredential } from './decode';

export const SD_JWT_VC_FORMAT = 'dc+sd-jwt';
export const SD_JWT_VC_FORMAT_LEGACY = 'vc+sd-jwt';

export const isSdJwtFormat = (format: string): boolean =>
    format === SD_JWT_VC_FORMAT || format === SD_JWT_VC_FORMAT_LEGACY;

interface ParsedSdJwtVcLike {
    vct: string;
    issuer: string;
    issuedAt?: Date;
    expiresAt?: Date;
    notBefore?: Date;
    claims: Record<string, unknown>;
    holderPublicKey?: Record<string, unknown>;
    header?: { kid?: string; alg?: string; typ?: string; [k: string]: unknown };
    rawSdJwt: string;
    hasKeyBinding: boolean;
}

// vct derivation lives in @learncard/helpers (lifted in ADR-0001 Phase 2B)
// so the receipt-time wrapper synthesizer and the read-time display projector
// share one source of truth. Re-exported here so existing openid4vc consumers
// (and the matcher's format-aware paths) keep their import shape.
export const deriveTypeFromVct = deriveTypeFromVctImpl;
export const deriveNameFromVct = deriveNameFromVctImpl;

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

const PRIVATE_JWK_FIELDS = new Set(['d', 'dp', 'dq', 'p', 'q', 'qi', 'oth', 'k']);
const SD_JWT_FALLBACK_ISSUED_AT_ISO = '1970-01-01T00:00:00.000Z';

const bytesToBase64Url = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const stripReservedClaims = (claims: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(claims)) {
        if (!SD_JWT_RESERVED_CLAIMS.has(key)) out[key] = value;
    }
    return out;
};

const synthesizeDidJwk = (jwk: Record<string, unknown>): string | undefined => {
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

const deriveIssuedAtIso = (parsed: ParsedSdJwtVcLike): string =>
    parsed.issuedAt?.toISOString() ??
    parsed.notBefore?.toISOString() ??
    SD_JWT_FALLBACK_ISSUED_AT_ISO;

const callPluginParse = async (
    learnCard: LearnCard<any, any, any>,
    compact: string
): Promise<ParsedSdJwtVcLike> => {
    const parseFn = (learnCard?.invoke as Record<string, unknown> | undefined)?.parseSdJwtVc;
    if (typeof parseFn !== 'function') {
        throw new VciError(
            'unsupported_format',
            'SD-JWT-VC credential received, but @learncard/sd-jwt-vc-plugin is not installed on this LearnCard. Add the plugin to enable SD-JWT support.'
        );
    }
    try {
        return (await (parseFn as (c: string) => Promise<ParsedSdJwtVcLike>)(
            compact
        )) as ParsedSdJwtVcLike;
    } catch (e) {
        throw new VciError(
            'unsupported_format',
            `Failed to parse SD-JWT-VC credential: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }
};

interface VerificationCheckLike {
    errors?: unknown;
    warnings?: unknown;
    checks?: unknown;
}

const callPluginVerify = async (
    learnCard: LearnCard<any, any, any>,
    compact: string
): Promise<VerificationCheckLike | undefined> => {
    const verifyFn = (learnCard?.invoke as Record<string, unknown> | undefined)?.verifySdJwtVc;
    if (typeof verifyFn !== 'function') return undefined;
    try {
        // Receipt-time verification covers signature + disclosure-hash integrity
        // ONLY. Status (Token Status List) is intentionally skipped here because
        // freshness checks belong at display / re-verify time — at receipt the
        // issuer may not have published the status list yet, especially in
        // integration / staging. The wallet's existing verifyCredential call on
        // display will catch revocation when status checking ships in Slice 4.
        return (await (
            verifyFn as (
                c: string,
                opts: Record<string, unknown>
            ) => Promise<VerificationCheckLike>
        )(compact, { skipStatusCheck: true })) as VerificationCheckLike;
    } catch (e) {
        throw new VciError(
            'unsupported_format',
            `Failed to verify SD-JWT-VC credential at receipt: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }
};

export const synthesizeSdJwtVc = async (
    credential: unknown,
    format: string,
    learnCard: LearnCard<any, any, any>
): Promise<NormalizedCredential> => {
    if (typeof credential !== 'string' || credential.length === 0) {
        throw new VciError(
            'unsupported_format',
            `${format} credential must be a compact SD-JWT string (received ${typeof credential})`
        );
    }

    const parsed = await callPluginParse(learnCard, credential);

    const headerTyp = parsed.header?.typ;
    if (typeof headerTyp === 'string' && headerTyp !== format) {
        throw new VciError(
            'unsupported_format',
            `OID4VCI issuer advertised credential format "${format}" but SD-JWT JOSE header typ is "${headerTyp}"`
        );
    }

    // Verify the issuer signature + disclosure hash integrity BEFORE synthesizing
    // the wallet-side W3C VC. Without this, a tampered or unsigned SD-JWT would
    // be stored under proof.type='SdJwtCompactProof' and the downstream
    // verifyCredential delegation in vc-plugin would be the only check — leaving
    // a window where the credential exists in the wallet store but its signature
    // has never been validated. Fail at receipt rather than at first display.
    const verification = await callPluginVerify(learnCard, credential);
    if (verification) {
        const errors = Array.isArray(verification.errors) ? verification.errors : [];
        if (errors.length > 0) {
            throw new VciError(
                'unsupported_format',
                `SD-JWT-VC failed receipt verification: ${errors.join('; ')}`
            );
        }
    }

    const issuedAtIso = deriveIssuedAtIso(parsed);

    const issuerIsDid = parsed.issuer.startsWith('did:');
    const kid = parsed.header?.kid;
    // verificationMethod is emitted only when we have a concrete kid pointing at
    // a real verification method in the issuer's DID document. If the JOSE header
    // didn't set kid, we omit it rather than fabricating `${issuer}#0` — that
    // fragment usually doesn't resolve, and the real signature lives in proof.jwt
    // anyway. Consumers that need the VM can re-derive it from the SD-JWT header
    // once kid arrives.
    const verificationMethod =
        issuerIsDid && typeof kid === 'string'
            ? kid.startsWith('#')
                ? `${parsed.issuer}${kid}`
                : kid
            : undefined;

    const subject: { id?: string; [k: string]: unknown } = {
        ...stripReservedClaims(parsed.claims),
    };
    if (parsed.holderPublicKey) {
        const holderDid = synthesizeDidJwk(parsed.holderPublicKey);
        if (holderDid) subject.id = holderDid;
    }

    const proof: Record<string, unknown> = {
        type: 'SdJwtCompactProof',
        created: issuedAtIso,
        proofPurpose: 'assertionMethod',
        jwt: credential,
    };
    if (verificationMethod) proof.verificationMethod = verificationMethod;

    const derivedType = deriveTypeFromVct(parsed.vct);
    const derivedName = deriveNameFromVct(parsed.vct);
    const typeArray: string[] = ['VerifiableCredential', 'SdJwtVcCredential'];
    if (derivedType && derivedType !== 'SdJwtVcCredential') {
        typeArray.push(derivedType);
    }

    const vc: W3CVerifiableCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: typeArray,
        issuer: parsed.issuer,
        validFrom: issuedAtIso,
        credentialSubject: subject,
        sdJwtVct: parsed.vct,
        proof,
    };
    if (derivedName) {
        (vc as Record<string, unknown>).name = derivedName;
    }

    if (parsed.expiresAt) vc.validUntil = parsed.expiresAt.toISOString();

    const formatTag = format === SD_JWT_VC_FORMAT_LEGACY ? 'vc+sd-jwt' : 'dc+sd-jwt';

    return {
        vc,
        rawFormat: format,
        jwt: credential,
        format: formatTag,
        rawWireForm: credential,
        semanticType: parsed.vct,
    };
};

export const extractSdJwtVct = (vc: W3CVerifiableCredential): string | undefined => {
    const proof = (vc as { proof?: unknown }).proof;
    const proofType =
        proof && typeof proof === 'object' ? (proof as { type?: unknown }).type : undefined;
    if (proofType !== 'SdJwtCompactProof') return undefined;
    const value = (vc as Record<string, unknown>).sdJwtVct;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};
