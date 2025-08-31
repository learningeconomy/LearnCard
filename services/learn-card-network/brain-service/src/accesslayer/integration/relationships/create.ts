import { Integration } from '@models';

export const associateIntegrationWithProfile = async (
    integrationId: string,
    profileId: string
): Promise<boolean> => {
    await Integration.relateTo({
        alias: 'createdBy',
        where: {
            source: { id: integrationId },
            target: { profileId },
        },
    });

    return true;
};

export const associateIntegrationWithSigningAuthority = async (
    integrationId: string,
    signingAuthorityEndpoint: string,
    props: { name: string; did: string; isPrimary?: boolean }
): Promise<boolean> => {
    await Integration.relateTo({
        alias: 'usesSigningAuthority',
        where: {
            source: { id: integrationId },
            target: { endpoint: signingAuthorityEndpoint },
        },
        properties: props,
    });

    return true;
};
