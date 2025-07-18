import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Credential, CredentialInstance } from './Credential';
import { Presentation, PresentationInstance } from './Presentation';
import { SigningAuthority } from './SigningAuthority';
import { ContactMethod, ContactMethodInstance } from './ContactMethod';
import { transformProfileId } from '@helpers/profile.helpers';
import { FlatProfileType } from 'types/profile';
import { SigningAuthorityInstance } from './SigningAuthority';
import { LearnCardRolesEnum } from 'types/profile';

export type ProfileRelationships = {
    connectionRequested: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    connectedWith: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    blocked: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    managedBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
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
        { name: string; did: string, isPrimary?: boolean },
        { name: string; did: string, isPrimary?: boolean }
    >;
    hasContactMethod: ModelRelatedNodesI<typeof ContactMethod, ContactMethodInstance>; 
};

export type ProfileInstance = NeogmaInstance<FlatProfileType, ProfileRelationships>;

export const Profile: any = ModelFactory<FlatProfileType, ProfileRelationships>(
    {
        label: 'Profile',
        schema: {
            profileId: { type: 'string', required: true, uniqueItems: true },
            displayName: { type: 'string', required: false },
            shortBio: { type: 'string', required: false },
            bio: { type: 'string', required: false },
            did: { type: 'string', required: true, uniqueItems: true },
            isPrivate: { type: 'boolean', required: false },
            email: { type: 'string', required: false, uniqueItems: true },
            image: { type: 'string', required: false },
            heroImage: { type: 'string', required: false },
            websiteLink: { type: 'string', required: false },
            isServiceProfile: { type: 'boolean', required: false },
            type: { type: 'string', required: false },
            notificationsWebhook: { type: 'string', required: false },
            dob: { type: 'string', required: false },
            role: {
                type: 'string',
                required: false,
                enum: Object.values(LearnCardRolesEnum),
            },
        },
        relationships: {
            connectionRequested: { model: 'self', direction: 'out', name: 'CONNECTION_REQUESTED' },
            connectedWith: { model: 'self', direction: 'out', name: 'CONNECTED_WITH' },
            blocked: { model: 'self', direction: 'out', name: 'BLOCKED' },
            managedBy: { model: 'self', direction: 'out', name: 'MANAGED_BY' },
            credentialSent: {
                model: Credential,
                direction: 'out',
                name: 'CREDENTIAL_SENT',
                properties: {
                    to: { property: 'to', schema: { type: 'string', required: true } },
                    date: { property: 'date', schema: { type: 'string', required: true } },
                },
            },
            presentationSent: {
                model: Presentation,
                direction: 'out',
                name: 'PRESENTATION_SENT',
                properties: {
                    to: { property: 'to', schema: { type: 'string', required: true } },
                    date: { property: 'date', schema: { type: 'string', required: true } },
                },
            },
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
            hasContactMethod: { model: ContactMethod, direction: 'out', name: 'HAS_CONTACT_METHOD' },
        },
        primaryKeyField: 'did',
    },
    neogma
);

Profile.beforeCreate = (profile: any) => {
    profile.profileId = transformProfileId(profile.profileId);
};

export default Profile;
