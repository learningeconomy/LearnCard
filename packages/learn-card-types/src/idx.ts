import { z } from 'zod';

/** @group IDXPlugin */
export type IDXCredential<Metadata extends Record<string, any> = Record<never, never>> = {
    id: string;
    uri: string;
    [key: string]: any;
} & Metadata;

/** @group IDXPlugin */
export const IDXCredentialValidator: z.ZodType<IDXCredential> = z
    .object({ id: z.string(), uri: z.string() })
    .catchall(z.any());
