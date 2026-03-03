import { z } from 'zod';

export const CredentialActivityEventTypeValidator = z.enum([
    'CREATED',
    'DELIVERED',
    'CLAIMED',
    'EXPIRED',
    'FAILED',
]);
export type CredentialActivityEventType = z.infer<typeof CredentialActivityEventTypeValidator>;

export const CredentialActivityRecipientTypeValidator = z.enum(['profile', 'email', 'phone']);
export type CredentialActivityRecipientType = z.infer<typeof CredentialActivityRecipientTypeValidator>;

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
    boost: z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
    }).optional(),
    recipientProfile: z.object({
        profileId: z.string(),
        displayName: z.string().optional(),
    }).optional(),
});
export type CredentialActivityWithDetails = z.infer<typeof CredentialActivityWithDetailsValidator>;

export const PaginatedCredentialActivitiesValidator = z.object({
    records: z.array(CredentialActivityWithDetailsValidator),
    hasMore: z.boolean(),
    cursor: z.string().optional(),
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

export type LogCredentialActivityParams = {
    actorProfileId: string;
    eventType: CredentialActivityEventType;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    listingId?: string;
    source: CredentialActivitySourceType;
    metadata?: Record<string, unknown>;
    activityId?: string;
    recipientProfileId?: string;
};
