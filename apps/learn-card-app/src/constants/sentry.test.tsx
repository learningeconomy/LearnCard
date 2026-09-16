// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
    currentUser: { uid: 'firebase-user' } as { uid: string } | null,
    preferences: { bugReportsEnabled: true },
    preferencesLoading: false,
    eligibility: {
        bug: true,
        idea: true,
        isLoading: false,
        profileId: 'adult-a' as string | undefined,
    },
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

vi.mock('../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: vi.fn(),
}));

vi.mock('@sentry/react', () => ({
    getClient: () => undefined,
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

import { useSentryIdentify } from './sentry';

describe('useSentryIdentify diagnostic collection lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
