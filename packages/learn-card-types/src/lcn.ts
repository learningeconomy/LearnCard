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
    name: z.string(),
});
export type Boost = z.infer<typeof BoostValidator>;
