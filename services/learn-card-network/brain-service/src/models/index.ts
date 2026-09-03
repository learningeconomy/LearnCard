import { environment } from '@environment';
import { neogma } from '@instance';

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
import { CredentialActivity } from './CredentialActivity';
import { GroupAuditEvent } from './GroupAuditEvent';
import { StatusList } from './StatusList';
import { ContactMethod } from './ContactMethod';
import { Ecosystem } from './Ecosystem';
import { Group } from './Group';
import { Tenant } from './Tenant';
import { InstallIntent } from './InstallIntent';
import { Binding } from './Binding';
import { IntegrationInstall } from './IntegrationInstall';
import { AppAvailability } from './AppAvailability';
import { WalletEnablement } from './WalletEnablement';
import { WorkloadDeployment } from './WorkloadDeployment';
import { RegistrySubscription } from './RegistrySubscription';
import { InstallIntentAuditEvent } from './InstallIntentAuditEvent';
import { ConsentDecisionRecord } from './ConsentDecisionRecord';

void Tenant;

// Ensure CredentialActivity model is registered by referencing it
void CredentialActivity;
void GroupAuditEvent;
void InstallIntent;
void Binding;
void IntegrationInstall;
void AppAvailability;
void WalletEnablement;
void WorkloadDeployment;
void RegistrySubscription;
void InstallIntentAuditEvent;
void ConsentDecisionRecord;

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

Ecosystem.addRelationships({
    owns: { model: Group, direction: 'out', name: 'OWNS' },
    references: {
        model: Group,
        direction: 'out',
        name: 'REFERENCES',
        properties: {
            mode: { property: 'mode', schema: { type: 'string', required: true } },
            grantedAt: { property: 'grantedAt', schema: { type: 'string', required: true } },
            grantedByProfileId: {
                property: 'grantedByProfileId',
                schema: { type: 'string', required: true },
            },
            expiresAt: { property: 'expiresAt', schema: { type: 'string', required: false } },
        },
    },
});

const shouldCreateIndices =
    environment.NODE_ENV === 'production' || !environment.NEO4J_SKIP_INDICES;

const indexQueries = [
    'CREATE INDEX profileId_idx IF NOT EXISTS FOR (p:Profile) ON (p.profileId)',
    'CREATE INDEX profile_did_idx IF NOT EXISTS FOR (p:Profile) ON (p.did)',
    'CREATE TEXT INDEX profileId_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.profileId)',
    'CREATE TEXT INDEX profile_displayname_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.displayName)',
    'CREATE INDEX boost_id_idx IF NOT EXISTS FOR (b:Boost) ON (b.id)',
    'CREATE INDEX boost_category_idx IF NOT EXISTS FOR (b:Boost) ON (b.category)',
    'CREATE INDEX boost_autoconnect_idx IF NOT EXISTS FOR (b:Boost) ON (b.autoConnectRecipients)',
    'CREATE INDEX credential_id_idx IF NOT EXISTS FOR (c:Credential) ON (c.id)',
    'CREATE INDEX profilemanager_id_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.id)',
    'CREATE INDEX profile_manager_created_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.created)',
    'CREATE INDEX role_id_idx IF NOT EXISTS FOR (r:Role) ON (r.id)',
    'CREATE INDEX inbox_credential_status_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.currentStatus)',
    'CREATE INDEX inbox_credential_expires_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.expiresAt)',
    'CREATE INDEX inbox_credential_created_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.createdAt)',
    'CREATE INDEX auth_grant_created_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.createdAt)',
    'CREATE INDEX auth_grant_challenge_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.challenge)',
    'CREATE INDEX contract_updated_idx IF NOT EXISTS FOR (c:ConsentFlowContract) ON (c.updatedAt)',
    'CREATE INDEX terms_updated_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.updatedAt)',
    'CREATE INDEX terms_status_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.status)',
    'CREATE INDEX claim_hook_updated_idx IF NOT EXISTS FOR (c:ClaimHook) ON (c.updatedAt)',
    'CREATE INDEX integration_id_idx IF NOT EXISTS FOR (i:Integration) ON (i.id)',
    'CREATE INDEX integration_publishablekey_idx IF NOT EXISTS FOR (i:Integration) ON (i.publishableKey)',
    'CREATE INDEX skill_framework_id_idx IF NOT EXISTS FOR (f:SkillFramework) ON (f.id)',
    'CREATE TEXT INDEX skill_framework_name_text_idx IF NOT EXISTS FOR (f:SkillFramework) ON (f.name)',
    'CREATE INDEX skill_id_idx IF NOT EXISTS FOR (s:Skill) ON (s.id)',
    'CREATE TEXT INDEX skill_statement_text_idx IF NOT EXISTS FOR (s:Skill) ON (s.statement)',
    "CREATE VECTOR INDEX skill_embedding_vector_idx IF NOT EXISTS FOR (s:Skill) ON (s.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity_function`: 'cosine'}}",
    'CREATE CONSTRAINT tag_slug_unique IF NOT EXISTS FOR (t:Tag) REQUIRE (t.slug) IS UNIQUE',
    'CREATE TEXT INDEX tag_name_text_idx IF NOT EXISTS FOR (t:Tag) ON (t.name)',
    'CREATE INDEX has_role_id_idx IF NOT EXISTS FOR ()-[r:HAS_ROLE]-() ON (r.roleId)',
    'CREATE INDEX member_of_role_idx IF NOT EXISTS FOR ()-[r:MEMBER_OF]-() ON (r.role)',
    'CREATE INDEX credential_sent_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.date)',
    'CREATE INDEX credential_sent_to_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.to)',
    'CREATE INDEX credential_received_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.date)',
    'CREATE INDEX credential_received_from_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.from)',
    'CREATE INDEX boost_created_by_date_idx IF NOT EXISTS FOR ()-[r:CREATED_BY]-() ON (r.date)',
    'CREATE INDEX presentation_sent_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_SENT]-() ON (r.date)',
    'CREATE INDEX presentation_received_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_RECEIVED]-() ON (r.date)',
    'CREATE INDEX app_store_listing_id_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.listing_id)',
    'CREATE INDEX app_store_listing_status_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.app_listing_status)',
    'CREATE INDEX app_store_listing_kind_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.kind)',
    'CREATE INDEX app_store_listing_category_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.category)',
    'CREATE INDEX app_store_listing_promotion_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.promotion_level)',
    'CREATE TEXT INDEX app_store_listing_name_text_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.display_name)',
    'CREATE INDEX app_store_listing_slug_idx IF NOT EXISTS FOR (a:AppStoreListing) ON (a.slug)',
    'CREATE CONSTRAINT listing_version_id_unique IF NOT EXISTS FOR (v:ListingVersion) REQUIRE (v.version_id) IS UNIQUE',
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
    'CREATE CONSTRAINT ecosystem_id_unique IF NOT EXISTS FOR (e:Ecosystem) REQUIRE (e.id) IS UNIQUE',
    'CREATE INDEX ecosystem_root_idx IF NOT EXISTS FOR (e:Ecosystem) ON (e.rootEcosystemId)',
    'CREATE INDEX ecosystem_owner_idx IF NOT EXISTS FOR (e:Ecosystem) ON (e.ownerProfileId)',
    'CREATE CONSTRAINT ecosystem_slug_unique_in_parent IF NOT EXISTS FOR (e:Ecosystem) REQUIRE (e.parentEcosystemId, e.slug) IS UNIQUE',
    'CREATE CONSTRAINT group_id_unique IF NOT EXISTS FOR (g:Group) REQUIRE (g.id) IS UNIQUE',
    'CREATE INDEX group_root_idx IF NOT EXISTS FOR (g:Group) ON (g.rootGroupId)',
    'CREATE INDEX group_owner_idx IF NOT EXISTS FOR (g:Group) ON (g.ownerEcosystemId)',
    'CREATE INDEX group_type_idx IF NOT EXISTS FOR (g:Group) ON (g.type)',
    'CREATE CONSTRAINT group_slug_unique_in_parent IF NOT EXISTS FOR (g:Group) REQUIRE (g.parentGroupId, g.slug) IS UNIQUE',
    'CREATE CONSTRAINT group_audit_event_id_unique IF NOT EXISTS FOR (e:GroupAuditEvent) REQUIRE (e.id) IS UNIQUE',
    'CREATE INDEX group_audit_event_group_idx IF NOT EXISTS FOR (e:GroupAuditEvent) ON (e.groupId)',
    'CREATE INDEX group_audit_event_ecosystem_idx IF NOT EXISTS FOR (e:GroupAuditEvent) ON (e.ecosystemId)',
    'CREATE INDEX group_audit_event_actor_idx IF NOT EXISTS FOR (e:GroupAuditEvent) ON (e.actorProfileId)',
    'CREATE INDEX group_audit_event_timestamp_idx IF NOT EXISTS FOR (e:GroupAuditEvent) ON (e.timestamp)',
    'CREATE CONSTRAINT tenant_id_unique IF NOT EXISTS FOR (t:Tenant) REQUIRE (t.tenantId) IS UNIQUE',
    'CREATE CONSTRAINT install_intent_id_unique IF NOT EXISTS FOR (i:InstallIntent) REQUIRE (i.intentId) IS UNIQUE',
    'CREATE INDEX install_intent_ecosystem_idx IF NOT EXISTS FOR (i:InstallIntent) ON (i.ecosystemId)',
    'CREATE INDEX install_intent_spec_revision_idx IF NOT EXISTS FOR (i:InstallIntent) ON (i.specRevision)',
    'CREATE INDEX install_intent_status_revision_idx IF NOT EXISTS FOR (i:InstallIntent) ON (i.statusRevision)',
    'CREATE INDEX install_intent_policy_revision_idx IF NOT EXISTS FOR (i:InstallIntent) ON (i.policyRevision)',
    'CREATE CONSTRAINT binding_id_unique IF NOT EXISTS FOR (b:Binding) REQUIRE (b.bindingId) IS UNIQUE',
    'CREATE INDEX binding_ecosystem_idx IF NOT EXISTS FOR (b:Binding) ON (b.ecosystemId)',
    'CREATE INDEX binding_capability_idx IF NOT EXISTS FOR (b:Binding) ON (b.capability)',
    'CREATE INDEX binding_revision_idx IF NOT EXISTS FOR (b:Binding) ON (b.revision)',
    'CREATE CONSTRAINT integration_install_id_unique IF NOT EXISTS FOR (n:IntegrationInstall) REQUIRE (n.id) IS UNIQUE',
    'CREATE INDEX integration_install_intent_idx IF NOT EXISTS FOR (n:IntegrationInstall) ON (n.intentId)',
    'CREATE CONSTRAINT app_availability_id_unique IF NOT EXISTS FOR (n:AppAvailability) REQUIRE (n.id) IS UNIQUE',
    'CREATE INDEX app_availability_intent_idx IF NOT EXISTS FOR (n:AppAvailability) ON (n.intentId)',
    'CREATE CONSTRAINT wallet_enablement_id_unique IF NOT EXISTS FOR (n:WalletEnablement) REQUIRE (n.id) IS UNIQUE',
    'CREATE INDEX wallet_enablement_intent_idx IF NOT EXISTS FOR (n:WalletEnablement) ON (n.intentId)',
    'CREATE CONSTRAINT workload_deployment_id_unique IF NOT EXISTS FOR (n:WorkloadDeployment) REQUIRE (n.id) IS UNIQUE',
    'CREATE INDEX workload_deployment_intent_idx IF NOT EXISTS FOR (n:WorkloadDeployment) ON (n.intentId)',
    'CREATE CONSTRAINT registry_subscription_id_unique IF NOT EXISTS FOR (n:RegistrySubscription) REQUIRE (n.id) IS UNIQUE',
    'CREATE INDEX registry_subscription_intent_idx IF NOT EXISTS FOR (n:RegistrySubscription) ON (n.intentId)',
    'CREATE CONSTRAINT install_intent_audit_event_id_unique IF NOT EXISTS FOR (e:InstallIntentAuditEvent) REQUIRE (e.id) IS UNIQUE',
    'CREATE INDEX install_intent_audit_event_intent_idx IF NOT EXISTS FOR (e:InstallIntentAuditEvent) ON (e.intentId)',
    'CREATE INDEX install_intent_audit_event_ecosystem_idx IF NOT EXISTS FOR (e:InstallIntentAuditEvent) ON (e.ecosystemId)',
    'CREATE INDEX install_intent_audit_event_actor_idx IF NOT EXISTS FOR (e:InstallIntentAuditEvent) ON (e.actorProfileId)',
    'CREATE INDEX install_intent_audit_event_timestamp_idx IF NOT EXISTS FOR (e:InstallIntentAuditEvent) ON (e.timestamp)',
    'CREATE CONSTRAINT consent_decision_record_id_unique IF NOT EXISTS FOR (r:ConsentDecisionRecord) REQUIRE (r.id) IS UNIQUE',
    'CREATE INDEX consent_decision_record_binding_idx IF NOT EXISTS FOR (r:ConsentDecisionRecord) ON (r.bindingId)',
    'CREATE INDEX consent_decision_record_resource_idx IF NOT EXISTS FOR (r:ConsentDecisionRecord) ON (r.resourceId)',
    'CREATE INDEX consent_decision_record_ecosystem_idx IF NOT EXISTS FOR (r:ConsentDecisionRecord) ON (r.ecosystemId)',
    'CREATE INDEX consent_decision_record_subject_idx IF NOT EXISTS FOR (r:ConsentDecisionRecord) ON (r.subjectProfileId)',
    'CREATE INDEX consent_decision_record_timestamp_idx IF NOT EXISTS FOR (r:ConsentDecisionRecord) ON (r.occurredAt)',
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

if (shouldCreateIndices)
    (async function createIndices() {
        try {
            for (const query of indexQueries) {
                await runIndexQuery(query);
            }

            if (environment.NODE_ENV !== 'test') console.log('Ensured indices!');
        } catch (err) {
            console.error('Error creating indices:', err);
        }
    })();

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
export * from './ConsentFlowTransaction';
export * from './ContactMethod';
export * from './InboxCredential';
export * from './SkillFramework';
export * from './Skill';
export * from './Tag';
export * from './Integration';
export * from './AppStoreListing';
export * from './ListingVersion';
export * from './CredentialActivity';
export * from './StatusList';
export * from './Ecosystem';
export * from './Group';
export * from './GroupAuditEvent';
export * from './Tenant';
export * from './InstallIntent';
export * from './Binding';
export * from './IntegrationInstall';
export * from './AppAvailability';
export * from './WalletEnablement';
export * from './WorkloadDeployment';
export * from './RegistrySubscription';
export * from './InstallIntentAuditEvent';
export * from './ConsentDecisionRecord';
