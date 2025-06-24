import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';

export type EmailAddressType = {
    id: string;
    email: string;
    isVerified: boolean;
    isPrimary: boolean;
    verifiedAt?: string;
    createdAt: string;
};

export type EmailAddressRelationships = {
    ownedBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type EmailAddressInstance = NeogmaInstance<EmailAddressType, EmailAddressRelationships>;

export const EmailAddress: any = ModelFactory<EmailAddressType, EmailAddressRelationships>(
    {
        label: 'EmailAddress',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            email: { type: 'string', required: true, uniqueItems: true },
            isVerified: { type: 'boolean', required: true },
            isPrimary: { type: 'boolean', required: true },
            verifiedAt: { type: 'string', required: false },
            createdAt: { type: 'string', required: true },
        },
        relationships: {
            ownedBy: { model: Profile, direction: 'out', name: 'OWNED_BY' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default EmailAddress;