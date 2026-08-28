import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { RegistrySubscriptionType } from 'types/install-target';

export type RegistrySubscriptionRelationships = Record<string, never>;

export type RegistrySubscriptionInstance = NeogmaInstance<
    RegistrySubscriptionType,
    RegistrySubscriptionRelationships
>;

export const RegistrySubscription = ModelFactory<
    RegistrySubscriptionType,
    RegistrySubscriptionRelationships
>(
    {
        label: 'RegistrySubscription',
        schema: {
            apiVersion: { type: 'string', required: true },
            id: { type: 'string', required: true, uniqueItems: true },
            intentId: { type: 'string', required: true },
            ecosystemId: { type: 'string', required: true },
            targetType: { type: 'string', required: true },
            status: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            listingId: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default RegistrySubscription;
