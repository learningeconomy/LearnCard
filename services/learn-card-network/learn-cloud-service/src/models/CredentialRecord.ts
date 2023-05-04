import { z } from 'zod';

import { EncryptedCredentialRecordValidator } from '@learncard/types';

export const CREDENTIAL_RECORD_COLLECTION = 'credential-record';

export const MongoCredentialRecordValidator = EncryptedCredentialRecordValidator.omit({
    id: true,
}).extend({
    _id: z.string(),
    did: z.string(),
    cursor: z.number(),
    created: z.date(),
    modified: z.date(),
});
export type MongoCredentialRecordType = z.infer<typeof MongoCredentialRecordValidator>;
