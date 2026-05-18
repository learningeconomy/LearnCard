import type { LearnCard } from '@learncard/core';

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

const stripReservedClaims = (claims: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(claims)) {
        if (!SD_JWT_RESERVED_CLAIMS.has(k)) out[k] = v;
    }
    return out;
};

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

    const issuedAtIso = parsed.issuedAt?.toISOString() ?? new Date().toISOString();
    const verificationMethod =
        typeof parsed.header?.kid === 'string'
            ? parsed.header.kid.startsWith('#')
                ? `${parsed.issuer}${parsed.header.kid}`
                : parsed.header.kid
            : `${parsed.issuer}#0`;

    const subject: { id?: string; [k: string]: unknown } = {
        ...stripReservedClaims(parsed.claims),
    };
    const cnfKid = parsed.holderPublicKey && (parsed.holderPublicKey.kid as unknown);
    if (typeof cnfKid === 'string') subject.id = cnfKid;
    else if (parsed.issuer) subject.id = parsed.issuer;

    const vc: W3CVerifiableCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential', 'SdJwtVcCredential'],
        issuer: parsed.issuer,
        validFrom: issuedAtIso,
        credentialSubject: subject,
        sdJwtVct: parsed.vct,
        proof: {
            type: 'SdJwtCompactProof',
            created: issuedAtIso,
            proofPurpose: 'assertionMethod',
            verificationMethod,
            jwt: credential,
        },
    };

    if (parsed.expiresAt) vc.validUntil = parsed.expiresAt.toISOString();

    return { vc, rawFormat: format, jwt: credential };
};

export const extractSdJwtVct = (vc: W3CVerifiableCredential): string | undefined => {
    const value = (vc as Record<string, unknown>).sdJwtVct;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};
