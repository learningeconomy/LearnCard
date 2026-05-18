import { decodeSdJwt, getClaims } from '@sd-jwt/decode';

import { sha256Hasher } from './hasher';
import {
    SdJwtVcError,
    SD_JWT_VC_FORMAT,
    SD_JWT_VC_FORMAT_LEGACY,
    type ParsedSdJwtVc,
    type SdJwtHeader,
    type SdJwtPayload,
    type SdJwtVcFormat,
} from './types';

const epochToDate = (seconds: unknown): Date | undefined => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return undefined;
    return new Date(seconds * 1000);
};

const deriveFormatFromTyp = (typ: unknown): SdJwtVcFormat => {
    if (typ === SD_JWT_VC_FORMAT_LEGACY) return SD_JWT_VC_FORMAT_LEGACY;
    return SD_JWT_VC_FORMAT;
};

export const parseSdJwtVc = async (compact: string): Promise<ParsedSdJwtVc> => {
    if (typeof compact !== 'string' || compact.length === 0) {
        throw new SdJwtVcError(
            'invalid_compact_form',
            'SD-JWT compact form must be a non-empty string'
        );
    }

    let decoded;
    try {
        decoded = await decodeSdJwt(compact, sha256Hasher);
    } catch (e) {
        throw new SdJwtVcError(
            'invalid_compact_form',
            `Failed to decode SD-JWT compact form: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    const header = (decoded.jwt?.header ?? {}) as SdJwtHeader;
    const payload = (decoded.jwt?.payload ?? {}) as SdJwtPayload;

    if (typeof header.alg !== 'string' || header.alg.length === 0) {
        throw new SdJwtVcError('missing_alg', 'SD-JWT header missing `alg`');
    }
    if (
        header.typ !== undefined &&
        header.typ !== SD_JWT_VC_FORMAT &&
        header.typ !== SD_JWT_VC_FORMAT_LEGACY
    ) {
        throw new SdJwtVcError(
            'invalid_typ',
            `SD-JWT-VC JOSE header has typ="${header.typ}"; expected "${SD_JWT_VC_FORMAT}" or legacy "${SD_JWT_VC_FORMAT_LEGACY}" per draft-ietf-oauth-sd-jwt-vc-16 §3.2.1.1`
        );
    }
    if (typeof payload.iss !== 'string' || payload.iss.length === 0) {
        throw new SdJwtVcError('missing_iss', 'SD-JWT payload missing `iss`');
    }
    if (typeof payload.vct !== 'string' || payload.vct.length === 0) {
        throw new SdJwtVcError('missing_vct', 'SD-JWT payload missing `vct`');
    }

    let claims: Record<string, unknown>;
    try {
        claims = (await getClaims(
            payload as Record<string, unknown>,
            decoded.disclosures,
            sha256Hasher
        )) as Record<string, unknown>;
    } catch (e) {
        throw new SdJwtVcError(
            'disclosure_hash_mismatch',
            `Failed to reconstruct claims from disclosures: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    const disclosureKeys: string[] = [];
    for (const d of decoded.disclosures ?? []) {
        const key = (d as { key?: string }).key;
        if (typeof key === 'string') disclosureKeys.push(key);
    }

    const cnf = payload.cnf;
    const holderPublicKey =
        cnf && typeof cnf === 'object' && 'jwk' in cnf && cnf.jwk && typeof cnf.jwk === 'object'
            ? (cnf.jwk as Record<string, unknown>)
            : undefined;

    return {
        vct: payload.vct,
        issuer: payload.iss,
        issuedAt: epochToDate(payload.iat),
        expiresAt: epochToDate(payload.exp),
        notBefore: epochToDate(payload.nbf),
        holderPublicKey,
        claims,
        disclosureKeys,
        header,
        rawPayload: payload,
        rawSdJwt: compact,
        format: deriveFormatFromTyp(header.typ),
        hasKeyBinding: Boolean(decoded.kbJwt),
    };
};
