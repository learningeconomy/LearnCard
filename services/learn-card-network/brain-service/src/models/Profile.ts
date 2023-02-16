import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';
import { LCNProfile } from '@learncard/types';

import { neogma } from '@instance';

import { Credential, CredentialInstance } from './Credential';
import { Presentation, PresentationInstance } from './Presentation';
import { transformProfileId } from '@helpers/profile.helpers';

export type ProfileRelationships = {
    connectionRequested: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    connectedWith: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    credentialSent: ModelRelatedNodesI<
        typeof Credential,
        CredentialInstance,
        { to: string; date: string },
        { to: string; date: string }
    >;
    presentationSent: ModelRelatedNodesI<
        typeof Presentation,
        PresentationInstance,
        { to: string; date: string },
        { to: string; date: string }
    >;
};

export type ProfileInstance = NeogmaInstance<LCNProfile, ProfileRelationships>;

export const Profile = ModelFactory<LCNProfile, ProfileRelationships>(
    {
        label: 'Profile',
        schema: {
            profileId: { type: 'string', required: true, uniqueItems: true },
            displayName: { type: 'string', required: false },
            did: { type: 'string', required: true, uniqueItems: true },
            email: { type: 'string', required: false, uniqueItems: true },
            image: { type: 'string', required: false },
            isServiceProfile: { type: 'boolean', required: false },
        },
        relationships: {
            connectionRequested: { model: 'self', direction: 'out', name: 'CONNECTION_REQUESTED' },
            connectedWith: { model: 'self', direction: 'out', name: 'CONNECTED_WITH' },
            credentialSent: {
                model: Credential,
                direction: 'out',
                name: 'CREDENTIAL_SENT',
                properties: {
                    to: { property: 'to', schema: { type: 'string' } },
                    date: { property: 'date', schema: { type: 'string' } },
                },
            },
            presentationSent: {
                model: Presentation,
                direction: 'out',
                name: 'PRESENTATION_SENT',
                properties: {
                    to: { property: 'to', schema: { type: 'string' } },
                    date: { property: 'date', schema: { type: 'string' } },
                },
            },
        },
        primaryKeyField: 'did',
    },
    neogma
);

Profile.beforeCreate = profile => {
    profile.profileId = transformProfileId(profile.profileId);
};

export default Profile;
