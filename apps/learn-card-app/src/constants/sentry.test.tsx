// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
    currentUser: { uid: 'firebase-user' } as { uid: string } | null,
    tenantEnabled: true,
    crashGate: true,
    client: false,
    preferences: { bugReportsEnabled: true } as { bugReportsEnabled: boolean } | undefined,
    preferencesLoading: false,
    preferencesSuccess: true,
    eligibility: {
        bug: true,
        idea: true,
        isLoading: false,
        profileId: 'adult-a' as string | undefined,
    },
}));

const sentrySetUser = vi.hoisted(() => vi.fn());
const replayStart = vi.hoisted(() => vi.fn());
const replayBuffer = vi.hoisted(() => vi.fn());
const replayStop = vi.hoisted(() => vi.fn<() => Promise<void>>().mockResolvedValue(undefined));
const sentrySend = vi.hoisted(() => vi.fn(() => Promise.resolve({ statusCode: 200 })));
const analyticsConsent = vi.hoisted(() => ({
    enabled: true,
    identityKey: 'adult-a' as string | null,
}));

const configureLoggerContext = vi.hoisted(() => vi.fn());
const getDID = vi.hoisted(() => vi.fn(async () => 'did:key:secret'));
const setCrashReportingEnabled = vi.hoisted(() => vi.fn());
vi.mock('./nativeCrashReporting', () => ({
    setCrashReportingEnabled,
    canSendCrashReport: () => state.crashGate && !window.location.pathname.startsWith('/s/'),
    initializeNativeCrashReporting: vi.fn(),
    updateCrashReportingRoute: vi.fn(),
}));

vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => state.currentUser,
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ getDID }),
    useGetPreferencesForDid: () => ({
        data: state.preferences,
        isLoading: state.preferencesLoading,
        isSuccess: !state.preferencesLoading && state.preferencesSuccess,
    }),
    configureSentryTransport: vi.fn(),
    configureLoggerContext,
    getLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));

vi.mock('../feedback/reporting/eligibility', () => ({
    useFeedbackReportingEligibility: () => state.eligibility,
}));

vi.mock('learn-card-base/hooks/usePrivacyGate', () => ({
    usePrivacyConsent: () => ({
        analyticsEnabled: analyticsConsent.enabled,
        identityKey: analyticsConsent.identityKey,
    }),
}));

vi.mock('../config/tenantConfigState', () => ({
    isTenantAnalyticsEnabled: () => state.tenantEnabled,
    getResolvedTenantConfig: () => ({
        observability: {
            sentryDsn: 'https://public@example.test/1',
            sentryEnv: 'production',
            sentryTraceDomains: [],
        },
    }),
}));

vi.mock('@sentry/react', () => ({
    getClient: () => (state.client ? {} : undefined),
    getReplay: () => ({
        start: replayStart,
        startBuffering: replayBuffer,
        flush: vi.fn(),
        stop: replayStop,
    }),
    makeFetchTransport: vi.fn(() => ({ send: sentrySend, flush: vi.fn() })),
    init: vi.fn(),
    setUser: sentrySetUser,
    setTag: vi.fn(),
    withScope: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    feedbackIntegration: vi.fn(),
    reactRouterV5BrowserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}));

import { init } from '@sentry/react';
import { initSentryFromTenant, setSentryOptionalTelemetryEnabled } from './sentry';
import { useSentryIdentify } from './useSentryIdentify';

afterEach(cleanup);

describe('useSentryIdentify diagnostic collection lifecycle', () => {
    let sentryOptions: NonNullable<Parameters<typeof init>[0]>;
    beforeAll(async () => {
        vi.stubGlobal('__PACKAGE_VERSION__', '1.100.5');
        vi.stubGlobal('__BUILD_SHA__', 'abc1234');
        await initSentryFromTenant();
        sentryOptions = vi.mocked(init).mock.calls[0][0]!;
    });
    beforeEach(() => {
        vi.clearAllMocks();
        state.tenantEnabled = true;
        state.crashGate = true;
        state.client = false;
        analyticsConsent.enabled = true;
        analyticsConsent.identityKey = 'adult-a';
        window.history.replaceState({}, '', '/');
        setCrashReportingEnabled.mockImplementation((enabled: boolean) => {
            state.crashGate = enabled;
            return Promise.resolve();
        });
        state.currentUser = { uid: 'firebase-user' };
        state.preferences = { bugReportsEnabled: true };
        state.preferencesLoading = false;
        state.preferencesSuccess = true;
        state.eligibility = {
            bug: true,
            idea: true,
            isLoading: false,
            profileId: 'adult-a',
        };
    });
    it('drops queued replay envelopes after revoke while retaining security error envelopes', async () => {
        setSentryOptionalTelemetryEnabled(false);
        const options = sentryOptions;
        const transport = options.transport?.({
            url: 'https://sentry.example/api/1/envelope/',
            recordDroppedEvent: vi.fn(),
        } as never);
        expect(transport).toBeDefined();

        await transport!.send([
            {},
            [
                [{ type: 'replay_event' }, {}],
                [{ type: 'replay_recording' }, {}],
            ],
        ] as never);
        expect(sentrySend).not.toHaveBeenCalled();

        await transport!.send([
            [{}],
            [[{ type: 'event' }, { message: 'security error' }]],
        ] as never);
        expect(sentrySend).toHaveBeenCalledOnce();

        sentrySend.mockClear();
        setSentryOptionalTelemetryEnabled(true);
        await transport!.send([[{}], [[{ type: 'replay_event' }, {}]]] as never);
        expect(sentrySend).toHaveBeenCalledOnce();
        setSentryOptionalTelemetryEnabled(false);
    });

    it('keeps replay envelopes blocked until every outstanding prior-session stop settles', async () => {
        const options = sentryOptions;
        const transport = options.transport!({
            url: 'https://sentry.example/api/1/envelope/',
            recordDroppedEvent: vi.fn(),
        } as never);
        const stopped = Promise.withResolvers<void>();
        replayStop.mockReturnValueOnce(stopped.promise);
        const { rerender } = renderHook(() => useSentryIdentify());
        await act(async () => {});
        analyticsConsent.enabled = false;
        rerender();
        analyticsConsent.enabled = true;
        analyticsConsent.identityKey = 'adult-b';
        rerender();
        await act(async () => {});
        await transport.send([{}, [[{ type: 'replay_recording' }, {}]]] as never);
        expect(sentrySend).not.toHaveBeenCalled();
        await act(async () => stopped.resolve());
        await transport.send([{}, [[{ type: 'replay_recording' }, {}]]] as never);
        expect(sentrySend).toHaveBeenCalledOnce();
    });

    it('preserves the native persisted gate until preferences resolve, then applies opt-in', () => {
        state.preferencesLoading = true;
        const { rerender } = renderHook(() => useSentryIdentify());
        expect(setCrashReportingEnabled).not.toHaveBeenCalled();
        state.preferencesLoading = false;
        rerender();
        expect(setCrashReportingEnabled).toHaveBeenLastCalledWith(true);
    });

    it('does not turn a failed or disabled preference query into native permission', () => {
        state.preferences = undefined;
        state.preferencesSuccess = false;
        renderHook(() => useSentryIdentify());
        expect(setCrashReportingEnabled).not.toHaveBeenCalled();
    });

    it('does not persist private-view suppression as an account opt-out', () => {
        window.history.replaceState({}, '', '/s/example#private-key');
        renderHook(() => useSentryIdentify());
        expect(setCrashReportingEnabled).toHaveBeenLastCalledWith(true);
        expect(configureLoggerContext).toHaveBeenLastCalledWith(
            expect.objectContaining({ bugReportsEnabled: false })
        );
    });

    it('starts Replay after confirmed first consent and again after opting back in', async () => {
        state.crashGate = false;
        state.preferencesLoading = true;
        const first = Promise.withResolvers<void>();
        setCrashReportingEnabled.mockImplementationOnce(() => first.promise);
        const { rerender } = renderHook(() => useSentryIdentify());
        await act(async () => {});
        expect(replayStart.mock.calls.length + replayBuffer.mock.calls.length).toBe(0);

        state.preferencesLoading = false;
        rerender();
        await act(async () => {});
        expect(replayStart.mock.calls.length + replayBuffer.mock.calls.length).toBe(0);
        await act(async () => {
            state.crashGate = true;
            first.resolve();
        });
        expect(replayStart.mock.calls.length + replayBuffer.mock.calls.length).toBe(1);

        state.preferences = { bugReportsEnabled: false };
        rerender();
        await act(async () => {});
        expect(replayStop).toHaveBeenCalled();
        state.preferences = { bugReportsEnabled: true };
        rerender();
        await act(async () => {});
        expect(replayStart.mock.calls.length + replayBuffer.mock.calls.length).toBe(2);
    });

    it('sets the Sentry identity after native consent confirmation', async () => {
        state.crashGate = false;
        state.client = true;
        const pending = Promise.withResolvers<void>();
        setCrashReportingEnabled.mockImplementationOnce(() => pending.promise);
        renderHook(() => useSentryIdentify());
        await act(async () => {});
        expect(sentrySetUser).not.toHaveBeenCalledWith({ id: 'did:key:secret' });
        await act(async () => {
            state.crashGate = true;
            pending.resolve();
        });
        expect(sentrySetUser).toHaveBeenCalledWith({ id: 'did:key:secret' });
    });

    it('never starts Replay if a private share begins while consent is resolving', async () => {
        state.crashGate = false;
        const pending = Promise.withResolvers<void>();
        setCrashReportingEnabled.mockImplementationOnce(() => pending.promise);
        const { rerender } = renderHook(() => useSentryIdentify());
        window.history.replaceState({}, '', '/s/example#secret');
        rerender();
        await act(async () => {
            state.crashGate = true;
            pending.resolve();
        });
        expect(replayStart).not.toHaveBeenCalled();
        expect(replayBuffer).not.toHaveBeenCalled();
    });

    it('keeps remote crash reporting enabled while adult feedback diagnostics are ineligible', () => {
        state.eligibility = {
            bug: false,
            idea: true,
            isLoading: false,
            profileId: 'minor-a',
        };

        renderHook(() => useSentryIdentify());

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: true,
            diagnosticLogCollectionEnabled: false,
            diagnosticIdentity: 'minor-a',
        });
    });

    it('keeps the raw bug-report preference as the remote crash-reporting gate', () => {
        state.preferences = { bugReportsEnabled: false };

        renderHook(() => useSentryIdentify());

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: false,
            diagnosticLogCollectionEnabled: true,
            diagnosticIdentity: 'adult-a',
        });
    });

    it('updates the opaque diagnostic identity across adult profile switches', () => {
        const { rerender } = renderHook(() => useSentryIdentify());

        state.eligibility = {
            bug: true,
            idea: true,
            isLoading: false,
            profileId: 'adult-b',
        };
        rerender();

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: true,
            diagnosticLogCollectionEnabled: true,
            diagnosticIdentity: 'adult-b',
        });
    });

    it('preserves an opted-out account choice across logout and the next login until resolved', () => {
        state.preferences = { bugReportsEnabled: false };
        const { rerender } = renderHook(() => useSentryIdentify());

        expect(setCrashReportingEnabled).toHaveBeenLastCalledWith(false);
        setCrashReportingEnabled.mockClear();
        state.currentUser = null;
        state.eligibility = {
            bug: false,
            idea: false,
            isLoading: false,
            profileId: undefined,
        };
        rerender();

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: false,
            diagnosticLogCollectionEnabled: false,
            diagnosticIdentity: null,
        });

        expect(setCrashReportingEnabled).not.toHaveBeenCalled();

        state.currentUser = { uid: 'firebase-user-b' };
        state.preferencesLoading = true;
        state.eligibility = {
            bug: false,
            idea: false,
            isLoading: true,
            profileId: 'adult-b',
        };
        rerender();

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: false,
            diagnosticLogCollectionEnabled: false,
            diagnosticIdentity: 'adult-b',
        });
    });

    it('keeps crash forwarding enabled while raw preferences are loading', () => {
        state.preferences = { bugReportsEnabled: false };
        state.preferencesLoading = true;
        state.eligibility = {
            bug: false,
            idea: false,
            isLoading: true,
            profileId: 'adult-a',
        };

        renderHook(() => useSentryIdentify());

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: true,
            diagnosticLogCollectionEnabled: false,
            diagnosticIdentity: 'adult-a',
        });
    });
});
