import { ProfileInstance } from '@models';
import { SigningAuthorityForUserType } from 'types/profile';

export const getSigningAuthoritiesForUser = async (
    user: ProfileInstance
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await user.findRelationships({
            alias: 'usesSigningAuthority',
        })
    ).map(relationship => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getSigningAuthorityForUserByName = async (
    user: ProfileInstance,
    endpoint: string,
    name: string
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await user.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                relationship: { name },
                target: { endpoint },
            },
        })
    ).map(relationship => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};
