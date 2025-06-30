import { Profile } from '@models';

export const createProfileContactMethodRelationship = async (
    profileDid: string,
    contactMethodId: string
): Promise<boolean> => {

    await Profile.relateTo({
        alias: 'hasContactMethod',
        where: {
            source: { did: profileDid },
            target: { id: contactMethodId },
        },
        merge: true,
    })

    return true;
};