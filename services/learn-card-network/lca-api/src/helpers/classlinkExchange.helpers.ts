import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import { exchangeClassLinkCode, verifyClassLinkIdToken } from '@helpers/classlink.helpers';
import type { ClassLinkClaims, ClassLinkConfig, ClassLinkTenantConfig } from 'types/classlink';

export const classLinkRedirectUri = z.string().min(1).max(2048);
export const classLinkNonce = z.string().min(1).max(512);

export const classLinkExchangeInput = z
    .object({
        code: z.string().min(1).max(4096),
        codeVerifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
        redirectUri: classLinkRedirectUri,
        nonce: classLinkNonce,
    })
    .strict();

export type ClassLinkExchangeInput = z.infer<typeof classLinkExchangeInput>;

export const requireClassLinkConfig = (redirectUri: string): ClassLinkConfig => {
    const config = getClassLinkConfig();
    if (!config)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School sign-in is not configured.',
        });
    // Exact matching also supports explicitly registered native custom schemes.
    if (!config.redirectUris.includes(redirectUri)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This sign-in return address is not allowed.',
        });
    }
    return config;
};

/**
 * Log which api_fields names a district sends (never values) so admins can set the
 * district's stateStudentIdField. Field names are configured by district admins.
 */
const logApiFieldNames = (tenantId: string, apiFields: unknown): void => {
    let fields = apiFields;
    if (typeof fields === 'string') {
        try {
            fields = JSON.parse(fields);
        } catch {
            fields = undefined;
        }
    }
    const names =
        fields && typeof fields === 'object' && !Array.isArray(fields) ? Object.keys(fields) : [];
    console.info('classlink.api_fields', { tenantId, fieldNames: names.slice(0, 50) });
};

export interface VerifiedClassLinkExchange {
    config: ClassLinkConfig;
    claims: ClassLinkClaims;
    tenantId: string;
    tenant: ClassLinkTenantConfig;
    identityKey: string;
}

/** Server-side code exchange plus id_token verification, shared by sign-in and connect. */
export const verifyClassLinkExchange = async (
    input: ClassLinkExchangeInput
): Promise<VerifiedClassLinkExchange> => {
    const config = requireClassLinkConfig(input.redirectUri);
    const tokens = await exchangeClassLinkCode(input);
    const claims = await verifyClassLinkIdToken(tokens.id_token, { nonce: input.nonce });
    const tenantId = claims.classLink_tenant_id;
    const tenant = getClassLinkTenant(config, tenantId);
    logApiFieldNames(tenantId, claims.api_fields);
    return {
        config,
        claims,
        tenantId,
        tenant,
        identityKey: `classlink:${tenantId}:${claims.classLink_sourcedId}`,
    };
};

export const isClassLinkStudent = (claims: ClassLinkClaims): boolean =>
    claims.classLink_role?.toLowerCase() === 'student';
