import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServiceConfig } from '../src/config';
import { runChatRequest } from '../src/server';
import { createSelfImprovementRuntime } from '../src/selfImprovement';
import { createInMemoryRetroResultRepository } from '../src/selfImprovement/retro';
import {
    createInMemoryRunTraceRepository,
    createRunTraceService,
} from '../src/selfImprovement/runTrace';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../src/selfImprovement/userDocs';
import { createMongoRuntime } from '../src/mongo';
import {
    createAgentRunTelemetry,
    flushObservability,
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
    cloudWatchMetricsEnabled: false,
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
    autonomyLaunchDarklyFlagKey: 'ai-agent-autonomy-enabled',
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('AI Agent observability', () => {
    it('meters primary and failed retro spend exactly once using each model price', async () => {
        const send = vi
            .spyOn(CloudWatchClient.prototype, 'send')
            .mockResolvedValue({ $metadata: {} });
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const runConfig: ServiceConfig = {
            ...config,
            cloudWatchMetricsEnabled: true,
            selfImprovementEnabled: true,
            retroModel: 'retro-model',
            retroInputTokenCostUsdPerMillion: 3,
            retroOutputTokenCostUsdPerMillion: 5,
        };
        initializeObservability(runConfig);
        const selfImprovementRuntime = createSelfImprovementRuntime({
            config: runConfig,
            mongoRuntime: createMongoRuntime({ mongoDbName: 'unused' }),
            services: {
                userDocs: createUserDocService(createInMemoryUserDocRepository()),
                runTraces: createRunTraceService(createInMemoryRunTraceRepository()),
                retroResults: createInMemoryRetroResultRepository(),
            },
            retroProvider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'invalid JSON' },
                    usage: { inputTokens: 2_000, outputTokens: 1_000, totalTokens: 3_000 },
                }),
            },
        });
        const result = await runChatRequest({
            ownerDid: 'did:key:private-owner',
            body: { messages: [{ role: 'user', content: 'A private prompt' }] },
            config: runConfig,
            tools: [],
            selfImprovementRuntime,
            provider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'Primary answer' },
                    usage: { inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500 },
                }),
            },
        });
        expect(result.status).toBe(200);
        await expect(result.afterResponse?.()).rejects.toThrow('Retrospective failed');
        await flushObservability();
        const metrics = send.mock.calls.flatMap(
            ([command]) => (command as PutMetricDataCommand).input.MetricData ?? []
        );
        const costs = metrics.filter(
            metric =>
                metric.MetricName === 'EstimatedCostUsd' &&
                metric.Dimensions?.some(dimension => dimension.Name === 'Model')
        );
        const aggregateCost = metrics
            .filter(
                metric =>
                    metric.MetricName === 'EstimatedCostUsd' &&
                    !metric.Dimensions?.some(dimension => dimension.Name === 'Model')
            )
            .reduce((sum, metric) => sum + (metric.Value ?? 0), 0);
        expect(aggregateCost).toBeCloseTo(0.013);
        expect(costs).toHaveLength(2);
        expect(costs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Value: 0.002,
                    Dimensions: expect.arrayContaining([{ Name: 'Model', Value: 'test-model' }]),
                }),
                expect.objectContaining({
                    Value: 0.011,
                    Dimensions: expect.arrayContaining([{ Name: 'Model', Value: 'retro-model' }]),
                }),
            ])
        );
        expect(
            metrics
                .filter(
                    metric =>
                        metric.MetricName === 'ModelTotalTokens' &&
                        metric.Dimensions?.some(dimension => dimension.Name === 'Model')
                )
                .map(metric => metric.Value)
        ).toEqual([1_500, 3_000]);
        expect(metrics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ MetricName: 'PostRunFailureCount', Value: 1 }),
            ])
        );
    });

    it('emits concise logfmt application lines without raw owner or error data', () => {
        const info = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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

        const output = [...info.mock.calls, ...error.mock.calls]
            .map(([line]) => String(line))
            .join('\n');

        expect(output).toContain('INFO agent.run.started');
        expect(output).toContain('ERROR agent.run.failed');
        expect(output).toContain(`ownerId=${getOwnerTelemetryId(ownerDid)}`);
        expect(output).toContain('errorType=Error');
        expect(output).not.toContain(ownerDid);
        expect(output).not.toContain(sensitiveError);
        expect(output).not.toContain('_aws');
        expect(() => JSON.parse(info.mock.calls[0]?.[0] as string)).toThrow();
    });

    it('publishes metrics directly instead of mixing EMF records into the log stream', async () => {
        const send = vi
            .spyOn(CloudWatchClient.prototype, 'send')
            .mockResolvedValue({ $metadata: {} });
        vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const metricsConfig = { ...config, cloudWatchMetricsEnabled: true };

        initializeObservability(metricsConfig);
        createAgentRunTelemetry({
            runId: 'run-1',
            correlationId: 'request-1',
            ownerDid: 'did:key:private-owner',
            triggerType: 'interactive',
            config: metricsConfig,
        }).started();
        await flushObservability();

        expect(send).toHaveBeenCalledWith(expect.any(PutMetricDataCommand));
        expect(send.mock.calls[0]?.[0].input).toMatchObject({
            Namespace: 'LearnCard/TestAgent',
            MetricData: expect.arrayContaining([
                expect.objectContaining({ MetricName: 'RunCount', Value: 1 }),
            ]),
        });
    });
});
