import { Profile } from '@models';

export const createProfileContactMethodRelationship = async (
    profileId: string,
    contactMethodId: string
): Promise<boolean> => {

    await Profile.relateTo({
        alias: 'hasContactMethod',
        where: {
            source: { profileId },
            target: { id: contactMethodId },
        },
        merge: true,
    })

    return true;
};