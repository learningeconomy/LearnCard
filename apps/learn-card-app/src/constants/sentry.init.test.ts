import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    enabled: true,
    private: false,
    env: 'staging',
    init: vi.fn(),
    nativeInit: vi.fn(),
    send: vi.fn(),
    flush: vi.fn(),
}));
vi.mock('../components/share-links/sharePrivacy', () => ({
    isSharePrivateSession: () => state.private,
    useSharePrivateSession: () => state.private,
    scrubShareTelemetry: (event: unknown) => event,
}));
vi.mock('./nativeCrashReporting', () => ({
    canSendCrashReport: () => state.enabled && !state.private,
    initializeNativeCrashReporting: state.nativeInit,
    setCrashReportingEnabled: vi.fn(),
    updateCrashReportingRoute: vi.fn(),
}));
vi.mock('./routingHistory', () => ({
    routingHistory: { location: { pathname: '/' }, listen: vi.fn() },
}));
vi.mock('../config/tenantConfigState', () => ({
    getResolvedTenantConfig: () => ({
        tenantId: 'test-tenant',
        observability: {
            sentryDsn: 'https://key@example.com/1',
            sentryEnv: state.env,
        },
    }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useWallet: vi.fn(),
    useGetPreferencesForDid: vi.fn(),
    configureSentryTransport: vi.fn(),
    configureLoggerContext: vi.fn(),
    getLogger: () => ({}),
}));
vi.mock('../feedback/reporting/eligibility', () => ({ useFeedbackReportingEligibility: vi.fn() }));
vi.mock('@sentry/react', () => ({
    init: state.init,
    feedbackIntegration: () => ({ name: 'feedback' }),
    reactRouterV5BrowserTracingIntegration: () => ({ name: 'tracing' }),
    replayIntegration: () => ({ name: 'replay' }),
}));
vi.mock('@sentry/browser', () => ({
    makeFetchTransport: () => ({ send: state.send, flush: state.flush }),
}));

describe('Sentry initialization and envelope privacy', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.stubGlobal('__PACKAGE_VERSION__', '1.100.5');
        vi.stubGlobal('__BUILD_SHA__', 'abc1234');
        state.enabled = true;
        state.private = false;
        state.env = 'staging';
        state.send.mockResolvedValue({ statusCode: 200 });
        state.flush.mockResolvedValue(true);
    });

    it('initializes React once with distinct web release identity', async () => {
        const { initSentryFromTenant } = await import('./sentry');
        await Promise.all([initSentryFromTenant(), initSentryFromTenant()]);
        expect(state.init).toHaveBeenCalledTimes(1);
        expect(state.nativeInit).toHaveBeenCalledTimes(1);
        expect(state.init.mock.calls[0][0]).toMatchObject({
            release: 'learncard-web@1.100.5+abc1234',
            sendDefaultPii: false,
            initialScope: { tags: { tenant_id: 'test-tenant', error_layer: 'javascript' } },
        });
    });

    it('gates every envelope, including replays and events buffered before an opt-out', async () => {
        const { initSentryFromTenant } = await import('./sentry');
        await initSentryFromTenant();
        const options = state.init.mock.calls[0][0];
        const transport = options.transport({});
        const replay = [{}, [[{ type: 'replay_event' }, { text: 'private' }]]];
        await transport.send(replay);
        expect(state.send).toHaveBeenCalledTimes(1);
        state.enabled = false;
        await transport.send(replay);
        expect(state.send).toHaveBeenCalledTimes(1);
        expect(options.beforeSend({})).toBeNull();
        expect(options.beforeBreadcrumb({})).toBeNull();
        expect(options.beforeSendTransaction({})).toBeNull();
        expect(await transport.flush(100)).toBe(true);
    });

    it('disables replay sampling when the persisted native gate is off', async () => {
        state.enabled = false;
        await (await import('./sentry')).initSentryFromTenant();
        expect(state.init.mock.calls[0][0]).toMatchObject({
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,
        });
    });

    it.each(['development', 'private'])(
        'does not initialize JS capture in %s sessions',
        async mode => {
            state.private = mode === 'private';
            if (mode === 'development') state.env = mode;
            await (await import('./sentry')).initSentryFromTenant();
            expect(state.init).not.toHaveBeenCalled();
        }
    );
});
