import type { ManagedTransaction } from 'neo4j-driver';
import type { ServiceAccountGrant, InstallTargetSpec } from '@learncard/types';
import { neogma } from '@instance';
import { getIntentTargetId } from '@helpers/install-intent.helpers';
import type { InstallIntentRecordType } from 'types/install-intent';
import type { IntegrationInstallType } from 'types/install-target';
import {
    approvedServiceAccountGrants,
    assertSafeServiceAccountGrant,
    ServiceAccountProvisioningError,
    serviceAccountId,
} from '@helpers/service-account.helpers';

const writeTransaction = async <T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> => {
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(fn);
    } finally {
        await session.close();
    }
};

/** Ownership only. REFERENCES/ENDORSES and Group ancestry never confer containment. */
const assertSelectorContained = async (
    tx: ManagedTransaction,
    grant: ServiceAccountGrant,
    ecosystemId: string
): Promise<void> => {
    assertSafeServiceAccountGrant(grant);
    let query: string;
    if (grant.selectorKind === 'tree') {
        query = 'MATCH (owner:Ecosystem {id: $value}) RETURN owner.pathIds AS pathIds';
    } else if (grant.resource === 'group') {
        query = `MATCH (resource:Group {id: $value})
                 MATCH (owner:Ecosystem {id: resource.ownerEcosystemId}) RETURN owner.pathIds AS pathIds`;
    } else {
        // These resource kinds do not yet have an unambiguous EducationOS ownership
        // anchor. Reject rather than infer ownership from a reference or Profile role.
        throw new ServiceAccountProvisioningError(
            `Cannot resolve owning ecosystem for ${grant.resource} id selector ${grant.selectorValue}.`
        );
    }
    const result = await tx.run(query, { value: grant.selectorValue });
    const pathIds: unknown = result.records[0]?.get('pathIds');
    if (result.records.length !== 1 || !Array.isArray(pathIds) || !pathIds.includes(ecosystemId)) {
        throw new ServiceAccountProvisioningError(
            `ServiceAccount selector ${grant.selectorKind}:${grant.selectorValue} is missing or outside install ecosystem tree ${ecosystemId}.`
        );
    }
};

/**
 * One graph transaction owns the target, INSTALLS anchor, principal and grants.
 * specRevision is the approved generation (approval is single-use today); a reinstall
 * requires a new intent. READY means materialized, not authenticated/operational.
 */
export const provisionIntegrationServiceAccount = async (
    input: IntegrationInstallType,
    intent: InstallIntentRecordType,
    target: InstallTargetSpec
): Promise<void> => {
    const grants = approvedServiceAccountGrants(intent, target, input.id);
    const id = serviceAccountId(intent.intentId, input.id, intent.specRevision);
    await writeTransaction(async tx => {
        // Serialize with removal on the durable intent node, independent of Redis lease expiry.
        const locked = await tx.run(
            `MATCH (intent:InstallIntent {intentId: $intentId})
             SET intent.serviceAccountLock = coalesce(intent.serviceAccountLock, 0) + 1
             RETURN intent.status AS status, intent.specRevision AS generation, intent.approval AS approval,
                    intent.serviceAccountsRevoked AS revoked`,
            { intentId: intent.intentId }
        );
        const record = locked.records[0];
        const status: { phase?: string } = JSON.parse(record?.get('status') ?? '{}');
        if (
            !record ||
            record.get('revoked') === true ||
            status.phase !== 'APPLYING' ||
            Number(record.get('generation')) !== intent.specRevision ||
            JSON.stringify(JSON.parse(record.get('approval'))) !== JSON.stringify(intent.approval)
        ) {
            throw new ServiceAccountProvisioningError(
                'Install generation is no longer applying; authority cannot be restored.'
            );
        }
        const existing = await tx.run(
            `MATCH (sa:ServiceAccount) WHERE sa.installId = $installId OR sa.id = $id
             RETURN sa.id AS id, sa.status AS status`,
            { installId: input.id, id }
        );
        if (existing.records.some(row => row.get('id') === id && row.get('status') === 'REVOKED')) {
            throw new ServiceAccountProvisioningError(
                'Revoked ServiceAccount generation is a tombstone; approve a new install.'
            );
        }
        if (existing.records.some(row => row.get('status') !== 'REVOKED')) {
            // A replay must neither recreate grants nor repair edges. Health checks decide drift.
            if (existing.records.length !== 1 || existing.records[0]?.get('id') !== id) {
                throw new ServiceAccountProvisioningError(
                    'Conflicting ServiceAccounts for install.'
                );
            }
            return;
        }
        for (const grant of grants) await assertSelectorContained(tx, grant, input.ecosystemId);
        const result = await tx.run(
            `MATCH (eco:Ecosystem {id: $ecosystemId}), (listing:AppStoreListing {listing_id: $listingId})
             MERGE (target:IntegrationInstall {id: $installId}) ON CREATE SET target += $target
             MERGE (sa:ServiceAccount {id: $id})
             ON CREATE SET sa.installId = $installId, sa.activeInstallId = $installId,
               sa.ecosystemId = $ecosystemId, sa.status = 'PROVISIONED',
               sa.credentialGeneration = 0.0, sa.createdAt = $createdAt
             MERGE (target)-[:HAS_SERVICE_ACCOUNT]->(sa)
             MERGE (sa)-[:ACTS_FOR]->(eco)
             MERGE (eco)-[install:INSTALLS {installId: $installId}]->(listing)
             ON CREATE SET install.serviceAccountId = $id, install.listingKind = 'INTEGRATION',
               install.status = 'PROVISIONED', install.installedAt = $createdAt
             WITH sa
             FOREACH (grant IN $grants |
               MERGE (g:ServiceAccountGrant {id: grant.id}) ON CREATE SET g += grant
               MERGE (sa)-[:HAS_GRANT]->(g))
             RETURN sa.id AS id`,
            {
                ecosystemId: input.ecosystemId,
                listingId: input.listingId,
                installId: input.id,
                id,
                createdAt: input.createdAt,
                target: input,
                grants,
            }
        );
        if (result.records.length !== 1)
            throw new ServiceAccountProvisioningError(
                'Missing install ecosystem or listing anchor.'
            );
    });
};

/** Tombstones and grant deletion commit before Binding revocation or target deletion. */
export const revokeIntentServiceAccounts = async (
    intent: InstallIntentRecordType
): Promise<void> => {
    await writeTransaction(async tx => {
        await tx.run(
            `MATCH (intent:InstallIntent {intentId: $intentId})
            SET intent.serviceAccountLock = coalesce(intent.serviceAccountLock, 0) + 1`,
            { intentId: intent.intentId }
        );
        const targetIds =
            intent.spec?.targets
                .filter(t => t.targetType === 'INTEGRATION_INSTALL')
                .map(t =>
                    // Same declaration identity used by expectedTargetDescriptors.
                    getIntentTargetId(
                        intent.intentId,
                        typeof t.config.declarationId === 'string'
                            ? t.config.declarationId
                            : `${t.targetType}_${t.listingId}`
                    )
                ) ?? [];
        await tx.run(
            `MATCH (sa:ServiceAccount)
             WHERE sa.installId IN $targetIds OR EXISTS {
               MATCH (target:IntegrationInstall {intentId: $intentId})-[:HAS_SERVICE_ACCOUNT]->(sa)
             }
             FOREACH (_ IN CASE WHEN sa.status <> 'REVOKED' THEN [1] ELSE [] END |
               SET sa.status = 'REVOKED', sa.revokedAt = $now,
                   sa.credentialGeneration = coalesce(sa.credentialGeneration, 0.0) + 1.0)
             REMOVE sa.activeInstallId
             WITH sa OPTIONAL MATCH (grant:ServiceAccountGrant)
             WHERE grant.serviceAccountId = sa.id OR EXISTS { MATCH (sa)-[:HAS_GRANT]->(grant) }
             DETACH DELETE grant`,
            { intentId: intent.intentId, targetIds, now: new Date().toISOString() }
        );
        await tx.run(
            `MATCH (intent:InstallIntent {intentId: $intentId}) SET intent.serviceAccountsRevoked = true`,
            { intentId: intent.intentId }
        );
    });
};

/** Returns a persistent fail-closed cause; never repairs or re-enables an account. */
export const checkIntegrationServiceAccount = async (
    intent: InstallIntentRecordType,
    installId: string
): Promise<string | undefined> =>
    writeTransaction(async tx => {
        const result = await tx.run(
            `MATCH (sa:ServiceAccount)
         WHERE sa.installId = $installId OR EXISTS {
           MATCH (:IntegrationInstall {id: $installId})-[:HAS_SERVICE_ACCOUNT]->(sa)
         }
         OPTIONAL MATCH (sa)-[acts:ACTS_FOR]->(eco)
         WITH sa, collect(eco.id) AS ecosystems, count(acts) AS actsCount
         OPTIONAL MATCH (owner)-[link:HAS_SERVICE_ACCOUNT]->(sa)
         RETURN sa, ecosystems, actsCount, collect(owner.id) AS installs, count(link) AS links`,
            { installId }
        );
        const active = result.records.filter(row => row.get('sa').properties.status !== 'REVOKED');
        let cause: string | undefined;
        if (active.length !== 1) cause = 'expected exactly one non-REVOKED ServiceAccount';
        const target = intent.spec?.targets.find(
            t =>
                getIntentTargetId(
                    intent.intentId,
                    typeof t.config.declarationId === 'string'
                        ? t.config.declarationId
                        : `${t.targetType}_${t.listingId}`
                ) === installId
        );
        let expectedGrants: ServiceAccountGrant[] = [];
        try {
            if (!target) throw new ServiceAccountProvisioningError('Missing approved target.');
            expectedGrants = approvedServiceAccountGrants(intent, target, installId);
        } catch (error) {
            if (!(error instanceof ServiceAccountProvisioningError)) throw error;
            cause ??= error.message;
        }
        for (const row of active) {
            const sa = row.get('sa').properties;
            if (
                sa.id !== serviceAccountId(intent.intentId, installId, intent.specRevision) ||
                sa.activeInstallId !== installId ||
                !['PROVISIONED', 'ENABLED', 'DISABLED'].includes(sa.status)
            ) {
                cause ??= 'ServiceAccount identity or status differs from the approved generation';
            }
            if (
                sa.installId !== installId ||
                Number(row.get('links')) !== 1 ||
                row.get('installs')[0] !== installId
            ) {
                cause ??=
                    'ServiceAccount is shared across installs or has an invalid install anchor';
            }
            if (
                sa.ecosystemId !== intent.ecosystemId ||
                Number(row.get('actsCount')) !== 1 ||
                row.get('ecosystems')[0] !== intent.ecosystemId
            ) {
                cause ??= 'ServiceAccount must have exactly one ACTS_FOR at the install ecosystem';
            }
            const anchors = await tx.run(
                `MATCH (eco)-[install:INSTALLS {installId: $installId}]->(listing)
            RETURN eco.id AS ecosystemId, listing.listing_id AS listingId, install.serviceAccountId AS serviceAccountId`,
                { installId }
            );
            if (
                anchors.records.length !== 1 ||
                anchors.records[0]?.get('ecosystemId') !== intent.ecosystemId ||
                anchors.records[0]?.get('listingId') !== target?.listingId ||
                anchors.records[0]?.get('serviceAccountId') !== sa.id
            ) {
                cause ??= 'expected exactly one INSTALLS anchor matching the approved install';
            }
            const grants = await tx.run(
                `MATCH (grant:ServiceAccountGrant) WHERE grant.serviceAccountId = $id
            OR EXISTS { MATCH (:ServiceAccount {id: $id})-[:HAS_GRANT]->(grant) }
            OPTIONAL MATCH (owner)-[edge:HAS_GRANT]->(grant)
            RETURN grant, collect(owner.id) AS owners, count(edge) AS edges`,
                { id: sa.id }
            );
            if (grants.records.length !== expectedGrants.length)
                cause ??= 'ServiceAccount grants differ from approved plan';
            for (const record of grants.records) {
                try {
                    const grant = assertSafeServiceAccountGrant(record.get('grant').properties);
                    if (grant.serviceAccountId !== sa.id || grant.installId !== installId) {
                        throw new ServiceAccountProvisioningError(
                            'Grant belongs to a different install or ServiceAccount.'
                        );
                    }
                    await assertSelectorContained(tx, grant, intent.ecosystemId);
                    const expected = expectedGrants.find(item => item.id === grant.id);
                    if (
                        !expected ||
                        Object.entries(expected).some(
                            ([key, value]) => grant[key as keyof ServiceAccountGrant] !== value
                        ) ||
                        Number(record.get('edges')) !== 1 ||
                        record.get('owners')[0] !== sa.id
                    ) {
                        throw new ServiceAccountProvisioningError(
                            'ServiceAccount grants or HAS_GRANT edges differ from approved plan.'
                        );
                    }
                } catch (error) {
                    if (!(error instanceof ServiceAccountProvisioningError)) throw error;
                    cause ??= error.message;
                }
            }
        }
        if (!cause) return undefined;
        const message = `Drift detected: ServiceAccount invariant violation for ${installId}: ${cause}.`;
        await tx.run(
            `MATCH (sa:ServiceAccount) WHERE sa.id IN $ids AND sa.status <> 'REVOKED'
        SET sa.status = 'DISABLED'`,
            { ids: active.map(row => row.get('sa').properties.id) }
        );
        // Disable and audit are atomic, including missing-principal violations.
        await tx.run(
            `CREATE (:InstallIntentAuditEvent {
        id: randomUUID(), action: 'SERVICE_ACCOUNT_INVARIANT_VIOLATION',
        intentId: $intentId, ecosystemId: $ecosystemId, timestamp: $now,
        authorityChangesSummary: $message, afterSummary: $summary
    })`,
            {
                intentId: intent.intentId,
                ecosystemId: intent.ecosystemId,
                now: new Date().toISOString(),
                message,
                summary: JSON.stringify({ installId, status: 'DISABLED' }),
            }
        );
        return message;
    });
