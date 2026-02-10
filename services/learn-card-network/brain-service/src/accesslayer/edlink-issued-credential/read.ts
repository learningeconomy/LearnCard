import { int } from 'neo4j-driver';

import { neogma } from '@instance';
import { EdlinkIssuedCredential, EdlinkIssuedCredentialInstance } from '@models';

/**
 * Check if a credential has already been issued for a specific submission.
 * Used for deduplication during polling.
 */
export const hasSubmissionBeenIssued = async (
    connectionId: string,
    submissionId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `
        MATCH (c:EdlinkConnection {id: $connectionId})<-[:ISSUED_FROM]-(i:EdlinkIssuedCredential {submissionId: $submissionId})
        RETURN i.id AS id
        LIMIT 1
        `,
        { connectionId, submissionId }
    );
    return result.records.length > 0;
};

/**
 * Get all issued credentials for a connection.
 */
export const getIssuedCredentialsForConnection = async (
    connectionId: string,
    options?: { limit?: number; offset?: number }
): Promise<EdlinkIssuedCredentialInstance[]> => {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    const result = await neogma.queryRunner.run(
        `
        MATCH (c:EdlinkConnection {id: $connectionId})<-[:ISSUED_FROM]-(i:EdlinkIssuedCredential)
        RETURN i
        ORDER BY i.issuedAt DESC
        SKIP $offset
        LIMIT $limit
        `,
        { connectionId, offset: int(offset), limit: int(limit) }
    );

    return result.records.map(record => {
        return EdlinkIssuedCredential.buildFromRecord(record.get('i'));
    });
};

/**
 * Count issued credentials for a connection.
 */
export const countIssuedCredentialsForConnection = async (
    connectionId: string
): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `
        MATCH (c:EdlinkConnection {id: $connectionId})<-[:ISSUED_FROM]-(i:EdlinkIssuedCredential)
        RETURN count(i) AS count
        `,
        { connectionId }
    );
    return result.records[0]?.get('count')?.toNumber() ?? 0;
};

/**
 * Get issued credential by ID.
 */
export const getEdlinkIssuedCredentialById = async (
    id: string
): Promise<EdlinkIssuedCredentialInstance | null> => {
    return EdlinkIssuedCredential.findOne({ where: { id } });
};
