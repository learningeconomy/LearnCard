import { environment } from '@environment';
import { getEphemeralLearnCard } from '@helpers/learnCard.helpers';
import { SigningAuthorities } from '.';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { logSeedEncryptionFailure, seedEncryption } from '@helpers/seedEncryption.helpers';

export const createSigningAuthorityForDID = async (
    ownerDid: string,
    name: string
): Promise<string | false> => {
    const seed =
        environment.NODE_ENV === 'test' ? 'e'.repeat(64) : crypto.randomBytes(32).toString('hex');
    const _id = uuidv4();
    try {
        const did = (await getEphemeralLearnCard(seed)).id.did();
        const identity = { _id, ownerDid, did, name };
        // The plaintext branch exists only for the first, reader-compatible deployment.
        const secret = environment.SA_SEED_ENCRYPT_WRITES
            ? await seedEncryption.encrypt(seed, identity)
            : { seed };
        return (
            await SigningAuthorities.insertOne({
                ...identity,
                ...secret,
            })
        ).insertedId;
    } catch (e) {
        logSeedEncryptionFailure(e, 'create', { _id });
        return false;
    }
};
