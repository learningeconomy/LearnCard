import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { IntegrationInstallType } from 'types/install-target';

export type IntegrationInstallRelationships = Record<string, never>;

export type IntegrationInstallInstance = NeogmaInstance<
    IntegrationInstallType,
    IntegrationInstallRelationships
>;

export const IntegrationInstall = ModelFactory<
    IntegrationInstallType,
    IntegrationInstallRelationships
>(
    {
        label: 'IntegrationInstall',
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

export default IntegrationInstall;
