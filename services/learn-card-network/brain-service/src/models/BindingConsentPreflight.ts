import { ModelFactory, type ModelRelatedNodesI } from 'neogma';
import { neogma } from '@instance';
import { Binding, type BindingInstance } from './Binding';

type FlatPreflight = {
    preflightId: string;
    bindingId: string;
    ecosystemId: string;
    evaluatedAt: string;
    hash: string;
    snapshot: string;
};

/** Written only by accesslayer/binding/consent-preflight.ts; no update API. */
export const BindingConsentPreflight = ModelFactory<
    FlatPreflight,
    {
        forBinding: ModelRelatedNodesI<typeof Binding, BindingInstance>;
    }
>(
    {
        label: 'BindingConsentPreflight',
        primaryKeyField: 'preflightId',
        schema: {
            preflightId: { type: 'string', required: true },
            bindingId: { type: 'string', required: true },
            ecosystemId: { type: 'string', required: true },
            evaluatedAt: { type: 'string', required: true },
            hash: { type: 'string', required: true },
            snapshot: { type: 'string', required: true },
        },
        relationships: {
            forBinding: { model: Binding, direction: 'in', name: 'HAS_CONSENT_PREFLIGHT' },
        },
    },
    neogma
);
