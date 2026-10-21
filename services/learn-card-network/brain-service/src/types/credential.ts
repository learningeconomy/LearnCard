import { z } from 'zod';
import type { BitstringStatusListEntry, JWE, VC } from '@learncard/types';

/** Internal issuance result; serialize and pass both fields together until storage. */
export interface IssuedCredential {
    readonly kind: 'issued-credential';
    readonly credential: VC | JWE;
    readonly statusEntries: BitstringStatusListEntry[];
}

export const CredentialValidator = z.object({
    id: z.string(),
    credential: z.string(),
    statusEntries: z.string().optional(),
});
export type CredentialType = z.infer<typeof CredentialValidator>;
