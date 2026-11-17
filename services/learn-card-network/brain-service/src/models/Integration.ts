import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import type { AppManifestVersion, AppManifestVersionInstance } from './AppManifestVersion';
import { FlatIntegrationType } from 'types/integration';

export type IntegrationRelationships = {
    createdBy: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    publishesListing: ModelRelatedNodesI<any, any>;
    hasManifestVersion: ModelRelatedNodesI<typeof AppManifestVersion, AppManifestVersionInstance>;
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

            // Setup/onboarding status
            status: { type: 'string', required: false },
            guideType: { type: 'string', required: false },
            guideState: { type: 'string', required: false }, // JSON stringified

            // Contract event webhook and change feed (LC-2370).
            // webhookSecretEnc and webhookSecretPrevEnc are encrypted and never returned by a route.
            webhookUrl: { type: 'string', required: false },
            webhookSecretEnc: { type: 'string', required: false },
            webhookSecretPrevEnc: { type: 'string', required: false },
            webhookSecretPrevExpiresAt: { type: 'string', required: false },
            webhookSecretVersion: { type: 'number', required: false },
            // Delivery health, only exposed through getIntegrationWebhook.
            webhookLastSuccessAt: { type: 'string', required: false },
            webhookLastFailureAt: { type: 'string', required: false },
            webhookLastFailureReason: { type: 'string', required: false },
            // 'success' or 'failure': which outcome was the most recent one.
            webhookLastOutcome: { type: 'string', required: false },
            contractEventsEnabledAt: { type: 'string', required: false },
            eventSeq: { type: 'number', required: false },
            eventPurgedThroughSeq: { type: 'number', required: false },
            eventSeqLock: { type: 'number', required: false },

            // Timestamps
            createdAt: { type: 'string', required: false },
            updatedAt: { type: 'string', required: false },
        } as any,
        relationships: {
            createdBy: { model: Profile, direction: 'out', name: 'CREATED_BY' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default Integration;
