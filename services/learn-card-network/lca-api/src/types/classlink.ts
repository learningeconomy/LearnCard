import { z } from 'zod';
import type { JWTPayload } from 'jose';

/** Lowercase alphanumeric plus hyphens, 1-64 chars, starting with a letter or digit. */
export const TRANSCRIPT_ISSUER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const TranscriptIssuerValidator = z
    .object({
        endpoint: z.string().url(),
        audience: z.string().trim().min(1),
        did: z
            .string()
            .trim()
            .regex(/^did:[a-z0-9]+:.+/),
    })
    .strict();

export const TranscriptIssuersValidator = z.record(
    z.string().regex(TRANSCRIPT_ISSUER_KEY_PATTERN),
    TranscriptIssuerValidator
);

export type TranscriptIssuer = z.infer<typeof TranscriptIssuerValidator>;
export type TranscriptIssuers = z.infer<typeof TranscriptIssuersValidator>;

/**
 * A transcript issuer resolved from TRANSCRIPT_ISSUERS (or the legacy TRANSCRIPT_ISSUER_* env
 * vars, which resolve to `key: 'default'`). `did` is only optional for that legacy path; every
 * TRANSCRIPT_ISSUERS entry requires one (see TranscriptIssuerValidator).
 */
export type ResolvedTranscriptIssuer = {
    key: string;
    endpoint: string;
    audience: string;
    did?: string;
};

export const ClassLinkTenantConfigValidator = z.object({
    displayName: z.string().min(1),
    state: z.string().regex(/^[A-Z]{2}$/),
    stateStudentIdField: z.string().min(1),
    allowedEmailDomains: z.array(z.string().min(1)),
    transcriptEnabled: z.boolean(),
    /** Selects a TRANSCRIPT_ISSUERS key for this district; falls back to `default` when unset. */
    transcriptIssuer: z.string().regex(TRANSCRIPT_ISSUER_KEY_PATTERN).optional(),
    /**
     * Test stages only: when the district sends no state ID, use a stable fake `TEST…` ID
     * per student so the transcript flow can be tested end to end. Ignored in production.
     */
    testStateStudentIds: z.boolean().optional(),
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
