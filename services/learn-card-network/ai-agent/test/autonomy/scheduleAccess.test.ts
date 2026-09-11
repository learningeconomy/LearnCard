import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const flag = vi.hoisted(() => ({ enabled: false, unavailable: false }));
vi.mock('@launchdarkly/node-server-sdk', () => ({
    init: () => {
        const client = {
            waitForInitialization: async () => client,
            close: async () => undefined,
            variationDetail: async () => {
                if (flag.unavailable) throw new Error('SDK unavailable');
                return { value: flag.enabled, reason: { kind: 'OFF' } };
            },
        };
        return client;
    },
}));

import { getConfig, type ServiceConfig } from '../../src/config';
import { createServer, AGENT_SERVER_SHUTDOWN, type AgentServer } from '../../src/server';
import { createInMemoryDidAuthChallengeStore } from '../../src/security/didAuth';
import { closeAutonomyAccessControl } from '../../src/autonomy/accessControl';
import {
    createAgentAutonomyScheduleService,
    createInMemoryAgentAutonomyScheduleRepository,
} from '../../src/autonomy/schedules';

const ownerDid = 'did:web:example.test:users:synthetic';
const body = {
    name: 'Synthetic schedule',
    prompt: 'Read-only synthetic task',
    timeOfDay: '09:00',
    daysOfWeek: [1],
    timezone: 'UTC',
    enabled: true,
};

let app: AgentServer;
let server: Server;
let baseUrl: string;
let config: ServiceConfig;
let challengeStore: ReturnType<typeof createInMemoryDidAuthChallengeStore>;
let repository: ReturnType<typeof createInMemoryAgentAutonomyScheduleRepository>;

beforeEach(async () => {
    flag.enabled = false;
    flag.unavailable = false;
    config = {
        ...getConfig(),
        nodeEnv: 'production',
        sentryEnvironment: 'production',
        triggerEnvironment: 'production',
        triggerEnabled: true,
        launchDarklySdkKey: 'sdk-test',
        authDomain: 'https://agent.example.test',
        debugEnabled: false,
    };
    challengeStore = createInMemoryDidAuthChallengeStore();
    repository = createInMemoryAgentAutonomyScheduleRepository();
    const service = createAgentAutonomyScheduleService(repository);
    app = createServer({
        config,
        tools: [],
        didAuthChallengeStore: challengeStore,
        // DID Auth cryptographic verification has its own suite; exercise real route middleware here.
        getVerifierLearnCard: async () => ({
            invoke: {
                verifyPresentation: async () => ({ checks: ['JWS'], warnings: [], errors: [] }),
            },
        }),
        assistantSchedulesRuntime: {
            ...service,
            getStatus: async () => ({ configured: true, connected: true }),
        },
        assistantScheduleProvider: {
            upsert: async schedule => `trigger-${schedule.id}`,
            remove: async () => undefined,
        },
    });
    server = await new Promise<Server>(resolve => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No HTTP test address');
    baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
    server?.closeAllConnections();
    if (server)
        await new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve()))
        );
    await app?.[AGENT_SERVER_SHUTDOWN]();
    await closeAutonomyAccessControl();
});

const request = async (method: string, id?: string): Promise<Response> => {
    const nonce = randomUUID();
    await challengeStore.insert(nonce, config.authDomain!, 60_000);
    const payload = Buffer.from(JSON.stringify({ nonce, vp: { holder: ownerDid } })).toString(
        'base64url'
    );
    return fetch(
        `${baseUrl}/api/users/${encodeURIComponent(ownerDid)}/assistant-schedules${
            id ? `/${id}` : ''
        }`,
        {
            method,
            headers: {
                Authorization: `Bearer header.${payload}.signature`,
                'Content-Type': 'application/json',
            },
            ...(method === 'POST' || method === 'PATCH' ? { body: JSON.stringify(body) } : {}),
        }
    );
};

describe('production schedule HTTP access', () => {
    it('denies all schedule routes while the flag is off without persisting a schedule', async () => {
        for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
            const response = await request(
                method,
                method === 'PATCH' || method === 'DELETE' ? 'missing' : undefined
            );
            expect(response.status).toBe(403);
        }
        expect(await repository.listByOwner(ownerDid)).toEqual([]);
    });

    it('rechecks the flag after an allowed creation and preserves the schedule on denied mutations', async () => {
        flag.enabled = true;
        const created = await request('POST');
        expect(created.status).toBe(201);
        const [schedule] = await repository.listByOwner(ownerDid);
        expect(schedule?.name).toBe(body.name);
        const listed = await request('GET');
        expect(listed.status).toBe(200);
        expect(await listed.json()).toMatchObject({ schedules: [{ id: schedule!.id }] });

        flag.enabled = false;
        expect((await request('PATCH', schedule!.id)).status).toBe(403);
        expect((await request('DELETE', schedule!.id)).status).toBe(403);
        expect((await request('GET')).status).toBe(403);
        expect(await repository.listByOwner(ownerDid)).toEqual([schedule]);
    });

    it('fails closed on SDK errors and when scheduling is disabled', async () => {
        flag.unavailable = true;
        expect((await request('POST')).status).toBe(503);
        flag.unavailable = false;
        flag.enabled = true;
        config.triggerEnabled = false;
        expect((await request('POST')).status).toBe(403);
        expect(await repository.listByOwner(ownerDid)).toEqual([]);
    });
});
