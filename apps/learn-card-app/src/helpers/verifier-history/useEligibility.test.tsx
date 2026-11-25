import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
    profile: null as { dob?: string; country?: string } | null,
    loading: false,
    allowed: true,
    type: null as string | null,
}));
vi.mock('learn-card-base', () => ({
    useGetCurrentLCNUser: () => ({
        currentLCNUser: state.profile,
        currentLCNUserLoading: state.loading,
    }),
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { get: { profileType: () => state.type } },
}));
vi.mock('./account', () => ({
    useHistoryAccountRevision: () => 0,
    isHistoryAccountEligible: () => state.allowed,
}));
import { useVerifierHistoryEligibility } from './useEligibility';
describe('shared history eligibility', () => {
    it('fails closed until a primary adult profile is known, and changes live during a disclosure', () => {
        const { result, rerender } = renderHook(() => useVerifierHistoryEligibility());
        const captured = result.current;
        expect(captured()).toBe(false);
        state.profile = { dob: '2000-01-01', country: 'US' };
        rerender();
        expect(captured()).toBe(true);
        state.profile = { dob: '2020-01-01', country: 'US' };
        rerender();
        expect(captured()).toBe(false);
        state.profile = { dob: '2000-01-01', country: 'US' };
        state.type = 'child';
        rerender();
        expect(captured()).toBe(false);
        state.type = null;
        state.allowed = false;
        rerender();
        expect(captured()).toBe(false);
    });
});
