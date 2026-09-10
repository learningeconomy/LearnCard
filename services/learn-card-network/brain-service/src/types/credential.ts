import { z } from 'zod';

export const CredentialValidator = z.object({
    id: z.string(),
    credential: z.string(),
    statusEntries: z.string().optional(),
});
export type CredentialType = z.infer<typeof CredentialValidator>;
