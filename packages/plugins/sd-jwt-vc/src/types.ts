import type { Plugin, LearnCard } from '@learncard/core';
import type { VC, VerificationCheck } from '@learncard/types';
import type { DidkitPluginMethods, ProofOptions } from '@learncard/didkit-plugin';
import type { VerifyExtension } from '@learncard/vc-plugin';

import type { SdJwtDisplayViewModel } from './display';
import type { PresentSdJwtVcOptions, SdJwtPresentation } from './present';

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
    | 'invalid_typ'
    | 'missing_iss'
    | 'missing_vct'
    | 'missing_alg'
    | 'unsupported_alg'
    | 'invalid_disclosure'
    | 'disclosure_hash_mismatch'
    | 'issuer_resolution_failed'
    | 'verification_method_not_found'
    | 'verification_method_not_authorized'
    | 'signature_invalid'
    | 'expired'
    | 'not_yet_valid'
    | 'audience_mismatch'
    | 'nonce_mismatch'
    | 'vct_mismatch'
    | 'status_check_failed'
    | 'kb_jwt_invalid'
    | 'presentation_verification_failed'
    | 'key_binding_mismatch'
    | 'unsupported_cnf_confirmation_type'
    | 'internal_error';

export class SdJwtVcError extends Error {
    public readonly code: SdJwtVcErrorCode;

    constructor(code: SdJwtVcErrorCode, message: string, options: { cause?: unknown } = {}) {
        super(message, options);
        this.name = 'SdJwtVcError';
        this.code = code;
    }
}

export type SdJwtVcPluginDependentMethods = Pick<DidkitPluginMethods, 'resolveDid'> &
    VerifyExtension;

// Host LearnCard must expose the `id` plane (used for KB-JWT signing in
// `presentSdJwtVc`). The first generic is `any` — the planes-provided shape
// of the host is intentionally wide so this plugin composes with any LearnCard
// stack that includes `id`.
export type SdJwtVcDependentLearnCard = LearnCard<any, 'id', SdJwtVcPluginDependentMethods>;

export type SdJwtVcPluginMethods = VerifyExtension & {
    parseSdJwtVc: (compact: string) => Promise<ParsedSdJwtVc>;

    verifySdJwtVc: (
        compact: string,
        options?: VerifySdJwtVcOptions
    ) => Promise<VerificationCheck>;

    decodeSdJwtClaims: (compact: string) => Promise<Record<string, unknown>>;

    categorizeSdJwtVct: (vct: string) => string;

    toSdJwtDisplayViewModel: (parsed: ParsedSdJwtVc) => SdJwtDisplayViewModel;

    presentSdJwtVc: (
        compact: string,
        options?: PresentSdJwtVcOptions
    ) => Promise<SdJwtPresentation>;
};

// Planes generic is `any` to match the convention used by the other format
// plugins (vc, open-badge-v2, expiration). Format plugins don't introduce new
// planes — they extend `verifyCredential` and add format-specific invoke methods.
export type SdJwtVcPlugin = Plugin<
    'SDJwtVc',
    any,
    SdJwtVcPluginMethods,
    'id',
    SdJwtVcPluginDependentMethods
>;
