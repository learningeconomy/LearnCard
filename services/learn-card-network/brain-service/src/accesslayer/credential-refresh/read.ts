import { int } from 'neo4j-driver';

import { neogma } from '@instance';
import {
    CredentialRefreshRecord,
    CredentialRefreshRecordValidator,
    CredentialRefreshVersionNode,
    CredentialRefreshVersionNodeValidator,
    CredentialRefreshVersionRecord,
    CredentialRefreshVersionRecordValidator,
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

/** Fetches the aggregate metadata for a refreshId, or null when it does not exist. */
export const getCredentialRefresh = async (
    refreshId: string
): Promise<CredentialRefreshRecord | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (refresh:CredentialRefresh {refreshId: $refreshId}) RETURN refresh LIMIT 1',
        { refreshId }
    );

    const node = result.records[0]?.get('refresh');

    if (!node) return null;

    return CredentialRefreshRecordValidator.parse(normalizeProps(node.properties));
};

/** Fetches the current head version node (including its holder-encrypted JWE payload). */
export const getCredentialRefreshHead = async (
    refreshId: string
): Promise<CredentialRefreshVersionNode | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:HEAD]->(head:Credential)
         RETURN head LIMIT 1`,
        { refreshId }
    );

    const node = result.records[0]?.get('head');

    if (!node) return null;

    return CredentialRefreshVersionNodeValidator.parse(normalizeProps(node.properties));
};

export type GetCredentialRefreshVersionsOptions = {
    /** Opaque cursor from a previous page (encodes the last seen version) */
    cursor?: string;
    limit?: number;
};

export type GetCredentialRefreshVersionsResult = {
    records: CredentialRefreshVersionRecord[];
    hasMore: boolean;
    cursor?: string;
};

/**
 * Lists metadata-only version history for an aggregate, newest first. The encrypted
 * payload is never selected — history exposes version metadata exclusively.
 */
export const getCredentialRefreshVersions = async (
    refreshId: string,
    options: GetCredentialRefreshVersionsOptions = {}
): Promise<GetCredentialRefreshVersionsResult> => {
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);

    let beforeVersion: number | undefined;

    if (options.cursor) {
        const decoded = Number(Buffer.from(options.cursor, 'base64url').toString('utf8'));

        if (!Number.isInteger(decoded) || decoded < 1) throw new Error('Invalid cursor');

        beforeVersion = decoded;
    }

    const result = await neogma.queryRunner.run(
        `MATCH (version:Credential {refreshId: $refreshId})
         WHERE $beforeVersion IS NULL OR version.version < $beforeVersion
         RETURN {
             id: version.id,
             refreshId: version.refreshId,
             version: version.version,
             refreshVersionKey: version.refreshVersionKey,
             publishedAt: version.publishedAt,
             effectiveAt: version.effectiveAt,
             etag: version.etag,
             signingMode: version.signingMode,
             updateSummary: version.updateSummary
         } AS metadata
         ORDER BY version.version DESC
         LIMIT $limitPlusOne`,
        { refreshId, beforeVersion: beforeVersion ?? null, limitPlusOne: int(limit + 1) }
    );

    const rows = result.records.map(record =>
        CredentialRefreshVersionRecordValidator.parse(
            Object.fromEntries(
                Object.entries(
                    normalizeProps(record.get('metadata') as Record<string, unknown>)
                ).filter(([, value]) => value !== null && value !== undefined)
            )
        )
    );

    const hasMore = rows.length > limit;
    const records = hasMore ? rows.slice(0, limit) : rows;
    const last = records[records.length - 1];

    return {
        records,
        hasMore,
        cursor:
            hasMore && last ? Buffer.from(String(last.version)).toString('base64url') : undefined,
    };
};
