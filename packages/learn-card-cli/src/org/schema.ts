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

const hostedSigningAuthoritySchema = z
    .object({
        type: z.literal('learncard-hosted'),
        name: signingAuthorityNameSchema,
    })
    .strict();

const selfHostedSigningAuthoritySchema = z
    .object({
        type: z.literal('self-hosted'),
        name: signingAuthorityNameSchema,
        endpoint: z
            .string()
            .url('must be a valid URL')
            .startsWith('https://', 'must be an https:// URL'),
        did: z.string().regex(/^did:/, 'must be a DID (did:web:..., did:key:...)'),
    })
    .strict();

const signingAuthoritySchema = z.discriminatedUnion('type', [
    hostedSigningAuthoritySchema,
    selfHostedSigningAuthoritySchema,
]);

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color like #18224E');

const imageUrlSchema = z.string().superRefine((value, ctx) => {
    if (/^https:\/\//.test(value)) return;
    ctx.addIssue({
        code: 'custom',
        message: /^(\.{1,2}\/|\/|[a-zA-Z]:\\)/.test(value)
            ? 'local files are not uploaded yet — host the image and use its https:// URL'
            : 'must be an https:// URL',
    });
});

const displaySchema = z
    .object({
        backgroundColor: hexColorSchema.optional(),
        backgroundImage: imageUrlSchema.optional(),
        fadeBackgroundImage: z.boolean().optional(),
        repeatBackgroundImage: z.boolean().optional(),
        fontColor: hexColorSchema.optional(),
        accentColor: hexColorSchema.optional(),
        accentFontColor: hexColorSchema.optional(),
        idBackgroundImage: imageUrlSchema.optional(),
        fadeIdBackgroundImage: z.boolean().optional(),
        idBackgroundColor: hexColorSchema.optional(),
        repeatIdBackgroundImage: z.boolean().optional(),
    })
    .strict();

export const brandingSchema = z
    .object({
        image: imageUrlSchema.optional(),
        heroImage: imageUrlSchema.optional(),
        shortBio: z.string().max(280, 'must be at most 280 characters').optional(),
        bio: z.string().optional(),
        websiteLink: z.string().url('must be a valid URL').optional(),
        type: z.enum(['organization', 'service', 'person']).optional(),
        display: displaySchema.optional(),
    })
    .strict();

export type OrgBranding = z.infer<typeof brandingSchema>;

const issuerSchema = z
    .object({
        profileId: profileIdSchema,
        displayName: displayNameSchema,
        branding: brandingSchema.optional(),
        signingAuthority: signingAuthoritySchema,
    })
    .strict();

const managedProfileSchema = z
    .object({
        profileId: profileIdSchema,
        displayName: displayNameSchema,
        branding: brandingSchema.optional(),
    })
    .strict();

const profileManagerSchema = z
    .object({
        displayName: displayNameSchema,
        managed: z.array(managedProfileSchema).default([]),
    })
    .strict();

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

/** Normalize a service-account name to its shell-safe secrets-file key. */
export const toEnvKey = (name: string): string => name.replace(/-/g, '_').toUpperCase();

// Becomes the key in `--secrets-out`, so keep it shell-safe.
const SERVICE_ACCOUNT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

const serviceAccountNameSchema = z
    .string()
    .regex(
        SERVICE_ACCOUNT_NAME_PATTERN,
        'must start with a letter or underscore and contain only letters, numbers, hyphens, and underscores'
    );

// '*' = any profile under profileManager.managed; a list is refined below against it.
const actAsSchema = z.union([
    z.literal('*'),
    z.array(profileIdSchema).min(1, 'must list at least one profileId'),
]);

const serviceAccountSchema = z
    .object({
        name: serviceAccountNameSchema,
        scopes: scopesSchema,
        expiresAt: isoDateSchema.optional(),
        actAs: actAsSchema.optional(),
    })
    .strict();

const webhookSchema = z
    .object({
        url: z
            .string()
            .url('must be a valid URL')
            .startsWith('https://', 'must be an https:// URL'),
    })
    .strict();

export const OrgSpecValidator = z
    .object({
        issuer: issuerSchema,
        profileManager: profileManagerSchema.optional(),
        serviceAccounts: z
            .array(serviceAccountSchema)
            .superRefine((accounts, ctx) => {
                const keys = new Set<string>();
                accounts.forEach((account, index) => {
                    const key = toEnvKey(account.name);
                    if (keys.has(key))
                        ctx.addIssue({
                            code: 'custom',
                            path: [index, 'name'],
                            message: `Duplicate service-account secrets key "${key}" after normalizing names`,
                        });
                    keys.add(key);
                });
            })
            .optional(),
        webhooks: z.array(webhookSchema).optional(),
    })
    .strict()
    .superRefine((spec, ctx) => {
        const managedIds = new Set(spec.profileManager?.managed.map(entry => entry.profileId));
        spec.serviceAccounts?.forEach((account, index) => {
            if (!account.actAs) return;
            const path = ['serviceAccounts', index, 'actAs'];
            if (account.actAs === '*') {
                if (!spec.profileManager)
                    ctx.addIssue({
                        code: 'custom',
                        path,
                        message: '"*" requires a profileManager in this spec',
                    });
                return;
            }
            for (const profileId of account.actAs) {
                if (!managedIds.has(profileId))
                    ctx.addIssue({
                        code: 'custom',
                        path,
                        message: `"${profileId}" is not a managed profile in this spec`,
                    });
            }
        });
    });

export type OrgSpec = z.infer<typeof OrgSpecValidator>;
export type OrgSigningAuthoritySpec = z.infer<typeof signingAuthoritySchema>;
export type OrgManagedProfileSpec = z.infer<typeof managedProfileSchema>;
export type OrgServiceAccountSpec = z.infer<typeof serviceAccountSchema>;
