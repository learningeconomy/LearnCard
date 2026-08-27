import { QueryBuilder, BindParam } from 'neogma';

import { Ecosystem } from '@models';
import { EcosystemSettings } from '@learncard/types';

export const updateEcosystemSettings = async (
    id: string,
    settings: EcosystemSettings
): Promise<boolean> => {
    const params = {
        settings: JSON.stringify(settings),
        updatedAt: new Date().toISOString(),
    };

    const result = await new QueryBuilder(new BindParam({ params }))
        .match({ model: Ecosystem, where: { id }, identifier: 'ecosystem' })
        .set('ecosystem += $params')
        .run();

    return result.summary.updateStatistics.containsUpdates();
};
