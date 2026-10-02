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
import { ReferralConsentReview } from '../../components/contract-requests/ReferralModal';

const state = vi.hoisted(() => ({
    child: true,
    referralsEnabled: true,
    service: false,
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

vi.mock('../../hooks/useContractRequestsEnabled', () => ({
    useContractRequestsEnabled: () => state.referralsEnabled,
}));

vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/helpers/consentErrors')),
    useConsentToContract: (...args: Parameters<typeof useConsentToContract>) =>
        useConsentToContract(...args),
    useWallet: () => ({ initWallet: state.initWallet }),
    switchedProfileStore: {
        use: {
            isSwitchedProfile: () => state.child || state.service,
            profileType: () => (state.service ? 'service' : state.child ? 'child' : 'parent'),
        },
        get: {
            switchedDid: () =>
                state.service
                    ? 'did:example:service'
                    : state.child
                      ? 'did:example:child'
                      : undefined,
        },
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
vi.mock('learn-card-base/components/modals/useModal', () => ({
    useModal: () => ({ newModal: state.newModal, closeModal: vi.fn(), closeAllModals: vi.fn() }),
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
        state.referralsEnabled = true;
        state.service = false;
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
                getContract: vi.fn().mockResolvedValue(contract),
                getConsentedContracts: vi.fn().mockResolvedValue({
                    records: [{ uri: 'lc:terms', contract }],
                    hasMore: false,
                }),
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

    it('keeps an audience conflict in review without calling the success callback', async () => {
        state.child = false;
        const onSuccess = vi.fn();
        state.consent.mockRejectedValueOnce(
            Object.assign(
                new Error(
                    'The sharing audience or consent changed. Review the contract and try again.'
                ),
                { data: { code: 'CONFLICT', httpStatus: 409 } }
            )
        );
        showFlow({ successCallback: onSuccess });
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(state.presentToast).toHaveBeenCalled());
        expect(onSuccess).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Connect' })).toBeTruthy();
        expect(state.presentToast.mock.calls[0][1].type).toBe('error');
        expect(state.newModal).not.toHaveBeenCalled();
    });

    it('preserves the existing-consent callback for the explicit already-consented response', async () => {
        state.child = false;
        const onSuccess = vi.fn();
        state.consent.mockRejectedValueOnce(
            Object.assign(new Error("You've already consented to this contract!"), {
                data: { code: 'CONFLICT' },
            })
        );
        showFlow({ successCallback: onSuccess });
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
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

    it.each(['adult', 'service', 'preview'] as const)(
        'preserves the %s path without guardian signing',
        async mode => {
            state.child = mode === 'preview';
            state.service = mode === 'service';
            showFlow({ isPreview: mode === 'preview' });
            fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
            await waitFor(() => expect(state.consent).toHaveBeenCalledOnce());
            expect(state.sign).not.toHaveBeenCalled();
            expect(state.newModal).not.toHaveBeenCalled();
        }
    );

    it('aborts referral consent when disabled during credential preparation', async () => {
        state.child = false;
        let finish!: (uri: string) => void;
        state.upload.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    finish = resolve;
                })
        );
        const success = vi.fn();
        const view = render(
            <ReferralConsentReview
                contractDetails={contract}
                disableRedirect
                successCallback={success}
            />,
            { wrapper }
        );
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(finish).toBeDefined());
        state.referralsEnabled = false;
        view.rerender(
            <ReferralConsentReview
                contractDetails={contract}
                disableRedirect
                successCallback={success}
            />
        );
        await act(async () => {
            finish('lc:shared');
        });
        await waitFor(() => expect(state.presentToast).toHaveBeenCalled());
        expect(state.consent).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
    });
    it('aborts referral consent when disabled while final guardian approval is pending', async () => {
        const view = render(<ReferralConsentReview contractDetails={contract} disableRedirect />, {
            wrapper,
        });
        fireEvent.click(screen.getByRole('button', { name: 'Get an adult' }));
        await approvePin(1);
        state.upload.mockImplementationOnce(async () => {
            state.now += 300_000;
            return 'lc:shared';
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(state.newModal).toHaveBeenCalledTimes(2));
        state.referralsEnabled = false;
        view.rerender(<ReferralConsentReview contractDetails={contract} disableRedirect />);
        await approvePin(2);
        await waitFor(() => expect(state.presentToast).toHaveBeenCalled());
        expect(state.consent).not.toHaveBeenCalled();
    });
    it('keeps ordinary consent available when referrals are disabled', async () => {
        state.child = false;
        state.referralsEnabled = false;
        showFlow();
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(state.consent).toHaveBeenCalledOnce());
    });
    it('forwards the reviewed invitation ID through credential preparation and guardian validation', async () => {
        state.child = false;
        showFlow({ expectedRequestId: 'reviewed-request' });
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() => expect(state.consent).toHaveBeenCalledOnce());
        expect(state.consent.mock.calls[0][1]).toMatchObject({
            expectedRequestId: 'reviewed-request',
        });
    });
    it('returns to review on an invitation conflict instead of reporting success', async () => {
        state.child = false;
        const success = vi.fn();
        state.consent.mockRejectedValue({
            data: { code: 'CONFLICT' },
            message: 'The sharing audience or consent changed. Review the contract and try again.',
        });
        showFlow({ expectedRequestId: 'cancelled-request', successCallback: success });
        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ type: 'error' })
            )
        );
        expect(success).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Connect' })).toBeVisible();
    });
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
