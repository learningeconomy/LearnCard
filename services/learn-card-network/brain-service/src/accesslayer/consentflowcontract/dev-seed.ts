import { neogma } from '@instance';
import { environment } from '../../config/environment';
import { EducationOsConsentGrantValidator, type EducationOsConsentGrant } from '@learncard/types';
import { hashEducationOsGrant } from '@helpers/consent-preflight-hash.helpers';
import { governConsentContract, type GovernanceAgreementKind } from './governance';

/** Synthetic operator-only fixture. Never creates a learner Profile or learner Terms. */
export const seedDevGovernanceConsent = async (): Promise<void> => {
    if (environment.NODE_ENV === 'production')
        throw new Error('Synthetic governance seed is development-only.');
    const ecosystemId = 'eco_dev_root';
    const root = await neogma.queryRunner.run(
        'MATCH (e:Ecosystem {id: $ecosystemId}) RETURN e.ownerProfileId AS profileId',
        { ecosystemId }
    );
    const profileId: unknown = root.records[0]?.get('profileId');
    if (typeof profileId !== 'string')
        throw new Error('Run seed:education-os first; eco_dev_root must have an owner.');
    const tiers = ['directory', 'roster', 'credential-metadata', 'credential-body'] as const;
    const fixtures: Array<{
        id: string;
        agreement: GovernanceAgreementKind;
        grant: EducationOsConsentGrant;
    }> = [
        {
            id: 'synthetic-dev-institutional-data-sharing',
            agreement: 'institutional-data-sharing',
            grant: {
                apiVersion: 'lc.consent-grant/v1',
                grants: ['roster-source', 'record-provisioning'].map(capability =>
                    EducationOsConsentGrantValidator.shape.grants.element.parse({
                        capability,
                        operation: 'read',
                        scopes: [`group:sync:tree:${ecosystemId}`],
                        selectors: { ecosystemIds: [ecosystemId] },
                        tiers: [...tiers],
                        purpose:
                            'SYNTHETIC DEVELOPMENT governance readiness only. No learner consent or data release.',
                    })
                ),
            },
        },
        {
            id: 'synthetic-dev-wallet-policy',
            agreement: 'wallet-policy',
            grant: {
                apiVersion: 'lc.consent-grant/v1',
                grants: [
                    {
                        capability: 'wallet-claim',
                        operation: 'claim',
                        scopes: [`wallet:claim:id:${ecosystemId}`],
                        selectors: { ecosystemIds: [ecosystemId] },
                        tiers: ['credential-body'],
                        purpose:
                            'SYNTHETIC DEVELOPMENT wallet policy. Learner choice is still required at claim time.',
                    },
                ],
            },
        },
    ];
    for (const fixture of fixtures) {
        const now = new Date().toISOString();
        const result = await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})
             MERGE (c:ConsentFlowContract {id: $id})
             ON CREATE SET c.name = $name, c.createdAt = $now, c.updatedAt = $now,
                 c.\`contract.read.anonymize\` = false,
                 c.description = 'SYNTHETIC DEVELOPMENT ONLY. Governance acceptance is not learner consent.'
             WITH c, p
             WHERE NOT EXISTS { MATCH (c)-[:CREATED_BY]->(other:Profile) WHERE other <> p }
             MERGE (c)-[:CREATED_BY]->(p)
             RETURN c.educationOsGrantHash AS hash`,
            { id: fixture.id, profileId, name: `SYNTHETIC — ${fixture.agreement}`, now }
        );
        if (!result.records.length)
            throw new Error(
                `Refusing to transfer historical governance fixture ${fixture.id} to a different owner.`
            );
        const existingHash: unknown = result.records[0]?.get('hash');
        if (existingHash && existingHash !== hashEducationOsGrant(fixture.grant)) {
            throw new Error(`Refusing to overwrite edited governance fixture ${fixture.id}.`);
        }
        if (!existingHash) {
            await governConsentContract({
                ecosystemId,
                contractId: fixture.id,
                actorProfileId: profileId,
                agreement: fixture.agreement,
                grant: fixture.grant,
            });
        }
        // ON CREATE only: rerunning does not reaccept withdrawn Terms or a widened grant.
        const acceptance = await neogma.queryRunner.run(
            `MATCH (e:Ecosystem {id: $ecosystemId})-[:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract {id: $id})
             MATCH (p:Profile {profileId: $profileId}) WHERE e.ownerProfileId = p.profileId
             MERGE (t:ConsentFlowTerms {id: $termsId})
             ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now,
                 t.educationOsGrant = c.educationOsGrant,
                 t.educationOsGrantHash = c.educationOsGrantHash,
                 t.educationOsGrantRevision = c.educationOsGrantRevision,
                 t.educationOsAcceptedAt = $now, t.educationOsAcceptedRole = 'OWNER',
                 t.educationOsAcceptedProfileId = $profileId,
                 t.mutationVersion = 1, t.educationOsAcceptedMutationVersion = 1
             WITH p, t, c
             WHERE NOT EXISTS { MATCH (other:Profile)-[:CREATED_BY]->(t) WHERE other <> p }
             MERGE (p)-[:CREATED_BY]->(t)
             MERGE (t)-[:CONSENTS_TO]->(c)
             SET c.hasConsented = true,
                 t.educationOsAcceptedProfileId = coalesce(t.educationOsAcceptedProfileId, p.profileId)
             MERGE (tx:ConsentFlowTransaction {id: $transactionId})
             ON CREATE SET tx.action = 'consent', tx.date = $now,
                 tx.educationOsGrant = t.educationOsGrant,
                 tx.educationOsGrantHash = t.educationOsGrantHash,
                 tx.educationOsGrantRevision = t.educationOsGrantRevision
             MERGE (tx)-[:IS_FOR]->(t)
             RETURN t.id AS id`,
            {
                ecosystemId,
                id: fixture.id,
                termsId: `${fixture.id}-operator-terms`,
                transactionId: `${fixture.id}-synthetic-acceptance`,
                profileId,
                now,
            }
        );
        if (!acceptance.records.length)
            throw new Error(`Refusing to relink historical acceptance for ${fixture.id}.`);
    }
};
