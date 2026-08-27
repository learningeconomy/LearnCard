import { describe, expect, it } from 'vitest';

import {
    assertAutonomyDevConfig,
    assertSecurityConfig,
    assertTriggerConfig,
    type ServiceConfig,
} from '../../src/config';

const validConfig: ServiceConfig = {
    nodeEnv: 'development',
    model: 'test-model',
    openAIApiKey: 'test-key',
    port: 0,
    trustProxyHops: 1,
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
    autonomyDevDids: ['did:key:fixture'],
    autonomyDevPollIntervalMs: 30_000,
    autonomyDevMaxRunsPerCycle: 3,
    autonomyDevLeaseMs: 900_000,
    autonomyLaunchDarklyFlagKey: 'ai-agent-autonomy-enabled',
};

describe('autonomy development configuration gate', () => {
    it('accepts the explicit development-only fixture configuration', () => {
        expect(() => assertAutonomyDevConfig(validConfig)).not.toThrow();
        expect(() => assertSecurityConfig(validConfig)).not.toThrow();
    });

    it.each([
        {
            label: 'explicit enablement',
            override: { autonomyDevEnabled: false },
            message: 'AI_AGENT_AUTONOMY_DEV_ENABLED=true is required',
        },
        {
            label: 'development mode',
            override: { nodeEnv: 'production' },
            message: 'can only run in development',
        },
        {
            label: 'fixture DID allowlist',
            override: { autonomyDevDids: [] },
            message: 'AI_AGENT_AUTONOMY_DEV_DIDS',
        },
        {
            label: 'Mongo persistence',
            override: { mongoUri: undefined },
            message: 'MONGO_URI',
        },
        {
            label: 'agent encryption identity',
            override: { walletSeed: undefined },
            message: 'AI_AGENT_WALLET_SEED',
        },
        {
            label: 'AI provider',
            override: { openAIApiKey: undefined },
            message: 'OPENAI_API_KEY',
        },
        {
            label: 'post-run self-improvement',
            override: { selfImprovementEnabled: false },
            message: 'AI_AGENT_SELF_IMPROVEMENT_ENABLED=true',
        },
    ])('rejects autonomy without $label', ({ override, message }) => {
        expect(() => assertAutonomyDevConfig({ ...validConfig, ...override })).toThrow(message);
    });

    it('rejects unsafe poll, cycle, and lease bounds', () => {
        expect(() =>
            assertAutonomyDevConfig({ ...validConfig, autonomyDevPollIntervalMs: 999 })
        ).toThrow('AI_AGENT_AUTONOMY_DEV_POLL_INTERVAL_MS');
        expect(() =>
            assertAutonomyDevConfig({ ...validConfig, autonomyDevMaxRunsPerCycle: 11 })
        ).toThrow('AI_AGENT_AUTONOMY_DEV_MAX_RUNS_PER_CYCLE');
        expect(() =>
            assertAutonomyDevConfig({
                ...validConfig,
                autonomyDevLeaseMs: validConfig.autonomyDevPollIntervalMs,
            })
        ).toThrow('AI_AGENT_AUTONOMY_DEV_LEASE_MS');
    });

    it.each([-1, 1.5, 11])('rejects unsafe trusted proxy hop count %s', trustProxyHops => {
        expect(() => assertSecurityConfig({ ...validConfig, trustProxyHops })).toThrow(
            'AI_AGENT_TRUST_PROXY_HOPS'
        );
    });
});

describe('production service configuration gate', () => {
    const productionConfig: ServiceConfig = {
        ...validConfig,
        nodeEnv: 'production',
        authDomain: 'https://agent.learncard.app',
        cloudUrl: 'https://cloud.learncard.com/trpc',
        networkUrl: 'https://network.learncard.com/trpc',
        consentFlowContractUri: 'lc:network:example:contract:test',
        debugEnabled: false,
        autonomyDevEnabled: false,
        inputTokenCostUsdPerMillion: 1,
        outputTokenCostUsdPerMillion: 2,
        sentryDsn: 'https://public@example.ingest.sentry.io/1',
        webSearchProvider: 'none',
    };

    it('accepts an observable, bounded production configuration', () => {
        expect(() => assertSecurityConfig(productionConfig)).not.toThrow();
    });

    it.each([
        {
            override: { inputTokenCostUsdPerMillion: 0 },
            message: 'current positive prices',
        },
        {
            override: { outputTokenCostUsdPerMillion: undefined },
            message: 'current positive prices',
        },
        {
            override: { sentryDsn: undefined },
            message: 'SENTRY_DSN',
        },
        {
            override: { sentryDsn: '{"dsn":"https://public@example.ingest.sentry.io/1"}' },
            message: 'raw Sentry DSN URL',
        },
        {
            override: { debugEnabled: true },
            message: 'AI_AGENT_DEBUG_ENABLED',
        },
        {
            override: { mongoUri: undefined },
            message: 'MONGO_URI',
        },
    ])('rejects an incomplete production configuration', ({ override, message }) => {
        expect(() => assertSecurityConfig({ ...productionConfig, ...override })).toThrow(message);
    });
});

describe('Trigger.dev environment configuration gate', () => {
    const triggerConfig: ServiceConfig = {
        ...validConfig,
        autonomyDevEnabled: false,
        triggerEnabled: true,
        triggerEnvironment: 'dev',
        triggerSecretKey: 'tr_dev_test',
    };

    const stagingTriggerConfig: ServiceConfig = {
        ...triggerConfig,
        nodeEnv: 'production',
        sentryEnvironment: 'staging',
        triggerEnvironment: 'staging',
        launchDarklySdkKey: 'sdk-test',
        authDomain: 'https://agent-staging.learncard.app',
        cloudUrl: 'https://cloud.learncard.com/trpc',
        networkUrl: 'https://network.learncard.com/trpc',
        consentFlowContractUri: 'lc:network:example:contract:test',
        debugEnabled: false,
        inputTokenCostUsdPerMillion: 1,
        outputTokenCostUsdPerMillion: 2,
        sentryDsn: 'https://public@example.ingest.sentry.io/1',
        webSearchProvider: 'none',
    };

    it('accepts explicit development and staging Trigger.dev configurations', () => {
        expect(() => assertTriggerConfig(triggerConfig)).not.toThrow();
        expect(() => assertSecurityConfig(triggerConfig)).not.toThrow();
        expect(() => assertTriggerConfig(stagingTriggerConfig)).not.toThrow();
        expect(() => assertSecurityConfig(stagingTriggerConfig)).not.toThrow();
    });

    it('rejects production, missing credentials, missing access control, and local polling', () => {
        expect(() =>
            assertTriggerConfig({
                ...stagingTriggerConfig,
                sentryEnvironment: 'production',
                triggerEnvironment: 'production',
            })
        ).toThrow('restricted to development or the staging deployment');
        expect(() =>
            assertTriggerConfig({ ...triggerConfig, triggerSecretKey: undefined })
        ).toThrow('TRIGGER_SECRET_KEY');
        expect(() => assertTriggerConfig({ ...triggerConfig, autonomyDevDids: [] })).toThrow(
            'AI_AGENT_AUTONOMY_DEV_DIDS'
        );
        expect(() =>
            assertTriggerConfig({ ...stagingTriggerConfig, launchDarklySdkKey: undefined })
        ).toThrow('LAUNCHDARKLY_SDK_KEY');
        expect(() => assertSecurityConfig({ ...triggerConfig, autonomyDevEnabled: true })).toThrow(
            'cannot both be true'
        );
    });
});
