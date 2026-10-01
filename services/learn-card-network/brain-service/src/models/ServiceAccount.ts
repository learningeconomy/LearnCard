import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { ServiceAccountStatusEnum, type ServiceAccount as Account } from '@learncard/types';
import { neogma } from '@instance';
import { Ecosystem, EcosystemInstance } from './Ecosystem';
import { ServiceAccountGrant, ServiceAccountGrantInstance } from './ServiceAccountGrant';

// Neo4j has no partial uniqueness constraints. Only non-revoked accounts hold this key.
export type StoredServiceAccount = Account & { activeInstallId?: string };
export type ServiceAccountRelationships = {
    actsFor: ModelRelatedNodesI<typeof Ecosystem, EcosystemInstance>;
    hasGrant: ModelRelatedNodesI<typeof ServiceAccountGrant, ServiceAccountGrantInstance>;
};
export type ServiceAccountInstance = NeogmaInstance<
    StoredServiceAccount,
    ServiceAccountRelationships
>;

export const ServiceAccount = ModelFactory<StoredServiceAccount, ServiceAccountRelationships>(
    {
        label: 'ServiceAccount',
        schema: {
            id: { type: 'string', required: true },
            installId: { type: 'string', required: true },
            activeInstallId: { type: 'string', required: false },
            ecosystemId: { type: 'string', required: true },
            status: { type: 'string', enum: ServiceAccountStatusEnum.options, required: true },
            credentialGeneration: { type: 'number', required: true },
            createdAt: { type: 'string', required: true },
            revokedAt: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
        relationships: {
            actsFor: { model: Ecosystem, direction: 'out', name: 'ACTS_FOR' },
            hasGrant: { model: ServiceAccountGrant, direction: 'out', name: 'HAS_GRANT' },
        },
    },
    neogma
);
