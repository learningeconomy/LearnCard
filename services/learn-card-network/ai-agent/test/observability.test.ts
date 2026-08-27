import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/node';

import type { ServiceConfig } from '../src/config';
import {
    createAgentRunTelemetry,
    flushObservability,
    getObservabilityStatus,
    getOwnerTelemetryId,
    initializeObservability,
    verifySentryDelivery,
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

    it('reports the Sentry transport response for a deployment check event', async () => {
        let afterSend:
            | ((event: { event_id?: string }, result?: { statusCode?: number }) => void)
            | undefined;
        const client = {
            on: vi.fn(
                (
                    _hook: string,
                    callback: (
                        event: { event_id?: string },
                        result?: { statusCode?: number }
                    ) => void
                ) => {
                    afterSend = callback;
                }
            ),
        };
        vi.spyOn(Sentry.getCurrentHub(), 'getClient').mockReturnValue(
            client as unknown as ReturnType<ReturnType<typeof Sentry.getCurrentHub>['getClient']>
        );
        vi.spyOn(Sentry, 'captureMessage').mockImplementation(() => {
            queueMicrotask(() => afterSend?.({ event_id: 'event-1' }, { statusCode: 200 }));

            return 'event-1';
        });
        vi.spyOn(Sentry, 'flush').mockResolvedValue(true);
        vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const sentryConfig = {
            ...config,
            sentryDsn: 'https://public@example.com/1',
            deploymentId: 'deployment-1',
        };

        initializeObservability(sentryConfig);

        await expect(verifySentryDelivery(sentryConfig)).resolves.toBe(true);
        expect(getObservabilityStatus().sentry).toEqual({
            enabled: true,
            delivery: 'delivered',
        });
    });
});
