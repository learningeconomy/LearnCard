import { z } from 'zod';

export const EmailAddressValidator = z.object({
    id: z.string(),
    email: z.string().email(),
    isVerified: z.boolean(),
    isPrimary: z.boolean(),
    verifiedAt: z.string().optional(),
    createdAt: z.string(),
});

export type EmailAddressType = z.infer<typeof EmailAddressValidator>;

export const CreateEmailAddressValidator = z.object({
    email: z.string().email(),
    isVerified: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
});

export type CreateEmailAddressType = z.infer<typeof CreateEmailAddressValidator>;

export const EmailVerificationRequestValidator = z.object({
    email: z.string().email(),
});

export type EmailVerificationRequestType = z.infer<typeof EmailVerificationRequestValidator>;

export const EmailVerificationValidator = z.object({
    token: z.string(),
});

export type EmailVerificationType = z.infer<typeof EmailVerificationValidator>;

export const SetPrimaryEmailValidator = z.object({
    emailId: z.string(),
});

export type SetPrimaryEmailType = z.infer<typeof SetPrimaryEmailValidator>;