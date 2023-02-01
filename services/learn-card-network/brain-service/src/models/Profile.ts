import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { LCNProfile } from '@learncard/types';

import { neogma } from '@instance';

export type ProfileRelationships = {
    connectionRequested: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    connectedWith: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    credentialSent: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        { vc: string },
        { vc: string }
    >;
    pendingCredential: ModelRelatedNodesI<
        { createOne: (typeof Profile)['createOne'] },
        ProfileInstance,
        { vc: string },
        { vc: string }
    >;
};

export type ProfileInstance = NeogmaInstance<LCNProfile, ProfileRelationships>;

export const Profile = ModelFactory<LCNProfile, ProfileRelationships>(
    {
        label: 'Profile',
        schema: {
            handle: { type: 'string', required: true, uniqueItems: true },
            did: { type: 'string', required: true, uniqueItems: true },
            email: { type: 'string', required: false, uniqueItems: true },
            image: { type: 'string', required: false },
        },
        relationships: {
            connectionRequested: { model: 'self', direction: 'out', name: 'CONNECTION_REQUESTED' },
            connectedWith: { model: 'self', direction: 'out', name: 'CONNECTED_WITH' },
            credentialSent: {
                model: 'self',
                direction: 'out',
                name: 'CREDENTIAL_SENT',
                properties: { vc: { property: 'vc', schema: { type: 'string' } } },
            },
            pendingCredential: {
                model: 'self',
                direction: 'out',
                name: 'PENDING_CREDENTIAL',
                properties: { vc: { property: 'vc', schema: { type: 'string' } } },
            },
        },
        primaryKeyField: 'did',
    },
    neogma
);

export default Profile;
