import { z } from 'zod';
import { ContactMethodQueryValidator } from './contact-method';

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

export const PaginatedInboxCredentialsValidator = z.object({
    hasMore: z.boolean(),
    records: z.array(InboxCredentialValidator),
    cursor: z.string().optional(),
});

export type PaginatedInboxCredentialsType = z.infer<typeof PaginatedInboxCredentialsValidator>;

export const InboxCredentialQueryValidator = z
    .object({
        currentStatus: z.enum(['PENDING', 'CLAIMED', 'EXPIRED', 'DELIVERED']),
        id: z.string(),
        isSigned: z.boolean(),
        issuerDid: z.string(),
    })
    .partial();

export type InboxCredentialQuery = z.infer<typeof InboxCredentialQueryValidator>;

export const SigningAuthorityValidator = z.object({
    endpoint: z.string().url(),
    name: z.string(),
});

export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

export const IssueInboxCredentialValidator = z.object({
    recipient: ContactMethodQueryValidator,
    credential: z.object({}).passthrough(), // Any valid JSON object for the credential
    isSigned: z.boolean().optional().default(false),
    signingAuthority: SigningAuthorityValidator.optional(),
    webhookUrl: z.string().url().optional(),
    expiresInDays: z.number().min(1).max(365).optional(),
});

export type IssueInboxCredentialType = z.infer<typeof IssueInboxCredentialValidator>;

export const IssueInboxCredentialResponseValidator = z.object({
    issuanceId: z.string(),
    status: z.enum(['PENDING', 'DELIVERED']),
    recipient: ContactMethodQueryValidator,
    claimUrl: z.string().url().optional(),
    recipientDid: z.string().optional(),
});

export type IssueInboxCredentialResponseType = z.infer<typeof IssueInboxCredentialResponseValidator>;

export const ClaimTokenValidator = z.object({
    token: z.string(),
    contactMethodId: z.string(),
    createdAt: z.string(),
    expiresAt: z.string(),
    used: z.boolean(),
});

export type ClaimTokenType = z.infer<typeof ClaimTokenValidator>;