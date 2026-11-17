// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    offer: true,
    pending: false,
    activationPending: false,
    publicComputer: false,
    offerEnabled: vi.fn(),
    nextStep: 'email' as 'email' | 'method' | 'done',
    did: 'did:key:z6MkKeepAccount',
    newModal: vi.fn(),
    closeModal: vi.fn(),
    track: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center', BottomSheet: 'bottom-sheet' },
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
}));
vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    RECOVERY_PROMPT_SNOOZE_MS: 7 * 24 * 60 * 60 * 1000,
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: { KEEP_ACCOUNT_DISMISSED: 'dismissed' },
}));
vi.mock('../../../components/classlink/KeepAccountStep', () => ({
    KeepAccountStep: () => null,
}));
vi.mock('../../../components/classlink/useKeepAccountOffer', () => ({
    useKeepAccountOffer: (enabled = true) => {
        mocks.offerEnabled(enabled);
        return {
            offer: enabled && mocks.offer,
            pending: enabled && mocks.pending,
            continuity: enabled
                ? { nextStep: mocks.nextStep, personalEmail: { allowed: true } }
                : undefined,
        };
    },
}));
vi.mock('../../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: { status: 'ready', did: mocks.did },
        recoveryActivationPending: mocks.activationPending,
    }),
}));
vi.mock('@learncard/sss-key-manager', () => ({
    isPublicComputerMode: () => mocks.publicComputer,
}));

import {
    KEEP_ACCOUNT_SNOOZE_MS,
    getKeepAccountSnoozeKey,
    useKeepAccountBanner,
} from './useKeepAccountBanner';

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.offer = true;
    mocks.pending = false;
    mocks.activationPending = false;
    mocks.publicComputer = false;
    mocks.nextStep = 'email';
    mocks.did = 'did:key:z6MkKeepAccount';
});

describe('useKeepAccountBanner', () => {
    it('shows while the server reports a step left (email or method)', () => {
        const { result } = renderHook(() => useKeepAccountBanner());
        expect(result.current.banner?.step).toBe('email');

        mocks.nextStep = 'method';
        const { result: method } = renderHook(() => useKeepAccountBanner());
        expect(method.current.banner?.step).toBe('method');
    });

    it('is hidden when the server has nothing to offer', () => {
        mocks.offer = false;
        const { result } = renderHook(() => useKeepAccountBanner());
        expect(result.current).toEqual({ pending: false });
    });

    it('reports pending while the server answer loads, so no other banner shows first', () => {
        mocks.offer = false;
        mocks.pending = true;
        const { result } = renderHook(() => useKeepAccountBanner());
        expect(result.current).toEqual({ pending: true });
    });

    it.each([
        ['activation is pending', 'activationPending'],
        ['on a public computer', 'publicComputer'],
    ] as const)('leaves the slot to the urgent recovery prompt when %s', (_, flag) => {
        mocks[flag] = true;
        mocks.pending = true;
        const { result } = renderHook(() => useKeepAccountBanner());

        expect(result.current).toEqual({ pending: false });
        expect(mocks.offerEnabled).toHaveBeenCalledWith(false);
    });

    it('snoozes under its own per-account key for seven days', () => {
        const { result } = renderHook(() => useKeepAccountBanner());
        const before = Date.now();
        act(() => result.current.banner?.onSnooze());

        expect(result.current.banner).toBeUndefined();
        const key = getKeepAccountSnoozeKey(mocks.did);
        expect(key).not.toContain(mocks.did);
        expect(Number(localStorage.getItem(key))).toBeGreaterThanOrEqual(
            before + KEEP_ACCOUNT_SNOOZE_MS
        );
        // Only its own key: the recovery banner's snooze (firstStartupStore) is untouched.
        expect(localStorage.length).toBe(1);
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'email',
        });

        // Still snoozed on the next visit; another account on this device is not.
        expect(renderHook(() => useKeepAccountBanner()).result.current.banner).toBeUndefined();
        mocks.did = 'did:key:z6MkSomeoneElse';
        expect(renderHook(() => useKeepAccountBanner()).result.current.banner?.step).toBe('email');
    });

    it('shows again once the snooze has passed', () => {
        localStorage.setItem(getKeepAccountSnoozeKey(mocks.did), String(Date.now() - 1));
        const { result } = renderHook(() => useKeepAccountBanner());
        expect(result.current.banner?.step).toBe('email');
    });

    it('opens the step in a sheet that closes itself before the method overlay', () => {
        const { result } = renderHook(() => useKeepAccountBanner());
        act(() => result.current.banner?.onStart());

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        const sheet = mocks.newModal.mock.calls[0][0] as React.ReactElement<{
            children: React.ReactElement<Record<string, () => void>>;
        }>;
        const step = sheet.props.children;
        expect(step.props.source).toBe('dashboard');
        step.props.onBeforeMethod();
        expect(mocks.closeModal).toHaveBeenCalledTimes(1);
    });
});
