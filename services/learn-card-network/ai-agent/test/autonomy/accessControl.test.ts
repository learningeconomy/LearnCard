import { afterEach, describe, expect, it, vi } from 'vitest';

const launchDarkly = vi.hoisted(() => ({
    close: vi.fn(async () => undefined),
    init: vi.fn(),
    variationDetail: vi.fn(),
    waitForInitialization: vi.fn(),
}));

vi.mock('@launchdarkly/node-server-sdk', () => ({
    init: launchDarkly.init,
}));

import {
    assertAutonomousExecutionAllowed,
    closeAutonomyAccessControl,
    isAutonomousExecutionAllowed,
} from '../../src/autonomy/accessControl';
import type { ServiceConfig } from '../../src/config';

const config: ServiceConfig = {
    nodeEnv: 'production',
    model: 'test-model',
    port: 0,
    maxToolRounds: 5,
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
    launchDarklySdkKey: 'sdk-test',
    triggerEnvironment: 'staging',
};

const client = {
    close: launchDarkly.close,
    variationDetail: launchDarkly.variationDetail,
    waitForInitialization: launchDarkly.waitForInitialization,
};

afterEach(async () => {
    await closeAutonomyAccessControl();
    vi.clearAllMocks();
});

describe('autonomous execution access control', () => {
    it('evaluates the staging flag with the owner DID as the existing user context key', async () => {
        launchDarkly.init.mockReturnValue(client);
        launchDarkly.waitForInitialization.mockResolvedValue(client);
        launchDarkly.variationDetail.mockResolvedValue({
            value: true,
            variationIndex: 1,
            reason: { kind: 'TARGET_MATCH' },
        });

        await expect(isAutonomousExecutionAllowed(config, 'did:web:example')).resolves.toBe(true);
        expect(launchDarkly.init).toHaveBeenCalledWith('sdk-test');
        expect(launchDarkly.variationDetail).toHaveBeenCalledWith(
            'ai-agent-autonomy-enabled',
            { kind: 'user', key: 'did:web:example' },
            false
        );
    });

    it('fails closed when the owner receives the disabled variation', async () => {
        launchDarkly.init.mockReturnValue(client);
        launchDarkly.waitForInitialization.mockResolvedValue(client);
        launchDarkly.variationDetail.mockResolvedValue({
            value: false,
            variationIndex: 0,
            reason: { kind: 'FALLTHROUGH' },
        });

        await expect(assertAutonomousExecutionAllowed(config, 'did:web:other')).rejects.toThrow(
            'not enabled for autonomous execution'
        );
    });

    it('surfaces LaunchDarkly evaluation errors instead of treating them as configured denial', async () => {
        launchDarkly.init.mockReturnValue(client);
        launchDarkly.waitForInitialization.mockResolvedValue(client);
        launchDarkly.variationDetail.mockResolvedValue({
            value: false,
            variationIndex: null,
            reason: { kind: 'ERROR', errorKind: 'FLAG_NOT_FOUND' },
        });

        await expect(isAutonomousExecutionAllowed(config, 'did:web:example')).rejects.toThrow(
            'FLAG_NOT_FOUND'
        );
    });

    it('keeps the exact local DID list for the development-only worker', async () => {
        const developmentConfig = {
            ...config,
            nodeEnv: 'development',
            triggerEnvironment: 'dev',
            launchDarklySdkKey: undefined,
            autonomyDevDids: ['did:key:fixture'],
        };

        await expect(
            isAutonomousExecutionAllowed(developmentConfig, 'did:key:fixture')
        ).resolves.toBe(true);
        await expect(
            isAutonomousExecutionAllowed(developmentConfig, 'did:key:other')
        ).resolves.toBe(false);
        expect(launchDarkly.init).not.toHaveBeenCalled();
    });
});
