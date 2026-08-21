// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
    currentUser: { uid: 'firebase-user' } as { uid: string } | null,
    preferences: { bugReportsEnabled: true },
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
    useGetPreferencesForDid: () => ({ data: state.preferences }),
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
        state.eligibility = {
            bug: true,
            idea: true,
            isLoading: false,
            profileId: 'adult-a',
        };
    });

    it('uses complete authenticated-adult eligibility instead of the raw preference default', () => {
        state.eligibility = {
            bug: false,
            idea: true,
            isLoading: false,
            profileId: 'minor-a',
        };

        renderHook(() => useSentryIdentify());

        expect(configureLoggerContext).toHaveBeenLastCalledWith({
            bugReportsEnabled: false,
            diagnosticIdentity: 'minor-a',
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
            diagnosticIdentity: 'adult-b',
        });
    });

    it('disables collection and clears the identity on logout', () => {
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
            bugReportsEnabled: false,
            diagnosticIdentity: null,
        });
    });
});
