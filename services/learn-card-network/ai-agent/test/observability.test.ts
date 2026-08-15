import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/node';

import type { ServiceConfig } from '../src/config';
import {
    createAgentRunTelemetry,
    getOwnerTelemetryId,
    initializeObservability,
} from '../src/observability';

const config: ServiceConfig = {
    nodeEnv: 'development',
    model: 'test-model',
    port: 0,
    maxToolRounds: 5,
    runTimeoutMs: 120_000,
    maxOutputTokens: 4_096,
    maxRunTokens: 50_000,
    maxRunCostUsd: 1,
    inputTokenCostUsdPerMillion: 1,
    outputTokenCostUsdPerMillion: 2,
    metricsNamespace: 'LearnCard/TestAgent',
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoDbName: 'test-ai-agent',
    selfImprovementEnabled: false,
    retroMaxTraceChars: 24_000,
    authChallengeTtlMs: 300_000,
    encryptionKeyId: 'test-key',
    debugEnabled: false,
    autonomyDevEnabled: false,
    autonomyDevDids: [],
    autonomyDevPollIntervalMs: 30_000,
    autonomyDevMaxRunsPerCycle: 3,
    autonomyDevLeaseMs: 900_000,
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('AI Agent observability', () => {
    it('emits correlated CloudWatch metrics without raw owner or error data', () => {
        const write = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const ownerDid = 'did:key:private-owner';
        const sensitiveError = 'provider rejected secret prompt content';

        initializeObservability(config);

        const telemetry = createAgentRunTelemetry({
            runId: 'run-1',
            correlationId: 'request-1',
            ownerDid,
            triggerType: 'interactive',
            config,
        });

        telemetry.started();
        telemetry.observer.onModelComplete?.({
            runId: 'run-1',
            model: config.model,
            round: 0,
            durationMs: 25,
            requestId: 'provider-1',
            usage: {
                inputTokens: 1_000,
                outputTokens: 500,
                totalTokens: 1_500,
            },
        });
        telemetry.failed(new Error(sensitiveError), 30);

        const output = write.mock.calls.map(([line]) => String(line)).join('\n');
        const records = write.mock.calls.map(
            ([line]) => JSON.parse(String(line)) as Record<string, unknown>
        );
        const modelMetrics = records.find(record => record.event === 'agent.model.metrics');
        const runFailure = records.find(
            record => record.event === 'agent.run.failed' && !('_aws' in record)
        );
        const runFailureMetrics = records.find(
            record => record.event === 'agent.run.failed' && '_aws' in record
        );

        expect(output).not.toContain(ownerDid);
        expect(output).not.toContain(sensitiveError);
        expect(output).toContain(getOwnerTelemetryId(ownerDid));
        expect(modelMetrics).toMatchObject({
            runId: 'run-1',
            correlationId: 'request-1',
            Model: 'test-model',
            ModelCallCount: 1,
            ModelInputTokens: 1_000,
            ModelOutputTokens: 500,
            EstimatedCostUsd: 0.002,
        });
        expect(runFailure).toMatchObject({ errorType: 'Error' });
        expect(runFailureMetrics).toMatchObject({ RunFailureCount: 1 });
    });

    it('creates sanitized Sentry transactions for runs, calls, and post-run persistence', () => {
        const createTrace = () => {
            const child = {
                setData: vi.fn(),
                setStatus: vi.fn(),
                finish: vi.fn(),
            };
            const transaction = {
                setData: vi.fn(),
                setStatus: vi.fn(),
                finish: vi.fn(),
                startChild: vi.fn(() => child),
            };

            return { child, transaction };
        };
        const runTrace = createTrace();
        const postRunTrace = createTrace();
        const startTransaction = vi
            .spyOn(Sentry, 'startTransaction')
            .mockReturnValueOnce(
                runTrace.transaction as unknown as ReturnType<typeof Sentry.startTransaction>
            )
            .mockReturnValueOnce(
                postRunTrace.transaction as unknown as ReturnType<typeof Sentry.startTransaction>
            );
        vi.spyOn(Sentry, 'init').mockImplementation(() => undefined);
        vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const traceConfig = {
            ...config,
            sentryDsn: 'https://public@example.com/1',
        };

        initializeObservability(traceConfig);

        const telemetry = createAgentRunTelemetry({
            runId: 'run-1',
            correlationId: 'request-1',
            ownerDid: 'did:key:private-owner',
            triggerType: 'interactive',
            config: traceConfig,
        });

        telemetry.started();
        telemetry.observer.onModelComplete?.({
            runId: 'run-1',
            model: config.model,
            round: 0,
            durationMs: 25,
        });
        telemetry.observer.onToolComplete?.({
            runId: 'run-1',
            name: 'webSearch',
            durationMs: 10,
            success: true,
        });
        telemetry.succeeded(
            {
                runId: 'run-1',
                message: 'Done.',
                messages: [],
                modelRuns: [],
                toolRuns: [],
                usage: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                },
            },
            40
        );
        telemetry.postRunSucceeded(5);

        expect(startTransaction).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ name: 'LearnCard AI Agent run', op: 'ai.agent.run' })
        );
        expect(runTrace.transaction.startChild).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ op: 'ai.model' })
        );
        expect(runTrace.transaction.startChild).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ description: 'webSearch', op: 'ai.tool' })
        );
        expect(runTrace.transaction.setStatus).toHaveBeenCalledWith('ok');
        expect(runTrace.transaction.finish).toHaveBeenCalledOnce();
        expect(startTransaction).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                name: 'LearnCard AI Agent post-run persistence',
                op: 'ai.agent.post_run',
            })
        );
        expect(postRunTrace.transaction.finish).toHaveBeenCalledOnce();
    });
});
