import { z } from 'zod';

import { PaginationResponseValidator } from './mongo';

export const LCNProfileValidator = z.object({
    profileId: z.string().min(3).max(40),
    displayName: z.string().default(''),
    shortBio: z.string().default(''),
    bio: z.string().default(''),
    did: z.string(),
    email: z.string().optional(),
    image: z.string().optional(),
    heroImage: z.string().optional(),
    websiteLink: z.string().optional(),
    isServiceProfile: z.boolean().default(false).optional(),
    type: z.string().optional(),
    notificationsWebhook: z.string().url().startsWith('http').optional(),
});
export type LCNProfile = z.infer<typeof LCNProfileValidator>;

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

export const SentCredentialInfoValidator = z.object({
    uri: z.string(),
    to: z.string(),
    from: z.string(),
    sent: z.string().datetime(),
    received: z.string().datetime().optional(),
});
export type SentCredentialInfo = z.infer<typeof SentCredentialInfoValidator>;

export const LCNBoostStatus = z.enum(['DRAFT', 'LIVE']);
export type LCNBoostStatusEnum = z.infer<typeof LCNBoostStatus>;

export const BoostValidator = z.object({
    uri: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    status: LCNBoostStatus.optional(),
    autoConnectRecipients: z.boolean().optional(),
});
export type Boost = z.infer<typeof BoostValidator>;

export const PaginatedBoostsValidator = PaginationResponseValidator.extend({
    records: BoostValidator.array(),
});
export type PaginatedBoostsType = z.infer<typeof PaginatedBoostsValidator>;

export const BoostRecipientValidator = z.object({
    to: LCNProfileValidator,
    from: z.string(),
    received: z.string().optional(),
});
export type BoostRecipientInfo = z.infer<typeof BoostRecipientValidator>;

export const PaginatedBoostRecipientsValidator = PaginationResponseValidator.extend({
    records: BoostRecipientValidator.array(),
});
export type PaginatedBoostRecipientsType = z.infer<typeof PaginatedBoostRecipientsValidator>;

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
    canViewAnalytics: z.boolean(),
});
export type BoostPermissions = z.infer<typeof BoostPermissionsValidator>;

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
    }),
});
export type LCNSigningAuthorityForUserType = z.infer<typeof LCNSigningAuthorityForUserValidator>;

export const ConsentFlowTermsStatusValidator = z.enum(['live', 'stale', 'withdrawn']);
export type ConsentFlowTermsStatus = z.infer<typeof ConsentFlowTermsStatusValidator>;

export const ConsentFlowContractValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({ categories: z.record(z.object({ required: z.boolean() })).default({}) })
                .default({}),
            personal: z.record(z.object({ required: z.boolean() })).default({}),
        })
        .default({}),
    write: z
        .object({
            credentials: z
                .object({ categories: z.record(z.object({ required: z.boolean() })).default({}) })
                .default({}),
            personal: z.record(z.object({ required: z.boolean() })).default({}),
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
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string().optional(),
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
});
export type ConsentFlowTransaction = z.infer<typeof ConsentFlowTransactionValidator>;

export const PaginatedConsentFlowTransactionsValidator = PaginationResponseValidator.extend({
    records: ConsentFlowTransactionValidator.array(),
});
export type PaginatedConsentFlowTransactions = z.infer<
    typeof PaginatedConsentFlowTransactionsValidator
>;

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
]);

export type LCNNotificationTypeEnum = z.infer<typeof LCNNotificationTypeEnumValidator>;

export const LCNNotificationMessageValidator = z.object({
    title: z.string().optional(),
    body: z.string().optional(),
});

export type LCNNotificationMessage = z.infer<typeof LCNNotificationMessageValidator>;

export const LCNNotificationDataValidator = z.object({
    vcUris: z.array(z.string()).optional(),
    vpUris: z.array(z.string()).optional(),
    transaction: ConsentFlowTransactionValidator.optional(),
});

export type LCNNotificationData = z.infer<typeof LCNNotificationDataValidator>;

export const LCNNotificationValidator = z.object({
    type: LCNNotificationTypeEnumValidator,
    to: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    from: LCNProfileValidator.partial().and(z.object({ did: z.string() })),
    message: LCNNotificationMessageValidator.optional(),
    data: LCNNotificationDataValidator.optional(),
    sent: z.string().datetime().optional(),
});

export type LCNNotification = z.infer<typeof LCNNotificationValidator>;
