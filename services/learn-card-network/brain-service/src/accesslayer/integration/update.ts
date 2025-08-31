import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { Integration } from '@models';
import { FlatIntegrationType, IntegrationType, IntegrationUpdateType } from 'types/integration';

export const updateIntegration = async (
    integration: IntegrationType,
    updates: IntegrationUpdateType
): Promise<boolean> => {
    const updatesToPersist: Partial<FlatIntegrationType> = {};

    if (typeof updates.name !== 'undefined') updatesToPersist.name = updates.name;
    if (typeof updates.description !== 'undefined')
        updatesToPersist.description = updates.description;
    if (typeof updates.whitelistedDomains !== 'undefined')
        updatesToPersist.whitelistedDomains = updates.whitelistedDomains;
    if (updates.rotatePublishableKey) updatesToPersist.publishableKey = uuid();

    const params: Partial<FlatIntegrationType> = updatesToPersist;

    // Nothing to update
    if (Object.keys(params as Record<string, unknown>).length === 0) return true;

    const result = await new QueryBuilder(new BindParam({ params }))
        .match({ model: Integration, where: { id: integration.id }, identifier: 'integration' })
        .set('integration += $params')
        .run();

    return result.summary.updateStatistics.containsUpdates();
};
