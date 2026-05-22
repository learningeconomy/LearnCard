import { z } from 'zod';

export const CredentialValidator = z.object({ id: z.string(), credential: z.string() });
export type CredentialType = z.infer<typeof CredentialValidator>;

export const StoredCredentialValidator = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('plaintext'), body: z.string() }),
    z.object({ kind: z.literal('jwe'), body: z.string() }),
]);
export type StoredCredential = z.infer<typeof StoredCredentialValidator>;
