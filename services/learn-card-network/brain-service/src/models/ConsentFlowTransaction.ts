import { ModelFactory, type ModelRelatedNodesI, type NeogmaInstance } from 'neogma';
import { ConsentFlowTerms, type ConsentFlowTermsInstance } from './ConsentFlowTerms';
import { neogma } from '@instance';

import type { FlatDbTransactionType } from 'types/consentflowcontract';

export type ConsentFlowTransactionRelationships = {
    isFor: ModelRelatedNodesI<typeof ConsentFlowTerms, ConsentFlowTermsInstance>;
};

export type ConsentFlowTransactionInstance = NeogmaInstance<
    FlatDbTransactionType,
    ConsentFlowTransactionRelationships
>;

export const ConsentFlowTransaction = ModelFactory<
    FlatDbTransactionType,
    ConsentFlowTransactionRelationships
>(
    {
        label: 'ConsentFlowTransaction',
        schema: {
            id: { type: 'string', required: true },
            status: { type: 'string', required: true },
            expiresAt: { type: 'string', required: false },
            oneTime: { type: 'boolean', required: false },
        } as any,
        relationships: { isFor: { model: ConsentFlowTerms, direction: 'out', name: 'IS_FOR' } },
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowTransaction;
