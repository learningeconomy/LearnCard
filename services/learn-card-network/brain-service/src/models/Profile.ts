import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Credential, CredentialInstance } from './Credential';
import { Presentation, PresentationInstance } from './Presentation';
import { SigningAuthority } from './SigningAuthority';
import { transformProfileId } from '@helpers/profile.helpers';
import { ProfileType } from 'types/profile';
import { SigningAuthorityInstance } from './SigningAuthority';
import { Boost, BoostInstance } from './Boost';
import ConsentFlowContract, { ConsentFlowInstance } from './ConsentFlowContract';

export type ProfileRelationships = {
    connectionRequested: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    connectedWith: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    blocked: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    adminOf: ModelRelatedNodesI<typeof Boost, BoostInstance>;
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
    usesSigningAuthority: ModelRelatedNodesI<
        typeof SigningAuthority,
        SigningAuthorityInstance,
        { name: string; did: string },
        { name: string; did: string }
    >;
    consentsTo: ModelRelatedNodesI<
        typeof ConsentFlowContract,
        ConsentFlowInstance,
        { createdAt: string; updatedAt: string; terms: string },
        { createdAt: string; updatedAt: string; terms: string }
    >;
};

export type ProfileInstance = NeogmaInstance<ProfileType, ProfileRelationships>;

export const Profile = ModelFactory<ProfileType, ProfileRelationships>(
    {
        label: 'Profile',
        schema: {
            profileId: { type: 'string', required: true, uniqueItems: true },
            displayName: { type: 'string', required: false },
            did: { type: 'string', required: true, uniqueItems: true },
            email: { type: 'string', required: false, uniqueItems: true },
            image: { type: 'string', required: false },
            isServiceProfile: { type: 'boolean', required: false },
            notificationsWebhook: {
                type: 'string',
                required: false,
                format: 'url',
            },
        },
        relationships: {
            connectionRequested: { model: 'self', direction: 'out', name: 'CONNECTION_REQUESTED' },
            connectedWith: { model: 'self', direction: 'out', name: 'CONNECTED_WITH' },
            blocked: { model: 'self', direction: 'out', name: 'BLOCKED' },
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
            usesSigningAuthority: {
                model: SigningAuthority,
                direction: 'out',
                name: 'USES_SIGNING_AUTHORITY',
                properties: {
                    name: { property: 'name', schema: { type: 'string' } },
                    did: { property: 'did', schema: { type: 'string' } },
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
