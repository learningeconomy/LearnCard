import { z } from 'zod';

import { PaginationResponseValidator } from './mongo';
import { JWEValidator } from './crypto';

export const EncryptedCredentialRecordValidator = z
    .object({
        encryptedRecord: JWEValidator,
        fields: z.string().array(),
        id: z.string(),
    })
    .catchall(z.any());
export type EncryptedCredentialRecord = z.infer<typeof EncryptedCredentialRecordValidator>;

export const PaginatedEncryptedCredentialRecordsValidator = PaginationResponseValidator.extend({
    records: EncryptedCredentialRecordValidator.array(),
});
export type PaginatedEncryptedCredentialRecordsType = z.infer<
    typeof PaginatedEncryptedCredentialRecordsValidator
>;
