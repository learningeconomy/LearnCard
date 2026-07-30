import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { WalletEnablementType } from 'types/install-target';

export type WalletEnablementRelationships = Record<string, never>;

export type WalletEnablementInstance = NeogmaInstance<
    WalletEnablementType,
    WalletEnablementRelationships
>;

export const WalletEnablement = ModelFactory<WalletEnablementType, WalletEnablementRelationships>(
    {
        label: 'WalletEnablement',
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

export default WalletEnablement;
