import { afterEach, describe, expect, it, vi } from 'vitest';

const access = vi.hoisted(() => ({ enabled: false }));
const trigger = vi.hoisted(() => vi.fn(async () => ({ id: 'synthetic-run' })));

vi.mock('@trigger.dev/sdk', () => ({
    AbortTaskRunError: class AbortTaskRunError extends Error {},
    task: (definition: object) => ({ ...definition, trigger }),
    schedules: { task: (definition: object) => definition },
    idempotencyKeys: { create: async (value: string) => value },
    logger: { info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@launchdarkly/node-server-sdk', () => ({
    init: () => {
        const client = {
            waitForInitialization: async () => client,
            close: async () => undefined,
            variationDetail: async () => ({ value: access.enabled, reason: { kind: 'OFF' } }),
        };
        return client;
    },
}));
vi.mock('../../src/observability', () => ({
    initializeObservability: () => undefined,
    recordServiceError: () => undefined,
    recordAutonomyCycle: () => undefined,
    flushObservability: async () => undefined,
    getOwnerTelemetryId: () => 'synthetic-owner',
}));
vi.mock('../../src/runtime', () => ({
    createAgentServiceRuntime: () => {
        throw new Error('Agent runtime must not start after access is revoked');
    },
}));

import {
    autonomousAgentExecution,
    autonomousScheduleDispatch,
} from '../../src/trigger/autonomousAgent';
import { closeAutonomyAccessControl } from '../../src/autonomy/accessControl';

const productionEnv = {
    NODE_ENV: 'production',
    SENTRY_ENV: 'production',
    SENTRY_DSN: 'https://public@example.ingest.sentry.io/1',
    AI_AGENT_TRIGGER_ENABLED: 'true',
    AI_AGENT_TRIGGER_ENVIRONMENT: 'production',
    AI_AGENT_AUTONOMY_DEV_ENABLED: 'false',
    AI_AGENT_DEBUG_ENABLED: 'false',
    AI_AGENT_SELF_IMPROVEMENT_ENABLED: 'true',
    AI_AGENT_WALLET_SEED: 'synthetic-seed',
    AI_AGENT_MONGO_URI: 'mongodb://127.0.0.1:1/synthetic',
    OPENAI_API_KEY: 'synthetic-key',
    TRIGGER_SECRET_KEY: 'synthetic-trigger-key',
    LAUNCHDARKLY_SDK_KEY: 'synthetic-ld-key',
    AI_AGENT_AUTH_DOMAIN: 'https://agent.example.test',
    AI_AGENT_NETWORK_URL: 'https://network.example.test/trpc',
    AI_AGENT_CLOUD_URL: 'https://cloud.example.test/trpc',
    AI_AGENT_CONSENT_FLOW_CONTRACT_URI: 'lc:network:example.test:contract:synthetic',
    AI_AGENT_INPUT_TOKEN_COST_USD_PER_MILLION: '0.2',
    AI_AGENT_OUTPUT_TOKEN_COST_USD_PER_MILLION: '1.2',
};

// The SDK's registration functions return the task definitions in this isolated test.
interface DispatchDefinition {
    run: (
        payload: { externalId: string; scheduleId: string; timestamp: Date },
        context: { ctx: { environment: { slug: string } } }
    ) => Promise<unknown>;
}
interface ExecutionDefinition {
    run: (
        payload: { ownerDid: string; triggerScheduleId: string; scheduledFor: string },
        context: { signal: AbortSignal }
    ) => Promise<unknown>;
}
const dispatch = autonomousScheduleDispatch as unknown as DispatchDefinition;
const execution = autonomousAgentExecution as unknown as ExecutionDefinition;

afterEach(async () => {
    await closeAutonomyAccessControl();
    vi.unstubAllEnvs();
    trigger.mockClear();
    access.enabled = false;
});

describe('production Trigger access boundaries', () => {
    it('blocks dispatch while off and rechecks queued work after targeting is revoked', async () => {
        for (const [name, value] of Object.entries(productionEnv)) vi.stubEnv(name, value);
        const payload = {
            externalId: 'did:web:example.test:users:synthetic',
            scheduleId: 'synthetic-schedule',
            timestamp: new Date(),
        };
        const context = { ctx: { environment: { slug: 'prod' } } };
        await expect(dispatch.run(payload, context)).rejects.toThrow(
            'not enabled for autonomous execution'
        );
        expect(trigger).not.toHaveBeenCalled();

        access.enabled = true;
        await expect(dispatch.run(payload, context)).resolves.toEqual({
            executionRunId: 'synthetic-run',
        });

        access.enabled = false;
        await expect(
            execution.run(
                {
                    ownerDid: payload.externalId,
                    triggerScheduleId: payload.scheduleId,
                    scheduledFor: payload.timestamp.toISOString(),
                },
                { signal: new AbortController().signal }
            )
        ).rejects.toThrow('not enabled for autonomous execution');
    });
});
