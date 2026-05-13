import { z } from 'zod';

export const BITSTRING_STATUS_PURPOSES = ['revocation', 'suspension'] as const;
export const DEFAULT_BITSTRING_STATUS_LIST_SIZE = 131_072;

export const BitstringStatusPurposeValidator = z.enum(BITSTRING_STATUS_PURPOSES);
export type BitstringStatusPurpose = z.infer<typeof BitstringStatusPurposeValidator>;

export const BitstringStatusListEntryValidator = z.object({
    id: z.string().optional(),
    type: z.literal('BitstringStatusListEntry'),
    statusPurpose: BitstringStatusPurposeValidator,
    statusListIndex: z.string(),
    statusListCredential: z.string(),
});
export type BitstringStatusListEntry = z.infer<typeof BitstringStatusListEntryValidator>;

export const AllocatedBitstringStatusListEntryValidator = BitstringStatusListEntryValidator.extend({
    id: z.string(),
});
export type AllocatedBitstringStatusListEntry = z.infer<
    typeof AllocatedBitstringStatusListEntryValidator
>;

export const BitstringStatusListCredentialSubjectValidator = z.object({
    id: z.string().optional(),
    type: z.literal('BitstringStatusList'),
    statusPurpose: BitstringStatusPurposeValidator,
    encodedList: z.string(),
});
export type BitstringStatusListCredentialSubject = z.infer<
    typeof BitstringStatusListCredentialSubjectValidator
>;

export const AllocateCredentialStatusInputValidator = z
    .object({
        statusPurposes: z.array(BitstringStatusPurposeValidator).optional(),
        listSize: z.number().int().positive().optional(),
    })
    .default({});
export type AllocateCredentialStatusInput = z.infer<typeof AllocateCredentialStatusInputValidator>;

export type BitstringCredentialStatusPurpose = BitstringStatusPurpose;
export type BitstringCredentialStatusEntry = AllocatedBitstringStatusListEntry;
