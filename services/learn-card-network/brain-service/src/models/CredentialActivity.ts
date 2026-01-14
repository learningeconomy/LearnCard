import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { Boost, BoostInstance } from './Boost';

export type CredentialActivityEventType = 
    | 'CREATED'
    | 'DELIVERED' 
    | 'CLAIMED'
    | 'EXPIRED'
    | 'FAILED';

export type CredentialActivityRecipientType = 'profile' | 'email' | 'phone';

export type CredentialActivitySourceType = 
    | 'send'
    | 'sendBoost'
    | 'sendCredential'
    | 'contract'
    | 'claim'
    | 'inbox'
    | 'claimLink';

export type CredentialActivityType = {
    id: string;
    activityId: string;
    eventType: CredentialActivityEventType;
    timestamp: string;
    actorProfileId: string;
    recipientType: CredentialActivityRecipientType;
    recipientIdentifier: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    source: CredentialActivitySourceType;
    metadata?: string;
};

export type CredentialActivityRelationships = {
    performedBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    forBoost: ModelRelatedNodesI<typeof Boost, BoostInstance>;
    toRecipient: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
};

export type CredentialActivityInstance = NeogmaInstance<
    CredentialActivityType,
    CredentialActivityRelationships
>;

export const CredentialActivity = ModelFactory<
    CredentialActivityType,
    CredentialActivityRelationships
>(
    {
        label: 'CredentialActivity',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            activityId: { type: 'string', required: true },
            eventType: {
                type: 'string',
                required: true,
                enum: ['CREATED', 'DELIVERED', 'CLAIMED', 'EXPIRED', 'FAILED'],
            },
            timestamp: { type: 'string', required: true },
            actorProfileId: { type: 'string', required: true },
            recipientType: {
                type: 'string',
                required: true,
                enum: ['profile', 'email', 'phone'],
            },
            recipientIdentifier: { type: 'string', required: true },
            boostUri: { type: 'string', required: false },
            credentialUri: { type: 'string', required: false },
            inboxCredentialId: { type: 'string', required: false },
            integrationId: { type: 'string', required: false },
            source: {
                type: 'string',
                required: true,
                enum: ['send', 'sendBoost', 'sendCredential', 'contract', 'claim', 'inbox', 'claimLink', 'acceptCredential'],
            },
            metadata: { type: 'string', required: false },
        },
        relationships: {
            performedBy: {
                model: Profile,
                direction: 'in',
                name: 'PERFORMED',
            },
            forBoost: {
                model: Boost,
                direction: 'out',
                name: 'FOR_BOOST',
            },
            toRecipient: {
                model: Profile,
                direction: 'out',
                name: 'TO_RECIPIENT',
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default CredentialActivity;
