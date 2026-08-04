import type { Express } from 'express';
import type { Db } from 'mongodb';
import { describe, expect, it, vi } from 'vitest';

import {
    AGENT_AUTONOMY_SCHEDULES_COLLECTION,
    AgentAutonomyScheduleLimitError,
    CreateAgentAutonomyScheduleValidator,
    createAgentAutonomyScheduleService,
    createInMemoryAgentAutonomyScheduleRepository,
    createLearnCardAssistantSchedulesRuntime,
    createMongoAgentAutonomyScheduleRepository,
    getCanonicalScheduleCron,
    getNextScheduleRun,
    type AgentAutonomySchedule,
    type AgentAutonomyScheduleService,
    type CreateAgentAutonomyScheduleInput,
} from '../../src/autonomy/schedules';
import type { ServiceConfig } from '../../src/config';
import type { MongoRuntime } from '../../src/mongo';
import type { EncryptedJsonEnvelopeV1, EncryptionService } from '../../src/security/encryption';
import { createServer } from '../../src/server';

const OWNER_DID = 'did:key:owner';
const OTHER_DID = 'did:key:other';
const BASE_NOW = new Date('2026-07-15T12:00:00.000Z');

const createService = (
    initialSchedules: AgentAutonomySchedule[] = [],
    now = BASE_NOW,
    ids: string[] = []
): AgentAutonomyScheduleService => {
    let idIndex = 0;

    return createAgentAutonomyScheduleService(
        createInMemoryAgentAutonomyScheduleRepository(initialSchedules),
        {
            now: () => new Date(now),
            createId: () => ids[idIndex++] ?? `schedule-${idIndex}`,
        }
    );
};

const createInput = (
    overrides: Partial<CreateAgentAutonomyScheduleInput> = {}
): CreateAgentAutonomyScheduleInput => ({
    ownerDid: OWNER_DID,
    name: 'Morning briefing',
    prompt: 'Create a concise morning briefing.',
    timeOfDay: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timezone: 'America/Los_Angeles',
    ...overrides,
});

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

const testConfig: ServiceConfig = {
    nodeEnv: 'test',
    model: 'test-model',
    port: 0,
    maxToolRounds: 3,
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoDbName: 'test-ai-agent',
    selfImprovementEnabled: true,
    retroModel: 'retro-model',
    retroMaxTraceChars: 24_000,
    authChallengeTtlMs: 300_000,
    encryptionKeyId: 'test-key',
    debugEnabled: true,
};

interface TestRouteHandler {
    handle: (
        req: { body?: unknown; params: Record<string, string>; query?: Record<string, unknown> },
        res: TestRouteResponse,
        next?: () => void
    ) => Promise<void> | void;
}

interface TestRoute {
    path: string;
    methods: Record<string, boolean>;
    stack: TestRouteHandler[];
}

interface ExpressWithRouter extends Express {
    _router: { stack: Array<{ route?: TestRoute }> };
}

interface TestRouteResponse {
    locals: Record<string, unknown>;
    status(code: number): TestRouteResponse;
    json(payload: unknown): TestRouteResponse;
}

const findRoute = (
    app: Express,
    method: 'get' | 'post' | 'patch' | 'delete',
    routePath: string
): TestRoute | undefined =>
    (app as ExpressWithRouter)._router.stack.find(
        layer => layer.route?.path === routePath && layer.route.methods[method]
    )?.route;

const callRoute = async (
    app: Express,
    method: 'get' | 'post' | 'patch' | 'delete',
    routePath: string,
    body: unknown,
    params: Record<string, string>
): Promise<{ status: number; payload: unknown }> => {
    const handler = findRoute(app, method, routePath)?.stack.at(-1)?.handle;
    if (!handler) throw new Error(`Route ${method.toUpperCase()} ${routePath} not found.`);

    const { promise, resolve, reject } = Promise.withResolvers<{
        status: number;
        payload: unknown;
    }>();
    let status = 200;
    const response: TestRouteResponse = {
        locals: {
            agentDidAuth: {
                did: params.did,
                challenge: 'test-challenge',
                domain: 'http://test.local',
            },
        },
        status: code => {
            status = code;

            return response;
        },
        json: payload => {
            resolve({ status, payload });

            return response;
        },
    };

    Promise.resolve(handler({ body, params, query: {} }, response)).catch(reject);

    return promise;
};

describe('agent autonomy schedules', () => {
    it('validates bounds, sorts days, defaults enabled, and builds canonical cron', () => {
        const parsed = CreateAgentAutonomyScheduleValidator.parse(
            createInput({ daysOfWeek: [6, 1, 0] })
        );

        expect(parsed.enabled).toBe(true);
        expect(parsed.daysOfWeek).toEqual([0, 1, 6]);
        expect(getCanonicalScheduleCron(parsed.timeOfDay, parsed.daysOfWeek)).toBe(
            '30 7 * * 0,1,6'
        );

        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ name: '' }))
        ).toThrow();
        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ name: 'A'.repeat(61) }))
        ).toThrow();
        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ prompt: 'A'.repeat(4_001) }))
        ).toThrow();
        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ timeOfDay: '24:00' }))
        ).toThrow();
        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ daysOfWeek: [1, 1] }))
        ).toThrow();
        expect(() =>
            CreateAgentAutonomyScheduleValidator.parse(createInput({ timezone: 'Mars/Olympus' }))
        ).toThrow();
    });

    it('uses Croner timezone behavior for DST gaps and overlaps', () => {
        expect(
            getNextScheduleRun(
                '30 2 * * 0',
                'America/New_York',
                new Date('2026-03-08T05:00:00.000Z')
            ).toISOString()
        ).toBe('2026-03-08T07:30:00.000Z');

        const overlap = getNextScheduleRun(
            '30 1 * * 0',
            'America/New_York',
            new Date('2026-11-01T04:00:00.000Z')
        );

        expect(overlap.toISOString()).toBe('2026-11-01T05:30:00.000Z');
        expect(getNextScheduleRun('30 1 * * 0', 'America/New_York', overlap).toISOString()).toBe(
            '2026-11-08T06:30:00.000Z'
        );
    });

    it('recomputes future runs on cadence changes and collapses missed runs', async () => {
        const service = createService([], BASE_NOW, ['schedule-1']);
        const created = await service.create(createInput());

        expect(created.nextRunAt.getTime()).toBeGreaterThan(BASE_NOW.getTime());

        const updated = await service.update({
            ownerDid: OWNER_DID,
            id: created.id,
            timeOfDay: '08:15',
            daysOfWeek: [1, 3, 5],
            timezone: 'America/New_York',
        });

        expect(updated.cron).toBe('15 8 * * 1,3,5');
        expect(updated.nextRunAt.getTime()).toBeGreaterThan(BASE_NOW.getTime());

        const scheduledFor = updated.nextRunAt;
        const afterDowntime = new Date(scheduledFor.getTime() + 21 * 24 * 60 * 60 * 1_000);

        await expect(
            service.advanceNextRun(OWNER_DID, created.id, scheduledFor, afterDowntime)
        ).resolves.toBe(true);

        const advanced = await service.get(OWNER_DID, created.id);
        expect(advanced?.nextRunAt.getTime()).toBeGreaterThan(afterDowntime.getTime());
        await expect(
            service.advanceNextRun(OWNER_DID, created.id, scheduledFor, afterDowntime)
        ).resolves.toBe(false);
    });

    it('recalculates when disabled or re-enabled and excludes disabled due schedules', async () => {
        const due = new Date(BASE_NOW.getTime() - 1_000);
        const initial: AgentAutonomySchedule = {
            id: 'schedule-1',
            ownerDid: OWNER_DID,
            name: 'Due task',
            prompt: 'Do the task.',
            enabled: true,
            timeOfDay: '07:30',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            timezone: 'UTC',
            cron: '30 7 * * 0,1,2,3,4,5,6',
            nextRunAt: due,
            createdAt: due,
            updatedAt: due,
        };
        const service = createService([initial]);
        const disabled = await service.update({
            ownerDid: OWNER_DID,
            id: initial.id,
            enabled: false,
        });

        expect(disabled.enabled).toBe(false);
        expect(disabled.nextRunAt.getTime()).toBeGreaterThan(BASE_NOW.getTime());
        await expect(
            service.listDue([OWNER_DID], new Date(BASE_NOW.getTime() + 86_400_000))
        ).resolves.toEqual([]);

        const reEnabled = await service.update({
            ownerDid: OWNER_DID,
            id: initial.id,
            enabled: true,
        });
        expect(reEnabled.enabled).toBe(true);
        expect(reEnabled.nextRunAt.getTime()).toBeGreaterThan(BASE_NOW.getTime());
    });

    it('enforces ten schedules per owner without affecting another owner', async () => {
        const service = createService(
            [],
            BASE_NOW,
            Array.from({ length: 11 }, (_, index) => `schedule-${index}`)
        );

        for (let index = 0; index < 10; index += 1) {
            await service.create(createInput({ name: `Schedule ${index}` }));
        }

        await expect(service.create(createInput({ name: 'Schedule 11' }))).rejects.toBeInstanceOf(
            AgentAutonomyScheduleLimitError
        );
        await expect(
            service.create(createInput({ ownerDid: OTHER_DID, name: 'Other owner schedule' }))
        ).resolves.toMatchObject({ ownerDid: OTHER_DID });

        const first = (await service.list(OWNER_DID))[0];
        expect(first).toBeDefined();
        await service.remove(OWNER_DID, first!.id);
        await expect(
            service.create(createInput({ name: 'Replacement schedule' }))
        ).resolves.toBeDefined();
        await expect(service.get(OTHER_DID, first!.id)).resolves.toBeUndefined();
    });

    it('orders due metadata without exposing encrypted fields', async () => {
        const dueAt = new Date(BASE_NOW.getTime() - 1_000);
        const schedules: AgentAutonomySchedule[] = [
            {
                ...(await createService([], BASE_NOW, ['later']).create(createInput())),
                nextRunAt: new Date(dueAt.getTime() + 500),
            },
            {
                ...(await createService([], BASE_NOW, ['earlier']).create(
                    createInput({ ownerDid: OTHER_DID })
                )),
                nextRunAt: dueAt,
            },
        ];
        const service = createService(schedules);
        const due = await service.listDue([OWNER_DID, OTHER_DID], BASE_NOW);

        expect(due).toEqual([
            { id: 'earlier', ownerDid: OTHER_DID, nextRunAt: dueAt },
            {
                id: 'later',
                ownerDid: OWNER_DID,
                nextRunAt: new Date(dueAt.getTime() + 500),
            },
        ]);
        expect(due[0]).not.toHaveProperty('name');
        expect(due[0]).not.toHaveProperty('prompt');
    });

    it('encrypts names and prompts with owner- and schedule-scoped AAD', async () => {
        const documents: Array<Record<string, unknown>> = [];
        const encryptedValues = new Map<EncryptedJsonEnvelopeV1, unknown>();
        const encryptAads: string[] = [];
        const decryptAads: string[] = [];
        const encryption: EncryptionService = {
            encryptJson: async (value, aad) => {
                const envelope = {
                    __learnCardAiAgentEncrypted: true,
                    version: 1,
                    format: 'dag-jwe',
                    kid: 'test-key',
                    recipientDid: 'did:key:agent',
                    jwe: {},
                } as EncryptedJsonEnvelopeV1;

                encryptedValues.set(envelope, value);
                encryptAads.push(aad);

                return envelope;
            },
            decryptJson: async <T>(envelope: EncryptedJsonEnvelopeV1, aad: string): Promise<T> => {
                decryptAads.push(aad);

                return encryptedValues.get(envelope) as T;
            },
            decryptLegacyOrEnvelope: async <T>(value: T | EncryptedJsonEnvelopeV1) => ({
                value: encryptedValues.has(value as EncryptedJsonEnvelopeV1)
                    ? (encryptedValues.get(value as EncryptedJsonEnvelopeV1) as T)
                    : (value as T),
                legacyPlaintext: false,
            }),
        };
        const collection = {
            createIndex: vi.fn(async () => 'index'),
            insertOne: vi.fn(async (document: Record<string, unknown>) => {
                documents.push(document);

                return { acknowledged: true };
            }),
            findOne: vi.fn(async (filter: Record<string, unknown>) =>
                documents.find(
                    document => document.ownerDid === filter.ownerDid && document.id === filter.id
                )
            ),
            find: vi.fn((filter: Record<string, unknown>) => {
                const ownerFilter = filter.ownerDid as string | { $in: string[] } | undefined;
                const selected = documents.filter(document => {
                    const ownerMatches =
                        typeof ownerFilter === 'string'
                            ? document.ownerDid === ownerFilter
                            : ownerFilter?.$in.includes(String(document.ownerDid)) ?? true;
                    const enabledMatches =
                        filter.enabled === undefined || document.enabled === filter.enabled;
                    const nextRunFilter = filter.nextRunAt as { $lte?: Date } | undefined;
                    const dateMatches =
                        !nextRunFilter?.$lte ||
                        (document.nextRunAt as Date).getTime() <= nextRunFilter.$lte.getTime();

                    return ownerMatches && enabledMatches && dateMatches;
                });
                const cursor = {
                    sort: () => cursor,
                    toArray: async () => selected,
                };

                return cursor;
            }),
            countDocuments: vi.fn(async () => documents.length),
            replaceOne: vi.fn(),
            deleteOne: vi.fn(),
            updateOne: vi.fn(),
        };
        const db = { collection: () => collection } as unknown as Db;
        const repository = createMongoAgentAutonomyScheduleRepository(db, encryption);
        const schedule = await createService([], BASE_NOW, ['schedule-1']).create(createInput());

        await repository.create(schedule);

        expect(documents[0]?.name).not.toBe(schedule.name);
        expect(documents[0]?.prompt).not.toBe(schedule.prompt);
        expect(encryptAads).toEqual([
            `collection:${AGENT_AUTONOMY_SCHEDULES_COLLECTION}:owner:${OWNER_DID}:id:schedule-1:field:name:v1`,
            `collection:${AGENT_AUTONOMY_SCHEDULES_COLLECTION}:owner:${OWNER_DID}:id:schedule-1:field:prompt:v1`,
        ]);

        await expect(repository.findById(OWNER_DID, schedule.id)).resolves.toMatchObject({
            name: schedule.name,
            prompt: schedule.prompt,
        });
        expect(decryptAads).toEqual(encryptAads);

        decryptAads.length = 0;
        await repository.listDue([OWNER_DID], new Date(schedule.nextRunAt.getTime() + 1));
        expect(decryptAads).toEqual([]);
    });

    it('returns an empty development list without Mongo and rejects writes or worker access', async () => {
        const runtime = createLearnCardAssistantSchedulesRuntime({
            mongoRuntime: unavailableMongoRuntime,
        });

        await expect(runtime.list(OWNER_DID)).resolves.toEqual([]);
        await expect(runtime.create(createInput())).rejects.toThrow(
            'LearnCard Assistant schedule storage is not available.'
        );
        await expect(runtime.listDue([OWNER_DID], BASE_NOW)).rejects.toThrow(
            'LearnCard Assistant schedule storage is not available.'
        );
    });

    it('supports owner-scoped CRUD routes and rejects mismatched DIDs', async () => {
        const scheduleService = createService([], BASE_NOW, ['schedule-1']);
        const scheduleRuntime = createLearnCardAssistantSchedulesRuntime({
            mongoRuntime: unavailableMongoRuntime,
            service: scheduleService,
        });
        const app = createServer({
            config: testConfig,
            mongoRuntime: unavailableMongoRuntime,
            assistantSchedulesRuntime: scheduleRuntime,
        });
        const routeParams = { did: OWNER_DID };
        const createBody = {
            name: 'Morning briefing',
            prompt: 'Create a concise morning briefing.',
            timeOfDay: '07:30',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            timezone: 'America/Los_Angeles',
        };
        const created = await callRoute(
            app,
            'post',
            '/api/users/:did/assistant-schedules',
            createBody,
            routeParams
        );

        expect(created).toMatchObject({
            status: 201,
            payload: {
                ok: true,
                schedule: { id: 'schedule-1', ownerDid: OWNER_DID, nextRunAt: expect.any(String) },
            },
        });

        await expect(
            callRoute(app, 'get', '/api/users/:did/assistant-schedules', undefined, routeParams)
        ).resolves.toMatchObject({
            status: 200,
            payload: { ok: true, schedules: [{ id: 'schedule-1' }] },
        });

        await expect(
            callRoute(
                app,
                'patch',
                '/api/users/:did/assistant-schedules/:id',
                { name: 'Updated briefing' },
                { ...routeParams, id: 'schedule-1' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: { schedule: { name: 'Updated briefing' } },
        });

        await expect(
            callRoute(app, 'delete', '/api/users/:did/assistant-schedules/:id', undefined, {
                ...routeParams,
                id: 'schedule-1',
            })
        ).resolves.toEqual({ status: 200, payload: { ok: true } });
        await expect(
            callRoute(app, 'delete', '/api/users/:did/assistant-schedules/:id', undefined, {
                ...routeParams,
                id: 'schedule-1',
            })
        ).resolves.toMatchObject({ status: 404 });

        const protectedRoute = findRoute(app, 'get', '/api/users/:did/assistant-schedules');
        const matchingDidGuard = protectedRoute?.stack[1]?.handle;
        expect(matchingDidGuard).toBeDefined();

        const { promise, resolve } = Promise.withResolvers<{ status: number; payload: unknown }>();
        let status = 200;
        const response: TestRouteResponse = {
            locals: { agentDidAuth: { did: OWNER_DID } },
            status: code => {
                status = code;

                return response;
            },
            json: payload => {
                resolve({ status, payload });

                return response;
            },
        };

        matchingDidGuard?.({ params: { did: OTHER_DID } }, response, vi.fn());

        await expect(promise).resolves.toEqual({
            status: 403,
            payload: {
                ok: false,
                error: 'Authenticated DID does not match requested DID.',
            },
        });
    });
});
