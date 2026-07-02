import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Ecosystem, EcosystemInstance } from './Ecosystem';
import { TenantNodeType } from 'types/tenant';

export type TenantRelationships = {
    serves: ModelRelatedNodesI<typeof Ecosystem, EcosystemInstance>;
};

export type TenantInstance = NeogmaInstance<TenantNodeType, TenantRelationships>;

export const Tenant = ModelFactory<TenantNodeType, TenantRelationships>(
    {
        label: 'Tenant',
        schema: {
            tenantId: { type: 'string', required: true, uniqueItems: true },
            rootEcosystemId: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        primaryKeyField: 'tenantId',
        relationships: {
            serves: { model: Ecosystem, direction: 'out', name: 'SERVES' },
        },
    },
    neogma
);

export default Tenant;
