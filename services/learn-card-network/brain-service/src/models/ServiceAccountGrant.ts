import { ModelFactory, NeogmaInstance } from 'neogma';
import type { ServiceAccountGrant as Grant } from '@learncard/types';
import { neogma } from '@instance';

export type ServiceAccountGrantInstance = NeogmaInstance<Grant, Record<string, never>>;

export const ServiceAccountGrant = ModelFactory<Grant, Record<string, never>>(
    {
        label: 'ServiceAccountGrant',
        schema: {
            id: { type: 'string', required: true },
            serviceAccountId: { type: 'string', required: true },
            installId: { type: 'string', required: true },
            resource: { type: 'string', required: true },
            action: { type: 'string', required: true },
            selectorKind: { type: 'string', enum: ['tree', 'id'], required: true },
            selectorValue: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
    },
    neogma
);
