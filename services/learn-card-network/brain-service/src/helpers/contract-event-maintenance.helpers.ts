import { neogma } from '@instance';

export const contractEventMaintenanceSchema = [
    'CREATE CONSTRAINT consent_event_migration_id IF NOT EXISTS FOR (m:ConsentFlowEventMigration) REQUIRE m.id IS UNIQUE',
    'CREATE INDEX consent_event_cleanup IF NOT EXISTS FOR (e:ConsentFlowEvent) ON (e.cleanupPending)',
    'CREATE INDEX consent_delivery_due IF NOT EXISTS FOR (d:ConsentFlowEventDelivery) ON (d.state, d.nextAttemptAt)',
    'CREATE INDEX consent_delivery_age IF NOT EXISTS FOR (d:ConsentFlowEventDelivery) ON (d.state, d.eventCreatedAt)',
    'CREATE INDEX consent_delivery_attempts IF NOT EXISTS FOR (d:ConsentFlowEventDelivery) ON (d.state, d.attempts)',
];

let schemaReady: Promise<void> | undefined;

/** One-time backfill for pre-indexed outbox records; the unique marker serializes workers. */
export const ensureContractEventMaintenance = async (): Promise<void> => {
    schemaReady ??= (async (): Promise<void> => {
        for (const query of contractEventMaintenanceSchema) await neogma.queryRunner.run(query);
    })().catch(error => {
        schemaReady = undefined;
        throw error;
    });
    await schemaReady;
    await neogma.queryRunner.run(`
        MERGE (migration:ConsentFlowEventMigration {id: 'indexed-outbox-v1'})
        SET migration.lock = coalesce(migration.lock, 0) + 1
        WITH migration WHERE migration.completedAt IS NULL
        CALL {
            WITH migration
            MATCH (event:ConsentFlowEvent)
            WHERE event.payload IS NOT NULL OR event.message IS NOT NULL
            SET event.cleanupPending = true
            RETURN count(event) AS marked
        }
        CALL {
            WITH migration
            MATCH (event:ConsentFlowEvent)-[:HAS_DELIVERY]->(delivery:ConsentFlowEventDelivery)
            WHERE delivery.state = 'pending'
            SET delivery.eventCreatedAt = event.createdAt,
                delivery.attempts = coalesce(delivery.attempts, 0)
            RETURN count(delivery) AS updated
        }
        SET migration.completedAt = toString(datetime())
    `);
};
