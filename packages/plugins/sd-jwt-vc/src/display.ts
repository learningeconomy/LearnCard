import { categorizeSdJwt } from './categorize';
import type { ParsedSdJwtVc } from './types';

export interface SdJwtDisplayViewModel {
    category: string;
    vct: string;
    issuerName: string;
    issuedAt?: string;
    expiresAt?: string;
    notBefore?: string;
    claims: Record<string, unknown>;
    disclosureKeys: string[];
    rawSdJwt: string;
    hasKeyBinding: boolean;
}

// Keep in sync with @learncard/openid4vc-plugin's sd-jwt-vc.ts SD_JWT_RESERVED_CLAIMS.
// Duplication is deliberate: openid4vc does NOT hard-import sd-jwt-vc (runtime
// feature-detect only) so the two packages can be installed independently.
const SD_JWT_METADATA_CLAIMS = new Set([
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

const stripMetadata = (claims: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(claims)) {
        if (!SD_JWT_METADATA_CLAIMS.has(key)) result[key] = value;
    }
    return result;
};

export const toSdJwtDisplayViewModel = (parsed: ParsedSdJwtVc): SdJwtDisplayViewModel => ({
    category: categorizeSdJwt(parsed.vct),
    vct: parsed.vct,
    issuerName: parsed.issuer,
    issuedAt: parsed.issuedAt?.toISOString(),
    expiresAt: parsed.expiresAt?.toISOString(),
    notBefore: parsed.notBefore?.toISOString(),
    claims: stripMetadata(parsed.claims),
    disclosureKeys: [...parsed.disclosureKeys],
    rawSdJwt: parsed.rawSdJwt,
    hasKeyBinding: parsed.hasKeyBinding,
});
