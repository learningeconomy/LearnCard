import { QueryBuilder, BindParam } from 'neogma';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { Boost, BoostInstance } from '@models';
import { BoostType } from 'types/boost';

export const updateBoost = async (boost: BoostInstance, updates: Partial<BoostType>) => {
    const currentMeta = inflateObject<BoostType>(boost.getDataValues() as any).meta;
    const newMeta = { ...(currentMeta || {}), ...(updates.meta || {}) };

    const newUpdates = flattenObject<Partial<BoostType>>({
        ...updates,
        ...(currentMeta && { meta: newMeta }),
    });

    const result = await new QueryBuilder(new BindParam({ params: newUpdates }))
        .match({ model: Boost, where: { id: boost.id }, identifier: 'boost' })
        .set('boost += $params')
        .run();

    return result.summary.updateStatistics.containsUpdates();
};
