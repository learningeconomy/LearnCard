import { z } from 'zod';

export const StorageTypeValidator = z.enum(['ceramic']);
export const StorageTypeEnum = StorageTypeValidator.enum;
export type StorageType = z.infer<typeof StorageTypeValidator>;

export const IDXCredentialValidator = z.object({
    id: z.string(),
    title: z.string(),
    storageType: StorageTypeValidator.optional(),
});
export type IDXCredential = z.infer<typeof IDXCredentialValidator>;
