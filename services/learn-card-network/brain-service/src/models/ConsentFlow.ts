import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { ConsentFlowType } from 'types/consentflow';

export type ConsentFlowRelationships = {};

export type ConsentFlowInstance = NeogmaInstance<
    ConsentFlowType,
    ConsentFlowRelationships
>;

export const ConsentFlow = ModelFactory<ConsentFlowType, ConsentFlowRelationships>(
    {
        label: 'ConsentFlow',
        schema: {
            endpoint: { type: 'string', required: true },
        },
        primaryKeyField: 'endpoint',
    },
    neogma
);

export default ConsentFlow;