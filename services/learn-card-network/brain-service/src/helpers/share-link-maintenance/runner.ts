import type {
    CleanupRunnerDependencies,
    RecoveryRunnerDependencies,
} from '../share-link-coordinator';
import { runShareContentCleanupOnce } from '../share-link-coordinator/cleanup-runner';
import { budgetAllows } from '../share-link-coordinator/budget-helpers';
import { runShareLinkRecoveryOnce } from '../share-link-coordinator/recovery-runner';
import type { ShareContentClient } from '../share-content-client/types';
import type { PruneShareViewReceiptsInput } from '../../accesslayer/share-link/types';
import {
    createMaintenancePassBudget,
    resolveMaintenanceBudgetMs,
    type MaintenancePassBudget,
} from './budget';
import { safeLogMaintenance } from './telemetry';
import type {
    ShareLinkMaintenanceConfig,
    ShareLinkMaintenanceFailureCategory,
    ShareLinkMaintenanceLogger,
    ShareLinkMaintenanceRunSummary,
} from './types';

export type ShareLinkMaintenanceRunnerDependencies = {
    config: ShareLinkMaintenanceConfig;
    recoveryRepository: RecoveryRunnerDependencies['repository'];
    cleanupRepository: CleanupRunnerDependencies['repository'];
    /**
     * Namespace-scoped, bounded receipt prune. Injected so DB-free unit tests
     * never load the Neo4j `@instance`; production passes the real repository.
     */
    pruneReceipts: (input: PruneShareViewReceiptsInput) => Promise<number>;
    client: Pick<ShareContentClient, 'stat' | 'delete'>;
    logger: ShareLinkMaintenanceLogger;
    /** Monotonic clock for the cooperative budget; injectable for tests. */
    monotonicNow?: () => number;
    /** Wall clock passed through to the repositories; production omits it. */
    now?: () => Date;
    /**
     * Optional Lambda remaining-time source, in milliseconds. Ignored when a
     * pre-started `budget` is supplied.
     */
    remainingTimeMs?: () => number;
    /**
     * Optional budget already started by the runtime BEFORE dependency
     * initialization. Reused so a slow cold start consumes the invocation
     * deadline rather than receiving a fresh post-setup budget.
     */
    budget?: MaintenancePassBudget;
};

/**
 * Bounded graph cost of the very first recovery stage (discovery read). If this
 * does not fit, neither recovery nor cleanup can start.
 */
const recoveryDiscoveryCostMs = (config: ShareLinkMaintenanceConfig): number =>
    config.graphTimeoutMs;

/**
 * Worst-case bounded cost of one whole cleanup unit:
 *   claim (graph) + delete (HTTP) + complete (graph).
 */
const cleanupUnitCostMs = (config: ShareLinkMaintenanceConfig): number =>
    config.requestTimeoutMs + 2 * config.graphTimeoutMs;

/**
 * Bounded cost of one namespace-scoped receipt-prune read transaction.
 */
const receiptPruneCostMs = (config: ShareLinkMaintenanceConfig): number => config.graphTimeoutMs;

/**
 * One bounded maintenance invocation: namespace-scoped recovery followed by
 * namespace-scoped cleanup, each with its own count limit and a shared elapsed
 * deadline.
 *
 * The deadline is cooperative (see `createMaintenancePassBudget`): it is checked
 * before every claim, never enforced with `Promise.race`, so a remote delete or
 * graph mutation that has already started is always awaited to a tracked result.
 * Admission requires the remaining time to cover the whole next unit — the
 * claim, the bounded HTTP call and the finalizing graph write — plus the
 * finalization/telemetry reserve. The HTTP allowance is fixed when the transport
 * client is built, so it cannot be shrunk per call; graph transaction timeouts
 * are dynamically capped to the time actually left.
 *
 * Every failure is folded into a fixed category; the summary exposes aggregate
 * counts and durations only.
 */
export const runShareLinkMaintenancePass = async (
    dependencies: ShareLinkMaintenanceRunnerDependencies
): Promise<ShareLinkMaintenanceRunSummary> => {
    const { config, logger } = dependencies;

    const budget =
        dependencies.budget ??
        createMaintenancePassBudget({
            budgetMs: resolveMaintenanceBudgetMs(config.budgetMs, dependencies.remainingTimeMs?.()),
            finalizeReserveMs: config.finalizeReserveMs,
            monotonicNow: dependencies.monotonicNow,
        });

    const categories: Partial<Record<ShareLinkMaintenanceFailureCategory, number>> = {};

    if (budget.exhausted()) {
        const summary: ShareLinkMaintenanceRunSummary = {
            status: 'deadline_exhausted',
            durationMs: budget.elapsedMs(),
            budgetMs: budget.configuredMs,
            recovery: null,
            cleanup: null,
            receiptPrune: null,
            categories,
        };

        safeLogMaintenance(logger, summary);

        return summary;
    }

    let recovery: ShareLinkMaintenanceRunSummary['recovery'] = null;
    let cleanup: ShareLinkMaintenanceRunSummary['cleanup'] = null;
    let receiptPrune: ShareLinkMaintenanceRunSummary['receiptPrune'] = null;
    let recoveryAttempted = false;
    let cleanupAttempted = false;
    let receiptPruneAttempted = false;
    let budgetStoppedRecovery = false;
    let budgetStoppedCleanup = false;
    let budgetStoppedReceiptPrune = false;

    if (budgetAllows(budget, recoveryDiscoveryCostMs(config))) {
        recoveryAttempted = true;

        try {
            recovery = await runShareLinkRecoveryOnce({
                repository: dependencies.recoveryRepository,
                client: dependencies.client,
                claimant: config.claimant,
                namespace: config.namespace,
                limit: config.recoveryLimit,
                leaseMs: config.leaseMs,
                budget,
                transactionTimeoutMs: config.graphTimeoutMs,
                requestTimeoutMs: config.requestTimeoutMs,
                noInlineRetry: true,
                now: dependencies.now,
            });
        } catch {
            categories.share_link_maintenance_recovery_failed = 1;
        }
    } else {
        budgetStoppedRecovery = true;
    }

    if (budgetAllows(budget, cleanupUnitCostMs(config))) {
        cleanupAttempted = true;

        try {
            cleanup = await runShareContentCleanupOnce({
                repository: dependencies.cleanupRepository,
                client: dependencies.client,
                claimant: config.claimant,
                namespace: config.namespace,
                limit: config.cleanupLimit,
                claimMs: config.claimMs,
                // One job per claim so a lapsed deadline can never strand a batch.
                claimBatchSize: 1,
                transactionTimeoutMs: config.graphTimeoutMs,
                requestTimeoutMs: config.requestTimeoutMs,
                noInlineRetry: true,
                budget,
                now: dependencies.now,
            });
        } catch {
            categories.share_link_maintenance_cleanup_failed = 1;
        }
    } else {
        budgetStoppedCleanup = true;
    }

    if (budgetAllows(budget, receiptPruneCostMs(config))) {
        receiptPruneAttempted = true;

        try {
            const pruned = await dependencies.pruneReceipts({
                namespace: config.namespace,
                limit: config.receiptPruneLimit,
                now: dependencies.now?.(),
                // One bounded explicit read transaction, no inline retry: the
                // scheduler cadence owns retry.
                transaction: { timeoutMs: config.graphTimeoutMs, noInlineRetry: true },
            });
            receiptPrune = { pruned };
        } catch {
            categories.share_link_maintenance_receipt_prune_failed = 1;
        }
    } else {
        budgetStoppedReceiptPrune = true;
    }

    const failed =
        (recoveryAttempted && recovery === null) ||
        (cleanupAttempted && cleanup === null) ||
        (receiptPruneAttempted && receiptPrune === null);
    const deadlineStopped =
        budgetStoppedRecovery || budgetStoppedCleanup || budgetStoppedReceiptPrune;
    const status = failed
        ? 'failed'
        : budget.exhausted() || deadlineStopped
          ? 'deadline_exhausted'
          : 'completed';

    const summary: ShareLinkMaintenanceRunSummary = {
        status,
        durationMs: budget.elapsedMs(),
        budgetMs: budget.configuredMs,
        recovery,
        cleanup,
        receiptPrune,
        categories,
    };

    safeLogMaintenance(logger, summary);

    return summary;
};
