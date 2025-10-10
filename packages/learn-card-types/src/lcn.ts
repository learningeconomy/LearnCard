import { extendZodWithOpenApi } from 'zod-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

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
    sent: z.string().datetime(),
    received: z.string().datetime().optional(),
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
    canManageChildrenProfiles: z.boolean().default(false).optional(),
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
        type: z.literal(ClaimHookTypeValidator.Values.GRANT_PERMISSIONS),
        data: z.object({
            claimUri: z.string(),
            targetUri: z.string(),
            permissions: BoostPermissionsValidator.partial(),
        }),
    }),
    z.object({
        type: z.literal(ClaimHookTypeValidator.Values.ADD_ADMIN),
        data: z.object({ claimUri: z.string(), targetUri: z.string() }),
    }),
    z.object({
        type: z.literal(ClaimHookTypeValidator.Values.AUTO_CONNECT),
        data: z.object({ claimUri: z.string(), targetUri: z.string() }),
    }),
]);
export type ClaimHook = z.infer<typeof ClaimHookValidator>;

export const ClaimHookQueryValidator = z
    .object({
        type: StringQuery,
        data: z.object({
            claimUri: StringQuery,
            targetUri: StringQuery,
            permissions: BoostPermissionsQueryValidator,
        }),
    })
    .deepPartial();
export type ClaimHookQuery = z.infer<typeof ClaimHookQueryValidator>;

export const FullClaimHookValidator = z
    .object({ id: z.string(), createdAt: z.string(), updatedAt: z.string() })
    .and(ClaimHookValidator);
export type FullClaimHook = z.infer<typeof FullClaimHookValidator>;

export const PaginatedClaimHooksValidator = PaginationResponseValidator.extend({
    records: FullClaimHookValidator.array(),
});
export type PaginatedClaimHooksType = z.infer<typeof PaginatedClaimHooksValidator>;

export const LCNBoostStatus = z.enum(['DRAFT', 'LIVE']);
export type LCNBoostStatusEnum = z.infer<typeof LCNBoostStatus>;

export const BoostValidator = z.object({
    uri: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    status: LCNBoostStatus.optional(),
    autoConnectRecipients: z.boolean().optional(),
    meta: z.record(z.any()).optional(),
    claimPermissions: BoostPermissionsValidator.optional(),
    allowAnyoneToCreateChildren: z.boolean().optional(),
});
export type Boost = z.infer<typeof BoostValidator>;

export const BoostQueryValidator = z
    .object({
        uri: StringQuery,
        name: StringQuery,
        type: StringQuery,
        category: StringQuery,
        meta: z.record(StringQuery),
        status: LCNBoostStatus.or(z.object({ $in: LCNBoostStatus.array() })),
        autoConnectRecipients: z.boolean(),
    })
    .partial();
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
                            z.object({
                                required: z.boolean(),
                                defaultEnabled: z.boolean().optional(),
                            })
                        )
                        .default({}),
                })
                .default({}),
            personal: z
                .record(z.object({ required: z.boolean(), defaultEnabled: z.boolean().optional() }))
                .default({}),
        })
        .default({}),
    write: z
        .object({
            credentials: z
                .object({
                    categories: z
                        .record(
                            z.object({
                                required: z.boolean(),
                                defaultEnabled: z.boolean().optional(),
                            })
                        )
                        .default({}),
                })
                .default({}),
            personal: z
                .record(z.object({ required: z.boolean(), defaultEnabled: z.boolean().optional() }))
                .default({}),
        })
        .default({}),
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
    credentials: z.object({ categories: z.record(z.string().array()).default({}) }),
    personal: z.record(z.string()).default({}),
    date: z.string(),
});
export type ConsentFlowContractData = z.infer<typeof ConsentFlowContractDataValidator>;

export const PaginatedConsentFlowDataValidator = PaginationResponseValidator.extend({
    records: ConsentFlowContractDataValidator.array(),
});
export type PaginatedConsentFlowData = z.infer<typeof PaginatedConsentFlowDataValidator>;

export const ConsentFlowContractDataForDidValidator = z.object({
    credentials: z.object({ category: z.string(), uri: z.string() }).array(),
    personal: z.record(z.string()).default({}),
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
                    categories: z.record(ConsentFlowTermValidator).default({}),
                })
                .default({}),
            personal: z.record(z.string()).default({}),
        })
        .default({}),
    write: z
        .object({
            credentials: z.object({ categories: z.record(z.boolean()).default({}) }).default({}),
            personal: z.record(z.boolean()).default({}),
        })
        .default({}),
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
                    categories: z.record(z.object({ required: z.boolean().optional() })).optional(),
                })
                .optional(),
            personal: z.record(z.object({ required: z.boolean().optional() })).optional(),
        })
        .optional(),
    write: z
        .object({
            credentials: z
                .object({
                    categories: z.record(z.object({ required: z.boolean().optional() })).optional(),
                })
                .optional(),
            personal: z.record(z.object({ required: z.boolean().optional() })).optional(),
        })
        .optional(),
});
export type ConsentFlowContractQuery = z.infer<typeof ConsentFlowContractQueryValidator>;
export type ConsentFlowContractQueryInput = z.input<typeof ConsentFlowContractQueryValidator>;

export const ConsentFlowDataQueryValidator = z.object({
    anonymize: z.boolean().optional(),
    credentials: z.object({ categories: z.record(z.boolean()).optional() }).optional(),
    personal: z.record(z.boolean()).optional(),
});
export type ConsentFlowDataQuery = z.infer<typeof ConsentFlowDataQueryValidator>;
export type ConsentFlowDataQueryInput = z.input<typeof ConsentFlowDataQueryValidator>;

export const ConsentFlowDataForDidQueryValidator = z.object({
    credentials: z.object({ categories: z.record(z.boolean()).optional() }).optional(),
    personal: z.record(z.boolean()).optional(),
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
                    categories: z.record(ConsentFlowTermValidator.optional()).optional(),
                })
                .optional(),
            personal: z.record(z.string()).optional(),
        })
        .optional(),
    write: z
        .object({
            credentials: z.object({ categories: z.record(z.boolean()).optional() }).optional(),
            personal: z.record(z.boolean()).optional(),
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

export const LCNInboxStatusEnumValidator = z.enum(['PENDING', 'DELIVERED', 'CLAIMED', 'EXPIRED']);
export type LCNInboxStatusEnum = z.infer<typeof LCNInboxStatusEnumValidator>;

export const LCNNotificationInboxValidator = z.object({
    issuanceId: z.string(),
    status: LCNInboxStatusEnumValidator,
    recipient: z.object({
        contactMethod: LCNInboxContactMethodValidator.optional(),
        learnCardId: z.string().optional(),
    }),
    timestamp: z.string().datetime().optional(),
});

export type LCNNotificationInbox = z.infer<typeof LCNNotificationInboxValidator>;

export const LCNNotificationDataValidator = z.object({
    vcUris: z.array(z.string()).optional(),
    vpUris: z.array(z.string()).optional(),
    transaction: ConsentFlowTransactionValidator.optional(),
    inbox: LCNNotificationInboxValidator.optional(),
});

export type LCNNotificationData = z.infer<typeof LCNNotificationDataValidator>;

export const LCNNotificationValidator = z.object({
    type: LCNNotificationTypeEnumValidator,
    to: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    from: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    message: LCNNotificationMessageValidator.optional(),
    data: LCNNotificationDataValidator.optional(),
    sent: z.string().datetime().optional(),
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
        required_error: 'Status is required',
        invalid_type_error: 'Status must be either active or revoked',
    }),
    scope: z.string(),
    createdAt: z
        .string()
        .datetime({ message: 'createdAt must be a valid ISO 8601 datetime string' }),
    expiresAt: z
        .string()
        .datetime({ message: 'expiresAt must be a valid ISO 8601 datetime string' })
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

// Inbox Credentials
export const InboxCredentialValidator = z.object({
    id: z.string(),
    credential: z.string(),
    isSigned: z.boolean(),
    currentStatus: LCNInboxStatusEnumValidator,
    expiresAt: z.string(),
    createdAt: z.string(),
    issuerDid: z.string(),
    webhookUrl: z.string().optional(),
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
        issuerDid: z.string(),
    })
    .partial();

export type InboxCredentialQuery = z.infer<typeof InboxCredentialQueryValidator>;

export const IssueInboxSigningAuthorityValidator = z.object({
    endpoint: z.string().url(),
    name: z.string(),
});

export type IssueInboxSigningAuthority = z.infer<typeof IssueInboxSigningAuthorityValidator>;

export const IssueInboxCredentialValidator = z.object({
    // === CORE DATA (Required) ===
    // WHAT is being sent and WHO is it for?
    recipient: ContactMethodQueryValidator.describe('The recipient of the credential'),
    credential: VCValidator.passthrough()
        .or(VPValidator.passthrough())
        .or(UnsignedVCValidator.passthrough())
        .describe(
            'The credential to issue. If not signed, the users default signing authority will be used, or the specified signing authority in the configuration.'
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
                                                .describe("The URL of the organization's logo."),
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

export const SkillQueryValidator = z
    .object({
        id: StringQuery,
        statement: StringQuery,
        description: StringQuery,
        code: StringQuery,
        type: StringQuery,
        status: SkillStatusEnum.or(z.object({ $in: SkillStatusEnum.array() })),
    })
    .partial();
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

export type SkillTreeNode = SkillType & {
    children: SkillTreeNode[];
    hasChildren: boolean;
    childrenCursor?: string | null;
};

export const SkillTreeNodeValidator: z.ZodType<SkillTreeNode> = SkillValidator.extend({
    children: z.array(z.lazy(() => SkillTreeNodeValidator)),
    hasChildren: z.boolean(),
    childrenCursor: z.string().nullable().optional(),
}).openapi({ ref: 'SkillTreeNode' }) as any;

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

export const SkillTreeNodeInputValidator: z.ZodType<SkillTreeInput> = z
    .lazy(() =>
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
    )
    .openapi({ ref: 'SkillTreeNodeInput' });

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

export const DeleteSkillInputValidator = z.object({
    frameworkId: z.string(),
    id: z.string(),
});

export type DeleteSkillInput = z.infer<typeof DeleteSkillInputValidator>;

export const CreateSkillsBatchInputValidator = z.object({
    frameworkId: z.string(),
    skills: z.array(SkillTreeNodeInputValidator).min(1),
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

// Composite return shapes
export const FrameworkWithSkillsValidator = z.object({
    framework: SkillFrameworkValidator,
    skills: PaginatedSkillTreeValidator,
});

export type FrameworkWithSkills = z.infer<typeof FrameworkWithSkillsValidator>;

// Aliases used by the plugin type definitions
export type CreateSkillTreeInput = SkillTreeInput;
