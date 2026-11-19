// @vitest-environment jsdom
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PinStatus = { enabled: boolean } | undefined;

const mocks = vi.hoisted(() => ({
    offer: true,
    pending: false,
    activationPending: false,
    publicComputer: false,
    offerEnabled: vi.fn(),
    nextStep: 'email' as 'email' | 'pin' | 'confirmPin' | 'method' | 'done',
    sessionStep: undefined as string | undefined,
    pinState: 'none' as 'none' | 'enabled' | 'locked' | 'stale',
    did: 'did:key:z6MkKeepAccount',
    escrowEnrollment: 'enrolled' as string | undefined,
    escrowPin: { enabled: true } as PinStatus,
    recoveryMethodCount: 0 as number | null,
    recoverySnoozedUntil: 0,
    setRecoverySnoozedUntil: vi.fn(),
    justOnboarded: false,
    newModal: vi.fn(),
    closeModal: vi.fn(),
    openPinSetup: vi.fn(),
    openRecoverySetup: vi.fn(),
    invalidate: vi.fn(),
    track: vi.fn(),
    isStudent: true,
    connectionLoading: false,
    webAuthn: true,
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center', BottomSheet: 'bottom-sheet' },
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    useSchoolConnection: (enabled: boolean) => ({
        data: enabled && !mocks.connectionLoading ? { isStudent: mocks.isStudent } : undefined,
        isLoading: enabled && mocks.connectionLoading,
    }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    RECOVERY_PROMPT_SNOOZE_MS: 7 * 24 * 60 * 60 * 1000,
    default: {
        useTracked: { recoveryPromptSnoozedUntil: () => mocks.recoverySnoozedUntil },
        set: { recoveryPromptSnoozedUntil: mocks.setRecoverySnoozedUntil },
    },
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: {
        KEEP_ACCOUNT_SHOWN: 'shown',
        KEEP_ACCOUNT_STEP_COMPLETED: 'completed',
        KEEP_ACCOUNT_DISMISSED: 'dismissed',
    },
}));
vi.mock('../../../components/classlink/KeepAccountStep', () => ({
    KeepAccountStep: () => null,
}));
vi.mock('../../../components/classlink/keepAccountSession', () => ({
    useKeepAccountAskedThisSession: () => mocks.justOnboarded,
}));
vi.mock('../../../components/classlink/useKeepAccountOffer', () => ({
    useKeepAccountOffer: (enabled = true) => {
        mocks.offerEnabled(enabled);
        return {
            offer: enabled && mocks.offer,
            pending: enabled && mocks.pending,
            continuity: enabled
                ? {
                      nextStep: mocks.nextStep,
                      pinState: mocks.pinState,
                      personalEmail: { allowed: true },
                  }
                : undefined,
            // The step this session can act on (`otherUid` for a confirm on another login).
            step: enabled ? (mocks.sessionStep ?? mocks.nextStep) : undefined,
        };
    },
}));
vi.mock('../../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: {
            status: 'ready',
            did: mocks.did,
            escrowEnrollment: mocks.escrowEnrollment,
            escrowPin: mocks.escrowPin,
        },
        capabilities: { recovery: true },
        recoveryActivationPending: mocks.activationPending,
        recoveryMethodCount: mocks.recoveryMethodCount,
        openPinSetup: mocks.openPinSetup,
        openRecoverySetup: mocks.openRecoverySetup,
    }),
}));
vi.mock('@learncard/sss-key-manager', () => ({
    isPublicComputerMode: () => mocks.publicComputer,
    isWebAuthnSupported: () => mocks.webAuthn,
}));

import * as m from '../../../paraglide/messages.js';
import {
    KEEP_ACCOUNT_ESCROW_WAIT_MS,
    KEEP_ACCOUNT_SNOOZE_MS,
    getKeepAccountSnoozeCountKey,
    getKeepAccountSnoozeKey,
    useKeepAccountBanner,
} from './useKeepAccountBanner';

const render = () => renderHook(() => useKeepAccountBanner());

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.offer = true;
    mocks.pending = false;
    mocks.activationPending = false;
    mocks.publicComputer = false;
    mocks.nextStep = 'email';
    mocks.sessionStep = undefined;
    mocks.pinState = 'enabled';
    mocks.did = 'did:key:z6MkKeepAccount';
    mocks.escrowEnrollment = 'enrolled';
    mocks.escrowPin = { enabled: true };
    mocks.recoveryMethodCount = 0;
    mocks.recoverySnoozedUntil = 0;
    mocks.justOnboarded = false;
    mocks.isStudent = true;
    mocks.connectionLoading = false;
    mocks.webAuthn = true;
});

describe('useKeepAccountBanner', () => {
    it('asks for the personal email', () => {
        const { banner } = render().result.current;
        expect(banner?.step).toBe('email');
        expect(banner?.title).toBe(m['classlinkKeepAccount.title']());
    });

    it('drops "after school" for staff, and holds the slot until it knows', () => {
        mocks.connectionLoading = true;
        expect(render().result.current).toEqual({ pending: true });
        mocks.connectionLoading = false;
        mocks.isStudent = false;
        expect(render().result.current.banner?.title).toBe(m['classlinkKeepAccount.titleLogin']());
    });

    it('asks for a PIN once the email is in, opening the PIN overlay', () => {
        mocks.nextStep = 'pin';
        mocks.pinState = 'none';
        mocks.escrowPin = undefined;
        const { result } = render();
        expect(result.current.banner?.step).toBe('pin');

        act(() => result.current.banner?.onStart());
        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.openPinSetup).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'first-time' })
        );
        // The PIN funnel is measured like the sheet's.
        expect(mocks.track).toHaveBeenCalledWith('shown', { source: 'dashboard', step: 'pin' });
        mocks.openPinSetup.mock.calls[0][0].onComplete();
        expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'pin',
        });
    });

    it('asks for a new PIN when it is locked', () => {
        mocks.nextStep = 'pin';
        mocks.pinState = 'locked';
        mocks.escrowPin = undefined;
        const { result } = render();
        expect(result.current.banner?.pinLocked).toBe(true);
        act(() => result.current.banner?.onStart());
        expect(mocks.openPinSetup).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'pin-locked' })
        );
    });

    it('without escrow, asks for a passkey (or phrase) and starts it directly', () => {
        mocks.nextStep = 'method';
        mocks.escrowEnrollment = 'not-enrolled';
        mocks.escrowPin = undefined;
        const { result } = render();
        expect(result.current.banner?.step).toBe('method');
        expect(result.current.banner?.phrase).toBe(false);
        act(() => result.current.banner?.onStart());
        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.openRecoverySetup).toHaveBeenCalledWith(
            expect.objectContaining({ initialMethod: 'passkey', autoStart: true })
        );
        mocks.openRecoverySetup.mock.calls[0][0].onCompleted();
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'method',
        });

        mocks.webAuthn = false;
        expect(render().result.current.banner?.phrase).toBe(true);
    });

    it('never shows once done', () => {
        mocks.nextStep = 'done';
        mocks.offer = false;
        expect(render().result.current).toEqual({ pending: false });
    });

    it('holds the slot until escrow state is known, but not forever', () => {
        vi.useFakeTimers();
        mocks.escrowEnrollment = undefined;
        mocks.escrowPin = undefined;
        const { result } = render();
        expect(result.current).toEqual({ pending: true });
        act(() => {
            vi.advanceTimersByTime(KEEP_ACCOUNT_ESCROW_WAIT_MS);
        });
        expect(result.current.banner?.step).toBe('email');
        vi.useRealTimers();
    });

    it('does not wait for escrow when the account already has a recovery method', () => {
        mocks.escrowEnrollment = undefined;
        mocks.recoveryMethodCount = 1;
        expect(render().result.current.banner?.step).toBe('email');
    });

    it('leaves the slot to the recovery banner while its "create a PIN" tier applies', () => {
        mocks.escrowPin = { enabled: false };
        for (const nextStep of ['email', 'pin'] as const) {
            mocks.nextStep = nextStep;
            expect(render().result.current).toEqual({ pending: false });
        }
    });

    it('never reveals a PIN ask the recovery banner was snoozed on', () => {
        mocks.recoverySnoozedUntil = Date.now() + 60_000;
        mocks.nextStep = 'pin';
        mocks.escrowPin = { enabled: false };
        expect(render().result.current.banner).toBeUndefined();
        // Client PIN status not known yet: still the same ask.
        mocks.escrowPin = undefined;
        expect(render().result.current.banner).toBeUndefined();
        // A different ask (the email) is not suppressed by it.
        mocks.nextStep = 'email';
        expect(render().result.current.banner?.step).toBe('email');
    });

    it('snoozing the PIN ask quiets the recovery banner for as long', () => {
        mocks.nextStep = 'pin';
        mocks.escrowPin = undefined;
        const { result } = render();
        act(() => result.current.banner?.onSnooze());
        expect(mocks.setRecoverySnoozedUntil).toHaveBeenCalledWith(
            Number(localStorage.getItem(getKeepAccountSnoozeKey(mocks.did)))
        );
        expect(result.current.banner).toBeUndefined();
    });

    it('snoozing the email ask leaves the recovery banner alone', () => {
        const { result } = render();
        act(() => result.current.banner?.onSnooze());
        expect(mocks.setRecoverySnoozedUntil).not.toHaveBeenCalled();
    });

    it('waits while the recovery method count is unknown', () => {
        mocks.recoveryMethodCount = null;
        expect(render().result.current).toEqual({ pending: true });
    });

    it('is hidden when the server has nothing to offer', () => {
        mocks.offer = false;
        expect(render().result.current).toEqual({ pending: false });
    });

    it('reports pending while the server answer loads, so no other banner shows first', () => {
        mocks.offer = false;
        mocks.pending = true;
        expect(render().result.current).toEqual({ pending: true });
    });

    it('does not ask again in a session that already asked (onboarding, transcript sheet)', () => {
        mocks.justOnboarded = true;
        mocks.pending = true;
        expect(render().result.current).toEqual({ pending: false });
        expect(mocks.offerEnabled).toHaveBeenCalledWith(false);
    });

    it.each([
        ['activation is pending', 'activationPending'],
        ['on a public computer', 'publicComputer'],
    ] as const)('leaves the slot to the urgent recovery prompt when %s', (_, flag) => {
        mocks[flag] = true;
        mocks.pending = true;
        const { result } = render();

        expect(result.current).toEqual({ pending: false });
        expect(mocks.offerEnabled).toHaveBeenCalledWith(false);
    });

    it('snoozes under its own per-account key for seven days', () => {
        const { result } = render();
        const before = Date.now();
        act(() => result.current.banner?.onSnooze());

        expect(result.current.banner).toBeUndefined();
        const key = getKeepAccountSnoozeKey(mocks.did);
        expect(key).not.toContain(mocks.did);
        expect(Number(localStorage.getItem(key))).toBeGreaterThanOrEqual(
            before + KEEP_ACCOUNT_SNOOZE_MS
        );
        expect(localStorage.getItem(getKeepAccountSnoozeCountKey(mocks.did))).toBe('1');
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'email',
        });

        // Still snoozed on the next visit; another account on this device is not.
        expect(render().result.current.banner).toBeUndefined();
        mocks.did = 'did:key:z6MkSomeoneElse';
        expect(render().result.current.banner?.step).toBe('email');
    });

    it('shows again once the snooze has passed, and stops after two snoozes', () => {
        localStorage.setItem(getKeepAccountSnoozeKey(mocks.did), String(Date.now() - 1));
        localStorage.setItem(getKeepAccountSnoozeCountKey(mocks.did), '1');
        const { result } = render();
        expect(result.current.banner?.step).toBe('email');

        act(() => result.current.banner?.onSnooze());
        localStorage.setItem(getKeepAccountSnoozeKey(mocks.did), String(Date.now() - 1));
        expect(render().result.current).toEqual({ pending: false });
        mocks.nextStep = 'pin';
        mocks.escrowPin = undefined;
        expect(render().result.current).toEqual({ pending: false });
    });

    it('opens the email step in a sheet that closes for an overlay and reopens after it', () => {
        const { result } = render();
        act(() => result.current.banner?.onStart());

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        const sheet = mocks.newModal.mock.calls[0][0] as React.ReactElement<{
            children: React.ReactElement<Record<string, () => void>>;
        }>;
        const step = sheet.props.children;
        expect(step.props.source).toBe('dashboard');
        step.props.onBeforeOverlay();
        expect(mocks.closeModal).toHaveBeenCalledTimes(1);
        step.props.onOverlayComplete();
        expect(mocks.newModal).toHaveBeenCalledTimes(2);
    });

    it('asks to confirm the PIN in the sheet, even while the recovery banner is snoozed', () => {
        mocks.nextStep = 'confirmPin';
        mocks.recoverySnoozedUntil = Date.now() + 60_000;
        const { banner } = render().result.current;
        expect(banner?.step).toBe('confirmPin');
        act(() => banner?.onStart());
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        expect(mocks.openPinSetup).not.toHaveBeenCalled();
        expect(mocks.openRecoverySetup).not.toHaveBeenCalled();
        // Its own snooze never quiets the recovery banner (that one never asks for it).
        act(() => banner?.onSnooze());
        expect(mocks.setRecoverySnoozedUntil).not.toHaveBeenCalled();
    });

    it('never asks to confirm the PIN on another login of the account', () => {
        mocks.nextStep = 'confirmPin';
        mocks.sessionStep = 'otherUid';
        mocks.offer = false;
        expect(render().result.current.banner).toBeUndefined();
    });
});
