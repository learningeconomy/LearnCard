import { QueryBuilder, BindParam } from 'neogma';
import { ProfileManager } from '@models';
import type { ProfileManagerType } from 'types/profile-manager';

export const updateProfileManager = async (
    manager: ProfileManagerType,
    updates: Partial<ProfileManagerType>
) => {
    const query = new QueryBuilder(new BindParam({ params: updates }))
        .match({ model: ProfileManager, where: { id: manager.id }, identifier: 'manager' })
        .set('manager += $params');

    const result = await query.run();

    return result.summary.updateStatistics.containsUpdates();
};
