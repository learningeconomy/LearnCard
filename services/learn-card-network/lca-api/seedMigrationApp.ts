import type { Context } from 'aws-lambda';
import { z } from 'zod';
import { environment } from './src/config/environment';
import { client, mongodb } from './src/mongo';
import { runSeedMigrationBatch, SeedMigrationError } from './src/migrations/signingAuthoritySeeds';
import type { SeedMigrationResult } from './src/types/seed-migration';

const requestValidator = z
    .object({
        phase: z.enum(['dry-run', 'prepare', 'verify', 'purge']),
        batchSize: z.number().int().min(1).max(100).optional(),
    })
    .strict();

/** IAM invocation only. Never accept seeds, database URLs, key ARNs, or arbitrary queries in events. */
export const handler = async (event: unknown, context: Context): Promise<SeedMigrationResult> => {
    const parsed = requestValidator.safeParse(event);
    if (!parsed.success) throw new SeedMigrationError('invalid_request');
    context.callbackWaitsForEmptyEventLoop = false;
    let result: SeedMigrationResult;
    let cleanupFailed = false;
    try {
        await client.connect();
        result = await runSeedMigrationBatch(mongodb, parsed.data, {
            encryptedWritesEnabled: environment.SA_SEED_ENCRYPT_WRITES,
            remainingTime: () => context.getRemainingTimeInMillis(),
        });
    } catch (error) {
        // Mongo connection/lease errors can contain URLs or query values. Never let Lambda serialize them.
        throw new SeedMigrationError(
            error instanceof SeedMigrationError ? error.category : 'operation_failed'
        );
    } finally {
        // This private worker releases its pool between batches, including failed connections.
        // The module-level client reconnects when a warm invocation starts its next batch.
        try {
            await client.close();
        } catch {
            cleanupFailed = true;
            console.error({
                event: 'signing_authority_seed_migration_failure',
                operation: 'migration_connection_cleanup',
                category: 'operation_failed',
            });
        }
    }
    // Reached only after a successful batch; never mask its original failure in finally.
    if (cleanupFailed) throw new SeedMigrationError('operation_failed');
    return result;
};
