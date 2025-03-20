import { getLearnCard } from '@helpers/learnCard.helpers';
import { SigningAuthorities } from '.';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

export const createSigningAuthorityForDID = async (
    ownerDid: string,
    name: string
): Promise<string | false> => {
    const seed =
        process.env.NODE_ENV === 'test' ? 'e'.repeat(64) : crypto.randomBytes(32).toString('hex');
    const did = (await getLearnCard(seed)).id.did();
    try {
        return (
            await SigningAuthorities.insertOne({
                _id: uuidv4(),
                ownerDid,
                did,
                name,
                seed,
            })
        ).insertedId;
    } catch (e) {
        console.error(e);
        return false;
    }
};
