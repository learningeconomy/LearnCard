import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    guardianApprovalStore,
    getGuardianApprovalVP,
} from 'learn-card-base/stores/guardianApprovalStore';
import { useGuardianGate, clearGuardianVerification } from './useGuardianGate';

const state = vi.hoisted(() => ({
    child: true,
    childDid: 'did:example:child-a',
    parentDid: 'did:example:parent',
    privateKey: 'local-test-key',
    newModal: vi.fn(),
    closeModal: vi.fn(),
    initWallet: vi.fn(),
    hasPin: vi.fn(),
    sign: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: vi.fn() }),
    switchedProfileStore: {
        use: {
            isSwitchedProfile: () => state.child,
            profileType: () => (state.child ? 'child' : 'parent'),
        },
        get: { switchedDid: () => state.childDid },
    },
    currentUserStore: {
        use: { parentUserDid: () => state.parentDid },
        get: { parentUser: () => ({ privateKey: state.privateKey }) },
    },
    useModal: () => ({ newModal: state.newModal, closeModal: state.closeModal }),
    useWallet: () => ({ initWallet: state.initWallet }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: null }),
    calculateAge: () => NaN,
    ModalTypes: { FullScreen: 'FullScreen', Cancel: 'Cancel' },
}));
vi.mock('../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper', () => ({
    FamilyPinWrapper: () => <div />,
}));

describe('guardian-approved actions', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        clearGuardianVerification();
        state.child = true;
        state.childDid = 'did:example:child-a';
        state.parentDid = 'did:example:parent';
        state.privateKey = 'local-test-key';
        state.hasPin.mockResolvedValue(false);
        state.sign.mockImplementation(async ({ challenge }) => `signed:${challenge}`);
        state.initWallet.mockResolvedValue({
            invoke: { hasPin: state.hasPin, getDidAuthVp: state.sign },
        });
    });
    afterEach(() => vi.useRealTimers());

    it('does not gate adult actions', async () => {
        state.child = false;
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await act(() => result.current.guardedAction(action));
        expect(action).toHaveBeenCalledOnce();
        expect(state.sign).not.toHaveBeenCalled();
    });

    it('requires a signed approval even under the existing no-PIN policy', async () => {
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await act(() => result.current.guardedAction(action));
        expect(action).toHaveBeenCalledOnce();
        expect(getGuardianApprovalVP(state.childDid)).toContain(state.childDid);
        expect(getGuardianApprovalVP('did:example:other-child')).toBeUndefined();
        expect(getGuardianApprovalVP(undefined)).toBeUndefined();
        await act(() => result.current.guardedAction(action));
        expect(action).toHaveBeenCalledTimes(2);
        expect(state.sign).toHaveBeenCalledOnce();
    });

    it('does not execute or cache approval when signing fails, and can retry', async () => {
        state.sign.mockRejectedValueOnce(new Error('Signing unavailable'));
        const action = vi.fn();
        const verified = vi.fn();
        const { result } = renderHook(() => useGuardianGate({ onVerified: verified }));
        await expect(result.current.guardedAction(action)).rejects.toBeInstanceOf(Error);
        expect(action).not.toHaveBeenCalled();
        expect(verified).not.toHaveBeenCalled();
        expect(getGuardianApprovalVP(state.childDid)).toBeUndefined();
        await act(() => result.current.guardedAction(action));
        expect(action).toHaveBeenCalledOnce();
        expect(verified).toHaveBeenCalledOnce();
    });

    it('does not reuse another child’s verification when switching within one family', async () => {
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await act(() => result.current.guardedAction(action));
        state.childDid = 'did:example:child-b';
        await act(() => result.current.guardedAction(action));
        expect(getGuardianApprovalVP('did:example:child-a')).toBeUndefined();
        state.childDid = 'did:example:child-a';
        await act(() => result.current.guardedAction(action));
        expect(state.sign).toHaveBeenCalledTimes(3);
        expect(action).toHaveBeenCalledTimes(3);
    });

    it('requires signing again at expiry and after explicit clearing', async () => {
        vi.useFakeTimers();
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await act(() => result.current.guardedAction(action));
        vi.advanceTimersByTime(300_000);
        expect(getGuardianApprovalVP(state.childDid)).toBeUndefined();
        await act(() => result.current.guardedAction(action));
        act(() => result.current.clearVerification());
        await act(() => result.current.guardedAction(action));
        expect(state.sign).toHaveBeenCalledTimes(3);
    });

    it('rejects a profile switch during signing without running the stale action', async () => {
        state.sign.mockImplementationOnce(async () => {
            state.childDid = 'did:example:child-b';
            return 'signed-for-child-a';
        });
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await expect(result.current.guardedAction(action)).rejects.toBeInstanceOf(Error);
        expect(action).not.toHaveBeenCalled();
        expect(getGuardianApprovalVP('did:example:child-a')).toBeUndefined();
        expect(getGuardianApprovalVP(state.childDid)).toBeUndefined();
    });

    it('settles the PIN-gated action with rejection when signing fails after verification', async () => {
        state.hasPin.mockResolvedValue(true);
        state.sign.mockRejectedValue(new Error('Signing unavailable'));
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        const pending = result.current.guardedAction(action);
        const rejection = expect(pending).rejects.toBeInstanceOf(Error);
        await waitFor(() => expect(state.newModal).toHaveBeenCalledOnce());
        expect(action).not.toHaveBeenCalled();
        await act(() => state.newModal.mock.calls[0][0].props.handleOnSubmit());
        await rejection;
        expect(action).not.toHaveBeenCalled();
        expect(
            guardianApprovalStore.get.getApproval(state.parentDid, state.childDid)
        ).toBeUndefined();
    });

    it('stops reusing approval exactly sixty seconds before the signed whole-second expiry', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(1_800_000_000_875);
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate({ verificationTTL: 600_000 }));
        await act(() => result.current.guardedAction(action));
        const approval = getGuardianApprovalVP(state.childDid)!;
        const claims = JSON.parse(approval.slice('signed:'.length));
        expect(claims.exp).toBe(1_800_000_300);
        vi.setSystemTime(claims.exp * 1000 - 60_001);
        expect(getGuardianApprovalVP(state.childDid)).toBe(approval);
        expect(guardianApprovalStore.get.getApproval(state.parentDid, state.childDid)).toBe(
            approval
        );
        await act(() => result.current.guardedAction(action));
        expect(state.sign).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(1);
        expect(getGuardianApprovalVP(state.childDid)).toBeUndefined();
        expect(
            guardianApprovalStore.get.getApproval(state.parentDid, state.childDid)
        ).toBeUndefined();
        await act(() => result.current.guardedAction(action));
        expect(state.sign).toHaveBeenCalledTimes(2);
        expect(getGuardianApprovalVP(state.childDid)).not.toBe(approval);
    });

    it('does not execute an action with an approval that expired during signing', async () => {
        vi.useFakeTimers();
        state.sign.mockImplementationOnce(async ({ challenge }) => {
            vi.advanceTimersByTime(300_000);
            return `signed:${challenge}`;
        });
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await expect(result.current.guardedAction(action)).rejects.toBeInstanceOf(Error);
        expect(action).not.toHaveBeenCalled();
        expect(getGuardianApprovalVP(state.childDid)).toBeUndefined();
    });

    it('rejects unavailable guardian identity instead of resolving an approval precondition', async () => {
        state.parentDid = '';
        const action = vi.fn();
        const { result } = renderHook(() => useGuardianGate());
        await expect(result.current.guardedAction(action)).rejects.toBeInstanceOf(Error);
        expect(action).not.toHaveBeenCalled();
        expect(state.sign).not.toHaveBeenCalled();
    });
});
