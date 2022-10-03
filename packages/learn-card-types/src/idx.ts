import { z } from 'zod';

/** @group IDXPlugin */
export const StorageTypeValidator = z.enum(['ceramic']);
/** @group IDXPlugin */
export const StorageTypeEnum = StorageTypeValidator.enum;
/** @group IDXPlugin */
export type StorageType = z.infer<typeof StorageTypeValidator>;

/** @group IDXPlugin */
export type IDXCredential<Metadata extends Record<string, any> = Record<never, never>> = {
    id: string;
    title: string;
    storageType?: StorageType;
    [key: string]: any;
} & Metadata;

/** @group IDXPlugin */
export const IDXCredentialValidator: z.ZodType<IDXCredential> = z
    .object({
        id: z.string(),
        title: z.string(),
        storageType: StorageTypeValidator.optional(),
    })
    .catchall(z.any());
