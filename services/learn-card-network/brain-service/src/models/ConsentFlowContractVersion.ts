import { ModelFactory, NeogmaInstance } from 'neogma';
import { neogma } from '@instance';
import type { DbContractVersionType } from 'types/consentflowcontract';

type StoredVersionProperties = Omit<
    DbContractVersionType,
    'contract' | 'autoboosts' | 'writers'
> & {
    contract: string;
    autoboosts?: string;
    writers?: string;
};
type ContractVersionRelationships = Record<string, never>;
export type ConsentFlowContractVersionInstance = NeogmaInstance<
    StoredVersionProperties,
    ContractVersionRelationships
>;

export const ConsentFlowContractVersion = ModelFactory<
    StoredVersionProperties,
    ContractVersionRelationships
>(
    {
        label: 'ConsentFlowContractVersion',
        schema: {
            id: { type: 'string', required: true },
            version: { type: 'number', required: true },
            createdAt: { type: 'string', required: true },
            contract: { type: 'string', required: true },
            name: { type: 'string', required: true },
            subtitle: { type: 'string', required: false },
            description: { type: 'string', required: false },
            reasonForAccessing: { type: 'string', required: false },
            image: { type: 'string', required: false },
            needsGuardianConsent: { type: 'boolean', required: false },
            redirectUrl: { type: 'string', required: false },
            frontDoorBoostUri: { type: 'string', required: false },
            expiresAt: { type: 'string', required: false },
            autoboosts: { type: 'string', required: false },
            writers: { type: 'string', required: false },
            reason: { type: 'string', required: false },
            kind: { type: 'string', required: false },
        },
        relationships: {},
        primaryKeyField: 'id',
    },
    neogma
);

export default ConsentFlowContractVersion;
