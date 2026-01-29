import type { } from 'zod-openapi';
import { z } from 'zod';

import { PaginationResponseValidator } from './mongo';
import { StringQuery } from './queries';
import { UnsignedVCValidator, VCValidator, VPValidator } from './vc';

export const LCNProfileDisplayValidator = z.object({
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    fadeBackgroundImage: z.boolean().optional(),
    repeatBackgroundImage: z.boolean().optional(),
    fontColor: z.string().optional(),
    accentColor: z.string().optional(),
    accentFontColor: z.string().optional(),
    idBackgroundImage: z.string().optional(),
    fadeIdBackgroundImage: z.boolean().optional(),
    idBackgroundColor: z.string().optional(),
    repeatIdBackgroundImage: z.boolean().optional(),
});
export type LCNProfileDisplay = z.infer<typeof LCNProfileDisplayValidator>;

export const LCNProfileValidator = z.object({
    profileId: z.string().min(3).max(40).describe('Unique, URL-safe identifier for the profile.'),
    displayName: z.string().default('').describe('Human-readable display name for the profile.'),
    shortBio: z.string().default('').describe('Short bio for the profile.'),
    bio: z.string().default('').describe('Longer bio for the profile.'),
    did: z.string().describe('Decentralized Identifier for the profile. (auto-assigned)'),
    isPrivate: z
        .boolean()
        .optional()
        .describe('Whether the profile is private or not and shows up in search results.'),
    email: z.string().optional().describe('Contact email address for the profile. (deprecated)'),
    image: z.string().optional().describe('Profile image URL for the profile.'),
    heroImage: z.string().optional().describe('Hero image URL for the profile.'),
    websiteLink: z.string().optional().describe('Website link for the profile.'),
    isServiceProfile: z
        .boolean()
        .default(false)
        .optional()
        .describe('Whether the profile is a service profile or not.'),
    type: z.string().optional().describe('Profile type: e.g. "person", "organization", "service".'),
    notificationsWebhook: z
        .string()
        .url()
        .startsWith('http')
        .optional()
        .describe('URL to send notifications to.'),
    display: LCNProfileDisplayValidator.optional().describe('Display settings for the profile.'),
    highlightedCredentials: z
        .array(z.string())
        .max(5)
        .optional()
        .describe('Up to 5 unique boost URIs to highlight on the profile.'),
    role: z
        .string()
        .default('')
        .optional()
        .describe('Role of the profile: e.g. "teacher", "student".'),
    dob: z
        .string()
        .default('')
        .optional()
        .describe('Date of birth of the profile: e.g. "1990-01-01".'),
    country: z.string().optional().describe('Country for the profile.'),
    approved: z.boolean().optional().describe('Approval status for the profile.'),
});
export type LCNProfile = z.infer<typeof LCNProfileValidator>;

export const LCNProfileQueryValidator = z
    .object({
        profileId: StringQuery,
        displayName: StringQuery,
        shortBio: StringQuery,
        bio: StringQuery,
        email: StringQuery,
        websiteLink: StringQuery,
        isServiceProfile: z.boolean(),
        type: StringQuery,
    })
    .partial();
export type LCNProfileQuery = z.infer<typeof LCNProfileQueryValidator>;

export const PaginatedLCNProfilesValidator = PaginationResponseValidator.extend({
    records: LCNProfileValidator.array(),
});
export type PaginatedLCNProfiles = z.infer<typeof PaginatedLCNProfilesValidator>;

export const LCNProfileConnectionStatusEnum = z.enum([
    'CONNECTED',
    'PENDING_REQUEST_SENT',
    'PENDING_REQUEST_RECEIVED',
    'NOT_CONNECTED',
]);
export type LCNProfileConnectionStatusEnum = z.infer<typeof LCNProfileConnectionStatusEnum>;

export const LCNProfileManagerValidator = z.object({
    id: z.string(),
    created: z.string(),
    displayName: z.string().default('').optional(),
    shortBio: z.string().default('').optional(),
    bio: z.string().default('').optional(),
    email: z.string().optional(),
    image: z.string().optional(),
    heroImage: z.string().optional(),
});
export type LCNProfileManager = z.infer<typeof LCNProfileManagerValidator>;

export const PaginatedLCNProfileManagersValidator = PaginationResponseValidator.extend({
    records: LCNProfileManagerValidator.extend({ did: z.string() }).array(),
});
export type PaginatedLCNProfileManagers = z.infer<typeof PaginatedLCNProfileManagersValidator>;

export const LCNProfileManagerQueryValidator = z
    .object({
        id: StringQuery,
        displayName: StringQuery,
        shortBio: StringQuery,
        bio: StringQuery,
        email: StringQuery,
    })
    .partial();
export type LCNProfileManagerQuery = z.infer<typeof LCNProfileManagerQueryValidator>;

export const PaginatedLCNProfilesAndManagersValidator = PaginationResponseValidator.extend({
    records: z
        .object({
            profile: LCNProfileValidator,
            manager: LCNProfileManagerValidator.extend({ did: z.string() }).optional(),
        })
        .array(),
});
export type PaginatedLCNProfilesAndManagers = z.infer<
    typeof PaginatedLCNProfilesAndManagersValidator
>;

export const SentCredentialInfoValidator = z.object({
    uri: z.string(),
    to: z.string(),
    from: z.string(),
    sent: z.iso.datetime(),
    received: z.iso.datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export type SentCredentialInfo = z.infer<typeof SentCredentialInfoValidator>;

export const BoostPermissionsValidator = z.object({
    role: z.string(),
    canEdit: z.boolean(),
    canIssue: z.boolean(),
    canRevoke: z.boolean(),
    canManagePermissions: z.boolean(),
    canIssueChildren: z.string(),
    canCreateChildren: z.string(),
    canEditChildren: z.string(),
    canRevokeChildren: z.string(),
    canManageChildrenPermissions: z.string(),
    canManageChildrenProfiles: z.boolean().optional(),
    canViewAnalytics: z.boolean(),
});
export type BoostPermissions = z.infer<typeof BoostPermissionsValidator>;

export const BoostPermissionsQueryValidator = z
    .object({
        role: StringQuery,
        canEdit: z.boolean(),
        canIssue: z.boolean(),
        canRevoke: z.boolean(),
        canManagePermissions: z.boolean(),
        canIssueChildren: StringQuery,
        canCreateChildren: StringQuery,
        canEditChildren: StringQuery,
        canRevokeChildren: StringQuery,
        canManageChildrenPermissions: StringQuery,
        canManageChildrenProfiles: z.boolean(),
        canViewAnalytics: z.boolean(),
    })
    .partial();
export type BoostPermissionsQuery = z.infer<typeof BoostPermissionsQueryValidator>;

export const ClaimHookTypeValidator = z.enum(['GRANT_PERMISSIONS', 'ADD_ADMIN', 'AUTO_CONNECT']);
export type ClaimHookType = z.infer<typeof ClaimHookTypeValidator>;

export const ClaimHookValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(ClaimHookTypeValidator.enum.GRANT_PERMISSIONS),
        data: z.object({
            claimUri: z.string(),
            targetUri: z.string(),
            permissions: BoostPermissionsValidator.partial(),
        }),
    }),
    z.object({
        type: z.literal(ClaimHookTypeValidator.enum.ADD_ADMIN),
        data: z.object({ claimUri: z.string(), targetUri: z.string() }),
    }),
    z.object({
        type: z.literal(ClaimHookTypeValidator.enum.AUTO_CONNECT),
        data: z.object({ claimUri: z.string(), targetUri: z.string() }),
    }),
]);
export type ClaimHook = z.infer<typeof ClaimHookValidator>;

export const ClaimHookQueryValidator = z.object({
    type: StringQuery,
    data: z
        .object({
            claimUri: StringQuery,
            targetUri: StringQuery,
            permissions: BoostPermissionsQueryValidator.partial(),
        })
        .partial(),
});
export type ClaimHookQuery = z.infer<typeof ClaimHookQueryValidator>;

export const FullClaimHookValidator = z
    .object({ id: z.string(), createdAt: z.string(), updatedAt: z.string() })
    .and(ClaimHookValidator);
export type FullClaimHook = z.infer<typeof FullClaimHookValidator>;

export const PaginatedClaimHooksValidator = PaginationResponseValidator.extend({
    records: FullClaimHookValidator.array(),
});
export type PaginatedClaimHooksType = z.infer<typeof PaginatedClaimHooksValidator>;

/**
 * Status states for Boosts that control what actions can be performed.
 *
 * - **DRAFT**: Work in progress. Can edit all fields, but cannot send or generate claim links.
 * - **PROVISIONAL**: Active but iterating. Can both edit all fields AND send/issue credentials. Ideal for testing in production or soft launches.
 * - **LIVE**: Official/finalized. Can only edit meta and defaultPermissions. Core properties are locked for consistency.
 *
 * @example
 * ```typescript
 * // Create a provisional boost for testing
 * const boostUri = await learnCard.invoke.createBoost(credential, {
 *   status: 'PROVISIONAL',
 * });
 * ```
 */
export const LCNBoostStatus = z.enum(['DRAFT', 'PROVISIONAL', 'LIVE']);
export type LCNBoostStatusEnum = z.infer<typeof LCNBoostStatus>;

export const BoostValidator = z.object({
    uri: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    status: LCNBoostStatus.optional(),
    autoConnectRecipients: z.boolean().optional(),
    meta: z.record(z.string(), z.any()).optional(),
    claimPermissions: BoostPermissionsValidator.optional(),
    defaultPermissions: BoostPermissionsValidator.optional(),
    allowAnyoneToCreateChildren: z.boolean().optional(),
});
export type Boost = z.infer<typeof BoostValidator>;

const BaseBoostQueryValidator = z
    .object({
        uri: StringQuery,
        name: StringQuery,
        type: StringQuery,
        category: StringQuery,
        meta: z.record(z.string(), StringQuery),
        status: LCNBoostStatus.or(z.object({ $in: LCNBoostStatus.array() })),
        autoConnectRecipients: z.boolean(),
    })
    .partial();

export const BoostQueryValidator = z.union([
    z.object({
        $or: BaseBoostQueryValidator.array(),
    }),
    BaseBoostQueryValidator,
]);
export type BoostQuery = z.infer<typeof BoostQueryValidator>;

export const PaginatedBoostsValidator = PaginationResponseValidator.extend({
    records: BoostValidator.array(),
});
export type PaginatedBoostsType = z.infer<typeof PaginatedBoostsValidator>;

export const BoostRecipientValidator = z.object({
    to: LCNProfileValidator,
    from: z.string(),
    received: z.string().optional(),
    uri: z.string().optional(),
});
export type BoostRecipientInfo = z.infer<typeof BoostRecipientValidator>;

export const PaginatedBoostRecipientsValidator = PaginationResponseValidator.extend({
    records: BoostRecipientValidator.array(),
});
export type PaginatedBoostRecipientsType = z.infer<typeof PaginatedBoostRecipientsValidator>;

export const BoostRecipientWithChildrenValidator = z.object({
    to: LCNProfileValidator,
    from: z.string(),
    received: z.string().optional(),
    boostUris: z.array(z.string()),
    credentialUris: z.array(z.string()).optional(),
});
export type BoostRecipientWithChildrenInfo = z.infer<typeof BoostRecipientWithChildrenValidator>;

export const PaginatedBoostRecipientsWithChildrenValidator = PaginationResponseValidator.extend({
    records: BoostRecipientWithChildrenValidator.array(),
});
export type PaginatedBoostRecipientsWithChildrenType = z.infer<
    typeof PaginatedBoostRecipientsWithChildrenValidator
>;

export const LCNBoostClaimLinkSigningAuthorityValidator = z.object({
    endpoint: z.string(),
    name: z.string(),
    did: z.string().optional(),
});
export type LCNBoostClaimLinkSigningAuthorityType = z.infer<
    typeof LCNBoostClaimLinkSigningAuthorityValidator
>;

export const LCNBoostClaimLinkOptionsValidator = z.object({
    ttlSeconds: z.number().optional(),
    totalUses: z.number().optional(),
});
export type LCNBoostClaimLinkOptionsType = z.infer<typeof LCNBoostClaimLinkOptionsValidator>;

export const LCNSigningAuthorityValidator = z.object({
    endpoint: z.string(),
});
export type LCNSigningAuthorityType = z.infer<typeof LCNSigningAuthorityValidator>;

export const LCNSigningAuthorityForUserValidator = z.object({
    signingAuthority: LCNSigningAuthorityValidator,
    relationship: z.object({
        name: z
            .string()
            .max(15)
            .regex(/^[a-z0-9-]+$/, {
                message:
                    'The input string must contain only lowercase letters, numbers, and hyphens.',
            }),
        did: z.string(),
        isPrimary: z.boolean().optional(),
    }),
});
export type LCNSigningAuthorityForUserType = z.infer<typeof LCNSigningAuthorityForUserValidator>;

export const AutoBoostConfigValidator = z.object({
    boostUri: z.string(),
    signingAuthority: z.object({
        endpoint: z.string(),
        name: z.string(),
    }),
});
export type AutoBoostConfig = z.infer<typeof AutoBoostConfigValidator>;

const SendBoostTemplateValidator = BoostValidator.partial()
    .omit({ uri: true, claimPermissions: true })
    .extend({
        credential: VCValidator.or(UnsignedVCValidator),
        claimPermissions: BoostPermissionsValidator.partial().optional(),
        skills: z
            .array(z.object({ frameworkId: z.string(), id: z.string() }))
            .min(1)
            .optional(),
    });

// Branding options for email/SMS delivery (used when recipient is email/phone)
export const SendBrandingOptionsValidator = z.object({
    issuerName: z.string().optional().describe('Name of the issuing organization'),
    issuerLogoUrl: z.string().url().optional().describe('Logo URL of the issuing organization'),
    credentialName: z.string().optional().describe('Display name for the credential'),
    recipientName: z.string().optional().describe('Name of the recipient for personalization'),
});
export type SendBrandingOptions = z.infer<typeof SendBrandingOptionsValidator>;

// Options for send method (applies when recipient is email/phone, routes to Universal Inbox)
export const SendOptionsValidator = z.object({
    webhookUrl: z.string().url().optional().describe('Webhook URL to receive claim notifications'),
    suppressDelivery: z
        .boolean()
        .optional()
        .describe('If true, returns claimUrl without sending email/SMS'),
    branding: SendBrandingOptionsValidator.optional().describe('Branding for email/SMS delivery'),
});
export type SendOptions = z.infer<typeof SendOptionsValidator>;

// Route-level validator (TRPC requires ZodObject, not discriminatedUnion)
export const SendBoostInputValidator = z
    .object({
        type: z.literal('boost'),
        recipient: z.string().describe('Profile ID, DID, email, or phone number (auto-detected)'),
        contractUri: z.string().optional(),
        templateUri: z.string().optional(),
        template: SendBoostTemplateValidator.optional(),
        signedCredential: VCValidator.optional(),
        options: SendOptionsValidator.optional().describe(
            'Options for email/phone recipients (Universal Inbox)'
        ),
        templateData: z.record(z.string(), z.unknown()).optional(),
        integrationId: z.string().optional().describe('Integration ID for activity tracking'),
    })
    .refine(data => data.templateUri || data.template, {
        message: 'Either templateUri or template creation data must be provided.',
        path: ['templateUri'],
    });
export type SendBoostInput = z.infer<typeof SendBoostInputValidator>;

// Inbox-specific response fields (only present when sent via email/phone)
export const SendInboxResponseValidator = z.object({
    issuanceId: z.string(),
    status: z.enum(['PENDING', 'ISSUED', 'EXPIRED', 'DELIVERED', 'CLAIMED']),
    claimUrl: z.string().url().optional().describe('Present when suppressDelivery=true'),
});
export type SendInboxResponse = z.infer<typeof SendInboxResponseValidator>;

export const SendBoostResponseValidator = z.object({
    type: z.literal('boost'),
    credentialUri: z.string(),
    uri: z.string(),
    activityId: z.string().describe('Links to the activity lifecycle for this issuance'),
    inbox: SendInboxResponseValidator.optional().describe(
        'Present when sent via email/phone (Universal Inbox)'
    ),
});
export type SendBoostResponse = z.infer<typeof SendBoostResponseValidator>;

// Plugin-level discriminated union (for extensibility)
export const SendInputValidator = z.discriminatedUnion('type', [SendBoostInputValidator]);
export type SendInput = z.infer<typeof SendInputValidator>;

export const SendResponseValidator = z.discriminatedUnion('type', [SendBoostResponseValidator]);
export type SendResponse = z.infer<typeof SendResponseValidator>;

export const ConsentFlowTermsStatusValidator = z.enum(['live', 'stale', 'withdrawn']);
export type ConsentFlowTermsStatus = z.infer<typeof ConsentFlowTermsStatusValidator>;

export const ConsentFlowContractValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    categories: z
                        .record(
                            z.string(),
                            z.object({
                                required: z.boolean(),
                                defaultEnabled: z.boolean().optional(),
                            })
                        )
                        .default({}),
                })
                .prefault({ categories: {} }),
            personal: z
                .record(
                    z.string(),
                    z.object({ required: z.boolean(), defaultEnabled: z.boolean().optional() })
                )
                .default({}),
        })
        .prefault({ credentials: { categories: {} }, personal: {} }),
    write: z
        .object({
            credentials: z
                .object({
                    categories: z
                        .record(
                            z.string(),
                            z.object({
                                required: z.boolean(),
                                defaultEnabled: z.boolean().optional(),
                            })
                        )
                        .default({}),
                })
                .prefault({ categories: {} }),
            personal: z
                .record(
                    z.string(),
                    z.object({ required: z.boolean(), defaultEnabled: z.boolean().optional() })
                )
                .default({}),
        })
        .prefault({ credentials: { categories: {} }, personal: {} }),
});
export type ConsentFlowContract = z.infer<typeof ConsentFlowContractValidator>;
export type ConsentFlowContractInput = z.input<typeof ConsentFlowContractValidator>;

export const ConsentFlowContractDetailsValidator = z.object({
    contract: ConsentFlowContractValidator,
    owner: LCNProfileValidator,
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    reasonForAccessing: z.string().optional(),
    image: z.string().optional(),
    uri: z.string(),
    needsGuardianConsent: z.boolean().optional(),
    redirectUrl: z.string().optional(),
    frontDoorBoostUri: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string().optional(),
    autoBoosts: z.string().array().optional(),
    writers: z.array(LCNProfileValidator).optional(),
});
export type ConsentFlowContractDetails = z.infer<typeof ConsentFlowContractDetailsValidator>;
export type ConsentFlowContractDetailsInput = z.input<typeof ConsentFlowContractDetailsValidator>;

export const PaginatedConsentFlowContractsValidator = PaginationResponseValidator.extend({
    records: ConsentFlowContractDetailsValidator.omit({ owner: true }).array(),
});
export type PaginatedConsentFlowContracts = z.infer<typeof PaginatedConsentFlowContractsValidator>;

export const ConsentFlowContractDataValidator = z.object({
    credentials: z.object({ categories: z.record(z.string(), z.string().array()).default({}) }),
    personal: z.record(z.string(), z.string()).default({}),
    date: z.string(),
});
export type ConsentFlowContractData = z.infer<typeof ConsentFlowContractDataValidator>;

export const PaginatedConsentFlowDataValidator = PaginationResponseValidator.extend({
    records: ConsentFlowContractDataValidator.array(),
});
export type PaginatedConsentFlowData = z.infer<typeof PaginatedConsentFlowDataValidator>;

export const ConsentFlowContractDataForDidValidator = z.object({
    credentials: z.object({ category: z.string(), uri: z.string() }).array(),
    personal: z.record(z.string(), z.string()).default({}),
    date: z.string(),
    contractUri: z.string(),
});
export type ConsentFlowContractDataForDid = z.infer<typeof ConsentFlowContractDataForDidValidator>;

export const PaginatedConsentFlowDataForDidValidator = PaginationResponseValidator.extend({
    records: ConsentFlowContractDataForDidValidator.array(),
});
export type PaginatedConsentFlowDataForDid = z.infer<
    typeof PaginatedConsentFlowDataForDidValidator
>;

export const ConsentFlowTermValidator = z.object({
    sharing: z.boolean().optional(),
    shared: z.string().array().optional(),
    shareAll: z.boolean().optional(),
    shareUntil: z.string().optional(),
});
export type ConsentFlowTerm = z.infer<typeof ConsentFlowTermValidator>;

export const ConsentFlowTermsValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    shareAll: z.boolean().optional(),
                    sharing: z.boolean().optional(),
                    categories: z.record(z.string(), ConsentFlowTermValidator).default({}),
                })
                .prefault({ categories: {} }),
            personal: z.record(z.string(), z.string()).default({}),
        })
        .prefault({ credentials: { categories: {} }, personal: {} }),
    write: z
        .object({
            credentials: z
                .object({ categories: z.record(z.string(), z.boolean()).default({}) })
                .prefault({ categories: {} }),
            personal: z.record(z.string(), z.boolean()).default({}),
        })
        .prefault({ credentials: { categories: {} }, personal: {} }),
    deniedWriters: z.array(z.string()).optional(),
});
export type ConsentFlowTerms = z.infer<typeof ConsentFlowTermsValidator>;
export type ConsentFlowTermsInput = z.input<typeof ConsentFlowTermsValidator>;
export const PaginatedConsentFlowTermsValidator = PaginationResponseValidator.extend({
    records: z
        .object({
            expiresAt: z.string().optional(),
            oneTime: z.boolean().optional(),
            terms: ConsentFlowTermsValidator,
            contract: ConsentFlowContractDetailsValidator,
            uri: z.string(),
            consenter: LCNProfileValidator,
            status: ConsentFlowTermsStatusValidator,
        })
        .array(),
});
export type PaginatedConsentFlowTerms = z.infer<typeof PaginatedConsentFlowTermsValidator>;

export const ConsentFlowContractQueryValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    categories: z
                        .record(z.string(), z.object({ required: z.boolean().optional() }))
                        .optional(),
                })
                .optional(),
            personal: z
                .record(z.string(), z.object({ required: z.boolean().optional() }))
                .optional(),
        })
        .optional(),
    write: z
        .object({
            credentials: z
                .object({
                    categories: z
                        .record(z.string(), z.object({ required: z.boolean().optional() }))
                        .optional(),
                })
                .optional(),
            personal: z
                .record(z.string(), z.object({ required: z.boolean().optional() }))
                .optional(),
        })
        .optional(),
});
export type ConsentFlowContractQuery = z.infer<typeof ConsentFlowContractQueryValidator>;
export type ConsentFlowContractQueryInput = z.input<typeof ConsentFlowContractQueryValidator>;

export const ConsentFlowDataQueryValidator = z.object({
    anonymize: z.boolean().optional(),
    credentials: z.object({ categories: z.record(z.string(), z.boolean()).optional() }).optional(),
    personal: z.record(z.string(), z.boolean()).optional(),
});
export type ConsentFlowDataQuery = z.infer<typeof ConsentFlowDataQueryValidator>;
export type ConsentFlowDataQueryInput = z.input<typeof ConsentFlowDataQueryValidator>;

export const ConsentFlowDataForDidQueryValidator = z.object({
    credentials: z.object({ categories: z.record(z.string(), z.boolean()).optional() }).optional(),
    personal: z.record(z.string(), z.boolean()).optional(),
    id: StringQuery.optional(),
});
export type ConsentFlowDataForDidQuery = z.infer<typeof ConsentFlowDataForDidQueryValidator>;
export type ConsentFlowDataForDidQueryInput = z.input<typeof ConsentFlowDataForDidQueryValidator>;

export const ConsentFlowTermsQueryValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    shareAll: z.boolean().optional(),
                    sharing: z.boolean().optional(),
                    categories: z
                        .record(z.string(), ConsentFlowTermValidator.optional())
                        .optional(),
                })
                .optional(),
            personal: z.record(z.string(), z.string()).optional(),
        })
        .optional(),
    write: z
        .object({
            credentials: z
                .object({ categories: z.record(z.string(), z.boolean()).optional() })
                .optional(),
            personal: z.record(z.string(), z.boolean()).optional(),
        })
        .optional(),
});
export type ConsentFlowTermsQuery = z.infer<typeof ConsentFlowTermsQueryValidator>;
export type ConsentFlowTermsQueryInput = z.input<typeof ConsentFlowTermsQueryValidator>;

export const ConsentFlowTransactionActionValidator = z.enum([
    'consent',
    'update',
    'sync',
    'withdraw',
    'write',
]);
export type ConsentFlowTransactionAction = z.infer<typeof ConsentFlowTransactionActionValidator>;

export const ConsentFlowTransactionsQueryValidator = z.object({
    terms: ConsentFlowTermsQueryValidator.optional(),
    action: ConsentFlowTransactionActionValidator.or(
        ConsentFlowTransactionActionValidator.array()
    ).optional(),
    date: z
        .object({ $gt: z.string() })
        .or(z.object({ $lt: z.string() }))
        .or(z.object({ $eq: z.string() }))
        .optional(),
    expiresAt: z
        .object({ $gt: z.string() })
        .or(z.object({ $lt: z.string() }))
        .or(z.object({ $eq: z.string() }))
        .optional(),
    oneTime: z.boolean().optional(),
});
export type ConsentFlowTransactionsQuery = z.infer<typeof ConsentFlowTransactionsQueryValidator>;
export type ConsentFlowTransactionsQueryInput = z.input<
    typeof ConsentFlowTransactionsQueryValidator
>;

export const ConsentFlowTransactionValidator = z.object({
    expiresAt: z.string().optional(),
    oneTime: z.boolean().optional(),
    terms: ConsentFlowTermsValidator.optional(),
    id: z.string(),
    action: ConsentFlowTransactionActionValidator,
    date: z.string(),
    uris: z.string().array().optional(),
});
export type ConsentFlowTransaction = z.infer<typeof ConsentFlowTransactionValidator>;

export const PaginatedConsentFlowTransactionsValidator = PaginationResponseValidator.extend({
    records: ConsentFlowTransactionValidator.array(),
});
export type PaginatedConsentFlowTransactions = z.infer<
    typeof PaginatedConsentFlowTransactionsValidator
>;

// Skill Frameworks: Query + Paginated types
const BaseSkillFrameworkQueryValidator = z
    .object({
        id: StringQuery,
        name: StringQuery,
        description: StringQuery,
        sourceURI: StringQuery,
        status: StringQuery,
    })
    .partial();

export const SkillFrameworkQueryValidator = z.union([
    z.object({ $or: BaseSkillFrameworkQueryValidator.array() }),
    BaseSkillFrameworkQueryValidator,
]);
export type SkillFrameworkQuery = z.infer<typeof SkillFrameworkQueryValidator>;

// moved below SkillFrameworkValidator

export const ContractCredentialValidator = z.object({
    credentialUri: z.string(),
    termsUri: z.string(),
    contractUri: z.string(),
    boostUri: z.string(),
    category: z.string().optional(),
    date: z.string(),
});
export type ContractCredential = z.infer<typeof ContractCredentialValidator>;

export const PaginatedContractCredentialsValidator = PaginationResponseValidator.extend({
    records: ContractCredentialValidator.array(),
});
export type PaginatedContractCredentials = z.infer<typeof PaginatedContractCredentialsValidator>;

export const LCNNotificationTypeEnumValidator = z.enum([
    'CONNECTION_REQUEST',
    'CONNECTION_ACCEPTED',
    'CREDENTIAL_RECEIVED',
    'CREDENTIAL_ACCEPTED',
    'BOOST_RECEIVED',
    'BOOST_ACCEPTED',
    'PRESENTATION_REQUEST',
    'PRESENTATION_RECEIVED',
    'CONSENT_FLOW_TRANSACTION',
    'ISSUANCE_CLAIMED',
    'ISSUANCE_DELIVERED',
    'ISSUANCE_ERROR',
    'PROFILE_PARENT_APPROVED',
    'APP_LISTING_SUBMITTED',
    'APP_LISTING_APPROVED',
    'APP_LISTING_REJECTED',
]);

export type LCNNotificationTypeEnum = z.infer<typeof LCNNotificationTypeEnumValidator>;

export const LCNNotificationMessageValidator = z.object({
    title: z.string().optional(),
    body: z.string().optional(),
});

export type LCNNotificationMessage = z.infer<typeof LCNNotificationMessageValidator>;

export const LCNInboxContactMethodValidator = z.object({
    type: z.string(),
    value: z.string(),
});

export type LCNInboxContactMethod = z.infer<typeof LCNInboxContactMethodValidator>;

export const LCNInboxStatusEnumValidator = z.enum([
    'PENDING',
    'ISSUED',
    'EXPIRED',
    /* DEPRECATED — use ISSUED */ 'DELIVERED',
    /* DEPRECATED — use ISSUED */ 'CLAIMED',
]);
export type LCNInboxStatusEnum = z.infer<typeof LCNInboxStatusEnumValidator>;

export const LCNNotificationInboxValidator = z.object({
    issuanceId: z.string(),
    status: LCNInboxStatusEnumValidator,
    recipient: z.object({
        contactMethod: LCNInboxContactMethodValidator.optional(),
        learnCardId: z.string().optional(),
    }),
    timestamp: z.iso.datetime().optional(),
});

export type LCNNotificationInbox = z.infer<typeof LCNNotificationInboxValidator>;

export const LCNNotificationDataValidator = z
    .object({
        vcUris: z.array(z.string()).optional(),
        vpUris: z.array(z.string()).optional(),
        transaction: ConsentFlowTransactionValidator.optional(),
        inbox: LCNNotificationInboxValidator.optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .loose();
export type LCNNotificationData = z.infer<typeof LCNNotificationDataValidator>;

export const LCNNotificationValidator = z.object({
    type: LCNNotificationTypeEnumValidator,
    to: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    from: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    message: LCNNotificationMessageValidator.optional(),
    data: LCNNotificationDataValidator.optional(),
    sent: z.iso.datetime().optional(),
    webhookUrl: z.string().optional(),
});

export type LCNNotification = z.infer<typeof LCNNotificationValidator>;

export const AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX = 'auth-grant:';

export const AuthGrantValidator = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    challenge: z
        .string()
        .startsWith(AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX)
        .min(10, { message: 'Challenge is too short' })
        .max(100, { message: 'Challenge is too long' }),
    status: z.enum(['revoked', 'active'], {
        error: issue => {
            if (issue.code === 'invalid_value') return 'Status must be either active or revoked';
            return 'Status is required';
        },
    }),
    scope: z.string(),
    createdAt: z.iso.datetime({ error: 'createdAt must be a valid ISO 8601 datetime string' }),
    expiresAt: z.iso
        .datetime({ error: 'expiresAt must be a valid ISO 8601 datetime string' })
        .nullish()
        .optional(),
});
export type AuthGrantType = z.infer<typeof AuthGrantValidator>;

export const FlatAuthGrantValidator = z.object({ id: z.string() }).catchall(z.any());
export type FlatAuthGrantType = z.infer<typeof FlatAuthGrantValidator>;

export const AuthGrantStatusValidator = z.enum(['active', 'revoked']);

export type AuthGrantStatus = z.infer<typeof AuthGrantStatusValidator>;

export const AuthGrantQueryValidator = z
    .object({
        id: StringQuery,
        name: StringQuery,
        description: StringQuery,
        status: AuthGrantStatusValidator,
    })
    .partial();

export type AuthGrantQuery = z.infer<typeof AuthGrantQueryValidator>;

// Contact Methods
const contactMethodBase = z.object({
    id: z.string(),
    isVerified: z.boolean(),
    verifiedAt: z.string().optional(),
    isPrimary: z.boolean(),
    createdAt: z.string(),
});

export const ContactMethodValidator = z.discriminatedUnion('type', [
    z
        .object({
            type: z.literal('email'),
            value: z.string().email(),
        })
        .merge(contactMethodBase),
    z
        .object({
            type: z.literal('phone'),
            value: z.string(), // Can be improved with a regex later
        })
        .merge(contactMethodBase),
]);

export type ContactMethodType = z.infer<typeof ContactMethodValidator>;

const createContactMethodBase = z.object({
    isVerified: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
});

export const ContactMethodCreateValidator = z.discriminatedUnion('type', [
    z
        .object({
            type: z.literal('email'),
            value: z.string().email(),
        })
        .merge(createContactMethodBase),
    z
        .object({
            type: z.literal('phone'),
            value: z.string(),
        })
        .merge(createContactMethodBase),
]);

export type ContactMethodCreateType = z.infer<typeof ContactMethodCreateValidator>;

export const ContactMethodQueryValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('email'),
        value: z.string().email(),
    }),
    z.object({
        type: z.literal('phone'),
        value: z.string(),
    }),
]);

export type ContactMethodQueryType = z.infer<typeof ContactMethodQueryValidator>;

export const ContactMethodVerificationRequestValidator = z.object({
    value: z.string(),
    type: z.enum(['email', 'phone']),
});

export type ContactMethodVerificationRequestType = z.infer<
    typeof ContactMethodVerificationRequestValidator
>;

export const ContactMethodVerificationValidator = z.object({
    token: z.string(),
});

export type ContactMethodVerificationType = z.infer<typeof ContactMethodVerificationValidator>;

export const SetPrimaryContactMethodValidator = z.object({
    contactMethodId: z.string(),
});

export type SetPrimaryContactMethodType = z.infer<typeof SetPrimaryContactMethodValidator>;

// Create Inbox Claim Session for a Contact Method
export const CreateContactMethodSessionValidator = z.object({
    contactMethod: ContactMethodVerificationRequestValidator,
    otpChallenge: z.string(),
});

export type CreateContactMethodSessionType = z.infer<typeof CreateContactMethodSessionValidator>;

export const CreateContactMethodSessionResponseValidator = z.object({
    sessionJwt: z.string(),
});

export type CreateContactMethodSessionResponseType = z.infer<
    typeof CreateContactMethodSessionResponseValidator
>;

// Inbox Credentials
export const InboxCredentialValidator = z.object({
    id: z.string(),
    credential: z.string(),
    isSigned: z.boolean(),
    currentStatus: LCNInboxStatusEnumValidator,
    isAccepted: z.boolean().optional(),
    expiresAt: z.string(),
    createdAt: z.string(),
    issuerDid: z.string(),
    webhookUrl: z.string().optional(),
    boostUri: z.string().optional(),
    activityId: z.string().optional(),
    signingAuthority: z
        .object({
            endpoint: z.string().optional(),
            name: z.string().optional(),
        })
        .optional(),
});

export type InboxCredentialType = z.infer<typeof InboxCredentialValidator>;

export const PaginatedInboxCredentialsValidator = z.object({
    hasMore: z.boolean(),
    records: z.array(InboxCredentialValidator),
    cursor: z.string().optional(),
});

export type PaginatedInboxCredentialsType = z.infer<typeof PaginatedInboxCredentialsValidator>;

export const InboxCredentialQueryValidator = z
    .object({
        currentStatus: LCNInboxStatusEnumValidator,
        id: z.string(),
        isSigned: z.boolean(),
        isAccepted: z.boolean().optional(),
        issuerDid: z.string(),
        boostUri: z.string(),
    })
    .partial();

export type InboxCredentialQuery = z.infer<typeof InboxCredentialQueryValidator>;

export const IssueInboxSigningAuthorityValidator = z.object({
    endpoint: z.string().url(),
    name: z.string(),
});

export type IssueInboxSigningAuthority = z.infer<typeof IssueInboxSigningAuthorityValidator>;

export const IssueInboxCredentialValidator = z
    .object({
        // === CORE DATA (Required) ===
        // WHAT is being sent and WHO is it for?
        recipient: ContactMethodQueryValidator.describe('The recipient of the credential'),

        // Either credential OR templateUri must be provided
        credential: VCValidator.or(VPValidator)
            .or(UnsignedVCValidator)
            .optional()
            .describe(
                'The credential to issue. If not signed, the users default signing authority will be used, or the specified signing authority in the configuration.'
            ),
        templateUri: z
            .string()
            .optional()
            .describe(
                'URI of a boost template to use for issuance. The boost credential will be resolved and used. Mutually exclusive with credential field.'
            ),

        // === OPTIONAL FEATURES ===
        // Add major, distinct features at the top level.
        //consentRequest: ConsentRequestValidator.optional(),

        // === PROCESS CONFIGURATION (Optional) ===
        // HOW should this issuance be handled?
        configuration: z
            .object({
                signingAuthority: IssueInboxSigningAuthorityValidator.optional().describe(
                    'The signing authority to use for the credential. If not provided, the users default signing authority will be used if the credential is not signed.'
                ),
                webhookUrl: z
                    .string()
                    .url()
                    .optional()
                    .describe('The webhook URL to receive credential issuance events.'),
                expiresInDays: z
                    .number()
                    .min(1)
                    .max(365)
                    .optional()
                    .describe('The number of days the credential will be valid for.'),
                templateData: z
                    .record(z.string(), z.unknown())
                    .optional()
                    .describe(
                        'Template data to render into the boost credential template using Mustache syntax. Only used when boostUri is provided.'
                    ),
                // --- For User-Facing Delivery (Email/SMS) ---
                delivery: z
                    .object({
                        suppress: z
                            .boolean()
                            .optional()
                            .default(false)
                            .describe(
                                'Whether to suppress delivery of the credential to the recipient. If true, the email/sms will not be sent to the recipient. Useful if you would like to manually send claim link to your users.'
                            ),
                        template: z
                            .object({
                                id: z
                                    .enum(['universal-inbox-claim'])
                                    .optional()
                                    .describe(
                                        'The template ID to use for the credential delivery. If not provided, the default template will be used.'
                                    ),
                                model: z
                                    .object({
                                        issuer: z
                                            .object({
                                                name: z
                                                    .string()
                                                    .optional()
                                                    .describe(
                                                        'The name of the organization (e.g., "State University").'
                                                    ),
                                                logoUrl: z
                                                    .string()
                                                    .url()
                                                    .optional()
                                                    .describe(
                                                        "The URL of the organization's logo."
                                                    ),
                                            })
                                            .optional(),
                                        credential: z
                                            .object({
                                                name: z
                                                    .string()
                                                    .optional()
                                                    .describe(
                                                        'The name of the credential (e.g., "Bachelor of Science").'
                                                    ),
                                                type: z
                                                    .string()
                                                    .optional()
                                                    .describe(
                                                        'The type of the credential (e.g., "degree", "certificate").'
                                                    ),
                                            })
                                            .optional(),
                                        recipient: z
                                            .object({
                                                name: z
                                                    .string()
                                                    .optional()
                                                    .describe(
                                                        'The name of the recipient (e.g., "John Doe").'
                                                    ),
                                            })
                                            .optional(),
                                    })
                                    .describe(
                                        'The template model to use for the credential delivery. Injects via template variables into email/sms templates. If not provided, the default template will be used.'
                                    ),
                            })
                            .optional()
                            .describe(
                                'The template to use for the credential delivery. If not provided, the default template will be used.'
                            ),
                    })
                    .optional()
                    .describe(
                        'Configuration for the credential delivery i.e. email or SMS. When credentials are sent to a user who has a verified email or phone associated with their account, delivery is skipped, and the credential will be sent using in-app notifications. If not provided, the default configuration will be used.'
                    ),
            })
            .optional()
            .describe(
                'Configuration for the credential issuance. If not provided, the default configuration will be used.'
            ),
    })
    .refine(data => data.credential || data.templateUri, {
        message: 'Either credential or templateUri must be provided.',
        path: ['credential'],
    });

export type IssueInboxCredentialType = z.infer<typeof IssueInboxCredentialValidator>;

export const IssueInboxCredentialResponseValidator = z.object({
    issuanceId: z.string(),
    status: LCNInboxStatusEnumValidator,
    recipient: ContactMethodQueryValidator,
    claimUrl: z.string().url().optional(),
    recipientDid: z.string().optional(),
});

export type IssueInboxCredentialResponseType = z.infer<
    typeof IssueInboxCredentialResponseValidator
>;

export const ClaimInboxCredentialValidator = z.object({
    credential: VCValidator.or(VPValidator)
        .or(UnsignedVCValidator)
        .describe('The credential to issue.'),
    configuration: z
        .object({
            publishableKey: z.string(),
            signingAuthorityName: z.string().optional(),
        })
        .optional(),
});

export type ClaimInboxCredentialType = z.infer<typeof ClaimInboxCredentialValidator>;

// Integrations
export const LCNDomainOrOriginValidator = z.union([
    z
        .string()
        .regex(
            /^(?:(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?$/,
            {
                message:
                    'Must be a valid domain (incl. subdomains), localhost, or IPv4, optionally with port',
            }
        ),
    z
        .string()
        .regex(
            /^https?:\/\/(?:(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?$/,
            { message: 'Must be a valid http(s) origin' }
        ),
]);

export const LCNIntegrationStatusEnum = z.enum(['setup', 'active', 'paused']);
export type LCNIntegrationStatus = z.infer<typeof LCNIntegrationStatusEnum>;

export const LCNIntegrationValidator = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    publishableKey: z.string(),
    whitelistedDomains: z.array(LCNDomainOrOriginValidator).default([]),

    // Setup/onboarding status
    status: LCNIntegrationStatusEnum.default('setup'),
    guideType: z.string().optional(),
    guideState: z.record(z.string(), z.any()).optional(),

    // Timestamps
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type LCNIntegration = z.infer<typeof LCNIntegrationValidator>;

export const LCNIntegrationCreateValidator = z.object({
    name: z.string(),
    description: z.string().optional(),
    whitelistedDomains: z.array(LCNDomainOrOriginValidator).default([]),
    guideType: z.string().optional(),
});

export type LCNIntegrationCreateType = z.infer<typeof LCNIntegrationCreateValidator>;

export const LCNIntegrationUpdateValidator = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    whitelistedDomains: z.array(LCNDomainOrOriginValidator).optional(),
    rotatePublishableKey: z.boolean().optional(),

    // Setup/onboarding updates
    status: LCNIntegrationStatusEnum.optional(),
    guideType: z.string().optional(),
    guideState: z.record(z.string(), z.any()).optional(),
});

export type LCNIntegrationUpdateType = z.infer<typeof LCNIntegrationUpdateValidator>;

export const LCNIntegrationQueryValidator = z
    .object({
        id: StringQuery,
        name: StringQuery,
        description: StringQuery,
        status: StringQuery,
        guideType: StringQuery,
    })
    .partial();

export type LCNIntegrationQueryType = z.infer<typeof LCNIntegrationQueryValidator>;

export const PaginatedLCNIntegrationsValidator = PaginationResponseValidator.extend({
    records: LCNIntegrationValidator.array(),
});

export type PaginatedLCNIntegrationsType = z.infer<typeof PaginatedLCNIntegrationsValidator>;

export const ClaimTokenValidator = z.object({
    token: z.string(),
    contactMethodId: z.string(),
    autoVerifyContactMethod: z.boolean().optional().default(false),
    createdAt: z.string(),
    expiresAt: z.string(),
    used: z.boolean(),
});

export type ClaimTokenType = z.infer<typeof ClaimTokenValidator>;

export const TagValidator = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type TagType = z.infer<typeof TagValidator>;

export const SkillStatusEnum = z.enum(['active', 'archived']);
export type SkillStatus = z.infer<typeof SkillStatusEnum>;

export const SkillValidator = z.object({
    id: z.string(),
    statement: z.string(),
    description: z.string().optional(),
    code: z.string().optional(),
    icon: z.string().optional(),
    type: z.string().default('skill'),
    status: SkillStatusEnum.default('active'),
    frameworkId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SkillType = z.infer<typeof SkillValidator>;

const BaseSkillQueryValidator = z
    .object({
        id: StringQuery,
        statement: StringQuery,
        description: StringQuery,
        code: StringQuery,
        type: StringQuery,
        status: SkillStatusEnum.or(z.object({ $in: SkillStatusEnum.array() })),
    })
    .partial();

export const SkillQueryValidator = z.union([
    z.object({
        $or: BaseSkillQueryValidator.array(),
    }),
    BaseSkillQueryValidator,
]);

export type SkillQuery = z.infer<typeof SkillQueryValidator>;

export const SkillFrameworkStatusEnum = z.enum(['active', 'archived']);
export type SkillFrameworkStatus = z.infer<typeof SkillFrameworkStatusEnum>;

export const SkillFrameworkValidator = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    sourceURI: z.string().url().optional(),
    status: SkillFrameworkStatusEnum.default('active'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SkillFrameworkType = z.infer<typeof SkillFrameworkValidator>;

export const PaginatedSkillFrameworksValidator = PaginationResponseValidator.extend({
    records: SkillFrameworkValidator.array(),
});
export type PaginatedSkillFrameworksType = z.infer<typeof PaginatedSkillFrameworksValidator>;

export type SkillTreeNode = SkillType & {
    children: SkillTreeNode[];
    hasChildren: boolean;
    childrenCursor?: string | null;
};

export const SkillTreeNodeValidator: z.ZodType<SkillTreeNode> = SkillValidator.extend({
    children: z.array(z.lazy(() => SkillTreeNodeValidator)),
    hasChildren: z.boolean(),
    childrenCursor: z.string().nullable().optional(),
});

export const PaginatedSkillTreeValidator = z.object({
    hasMore: z.boolean(),
    cursor: z.string().nullable(),
    records: z.array(SkillTreeNodeValidator),
});

export type PaginatedSkillTree = z.infer<typeof PaginatedSkillTreeValidator>;

export interface SkillTreeInput {
    id?: string;
    statement: string;
    description?: string;
    code?: string;
    icon?: string;
    type?: string;
    status?: 'active' | 'archived';
    children?: SkillTreeInput[];
}

export const SkillTreeNodeInputValidator: z.ZodType<SkillTreeInput> = z.lazy(() =>
    z.object({
        id: z.string().optional(),
        statement: z.string(),
        description: z.string().optional(),
        code: z.string().optional(),
        icon: z.string().optional(),
        type: z.string().optional(),
        status: SkillStatusEnum.optional(),
        children: z.array(SkillTreeNodeInputValidator).optional(),
    })
);

export const LinkProviderFrameworkInputValidator = z.object({
    frameworkId: z.string(),
});

export type LinkProviderFrameworkInputType = z.infer<typeof LinkProviderFrameworkInputValidator>;

export const CreateManagedFrameworkInputValidator = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    sourceURI: z.string().url().optional(),
    status: SkillFrameworkStatusEnum.optional(),
    skills: z.array(SkillTreeNodeInputValidator).optional(),
    boostUris: z.array(z.string()).optional(),
});

export type CreateManagedFrameworkInputType = z.infer<typeof CreateManagedFrameworkInputValidator>;

// Back-compat alias for plugin naming
export type CreateManagedSkillFrameworkInput = CreateManagedFrameworkInputType;

export const UpdateFrameworkInputValidator = z
    .object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        sourceURI: z.string().url().optional(),
        status: SkillFrameworkStatusEnum.optional(),
    })
    .refine(
        data =>
            data.name !== undefined ||
            data.description !== undefined ||
            data.image !== undefined ||
            data.sourceURI !== undefined ||
            data.status !== undefined,
        {
            message: 'At least one field must be provided to update',
            path: ['name'],
        }
    );

export type UpdateFrameworkInputType = z.infer<typeof UpdateFrameworkInputValidator>;

// Back-compat alias for plugin naming
export type UpdateSkillFrameworkInput = UpdateFrameworkInputType;

export const DeleteFrameworkInputValidator = z.object({ id: z.string() });

export type DeleteFrameworkInputType = z.infer<typeof DeleteFrameworkInputValidator>;

// Back-compat alias for plugin naming
export type DeleteSkillFrameworkInput = DeleteFrameworkInputType;

export const CreateManagedFrameworkBatchInputValidator = z.object({
    frameworks: z
        .array(
            CreateManagedFrameworkInputValidator.extend({
                skills: z.array(SkillTreeNodeInputValidator).optional(),
            })
        )
        .min(1),
});

export type CreateManagedFrameworkBatchInputType = z.infer<
    typeof CreateManagedFrameworkBatchInputValidator
>;

// Back-compat alias for plugin naming
export type CreateManagedSkillFrameworkBatchInput = CreateManagedFrameworkBatchInputType;

export const SkillFrameworkAdminInputValidator = z.object({
    frameworkId: z.string(),
    profileId: z.string(),
});

export type SkillFrameworkAdminInputType = z.infer<typeof SkillFrameworkAdminInputValidator>;

export const SkillFrameworkIdInputValidator = z.object({ frameworkId: z.string() });

export type SkillFrameworkIdInputType = z.infer<typeof SkillFrameworkIdInputValidator>;

export const SkillFrameworkAdminsValidator = LCNProfileValidator.array();

export type SkillFrameworkAdminsType = z.infer<typeof SkillFrameworkAdminsValidator>;

export const SyncFrameworkInputValidator = z.object({ id: z.string() });

export type SyncFrameworkInput = z.infer<typeof SyncFrameworkInputValidator>;

export const AddTagInputValidator = z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
});

export type AddTagInput = z.infer<typeof AddTagInputValidator>;

export const CreateSkillInputValidator = z.object({
    frameworkId: z.string(),
    skill: SkillTreeNodeInputValidator,
    parentId: z.string().nullable().optional(),
});

export type CreateSkillInput = z.infer<typeof CreateSkillInputValidator>;

export const UpdateSkillInputValidator = z
    .object({
        frameworkId: z.string(),
        id: z.string(),
        statement: z.string().optional(),
        description: z.string().optional(),
        code: z.string().optional(),
        icon: z.string().optional(),
        type: z.string().optional(),
        status: SkillStatusEnum.optional(),
    })
    .refine(
        data =>
            data.statement !== undefined ||
            data.description !== undefined ||
            data.code !== undefined ||
            data.icon !== undefined ||
            data.type !== undefined ||
            data.status !== undefined,
        {
            message: 'At least one field must be provided to update a skill',
            path: ['statement'],
        }
    );

export type UpdateSkillInput = z.infer<typeof UpdateSkillInputValidator>;

export const SkillDeletionStrategyValidator = z.enum(['recursive', 'reparent']);
export type SkillDeletionStrategy = z.infer<typeof SkillDeletionStrategyValidator>;

export const DeleteSkillInputValidator = z.object({
    frameworkId: z.string(),
    id: z.string(),
    strategy: SkillDeletionStrategyValidator.optional().default('reparent'),
});

export type DeleteSkillInput = z.infer<typeof DeleteSkillInputValidator>;

export const CreateSkillsBatchInputValidator = z.object({
    frameworkId: z.string(),
    skills: z.array(SkillTreeNodeInputValidator).min(1),
    parentId: z.string().nullable().optional(),
});

export type CreateSkillsBatchInput = z.infer<typeof CreateSkillsBatchInputValidator>;

export const ReplaceSkillFrameworkSkillsInputValidator = z.object({
    frameworkId: z.string(),
    skills: z.array(SkillTreeNodeInputValidator).min(0),
});

export type ReplaceSkillFrameworkSkillsInput = z.infer<
    typeof ReplaceSkillFrameworkSkillsInputValidator
>;

export const ReplaceSkillFrameworkSkillsResultValidator = z.object({
    created: z.number().int().min(0),
    updated: z.number().int().min(0),
    deleted: z.number().int().min(0),
    unchanged: z.number().int().min(0),
    total: z.number().int().min(0),
});

export type ReplaceSkillFrameworkSkillsResult = z.infer<
    typeof ReplaceSkillFrameworkSkillsResultValidator
>;

export const CountSkillsInputValidator = z.object({
    frameworkId: z.string(),
    skillId: z.string().optional(),
    recursive: z.boolean().optional().default(false),
    onlyCountCompetencies: z.boolean().optional().default(false),
});

export type CountSkillsInput = z.infer<typeof CountSkillsInputValidator>;

export const CountSkillsResultValidator = z.object({
    count: z.number().int().min(0),
});

export type CountSkillsResult = z.infer<typeof CountSkillsResultValidator>;

export const GetFullSkillTreeInputValidator = z.object({
    frameworkId: z.string(),
});

export type GetFullSkillTreeInput = z.infer<typeof GetFullSkillTreeInputValidator>;

export const GetFullSkillTreeResultValidator = z.object({
    skills: z.array(SkillTreeNodeValidator),
});

export type GetFullSkillTreeResult = z.infer<typeof GetFullSkillTreeResultValidator>;

export const GetSkillPathInputValidator = z.object({
    frameworkId: z.string(),
    skillId: z.string(),
});

export type GetSkillPathInput = z.infer<typeof GetSkillPathInputValidator>;

export const GetSkillPathResultValidator = z.object({
    path: z.array(SkillValidator),
});

export type GetSkillPathResult = z.infer<typeof GetSkillPathResultValidator>;

// Composite return shapes
export const FrameworkWithSkillsValidator = z.object({
    framework: SkillFrameworkValidator,
    skills: PaginatedSkillTreeValidator,
});

export type FrameworkWithSkills = z.infer<typeof FrameworkWithSkillsValidator>;

// Aliases used by the plugin type definitions
export type CreateSkillTreeInput = SkillTreeInput;

// App Store Listing
export const AppListingStatusValidator = z.enum(['DRAFT', 'PENDING_REVIEW', 'LISTED', 'ARCHIVED']);
export type AppListingStatus = z.infer<typeof AppListingStatusValidator>;

export const LaunchTypeValidator = z.enum([
    'EMBEDDED_IFRAME',
    'SECOND_SCREEN',
    'DIRECT_LINK',
    'CONSENT_REDIRECT',
    'SERVER_HEADLESS',
    'AI_TUTOR',
]);
export type LaunchType = z.infer<typeof LaunchTypeValidator>;

export const PromotionLevelValidator = z.enum([
    'FEATURED_CAROUSEL',
    'CURATED_LIST',
    'STANDARD',
    'DEMOTED',
]);
export type PromotionLevel = z.infer<typeof PromotionLevelValidator>;

export const AppStoreListingValidator = z.object({
    listing_id: z.string(),
    slug: z.string().optional(),
    display_name: z.string(),
    tagline: z.string(),
    full_description: z.string(),
    icon_url: z.string(),
    app_listing_status: AppListingStatusValidator,
    launch_type: LaunchTypeValidator,
    launch_config_json: z.string(),
    category: z.string().optional(),
    promo_video_url: z.string().optional(),
    promotion_level: PromotionLevelValidator.optional(),
    ios_app_store_id: z.string().optional(),
    android_app_store_id: z.string().optional(),
    privacy_policy_url: z.string().optional(),
    terms_url: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    screenshots: z.array(z.string()).optional(),
    hero_background_color: z.string().optional(),
});

export type AppStoreListing = z.infer<typeof AppStoreListingValidator>;

export const AppStoreListingCreateValidator = AppStoreListingValidator.omit({
    listing_id: true,
    app_listing_status: true,
    promotion_level: true,
});

export type AppStoreListingCreateType = z.infer<typeof AppStoreListingCreateValidator>;

export const AppStoreListingUpdateValidator = AppStoreListingValidator.partial().omit({
    listing_id: true,
    app_listing_status: true,
    promotion_level: true,
});

export type AppStoreListingUpdateType = z.infer<typeof AppStoreListingUpdateValidator>;

export const InstalledAppValidator = AppStoreListingValidator.extend({
    installed_at: z.string(),
});

export type InstalledApp = z.infer<typeof InstalledAppValidator>;

export const PaginatedAppStoreListingsValidator = PaginationResponseValidator.extend({
    records: AppStoreListingValidator.array(),
});

export type PaginatedAppStoreListings = z.infer<typeof PaginatedAppStoreListingsValidator>;

export const PaginatedInstalledAppsValidator = PaginationResponseValidator.extend({
    records: InstalledAppValidator.array(),
});

export type PaginatedInstalledApps = z.infer<typeof PaginatedInstalledAppsValidator>;

// App Store Boost Association
export const AppBoostValidator = z.object({
    templateAlias: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/),
    boostUri: z.string(),
});

export type AppBoost = z.infer<typeof AppBoostValidator>;

// App Event Types (discriminated union for type safety)
export const SendCredentialEventValidator = z.object({
    type: z.literal('send-credential'),
    templateAlias: z.string(),
    templateData: z.record(z.string(), z.unknown()).optional(),
});

export type SendCredentialEvent = z.infer<typeof SendCredentialEventValidator>;

// Add new event types here as the union grows
export const AppEventValidator = z.discriminatedUnion('type', [SendCredentialEventValidator]);

export type AppEvent = z.infer<typeof AppEventValidator>;

// Full input including listingId (used by brain service)
export const AppEventInputValidator = z.object({
    listingId: z.string(),
    event: AppEventValidator,
});

export type AppEventInput = z.infer<typeof AppEventInputValidator>;

// Response is generic since different events may return different data
export const AppEventResponseValidator = z.record(z.string(), z.unknown());

export type AppEventResponse = z.infer<typeof AppEventResponseValidator>;
// Credential Activity
export const CredentialActivityEventTypeValidator = z.enum([
    'CREATED',
    'DELIVERED',
    'CLAIMED',
    'EXPIRED',
    'FAILED',
]);
export type CredentialActivityEventType = z.infer<typeof CredentialActivityEventTypeValidator>;

export const CredentialActivityRecipientTypeValidator = z.enum(['profile', 'email', 'phone']);
export type CredentialActivityRecipientType = z.infer<
    typeof CredentialActivityRecipientTypeValidator
>;

export const CredentialActivitySourceTypeValidator = z.enum([
    'send',
    'sendBoost',
    'sendCredential',
    'contract',
    'claim',
    'inbox',
    'claimLink',
    'acceptCredential',
]);
export type CredentialActivitySourceType = z.infer<typeof CredentialActivitySourceTypeValidator>;

export const CredentialActivityValidator = z.object({
    id: z.string(),
    activityId: z.string(),
    eventType: CredentialActivityEventTypeValidator,
    timestamp: z.string(),
    actorProfileId: z.string(),
    recipientType: CredentialActivityRecipientTypeValidator,
    recipientIdentifier: z.string(),
    boostUri: z.string().optional(),
    credentialUri: z.string().optional(),
    inboxCredentialId: z.string().optional(),
    integrationId: z.string().optional(),
    source: CredentialActivitySourceTypeValidator,
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CredentialActivityRecord = z.infer<typeof CredentialActivityValidator>;

export const CredentialActivityWithDetailsValidator = CredentialActivityValidator.extend({
    boost: z
        .object({
            id: z.string(),
            name: z.string().optional(),
            category: z.string().optional(),
        })
        .optional(),
    recipientProfile: z
        .object({
            profileId: z.string(),
            displayName: z.string().optional(),
        })
        .optional(),
});
export type CredentialActivityWithDetails = z.infer<typeof CredentialActivityWithDetailsValidator>;

export const PaginatedCredentialActivitiesValidator = PaginationResponseValidator.extend({
    records: CredentialActivityWithDetailsValidator.array(),
});
export type PaginatedCredentialActivities = z.infer<typeof PaginatedCredentialActivitiesValidator>;

export const CredentialActivityStatsValidator = z.object({
    total: z.number(),
    created: z.number(),
    delivered: z.number(),
    claimed: z.number(),
    expired: z.number(),
    failed: z.number(),
    claimRate: z.number(),
});
export type CredentialActivityStats = z.infer<typeof CredentialActivityStatsValidator>;
