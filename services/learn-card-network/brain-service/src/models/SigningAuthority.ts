import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { SigningAuthorityType } from 'types/profile';

export type SigningAuthorityRelationships = {};

export type SigningAuthorityInstance = NeogmaInstance<SigningAuthorityType, SigningAuthorityRelationships>;

export const SigningAuthority = ModelFactory<SigningAuthorityType, SigningAuthorityRelationships>(
    {
        label: 'SigningAuthority',
        schema: {
            endpoint: { type: 'string', required: true, uniqueItems: true}
        },
        primaryKeyField: 'endpoint',
    },
    neogma
);

export default SigningAuthority;
