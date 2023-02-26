import { z } from 'zod';

export const CredentialValidator = z.object({ id: z.string(), credential: z.string() });
export type CredentialType = z.infer<typeof CredentialValidator>;
