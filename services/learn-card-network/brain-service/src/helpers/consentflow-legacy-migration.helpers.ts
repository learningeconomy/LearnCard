import { neogma } from '@instance';
import { inflateObject } from '@helpers/objects.helpers';
import { v4 as uuid } from 'uuid';
import { ConsentFlowContractValidator } from '@learncard/types';
import type { ConsentFlowContract } from '@learncard/types';
/** Backfills v1 snapshots and legacy consent markers idempotently. */
export const migrateLegacyConsentFlowContracts = async (contractId?: string): Promise<void> => {
    const scoped = contractId !== undefined;
    if (!scoped) {
        const marker = await neogma.queryRunner.run(
            `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'})
             WHERE migration.completedAt IS NOT NULL
             RETURN migration.completedAt AS completedAt`
        );
        if (marker.records.length > 0) return;
    }
    const legacy = await neogma.queryRunner.run(
        `
        MATCH (contract:ConsentFlowContract)
        WHERE ($contractId IS NULL OR contract.id=$contractId)
          AND contract.currentVersion IS NULL
          AND NOT EXISTS { MATCH (contract)-[:HAS_VERSION]->(:ConsentFlowContractVersion) }
        OPTIONAL MATCH (contract)-[autoReceive:AUTO_RECEIVE]->(boost:Boost)
        WITH contract, collect(CASE WHEN boost IS NULL THEN null ELSE {
            id: boost.id, signingAuthorityEndpoint: coalesce(autoReceive.signingAuthorityEndpoint, 'default'),
            signingAuthorityName: coalesce(autoReceive.signingAuthorityName, 'default'), issuer: autoReceive.issuer
        } END) AS rawAutoboosts
        OPTIONAL MATCH (contract)-[:CAN_WRITE]->(writer:Profile)
        WITH contract, rawAutoboosts, collect(DISTINCT writer.profileId) AS writers
        RETURN properties(contract) AS properties,
               [config IN rawAutoboosts WHERE config IS NOT NULL] AS autoboosts,
               writers
    `,
        { contractId: contractId ?? null }
    );
    if (scoped && !legacy.records.length) return;
    let skippedCount = 0;
    const skipped: { contractId: string; reason: string }[] = [];
    for (const record of legacy.records) {
        const properties = record.get('properties') as Record<string, unknown>;
        const contractProps = Object.fromEntries(
            Object.entries(properties)
                .filter(([key]) => key.startsWith('contract.'))
                .map(([key, value]) => [key.slice('contract.'.length), value])
        );
        let contract: ConsentFlowContract;
        try {
            contract = ConsentFlowContractValidator.parse(
                inflateObject<Record<string, unknown>>(contractProps)
            );
        } catch {
            skippedCount += 1;
            if (skipped.length < 25)
                skipped.push({ contractId: String(properties.id), reason: 'invalid_contract' });
            continue;
        }
        const autoboosts = record.get('autoboosts') as StoredAutoBoost[];
        const writers = (record.get('writers') as (string | null)[]).filter(
            (writer): writer is string => !!writer
        );
        await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract {id:$id})
             WHERE contract.currentVersion IS NULL
               AND NOT EXISTS { MATCH (contract)-[:HAS_VERSION]->(:ConsentFlowContractVersion) }
             SET contract._legacyMigrationLock = true
             REMOVE contract._legacyMigrationLock
             WITH contract
             WHERE contract.currentVersion IS NULL
               AND NOT EXISTS { MATCH (contract)-[:HAS_VERSION]->(:ConsentFlowContractVersion) }
             CREATE (version:ConsentFlowContractVersion {
                 id:$versionId, version:1, contract:$contractSnapshot, name:$name,
                 subtitle:$subtitle, description:$description, reasonForAccessing:$reasonForAccessing,
                 image:$image, needsGuardianConsent:$needsGuardianConsent, redirectUrl:$redirectUrl,
                 frontDoorBoostUri:$frontDoorBoostUri, expiresAt:$expiresAt,
                 autoboosts:$autoboostSnapshot, writers:$writerSnapshot, createdAt:$createdAt
             })
             CREATE (contract)-[:HAS_VERSION]->(version)
             SET contract.currentVersion=1
             WITH contract
             MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
             SET terms.consentedVersion=coalesce(terms.consentedVersion,1),
                 terms.status=CASE WHEN terms.status='stale' THEN 'consumed' ELSE terms.status END`,
            {
                id: String(properties.id),
                versionId: uuid(),
                contractSnapshot: JSON.stringify(contract),
                autoboostSnapshot: JSON.stringify(autoboosts),
                writerSnapshot: JSON.stringify(writers),
                createdAt: String(properties.createdAt ?? new Date().toISOString()),
                name: properties.name,
                subtitle: properties.subtitle ?? null,
                description: properties.description ?? null,
                reasonForAccessing: properties.reasonForAccessing ?? null,
                image: properties.image ?? null,
                needsGuardianConsent: properties.needsGuardianConsent ?? false,
                redirectUrl: properties.redirectUrl ?? null,
                frontDoorBoostUri: properties.frontDoorBoostUri ?? null,
                expiresAt: properties.expiresAt ?? null,
            }
        );
    }
    if (!scoped) {
        await neogma.queryRunner.run(`
            MATCH (contract:ConsentFlowContract)-[:HAS_VERSION]->(:ConsentFlowContractVersion {version:1})
            WHERE contract.currentVersion IS NULL
            SET contract.currentVersion=1
        `);
        await neogma.queryRunner.run(`
            MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(:ConsentFlowContract)
            WHERE terms.consentedVersion IS NULL
            SET terms.consentedVersion=1
        `);
        await neogma.queryRunner.run(`
            MATCH (terms:ConsentFlowTerms)
            WHERE terms.status='stale'
            SET terms.status='consumed'
        `);
    }
    if (skippedCount) {
        console.warn('Skipped malformed legacy ConsentFlow contracts', {
            count: skippedCount,
            contracts: skipped,
            truncated: skippedCount > skipped.length,
        });
        return;
    }
    if (scoped) return;
    await neogma.queryRunner.run(`
        MERGE (migration:ConsentFlowContractMigration {id:'legacy-v1'})
        SET migration.completedAt=coalesce(migration.completedAt, toString(datetime()))
    `);
};
type StoredAutoBoost = {
    id: string;
    signingAuthorityEndpoint?: string;
    signingAuthorityName?: string;
    issuer?: string;
};
