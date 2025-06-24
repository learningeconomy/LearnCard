import { z } from 'zod';

export const InboxCredentialValidator = z.object({
    id: z.string(),
    credential: z.string(),
    isSigned: z.boolean(),
    currentStatus: z.enum(['PENDING', 'CLAIMED', 'EXPIRED', 'DELIVERED']),
    expiresAt: z.string(),
    createdAt: z.string(),
    issuerDid: z.string(),
    webhookUrl: z.string().optional(),
    'signingAuthority.endpoint': z.string().optional(),
    'signingAuthority.name': z.string().optional(),
});

export type InboxCredentialType = z.infer<typeof InboxCredentialValidator>;

export const SigningAuthorityValidator = z.object({
    endpoint: z.string().url(),
    name: z.string(),
});

export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

export const IssueInboxCredentialValidator = z.object({
    recipientEmail: z.string().email(),
    credential: z.object({}).passthrough(), // Any valid JSON object for the credential
    isSigned: z.boolean().optional().default(false),
    signingAuthority: SigningAuthorityValidator.optional(),
    webhookUrl: z.string().url().optional(),
    expiresInDays: z.number().min(1).max(365).optional().default(30),
});

export type IssueInboxCredentialType = z.infer<typeof IssueInboxCredentialValidator>;

export const IssueInboxCredentialResponseValidator = z.object({
    issuanceId: z.string(),
    status: z.enum(['PENDING', 'DELIVERED']),
    recipient: z.string().email(),
    claimUrl: z.string().url().optional(),
    recipientDid: z.string().optional(),
});

export type IssueInboxCredentialResponseType = z.infer<typeof IssueInboxCredentialResponseValidator>;

export const ClaimTokenValidator = z.object({
    token: z.string(),
    emailId: z.string(),
    createdAt: z.string(),
    expiresAt: z.string(),
    used: z.boolean(),
});

export type ClaimTokenType = z.infer<typeof ClaimTokenValidator>;