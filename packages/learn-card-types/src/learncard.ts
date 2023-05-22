import { z } from 'zod';
import { CredentialSubjectValidator, ProfileValidator } from './vc';

export const VerificationCheckValidator = z.object({
    checks: z.string().array(),
    warnings: z.string().array(),
    errors: z.string().array(),
});
export type VerificationCheck = z.infer<typeof VerificationCheckValidator>;

export const VerificationStatusValidator = z.enum(['Success', 'Failed', 'Error']);
export type VerificationStatus = z.infer<typeof VerificationStatusValidator>;
export const VerificationStatusEnum = VerificationStatusValidator.enum;

export const VerificationItemValidator = z.object({
    check: z.string(),
    status: VerificationStatusValidator,
    message: z.string().optional(),
    details: z.string().optional(),
});
export type VerificationItem = z.infer<typeof VerificationItemValidator>;

export const CredentialInfoValidator = z.object({
    title: z.string().optional(),
    createdAt: z.string().optional(),
    issuer: ProfileValidator.optional(),
    issuee: ProfileValidator.optional(),
    credentialSubject: CredentialSubjectValidator.optional(),
});
export type CredentialInfo = z.infer<typeof CredentialInfoValidator>;

export type CredentialRecord<Metadata extends Record<string, any> = Record<never, never>> = {
    id: string;
    uri: string;
    [key: string]: any;
} & Metadata;

export const CredentialRecordValidator = z
    .object({ id: z.string(), uri: z.string() })
    .catchall(z.any()) satisfies z.ZodType<CredentialRecord>;
