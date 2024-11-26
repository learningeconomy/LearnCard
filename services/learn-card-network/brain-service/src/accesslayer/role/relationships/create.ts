import { BoostPermissions } from '@learncard/types';
import { BoostInstance } from '@models';
import { createRole } from '../create';

export const addClaimPermissionsForBoost = async (
    boost: BoostInstance,
    permissions: BoostPermissions
): Promise<void> => {
    const role = await createRole(permissions);

    await boost.relateTo({ alias: 'claimRole', where: { id: role.id } });
};
