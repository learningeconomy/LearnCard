import { neogma } from '@instance';

import { ShareLinkRepositoryError } from './errors';
import {
    executeExplicitTransaction,
    resolveTransactionConfig,
    type TransactionSession,
} from './transaction-execution';

/** Neo4j signals a uniqueness race as a client error; map it to a typed conflict. */
const isNeo4jConstraintViolation = (error: unknown): boolean => {
    const code = (error as { code?: string } | undefined)?.code;

    return (
        code === 'Neo.ClientError.Schema.ConstraintValidationFailed' ||
        code === 'Neo.ClientError.Statement.ConstraintVerificationFailed'
    );
};

/** Minimal structural result shape used by the lifecycle Cypher helpers. */
export type Neo4jQueryResult = {
    records: Array<{
        get: (key: string) => unknown;
    }>;
};

/** The subset of the neo4j-driver transaction API the repository depends on. */
export interface ShareLinkTransaction {
    run: (query: string, params?: Record<string, unknown>) => Promise<Neo4jQueryResult>;
}

/**
 * Narrow, opt-in transaction bounds.
 *
 * When omitted (every existing caller), the managed write transaction keeps the
 * driver defaults exactly as before. A maintenance caller may set `timeoutMs` so
 * a single transaction cannot outlive its declared pass budget; it does not
 * change the retry behaviour or any other caller.
 */
export type ShareLinkTransactionOptions = {
    /** Neo4j managed-transaction timeout in milliseconds. */
    timeoutMs?: number;
    /**
     * Maintenance-only mode: run a single explicit transaction with the supplied
     * timeout and NO driver-managed inline retry. Ordinary callers omit this and
     * keep the existing managed retry defaults; a maintenance pass leaves retry to
     * the next scheduler cadence.
     */
    noInlineRetry?: boolean;
};

/**
 * Runs a read unit either through the shared auto-commit query runner (ordinary
 * callers, unchanged) or, when a maintenance bound is supplied, through a single
 * explicit read transaction with that timeout. No inline retry is used in the
 * bounded path.
 */
export const withShareLinkRead = async <T>(
    work: (runner: ShareLinkTransaction) => Promise<T>,
    options?: ShareLinkTransactionOptions
): Promise<T> => {
    if (options?.noInlineRetry !== true && options?.timeoutMs === undefined) {
        return work(neogma.queryRunner as unknown as ShareLinkTransaction);
    }

    const session = neogma.queryRunner.getDriver().session();

    try {
        return await executeExplicitTransaction<T>(
            session as unknown as TransactionSession,
            tx => work(tx as unknown as ShareLinkTransaction),
            options?.timeoutMs
        );
    } finally {
        await session.close();
    }
};

/**
 * Runs a unit of share-link lifecycle work inside one managed Neo4j write transaction.
 *
 * The repository deliberately uses a managed write transaction rather than a sequence
 * of auto-committed statements: the share write lock acquired by the first
 * statement must cover every subsequent read of status/version/reservation state
 * and the final writes. A rollback aborts the whole unit, so a partial finalize
 * (metadata swapped without the cleanup job, or vice versa) is impossible.
 *
 * Reads that only need a committed snapshot use the auto-committed `queryRunner`
 * helpers instead; this wrapper is for mutations.
 */
export const withShareLinkTransaction = async <T>(
    work: (tx: ShareLinkTransaction) => Promise<T>,
    options?: ShareLinkTransactionOptions
): Promise<T> => {
    const session = neogma.queryRunner.getDriver().session();
    try {
        if (options?.noInlineRetry === true) {
            // One explicit, bounded attempt with no inline retry.
            return await executeExplicitTransaction<T>(
                session as unknown as TransactionSession,
                tx => work(tx as unknown as ShareLinkTransaction),
                options.timeoutMs
            );
        }

        // Managed writes retry transient Neo4j deadlocks. Callback work must be
        // graph-local: no remote uploads or deletes inside the transaction.
        const transactionConfig = resolveTransactionConfig(options?.timeoutMs);

        return await session.executeWrite(
            tx => work(tx as unknown as ShareLinkTransaction),
            transactionConfig
        );
    } catch (error) {
        if (isNeo4jConstraintViolation(error)) {
            throw new ShareLinkRepositoryError(
                'CONFLICT',
                'a concurrent share-link write violated a uniqueness rule'
            );
        }

        throw error;
    } finally {
        await session.close();
    }
};
