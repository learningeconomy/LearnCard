import { z } from 'zod';

import { JWEValidator } from '@learncard/types';

export const CREDENTIAL_COLLECTION = 'credentials';

export const MongoCredentialValidator = z.object({
    jwe: JWEValidator,
    did: z.string().optional(),
});

export type MongoCredentialType = z.infer<typeof MongoCredentialValidator>;
