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

/** Fetches one immutable version node (including its holder-encrypted JWE payload). */
export const getCredentialRefreshVersion = async (
    refreshId: string,
    version: number
): Promise<CredentialRefreshVersionNode | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (version:Credential {refreshVersionKey: $refreshVersionKey})
         RETURN version LIMIT 1`,
        { refreshVersionKey: `${refreshId}:${version}` }
    );

    const node = result.records[0]?.get('version');

    if (!node) return null;

    return CredentialRefreshVersionNodeValidator.parse(normalizeProps(node.properties));
};

/** Looks up the immutable version created by a historical publication key. */
export const getCredentialRefreshVersionByIdempotencyKey = async (
    refreshId: string,
    idempotencyKey: string
): Promise<CredentialRefreshVersionNode | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (version:Credential {refreshIdempotencyKey: $refreshIdempotencyKey})
         RETURN version LIMIT 1`,
        { refreshIdempotencyKey: `${refreshId}:${idempotencyKey}` }
    );
    const node = result.records[0]?.get('version');

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

export type CredentialRefreshHolderReadResult<T> =
    { status: 'available'; value: T } | { status: 'revoked' } | { status: 'not-found' };

const CANONICAL_REVOCATION_EXPRESSION = `
    refresh.state = 'revoked'
    OR EXISTS {
        MATCH (sender)-[sent:CREDENTIAL_SENT]->(root)
        WHERE (sender:Profile OR sender:AppStoreListing)
          AND sent.to = refresh.holderProfileId
          AND sent.status = 'revoked'
    }
    OR EXISTS {
        MATCH (root)-[received:CREDENTIAL_RECEIVED]->(holder:Profile)
        WHERE holder.profileId = refresh.holderProfileId
          AND received.status = 'revoked'
    }
`;

/** Atomically selects the current holder payload only while canonical state is non-revoked. */
export const getCredentialRefreshHeadForHolder = async (
    refreshId: string
): Promise<CredentialRefreshHolderReadResult<CredentialRefreshVersionNode>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         WITH refresh, root, (${CANONICAL_REVOCATION_EXPRESSION}) AS revoked
         OPTIONAL MATCH (refresh)-[:HEAD]->(head:Credential)
         WHERE NOT revoked
         RETURN revoked, head LIMIT 1`,
        { refreshId }
    );
    const row = result.records[0];

    if (!row) return { status: 'not-found' };
    if (row.get('revoked')) return { status: 'revoked' };

    const node = row.get('head');
    if (!node) return { status: 'not-found' };

    return {
        status: 'available',
        value: CredentialRefreshVersionNodeValidator.parse(normalizeProps(node.properties)),
    };
};

/** Atomically selects one historical holder payload only while canonical state is non-revoked. */
export const getCredentialRefreshVersionForHolder = async (
    refreshId: string,
    version: number
): Promise<CredentialRefreshHolderReadResult<CredentialRefreshVersionNode>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         WITH refresh, root, (${CANONICAL_REVOCATION_EXPRESSION}) AS revoked
         OPTIONAL MATCH (version:Credential {refreshVersionKey: $refreshVersionKey})
         WHERE NOT revoked
         RETURN revoked, version LIMIT 1`,
        { refreshId, refreshVersionKey: `${refreshId}:${version}` }
    );
    const row = result.records[0];

    if (!row) return { status: 'not-found' };
    if (row.get('revoked')) return { status: 'revoked' };

    const node = row.get('version');
    if (!node) return { status: 'not-found' };

    return {
        status: 'available',
        value: CredentialRefreshVersionNodeValidator.parse(normalizeProps(node.properties)),
    };
};

/** Atomically selects holder history metadata only while canonical state is non-revoked. */
export const getCredentialRefreshVersionsForHolder = async (
    refreshId: string,
    options: GetCredentialRefreshVersionsOptions = {}
): Promise<CredentialRefreshHolderReadResult<GetCredentialRefreshVersionsResult>> => {
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    let beforeVersion: number | undefined;

    if (options.cursor) {
        const decoded = Number(Buffer.from(options.cursor, 'base64url').toString('utf8'));
        if (!Number.isInteger(decoded) || decoded < 1) throw new Error('Invalid cursor');
        beforeVersion = decoded;
    }

    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         WITH refresh, root, (${CANONICAL_REVOCATION_EXPRESSION}) AS revoked
         OPTIONAL MATCH (version:Credential {refreshId: $refreshId})
         WHERE NOT revoked AND ($beforeVersion IS NULL OR version.version < $beforeVersion)
         WITH revoked, version
         ORDER BY version.version DESC
         WITH revoked, [entry IN collect(CASE WHEN version IS NULL THEN null ELSE {
             id: version.id,
             refreshId: version.refreshId,
             version: version.version,
             refreshVersionKey: version.refreshVersionKey,
             publishedAt: version.publishedAt,
             effectiveAt: version.effectiveAt,
             etag: version.etag,
             signingMode: version.signingMode,
             updateSummary: version.updateSummary
         } END) WHERE entry IS NOT NULL][0..$limitPlusOne] AS metadata
         RETURN revoked, metadata`,
        { refreshId, beforeVersion: beforeVersion ?? null, limitPlusOne: int(limit + 1) }
    );
    const row = result.records[0];

    if (!row) return { status: 'not-found' };
    if (row.get('revoked')) return { status: 'revoked' };

    const rows = (row.get('metadata') as Record<string, unknown>[]).map(metadata =>
        CredentialRefreshVersionRecordValidator.parse(
            Object.fromEntries(
                Object.entries(normalizeProps(metadata)).filter(
                    ([, value]) => value !== null && value !== undefined
                )
            )
        )
    );
    const hasMore = rows.length > limit;
    const records = hasMore ? rows.slice(0, limit) : rows;
    const last = records[records.length - 1];

    return {
        status: 'available',
        value: {
            records,
            hasMore,
            cursor:
                hasMore && last
                    ? Buffer.from(String(last.version)).toString('base64url')
                    : undefined,
        },
    };
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

export type CredentialRefreshCanonicalLifecycle = {
    /** The holder has a canonical CREDENTIAL_RECEIVED relationship to the root credential */
    received: boolean;
    /** The canonical CREDENTIAL_SENT or CREDENTIAL_RECEIVED relationship is revoked */
    revoked: boolean;
};

/**
 * Reads the canonical claim/revocation lifecycle for an aggregate from the credential
 * relationships on the ROOT credential node — never from the aggregate itself.
 *
 * The holder endpoint cross-checks this on every authenticated request so serving
 * never depends solely on the aggregate's cached lifecycle state (which may lag
 * behind a failed activation or revocation write).
 */
export const getCredentialRefreshCanonicalLifecycle = async (
    refreshId: string
): Promise<CredentialRefreshCanonicalLifecycle | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         OPTIONAL MATCH (root)-[received:CREDENTIAL_RECEIVED]->(holder:Profile)
         WHERE holder.profileId = refresh.holderProfileId
         OPTIONAL MATCH (sender)-[sent:CREDENTIAL_SENT]->(root)
         WHERE (sender:Profile OR sender:AppStoreListing) AND sent.to = refresh.holderProfileId
         RETURN {
             received: count(DISTINCT received) > 0,
             revoked: any(status IN collect(DISTINCT received.status) WHERE status = 'revoked')
                  OR any(status IN collect(DISTINCT sent.status) WHERE status = 'revoked')
         } AS lifecycle`,
        { refreshId }
    );

    const row = result.records[0]?.get('lifecycle');

    if (!row) return null;

    return { received: Boolean(row.received), revoked: Boolean(row.revoked) };
};
