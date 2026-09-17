import { CredentialRefreshRecordValidator } from 'types/credential-refresh';
import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { neogma } from '@instance';
import type { InboxCredentialType, PublishCredentialRefreshResult } from '@learncard/types';
import { inflateObject } from '@helpers/objects.helpers';

export const getInboxRefreshIssue = async (
    issueKey: string
): Promise<{
    inbox: InboxCredentialType;
    requestDigest: string;
    claimUrl?: string;
} | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (ic:InboxCredential {refreshIssueKey: $issueKey}) RETURN ic LIMIT 1',
        { issueKey }
    );
    const props = result.records[0]?.get('ic')?.properties;
    return props
        ? {
              inbox: inflateObject(props),
              requestDigest: props.refreshRequestDigest,
              claimUrl: props.refreshClaimUrl,
          }
        : null;
};

/** Creates the inbox row and unbound aggregate together; a retry cannot allocate a second root. */
export const createPendingInboxRefresh = async (params: {
    inbox: Record<string, unknown>;
    aggregate: Record<string, unknown>;
    issueKey: string;
    requestDigest: string;
}): Promise<InboxCredentialType> => {
    const result = await neogma.queryRunner.run(
        `MATCH (issuer:Profile {profileId: $issuerProfileId})
         MERGE (ic:InboxCredential {refreshIssueKey: $issueKey})
         ON CREATE SET ic += $inbox, ic.refreshRequestDigest = $requestDigest
         WITH issuer, ic WHERE ic.refreshRequestDigest = $requestDigest
         MERGE (refresh:CredentialRefresh {refreshId: ic.refreshId})
         ON CREATE SET refresh += $aggregate
         MERGE (issuer)-[:ISSUED_REFRESH]->(refresh)
         MERGE (refresh)-[:INBOX]->(ic)
         MERGE (p:InboxRefreshPublication {refreshVersionKey: ic.refreshId + ':1'})
         ON CREATE SET p.id = ic.refreshId, p.refreshId = ic.refreshId, p.version = 1,
                       p.publishedAt = ic.createdAt, p.signingMode = 'signing-authority'
         RETURN ic`,
        { ...params, issuerProfileId: params.aggregate.issuerProfileId }
    );
    const props = result.records[0]?.get('ic')?.properties;
    if (!props)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'This idempotencyKey was used for a different inbox issuance.',
        });
    return inflateObject<InboxCredentialType>(props);
};

/** Metadata only. Pending publication bodies live exclusively in the expiring inbox escrow. */
export const getPendingInboxPublication = async (
    refreshId: string,
    idempotencyKey?: string
): Promise<PublishCredentialRefreshResult | null> => {
    if (!idempotencyKey) return null;
    const result = await neogma.queryRunner.run(
        `MATCH (p:InboxRefreshPublication {refreshIdempotencyKey: $key}) RETURN p LIMIT 1`,
        { key: `${refreshId}:${idempotencyKey}` }
    );
    const props = result.records[0]?.get('p')?.properties;
    return props
        ? {
              refreshId,
              version: Number(props.version),
              publishedAt: props.publishedAt,
              notification: 'not-applicable',
          }
        : null;
};

/** Publication and claim both lock the inbox row, then compare the version they prepared. */
export const advancePendingInboxRefresh = async (params: {
    refreshId: string;
    expectedVersion: number;
    credential: string;
    credentialName?: string;
    materialDigest: string;
    idempotencyKey?: string;
    updateSummary?: string;
}): Promise<PublishCredentialRefreshResult | null> => {
    const { refreshId, expectedVersion, idempotencyKey } = params;
    const replay = await getPendingInboxPublication(refreshId, idempotencyKey);
    if (replay) return replay;
    const version = expectedVersion + 1;
    const publishedAt = new Date().toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:INBOX]->(ic:InboxCredential)
         SET ic._escrowLock = true REMOVE ic._escrowLock
         WITH refresh, ic
         WHERE refresh.state = 'pending_holder' AND refresh.currentVersion = $expectedVersion
           AND ic.currentStatus = 'PENDING' AND datetime(ic.expiresAt) > datetime()
           AND ($key IS NULL OR NOT EXISTS { MATCH (:InboxRefreshPublication {refreshIdempotencyKey: $key}) })
         CREATE (p:InboxRefreshPublication $publication)
         SET ic.credential = $credential, ic.credentialName = $credentialName,
             refresh.currentVersion = $version, refresh.materialDigest = $materialDigest,
             refresh.lastPublishedAt = $publishedAt, refresh.updatedAt = $publishedAt,
             refresh.updateSummary = $updateSummary
         RETURN p`,
        {
            ...params,
            version,
            publishedAt,
            credentialName: params.credentialName ?? null,
            updateSummary: params.updateSummary ?? null,
            key: idempotencyKey ? `${refreshId}:${idempotencyKey}` : null,
            publication: Object.fromEntries(
                Object.entries({
                    id: randomUUID(),
                    refreshId,
                    version,
                    refreshVersionKey: `${refreshId}:${version}`,
                    publishedAt,
                    signingMode: 'signing-authority',
                    updateSummary: params.updateSummary,
                    refreshIdempotencyKey: idempotencyKey
                        ? `${refreshId}:${idempotencyKey}`
                        : undefined,
                }).filter(([, value]) => value !== undefined)
            ),
        }
    );
    if (!result.records.length) return getPendingInboxPublication(refreshId, idempotencyKey);
    return { refreshId, version, publishedAt, notification: 'not-applicable' };
};

/** Single commit: holder binding, canonical delivery, current version, and escrow erasure. */
export const bindPendingInboxRefresh = async (params: {
    inboxId: string;
    refreshId: string;
    expectedVersion: number;
    holderDid: string;
    holderProfileId?: string;
    issuerProfileId: string;
    root: Record<string, unknown>;
    aggregate: Record<string, unknown>;
    deliveryCredential: string;
    deliveryExpiresAt: string;
    accepted: boolean;
    boostId?: string;
}): Promise<boolean> => {
    const now = new Date().toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:INBOX]->(ic:InboxCredential {id: $inboxId})
         SET ic._escrowLock = true REMOVE ic._escrowLock
         WITH refresh, ic
         WHERE refresh.state = 'pending_holder' AND refresh.currentVersion = $expectedVersion
           AND ic.currentStatus = 'PENDING' AND datetime(ic.expiresAt) > datetime()
           AND (ic.guardianStatus IS NULL OR ic.guardianStatus = 'GUARDIAN_APPROVED')
         MATCH (issuer:Profile {profileId: $issuerProfileId})
         OPTIONAL MATCH (holder:Profile {profileId: $holderProfileId})
         OPTIONAL MATCH (boost:Boost {id: $boostId})
         CREATE (root:Credential $root)
         CREATE (refresh)-[:ROOT]->(root)
         CREATE (refresh)-[:HEAD]->(root)
         CREATE (issuer)-[:CREDENTIAL_SENT {to: $deliveryTarget, date: $now, activityId: ic.activityId, integrationId: ic.integrationId}]->(root)
         FOREACH (_ IN CASE WHEN holder IS NULL THEN [] ELSE [1] END |
             CREATE (holder)-[:HELD_REFRESH]->(refresh))
         FOREACH (_ IN CASE WHEN holder IS NOT NULL AND $accepted THEN [1] ELSE [] END |
             CREATE (root)-[:CREDENTIAL_RECEIVED {date: $now}]->(holder))
         FOREACH (_ IN CASE WHEN boost IS NULL THEN [] ELSE [1] END |
             CREATE (root)-[:INSTANCE_OF]->(boost))
         SET refresh += $aggregate,
             refresh.holderDid = $holderDid, refresh.holderProfileId = $holderProfileId,
             refresh.state = CASE WHEN $accepted THEN 'active' ELSE 'awaiting_claim' END,
             refresh.updatedAt = $now,
             ic.currentStatus = 'ISSUED', ic.isAccepted = $accepted, ic.finalizedAt = $now,
             ic.credential = null, ic.credentialName = null, ic.achievementType = null,
             ic.deliveryCredential = $deliveryCredential, ic.deliveryRecipientDid = $holderDid,
             ic.deliveryExpiresAt = $deliveryExpiresAt
         RETURN root.id AS id`,
        {
            ...params,
            now,
            holderProfileId: params.holderProfileId ?? null,
            boostId: params.boostId ?? null,
            deliveryTarget: params.holderProfileId ?? params.holderDid,
        }
    );
    return result.records.length > 0;
};

/** A read snapshot under the same inbox lock used by publish/claim, preventing mixed revisions. */
export const getInboxRefreshSnapshot = async (inboxId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh)-[:INBOX]->(ic:InboxCredential {id: $inboxId})
         SET ic._escrowLock = true REMOVE ic._escrowLock
         RETURN ic, refresh LIMIT 1`,
        { inboxId }
    );
    const row = result.records[0];
    if (!row) return null;
    const props = row.get('refresh').properties;
    return {
        inbox: inflateObject<InboxCredentialType>(row.get('ic').properties),
        aggregate: CredentialRefreshRecordValidator.parse({
            ...props,
            currentVersion: Number(props.currentVersion),
        }),
    };
};

export const recordInboxRefreshClaimUrl = async (id: string, claimUrl: string): Promise<string> => {
    const result = await neogma.queryRunner.run(
        `MATCH (ic:InboxCredential {id: $id})
         SET ic.refreshClaimUrl = coalesce(ic.refreshClaimUrl, $claimUrl)
         RETURN ic.refreshClaimUrl AS claimUrl`,
        { id, claimUrl }
    );
    return result.records[0]!.get('claimUrl');
};
