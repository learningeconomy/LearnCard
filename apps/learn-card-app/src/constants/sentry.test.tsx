// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
    currentUser: { uid: 'firebase-user' } as { uid: string } | null,
    tenantEnabled: true,
    preferences: { bugReportsEnabled: true },
    preferencesLoading: false,
    eligibility: {
        bug: true,
        idea: true,
        isLoading: false,
        profileId: 'adult-a' as string | undefined,
    },
}));

const replayStart = vi.hoisted(() => vi.fn());
const replayStop = vi.hoisted(() => vi.fn<() => Promise<void>>().mockResolvedValue(undefined));
const sentrySend = vi.hoisted(() => vi.fn(() => Promise.resolve({ statusCode: 200 })));
const analyticsConsent = vi.hoisted(() => ({
    enabled: true,
    identityKey: 'adult-a' as string | null,
}));

const configureLoggerContext = vi.hoisted(() => vi.fn());
const getDID = vi.hoisted(() => vi.fn(async () => 'did:key:secret'));

vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => state.currentUser,
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ getDID }),
    useGetPreferencesForDid: () => ({
        data: state.preferences,
        isLoading: state.preferencesLoading,
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
    getClient: () => undefined,
    getReplay: () => ({
        start: replayStart,
        startBuffering: vi.fn(),
        flush: vi.fn(),
        stop: replayStop,
    }),
    makeFetchTransport: vi.fn(() => ({ send: sentrySend, flush: vi.fn() })),
    init: vi.fn(),
    setUser: vi.fn(),
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
import {
    initSentryFromTenant,
    setSentryOptionalTelemetryEnabled,
    useSentryIdentify,
} from './sentry';

afterEach(cleanup);

describe('useSentryIdentify diagnostic collection lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.tenantEnabled = true;
        analyticsConsent.enabled = true;
        analyticsConsent.identityKey = 'adult-a';
        state.currentUser = { uid: 'firebase-user' };
        state.preferences = { bugReportsEnabled: true };
        state.preferencesLoading = false;
        state.eligibility = {
            bug: true,
            idea: true,
            isLoading: false,
            profileId: 'adult-a',
        };
    });
    it('drops queued replay envelopes after revoke while retaining security error envelopes', async () => {
        setSentryOptionalTelemetryEnabled(false);
        initSentryFromTenant();
        const options = vi.mocked(init).mock.calls[0][0];
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
        initSentryFromTenant();
        const options = vi.mocked(init).mock.calls[0][0];
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

    it('does not inherit an opted-out account preference across logout and the next login', () => {
        state.preferences = { bugReportsEnabled: false };
        const { rerender } = renderHook(() => useSentryIdentify());

        state.currentUser = null;
        state.eligibility = {
            bug: false,
            idea: false,
            isLoading: false,
            profileId: undefined,
        };
        rerender();

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: true,
            diagnosticLogCollectionEnabled: false,
            diagnosticIdentity: null,
        });

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
            bugReportsEnabled: true,
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
