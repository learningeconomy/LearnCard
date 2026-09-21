import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
    createMaintenancePassBudget,
    createShareLinkMaintenanceRuntime,
    createShareLinkMaintenanceScheduler,
    resolveShareLinkMaintenanceConfig,
    runShareLinkMaintenancePass,
    toMaintenanceLogEvent,
} from '@helpers/share-link-maintenance';
import {
    ShareLinkCoordinatorError,
    runShareContentCleanupOnce,
    runShareLinkRecoveryOnce,
} from '@helpers/share-link-coordinator';
import type {
    CleanupRunnerDependencies,
    RecoveryRunnerDependencies,
} from '@helpers/share-link-coordinator';

import { executeExplicitTransaction } from '../src/accesslayer/share-link/transaction-execution';

const NAMESPACE = 'test-namespace';
const OWNER = 'owner-1';
const SHARE_ID = 's'.repeat(22);
const OBJECT_REF = 'o'.repeat(43);
const OPERATION_ID = '11111111-1111-4111-8111-111111111111';
const NOW_ISO = '2026-09-20T12:00:00.000Z';

const silentLogger = { info: vi.fn(), error: vi.fn() };

const enabledEnv = (overrides: Record<string, unknown> = {}) => ({
    SHARE_LINK_MAINTENANCE_NAMESPACE: NAMESPACE,
    SHARE_LINK_MAINTENANCE_ORIGIN: 'https://learncloud.example',
    SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:learncloud.example',
    ...overrides,
});

const enabledConfig = (overrides: Record<string, unknown> = {}) => {
    const resolved = resolveShareLinkMaintenanceConfig(enabledEnv(overrides));

    if (resolved.status !== 'enabled') throw new Error('expected an enabled config');

    return resolved.config;
};

const cleanupJob = (overrides: Record<string, unknown> = {}) => ({
    objectRef: OBJECT_REF,
    operationId: OPERATION_ID,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    shareId: SHARE_ID,
    contentVersion: 1,
    reason: 'stopped' as const,
    status: 'claimed' as const,
    attempts: 0,
    nextAttemptAt: NOW_ISO,
    claimToken: 'token-1',
    claimedBy: 'cleaner',
    claimExpiresAt: '2099-01-01T00:00:00.000Z',
    lastError: null,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    completedAt: null,
    ...overrides,
});

const makeCleanupRepository = (
    jobs: ReturnType<typeof cleanupJob>[]
): CleanupRunnerDependencies['repository'] =>
    ({
        claimCleanupJobs: vi.fn().mockResolvedValue({ claimToken: 'token-1', jobs }),
        completeCleanupJob: vi.fn().mockResolvedValue({
            outcome: 'completed',
            job: cleanupJob({ status: 'completed' }),
        }),
    }) as unknown as CleanupRunnerDependencies['repository'];

const makeDeleteClient = (
    result: unknown = { ok: true, value: {} }
): CleanupRunnerDependencies['client'] =>
    ({
        delete: vi.fn().mockResolvedValue(result),
    }) as unknown as CleanupRunnerDependencies['client'];

const makeRecoveryRepository = (): RecoveryRunnerDependencies['repository'] =>
    ({
        discoverRecoverableReservations: vi.fn().mockResolvedValue({ keys: [] }),
        readShareLinkRecoveryTarget: vi.fn(),
        claimRecoverableReservation: vi.fn(),
        abandonRecoveredReservation: vi.fn(),
        finalizeReservation: vi.fn(),
    }) as unknown as RecoveryRunnerDependencies['repository'];

describe('share-link maintenance config', () => {
    it('does no setup without service wiring', () => {
        expect(resolveShareLinkMaintenanceConfig({})).toEqual({ status: 'disabled' });
        expect(
            resolveShareLinkMaintenanceConfig({
                SHARE_LINK_MAINTENANCE_NAMESPACE: '',
                SHARE_LINK_MAINTENANCE_ORIGIN: '',
                SHARE_LINK_MAINTENANCE_AUDIENCE: '',
            })
        ).toEqual({ status: 'disabled' });
    });
    it('runs automatically with valid configuration despite retired rollout flags', () => {
        expect(
            resolveShareLinkMaintenanceConfig(
                enabledEnv({ SHARE_LINK_MAINTENANCE_ENABLED: 'false' })
            ).status
        ).toBe('enabled');
    });

    it('rejects a malformed boolean instead of coercing it', () => {
        expect(
            resolveShareLinkMaintenanceConfig(
                enabledEnv({ SHARE_LINK_MAINTENANCE_ALLOW_INSECURE_LOOPBACK: 'yes' })
            )
        ).toEqual({
            status: 'invalid',
            category: 'share_link_maintenance_configuration_invalid',
        });
    });

    it('rejects missing or malformed required values without echoing them', () => {
        const invalidCases: Record<string, unknown>[] = [
            enabledEnv({ SHARE_LINK_MAINTENANCE_NAMESPACE: 'bad:namespace' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_NAMESPACE: '' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_ORIGIN: 'http://example.com' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_ORIGIN: 'not a url' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_AUDIENCE: 'https://learncloud.example' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT: 'lots' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT: '0' }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT: '101' }),
            enabledEnv({
                SHARE_LINK_MAINTENANCE_BUDGET_MS: '1000',
                SHARE_LINK_MAINTENANCE_FINALIZE_RESERVE_MS: '2000',
            }),
            enabledEnv({ SHARE_LINK_MAINTENANCE_ALLOW_INSECURE_LOOPBACK: '1' }),
        ];

        for (const raw of invalidCases) {
            const resolved = resolveShareLinkMaintenanceConfig(raw);
            expect(resolved).toEqual({
                status: 'invalid',
                category: 'share_link_maintenance_configuration_invalid',
            });
            expect(JSON.stringify(resolved)).not.toContain('bad:namespace');
        }
    });

    it('accepts a loopback origin only with an explicit insecure opt-in', () => {
        expect(
            resolveShareLinkMaintenanceConfig(
                enabledEnv({
                    SHARE_LINK_MAINTENANCE_ORIGIN: 'http://localhost:4000',
                    SHARE_LINK_MAINTENANCE_ALLOW_INSECURE_LOOPBACK: 'true',
                })
            ).status
        ).toBe('enabled');
    });

    it('applies bounded defaults to a valid enabled configuration', () => {
        const config = enabledConfig();

        expect(config).toMatchObject({
            namespace: NAMESPACE,
            origin: 'https://learncloud.example',
            audience: 'did:web:learncloud.example',
            claimant: 'brain-share-link-maintenance',
            recoveryLimit: 25,
            cleanupLimit: 25,
            receiptPruneLimit: 200,
            leaseMs: 120_000,
            claimMs: 300_000,
            budgetMs: 60_000,
            intervalMs: 300_000,
            requestTimeoutMs: 10_000,
            finalizeReserveMs: 5_000,
            graphTimeoutMs: 15_000,
        });
    });
});

describe('share-link maintenance runtime', () => {
    it('stays inert when disabled and never constructs the client or repositories', async () => {
        const createClient = vi.fn();
        const createRepositories = vi.fn();
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: {},
            logger: silentLogger,
            createClient,
            createRepositories,
        });

        const summary = await runtime.runOnce();

        expect(summary.status).toBe('disabled');
        expect(createClient).not.toHaveBeenCalled();
        expect(createRepositories).not.toHaveBeenCalled();
    });

    it('returns a fixed invalid category without constructing anything', async () => {
        const createClient = vi.fn();
        const createRepositories = vi.fn();
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv({ SHARE_LINK_MAINTENANCE_NAMESPACE: 'bad:namespace' }),
            logger: silentLogger,
            createClient,
            createRepositories,
        });

        const summary = await runtime.runOnce();

        expect(summary.status).toBe('invalid_configuration');
        expect(summary.categories).toEqual({
            share_link_maintenance_configuration_invalid: 1,
        });
        expect(createClient).not.toHaveBeenCalled();
        expect(createRepositories).not.toHaveBeenCalled();
    });
});

describe('share-link maintenance pass', () => {
    const runnerDependencies = (
        config: ReturnType<typeof enabledConfig>,
        overrides: Partial<Parameters<typeof runShareLinkMaintenancePass>[0]> = {}
    ) => ({
        config,
        recoveryRepository: makeRecoveryRepository(),
        cleanupRepository: makeCleanupRepository([]),
        pruneReceipts: vi.fn().mockResolvedValue(0),
        client: makeDeleteClient(),
        logger: silentLogger,
        ...overrides,
    });

    it('does no work at all when the budget is already exhausted', async () => {
        const config = enabledConfig({
            SHARE_LINK_MAINTENANCE_BUDGET_MS: '1000',
            SHARE_LINK_MAINTENANCE_FINALIZE_RESERVE_MS: '100',
        });

        // Direct construction: this asserts the runner stops before any claim when
        // its remaining budget is below the finalization reserve.
        const dependencies = runnerDependencies({ ...config, finalizeReserveMs: 2_000 });
        const summary = await runShareLinkMaintenancePass(dependencies);

        expect(summary.status).toBe('deadline_exhausted');
        expect(
            dependencies.recoveryRepository.discoverRecoverableReservations
        ).not.toHaveBeenCalled();
        expect(dependencies.cleanupRepository.claimCleanupJobs).not.toHaveBeenCalled();
    });

    it('caps the budget by the remaining Lambda time', async () => {
        const config = enabledConfig();
        const dependencies = runnerDependencies(config, { remainingTimeMs: () => 2_500 });

        const summary = await runShareLinkMaintenancePass(dependencies);

        expect(summary.budgetMs).toBe(2_500);
    });

    it('runs recovery and cleanup with explicit namespace and independent limits', async () => {
        const config = enabledConfig({
            SHARE_LINK_MAINTENANCE_RECOVERY_LIMIT: '3',
            SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT: '7',
        });
        const recoveryRepository = makeRecoveryRepository();
        const cleanupRepository = makeCleanupRepository([]);
        const dependencies = runnerDependencies(config, { recoveryRepository, cleanupRepository });

        const summary = await runShareLinkMaintenancePass(dependencies);

        expect(summary.status).toBe('completed');
        expect(recoveryRepository.discoverRecoverableReservations).toHaveBeenCalledWith(
            expect.objectContaining({ namespace: NAMESPACE, limit: 3 })
        );
        expect(cleanupRepository.claimCleanupJobs).toHaveBeenCalledWith(
            expect.objectContaining({ namespace: NAMESPACE })
        );
    });

    it('invokes the namespace-scoped bounded receipt prune with no-inline-retry semantics', async () => {
        const config = enabledConfig({
            SHARE_LINK_MAINTENANCE_RECEIPT_PRUNE_LIMIT: '7',
            SHARE_LINK_MAINTENANCE_GRAPH_TIMEOUT_MS: '2000',
        });
        const pruneReceipts = vi.fn().mockResolvedValue(4);
        const now = new Date(NOW_ISO);

        const summary = await runShareLinkMaintenancePass(
            runnerDependencies(config, { pruneReceipts, now: () => now })
        );

        expect(pruneReceipts).toHaveBeenCalledWith({
            namespace: NAMESPACE,
            limit: 7,
            now,
            transaction: { timeoutMs: 2_000, noInlineRetry: true },
        });
        expect(summary.receiptPrune).toEqual({ pruned: 4 });
        expect(summary.categories).toEqual({});
    });

    it('does not start receipt pruning when the graph budget is exhausted', async () => {
        let clock = 0;
        // budget 1000ms, reserve 100ms. Recovery discovery needs 500ms and cleanup
        // needs request(100)+2*graph(500)=1100ms, so consume the budget after
        // recovery before admission.
        const config = enabledConfig({
            SHARE_LINK_MAINTENANCE_BUDGET_MS: '1000',
            SHARE_LINK_MAINTENANCE_FINALIZE_RESERVE_MS: '100',
            SHARE_LINK_MAINTENANCE_GRAPH_TIMEOUT_MS: '500',
            SHARE_LINK_MAINTENANCE_REQUEST_TIMEOUT_MS: '100',
        });
        const pruneReceipts = vi.fn().mockResolvedValue(0);
        const dependencies = runnerDependencies(config, {
            pruneReceipts,
            monotonicNow: () => clock,
            remainingTimeMs: undefined,
            recoveryRepository: makeRecoveryRepository(),
        });
        // Force the clock past the budget as soon as recovery is admitted.
        const originalDiscover = dependencies.recoveryRepository
            .discoverRecoverableReservations as ReturnType<typeof vi.fn>;
        originalDiscover.mockImplementationOnce(async () => {
            clock = 10_000;
            return { keys: [] };
        });

        const summary = await runShareLinkMaintenancePass(dependencies);

        expect(pruneReceipts).not.toHaveBeenCalled();
        expect(summary.status).toBe('deadline_exhausted');
    });

    it('folds a transient receipt-prune failure into a fixed category and succeeds next pass', async () => {
        const config = enabledConfig();
        const pruneReceipts = vi
            .fn()
            .mockRejectedValueOnce(new Error('graph down'))
            .mockResolvedValue(2);

        const first = await runShareLinkMaintenancePass(
            runnerDependencies(config, { pruneReceipts })
        );
        expect(first.status).toBe('failed');
        expect(first.categories.share_link_maintenance_receipt_prune_failed).toBe(1);
        expect(first.receiptPrune).toBeNull();

        const second = await runShareLinkMaintenancePass(
            runnerDependencies(config, { pruneReceipts })
        );
        expect(second.status).toBe('completed');
        expect(second.receiptPrune).toEqual({ pruned: 2 });
    });

    it('keeps a throwing logger from rejecting the pass', async () => {
        const config = enabledConfig();
        const logger = {
            info: () => {
                throw new Error('logger down');
            },
            error: () => {
                throw new Error('logger down');
            },
        };

        await expect(
            runShareLinkMaintenancePass(runnerDependencies(config, { logger }))
        ).resolves.toMatchObject({ status: 'completed' });
    });
});

describe('bounded cleanup runner scope and budget', () => {
    it('passes the explicit namespace and omits production time', async () => {
        const repository = makeCleanupRepository([]);

        await runShareContentCleanupOnce({
            repository,
            client: makeDeleteClient(),
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(repository.claimCleanupJobs).toHaveBeenCalledWith(
            expect.objectContaining({ namespace: NAMESPACE, now: undefined })
        );
    });

    it('rejects a malformed maintenance namespace before any graph call', async () => {
        const repository = makeCleanupRepository([]);

        await expect(
            runShareContentCleanupOnce({
                repository,
                client: makeDeleteClient(),
                claimant: 'cleaner',
                namespace: 'bad:namespace',
            })
        ).rejects.toBeInstanceOf(ShareLinkCoordinatorError);

        expect(repository.claimCleanupJobs).not.toHaveBeenCalled();
    });

    it('stops before claiming again once the budget is exhausted', async () => {
        const repository = makeCleanupRepository([cleanupJob()]);
        const budget = {
            remainingMs: () => 500,
            exhausted: vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
        };

        const summary = await runShareContentCleanupOnce({
            repository,
            client: makeDeleteClient(),
            claimant: 'cleaner',
            namespace: NAMESPACE,
            limit: 3,
            claimBatchSize: 1,
            budget,
        });

        expect(summary.claimed).toBe(1);
        expect(summary.completed).toBe(1);
        expect(repository.claimCleanupJobs).toHaveBeenCalledTimes(1);
    });

    it('reports a sanitized aggregate for a deterministic delete failure', async () => {
        const repository = makeCleanupRepository([cleanupJob()]);
        const client = makeDeleteClient({ ok: false, error: 'UNAUTHORIZED' });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(summary).toMatchObject({ claimed: 1, skipped: 1, completed: 0 });
        expect(summary.categories).toEqual({ UNAUTHORIZED: 1 });
        const serialized = JSON.stringify(summary);
        expect(serialized).not.toContain(OBJECT_REF);
        expect(serialized).not.toContain(OWNER);
        expect(serialized).not.toContain(SHARE_ID);
        expect(repository.completeCleanupJob).not.toHaveBeenCalled();
    });

    it('returns a transient delete to the queue without completing it', async () => {
        const repository = makeCleanupRepository([cleanupJob()]);
        (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'retry',
            job: cleanupJob({ status: 'queued', attempts: 1 }),
        });
        const client = makeDeleteClient({ ok: false, error: 'TIMEOUT' });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(summary).toMatchObject({ claimed: 1, retried: 1, completed: 0, skipped: 0 });
        expect(repository.completeCleanupJob).toHaveBeenCalledWith(
            expect.objectContaining({ outcome: 'retry' })
        );
    });
});

describe('share-link maintenance scheduler', () => {
    it('never runs two passes concurrently', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const runOnce = vi.fn().mockImplementation(() => gate);
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1_000,
            logger: silentLogger,
            setTimeoutFn: () => 1,
            clearTimeoutFn: () => undefined,
        });

        const first = scheduler.trigger();
        const second = scheduler.trigger();

        expect(scheduler.isRunning()).toBe(true);
        expect(runOnce).toHaveBeenCalledTimes(1);

        release();
        await Promise.all([first, second]);

        expect(scheduler.isRunning()).toBe(false);
        expect(runOnce).toHaveBeenCalledTimes(1);
    });

    it('drains an in-flight pass on stop and schedules nothing further', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const runOnce = vi.fn().mockImplementation(() => gate);
        const clearTimeoutFn = vi.fn();
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1_000,
            logger: silentLogger,
            setTimeoutFn: () => 7,
            clearTimeoutFn,
        });

        scheduler.start();
        const inFlight = scheduler.trigger();
        const stopping = scheduler.stop();

        let stopped = false;
        void stopping.then(() => {
            stopped = true;
        });

        await Promise.resolve();
        expect(stopped).toBe(false);

        release();
        await stopping;

        expect(stopped).toBe(true);
        expect(clearTimeoutFn).toHaveBeenCalledWith(7);
        await inFlight;
    });

    it('does not reject when the scheduled pass fails', async () => {
        const runOnce = vi.fn().mockRejectedValue(new Error('boom'));
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1_000,
            logger: silentLogger,
            setTimeoutFn: () => 1,
            clearTimeoutFn: () => undefined,
        });

        await expect(scheduler.trigger()).resolves.toBeUndefined();
    });
});

describe('share-link maintenance telemetry', () => {
    it('emits only allowlisted aggregate counters', () => {
        const event = toMaintenanceLogEvent({
            status: 'completed',
            durationMs: 120,
            budgetMs: 5_000,
            recovery: {
                discovered: 2,
                claimed: 1,
                finalized: 1,
                abandoned: 0,
                deferred: 0,
                claimLost: 0,
                anomalies: 0,
                categories: { finalized: 1 },
            },
            cleanup: {
                claimed: 1,
                completed: 0,
                retried: 0,
                claimLost: 0,
                skipped: 1,
                categories: { UNAUTHORIZED: 1 },
            },
            receiptPrune: { pruned: 3 },
            categories: {},
        });

        expect(event.counts).toMatchObject({
            recoveryDiscovered: 2,
            cleanupSkipped: 1,
            receiptsPruned: 3,
        });
        expect(event.categories).toMatchObject({ finalized: 1, UNAUTHORIZED: 1 });
        expect(Object.keys(event).sort()).toEqual([
            'budgetMs',
            'categories',
            'counts',
            'durationMs',
            'event',
            'status',
        ]);

        const serialized = JSON.stringify(event);
        for (const sensitive of [OBJECT_REF, OWNER, SHARE_ID, OPERATION_ID, NAMESPACE]) {
            expect(serialized).not.toContain(sensitive);
        }
    });
});

describe('maintenance budget helper', () => {
    it('reports exhaustion against the finalization reserve', () => {
        let now = 0;
        const budget = createMaintenancePassBudget({
            budgetMs: 1_000,
            finalizeReserveMs: 400,
            monotonicNow: () => now,
        });

        expect(budget.exhausted()).toBe(false);

        now = 700;
        expect(budget.exhausted()).toBe(true);
    });
});

describe('Lambda and Docker wiring is disabled by default', () => {
    const serverless = readFileSync(join(__dirname, '..', 'serverless.yml'), 'utf8');

    it('registers the automatic maintenance schedule', () => {
        expect(serverless).toContain(
            'handler: shareLinkMaintenanceLambda.shareLinkMaintenanceHandler'
        );

        const functionBlock = serverless.slice(
            serverless.indexOf('shareLinkMaintenance:'),
            serverless.indexOf('trpc:')
        );

        expect(functionBlock).toContain('enabled: true');
        expect(functionBlock).not.toContain('enabled: false');
    });

    it('does not ship a maintenance rollout flag', () => {
        expect(serverless).not.toContain('SHARE_LINK_MAINTENANCE_ENABLED:');
    });
});

describe('C7 independent review regressions', () => {
    it('does not initialize dependencies when Lambda time is already exhausted', async () => {
        const createClient = vi.fn().mockResolvedValue(makeDeleteClient());
        const createRepositories = vi.fn().mockResolvedValue({
            recoveryRepository: makeRecoveryRepository(),
            cleanupRepository: makeCleanupRepository([]),
            pruneReceipts: vi.fn().mockResolvedValue(0),
        });
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            createClient,
            createRepositories,
        });
        expect((await runtime.runOnce({ remainingTimeMs: 0 })).status).toBe('deadline_exhausted');
        expect(createClient).not.toHaveBeenCalled();
        expect(createRepositories).not.toHaveBeenCalled();
    });

    it('includes cold dependency initialization in the original invocation deadline', async () => {
        let clock = 0;
        const recoveryRepository = makeRecoveryRepository();
        const cleanupRepository = makeCleanupRepository([]);
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            monotonicNow: () => clock,
            createClient: async () => {
                clock = 80_000;
                return makeDeleteClient();
            },
            createRepositories: async () => ({
                recoveryRepository,
                cleanupRepository,
                pruneReceipts: vi.fn().mockResolvedValue(0),
            }),
        });
        expect((await runtime.runOnce({ remainingTimeMs: 60_000 })).status).toBe(
            'deadline_exhausted'
        );
        expect(recoveryRepository.discoverRecoverableReservations).not.toHaveBeenCalled();
        expect(cleanupRepository.claimCleanupJobs).not.toHaveBeenCalled();
    });

    it('retries dependency initialization after a transient failure on the next pass', async () => {
        const createClient = vi
            .fn()
            .mockRejectedValueOnce(new Error('temporary failure'))
            .mockResolvedValue(makeDeleteClient());
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            createClient,
            createRepositories: async () => ({
                recoveryRepository: makeRecoveryRepository(),
                cleanupRepository: makeCleanupRepository([]),
                pruneReceipts: vi.fn().mockResolvedValue(0),
            }),
        });
        await runtime.runOnce();
        expect((await runtime.runOnce()).status).toBe('completed');
        expect(createClient).toHaveBeenCalledTimes(2);
    });

    it('does not claim a unit whose configured HTTP allowance already exceeds remaining Lambda time', async () => {
        const cleanupRepository = makeCleanupRepository([cleanupJob()]);
        const client = makeDeleteClient();
        const summary = await runShareLinkMaintenancePass({
            config: enabledConfig({ SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT: '1' }),
            recoveryRepository: makeRecoveryRepository(),
            cleanupRepository,
            client,
            logger: silentLogger,
            remainingTimeMs: () => 6_000,
        });
        expect(summary.status).toBe('deadline_exhausted');
        expect(cleanupRepository.claimCleanupJobs).not.toHaveBeenCalled();
        expect(client.delete).not.toHaveBeenCalled();
    });

    it('does not allow an explicit trigger to restart work after stop has drained', async () => {
        const runOnce = vi.fn().mockResolvedValue(undefined);
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1000,
            logger: silentLogger,
        });
        await scheduler.stop();
        await scheduler.trigger();
        expect(runOnce).not.toHaveBeenCalled();
    });
});

describe('C7a whole-unit admission and post-claim recheck', () => {
    const budgetAt = (remaining: { value: number }, reserveMs = 5_000) => ({
        remainingMs: () => remaining.value,
        reserveMs: () => reserveMs,
        exhausted: () => remaining.value <= reserveMs,
    });

    it('does not start a cleanup unit when remaining cannot cover claim+delete+complete', async () => {
        const repository = makeCleanupRepository([cleanupJob()]);
        const client = makeDeleteClient();

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
            claimBatchSize: 1,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt({ value: 5_000 + 40_000 - 1 }),
        });

        expect(repository.claimCleanupJobs).not.toHaveBeenCalled();
        expect(client.delete).not.toHaveBeenCalled();
        expect(summary.claimed).toBe(0);
    });

    it('admits a cleanup unit at the exact whole-unit boundary', async () => {
        const repository = makeCleanupRepository([]);

        const summary = await runShareContentCleanupOnce({
            repository,
            client: makeDeleteClient(),
            claimant: 'cleaner',
            namespace: NAMESPACE,
            claimBatchSize: 1,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt({ value: 5_000 + 40_000 }),
        });

        expect(repository.claimCleanupJobs).toHaveBeenCalledTimes(1);
        expect(summary.claimed).toBe(0);
    });

    it('rechecks after the awaited claim and leaves the job fenced instead of deleting', async () => {
        const remaining = { value: 5_000 + 40_000 };
        const repository = makeCleanupRepository([cleanupJob()]);
        (repository.claimCleanupJobs as ReturnType<typeof vi.fn>).mockImplementation(async () => {
            // The claim waited on a lock; only the completion tail remains.
            remaining.value = 5_000 + 15_000;
            return { claimToken: 'token-1', jobs: [cleanupJob()] };
        });
        const client = makeDeleteClient();

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
            claimBatchSize: 1,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt(remaining),
        });

        expect(repository.claimCleanupJobs).toHaveBeenCalledTimes(1);
        expect(client.delete).not.toHaveBeenCalled();
        expect(repository.completeCleanupJob).not.toHaveBeenCalled();
        expect(summary).toMatchObject({ claimed: 1, completed: 0, skipped: 0 });
        expect(summary.categories).toMatchObject({ budget_exhausted: 1 });
    });

    it('clamps the completion graph transaction budget to the time left after the remote call', async () => {
        const remaining = { value: 5_000 + 40_000 };
        const repository = makeCleanupRepository([cleanupJob()]);
        const client = makeDeleteClient();
        (client.delete as ReturnType<typeof vi.fn>).mockImplementation(async () => {
            // The remote delete consumed most of the pass budget.
            remaining.value = 5_000 + 4_000;
            return { ok: true, value: {} };
        });

        await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
            claimBatchSize: 1,
            limit: 1,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt(remaining),
        });

        expect(repository.completeCleanupJob).toHaveBeenCalledWith(
            expect.objectContaining({ transactionTimeoutMs: 4_000, noInlineRetry: undefined })
        );
    });

    it('does not run recovery discovery once the remaining budget cannot cover the read', async () => {
        const repository = makeRecoveryRepository();

        const summary = await runShareLinkRecoveryOnce({
            repository,
            client: { stat: vi.fn() } as unknown as RecoveryRunnerDependencies['client'],
            claimant: 'cleaner',
            namespace: NAMESPACE,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt({ value: 5_000 + 15_000 - 1 }),
        });

        expect(repository.discoverRecoverableReservations).not.toHaveBeenCalled();
        expect(summary.discovered).toBe(0);
        expect(summary.categories).toMatchObject({ budget_exhausted: 1 });
    });

    it('defers missing-content abandonment when stat consumes the remaining graph allowance', async () => {
        const remaining = { value: 45_000 };
        const repository = makeRecoveryRepository();
        const key = {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId: SHARE_ID,
            operationId: OPERATION_ID,
        };
        vi.mocked(repository.discoverRecoverableReservations).mockResolvedValue({ keys: [key] });
        vi.mocked(repository.claimRecoverableReservation).mockResolvedValue({
            outcome: 'claimed',
            share: {} as never,
            reservation: { ...key, objectRef: OBJECT_REF, contentVersion: 1 } as never,
        });
        const stat = vi.fn().mockImplementation(async () => {
            remaining.value = 5_000 + 15_000 - 1;
            return { ok: false, error: 'NOT_FOUND' };
        });

        const summary = await runShareLinkRecoveryOnce({
            repository,
            client: { stat } as unknown as RecoveryRunnerDependencies['client'],
            claimant: 'cleaner',
            namespace: NAMESPACE,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt(remaining),
        });

        expect(stat).toHaveBeenCalledOnce();
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
        expect(summary).toMatchObject({ claimed: 1, deferred: 1 });
        expect(summary.categories).toMatchObject({ budget_exhausted: 1 });
    });

    it('leaves a claimed reservation fenced instead of stat-ing when the tail no longer fits', async () => {
        const remaining = { value: 5_000 + 40_000 };
        const stat = vi.fn();
        const repository = makeRecoveryRepository();
        (repository.discoverRecoverableReservations as ReturnType<typeof vi.fn>).mockResolvedValue({
            keys: [
                {
                    namespace: NAMESPACE,
                    ownerProfileId: OWNER,
                    shareId: SHARE_ID,
                    operationId: OPERATION_ID,
                },
            ],
        });
        (repository.claimRecoverableReservation as ReturnType<typeof vi.fn>).mockImplementation(
            async () => {
                // The claim waited on a lock; only the stat/finalize tail remains.
                remaining.value = 5_000 + 10_000;

                return {
                    outcome: 'claimed' as const,
                    share: {} as never,
                    reservation: { objectRef: OBJECT_REF, contentVersion: 1 } as never,
                };
            }
        );

        const summary = await runShareLinkRecoveryOnce({
            repository,
            client: { stat } as unknown as RecoveryRunnerDependencies['client'],
            claimant: 'cleaner',
            namespace: NAMESPACE,
            transactionTimeoutMs: 15_000,
            requestTimeoutMs: 10_000,
            budget: budgetAt(remaining),
        });

        expect(stat).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
        expect(summary).toMatchObject({ claimed: 1, deferred: 1 });
        expect(summary.categories).toMatchObject({ budget_exhausted: 1 });
    });
});

describe('C7a dependency setup caching', () => {
    it('shares one in-flight setup across concurrent invocations', async () => {
        let resolveClient!: (client: ReturnType<typeof makeDeleteClient>) => void;
        const pendingClient = new Promise<ReturnType<typeof makeDeleteClient>>(resolve => {
            resolveClient = resolve;
        });
        const createClient = vi.fn().mockReturnValue(pendingClient);
        const createRepositories = vi.fn().mockResolvedValue({
            recoveryRepository: makeRecoveryRepository(),
            cleanupRepository: makeCleanupRepository([]),
            pruneReceipts: vi.fn().mockResolvedValue(0),
        });
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            createClient,
            createRepositories,
        });

        const first = runtime.runOnce();
        const second = runtime.runOnce();

        expect(createClient).toHaveBeenCalledTimes(1);

        resolveClient(makeDeleteClient());

        const [firstSummary, secondSummary] = await Promise.all([first, second]);

        expect(createClient).toHaveBeenCalledTimes(1);
        expect(createRepositories).toHaveBeenCalledTimes(1);
        expect(firstSummary.status).toBe('completed');
        expect(secondSummary.status).toBe('completed');
    });

    it('clears a budget-aborted cold start so the next invocation retries setup', async () => {
        let clock = 0;
        let clientCalls = 0;
        const createClient = vi.fn(async () => {
            if (clientCalls++ === 0) clock = 80_000;
            return makeDeleteClient();
        });
        const createRepositories = vi.fn().mockResolvedValue({
            recoveryRepository: makeRecoveryRepository(),
            cleanupRepository: makeCleanupRepository([]),
            pruneReceipts: vi.fn().mockResolvedValue(0),
        });
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            monotonicNow: () => clock,
            createClient,
            createRepositories,
        });

        const first = await runtime.runOnce({ remainingTimeMs: 60_000 });

        expect(first.status).toBe('deadline_exhausted');
        expect(createRepositories).not.toHaveBeenCalled();

        const second = await runtime.runOnce({ remainingTimeMs: 60_000 });

        expect(second.status).toBe('completed');
        expect(createClient).toHaveBeenCalledTimes(2);
        expect(createRepositories).toHaveBeenCalledTimes(1);
    });

    it('reports a distinct fixed initialization-failure category without echoing the error', async () => {
        const createClient = vi.fn().mockRejectedValue(new Error('secret-temporary-failure'));
        const createRepositories = vi.fn();
        const runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: enabledEnv(),
            logger: silentLogger,
            createClient,
            createRepositories,
        });

        const summary = await runtime.runOnce();

        expect(summary.status).toBe('initialization_failed');
        expect(summary.categories).toEqual({
            share_link_maintenance_initialization_failed: 1,
        });
        expect(JSON.stringify(summary)).not.toContain('secret-temporary-failure');
        expect(createRepositories).not.toHaveBeenCalled();
    });
});

describe('C7a scheduler terminal stop and synchronous failure', () => {
    it('does not run a queued timer callback after stop', async () => {
        let queued: (() => void) | null = null;
        const runOnce = vi.fn().mockResolvedValue(undefined);
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1_000,
            logger: silentLogger,
            setTimeoutFn: handler => {
                queued = handler;
                return 1;
            },
            clearTimeoutFn: () => undefined,
        });

        scheduler.start();
        await scheduler.stop();

        // Simulate a timer callback that was already queued when stop ran.
        queued?.();
        await Promise.resolve();
        await Promise.resolve();

        expect(runOnce).not.toHaveBeenCalled();
    });

    it('keeps inFlight clear when runOnce throws synchronously', async () => {
        const runOnce = vi.fn((): Promise<unknown> => {
            throw new Error('sync boom');
        });
        const scheduler = createShareLinkMaintenanceScheduler({
            runOnce,
            intervalMs: 1_000,
            logger: silentLogger,
            setTimeoutFn: () => 1,
            clearTimeoutFn: () => undefined,
        });

        await expect(scheduler.trigger()).resolves.toBeUndefined();
        expect(scheduler.isRunning()).toBe(false);

        await expect(scheduler.trigger()).resolves.toBeUndefined();
        expect(runOnce).toHaveBeenCalledTimes(2);
    });
});

describe('C7a bounded maintenance transaction execution', () => {
    const makeSession = () => {
        const transaction = {
            run: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined),
            rollback: vi.fn().mockResolvedValue(undefined),
        };
        const beginTransaction = vi.fn().mockReturnValue(transaction);

        return { session: { beginTransaction }, transaction, beginTransaction };
    };

    it('makes exactly one explicit attempt with the bounded timeout', async () => {
        const { session, transaction, beginTransaction } = makeSession();
        const work = vi.fn().mockResolvedValue('done');

        await expect(executeExplicitTransaction(session, work, 250)).resolves.toBe('done');
        expect(beginTransaction).toHaveBeenCalledTimes(1);
        expect(beginTransaction).toHaveBeenCalledWith({ timeout: 250 });
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(transaction.rollback).not.toHaveBeenCalled();
    });

    it('does not retry a thrown unit and rolls the explicit transaction back once', async () => {
        const { session, transaction, beginTransaction } = makeSession();
        const work = vi.fn().mockRejectedValue(new Error('transient'));

        await expect(executeExplicitTransaction(session, work, 250)).rejects.toThrow('transient');
        expect(beginTransaction).toHaveBeenCalledTimes(1);
        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(transaction.commit).not.toHaveBeenCalled();
    });
});
