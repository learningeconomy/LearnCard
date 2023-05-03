import { z } from 'zod';
import { JWEValidator } from './crypto';

export const EncryptedCredentialRecordValidator = z
    .object({
        encryptedRecord: JWEValidator,
        fields: z.string().array(),
        id: z.string(),
    })
    .catchall(z.any());
export type EncryptedCredentialRecord = z.infer<typeof EncryptedCredentialRecordValidator>;
