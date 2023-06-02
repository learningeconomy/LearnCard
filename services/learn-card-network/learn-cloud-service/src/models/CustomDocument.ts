import { z } from 'zod';

export const CUSTOM_DOCUMENT_COLLECTION = 'custom-document';

export const MongoCustomDocumentValidator = z.record(z.any());

export type MongoCustomDocumentType = z.infer<typeof MongoCustomDocumentValidator>;
