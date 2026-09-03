import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';
import {
    AdvanceCredentialRefreshHeadParams,
    AdvanceCredentialRefreshHeadParamsValidator,
    AdvanceCredentialRefreshHeadResult,
    CredentialRefreshRecord,
    CredentialRefreshRecordValidator,
    CredentialRefreshState,
} from 'types/credential-refresh';

/** Converts neo4j-driver Integer objects to plain numbers before validation */
const normalizeProps = (props: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(props).map(([key, value]) => [
            key,
            value &&
            typeof value === 'object' &&
            typeof (value as { toNumber?: () => number }).toNumber === 'function'
                ? (value as { toNumber: () => number }).toNumber()
                : value,
        ])
    );

const getRecord = async (refreshId: string): Promise<CredentialRefreshRecord | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (refresh:CredentialRefresh {refreshId: $refreshId}) RETURN refresh LIMIT 1',
        { refreshId }
    );

    const node = result.records[0]?.get('refresh');

    if (!node) return null;

    return CredentialRefreshRecordValidator.parse(normalizeProps(node.properties));
};

const isUniqueConstraintViolation = (error: unknown): boolean => {
    const code = (error as { code?: string })?.code;

    return (
        code === 'Neo.ClientError.Schema.ConstraintValidationFailed' ||
        (error instanceof Error && error.message.includes('already exists'))
    );
};

/**
 * Optimistic transactional compare-and-advance.
 *
 * In a single Cypher statement (one auto-committed transaction) this:
 *   1. Requires the aggregate's currentVersion to still equal the expectedVersion the
 *      caller read before preparing the publication.
 *   2. Creates the immutable new Credential version node (holder-encrypted JWE JSON
 *      only) and the REFRESHED_TO edge from the previous head.
 *   3. Moves HEAD and bumps currentVersion/etag/digest/idempotency metadata.
 *
 * The per-aggregate unique `refreshVersionKey` (`refreshId:version`) on the new node
 * is the hard single-writer guarantee: a concurrent loser fails with a constraint
 * violation and its whole statement rolls back, so HEAD can never fork.
 *
 * Idempotency: the key that produced the current version is stored on the aggregate.
 * A retry with the same key short-circuits and returns the prior successful result.
 */
export const advanceCredentialRefreshHead = async (
    params: AdvanceCredentialRefreshHeadParams
): Promise<AdvanceCredentialRefreshHeadResult> => {
    const validated = AdvanceCredentialRefreshHeadParamsValidator.parse(params);

    const {
        refreshId,
        expectedVersion,
        encryptedCredential,
        signingMode,
        idempotencyKey,
        etag,
        materialDigest,
        updateSummary,
        effectiveAt,
    } = validated;

    const publishedAt = validated.publishedAt ?? new Date().toISOString();
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;

    const versionProps = Object.fromEntries(
        Object.entries({
            id: uuid(),
            credential: encryptedCredential,
            refreshId,
            version: nextVersion,
            refreshVersionKey: `${refreshId}:${nextVersion}`,
            publishedAt,
            effectiveAt,
            etag,
            signingMode,
            updateSummary,
        }).filter(([, value]) => value !== undefined)
    );

    try {
        const result = await neogma.queryRunner.run(
            `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
             WHERE refresh.currentVersion = $expectedVersion
               AND ($idempotencyKey IS NULL
                    OR refresh.idempotencyKey IS NULL
                    OR refresh.idempotencyKey <> $idempotencyKey)
             MATCH (refresh)-[oldHead:HEAD]->(prev:Credential)
             CREATE (next:Credential $versionProps)
             CREATE (prev)-[:REFRESHED_TO]->(next)
             DELETE oldHead
             CREATE (refresh)-[:HEAD]->(next)
             SET refresh.currentVersion = $nextVersion,
                 refresh.etag = $etag,
                 refresh.materialDigest = $materialDigest,
                 refresh.updateSummary = $updateSummary,
                 refresh.signingMode = $signingMode,
                 refresh.lastPublishedAt = $publishedAt,
                 refresh.idempotencyKey = $idempotencyKey,
                 refresh.updatedAt = $now
             RETURN refresh.currentVersion AS version`,
            {
                refreshId,
                expectedVersion,
                idempotencyKey: idempotencyKey ?? null,
                versionProps,
                nextVersion,
                etag: etag ?? null,
                materialDigest: materialDigest ?? null,
                updateSummary: updateSummary ?? null,
                signingMode,
                publishedAt,
                now,
            }
        );

        if (result.records.length > 0) {
            return { status: 'advanced', refreshId, version: nextVersion, publishedAt };
        }
    } catch (error) {
        if (!isUniqueConstraintViolation(error)) throw error;
        // A concurrent writer created this version first — fall through to the
        // idempotency/conflict resolution below.
    }

    // Nothing was written (stale expectedVersion, lost race, or idempotent retry).
    // Re-read the aggregate to distinguish replay from conflict.
    const current = await getRecord(refreshId);

    if (
        current &&
        idempotencyKey &&
        current.idempotencyKey === idempotencyKey &&
        current.currentVersion === nextVersion
    ) {
        return {
            status: 'replay',
            refreshId,
            version: current.currentVersion,
            publishedAt: current.lastPublishedAt,
        };
    }

    return {
        status: 'conflict',
        refreshId,
        version: current?.currentVersion ?? 0,
    };
};

/** Transitions the aggregate lifecycle state (awaiting_claim → active → revoked). */
export const setCredentialRefreshState = async (
    refreshId: string,
    state: CredentialRefreshState
): Promise<CredentialRefreshRecord | null> => {
    const now = new Date().toISOString();

    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
         SET refresh.state = $state, refresh.updatedAt = $now
         RETURN refresh`,
        { refreshId, state, now }
    );

    const node = result.records[0]?.get('refresh');

    if (!node) return null;

    return CredentialRefreshRecordValidator.parse(normalizeProps(node.properties));
};
