import { z } from 'zod';

import { JWEValidator } from '@learncard/types';

export const CREDENTIAL_COLLECTION = 'credential';

export const MongoCredentialValidator = z.object({ jwe: JWEValidator });

export type MongoCredentialType = z.infer<typeof MongoCredentialValidator>;
