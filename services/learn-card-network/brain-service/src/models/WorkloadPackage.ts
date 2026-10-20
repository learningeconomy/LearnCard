import { ModelFactory, NeogmaInstance } from 'neogma';
import { neogma } from '@instance';
import { WorkloadPackageVersion } from './WorkloadPackageVersion';
import type { WorkloadPackageRecord, WorkloadPackageVersionRecord } from 'types/workload-package';

export const WorkloadPackage = ModelFactory<
    WorkloadPackageRecord,
    {
        versions: { Instance: NeogmaInstance<WorkloadPackageVersionRecord, Record<string, never>> };
    }
>(
    {
        label: 'WorkloadPackage',
        primaryKeyField: 'id',
        schema: {
            id: { type: 'string', required: true },
            publisherDid: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
        },
        relationships: {
            versions: { model: WorkloadPackageVersion, direction: 'out', name: 'HAS_VERSION' },
        },
    },
    neogma
);
