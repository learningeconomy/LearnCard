import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import ContactMethod, { ContactMethodInstance } from './ContactMethod';

export type InboxCredentialType = {
    id: string;
    credential: string; // JSON - signed or unsigned credential
    isSigned: boolean;
    currentStatus: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'DELIVERED';
    isAccepted?: boolean;
    expiresAt: string;
    createdAt: string;
    issuerDid: string;
    webhookUrl?: string;
    'signingAuthority.endpoint'?: string;
    'signingAuthority.name'?: string;
};

export type InboxCredentialRelationships = {
    addressedTo: ModelRelatedNodesI<typeof ContactMethod, ContactMethodInstance, { timestamp: string }, { timestamp: string }>;
    createdBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string },
        { timestamp: string }
    >;
    deliveredBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string; recipientDid: string; deliveryMethod: string },
        { timestamp: string; recipientDid: string; deliveryMethod: string }
    >;
    claimedBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string; claimToken: string },
        { timestamp: string; claimToken: string }
    >;
    expiredBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string },
        { timestamp: string }
    >;
    emailSentBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string; emailAddress: string; token: string },
        { timestamp: string; emailAddress: string; token: string }
    >;
    webhookSentBy: ModelRelatedNodesI<
        typeof Profile,
        ProfileInstance,
        { timestamp: string; url: string; status: string; response?: string },
        { timestamp: string; url: string; status: string; response?: string }
    >;
};

export type InboxCredentialInstance = NeogmaInstance<InboxCredentialType, InboxCredentialRelationships>;

export const InboxCredential = ModelFactory<InboxCredentialType, InboxCredentialRelationships>(
    {
        label: 'InboxCredential',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            credential: { type: 'string', required: true },
            isSigned: { type: 'boolean', required: true },
            currentStatus: { 
                type: 'string', 
                required: true, 
                enum: ['PENDING', 'ISSUED', 'EXPIRED', /* DEPRECATED — use ISSUED */'DELIVERED', /* DEPRECATED — use ISSUED */'CLAIMED'] 
            },
            isAccepted: { type: 'boolean', required: false, default: false },
            expiresAt: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            issuerDid: { type: 'string', required: true },
            webhookUrl: { type: 'string', required: false },
            'signingAuthority.endpoint': { type: 'string', required: false },
            'signingAuthority.name': { type: 'string', required: false },
        },
        relationships: {
            addressedTo: { 
                model: ContactMethod, 
                direction: 'out', 
                name: 'ADDRESSED_TO', 
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                },
            },
            createdBy: {
                model: Profile,
                direction: 'in',
                name: 'CREATED_INBOX_CREDENTIAL',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                },
            },
            deliveredBy: {
                model: Profile,
                direction: 'in',
                name: 'DELIVERED_INBOX_CREDENTIAL',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                    recipientDid: { property: 'recipientDid', schema: { type: 'string', required: true } },
                    deliveryMethod: { property: 'deliveryMethod', schema: { type: 'string', required: true } },
                },
            },
            claimedBy: {
                model: Profile,
                direction: 'in',
                name: 'CLAIMED_INBOX_CREDENTIAL',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                    claimToken: { property: 'claimToken', schema: { type: 'string', required: true } },
                },
            },
            expiredBy: {
                model: Profile,
                direction: 'in',
                name: 'EXPIRED_INBOX_CREDENTIAL',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                },
            },
            emailSentBy: {
                model: Profile,
                direction: 'in',
                name: 'SENT_EMAIL',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                    emailAddress: { property: 'emailAddress', schema: { type: 'string', required: true } },
                    token: { property: 'token', schema: { type: 'string', required: true } },
                },
            },
            webhookSentBy: {
                model: Profile,
                direction: 'in',
                name: 'SENT_WEBHOOK',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                    url: { property: 'url', schema: { type: 'string', required: true } },
                    status: { property: 'status', schema: { type: 'string', required: true } },
                    response: { property: 'response', schema: { type: 'string', required: false } },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default InboxCredential;