import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentProvider } from '../../src/agent/types';
import {
    createInMemoryLearnCardAssistantFeedRepository,
    createLearnCardAssistantFeedRuntime,
    createLearnCardAssistantFeedService,
    type LearnCardAssistantFeedRuntime,
} from '../../src/assistantFeed';
import type { LearnCardAssistantProfileRuntime } from '../../src/assistantProfile';
import type { RunChatResult } from '../../src/server';
import {
    createAutonomousScheduler,
    type CreateAutonomousSchedulerOptions,
} from '../../src/autonomy/scheduler';
import {
    createAgentAutonomyScheduleService,
    createInMemoryAgentAutonomyScheduleRepository,
    createLearnCardAssistantSchedulesRuntime,
    type AgentAutonomySchedule,
    type LearnCardAssistantSchedulesRuntime,
} from '../../src/autonomy/schedules';
import {
    createInMemoryAutonomousLeaseRepository,
    createInMemoryAutonomousRunRepository,
    type AutonomousLeaseRepository,
    type AutonomousRun,
    type AutonomousRunRepository,
} from '../../src/autonomy/runs';
import type { ConsentFlowRuntime } from '../../src/consentFlow';
import type { ServiceConfig } from '../../src/config';
import type { MongoRuntime } from '../../src/mongo';
import type { AgentServiceRuntime } from '../../src/runtime';
import type { SelfImprovementRuntime } from '../../src/selfImprovement';

const NOW = new Date('2026-07-15T12:00:00.000Z');
const OWNER_DID = 'did:key:owner';
const OTHER_DID = 'did:key:other';

const config: ServiceConfig = {
    nodeEnv: 'development',
    model: 'test-model',
    openAIApiKey: 'test-key',
    port: 0,
    walletSeed: 'test-seed',
    maxToolRounds: 5,
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoUri: 'mongodb://localhost:27017',
    mongoDbName: 'test-ai-agent',
    selfImprovementEnabled: true,
    retroModel: 'retro-model',
    retroMaxTraceChars: 24_000,
    authChallengeTtlMs: 300_000,
    encryptionKeyId: 'test-key',
    debugEnabled: true,
    autonomyDevEnabled: true,
    autonomyDevDids: [OWNER_DID, OTHER_DID],
    autonomyDevPollIntervalMs: 1_000,
    autonomyDevMaxRunsPerCycle: 3,
    autonomyDevLeaseMs: 900_000,
};

const mongoRuntime: MongoRuntime = {
    getClient: async () => {
        throw new Error('Mongo should not be used.');
    },
    getDb: async () => {
        throw new Error('Mongo should not be used.');
    },
    getStatus: async () => ({ configured: false, connected: false, dbName: 'test' }),
    close: async () => undefined,
};

const provider: AgentProvider = {
    complete: async () => ({ message: { role: 'assistant', content: 'Not used.' } }),
};

const selfImprovementRuntime: SelfImprovementRuntime = {
    loadRequestSkills: async () => [],
    loadRequestTools: async () => [],
    getMemoryManifestPrompt: async () => undefined,
    runAfterResponse: async () => undefined,
    getDocsForDebug: async () => [],
    getMemoryManifestForDebug: async () => undefined,
    getAssistantMemoryManifest: async () => undefined,
    getAssistantMemoryDocs: async () => [],
    approveAssistantMemory: async () => {
        throw new Error('Not implemented.');
    },
    archiveAssistantMemory: async () => {
        throw new Error('Not implemented.');
    },
    createDebugDoc: async () => {
        throw new Error('Not implemented.');
    },
    updateDebugDoc: async () => {
        throw new Error('Not implemented.');
    },
    approveDebugDoc: async () => {
        throw new Error('Not implemented.');
    },
    archiveDebugDoc: async () => {
        throw new Error('Not implemented.');
    },
    getRunForDebug: async () => undefined,
};

const consentFlowRuntime: ConsentFlowRuntime = {
    getContractInfo: async () => ({
        uri: 'lc:network:test:contract',
        consentUrl: 'https://learncard.app/consent-flow',
        source: 'configured',
        created: false,
    }),
    loadConsentedUserData: async ({ did }) => ({
        did,
        contract: {
            uri: 'lc:network:test:contract',
            consentUrl: 'https://learncard.app/consent-flow',
            source: 'configured',
            created: false,
        },
        records: [],
        summary: {
            recordCount: 0,
            personalKeys: [],
            credentialCount: 0,
            hydratedCredentialCount: 0,
        },
        paging: {
            pageSize: 100,
            pagesRead: 1,
            maxPages: 10,
            hasMore: false,
            incomplete: false,
        },
    }),
};

const assistantProfileRuntime: LearnCardAssistantProfileRuntime = {
    getProfile: async ownerDid => ({
        ownerDid,
        name: 'My Assistant',
        personality: 'Helpful.',
        avatarVariant: 'robot',
        createdAt: NOW,
        updatedAt: NOW,
    }),
    updateProfile: async input => ({
        ownerDid: input.ownerDid,
        name: input.name ?? 'My Assistant',
        personality: input.personality ?? 'Helpful.',
        avatarVariant: 'robot',
        createdAt: NOW,
        updatedAt: NOW,
    }),
    getPrompt: async () => 'Assistant profile.',
    getStatus: async () => ({ configured: true, connected: true }),
};

const createSchedule = (
    id: string,
    ownerDid = OWNER_DID,
    nextRunAt = new Date(NOW.getTime() - 1_000)
): AgentAutonomySchedule => ({
    id,
    ownerDid,
    name: `Schedule ${id}`,
    prompt: `Complete ${id}.`,
    enabled: true,
    timeOfDay: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timezone: 'UTC',
    cron: '30 7 * * 0,1,2,3,4,5,6',
    nextRunAt,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
});

const successfulResult = (runId: string): RunChatResult => ({
    status: 200,
    payload: {
        message: 'Scheduled result.',
        runId,
        messages: [
            { role: 'user', content: 'Scheduled task.' },
            { role: 'assistant', content: 'Scheduled result.' },
        ],
        toolRuns: [
            {
                id: 'tool-1',
                name: 'webSearch',
                arguments: { query: 'current news' },
                result: { ok: true },
            },
        ],
    },
});

const createRuntime = (
    schedules: AgentAutonomySchedule[],
    overrides: {
        schedulesRuntime?: LearnCardAssistantSchedulesRuntime;
        feedRuntime?: LearnCardAssistantFeedRuntime;
    } = {}
): {
    runtime: AgentServiceRuntime;
    schedulesRuntime: LearnCardAssistantSchedulesRuntime;
} => {
    const scheduleService = createAgentAutonomyScheduleService(
        createInMemoryAgentAutonomyScheduleRepository(schedules),
        { now: () => NOW }
    );
    const schedulesRuntime =
        overrides.schedulesRuntime ??
        createLearnCardAssistantSchedulesRuntime({
            mongoRuntime,
            service: scheduleService,
        });
    const feedRuntime =
        overrides.feedRuntime ??
        createLearnCardAssistantFeedRuntime({
            mongoRuntime,
            service: createLearnCardAssistantFeedService(
                createInMemoryLearnCardAssistantFeedRepository()
            ),
        });

    return {
        runtime: {
            config,
            provider,
            providerConfigured: true,
            tools: [],
            mongoRuntime,
            consentFlowRuntime,
            selfImprovementRuntime,
            assistantFeedRuntime: feedRuntime,
            assistantProfileRuntime,
            assistantSchedulesRuntime: schedulesRuntime,
            getEncryption: () => {
                throw new Error('Encryption should not be used.');
            },
        },
        schedulesRuntime,
    };
};

const createScheduler = (
    options: Pick<CreateAutonomousSchedulerOptions, 'runtime' | 'runRepository'> &
        Partial<CreateAutonomousSchedulerOptions>
) =>
    createAutonomousScheduler({
        leaseRepository: createInMemoryAutonomousLeaseRepository(() => 'lease-1'),
        ownerDids: [OWNER_DID, OTHER_DID],
        pollIntervalMs: 1_000,
        maxRunsPerCycle: 3,
        leaseMs: 900_000,
        now: () => NOW,
        createId: () => 'run-1',
        runScheduledRequest: async () => successfulResult('agent-run-1'),
        ...options,
    });

const createRunningOccurrence = (schedule: AgentAutonomySchedule): AutonomousRun => ({
    runId: 'existing-run',
    ownerDid: schedule.ownerDid,
    scheduleId: schedule.id,
    scheduledFor: schedule.nextRunAt,
    triggerType: 'user-schedule',
    triggerSource: 'manual',
    status: 'running',
    createdAt: NOW,
    startedAt: NOW,
    leaseId: 'existing-lease',
    leaseExpiresAt: new Date(NOW.getTime() + 900_000),
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('autonomous scheduler', () => {
    it('selects only due fixture schedules in fair order and honors the max-run cap', async () => {
        const schedules = [
            createSchedule('b', OWNER_DID, new Date(NOW.getTime() - 2_000)),
            createSchedule('a', OTHER_DID, new Date(NOW.getTime() - 2_000)),
            createSchedule('c', OWNER_DID, new Date(NOW.getTime() - 1_000)),
            createSchedule('future', OWNER_DID, new Date(NOW.getTime() + 60_000)),
            createSchedule('excluded', 'did:key:not-a-fixture', new Date(NOW.getTime() - 5_000)),
        ];
        const { runtime } = createRuntime(schedules);
        const runRepository = createInMemoryAutonomousRunRepository();
        const runScheduledRequest = vi.fn(async () => successfulResult(crypto.randomUUID()));
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const scheduler = createScheduler({
            runtime,
            runRepository,
            maxRunsPerCycle: 2,
            createId: (() => {
                let index = 0;

                return () => `run-${++index}`;
            })(),
            leaseRepository: createInMemoryAutonomousLeaseRepository(
                (() => {
                    let index = 0;

                    return () => `lease-${++index}`;
                })()
            ),
            runScheduledRequest,
        });
        const cycle = await scheduler.runOnce('manual');

        expect(cycle.dueCount).toBe(3);
        expect(cycle.results.map(result => `${result.ownerDid}:${result.scheduleId}`)).toEqual([
            `${OTHER_DID}:a`,
            `${OWNER_DID}:b`,
        ]);
        expect(runScheduledRequest).toHaveBeenCalledTimes(2);
        expect(runScheduledRequest.mock.calls.every(call => call[0].runtime === runtime)).toBe(
            true
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('collapses missed dates, serializes same-user schedules, and keeps other users independent', async () => {
        const schedules = [
            createSchedule('old', OWNER_DID, new Date('2026-06-01T07:30:00.000Z')),
            createSchedule('same-user', OWNER_DID, new Date('2026-06-02T07:30:00.000Z')),
            createSchedule('other-user', OTHER_DID, new Date('2026-06-03T07:30:00.000Z')),
        ];
        const { runtime, schedulesRuntime } = createRuntime(schedules);
        const executionOrder: string[] = [];
        let activeOwner: string | undefined;
        const scheduler = createScheduler({
            runtime,
            runRepository: createInMemoryAutonomousRunRepository(),
            leaseRepository: createInMemoryAutonomousLeaseRepository(() => crypto.randomUUID()),
            createId: () => crypto.randomUUID(),
            runScheduledRequest: async options => {
                expect(activeOwner).toBeUndefined();
                activeOwner = options.schedule.ownerDid;
                executionOrder.push(`${options.schedule.ownerDid}:${options.schedule.id}`);
                activeOwner = undefined;

                return successfulResult(`agent-${options.schedule.id}`);
            },
        });

        const cycle = await scheduler.runOnce('manual');
        const advanced = await schedulesRuntime.get(OWNER_DID, 'old');

        expect(cycle.results.every(result => result.status === 'succeeded')).toBe(true);
        expect(executionOrder).toEqual([
            `${OWNER_DID}:old`,
            `${OWNER_DID}:same-user`,
            `${OTHER_DID}:other-user`,
        ]);
        expect(advanced?.nextRunAt.getTime()).toBeGreaterThan(NOW.getTime());
    });

    it('suppresses duplicate occurrences and abandons an edit/delete race before agent execution', async () => {
        const duplicateSchedule = createSchedule('duplicate');
        const duplicateRuntime = createRuntime([duplicateSchedule]);
        const duplicateRuns = createInMemoryAutonomousRunRepository([
            createRunningOccurrence(duplicateSchedule),
        ]);
        const duplicateRunner = vi.fn(async () => successfulResult('should-not-run'));
        const duplicateScheduler = createScheduler({
            runtime: duplicateRuntime.runtime,
            runRepository: duplicateRuns,
            runScheduledRequest: duplicateRunner,
        });

        await expect(duplicateScheduler.runOnce('manual')).resolves.toMatchObject({
            results: [{ status: 'skipped' }],
        });
        expect(duplicateRunner).not.toHaveBeenCalled();

        const racedSchedule = createSchedule('raced');
        const baseRuntime = createRuntime([racedSchedule]);
        const racedSchedulesRuntime: LearnCardAssistantSchedulesRuntime = {
            ...baseRuntime.schedulesRuntime,
            advanceNextRun: async () => false,
        };
        const racedRuntime = createRuntime([racedSchedule], {
            schedulesRuntime: racedSchedulesRuntime,
        });
        const racedRuns = createInMemoryAutonomousRunRepository();
        const racedRunner = vi.fn(async () => successfulResult('should-not-run'));
        const racedScheduler = createScheduler({
            runtime: racedRuntime.runtime,
            runRepository: racedRuns,
            runScheduledRequest: racedRunner,
        });
        const racedCycle = await racedScheduler.runOnce('manual');
        const storedRace = await racedRuns.findByOccurrence(
            OWNER_DID,
            racedSchedule.id,
            racedSchedule.nextRunAt
        );

        expect(racedCycle.results).toMatchObject([{ status: 'skipped', runId: 'run-1' }]);
        expect(storedRace?.status).toBe('abandoned');
        expect(racedRunner).not.toHaveBeenCalled();
    });

    it('allows only one concurrent scheduler to execute the same occurrence', async () => {
        const { runtime } = createRuntime([createSchedule('contended')]);
        const runRepository = createInMemoryAutonomousRunRepository();
        let leaseIndex = 0;
        const baseLeaseRepository = createInMemoryAutonomousLeaseRepository(
            () => `lease-${++leaseIndex}`
        );
        const acquired = Promise.withResolvers<void>();
        const gate = Promise.withResolvers<void>();
        let blockFirstLease = true;
        const leaseRepository: AutonomousLeaseRepository = {
            ...baseLeaseRepository,
            acquire: async (ownerDid, scheduleId, runId, now, expiresAt) => {
                const leaseId = await baseLeaseRepository.acquire(
                    ownerDid,
                    scheduleId,
                    runId,
                    now,
                    expiresAt
                );
                if (leaseId && blockFirstLease) {
                    blockFirstLease = false;
                    acquired.resolve();
                    await gate.promise;
                }

                return leaseId;
            },
        };
        const runner = vi.fn(async () => successfulResult('agent-contended'));
        const first = createScheduler({
            runtime,
            runRepository,
            leaseRepository,
            createId: () => 'run-first',
            runScheduledRequest: runner,
        });
        const second = createScheduler({
            runtime,
            runRepository,
            leaseRepository,
            createId: () => 'run-second',
            runScheduledRequest: runner,
        });
        const firstCycle = first.runOnce('manual');
        await acquired.promise;
        const secondCycle = await second.runOnce('manual');

        gate.resolve();
        const firstResult = await firstCycle;

        expect(firstResult.results).toMatchObject([{ status: 'succeeded' }]);
        expect(secondCycle.results).toMatchObject([{ status: 'contended' }]);
        expect(runner).toHaveBeenCalledTimes(1);
    });

    it('records failures and continues with later due schedules and later interval cycles', async () => {
        vi.useFakeTimers();

        const schedules = [createSchedule('fails'), createSchedule('succeeds')];
        const { runtime } = createRuntime(schedules);
        const runRepository = createInMemoryAutonomousRunRepository();
        let attempts = 0;
        const scheduler = createScheduler({
            runtime,
            runRepository,
            maxRunsPerCycle: 1,
            createId: (() => {
                let index = 0;

                return () => `run-${++index}`;
            })(),
            leaseRepository: createInMemoryAutonomousLeaseRepository(
                (() => {
                    let index = 0;

                    return () => `lease-${++index}`;
                })()
            ),
            runScheduledRequest: async options => {
                attempts += 1;
                if (options.schedule.id === 'fails') throw new Error('provider/retro/card failed');

                return successfulResult(`agent-${options.schedule.id}`);
            },
        });

        await scheduler.start();
        expect(attempts).toBe(1);

        await vi.advanceTimersByTimeAsync(1_000);
        expect(attempts).toBe(2);

        await scheduler.stop();
        await expect(
            runRepository.findByOccurrence(OWNER_DID, 'fails', schedules[0]!.nextRunAt)
        ).resolves.toMatchObject({ status: 'failed' });
        await expect(
            runRepository.findByOccurrence(OWNER_DID, 'succeeds', schedules[1]!.nextRunAt)
        ).resolves.toMatchObject({ status: 'succeeded' });
    });

    it('aborts the agent and fails the occurrence when heartbeat ownership is lost', async () => {
        vi.useFakeTimers();

        const { runtime } = createRuntime([createSchedule('lost-lease')]);
        const runRepository = createInMemoryAutonomousRunRepository();
        const leaseRepository = createInMemoryAutonomousLeaseRepository(() => 'lease-lost');
        vi.spyOn(leaseRepository, 'renew').mockResolvedValue(false);
        let observedSignal: AbortSignal | undefined;
        const scheduler = createScheduler({
            runtime,
            runRepository,
            leaseRepository,
            leaseMs: 3_000,
            runScheduledRequest: async ({ signal }) => {
                observedSignal = signal;
                if (!signal) throw new Error('Expected scheduler abort signal.');

                await new Promise<void>((_resolve, reject) => {
                    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
                });

                throw new Error('Unreachable scheduled result.');
            },
        });

        const cyclePromise = scheduler.runOnce('manual');
        await vi.advanceTimersByTimeAsync(1_000);
        const cycle = await cyclePromise;

        expect(observedSignal?.aborted).toBe(true);
        expect(cycle.results).toMatchObject([{ status: 'failed', runId: 'run-1' }]);
        await expect(
            runRepository.findByOccurrence(OWNER_DID, 'lost-lease', new Date(NOW.getTime() - 1_000))
        ).resolves.toMatchObject({
            status: 'failed',
            error: 'Error: Autonomous owner lease was lost during execution.',
        });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('drains an active cycle on stop without scheduling another cycle', async () => {
        vi.useFakeTimers();

        const { runtime } = createRuntime([createSchedule('slow')]);
        const started = Promise.withResolvers<void>();
        const gate = Promise.withResolvers<void>();
        const runRepository = createInMemoryAutonomousRunRepository();
        const leaseRepository = createInMemoryAutonomousLeaseRepository(() => 'lease-slow');
        const renewRun = vi.spyOn(runRepository, 'renewLease');
        const renewLease = vi.spyOn(leaseRepository, 'renew');
        const scheduler = createScheduler({
            runtime,
            runRepository,
            leaseRepository,
            leaseMs: 3_000,
            runScheduledRequest: async () => {
                started.resolve();
                await gate.promise;

                return successfulResult('agent-slow');
            },
        });
        const startPromise = scheduler.start();
        await started.promise;

        let stopped = false;
        const stopPromise = scheduler.stop().then(() => {
            stopped = true;
        });
        await vi.advanceTimersByTimeAsync(10_000);
        expect(stopped).toBe(false);
        expect(renewLease).toHaveBeenCalled();
        expect(renewRun).toHaveBeenCalled();

        gate.resolve();
        await Promise.all([startPromise, stopPromise]);
        expect(stopped).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });
});
