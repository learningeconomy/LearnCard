import type { Driver } from 'neo4j-driver';
import { neogma } from '@instance';

const SCHEMA_QUERIES = [
    ...['InboxBatch', 'InboxBatchItem', 'InboxBatchIssuer', 'InboxBatchReplay'].map(
        label =>
            `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`
    ),
    'CREATE INDEX inbox_batch_request IF NOT EXISTS FOR (b:InboxBatch) ON (b.issuer, b.requestId)',
    'CREATE INDEX inbox_batch_dispatch IF NOT EXISTS FOR (i:InboxBatchItem) ON (i.state, i.dispatchAt)',
    'CREATE INDEX inbox_batch_recovery IF NOT EXISTS FOR (i:InboxBatchItem) ON (i.state, i.leaseUntil)',
    'CREATE INDEX inbox_batch_replay_owner IF NOT EXISTS FOR (r:InboxBatchReplay) ON (r.itemId)',
    'CREATE INDEX inbox_batch_completed IF NOT EXISTS FOR (b:InboxBatch) ON (b.completedAt)',
    'CREATE INDEX inbox_batch_replay_expiry IF NOT EXISTS FOR (r:InboxBatchReplay) ON (r.expiresAt)',
];

/** Each API/worker process shares readiness locally; the driver retries cross-process DDL deadlocks. */
export const createInboxBatchSchemaInitializer = (
    driver: Pick<Driver, 'session'>
): (() => Promise<void>) => {
    let readiness: Promise<void> | undefined;
    return (): Promise<void> => {
        if (!readiness) {
            const pending = (async (): Promise<void> => {
                const session = driver.session();
                try {
                    for (const query of SCHEMA_QUERIES) {
                        try {
                            // One schema statement per managed transaction. IF NOT EXISTS is
                            // idempotent, but competing cold processes can still deadlock while
                            // acquiring label locks. Auto-commit queryRunner.run does not retry.
                            await session.executeWrite(tx => tx.run(query));
                        } catch (error) {
                            if (
                                (error as { code?: string } | null)?.code !==
                                'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists'
                            )
                                throw error;
                        }
                    }
                } finally {
                    await session.close();
                }
            })();
            readiness = pending;
            void pending.catch(() => {
                if (readiness === pending) readiness = undefined;
            });
        }
        return readiness;
    };
};

export const ensureInboxBatchConstraints = createInboxBatchSchemaInitializer(neogma.driver);
