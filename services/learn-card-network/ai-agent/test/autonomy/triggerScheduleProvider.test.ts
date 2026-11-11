import { configure } from '@trigger.dev/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createAgentAutonomyScheduleService,
    createInMemoryAgentAutonomyScheduleRepository,
    createLearnCardAssistantSchedulesRuntime,
    type CreateAgentAutonomyScheduleInput,
    type LearnCardAssistantSchedulesRuntime,
} from '../../src/autonomy/schedules';
import {
    createProviderSyncedAssistantSchedulesRuntime,
    createTriggerAgentAutonomyScheduleProvider,
    getTriggerScheduleDeduplicationKey,
    TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
    TRIGGER_AUTONOMOUS_SCHEDULE_WINDOW,
    type AgentAutonomyScheduleProvider,
    type TriggerScheduleClient,
} from '../../src/autonomy/triggerScheduleProvider';
import { requireNonFailedAutonomyResult } from '../../src/trigger/autonomousAgent';
import type { MongoRuntime } from '../../src/mongo';

const OWNER_DID = 'did:key:owner';
const NOW = new Date('2026-07-17T12:00:00.000Z');

const unavailableMongoRuntime: MongoRuntime = {
    getClient: async () => {
        throw new Error('No Mongo.');
    },
    getDb: async () => {
        throw new Error('No Mongo.');
    },
    getStatus: async () => ({ configured: false, connected: false, dbName: 'test' }),
    close: async () => undefined,
};

const input = (enabled = true): CreateAgentAutonomyScheduleInput => ({
    ownerDid: OWNER_DID,
    name: 'Morning briefing',
    prompt: 'Create a concise morning briefing.',
    enabled,
    timeOfDay: '07:30',
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: 'America/New_York',
});

const createRuntime = (
    provider: AgentAutonomyScheduleProvider
): LearnCardAssistantSchedulesRuntime => {
    const service = createAgentAutonomyScheduleService(
        createInMemoryAgentAutonomyScheduleRepository(),
        { now: () => new Date(NOW), createId: () => 'schedule-1' }
    );
    const runtime = createLearnCardAssistantSchedulesRuntime({
        mongoRuntime: unavailableMongoRuntime,
        service,
    });

    return createProviderSyncedAssistantSchedulesRuntime(runtime, provider, () => new Date(NOW));
};

describe('Trigger.dev schedule synchronization', () => {
    it('upserts, activates, and records the provider schedule ID', async () => {
        const provider: AgentAutonomyScheduleProvider = {
            upsert: vi.fn(async () => 'sched_1'),
            remove: vi.fn(async () => undefined),
        };
        const runtime = createRuntime(provider);

        const schedule = await runtime.create(input());

        expect(provider.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'schedule-1' }));
        expect(schedule).toMatchObject({
            id: 'schedule-1',
            triggerScheduleId: 'sched_1',
            triggerSyncedAt: NOW,
        });
        await expect(runtime.getByTriggerScheduleId(OWNER_DID, 'sched_1')).resolves.toMatchObject({
            id: 'schedule-1',
        });
    });

    it('rolls back local creation when provider synchronization fails', async () => {
        const provider: AgentAutonomyScheduleProvider = {
            upsert: vi.fn(async () => {
                throw new Error('Trigger unavailable.');
            }),
            remove: vi.fn(async () => undefined),
        };
        const runtime = createRuntime(provider);

        await expect(runtime.create(input())).rejects.toThrow('Trigger unavailable.');
        await expect(runtime.list(OWNER_DID)).resolves.toEqual([]);
    });

    it('marks an updated schedule out of sync when the provider update fails', async () => {
        const upsert = vi
            .fn<AgentAutonomyScheduleProvider['upsert']>()
            .mockResolvedValueOnce('sched_1')
            .mockRejectedValueOnce(new Error('Trigger unavailable.'));
        const runtime = createRuntime({
            upsert,
            remove: vi.fn(async () => undefined),
        });
        await runtime.create(input());

        await expect(
            runtime.update({ ownerDid: OWNER_DID, id: 'schedule-1', name: 'Updated briefing' })
        ).rejects.toThrow('Trigger unavailable.');

        const schedule = await runtime.get(OWNER_DID, 'schedule-1');
        expect(schedule).toMatchObject({
            name: 'Updated briefing',
            triggerScheduleId: 'sched_1',
        });
        expect(schedule).not.toHaveProperty('triggerSyncedAt');
    });

    it('disables locally before deleting the provider schedule', async () => {
        const provider: AgentAutonomyScheduleProvider = {
            upsert: vi.fn(async () => 'sched_1'),
            remove: vi.fn(async () => {
                await expect(runtime.get(OWNER_DID, 'schedule-1')).resolves.toMatchObject({
                    enabled: false,
                });
            }),
        };
        const runtime = createRuntime(provider);
        await runtime.create(input());

        await runtime.remove(OWNER_DID, 'schedule-1');

        expect(provider.remove).toHaveBeenCalledWith('sched_1');
        await expect(runtime.get(OWNER_DID, 'schedule-1')).resolves.toBeUndefined();
    });

    it('maps LearnCard cadence and enabled state to the Trigger SDK', async () => {
        const client: TriggerScheduleClient = {
            create: vi.fn(async () => ({ id: 'sched_1' })),
            activate: vi.fn(async () => undefined),
            deactivate: vi.fn(async () => undefined),
            del: vi.fn(async () => undefined),
        };
        const provider = createTriggerAgentAutonomyScheduleProvider({
            environment: 'dev',
            isOwnerAllowed: async ownerDid => ownerDid === OWNER_DID,
            client,
        });
        const runtime = createRuntime(provider);

        const schedule = await runtime.create(input(false));

        expect(client.create).toHaveBeenCalledWith({
            task: TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
            cron: '30 7 * * 1,2,3,4,5',
            timezone: 'America/New_York',
            externalId: OWNER_DID,
            deduplicationKey: getTriggerScheduleDeduplicationKey('dev', schedule),
            window: '0m',
        });
        expect(client.deactivate).toHaveBeenCalledWith('sched_1');
        expect(client.activate).not.toHaveBeenCalled();
    });

    it('rejects schedule owners disabled by runtime access control', async () => {
        const client: TriggerScheduleClient = {
            create: vi.fn(async () => ({ id: 'sched_1' })),
            activate: vi.fn(async () => undefined),
            deactivate: vi.fn(async () => undefined),
            del: vi.fn(async () => undefined),
        };
        const provider = createTriggerAgentAutonomyScheduleProvider({
            environment: 'staging',
            isOwnerAllowed: async () => false,
            client,
        });
        const runtime = createRuntime(provider);

        await expect(runtime.create(input())).rejects.toThrow(
            'not enabled for autonomous execution'
        );
        expect(client.create).not.toHaveBeenCalled();
        await expect(runtime.list(OWNER_DID)).resolves.toEqual([]);
    });
});

describe('Trigger.dev schedule window', () => {
    // Shape of GET /api/v1/schedules/{id} for the staging smoke schedule that never fired: the
    // default 1h window pushed the effective start 20 minutes past the cron minute.
    const capturedSchedule = {
        id: 'sched_anmjoirhw4wx14pmpf37u',
        type: 'IMPERATIVE',
        task: TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
        active: true,
        nextRun: '2026-10-19T21:23:00.000Z',
        nextRunEffectiveAt: '2026-10-19T21:43:30.800Z',
        generator: { type: 'CRON', expression: '23 21 * * 1', description: '' },
        timezone: 'UTC',
        window: '1h',
        externalId: OWNER_DID,
        deduplicationKey: `staging:${OWNER_DID}:schedule-1`,
        environments: [{ id: 'env_1', type: 'PRODUCTION' }],
    };

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('asks the real Trigger.dev SDK for a 0m window on create and update', async () => {
        const requests: Array<{ url: string; method: string; body: unknown }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
                requests.push({
                    url: String(url),
                    method: init?.method ?? 'GET',
                    body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
                });

                return new Response(JSON.stringify(capturedSchedule), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            })
        );
        configure({ baseURL: 'https://trigger.test', accessToken: 'tr_test_placeholder' });
        const provider = createTriggerAgentAutonomyScheduleProvider({
            environment: 'staging',
            isOwnerAllowed: async () => true,
        });
        const runtime = createRuntime(provider);

        await runtime.create(input());
        await runtime.update({ ownerDid: OWNER_DID, id: 'schedule-1', timeOfDay: '08:00' });

        const scheduleWrites = requests.filter(
            request => request.method === 'POST' && request.url.endsWith('/api/v1/schedules')
        );
        expect(TRIGGER_AUTONOMOUS_SCHEDULE_WINDOW).toBe('0m');
        expect(scheduleWrites).toHaveLength(2);
        for (const request of scheduleWrites) {
            expect(request.body).toMatchObject({
                task: TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
                window: '0m',
            });
        }
    });
});

describe('Trigger.dev autonomous execution status', () => {
    const result = {
        ownerDid: OWNER_DID,
        scheduleId: 'schedule-1',
        scheduledFor: NOW.toISOString(),
        status: 'skipped',
    } as const;

    it('returns non-failed scheduler results', () => {
        expect(requireNonFailedAutonomyResult(result)).toBe(result);
    });

    it('throws when the scheduler persisted a failed result', () => {
        expect(() =>
            requireNonFailedAutonomyResult({ ...result, status: 'failed', runId: 'run-1' })
        ).toThrow('Autonomous execution run-1 failed');
    });
});
