import { AuthGrant } from '@models';

export const deleteAuthGrant = async (authGrantId: string): Promise<void> => {
    await AuthGrant.delete({ detach: true, where: { id: authGrantId } });
};
