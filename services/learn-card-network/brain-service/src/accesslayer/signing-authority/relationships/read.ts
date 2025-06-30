import { Profile } from '@models';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';

export const getSigningAuthoritiesForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { profileId: user.profileId } },
        })
    ).map((relationship: { signingAuthority: any; relationship: any }) => {
        return {
            signingAuthority: relationship.signingAuthority,
            relationship: relationship.relationship,
        };
    });
};

export const getSigningAuthorityForUserByName = async (
    user: ProfileType,
    endpoint: string,
    name: string
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: user.profileId },
                relationship: { name },
                target: { endpoint },
            },
        })
    ).map((relationship: { signingAuthority: any; relationship: any }) => {
        return {
            signingAuthority: relationship.signingAuthority,
            relationship: relationship.relationship,
        };
    })[0];
};
