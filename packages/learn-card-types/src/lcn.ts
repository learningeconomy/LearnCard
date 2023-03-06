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