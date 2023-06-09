import { z } from 'zod';

import { PaginationResponseValidator } from './mongo';
import { JWEValidator } from './crypto';

export const EncryptedRecordValidator = z
    .object({ encryptedRecord: JWEValidator, fields: z.string().array() })
    .catchall(z.any());
export type EncryptedRecord = z.infer<typeof EncryptedRecordValidator>;

export const PaginatedEncryptedRecordsValidator = PaginationResponseValidator.extend({
    records: EncryptedRecordValidator.array(),
});
export type PaginatedEncryptedRecordsType = z.infer<typeof PaginatedEncryptedRecordsValidator>;

export const EncryptedCredentialRecordValidator = EncryptedRecordValidator.extend({
    id: z.string(),
});
export type EncryptedCredentialRecord = z.infer<typeof EncryptedCredentialRecordValidator>;

export const PaginatedEncryptedCredentialRecordsValidator = PaginationResponseValidator.extend({
    records: EncryptedCredentialRecordValidator.array(),
});
export type PaginatedEncryptedCredentialRecordsType = z.infer<
    typeof PaginatedEncryptedCredentialRecordsValidator
>;
