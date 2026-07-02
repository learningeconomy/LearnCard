import type {} from 'zod-openapi';
import { z } from 'zod/v4';

export const EcosystemRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type EcosystemRole = z.infer<typeof EcosystemRoleEnum>;

export const EcosystemStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type EcosystemStatus = z.infer<typeof EcosystemStatusEnum>;

// DNS label rules: 1–64 chars, lowercase alphanumeric + hyphen, no leading/trailing hyphen
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const EcosystemBrandingValidator = z.object({
    name: z.string().optional().describe('Display name for the Ecosystem operator.'),
    shortName: z.string().optional().describe('Short display name.'),
    logoUrl: z.string().optional().describe('Primary logo URL.'),
    faviconUrl: z.string().optional().describe('Favicon URL.'),
    primaryColor: z.string().optional().describe('Primary brand color.'),
    accentColor: z.string().optional().describe('Accent brand color.'),
    fontColor: z.string().optional().describe('Default text color.'),
    backgroundColor: z.string().optional().describe('Default background color.'),
});
export type EcosystemBranding = z.infer<typeof EcosystemBrandingValidator>;

export const EcosystemCatalogPolicyValidator = z
    .object({
        allowedListings: z
            .array(z.string())
            .optional()
            .describe('AppStoreListing IDs allowed to be installed within this Ecosystem.'),
        requireEndorsement: z
            .boolean()
            .default(false)
            .describe('Whether listings must be endorsed before install.'),
    })
    .describe('Per-Ecosystem catalog governance policy.');
export type EcosystemCatalogPolicy = z.infer<typeof EcosystemCatalogPolicyValidator>;

export const EcosystemLearnCloudPolicyValidator = z
    .object({
        mode: z
            .enum(['SHARED', 'DEDICATED'])
            .describe(
                'Whether this Ecosystem shares central LearnCloud or provisions dedicated instances (D5).'
            ),
        instanceIds: z
            .array(z.string())
            .optional()
            .describe('LearnCloudInstance IDs operated by this Ecosystem when mode = DEDICATED.'),
    })
    .describe('Per-Ecosystem LearnCloud ownership policy (ADR-001 D5).');
export type EcosystemLearnCloudPolicy = z.infer<typeof EcosystemLearnCloudPolicyValidator>;

export const EcosystemSettingsValidator = z
    .object({
        branding: EcosystemBrandingValidator.optional().describe(
            'Ecosystem-level branding overrides.'
        ),
        catalogPolicy: EcosystemCatalogPolicyValidator.optional(),
        learnCloudPolicy: EcosystemLearnCloudPolicyValidator.optional(),
    })
    .describe(
        'Typed Ecosystem settings. New config goes in a typed sub-schema, never a junk drawer.'
    );
export type EcosystemSettings = z.infer<typeof EcosystemSettingsValidator>;

export const EcosystemValidator = z.object({
    id: z.string().describe('Unique Ecosystem identifier. Format: eco_<uuid>.'),
    name: z.string().describe('Human-readable Ecosystem name.'),
    slug: z
        .string()
        .regex(SLUG_REGEX)
        .describe(
            'URL-safe slug, unique among siblings under the same parent (ADR-001-followups Q1).'
        ),
    description: z.string().optional().describe('Optional Ecosystem description.'),

    parentEcosystemId: z
        .string()
        .nullable()
        .describe('Parent Ecosystem ID, or null for a tenant root Ecosystem.'),
    pathIds: z
        .array(z.string())
        .describe('Cached root-to-self ID array [root, ..., self] for O(1) ancestor checks.'),
    slugPath: z
        .array(z.string())
        .describe('Cached root-to-self slug array, e.g. ["lef", "edu", "k12", "ca"].'),
    depth: z
        .number()
        .int()
        .nonnegative()
        .describe('Cached tree depth for UI and limit enforcement.'),
    rootEcosystemId: z
        .string()
        .describe('Cached root Ecosystem ID for fast tenant boundary checks.'),

    ownerProfileId: z.string().describe('Profile ID of the Ecosystem owner.'),

    settings: EcosystemSettingsValidator.default({}),

    status: EcosystemStatusEnum.describe('Ecosystem lifecycle status.'),
    createdAt: z.string().describe('ISO 8601 creation timestamp.'),
    updatedAt: z.string().describe('ISO 8601 last-update timestamp.'),
});
export type Ecosystem = z.infer<typeof EcosystemValidator>;

export const EcosystemQueryValidator = z
    .object({
        id: z.string(),
        slug: z.string(),
        parentEcosystemId: z.string().nullable(),
        rootEcosystemId: z.string(),
        ownerProfileId: z.string(),
        status: EcosystemStatusEnum,
    })
    .partial();
export type EcosystemQuery = z.infer<typeof EcosystemQueryValidator>;
