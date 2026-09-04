import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { Profile, ProfileInstance } from './Profile';
import { Credential, CredentialInstance } from './Credential';
import { CredentialRefreshRecord } from 'types/credential-refresh';

export type CredentialRefreshRelationships = {
    issuer: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    holder: ModelRelatedNodesI<typeof Profile, ProfileInstance>;
    root: ModelRelatedNodesI<typeof Credential, CredentialInstance>;
    head: ModelRelatedNodesI<typeof Credential, CredentialInstance>;
};

export type CredentialRefreshInstance = NeogmaInstance<
    CredentialRefreshRecord,
    CredentialRefreshRelationships
>;

/**
 * Managed credential refresh aggregate (LC-2135). Metadata only — every credential
 * version payload lives on an immutable Credential node as holder-encrypted JWE JSON.
 *
 * Relationships (registered in ./index.ts):
 *   (Profile)-[:ISSUED_REFRESH]->(CredentialRefresh)
 *   (Profile)-[:HELD_REFRESH]->(CredentialRefresh)
 *   (CredentialRefresh)-[:ROOT]->(Credential v1)
 *   (CredentialRefresh)-[:HEAD]->(Credential vN)
 *   (Credential vN)-[:REFRESHED_TO]->(Credential vN+1)
 */
export const CredentialRefresh = ModelFactory<
    CredentialRefreshRecord,
    CredentialRefreshRelationships
>(
    {
        label: 'CredentialRefresh',
        schema: {
            refreshId: { type: 'string', required: true },
            issuerProfileId: { type: 'string', required: true },
            issuerDid: { type: 'string', required: true },
            holderProfileId: { type: 'string', required: false },
            holderDid: { type: 'string', required: true },
            credentialId: { type: 'string', required: true },
            state: {
                type: 'string',
                required: true,
                enum: ['awaiting_claim', 'active', 'revoked'],
            },
            currentVersion: { type: 'number', required: true },
            etag: { type: 'string', required: false },
            materialDigest: { type: 'string', required: false },
            rootMaterialDigest: { type: 'string', required: false },
            credentialStatusDigest: { type: 'string', required: false },
            boostId: { type: 'string', required: false },
            signingMode: {
                type: 'string',
                required: false,
                enum: ['issuer-signed', 'signing-authority'],
            },
            idempotencyKey: { type: 'string', required: false },
            updateSummary: { type: 'string', required: false },
            lastPublishedAt: { type: 'string', required: false },
            notificationWindowKey: { type: 'string', required: false },
            lastNotificationId: { type: 'string', required: false },
            lastNotificationAt: { type: 'string', required: false },
            initialNotificationSentAt: { type: 'string', required: false },
            initialNotificationSuppressed: { type: 'boolean', required: false },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
        },
        primaryKeyField: 'refreshId',
    },
    neogma
);

export default CredentialRefresh;
