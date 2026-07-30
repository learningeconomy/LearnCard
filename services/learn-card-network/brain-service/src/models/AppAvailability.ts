import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { AppAvailabilityType } from 'types/install-target';

export type AppAvailabilityRelationships = Record<string, never>;

export type AppAvailabilityInstance = NeogmaInstance<
    AppAvailabilityType,
    AppAvailabilityRelationships
>;

export const AppAvailability = ModelFactory<AppAvailabilityType, AppAvailabilityRelationships>(
    {
        label: 'AppAvailability',
        schema: {
            apiVersion: { type: 'string', required: true },
            id: { type: 'string', required: true, uniqueItems: true },
            intentId: { type: 'string', required: true },
            ecosystemId: { type: 'string', required: true },
            targetType: { type: 'string', required: true },
            status: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default AppAvailability;
