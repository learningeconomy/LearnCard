import { z } from 'zod';

import { EncryptedCredentialRecordValidator } from '@learncard/types';

export const CREDENTIAL_RECORD_COLLECTION = 'credential-record';

export const MongoCredentialRecordValidator = EncryptedCredentialRecordValidator.extend({
    did: z.string(),
    cursor: z.string(),
    created: z.date(),
    modified: z.date(),
});
export type MongoCredentialRecordType = z.infer<typeof MongoCredentialRecordValidator>;
