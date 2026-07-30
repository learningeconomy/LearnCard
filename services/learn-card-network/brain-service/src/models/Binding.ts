import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatBindingType } from 'types/binding';

export type BindingRelationships = Record<string, never>;

export type BindingInstance = NeogmaInstance<FlatBindingType, BindingRelationships>;

export const Binding = ModelFactory<FlatBindingType, BindingRelationships>(
    {
        label: 'Binding',
        schema: {
            apiVersion: { type: 'string', required: true },
            bindingId: { type: 'string', required: true, uniqueItems: true },
            ecosystemId: { type: 'string', required: true },
            capability: { type: 'string', required: true },
            provider: { type: 'string', required: true },
            consumer: { type: 'string', required: true },
            status: { type: 'string', required: true },
            approvedBy: { type: 'string', required: false },
            approvedAt: { type: 'string', required: false },
            revisions: { type: 'string', required: true },
            revision: { type: 'number', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        primaryKeyField: 'bindingId',
    },
    neogma
);

export default Binding;
