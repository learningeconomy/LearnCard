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

// Ensure CredentialActivity model is registered by referencing it
void CredentialActivity;

Credential.addRelationships({
    credentialReceived: {
        model: Profile,
        direction: 'out',
        name: 'CREDENTIAL_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
            metadata: { property: 'metadata', schema: { type: 'object', required: false } },
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

const shouldCreateIndices =
    process.env.NODE_ENV === 'production' ||
    (process.env.NEO4J_SKIP_INDICES !== 'true' && process.env.NEO4J_SKIP_INDICES !== '1');

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
    'CREATE CONSTRAINT contact_method_type_value_unique IF NOT EXISTS FOR (c:ContactMethod) REQUIRE (c.type, c.value) IS UNIQUE',
    'CREATE INDEX edlink_issued_credential_submission_idx IF NOT EXISTS FOR (e:EdlinkIssuedCredential) ON (e.submissionId)',
    'CREATE INDEX edlink_issued_credential_status_idx IF NOT EXISTS FOR (e:EdlinkIssuedCredential) ON (e.status)',
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

            if (process.env.NODE_ENV !== 'test') console.log('Ensured indices!');
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
export * from './CredentialActivity';
export * from './EdlinkConnection';
export * from './EdlinkIssuedCredential';
