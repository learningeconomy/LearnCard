import { z } from 'zod';

const contactMethodBase = z.object({
    id: z.string(),
    isVerified: z.boolean(),
    verifiedAt: z.string().optional(),
    isPrimary: z.boolean(),
    createdAt: z.string(),
});

export const ContactMethodValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('email'),
        value: z.string().email(),
    }).merge(contactMethodBase),
    z.object({
        type: z.literal('phone'),
        value: z.string(), // Can be improved with a regex later
    }).merge(contactMethodBase),
]);

export type ContactMethodType = z.infer<typeof ContactMethodValidator>;

const createContactMethodBase = z.object({
    isVerified: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
});

export const ContactMethodCreateValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('email'),
        value: z.string().email(),
    }).merge(createContactMethodBase),
    z.object({
        type: z.literal('phone'),
        value: z.string(),
    }).merge(createContactMethodBase),
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
