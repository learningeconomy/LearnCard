import { neogma } from '@instance';

import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';
import { ConsentFlowTransaction } from './ConsentFlowTransaction';

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

// Use an IIFE to create indices without top-level await
(function createIndices() {
    Promise.all([
        // Profile indexes
        neogma.queryRunner.run(
            'CREATE INDEX profileId_idx IF NOT EXISTS FOR (p:Profile) ON (p.profileId)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX profile_did_idx IF NOT EXISTS FOR (p:Profile) ON (p.did)'
        ),
        neogma.queryRunner.run(
            'CREATE TEXT INDEX profileId_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.profileId)'
        ),
        neogma.queryRunner.run(
            'CREATE TEXT INDEX profile_displayname_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.displayName)'
        ),

        // Boost indexes
        neogma.queryRunner.run('CREATE INDEX boost_id_idx IF NOT EXISTS FOR (b:Boost) ON (b.id)'),
        neogma.queryRunner.run(
            'CREATE INDEX boost_category_idx IF NOT EXISTS FOR (b:Boost) ON (b.category)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX boost_autoconnect_idx IF NOT EXISTS FOR (b:Boost) ON (b.autoConnectRecipients)'
        ),

        // Credential indexes
        neogma.queryRunner.run(
            'CREATE INDEX credential_id_idx IF NOT EXISTS FOR (c:Credential) ON (c.id)'
        ),

        // ProfileManager indexes
        neogma.queryRunner.run(
            'CREATE INDEX profilemanager_id_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.id)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX profile_manager_created_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.created)'
        ),

        // Role indexes
        neogma.queryRunner.run('CREATE INDEX role_id_idx IF NOT EXISTS FOR (r:Role) ON (r.id)'),

        // InboxCredential indexes
        neogma.queryRunner.run(
            'CREATE INDEX inbox_credential_status_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.currentStatus)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX inbox_credential_expires_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.expiresAt)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX inbox_credential_created_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.createdAt)'
        ),

        // AuthGrant indexes
        neogma.queryRunner.run(
            'CREATE INDEX auth_grant_created_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.createdAt)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX auth_grant_challenge_idx IF NOT EXISTS FOR (a:AuthGrant) ON (a.challenge)'
        ),

        // ConsentFlowContract indexes
        neogma.queryRunner.run(
            'CREATE INDEX contract_updated_idx IF NOT EXISTS FOR (c:ConsentFlowContract) ON (c.updatedAt)'
        ),

        // ConsentFlowTerms indexes
        neogma.queryRunner.run(
            'CREATE INDEX terms_updated_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.updatedAt)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX terms_status_idx IF NOT EXISTS FOR (t:ConsentFlowTerms) ON (t.status)'
        ),

        // ClaimHook indexes
        neogma.queryRunner.run(
            'CREATE INDEX claim_hook_updated_idx IF NOT EXISTS FOR (c:ClaimHook) ON (c.updatedAt)'
        ),

        // Integration indexes
        neogma.queryRunner.run(
            'CREATE INDEX integration_id_idx IF NOT EXISTS FOR (i:Integration) ON (i.id)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX integration_publishablekey_idx IF NOT EXISTS FOR (i:Integration) ON (i.publishableKey)'
        ),

        // Relationship property indexes
        neogma.queryRunner.run(
            'CREATE INDEX has_role_id_idx IF NOT EXISTS FOR ()-[r:HAS_ROLE]-() ON (r.roleId)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX credential_sent_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.date)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX credential_sent_to_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_SENT]-() ON (r.to)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX credential_received_date_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.date)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX credential_received_from_idx IF NOT EXISTS FOR ()-[r:CREDENTIAL_RECEIVED]-() ON (r.from)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX boost_created_by_date_idx IF NOT EXISTS FOR ()-[r:CREATED_BY]-() ON (r.date)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX presentation_sent_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_SENT]-() ON (r.date)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX presentation_received_date_idx IF NOT EXISTS FOR ()-[r:PRESENTATION_RECEIVED]-() ON (r.date)'
        ),

        // Constraints
        neogma.queryRunner.run(
            'CREATE CONSTRAINT contact_method_type_value_unique IF NOT EXISTS FOR (c:ContactMethod) REQUIRE (c.type, c.value) IS UNIQUE'
        ),
    ])
        .then(() => {
            if (process.env.NODE_ENV !== 'test') console.log('Ensured indices!');
        })
        .catch(err => {
            console.error('Error creating indices:', err);
        });
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
export * from './Integration';
