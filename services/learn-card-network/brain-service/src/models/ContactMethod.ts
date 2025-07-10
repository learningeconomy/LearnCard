import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';

export type ContactMethodType = {
    id: string;
    type: 'email' | 'phone'; // Future-proofed for other types
    value: string;
    isVerified: boolean;
    verifiedAt: string;
    isPrimary: boolean;
    createdAt: string;
};

export type ContactMethodRelationships = {
    profile: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type ContactMethodInstance = NeogmaInstance<ContactMethodType, ContactMethodRelationships>;

export const ContactMethod: any = ModelFactory<ContactMethodType, ContactMethodRelationships>(
    {
        label: 'ContactMethod',
        schema: {
            id: { type: 'string', required: true },
            type: { type: 'string', required: true },
            value: { type: 'string', required: true },
            isVerified: { type: 'boolean', required: true },
            verifiedAt: { type: 'string', required: true },
            isPrimary: { type: 'boolean', required: true },
            createdAt: { type: 'string', required: true },
        },
        relationships: {
            profile: { model: Profile, direction: 'in', name: 'HAS_CONTACT_METHOD' },
        },
    },
    neogma
);

export default ContactMethod;