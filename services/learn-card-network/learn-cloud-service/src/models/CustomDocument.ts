import { z } from 'zod';
import { EncryptedRecordValidator } from '@learncard/types';

export const CUSTOM_DOCUMENT_COLLECTION = 'custom-document';

export const MongoCustomDocumentValidator = EncryptedRecordValidator.extend({
    did: z.string(),
    cursor: z.string(),
    created: z.date(),
    modified: z.date(),
});

export type MongoCustomDocumentType = z.infer<typeof MongoCustomDocumentValidator>;
