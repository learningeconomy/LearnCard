import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCNProfile } from '@learncard/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    parentDid: 'did:example:parent',
    hasPinCheck: vi.fn(async () => false),
    switchParent: vi.fn(async () => undefined),
    toast: vi.fn(),
    modal: vi.fn(
        (_content: React.ReactElement<{ handleOnSubmit: () => Promise<void> }>) => 'modal-token'
    ),
}));
vi.mock('learn-card-base', () => ({
    currentUserStore: {
        get: {
            parentUser: () => ({ name: 'Parent', profileImage: 'parent.png' }),
            parentUserDid: () => state.parentDid,
        },
    },
    switchedProfileStore: { use: { isSwitchedProfile: () => true } },
    ModalTypes: { FullScreen: 'fullscreen', Cancel: 'cancel' },
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: state.toast }),
    useModal: () => ({ newModalWithToken: state.modal, forceCloseModalByToken: vi.fn() }),
    useWallet: () => ({ initWallet: async () => ({ invoke: { hasPin: state.hasPinCheck } }) }),
    useSwitchProfile: () => ({
        handleSwitchBackToParentAccount: state.switchParent,
        isSwitching: false,
    }),
}));
vi.mock('../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper', () => ({
    default: () => null,
    FamilyPinViewModeEnum: { edit: 'edit' },
}));
import { usePin } from './usePin';

const mount = (onSwitch?: (profile: LCNProfile) => void) => {
    const client = new QueryClient();
    const hook = renderHook(() => usePin(onSwitch), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
    return { ...hook, client };
};

describe('usePin parent PIN checks', () => {
    beforeEach(() => {
        state.parentDid = 'did:example:parent';
        state.hasPinCheck.mockReset().mockResolvedValue(false);
        state.switchParent.mockReset().mockImplementation(async () => {
            state.parentDid = '';
        });
        state.toast.mockClear();
        state.modal.mockClear();
    });
    afterEach(cleanup);

    it('blocks a protected callback and leaves the child active when the parent has no PIN', async () => {
        const onSuccess = vi.fn();
        const { result } = mount();
        await act(async () =>
            result.current.handleVerifyParentPin({ switchToParentAfterPin: false, onSuccess })
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(state.switchParent).not.toHaveBeenCalled();
        expect(state.modal).not.toHaveBeenCalled();
    });

    it('never verifies an active child PIN when the parent identity is missing', async () => {
        state.parentDid = '';
        const onSuccess = vi.fn();
        const { result } = mount();
        await act(async () =>
            result.current.handleVerifyParentPin({ switchToParentAfterPin: false, onSuccess })
        );
        expect(state.modal).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(state.switchParent).not.toHaveBeenCalled();
    });

    it('preserves the no-PIN parent-switch fast path and uses stored identity for a mismatched cache', async () => {
        const onSwitch = vi.fn();
        const { result, client } = mount(onSwitch);
        client.setQueryData(['getProfile', '', undefined], {
            did: 'did:example:wrong',
            displayName: 'Wrong',
            profileId: 'wrong',
        });
        await act(async () => result.current.handleVerifyParentPin());
        expect(state.switchParent).toHaveBeenCalledOnce();
        expect(onSwitch).toHaveBeenCalledWith(
            expect.objectContaining({
                did: 'did:example:parent',
                displayName: 'Parent',
            })
        );
    });

    it('opens PIN verification when the parent already has a PIN', async () => {
        state.hasPinCheck.mockResolvedValue(true);
        const onSuccess = vi.fn();
        const { result } = mount();
        await act(async () =>
            result.current.handleVerifyParentPin({
                switchToParentAfterPin: false,
                onSuccess,
            })
        );
        expect(state.modal).toHaveBeenCalledOnce();
        const pinModal = state.modal.mock.calls[0][0] as React.ReactElement<{
            handleOnSubmit: () => Promise<void>;
        }>;
        await act(async () => pinModal.props.handleOnSubmit());
        expect(onSuccess).toHaveBeenCalledOnce();
        expect(state.switchParent).not.toHaveBeenCalled();
    });
});
