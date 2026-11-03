import { z } from 'zod';
import type { JWTPayload } from 'jose';

export const ClassLinkTenantConfigValidator = z.object({
    displayName: z.string().min(1),
    state: z.string().regex(/^[A-Z]{2}$/),
    stateStudentIdField: z.string().min(1),
    allowedEmailDomains: z.array(z.string().min(1)),
    transcriptEnabled: z.boolean(),
});

export const ClassLinkTenantsValidator = z.record(z.string(), ClassLinkTenantConfigValidator);

export type ClassLinkTenantConfig = z.infer<typeof ClassLinkTenantConfigValidator>;

/**
 * Settings for any ClassLink district without an override in CLASSLINK_TENANTS.
 * Sign-in works; joining an existing email account and transcript requests stay off.
 */
export const DEFAULT_CLASSLINK_TENANT: ClassLinkTenantConfig = Object.freeze({
    displayName: '',
    state: '',
    stateStudentIdField: '',
    allowedEmailDomains: [],
    transcriptEnabled: false,
});
export type ClassLinkConfig = {
    clientId: string;
    clientSecret: string;
    discoveryUrl: string;
    redirectUris: string[];
    tenants: z.infer<typeof ClassLinkTenantsValidator>;
    maxAuthAgeSeconds: number;
};

export interface ClassLinkClaims extends JWTPayload {
    sub: string;
    iss: string;
    aud: string | string[];
    exp: number;
    iat: number;
    nonce: string;
    classLink_tenant_id: string;
    classLink_sourcedId: string;
    classLink_role?: string;
    auth_time?: number;
    email?: string;
    or_email?: string;
    email_verified?: boolean;
    api_fields?: unknown;
}
