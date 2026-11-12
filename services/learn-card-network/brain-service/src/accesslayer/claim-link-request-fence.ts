import { randomUUID } from 'node:crypto';
import type { Transaction } from 'neo4j-driver';

/** Hold the receipt lock until delivery commits, so recovery cannot race a late writer. */
export const lockClaimLinkRequestForStorage = async (
    tx: Pick<Transaction, 'run'>,
    credentialId: string,
    ownerToken: string
): Promise<void> => {
    const result = await tx.run(
        `MATCH (r:ClaimLinkRequest {id: $credentialId})
         SET r.storageLock = true
         REMOVE r.storageLock
         WITH r WHERE r.ownerToken = $ownerToken AND r.status = 'pending'
             AND r.handlerActive = true
         RETURN r.id AS id`,
        { credentialId, ownerToken }
    );
    if (result.records.length !== 1) throw new Error('Claim-link writer has been fenced');
};

/**
 * Operator-only recovery after claim/status handlers have been quiesced. The same
 * lock as storage establishes its outcome even when a commit acknowledgement was lost.
 * Never expose this as an age-based takeover or as a public endpoint: acceptance hooks
 * outside the storage transaction must also have stopped before releasing their owner.
 */
export const reconcileClaimLinkRequestForOperator = async (
    tx: Pick<Transaction, 'run'>,
    id: string,
    expectedOwnerToken: string
): Promise<'retryable' | 'stored' | 'unchanged'> => {
    const locked = await tx.run(
        `MATCH (r:ClaimLinkRequest {id: $id})
         SET r.storageLock = true
         REMOVE r.storageLock
         WITH r WHERE r.ownerToken = $expectedOwnerToken AND r.status = 'pending'
         RETURN r.credentialId AS credentialId`,
        { id, expectedOwnerToken }
    );
    if (locked.records.length !== 1) return 'unchanged';
    const credentialId = locked.records[0]!.get('credentialId') as string;
    const stored = await tx.run('MATCH (c:Credential {id: $credentialId}) RETURN c.id', {
        credentialId,
    });
    if (!stored.records.length) {
        // The old token no longer exists. Re-reservation uses a fresh token, so a
        // signing request that returns later cannot persist even with the same ID.
        await tx.run('MATCH (r:ClaimLinkRequest {id: $id}) DELETE r', { id });
        return 'retryable';
    }
    await tx.run(
        `MATCH (r:ClaimLinkRequest {id: $id})
         SET r.ownerToken = $fencedOwnerToken, r.handlerActive = false,
             r.operatorReconciledAt = timestamp()`,
        { id, fencedOwnerToken: randomUUID() }
    );
    return 'stored';
};
