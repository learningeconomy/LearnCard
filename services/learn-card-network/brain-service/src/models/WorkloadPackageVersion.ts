import { ModelFactory } from 'neogma';
import { neogma } from '@instance';
import type { WorkloadPackageVersionRecord } from 'types/workload-package';

export const WorkloadPackageVersion = ModelFactory<
    WorkloadPackageVersionRecord,
    Record<string, never>
>(
    {
        label: 'WorkloadPackageVersion',
        primaryKeyField: 'versionId',
        schema: {
            versionId: { type: 'string', required: true },
            packageId: { type: 'string', required: true },
            version: { type: 'string', required: true },
            manifestHash: { type: 'string', required: true },
            manifestJson: { type: 'string', required: true },
            status: { type: 'string', required: true, enum: ['PUBLISHED', 'REVOKED'] },
            reviewSnapshot: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
        },
    },
    neogma
);
