import { neogma } from '@instance';

import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';
import { ConsentFlowTransaction } from './ConsentFlowTransaction';
import './EmailAddress';
import './InboxCredential';

Credential.addRelationships({
    credentialReceived: {
        model: Profile,
        direction: 'out',
        name: 'CREDENTIAL_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
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
        neogma.queryRunner.run(
            'CREATE INDEX profileId_idx IF NOT EXISTS FOR (p:Profile) ON (p.profileId)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX profile_did_idx IF NOT EXISTS FOR (p:Profile) ON (p.did)'
        ),
        neogma.queryRunner.run('CREATE INDEX boost_id_idx IF NOT EXISTS FOR (b:Boost) ON (b.id)'),
        neogma.queryRunner.run(
            'CREATE INDEX profilemanager_id_idx IF NOT EXISTS FOR (p:ProfileManager) ON (p.id)'
        ),
        neogma.queryRunner.run(
            'CREATE TEXT INDEX profileId_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.profileId)'
        ),
        neogma.queryRunner.run(
            'CREATE TEXT INDEX profile_displayname_text_idx IF NOT EXISTS FOR (n:Profile) ON (n.displayName)'
        ),
        neogma.queryRunner.run('CREATE INDEX role_id_idx IF NOT EXISTS FOR (r:Role) ON (r.id)'),
        neogma.queryRunner.run(
            'CREATE INDEX has_role_id_idx IF NOT EXISTS FOR ()-[r:HAS_ROLE]-() ON (r.roleId)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX email_address_email_idx IF NOT EXISTS FOR (e:EmailAddress) ON (e.email)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX inbox_credential_status_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.currentStatus)'
        ),
        neogma.queryRunner.run(
            'CREATE INDEX inbox_credential_expires_idx IF NOT EXISTS FOR (i:InboxCredential) ON (i.expiresAt)'
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
export * from './EmailAddress';
export * from './InboxCredential';
