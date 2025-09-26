import { Integration, Profile } from '@models';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { IntegrationType } from 'types/integration';

export const getSigningAuthoritiesForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { profileId: user.profileId } },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
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
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};

export const getPrimarySigningAuthorityForUser = async (
    user: ProfileType
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await Profile.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: user.profileId },
                relationship: { isPrimary: true },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};

export const getSigningAuthoritiesForIntegration = async (
    integration: IntegrationType
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Integration.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { id: integration.id } },
        })
    ).map((relationship: { source: any; relationship: any }) => {
        return {
            signingAuthority: relationship.source.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getSigningAuthoritiesForIntegrationByName = async (
    integration: IntegrationType,
    name: string
): Promise<SigningAuthorityForUserType[]> => {
    return (
        await Integration.findRelationships({
            alias: 'usesSigningAuthority',
            where: { source: { id: integration.id }, relationship: { name } },
        })
    ).map((relationship: { source: any; relationship: any }) => {
        return {
            signingAuthority: relationship.source.dataValues,
            relationship: relationship.relationship,
        };
    });
};

export const getPrimarySigningAuthorityForIntegration = async (
    integration: IntegrationType
): Promise<SigningAuthorityForUserType | undefined> => {
    return (
        await Integration.findRelationships({
            alias: 'usesSigningAuthority',
            where: {
                source: { id: integration.id },
                relationship: { isPrimary: true },
            },
        })
    ).map((relationship: { target: any; relationship: any }) => {
        return {
            signingAuthority: relationship.target.dataValues,
            relationship: relationship.relationship,
        };
    })[0];
};
