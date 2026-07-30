import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { WorkloadDeploymentType } from 'types/install-target';

export type WorkloadDeploymentRelationships = Record<string, never>;

export type WorkloadDeploymentInstance = NeogmaInstance<
    WorkloadDeploymentType,
    WorkloadDeploymentRelationships
>;

export const WorkloadDeployment = ModelFactory<
    WorkloadDeploymentType,
    WorkloadDeploymentRelationships
>(
    {
        label: 'WorkloadDeployment',
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

export default WorkloadDeployment;
