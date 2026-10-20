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
            listingId: { type: 'string', required: false },
            desiredRevision: { type: 'number', required: false },
            observedRevision: { type: 'number', required: false },
            lastAppliedRevision: { type: 'number', required: false },
            packageVersionId: { type: 'string', required: false },
            packageId: { type: 'string', required: false },
            manifestHash: { type: 'string', required: false },
            profiles: { type: 'array', items: { type: 'string' }, required: false },
            declarationId: { type: 'string', required: false },
            driver: { type: 'string', required: false },
            componentHealth: { type: 'string', required: false },
            endpointsObserved: { type: 'string', required: false },
            failureCode: { type: 'string', required: false },
            failureMessage: { type: 'string', required: false },
            operationRef: { type: 'string', required: false },
            checkedAt: { type: 'string', required: false },
            retainedObligations: { type: 'array', items: { type: 'string' }, required: false },
            unhealthyObservations: { type: 'number', required: false },
            approvedSpec: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default WorkloadDeployment;
