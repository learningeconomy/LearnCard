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
    if (updates.rotatePublishableKey) updatesToPersist.publishableKey = 'pk_' + uuid();

    // Setup/onboarding updates
    if (typeof updates.status !== 'undefined') updatesToPersist.status = updates.status;
    if (typeof updates.guideType !== 'undefined') updatesToPersist.guideType = updates.guideType;
    if (typeof updates.guideState !== 'undefined') {
        // Store guideState as JSON string in Neo4j (cast to any to allow string storage)
        (updatesToPersist as any).guideState = JSON.stringify(updates.guideState);
    }

    // Always update updatedAt timestamp when changes are made
    updatesToPersist.updatedAt = new Date().toISOString();

    const params: Partial<FlatIntegrationType> = updatesToPersist;

    // Nothing to update (only updatedAt)
    if (Object.keys(params as Record<string, unknown>).length <= 1) return true;

    const result = await new QueryBuilder(new BindParam({ params }))
        .match({ model: Integration, where: { id: integration.id }, identifier: 'integration' })
        .set('integration += $params')
        .run();

    return result.summary.updateStatistics.containsUpdates();
};
