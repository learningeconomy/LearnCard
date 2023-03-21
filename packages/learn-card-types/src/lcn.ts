import { z } from 'zod';

export const LCNProfileValidator = z.object({
    profileId: z.string().min(3).max(40),
    displayName: z.string().default(''),
    did: z.string(),
    email: z.string().optional(),
    image: z.string().optional(),
    isServiceProfile: z.boolean().default(false).optional(),
});
export type LCNProfile = z.infer<typeof LCNProfileValidator>;

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

export const BoostValidator = z.object({
    uri: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
});
export type Boost = z.infer<typeof BoostValidator>;

export const BoostRecipientValidator = z.object({
    to: LCNProfileValidator,
    from: z.string(),
    received: z.string(),
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
    to: z.string().or(LCNProfileValidator),
    from: z.string().or(LCNProfileValidator),
    message: LCNNotificationMessageValidator.optional(),
    data: LCNNotificationDataValidator.optional(),
    sent: z.string().datetime().optional(),
});

export type LCNNotification = z.infer<typeof LCNNotificationValidator>;