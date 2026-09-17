import { z } from 'zod';
import { validateScope } from '../token';

// Server constraint: `LCNProfileValidator.profileId` (packages/learn-card-types/src/lcn.ts).
const PROFILE_ID_PATTERN = /^[a-z0-9-]{3,40}$/;
// Server constraint: `LCNSigningAuthorityForUserValidator.relationship.name`.
const SIGNING_AUTHORITY_NAME_PATTERN = /^[a-z0-9-]+$/;

const profileIdSchema = z
    .string()
    .regex(PROFILE_ID_PATTERN, 'must be 3-40 characters: lowercase letters, numbers, and hyphens');

const displayNameSchema = z.string().min(1, 'is required');

const signingAuthorityNameSchema = z
    .string()
    .max(15, 'must be at most 15 characters')
    .regex(SIGNING_AUTHORITY_NAME_PATTERN, 'must be lowercase letters, numbers, and hyphens');

const hostedSigningAuthoritySchema = z.object({
    type: z.literal('learncard-hosted'),
    name: signingAuthorityNameSchema,
});

const selfHostedSigningAuthoritySchema = z.object({
    type: z.literal('self-hosted'),
    name: signingAuthorityNameSchema,
    endpoint: z
        .string()
        .url('must be a valid URL')
        .startsWith('https://', 'must be an https:// URL'),
    did: z.string().regex(/^did:/, 'must be a DID (did:web:..., did:key:...)'),
});

const signingAuthoritySchema = z.discriminatedUnion('type', [
    hostedSigningAuthoritySchema,
    selfHostedSigningAuthoritySchema,
]);

const issuerSchema = z.object({
    profileId: profileIdSchema,
    displayName: displayNameSchema,
    signingAuthority: signingAuthoritySchema,
});

const managedProfileSchema = z.object({
    profileId: profileIdSchema,
    displayName: displayNameSchema,
});

const profileManagerSchema = z.object({
    displayName: displayNameSchema,
    managed: z.array(managedProfileSchema).default([]),
});

const scopesSchema = z
    .array(z.string().min(1, 'must not be empty'))
    .min(1, 'must list at least one scope')
    .superRefine((scopes, ctx) => {
        try {
            validateScope(scopes.join(' '));
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: error instanceof Error ? error.message : 'Invalid scope',
            });
        }
    });

const isoDateSchema = z.string().refine(value => !Number.isNaN(Date.parse(value)), {
    message: 'must be a valid ISO date',
});

const serviceAccountSchema = z.object({
    name: displayNameSchema,
    scopes: scopesSchema,
    expiresAt: isoDateSchema.optional(),
});

const webhookSchema = z.object({
    url: z.string().url('must be a valid URL').startsWith('https://', 'must be an https:// URL'),
});

export const OrgSpecValidator = z.object({
    issuer: issuerSchema,
    profileManager: profileManagerSchema.optional(),
    serviceAccounts: z.array(serviceAccountSchema).optional(),
    webhooks: z.array(webhookSchema).optional(),
});

export type OrgSpec = z.infer<typeof OrgSpecValidator>;
export type OrgSigningAuthoritySpec = z.infer<typeof signingAuthoritySchema>;
export type OrgManagedProfileSpec = z.infer<typeof managedProfileSchema>;
export type OrgServiceAccountSpec = z.infer<typeof serviceAccountSchema>;
