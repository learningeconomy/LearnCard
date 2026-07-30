import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatInstallIntentType } from 'types/install-intent';

export type InstallIntentRelationships = Record<string, never>;

export type InstallIntentInstance = NeogmaInstance<
    FlatInstallIntentType,
    InstallIntentRelationships
>;

export const InstallIntent = ModelFactory<FlatInstallIntentType, InstallIntentRelationships>(
    {
        label: 'InstallIntent',
        schema: {
            apiVersion: { type: 'string', required: true },
            intentId: { type: 'string', required: true, uniqueItems: true },
            ecosystemId: { type: 'string', required: true },
            proposal: { type: 'string', required: true },
            approval: { type: 'string', required: true },
            plan: { type: 'string', required: true },
            spec: { type: 'string', required: false },
            status: { type: 'string', required: false },
            specRevision: { type: 'number', required: true },
            statusRevision: { type: 'number', required: true },
            policyRevision: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        primaryKeyField: 'intentId',
    },
    neogma
);

export default InstallIntent;
