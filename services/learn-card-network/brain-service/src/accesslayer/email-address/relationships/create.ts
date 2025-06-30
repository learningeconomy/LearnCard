import { QueryBuilder, BindParam } from 'neogma';
import { Profile, EmailAddress } from '@models';

export const createProfileEmailRelationship = async (
    profileDid: string,
    emailAddressId: string
): Promise<boolean> => {

    await Profile.relateTo({
        alias: 'hasEmail',
        where: {
            source: { did: profileDid },
            target: { id: emailAddressId },
        },
        merge: true,
    })

    return true;
};