/**
 * Deterministic wiring tests for useAuthGateState — the resume-race scenario.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { CoordinatorStatus } from './authStatus';

const mockUseOptionalAuthCoordinator = vi.fn();
const mockUseWallet = vi.fn();
const mockUseIsLoggedIn = vi.fn();

vi.mock('../auth-coordinator/AuthCoordinatorProvider', () => ({
    useOptionalAuthCoordinator: () => mockUseOptionalAuthCoordinator(),
}));

vi.mock('../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => mockUseWallet() } },
}));

vi.mock('../stores/currentUserStore', () => ({
    useIsLoggedIn: () => mockUseIsLoggedIn(),
}));

import { shouldPromptProfileOnboarding, hasNetworkProfile, isAuthResolving } from './authStatus';
import { useAuthGateState } from './useAuthGateState';

const setSources = (opts: {
    coordinatorStatus?: CoordinatorStatus;
    walletReady?: boolean;
    isLoggedIn?: boolean;
}) => {
    mockUseOptionalAuthCoordinator.mockReturnValue(
        opts.coordinatorStatus ? { state: { status: opts.coordinatorStatus } } : null
    );
    mockUseWallet.mockReturnValue(opts.walletReady ? {} : null);
    mockUseIsLoggedIn.mockReturnValue(opts.isLoggedIn ?? false);
};

describe('useAuthGateState — resume race', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does NOT authorize onboarding during the resume window (persisted login, key not yet rebuilt)', () => {
        // currentUser rehydrated (isLoggedIn true) but coordinator still deriving the key,
        // wallet not bridged, and the profile query happens to read empty.
        setSources({ coordinatorStatus: 'deriving_key', walletReady: false, isLoggedIn: true });

        const { result } = renderHook(() => useAuthGateState('success', false));

        expect(result.current).toEqual({ tag: 'resolving' });
        expect(shouldPromptProfileOnboarding(result.current)).toBe(false);
        expect(isAuthResolving(result.current)).toBe(true);
    });

    it('does NOT authorize onboarding when no coordinator is mounted but login persisted without a wallet', () => {
        setSources({ coordinatorStatus: undefined, walletReady: false, isLoggedIn: true });

        const { result } = renderHook(() => useAuthGateState('success', false));

        expect(shouldPromptProfileOnboarding(result.current)).toBe(false);
    });

    it('authorizes onboarding only once ready + wallet bridged + profile confirmed absent', () => {
        setSources({ coordinatorStatus: 'ready', walletReady: true, isLoggedIn: true });

        const { result } = renderHook(() => useAuthGateState('success', false));

        expect(result.current).toEqual({ tag: 'ready', profile: { tag: 'absent' } });
        expect(shouldPromptProfileOnboarding(result.current)).toBe(true);
    });

    it('treats a post-wallet profile error as still-resolving, never as "no profile"', () => {
        setSources({ coordinatorStatus: 'ready', walletReady: true, isLoggedIn: true });

        const { result } = renderHook(() => useAuthGateState('error', false));

        expect(result.current).toEqual({ tag: 'ready', profile: { tag: 'error' } });
        expect(shouldPromptProfileOnboarding(result.current)).toBe(false);
    });

    it('reports a confirmed network profile as present', () => {
        setSources({ coordinatorStatus: 'ready', walletReady: true, isLoggedIn: true });

        const { result } = renderHook(() => useAuthGateState('success', true));

        expect(hasNetworkProfile(result.current)).toBe(true);
        expect(shouldPromptProfileOnboarding(result.current)).toBe(false);
    });
});
