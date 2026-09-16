import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
    act,
    fireEvent,
    render,
    renderHook,
    screen,
    waitFor,
    cleanup,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import {
    guardianApprovalStore,
    getGuardianApprovalVP,
} from 'learn-card-base/stores/guardianApprovalStore';
import { useUpdateTerms } from 'learn-card-base/hooks/useUpdateTerms';
import { useConsentToContract } from 'learn-card-base/hooks/useConsentToContract';
import FullScreenConsentFlow from './FullScreenConsentFlow';

const state = vi.hoisted(() => ({
    child: true,
    now: 1_800_000_000_875,
    initWallet: vi.fn(),
    sign: vi.fn(),
    hasPin: vi.fn(),
    consent: vi.fn(),
    updateTerms: vi.fn(),
    upload: vi.fn(),
    newModal: vi.fn(),
    presentToast: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useConsentToContract: (...args: Parameters<typeof useConsentToContract>) =>
        useConsentToContract(...args),
    useWallet: () => ({ initWallet: state.initWallet }),
    switchedProfileStore: {
        use: {
            isSwitchedProfile: () => state.child,
            profileType: () => (state.child ? 'child' : 'parent'),
        },
        get: { switchedDid: () => (state.child ? 'did:example:child' : undefined) },
    },
    currentUserStore: {
        use: { parentUserDid: () => 'did:example:parent' },
        get: { parentUser: () => ({ privateKey: 'test-key' }) },
    },
    useGetCurrentLCNUser: () => ({ currentLCNUser: null }),
    calculateAge: () => NaN,
    getLogger: () => ({ warn: vi.fn() }),
    useModal: () => ({ newModal: state.newModal, closeModal: vi.fn(), closeAllModals: vi.fn() }),
    useToast: () => ({ presentToast: state.presentToast }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useGetProfile: () => ({ data: undefined }),
    useSwitchProfile: () => ({
        handleSwitchAccount: vi.fn(),
        handleSwitchBackToParentAccount: vi.fn(),
    }),
    ModalTypes: { FullScreen: 'fullscreen', Cancel: 'cancel', Right: 'right' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
    useLocation: () => ({ search: '' }),
}));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: async () => ({ prompted: false }) }),
}));
vi.mock('../../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper', () => ({
    FamilyPinWrapper: ({ handleOnSubmit }: { handleOnSubmit: () => Promise<void> }) => (
        <button onClick={handleOnSubmit}>Verify guardian PIN</button>
    ),
}));
vi.mock('./ConsentFlowGetAnAdult', () => ({
    default: ({ handleNextStep }: { handleNextStep: () => Promise<void> }) => (
        <button onClick={handleNextStep}>Get an adult</button>
    ),
}));
vi.mock('./ConsentFlowConfirmation', () => ({
    default: ({
        handleAccept,
    }: {
        handleAccept: (terms: ConsentFlowTerms, duration: object) => Promise<void>;
    }) => (
        <button
            onClick={() =>
                handleAccept(
                    {
                        read: {
                            credentials: {
                                categories: { Achievement: { shared: ['lc:credential'] } },
                            },
                            personal: {},
                        },
                        write: { credentials: { categories: {} }, personal: {} },
                    },
                    { oneTimeShare: false, customDuration: '' }
                )
            }
        >
            Connect
        </button>
    ),
}));
vi.mock('./ConsentFlowConnecting', () => ({ default: () => <div>Connecting</div> }));
vi.mock(
    '../../components/ai-passport-apps/AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView',
    () => ({ default: () => null })
);

const contract = {
    uri: 'lc:contract',
    name: 'Test app',
    owner: { did: 'did:example:owner' },
} as ConsentFlowContractDetails;
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const showFlow = (props: Partial<React.ComponentProps<typeof FullScreenConsentFlow>> = {}) =>
    render(<FullScreenConsentFlow contractDetails={contract} disableRedirect {...props} />, {
        wrapper,
    });

const approvePin = async (modalNumber: number) => {
    await waitFor(() => expect(state.newModal).toHaveBeenCalledTimes(modalNumber));
    const modal = render(state.newModal.mock.calls[modalNumber - 1][0]);
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Verify guardian PIN' }));
    });
    modal.unmount();
};

describe('guardian approval at the consent submission boundary', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        state.child = true;
        state.now = 1_800_000_000_875;
        vi.spyOn(Date, 'now').mockImplementation(() => state.now);
        guardianApprovalStore.set.clearAllApprovals();
        queryClient = new QueryClient({
            defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
        });
        state.hasPin.mockResolvedValue(true);
        state.sign.mockImplementation(async ({ challenge }) => `signed:${challenge}`);
        state.consent.mockResolvedValue({ redirectUrl: '' });
        state.updateTerms.mockResolvedValue(true);
        state.upload.mockResolvedValue('lc:shared');
        state.initWallet.mockResolvedValue({
            invoke: {
                hasPin: state.hasPin,
                getDidAuthVp: state.sign,
                consentToContract: state.consent,
                updateContractTerms: state.updateTerms,
            },
            index: {
                LearnCloud: {
                    get: async () => [{ id: 'record', uri: 'lc:credential' }],
                    update: vi.fn(),
                },
            },
            read: { get: async () => ({ id: 'credential' }) },
            store: { LearnCloud: { uploadEncrypted: state.upload } },
        });
    });
    afterEach(() => {
        cleanup();
        queryClient.clear();
        vi.restoreAllMocks();
    });

    it('requires a fresh PIN and signature after a slow credential upload without uploading again', async () => {
        showFlow();
        fireEvent.click(screen.getByRole('button', { name: 'Get an adult' }));
        await approvePin(1);
        const firstApproval = getGuardianApprovalVP('did:example:child');
        state.upload.mockImplementationOnce(async () => {
            state.now += 300_000;
            return 'lc:shared';
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(state.newModal).toHaveBeenCalledTimes(2));
        expect(state.consent).not.toHaveBeenCalled();
        expect(getGuardianApprovalVP('did:example:child')).toBeUndefined();
        await approvePin(2);
        await waitFor(() => expect(state.consent).toHaveBeenCalledOnce());
        expect(state.sign).toHaveBeenCalledTimes(2);
        expect(state.upload).toHaveBeenCalledOnce();
        expect(getGuardianApprovalVP('did:example:child')).not.toBe(firstApproval);
        expect(
            state.consent.mock.calls[0][1].terms.read.credentials.categories.Achievement.shared
        ).toEqual(['lc:shared']);
    });

    it.each(['next step', 'final submit', 'after preparation'] as const)(
        'shows a friendly retry and never submits when signing fails at %s',
        async stage => {
            showFlow();
            if (stage !== 'next step') {
                fireEvent.click(screen.getByRole('button', { name: 'Get an adult' }));
                await approvePin(1);
                if (stage === 'final submit') guardianApprovalStore.set.clearAllApprovals();
                else
                    state.upload.mockImplementationOnce(async () => {
                        state.now += 300_000;
                        return 'lc:shared';
                    });
            }
            state.sign.mockRejectedValueOnce(new Error('private signing diagnostic'));
            fireEvent.click(
                await screen.findByRole('button', {
                    name: stage === 'next step' ? 'Get an adult' : 'Connect',
                })
            );
            await approvePin(stage === 'next step' ? 1 : 2);
            await waitFor(() =>
                expect(state.presentToast).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ type: 'error', hasDismissButton: true })
                )
            );
            expect(state.presentToast.mock.calls[0][0]).not.toContain('private signing diagnostic');
            expect(state.consent).not.toHaveBeenCalled();
            expect(
                screen.getByRole('button', {
                    name: stage === 'next step' ? 'Get an adult' : 'Connect',
                })
            ).toBeTruthy();
            expect(getGuardianApprovalVP('did:example:child')).toBeUndefined();
        }
    );

    it('handles a failed PIN lookup without advancing', async () => {
        state.hasPin.mockRejectedValueOnce(new Error('PIN service unavailable'));
        showFlow();
        fireEvent.click(screen.getByRole('button', { name: 'Get an adult' }));
        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ type: 'error' })
            )
        );
        expect(screen.getByRole('button', { name: 'Get an adult' })).toBeTruthy();
        expect(state.consent).not.toHaveBeenCalled();
    });

    it.each(['adult', 'preview'] as const)(
        'preserves the %s path without guardian signing',
        async mode => {
            state.child = mode !== 'adult';
            showFlow({ isPreview: mode === 'preview' });
            fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
            await waitFor(() => expect(state.consent).toHaveBeenCalledOnce());
            expect(state.sign).not.toHaveBeenCalled();
            expect(state.newModal).not.toHaveBeenCalled();
        }
    );

    it('blocks an update when its post-preparation approval rejects', async () => {
        const { result } = renderHook(() => useUpdateTerms('lc:terms', 'did:example:owner'), {
            wrapper,
        });
        const beforeSubmit = vi.fn(async () => {
            expect(state.upload).toHaveBeenCalledOnce();
            throw new Error('Approval unavailable');
        });
        await act(async () => {
            await expect(
                result.current.mutateAsync({
                    terms: {
                        read: {
                            credentials: {
                                categories: { Achievement: { shared: ['lc:credential'] } },
                            },
                            personal: {},
                        },
                        write: { credentials: { categories: {} }, personal: {} },
                    },
                    beforeSubmit,
                })
            ).rejects.toThrow('Approval unavailable');
        });
        expect(state.updateTerms).not.toHaveBeenCalled();
    });
});
