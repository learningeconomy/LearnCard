import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { SigningAuthority, SigningAuthorityInstance } from './SigningAuthority';
import { FlatIntegrationType } from 'types/integration';

export type IntegrationRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    usesSigningAuthority: ModelRelatedNodesI<
        typeof SigningAuthority,
        SigningAuthorityInstance,
        { name: string; did: string; isPrimary?: boolean },
        { name: string; did: string; isPrimary?: boolean }
    >;
};

export type IntegrationInstance = NeogmaInstance<FlatIntegrationType, IntegrationRelationships>;

export const Integration = ModelFactory<FlatIntegrationType, IntegrationRelationships>(
    {
        label: 'Integration',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            publishableKey: { type: 'string', required: true },
            whitelistedDomains: { type: 'string[]', required: false },
        } as any,
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
            usesSigningAuthority: {
                model: SigningAuthority,
                direction: 'out',
                name: 'USES_SIGNING_AUTHORITY',
                properties: {
                    name: { property: 'name', schema: { type: 'string', required: true } },
                    did: { property: 'did', schema: { type: 'string', required: true } },
                    isPrimary: { property: 'isPrimary', schema: { type: 'boolean', required: false } },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Integration;
