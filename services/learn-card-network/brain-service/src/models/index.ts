import { environment } from '@environment';
import { neogma } from '@instance';
import { contractEventMaintenanceSchema } from '@helpers/contract-event-maintenance.helpers';
import {
    LEGACY_GOOGLE_SKILL_EMBEDDING_VECTOR_INDEX_QUERY,
    buildSkillEmbeddingVectorIndexQuery,
    resolveSkillEmbeddingGeneration,
} from '../config/skillEmbedding';

import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';
import { ConsentFlowTransaction } from './ConsentFlowTransaction';
import { SkillFramework } from './SkillFramework';
import { Skill } from './Skill';
import { Tag } from './Tag';
import { AppStoreListing } from './AppStoreListing';
import { Integration } from './Integration';
import { AppManifestVersion } from './AppManifestVersion';
import { CredentialActivity } from './CredentialActivity';
import { CredentialRefresh } from './CredentialRefresh';
import { StatusList } from './StatusList';
import { ContactMethod } from './ContactMethod';
import { Campaign } from './Campaign';
import { ensureCredentialRefreshConstraints } from './credential-refresh-constraints';

// Ensure CredentialActivity model is registered by referencing it
void CredentialActivity;

CredentialRefresh.addRelationships({
    issuer: { model: Profile, direction: 'in', name: 'ISSUED_REFRESH' },
    holder: { model: Profile, direction: 'in', name: 'HELD_REFRESH' },
    root: { model: Credential, direction: 'out', name: 'ROOT' },
    head: { model: Credential, direction: 'out', name: 'HEAD' },
});

// (Credential)-[:REFRESHED_TO]->(Credential) version-chain edges are created by the
// credential-refresh access layer via raw Cypher so version nodes can carry refresh
// metadata that is intentionally not part of the shared Credential schema.

Credential.addRelationships({
    credentialReceived: {
        model: Profile,
        direction: 'out',
        name: 'CREDENTIAL_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
            metadata: { property: 'metadata', schema: { type: 'object', required: false } },
            status: { property: 'status', schema: { type: 'string', required: false } },
            revokedAt: { property: 'revokedAt', schema: { type: 'string', required: false } },
            suspendedAt: { property: 'suspendedAt', schema: { type: 'string', required: false } },
            unsuspendedAt: {
                property: 'unsuspendedAt',
                schema: { type: 'string', required: false },
            },
        },
    },
    instanceOf: {
        model: Boost,
        direction: 'out',
        name: 'INSTANCE_OF',
    },
    issuedViaTransaction: {
        model: ConsentFlowTransaction,
        direction: 'out',
        name: 'ISSUED_VIA_TRANSACTION',
    },
});

Presentation.addRelationships({
    presentationReceived: {
        model: Profile,
        direction: 'out',
        name: 'PRESENTATION_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
            metadata: { property: 'metadata', schema: { type: 'object', required: false } },
        },
    },
});

// Skills Graph relationships
SkillFramework.addRelationships({
    managedBy: { model: Profile, direction: 'in', name: 'MANAGES' },
    contains: { model: Skill, direction: 'out', name: 'CONTAINS' },
});

Skill.addRelationships({
    childOf: { model: Skill, direction: 'out', name: 'IS_CHILD_OF' },
    hasTag: { model: Tag, direction: 'out', name: 'HAS_TAG' },
});

// App Store relationships
Integration.addRelationships({
    publishesListing: {
        model: AppStoreListing,
        direction: 'out',
        name: 'PUBLISHES_LISTING',
    },
    hasManifestVersion: {
        model: AppManifestVersion,
        direction: 'out',
        name: 'HAS_MANIFEST_VERSION',
    },
});

AppStoreListing.addRelationships({
    usesManifestVersion: {
        model: AppManifestVersion,
        direction: 'out',
        name: 'USES_MANIFEST_VERSION',
    },
});

Profile.addRelationships({
    installs: {
        model: AppStoreListing,
        direction: 'out',
        name: 'INSTALLS',
        properties: {
            listing_id: {
                property: 'listing_id',
                schema: { type: 'string', required: true },
            },
            installed_at: {
                property: 'installed_at',
                schema: { type: 'string', required: true },
            },
        },
    },
});

Profile.addRelationships({
    ownsStatusList: {
        model: StatusList,
        direction: 'out',
        name: 'OWNS_STATUS_LIST',
    },
});

ContactMethod.addRelationships({
    profile: { model: Profile, direction: 'in', name: 'HAS_CONTACT_METHOD' },
});

Campaign.addRelationships({
    audience: { model: Profile, direction: 'in', name: 'IN_CAMPAIGN_AUDIENCE' },
    state: { model: Profile, direction: 'in', name: 'CAMPAIGN_STATE' },
});

const shouldCreateIndices =
    environment.NODE_ENV === 'production' || !environment.NEO4J_SKIP_INDICES;

const indexQueries = [
    'CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS FOR (c:Campaign) REQUIRE c.id IS UNIQUE',
    'CREATE INDEX campaign_status_idx IF NOT EXISTS FOR (c:Campaign) ON (c.status)',
    'CREATE CONSTRAINT consent_event_id IF NOT EXISTS FOR (e:ConsentFlowEvent) REQUIRE e.id IS UNIQUE',
    'CREATE CONSTRAINT consent_delivery_id IF NOT EXISTS FOR (d:ConsentFlowEventDelivery) REQUIRE d.id IS UNIQUE',
    ...contractEventMaintenanceSchema,
    'CREATE INDEX profileId_idx IF NOT EXISTS FOR (p:Profile) ON (p.profileId)',
    'CREATE CONSTRAINT credential_share_preview_id_unique IF NOT EXISTS FOR (p:CredentialSharePreview) REQUIRE p.id IS UNIQUE',
    'CREATE INDEX profile_did_idx IF NOT EXISTS FOR (p:Profile) ON (p.did)',
    'CREATE TEXT INDEX profileId_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.profileId)',
    'CREATE TEXT INDEX profile_displayname_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.displayName)',
    // Backs case-insensitive profile search (see accesslayer/profile/search-fields.ts)
    'CREATE TEXT INDEX profile_displayname_lower_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.displayNameLower)',
    'CREATE INDEX boost_id_idx IF NOT EXISTS FOR (b:Boost) ON (b.id)',
    'CREATE INDEX boost_category_idx IF NOT EXISTS FOR (b:Boost) ON (b.category)',
    'CREATE INDEX boost_autoconnect_idx IF NOT EXISTS FOR (b:Boost) ON (b.autoConnectRecipients)',
    'CREATE INDEX credential_id_idx IF NOT EXISTS FOR (c:Credential) ON (c.id)',
    'CREATE INDEX profilemanager_id_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.id)',
    'CREATE INDEX profile_manager_created_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.created)',
    'CREATE INDEX role_id_idx IF NOT EXISTS FOR (r:Role) ON (r.id)',
    'CREATE INDEX inbox_delivery_recipient_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.deliveryRecipientDid)',
    'CREATE INDEX inbox_delivery_expires_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.deliveryExpiresAt)',
    'CREATE INDEX inbox_credential_status_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.currentStatus)',
    'CREATE INDEX inbox_credential_expires_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.expiresAt)',
    'CREATE INDEX inbox_credential_created_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.createdAt)',
    'CREATE INDEX auth_grant_created_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.createdAt)',
    'CREATE INDEX auth_grant_challenge_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.challenge)',
    'CREATE INDEX contract_updated_idx IF NOT EXISTS FOR (c:ConsentFlowContract) ON (c.updatedAt)',
    'CREATE INDEX terms_updated_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.updatedAt)',
    'CREATE INDEX terms_status_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.status)',
    'CREATE INDEX consent_autoboost_claim_identity_idx IF NOT EXISTS FOR (c:ConsentFlowAutoBoostClaim) ON (c.termsId, c.boostId)',
    'CREATE INDEX claim_hook_updated_idx IF NOT EXISTS FOR (c:ClaimHook) ON (c.updatedAt)',
    'CREATE INDEX integration_id_idx IF NOT EXISTS FOR (i:Integration) ON (i.id)',
    'CREATE INDEX integration_publishablekey_idx IF NOT EXISTS FOR (i:Integration) ON (i.publishableKey)',
    'CREATE INDEX app_manifest_version_id_idx IF NOT EXISTS FOR (m:AppManifestVersion) ON (m.id)',
    'CREATE INDEX app_manifest_version_version_idx IF NOT EXISTS FOR (m:AppManifestVersion) ON (m.version)',
    'CREATE INDEX app_manifest_version_hash_idx IF NOT EXISTS FOR (m:AppManifestVersion) ON (m.manifestHash)',
    'CREATE INDEX app_manifest_version_status_idx IF NOT EXISTS FOR (m:AppManifestVersion) ON (m.status)',
    'CREATE INDEX skill_framework_id_idx IF NOT EXISTS FOR (f:SkillFramework) ON (f.id)',
    'CREATE TEXT INDEX skill_framework_name_text_idx IF NOT EXISTS FOR (f:SkillFramework) ON (f.name)',
    'CREATE INDEX skill_id_idx IF NOT EXISTS FOR (s:Skill) ON (s.id)',
    'CREATE TEXT INDEX skill_statement_text_idx IF NOT EXISTS FOR (s:Skill) ON (s.statement)',
    // LC-2206: the legacy Google 768-dim index (main's DDL, unchanged) stays because semantic
    // search reads it until SKILL_EMBEDDING_BEDROCK_READ_ENABLED is on, and flipping the flag
    // back off is the rollback. The post-rollback-window cleanup drops it.
    LEGACY_GOOGLE_SKILL_EMBEDDING_VECTOR_INDEX_QUERY,
    // One vector index per Nova embedding generation (1024 dims by default), written regardless
    // of the read flag.
    buildSkillEmbeddingVectorIndexQuery(
        resolveSkillEmbeddingGeneration({
            modelId: environment.SKILL_EMBEDDING_BEDROCK_MODEL_ID,
            dimension: environment.SKILL_EMBEDDING_DIMENSION,
            region: environment.SKILL_EMBEDDING_BEDROCK_REGION,
        })
    ),
    'CREATE CONSTRAINT tag_slug_unique IF NOT EXISTS FOR (t:Tag) REQUIRE (t.slug) IS UNIQUE',
    'CREATE TEXT INDEX tag_name_text_idx IF NOT EXISTS FOR (t:Tag) ON (t.name)',
    'CREATE INDEX has_role_id_idx IF NOT EXISTS FOR ()-[r:HAS_ROLE]-() ON (r.roleId)',
    'CREATE INDEX credential_sent_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.date)',
    'CREATE INDEX credential_sent_to_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.to)',
    'CREATE INDEX credential_received_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.date)',
    'CREATE INDEX credential_received_from_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.from)',
    'CREATE INDEX boost_created_by_date_idx IF NOT EXISTS FOR ()-[r:CREATED_BY]-() ON (r.date)',
    'CREATE INDEX presentation_sent_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_SENT]-() ON (r.date)',
    'CREATE INDEX presentation_received_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_RECEIVED]-() ON (r.date)',
    'CREATE INDEX app_store_listing_id_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.listing_id)',
    'CREATE INDEX app_store_listing_status_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.app_listing_status)',
    'CREATE INDEX app_store_listing_category_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.category)',
    'CREATE INDEX app_store_listing_promotion_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.promotion_level)',
    'CREATE TEXT INDEX app_store_listing_name_text_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.display_name)',
    'CREATE INDEX app_store_listing_slug_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.slug)',
    'CREATE INDEX installs_listing_id_idx IF NOT EXISTS FOR ()-[r:INSTALLS]-() ON (r.listing_id)',
    'CREATE INDEX installs_installed_at_idx IF NOT EXISTS FOR ()-[r:INSTALLS]-() ON (r.installed_at)',
    'CREATE INDEX credential_activity_id_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.id)',
    'CREATE INDEX credential_activity_activityid_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.activityId)',
    'CREATE INDEX credential_activity_timestamp_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.timestamp)',
    'CREATE INDEX credential_activity_actor_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.actorProfileId)',
    'CREATE INDEX credential_activity_eventtype_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.eventType)',
    'CREATE INDEX credential_activity_integration_idx IF NOT EXISTS FOR (a:CredentialActivity) ON (a.integrationId)',
    'CREATE INDEX bitstring_status_list_id_idx IF NOT EXISTS FOR (s:BitstringStatusList) ON (s.id)',
    'CREATE INDEX bitstring_status_list_owner_purpose_idx IF NOT EXISTS FOR (s:BitstringStatusList) ON (s.ownerProfileId, s.statusPurpose)',
    'CREATE INDEX bitstring_status_list_url_idx IF NOT EXISTS FOR (s:BitstringStatusList) ON (s.statusListCredential)',
    'CREATE CONSTRAINT contact_method_type_value_unique IF NOT EXISTS FOR (c:ContactMethod) REQUIRE (c.type, c.value) IS UNIQUE',
    'CREATE INDEX contact_method_primary_idx IF NOT EXISTS FOR (c:ContactMethod) ON (c.isPrimary)',
    'CREATE INDEX credential_refresh_credential_id_idx IF NOT EXISTS FOR (r:CredentialRefresh) ON (r.credentialId)',
    'CREATE INDEX credential_refresh_version_refresh_id_idx IF NOT EXISTS FOR (c:Credential) ON (c.refreshId)',
    // Credential activity reads join each CredentialActivity to its credential through
    // (sender)-[:CREDENTIAL_SENT { activityId }]->(credential). Without this index every
    // activity row scans all CREDENTIAL_SENT relationships.
    'CREATE INDEX credential_sent_activity_id_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.activityId)',
];

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

type RetriableNeo4jError = {
    code?: string;
    retriable?: boolean;
};

const runIndexQuery = async (query: string): Promise<void> => {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await neogma.queryRunner.run(query);
            return;
        } catch (error) {
            const neo4jError = error as RetriableNeo4jError;
            const isDeadlock =
                neo4jError.code === 'Neo.TransientError.Transaction.DeadlockDetected';
            const canRetry = (neo4jError.retriable === true || isDeadlock) && attempt < maxAttempts;

            if (!canRetry) throw error;

            await wait(100 * attempt);
        }
    }
};

if (shouldCreateIndices) {
    (async function createIndices() {
        // Constraints first, then indexes, one schema statement at a time. Running the two
        // lists concurrently made every cold start contend with itself for schema locks.
        // The readiness promise is memoized, so refresh routes awaiting it later reuse this run.
        try {
            await ensureCredentialRefreshConstraints();
        } catch (err) {
            console.error('Error creating credential refresh constraints:', err);
        }

        try {
            for (const query of indexQueries) {
                await runIndexQuery(query);
            }

            if (environment.NODE_ENV !== 'test') console.log('Ensured indices!');
        } catch (err) {
            console.error('Error creating indices:', err);
        }
    })();
}

export * from './AuthGrant';
export * from './Role';
export * from './Boost';
export * from './Profile';
export * from './ClaimHook';
export * from './Credential';
export * from './Presentation';
export * from './ProfileManager';
export * from './DidMetadata';
export * from './SigningAuthority';
export * from './ConsentFlowTerms';
export * from './ConsentFlowContract';
export * from './ConsentFlowContractVersion';
export * from './ConsentFlowTransaction';
export * from './ContactMethod';
export * from './InboxCredential';
export * from './SkillFramework';
export * from './Skill';
export * from './Tag';
export * from './Integration';
export * from './AppManifestVersion';
export * from './AppStoreListing';
export * from './CredentialActivity';
export * from './CredentialRefresh';
export * from './CredentialSharePreview';
export * from './ShareLink';
export * from './StatusList';
export * from './Campaign';
