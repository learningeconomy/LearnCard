import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCapacitor, mockGetResolvedTenantConfig } = vi.hoisted(() => ({
    mockCapacitor: {
        isNativePlatform: vi.fn(() => false),
        getPlatform: vi.fn(() => 'web'),
    },
    mockGetResolvedTenantConfig: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: mockCapacitor }));
vi.mock('../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: mockGetResolvedTenantConfig,
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => (globalThis as any).mockLearnCardBaseLogger(),
}));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('../helpers/sendCredentialFlow.helpers', () => ({
    setAnalyticsProvider: vi.fn(),
    setSendCredentialTelemetryEnabled: vi.fn(),
}));

import { detectAnalyticsEnvironment, getSharedEventContext, newFlowId } from './sharedContext';
import { applyPostHogHygiene } from './providers/posthog';
import { normalizeScreenName } from './useScreenView';
import { createFlowLifecycle } from './flowLifecycle';

const setHostname = (hostname: string) => {
    Object.defineProperty(window, 'location', {
        value: { ...window.location, hostname },
        writable: true,
        configurable: true,
    });
};

const setWebdriver = (value: boolean) => {
    Object.defineProperty(window.navigator, 'webdriver', { value, configurable: true });
};

describe('detectAnalyticsEnvironment', () => {
    beforeEach(() => {
        // Vitest itself runs with MODE === 'test', which the detector
        // (correctly) classifies as automation. Stub it to exercise the
        // other branches.
        vi.stubEnv('MODE', 'development');
        setWebdriver(false);
        mockCapacitor.isNativePlatform.mockReturnValue(false);
        mockGetResolvedTenantConfig.mockReturnValue({
            tenantId: 'learncard',
            domain: 'learncard.app',
            devDomain: 'localhost:3000',
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('classifies the vitest runtime itself as test', () => {
        vi.unstubAllEnvs();
        expect(detectAnalyticsEnvironment()).toBe('test');
    });

    it('classifies webdriver traffic as test', () => {
        setWebdriver(true);
        expect(detectAnalyticsEnvironment()).toBe('test');
    });

    it('classifies native production builds as production even on localhost', () => {
        setHostname('localhost');
        mockCapacitor.isNativePlatform.mockReturnValue(true);
        vi.stubEnv('PROD', true);

        expect(detectAnalyticsEnvironment()).toBe('production');
    });

    it('classifies web localhost as development', () => {
        setHostname('localhost');
        expect(detectAnalyticsEnvironment()).toBe('development');
    });

    it('classifies the tenant domain as production', () => {
        setHostname('learncard.app');
        expect(detectAnalyticsEnvironment()).toBe('production');
    });

    it('classifies netlify hosts as preview', () => {
        setHostname('deploy-preview-42--learncard.netlify.app');
        expect(detectAnalyticsEnvironment()).toBe('preview');
    });

    it('classifies staging hosts as staging', () => {
        setHostname('staging.learncard.app');
        expect(detectAnalyticsEnvironment()).toBe('staging');
    });

    it('falls back to heuristics when tenant config is unresolved', () => {
        mockGetResolvedTenantConfig.mockImplementation(() => {
            throw new Error('not resolved');
        });
        setHostname('localhost');

        expect(detectAnalyticsEnvironment()).toBe('development');
    });
});

describe('applyPostHogHygiene', () => {
    beforeEach(() => {
        vi.stubEnv('MODE', 'development');
        setWebdriver(false);
        setHostname('learncard.app');
        mockCapacitor.isNativePlatform.mockReturnValue(false);
        mockGetResolvedTenantConfig.mockReturnValue({
            tenantId: 'learncard',
            domain: 'learncard.app',
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('passes null through', () => {
        expect(applyPostHogHygiene(null)).toBeNull();
    });

    it('drops all events for automation traffic, including SDK-generated ones', () => {
        setWebdriver(true);
        expect(applyPostHogHygiene({ properties: { $exception_type: 'Error' } })).toBeNull();
    });

    it('stamps enforced context onto events that never passed through track()', () => {
        const result = applyPostHogHygiene({ properties: { $rageclick: true } });

        expect(result?.properties).toMatchObject({
            $rageclick: true,
            environment: 'production',
            tenant_id: 'learncard',
            platform: 'web',
        });
    });

    it('lets enforced context win property collisions', () => {
        setHostname('localhost');
        const result = applyPostHogHygiene({ properties: { environment: 'production' } });

        expect(result?.properties?.environment).toBe('development');
    });
});

describe('normalizeScreenName', () => {
    it.each([
        ['/', '/'],
        ['/wallet', '/wallet'],
        ['/socialBadges', '/socialBadges'],
        ['/claim-from-dashboard', '/claim-from-dashboard'],
        ['/credential/urn%3Auuid%3A1234', '/credential/:id'],
        ['/profile/user-123', '/profile/:id'],
        ['/boost/did:web:example.com', '/boost/:id'],
        ['/pathways/42/detail', '/pathways/:id/detail'],
    ])('normalizes %s to %s', (input, expected) => {
        expect(normalizeScreenName(input)).toBe(expected);
    });
});

describe('createFlowLifecycle', () => {
    it('allows exactly one terminal event per flow', () => {
        const flow = createFlowLifecycle();

        expect(flow.hasTerminated()).toBe(false);
        expect(flow.terminate()).toBe(true);
        expect(flow.terminate()).toBe(false);
        expect(flow.hasTerminated()).toBe(true);
    });

    it('preserves an externally supplied flow id', () => {
        const flow = createFlowLifecycle('external-id');
        expect(flow.id).toBe('external-id');
    });

    it('generates unique ids by default', () => {
        expect(createFlowLifecycle().id).not.toBe(createFlowLifecycle().id);
        expect(newFlowId()).not.toBe(newFlowId());
    });

    it('reports non-negative durations', () => {
        expect(createFlowLifecycle().durationMs()).toBeGreaterThanOrEqual(0);
    });
});

describe('getSharedEventContext', () => {
    it('survives unresolved tenant config', () => {
        mockGetResolvedTenantConfig.mockImplementation(() => {
            throw new Error('not resolved');
        });

        const context = getSharedEventContext();

        expect(context.tenant_id).toBeUndefined();
        expect(context.environment).toBeDefined();
        expect(context.platform).toBe('web');
    });
});
