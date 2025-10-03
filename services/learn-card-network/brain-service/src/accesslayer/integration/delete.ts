import { Integration } from '@models';

export const deleteIntegration = async (integrationId: string): Promise<void> => {
    await Integration.delete({ detach: true, where: { id: integrationId } });
};
