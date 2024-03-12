import { z } from 'zod';

import { PaginationResponseValidator } from './mongo';

export const LCNProfileValidator = z.object({
    profileId: z.string().min(3).max(40),
    displayName: z.string().default(''),
    bio: z.string().default(''),
    did: z.string(),
    email: z.string().optional(),
    image: z.string().optional(),
    isServiceProfile: z.boolean().default(false).optional(),
    notificationsWebhook: z.string().url().startsWith('https://').optional(),
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

export const BoostRecipientValidator = z.object({
    to: LCNProfileValidator,
    from: z.string(),
    received: z.string().optional(),
});

export type BoostRecipientInfo = z.infer<typeof BoostRecipientValidator>;

export const LCNNotificationTypeEnumValidator = z.enum([
    'CONNECTION_REQUEST',
    'CONNECTION_ACCEPTED',
    'CREDENTIAL_RECEIVED',
    'CREDENTIAL_ACCEPTED',
    'BOOST_RECEIVED',
    'BOOST_ACCEPTED',
    'PRESENTATION_REQUEST',
    'PRESENTATION_RECEIVED',
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
    }),
});
export type LCNSigningAuthorityForUserType = z.infer<typeof LCNSigningAuthorityForUserValidator>;

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

export const ConsentFlowTermsValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    shareAll: z.boolean().optional(),
                    sharing: z.boolean().optional(),
                    categories: z
                        .record(
                            z.object({
                                sharing: z.boolean().optional(),
                                shared: z.string().array().optional(),
                                shareAll: z.boolean().optional(),
                            })
                        )
                        .default({}),
                })
                .default({}),
            personal: z.record(z.boolean()).default({}),
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
            liveSyncing: z.boolean().optional(),
            oneTime: z.boolean().optional(),
            terms: ConsentFlowTermsValidator,
            contract: ConsentFlowContractDetailsValidator,
            uri: z.string(),
            consenter: LCNProfileValidator,
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

export const ConsentFlowTermsQueryValidator = z.object({
    read: z
        .object({
            anonymize: z.boolean().optional(),
            credentials: z
                .object({
                    shareAll: z.boolean().optional(),
                    sharing: z.boolean().optional(),
                    categories: z
                        .record(
                            z
                                .object({
                                    sharing: z.boolean().optional(),
                                    shared: z.string().array().optional(),
                                    shareAll: z.boolean().optional(),
                                })
                                .optional()
                        )
                        .optional(),
                })
                .optional(),
            personal: z.record(z.boolean()).optional(),
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
