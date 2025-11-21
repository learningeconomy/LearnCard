import { EncryptionKeys } from '.';
import { createEncryptionKeyForDid } from './create';

export const getEncryptionKeyForDid = async (did: string): Promise<string> => {
    const key = await EncryptionKeys.findOne({ did });

    if (key) return key.key;

    return (await createEncryptionKeyForDid(did)).key;
};
