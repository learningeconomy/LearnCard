import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { ServiceAccount, ServiceAccountInstance } from './ServiceAccount';

import { neogma } from '@instance';

import { IntegrationInstallType } from 'types/install-target';

export type IntegrationInstallRelationships = {
    hasServiceAccount: ModelRelatedNodesI<typeof ServiceAccount, ServiceAccountInstance>;
};

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
        relationships: {
            hasServiceAccount: {
                model: ServiceAccount,
                direction: 'out',
                name: 'HAS_SERVICE_ACCOUNT',
            },
        },
    },
    neogma
);

export default IntegrationInstall;
