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
