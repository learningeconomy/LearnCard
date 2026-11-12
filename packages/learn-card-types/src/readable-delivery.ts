import { z } from 'zod';

export const READABLE_DELIVERY_DISCLOSURE_VERSION = '1' as const;

export const ReadableDeliveryRecipientValidator = z.object({
    profileId: z.string().min(3).max(40),
    did: z.string(),
    displayName: z.string(),
    agentDid: z.string(),
    enabled: z.boolean(),
    disclosureVersion: z.literal(READABLE_DELIVERY_DISCLOSURE_VERSION),
});
export type ReadableDeliveryRecipient = z.infer<typeof ReadableDeliveryRecipientValidator>;

export const CreateReadableDeliveryRecipientValidator = z.object({
    requestId: z.uuid(),
    displayName: z.string().trim().min(1).max(100),
    acceptDelegatedAuthority: z.literal(true),
    disclosureVersion: z.literal(READABLE_DELIVERY_DISCLOSURE_VERSION),
});
export type CreateReadableDeliveryRecipient = z.infer<
    typeof CreateReadableDeliveryRecipientValidator
>;

export const ReadableDeliveryReadInputValidator = z.object({
    contractUri: z.string().min(1).max(2048),
    did: z.string().min(1).max(2048),
    limit: z.number().int().min(1).max(25).default(10),
    cursor: z
        .string()
        .regex(/^\d{1,7}$/)
        .optional(),
});
export type ReadableDeliveryReadInput = z.input<typeof ReadableDeliveryReadInputValidator>;

export const ReadableDeliveryCredentialValidator = z.object({
    uri: z.string(),
    category: z.string(),
    status: z.enum(['readable', 'unreadable', 'unavailable', 'invalid']),
    credential: z
        .object({
            name: z.string().optional(),
            type: z.array(z.string()),
            issuer: z.string(),
            issuanceDate: z.string().optional(),
            expirationDate: z.string().optional(),
            validFrom: z.string().optional(),
            validUntil: z.string().optional(),
            boostUri: z.string().optional(),
            verification: z.object({
                proof: z.enum(['valid', 'invalid', 'not_checked']),
                status: z.literal('not_checked'),
            }),
        })
        .optional(),
});
export type ReadableDeliveryCredential = z.infer<typeof ReadableDeliveryCredentialValidator>;

export const ReadableDeliveryPageValidator = z.object({
    records: z.array(ReadableDeliveryCredentialValidator),
    hasMore: z.boolean(),
    cursor: z.string().optional(),
});
export type ReadableDeliveryPage = z.infer<typeof ReadableDeliveryPageValidator>;
