import type { Plugin, LearnCard } from '@learncard/core';
import type { VerificationCheck } from '@learncard/types';
import type { DidkitPluginMethods } from '@learncard/didkit-plugin';

export const SD_JWT_VC_FORMAT = 'dc+sd-jwt' as const;
export const SD_JWT_VC_FORMAT_LEGACY = 'vc+sd-jwt' as const;

export type SdJwtVcFormat = typeof SD_JWT_VC_FORMAT | typeof SD_JWT_VC_FORMAT_LEGACY;

export const isSdJwtVcFormat = (value: unknown): value is SdJwtVcFormat =>
    value === SD_JWT_VC_FORMAT || value === SD_JWT_VC_FORMAT_LEGACY;

export const CLOCK_SKEW_MS = 60_000;

export interface SdJwtHeader {
    alg: string;
    typ?: string;
    kid?: string;
    [k: string]: unknown;
}

export interface SdJwtPayload {
    iss?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    sub?: string;
    vct?: string;
    cnf?: { jwk?: Record<string, unknown>; [k: string]: unknown };
    status?: unknown;
    _sd_alg?: string;
    [k: string]: unknown;
}

export interface ParsedSdJwtVc {
    vct: string;
    issuer: string;
    issuedAt?: Date;
    expiresAt?: Date;
    notBefore?: Date;
    holderPublicKey?: Record<string, unknown>;
    claims: Record<string, unknown>;
    disclosureKeys: string[];
    header: SdJwtHeader;
    rawPayload: SdJwtPayload;
    rawSdJwt: string;
    format: SdJwtVcFormat;
    hasKeyBinding: boolean;
}

export interface VerifySdJwtVcOptions {
    audience?: string;
    nonce?: string;
    expectedVct?: string;
    now?: () => Date;
    skipStatusCheck?: boolean;
}

export type SdJwtVcErrorCode =
    | 'invalid_compact_form'
    | 'invalid_jwt'
    | 'missing_iss'
    | 'missing_vct'
    | 'missing_alg'
    | 'unsupported_alg'
    | 'invalid_disclosure'
    | 'disclosure_hash_mismatch'
    | 'issuer_resolution_failed'
    | 'verification_method_not_found'
    | 'signature_invalid'
    | 'expired'
    | 'not_yet_valid'
    | 'audience_mismatch'
    | 'nonce_mismatch'
    | 'vct_mismatch'
    | 'status_check_failed'
    | 'kb_jwt_invalid'
    | 'internal_error';

export class SdJwtVcError extends Error {
    public readonly code: SdJwtVcErrorCode;

    constructor(code: SdJwtVcErrorCode, message: string, options: { cause?: unknown } = {}) {
        super(message, options);
        this.name = 'SdJwtVcError';
        this.code = code;
    }
}

export type SdJwtVcPluginDependentMethods = Pick<DidkitPluginMethods, 'resolveDid'>;

// TODO(LC-1796 Slice 3+): tighten the host LearnCard's plane constraint once we
// start touching the `id` plane for KB-JWT signing. Slice 1's read path doesn't
// need it, so `any` here is intentional but should not be permanent.
export type SdJwtVcDependentLearnCard = LearnCard<any, 'id', SdJwtVcPluginDependentMethods>;

export type SdJwtVcPluginMethods = {
    parseSdJwtVc: (compact: string) => Promise<ParsedSdJwtVc>;

    verifySdJwtVc: (
        compact: string,
        options?: VerifySdJwtVcOptions
    ) => Promise<VerificationCheck>;

    decodeSdJwtClaims: (compact: string) => Promise<Record<string, unknown>>;
};

// TODO(LC-1796 Slice 3+): replace the second `any` with a concrete control-plane
// list once we wire the plugin into apps. Tracking parity with the other format
// plugins (vc, open-badge-v2) which still use `any` for the planes generic.
export type SdJwtVcPlugin = Plugin<
    'SDJwtVc',
    any,
    SdJwtVcPluginMethods,
    'id',
    SdJwtVcPluginDependentMethods
>;
