import type {
    CleanupRunnerDependencies,
    RecoveryRunnerDependencies,
} from '../share-link-coordinator';
import type { PruneShareViewReceiptsInput } from '../../accesslayer/share-link/types';
import type { ShareContentClient } from '../share-content-client/types';
import { createMaintenancePassBudget, resolveMaintenanceBudgetMs } from './budget';
import { resolveShareLinkMaintenanceConfig } from './config';
import { runShareLinkMaintenancePass } from './runner';
import { safeLogMaintenance } from './telemetry';
import type {
    ShareLinkMaintenanceConfigResolution,
    ShareLinkMaintenanceLogger,
    ShareLinkMaintenanceRunSummary,
} from './types';

type MaintenanceClient = Pick<ShareContentClient, 'stat' | 'delete'>;

type ResolvedRunnerDependencies = {
    recoveryRepository: RecoveryRunnerDependencies['repository'];
    cleanupRepository: CleanupRunnerDependencies['repository'];
    pruneReceipts: (input: PruneShareViewReceiptsInput) => Promise<number>;
    client: MaintenanceClient;
};

type DependencySetup =
    | { status: 'ready'; dependencies: ResolvedRunnerDependencies }
    | { status: 'failed' }
    | { status: 'expired' };

export type ShareLinkMaintenanceRuntime = {
    /** Config outcome fixed at construction; never contains raw values. */
    readonly resolution: ShareLinkMaintenanceConfigResolution;
    runOnce: (options?: {
        /**
         * Live Lambda remaining-time source. A numeric value is accepted as a
         * backward-compatible test seam; production passes the live
         * `getRemainingTimeInMillis` callback.
         */
        remainingTimeMs?: number | (() => number);
    }) => Promise<ShareLinkMaintenanceRunSummary>;
};

export type CreateShareLinkMaintenanceRuntimeOptions = {
    rawEnvironment?: Record<string, unknown>;
    logger?: ShareLinkMaintenanceLogger;
    now?: () => Date;
    monotonicNow?: () => number;
    /** Test seam: resolve the transport client without dynamic imports. */
    createClient?: (
        config: Extract<ShareLinkMaintenanceConfigResolution, { status: 'enabled' }>['config']
    ) => Promise<MaintenanceClient>;
    /** Test seam: resolve the production repositories without loading Neo4j. */
    createRepositories?: (
        client: MaintenanceClient,
        config: Extract<ShareLinkMaintenanceConfigResolution, { status: 'enabled' }>['config']
    ) => Promise<{
        recoveryRepository: RecoveryRunnerDependencies['repository'];
        cleanupRepository: CleanupRunnerDependencies['repository'];
        pruneReceipts: ResolvedRunnerDependencies['pruneReceipts'];
    }>;
};

const inertSummary = (
    status: 'disabled' | 'invalid_configuration',
    categories: ShareLinkMaintenanceRunSummary['categories']
): ShareLinkMaintenanceRunSummary => ({
    status,
    durationMs: 0,
    budgetMs: 0,
    recovery: null,
    cleanup: null,
    receiptPrune: null,
    categories,
});

const deadlineSummary = (
    budget: ReturnType<typeof createMaintenancePassBudget>
): ShareLinkMaintenanceRunSummary => ({
    status: 'deadline_exhausted',
    durationMs: budget.elapsedMs(),
    budgetMs: budget.configuredMs,
    recovery: null,
    cleanup: null,
    receiptPrune: null,
    categories: {},
});

const initializationFailedSummary = (): ShareLinkMaintenanceRunSummary => ({
    status: 'initialization_failed',
    durationMs: 0,
    budgetMs: 0,
    recovery: null,
    cleanup: null,
    receiptPrune: null,
    categories: { share_link_maintenance_initialization_failed: 1 },
});

/** Sample a live remaining-time source once; fail closed on a bad value. */
const sampleRemainingMs = (source: number | (() => number) | undefined): number | undefined => {
    if (source === undefined) return undefined;

    let value: unknown;

    try {
        value = typeof source === 'function' ? source() : source;
    } catch {
        // A throwing Lambda context must not start work; fail closed.
        return 0;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;

    return value;
};

/**
 * Production composition for the share-link maintenance pass.
 *
 * Disabled or malformed configuration resolves to an inert runtime: `runOnce`
 * returns a fixed summary and never constructs the client, signer, repositories
 * or any graph/remote dependency. When enabled, composition is lazy on the first
 * invocation and reuses the existing did:web signing adapter with an explicitly
 * configured trusted origin/audience/opaque namespace. There is no unsigned or
 * fresh-key path.
 *
 * The invocation budget starts BEFORE dependency initialization: a cold start
 * consumes the same deadline as the work, and an already-exhausted invocation
 * performs no dependency/signer/graph setup at all. A successful setup is cached;
 * a failed or budget-aborted setup is cleared so the next cadence retries.
 */
export const createShareLinkMaintenanceRuntime = (
    options: CreateShareLinkMaintenanceRuntimeOptions = {}
): ShareLinkMaintenanceRuntime => {
    const resolution = resolveShareLinkMaintenanceConfig(
        options.rawEnvironment ?? (process.env as Record<string, unknown>)
    );
    const logger = options.logger ?? consoleLogger;

    if (resolution.status === 'disabled') {
        const summary = inertSummary('disabled', {});
        return {
            resolution,
            runOnce: async () => {
                safeLogMaintenance(logger, summary);

                return summary;
            },
        };
    }

    if (resolution.status === 'invalid') {
        const summary = inertSummary('invalid_configuration', {
            share_link_maintenance_configuration_invalid: 1,
        });
        return {
            resolution,
            runOnce: async () => {
                safeLogMaintenance(logger, summary);

                return summary;
            },
        };
    }

    const { config } = resolution;
    let cached: Promise<DependencySetup> | null = null;

    const buildDependencies = async (
        budget: ReturnType<typeof createMaintenancePassBudget>
    ): Promise<DependencySetup> => {
        try {
            const client = options.createClient
                ? await options.createClient(config)
                : await buildRuntimeClient(config);

            if (budget.exhausted()) return { status: 'expired' };

            const repositories = options.createRepositories
                ? await options.createRepositories(client, config)
                : await buildRuntimeRepositories(client, config);

            if (budget.exhausted()) return { status: 'expired' };

            return { status: 'ready', dependencies: { client, ...repositories } };
        } catch {
            return { status: 'failed' };
        }
    };

    const resolveDependencies = async (
        budget: ReturnType<typeof createMaintenancePassBudget>
    ): Promise<DependencySetup> => {
        if (!cached) {
            const pending = buildDependencies(budget);
            cached = pending;

            const result = await pending;

            // Keep a successful/in-flight setup cached; clear a failed or
            // budget-aborted one so the next cadence can retry.
            if (result.status !== 'ready' && cached === pending) cached = null;

            return result;
        }

        return cached;
    };

    return {
        resolution,
        runOnce: async runOptions => {
            const requestedRemaining = sampleRemainingMs(runOptions?.remainingTimeMs);
            const budget = createMaintenancePassBudget({
                budgetMs: resolveMaintenanceBudgetMs(config.budgetMs, requestedRemaining),
                finalizeReserveMs: config.finalizeReserveMs,
                monotonicNow: options.monotonicNow,
            });

            if (budget.exhausted()) {
                const summary = deadlineSummary(budget);
                safeLogMaintenance(logger, summary);

                return summary;
            }

            const setup = await resolveDependencies(budget);

            if (setup.status === 'failed') {
                const summary = initializationFailedSummary();
                safeLogMaintenance(logger, summary);

                return summary;
            }

            if (setup.status === 'expired' || budget.exhausted()) {
                const summary = deadlineSummary(budget);
                safeLogMaintenance(logger, summary);

                return summary;
            }

            return runShareLinkMaintenancePass({
                config,
                recoveryRepository: setup.dependencies.recoveryRepository,
                cleanupRepository: setup.dependencies.cleanupRepository,
                pruneReceipts: setup.dependencies.pruneReceipts,
                client: setup.dependencies.client,
                logger,
                monotonicNow: options.monotonicNow,
                now: options.now,
                budget,
            });
        },
    };
};

/** Lazy production transport: loads the did:web signer only when enabled. */
const buildRuntimeClient = async (
    config: Extract<ShareLinkMaintenanceConfigResolution, { status: 'enabled' }>['config']
): Promise<MaintenanceClient> => {
    const [{ getServerDidWebDID }, { createDidWebLearnCardTokenSigner }, clientModule] =
        await Promise.all([
            import('../learnCard.helpers'),
            import('../share-content-client/adapters'),
            import('../share-content-client'),
        ]);

    const signerDid = getServerDidWebDID();
    const clientConfig = clientModule.resolveShareContentClientConfig({
        enabled: true,
        origin: config.origin,
        namespace: config.namespace,
        audience: config.audience,
        signerDid,
        allowInsecureLoopback: config.allowInsecureLoopback,
        signer: createDidWebLearnCardTokenSigner(),
        requestTimeoutMs: config.requestTimeoutMs,
        // Maintenance is one bounded attempt per unit; the scheduler/cadence owns
        // retry, so a transient failure is re-queued rather than retried inline.
        maxAttempts: 1,
        retryBackoffMs: 0,
    });

    if (!clientConfig.enabled) {
        throw new Error('share-link maintenance client configuration was rejected');
    }

    return clientModule.createShareContentClient(clientConfig);
};

/** Lazy production repositories: imports the Neo4j-backed wiring only when enabled. */
const buildRuntimeRepositories = async (
    client: MaintenanceClient,
    config: Extract<ShareLinkMaintenanceConfigResolution, { status: 'enabled' }>['config']
): Promise<{
    recoveryRepository: RecoveryRunnerDependencies['repository'];
    cleanupRepository: CleanupRunnerDependencies['repository'];
    pruneReceipts: ResolvedRunnerDependencies['pruneReceipts'];
}> => {
    const runtimeModule = await import('../share-link-coordinator/runtime');

    const recoveryDependencies = runtimeModule.createRuntimeRecoveryRunnerDependencies({
        client,
        claimant: config.claimant,
        namespace: config.namespace,
    });
    const cleanupDependencies = runtimeModule.createRuntimeCleanupRunnerDependencies({
        client,
        claimant: config.claimant,
        namespace: config.namespace,
    });

    // Preinitialize the idempotent share-link constraint/index gate once, outside
    // the per-unit budget, so a maintenance transaction never pays the one-time
    // schema setup. It is cached in-process and is not a per-pass cost.
    const { ensureShareLinkConstraints } = await import('../../models/share-link-constraints');
    await ensureShareLinkConstraints();

    // Load the receipt-prune repository last: it pulls the Neo4j `@instance`, so
    // it must only be imported when an enabled runtime actually composes work.
    const { pruneShareViewReceipts } = await import('../../accesslayer/share-link/receipt');

    return {
        recoveryRepository: recoveryDependencies.repository,
        cleanupRepository: cleanupDependencies.repository,
        pruneReceipts: pruneShareViewReceipts,
    };
};

const consoleLogger: ShareLinkMaintenanceLogger = {
    info: event => console.log('[share-link-maintenance]', event),
    error: event => console.error('[share-link-maintenance]', event),
};
