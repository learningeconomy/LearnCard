import { QueryBuilder, BindParam } from 'neogma';
import { flattenObject } from '@helpers/objects.helpers';
import { AuthGrant } from '@models';
import type { AuthGrantType } from '@learncard/types';

export const updateAuthGrant = async (
    authGrant: AuthGrantType,
    updates: Partial<AuthGrantType>
) => {
    const newUpdates = flattenObject<Partial<AuthGrantType>>({
        ...updates,
    });

    const query = new QueryBuilder(new BindParam({ params: newUpdates }))
        .match({ model: AuthGrant, where: { id: authGrant.id }, identifier: 'authGrant' })
        .set('authGrant += $params');

    const result = await query.run();

    return result.summary.updateStatistics.containsUpdates();
};
