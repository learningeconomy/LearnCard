import type { Event, NodeOptions } from '@sentry/node';
import type { ServiceConfig } from '../../src/config';

export const telemetryConfig: ServiceConfig = {
    nodeEnv: 'test',
    model: 'test-model',
    port: 0,
    maxToolRounds: 3,
    runTimeoutMs: 10_000,
    maxOutputTokens: 4_096,
    maxRunTokens: 50_000,
    maxRunCostUsd: 1,
    inputTokenCostUsdPerMillion: 1,
    outputTokenCostUsdPerMillion: 2,
    cloudWatchMetricsEnabled: false,
    metricsNamespace: 'LearnCard/TestAgent',
    sentryDsn: 'https://public@sentry.invalid/1',
    sentryTracesSampleRate: 0,
    consentFlowAppUrl: 'https://learncard.invalid',
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

// SDK send() receives final envelopes, after normalization and beforeSend.
// This transport is purely in-memory: neither fetch nor Node HTTP is involved.
export const createSentryMemoryTransport = () => {
    const events: Event[] = [];
    const state = { statusCode: 200 };
    const transport: NonNullable<NodeOptions['transport']> = () => ({
        send: async envelope => {
            for (const [header, payload] of envelope[1]) {
                if (header.type === 'event' || header.type === 'transaction') {
                    events.push(structuredClone(payload as Event));
                }
            }
            return { statusCode: state.statusCode };
        },
        flush: async () => true,
    });
    return { events, state, transport };
};
