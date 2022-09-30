import { z } from 'zod';

/** @group IDXPlugin */
export const StorageTypeValidator = z.enum(['ceramic']);
/** @group IDXPlugin */
export const StorageTypeEnum = StorageTypeValidator.enum;
/** @group IDXPlugin */
export type StorageType = z.infer<typeof StorageTypeValidator>;

/** @group IDXPlugin */
export const IDXCredentialValidator = z.object({
    id: z.string(),
    title: z.string(),
    storageType: StorageTypeValidator.optional(),
});
/** @group IDXPlugin */
export type IDXCredential = z.infer<typeof IDXCredentialValidator>;
