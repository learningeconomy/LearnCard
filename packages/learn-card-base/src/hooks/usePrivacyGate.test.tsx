// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    profile: null as null | { profileId: string; dob?: string; country?: string; type?: string },
    profileLoading: false,
    profileType: null as string | null,
    preferences: undefined as undefined | { analyticsEnabled?: boolean; isMinor?: boolean },
    identityKey: null as string | null,
    consentResolved: false,
    isLoading: false,
    isError: false,
    updatePreferences: vi.fn(),
}));
vi.mock('./useGetCurrentLCNUser', () => ({
    useGetCurrentLCNUser: () => ({
        currentLCNUser: state.profile,
        currentLCNUserLoading: state.profileLoading,
    }),
}));
vi.mock('../stores/walletStore', () => ({
    switchedProfileStore: { use: { profileType: () => state.profileType } },
}));
vi.mock('../react-query/queries/preferences', () => ({
    useGetPreferencesForDid: () => ({
        data: state.preferences,
        identityKey: state.identityKey,
        consentResolved: state.consentResolved,
        isLoading: state.isLoading,
        isError: state.isError,
    }),
}));
vi.mock('../react-query/mutations/preferences', () => ({
    useUpdatePreferences: () => ({ mutate: state.updatePreferences }),
}));
import { usePrivacyConsent, usePrivacyGate } from './usePrivacyGate';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    state.updatePreferences.mockClear();
    Object.assign(state, {
        profile: { profileId: 'adult', dob: '1990-01-01', country: 'US' },
        profileType: null,
        profileLoading: false,
        preferences: { analyticsEnabled: true, isMinor: false },
        identityKey: 'account-a:did:key:a',
        consentResolved: true,
        isLoading: false,
        isError: false,
    });
});

describe('active identity privacy authorization', () => {
    it.each([
        { isLoading: true },
        { profileLoading: true },
        { consentResolved: false },
        { isError: true },
        { preferences: undefined },
        { preferences: {} },
        { identityKey: null },
        { profile: null },
    ])('fails closed instead of using cached consent when unresolved: %j', pending => {
        Object.assign(state, pending);
        const { result } = renderHook(() => usePrivacyConsent());
        expect(result.current.analyticsEnabled).toBe(false);
    });

    it.each(['guardian', 'school', 'learner'])(
        'restricts %s accounts by age, not role exemptions',
        type => {
            state.profile = { profileId: type, type, dob: '2012-01-01', country: 'US' };
            const { result } = renderHook(() => usePrivacyConsent());
            expect(result.current.isMinor).toBe(true);
            expect(result.current.analyticsEnabled).toBe(false);
        }
    );

    it('immediately re-evaluates country, DOB and child-profile transitions', () => {
        state.profile = { profileId: 'teen', dob: '2009-01-01', country: 'FR' };
        const { result, rerender } = renderHook(() => usePrivacyConsent());
        expect(result.current.analyticsEnabled).toBe(true);
        state.profile.country = 'US';
        rerender();
        expect(result.current.analyticsEnabled).toBe(false);
        state.profile.dob = '1990-01-01';
        rerender();
        expect(result.current.analyticsEnabled).toBe(true);
        state.profileType = 'child';
        rerender();
        expect(result.current.analyticsEnabled).toBe(false);
    });

    it.each(['invalid', '2030-01-01'])('fails closed on invalid/future DOB %s', dob => {
        state.profile!.dob = dob;
        const { result } = renderHook(() => usePrivacyConsent());
        expect(result.current.analyticsEnabled).toBe(false);
    });

    it('requires saved opt-in and never carries it into an unresolved next account', () => {
        const { result, rerender } = renderHook(() => usePrivacyConsent());
        expect(result.current.analyticsEnabled).toBe(true);
        state.preferences = { analyticsEnabled: false, isMinor: false };
        rerender();
        expect(result.current.analyticsEnabled).toBe(false);
        state.identityKey = null;
        state.preferences = { analyticsEnabled: true, isMinor: false };
        rerender();
        expect(result.current.analyticsEnabled).toBe(false);
        expect(result.current.identityKey).toBeNull();
        state.identityKey = 'account-b:did:key:b';
        state.profile = { profileId: 'child', type: 'child' };
        rerender();
        expect(result.current.analyticsEnabled).toBe(false);
    });

    it('does not persist a transient analytics-off projection as first-login defaults', () => {
        state.preferences = { analyticsEnabled: false };
        const { result } = renderHook(() => usePrivacyGate());
        expect(result.current.isResolved).toBe(false);
        expect(result.current.analyticsEnabled).toBe(false);
        expect(state.updatePreferences).not.toHaveBeenCalled();
    });

    it('honors server-owned minor status before the cached profile refreshes', () => {
        state.preferences = { analyticsEnabled: true, isMinor: true };
        const { result } = renderHook(() => usePrivacyConsent());
        expect(result.current.isMinor).toBe(true);
        expect(result.current.analyticsEnabled).toBe(false);
    });
});
