import { TRPCError } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { ManagedTransaction } from 'neo4j-driver';
import { EducationOsConsentGrantValidator, type EducationOsConsentGrant } from '@learncard/types';
import { neogma } from '@instance';
import { hashEducationOsGrant } from '@helpers/consent-preflight-hash.helpers';

export const GovernanceAgreementKindValidator = z.enum([
    'institutional-data-sharing',
    'issuance-authority',
    'wallet-policy',
]);
export type GovernanceAgreementKind = z.infer<typeof GovernanceAgreementKindValidator>;

/**
 * Internal write boundary. The actor must administer the ecosystem AND own the
 * contract. Updates serialize with ConsentFlow's audience lock. Every mapping
 * revision needs fresh acceptance; existing Terms are deliberately untouched.
 */
export const governConsentContract = async (input: {
    ecosystemId: string;
    contractId: string;
    actorProfileId: string;
    agreement: GovernanceAgreementKind;
    grant: EducationOsConsentGrant;
}): Promise<void> => {
    const grant = EducationOsConsentGrantValidator.parse(input.grant);
    const agreement = GovernanceAgreementKindValidator.parse(input.agreement);
    const hash = hashEducationOsGrant(grant);
    const revision = randomUUID();
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem {id: $ecosystemId}), (p:Profile {profileId: $actorProfileId})
         MATCH (c:ConsentFlowContract {id: $contractId})-[:CREATED_BY]->(p)
         WHERE e.ownerProfileId = p.profileId OR EXISTS {
             MATCH (p)-[m:MEMBER_OF]->(e) WHERE m.role IN ['OWNER', 'ADMIN']
         }
         SET c.audienceVersion = coalesce(c.audienceVersion, 0) + 1
         WITH e, c
         WHERE NOT EXISTS {
             MATCH (other:Ecosystem)-[:GOVERNS_CONSENT_CONTRACT]->(c) WHERE other <> e
         }
         MERGE (e)-[g:GOVERNS_CONSENT_CONTRACT]->(c)
         SET c.educationOsGrantRevision = CASE
                 WHEN c.educationOsGrantHash = $hash AND g.agreement = $agreement
                 THEN coalesce(c.educationOsGrantRevision, $revision) ELSE $revision END,
             g.agreement = $agreement,
             c.educationOsGrant = $grantJson,
             c.educationOsGrantHash = $hash,
             c.updatedAt = $now
         RETURN c.id AS id`,
        {
            ecosystemId: input.ecosystemId,
            contractId: input.contractId,
            actorProfileId: input.actorProfileId,
            agreement,
            grantJson: JSON.stringify(grant),
            hash,
            revision,
            now: new Date().toISOString(),
        }
    );
    if (!result.records.length) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Contract governance requires local ownership and ecosystem administration.',
        });
    }
};

export const GovernedConsentEvidenceValidator = z.object({
    contractId: z.string(),
    agreement: GovernanceAgreementKindValidator,
    governingEcosystemIds: z.array(z.string()),
    contractExpiresAt: z.string().nullable(),
    grantJson: z.string().nullable(),
    grantHash: z.string().nullable(),
    contractRevision: z.string().nullable(),
    termsId: z.string().nullable(),
    status: z.string().nullable(),
    expiresAt: z.string().nullable(),
    acceptedAt: z.string().nullable(),
    acceptedGrantJson: z.string().nullable(),
    acceptedGrantHash: z.string().nullable(),
    acceptedRevision: z.string().nullable(),
    acceptedRole: z.string().nullable(),
    acceptedProfileId: z.string().nullable(),
    acceptedMutationVersion: z.coerce.number().nullable(),
    termsMutationVersion: z.coerce.number(),
    profileId: z.string().nullable(),
    role: z.string().nullable(),
});
export type GovernedConsentEvidence = z.infer<typeof GovernedConsentEvidenceValidator>;

/** Only local governed contracts are candidates; multiply-governed contracts fail closed. */
export const readGovernedConsentEvidence = async (
    ecosystemId: string,
    runner: Pick<ManagedTransaction, 'run'> | typeof neogma.queryRunner = neogma.queryRunner
): Promise<GovernedConsentEvidence[]> => {
    const result = await runner.run(
        `MATCH (e:Ecosystem {id: $ecosystemId})-[g:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract)
         MATCH (governor:Ecosystem)-[:GOVERNS_CONSENT_CONTRACT]->(c)
         WITH e, g, c, collect(DISTINCT governor.id) AS governingEcosystemIds
         OPTIONAL MATCH (p:Profile)-[:CREATED_BY]->(t:ConsentFlowTerms)-[:CONSENTS_TO]->(c)
         OPTIONAL MATCH (p)-[membership:MEMBER_OF]->(e)
         RETURN c.id AS contractId, g.agreement AS agreement, governingEcosystemIds,
                c.expiresAt AS contractExpiresAt, c.educationOsGrant AS grantJson,
                c.educationOsGrantHash AS grantHash, c.educationOsGrantRevision AS contractRevision,
                t.id AS termsId, t.status AS status, t.expiresAt AS expiresAt,
                t.educationOsAcceptedAt AS acceptedAt,
                t.educationOsGrant AS acceptedGrantJson,
                t.educationOsGrantHash AS acceptedGrantHash,
                t.educationOsGrantRevision AS acceptedRevision,
                t.educationOsAcceptedRole AS acceptedRole, p.profileId AS profileId,
                t.educationOsAcceptedProfileId AS acceptedProfileId,
                t.educationOsAcceptedMutationVersion AS acceptedMutationVersion,
                coalesce(t.mutationVersion, 0) AS termsMutationVersion,
                CASE WHEN e.ownerProfileId = p.profileId THEN 'OWNER' ELSE membership.role END AS role
         ORDER BY CASE WHEN e.ownerProfileId = p.profileId OR membership.role IN ['OWNER', 'ADMIN']
             THEN 0 ELSE 1 END, c.id, t.id
         LIMIT 512`,
        { ecosystemId }
    );
    return result.records.map(record => GovernedConsentEvidenceValidator.parse(record.toObject()));
};

export const GovernanceConsentAcceptanceValidator = z
    .object({
        ecosystemId: z.string().min(1),
        contractId: z.string().min(1),
        termsId: z.string().min(1),
        contractRevision: z.string().min(1),
        grantHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict();

/** Explicit representative action, bound to the exact revision the actor reviewed. */
export const acceptGovernanceConsentContract = async (
    input: z.infer<typeof GovernanceConsentAcceptanceValidator>,
    actorProfileId: string
): Promise<true> => {
    const reviewed = GovernanceConsentAcceptanceValidator.parse(input);
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem {id: $ecosystemId})-[g:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract {id: $contractId})
         MATCH (p:Profile {profileId: $actorProfileId})-[:CREATED_BY]->(t:ConsentFlowTerms {id: $termsId})-[:CONSENTS_TO]->(c)
         OPTIONAL MATCH (p)-[m:MEMBER_OF]->(e)
         SET e.governanceLock = coalesce(e.governanceLock, 0) + 1,
             c.audienceLock = coalesce(c.audienceLock, 0) + 1,
             t.governanceLock = coalesce(t.governanceLock, 0) + 1,
             m.governanceLock = coalesce(m.governanceLock, 0) + 1,
             g.governanceLock = coalesce(g.governanceLock, 0) + 1
         WITH e, c, p, t, m
         WHERE (e.ownerProfileId = p.profileId OR m.role IN ['OWNER', 'ADMIN'])
             AND c.educationOsGrantRevision = $contractRevision
             AND c.educationOsGrantHash = $grantHash AND c.educationOsGrant IS NOT NULL
             AND t.status = 'live'
             AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > datetime())
             AND (t.expiresAt IS NULL OR datetime(t.expiresAt) > datetime())
             AND NOT EXISTS { MATCH (other:Ecosystem)-[:GOVERNS_CONSENT_CONTRACT]->(c) WHERE other <> e }
         WITH e, c, p, t, m, coalesce(t.mutationVersion, 0) + 1 AS acceptedVersion
         SET t.educationOsGrant = c.educationOsGrant,
             t.educationOsGrantHash = c.educationOsGrantHash,
             t.educationOsGrantRevision = c.educationOsGrantRevision,
             t.educationOsAcceptedAt = $now,
             t.educationOsAcceptedProfileId = p.profileId,
             t.educationOsAcceptedRole = CASE WHEN e.ownerProfileId = p.profileId THEN 'OWNER' ELSE m.role END,
             t.mutationVersion = acceptedVersion,
             t.educationOsAcceptedMutationVersion = acceptedVersion
         CREATE (tx:ConsentFlowTransaction {id: $transactionId, action: 'consent', date: $now,
             educationOsGrant: c.educationOsGrant, educationOsGrantHash: c.educationOsGrantHash,
             educationOsGrantRevision: c.educationOsGrantRevision})-[:IS_FOR]->(t)
         RETURN t.id AS id`,
        { ...reviewed, actorProfileId, now: new Date().toISOString(), transactionId: randomUUID() }
    );
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Governance revision, live Terms, or representative authority changed. Review the agreement again.',
        });
    return true;
};
