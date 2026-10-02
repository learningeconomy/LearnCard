import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractRequest, PendingContractRequests } from './ContractRequest';
import { setLocale } from '../../paraglide/runtime.js';

const state = vi.hoisted(() => ({
    status: {
        requestId: 'req-1',
        requestedBy: 'referrer',
        status: 'pending',
        readStatus: 'seen',
        message: 'Career support',
    },
    contract: {
        uri: 'lc:network:localhost%3A4000/trpc:contract:one',
        name: 'Partner services',
        description: 'Get career support',
        reasonForAccessing: 'To provide career services',
        owner: { did: 'did:key:partner', profileId: 'partner', displayName: 'Partner Org' },
        recipients: [
            { did: 'did:key:referrer', profileId: 'referrer', displayName: 'Referrer Org' },
        ],
        contract: {
            read: { personal: {}, credentials: { categories: { Achievement: {} } } },
            write: { personal: {}, credentials: { categories: { Achievement: true } } },
        },
        expiresAt: '',
        needsGuardianConsent: false,
    },
    getStatus: vi.fn(),
    getContract: vi.fn(),
    seen: vi.fn(),
    deny: vi.fn(),
    modal: vi.fn(),
    close: vi.fn(),
    toast: vi.fn(),
    confirm: vi.fn(),
    flags: true,
    tenant: true,
    referrerLoaded: true,
    list: [] as unknown[],
}));
const initWallet = async () => ({
    invoke: {
        getRequestStatusForProfile: state.getStatus,
        getContract: state.getContract,
        markContractRequestAsSeen: state.seen,
        denyContractRequest: state.deny,
    },
});
vi.mock('learn-card-base', () => ({
    contractCategoryNameToCategoryMetadata: (key: string) =>
        (
            ({ Achievement: { title: 'Achievements' }, ID: { title: 'IDs' } }) as Record<
                string,
                { title: string }
            >
        )[key],
    useWallet: () => ({ initWallet }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: { profileId: 'learner' } }),
    useModal: () => ({ newModal: state.modal, closeModal: state.close }),
    ModalTypes: { Right: 'right', FullScreen: 'fullscreen' },
    useGetProfile: () => ({
        data: state.referrerLoaded ? { displayName: 'Referrer Org' } : undefined,
    }),
    useAllContractRequestsForProfile: () => ({
        data: state.list,
        isPending: false,
        isError: false,
    }),
    useConfirmation: () => state.confirm,
    useToast: () => ({ presentToast: state.toast }),
    ToastTypeEnum: { Success: 'success' },
    useFeatureConfig: () => ({ contractRequests: state.tenant }),
}));
vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ enableContractRequests: state.flags }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({ useBrandingConfig: () => ({}) }));
vi.mock('../../pages/consentFlow/FullScreenConsentFlow', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
const show = (element = <ContractRequest contractUri={state.contract.uri} requestId="req-1" />) =>
    render(
        <QueryClientProvider
            client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
        >
            {element}
        </QueryClientProvider>
    );
beforeEach(() => {
    vi.clearAllMocks();
    setLocale('en');
    state.status.status = 'pending';
    state.status.readStatus = 'seen';
    state.contract.expiresAt = '';
    state.contract.needsGuardianConsent = false;
    state.tenant = true;
    state.referrerLoaded = true;
    state.flags = true;
    state.list = [];
    state.getStatus.mockImplementation(async () => ({ ...state.status }));
    state.getContract.mockImplementation(async () => structuredClone(state.contract));
    state.seen.mockResolvedValue(true);
    state.deny.mockImplementation(async () => {
        state.status.status = 'denied';
        return true;
    });
    state.confirm.mockResolvedValue(true);
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
describe('referral actions', () => {
    it('opens fresh review and rechecks the request before submission', async () => {
        show();
        fireEvent.click(await screen.findByText('Accept & Connect'));
        await waitFor(() => expect(state.modal).toHaveBeenCalled());
        const flow = state.modal.mock.calls[0][0];
        expect(flow.props.contractDetails.owner.displayName).toBe('Partner Org');
        expect(flow.props.disableRedirect).toBe(true);
        expect(flow.props.expectedRequestId).toBe('req-1');
        expect(state.getContract).toHaveBeenCalledTimes(2);
        state.status.status = 'cancelled';
        await expect(flow.props.beforeSubmit()).rejects.toThrow('no longer pending');
    });
    it('uses the referrer profile ID when its display profile cannot be loaded', async () => {
        state.referrerLoaded = false;
        show();
        expect(await screen.findByText('referrer has referred you to Partner Org.')).toBeVisible();
    });
    it('shows purpose, message and full audience; Not Now only closes', async () => {
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        expect(await screen.findByText('To provide career services')).toBeVisible();
        expect(screen.getByTestId('contract-request-shared-with')).toHaveTextContent('Partner Org');
        expect(screen.getByTestId('contract-request-shared-with')).toHaveTextContent(
            'Referrer Org'
        );
        fireEvent.click(screen.getByText('Not Now'));
        expect(state.close).toHaveBeenCalled();
        expect(state.deny).not.toHaveBeenCalled();
    });
    it('confirms decline, refreshes terminal state and removes the accept action', async () => {
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        fireEvent.click(await screen.findByText('Decline'));
        expect(await screen.findByText('Declined')).toBeVisible();
        expect(state.deny).toHaveBeenCalledWith(state.contract.uri);
        expect(state.toast).toHaveBeenCalled();
        expect(screen.queryByText('Accept & Connect')).toBeNull();
    });
    it('cancelled confirmation does not decline', async () => {
        state.confirm.mockResolvedValue(false);
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        fireEvent.click(await screen.findByText('Decline'));
        await waitFor(() => expect(state.confirm).toHaveBeenCalled());
        expect(state.deny).not.toHaveBeenCalled();
    });
    it('dismisses independently of the decision', async () => {
        const dismiss = vi.fn().mockResolvedValue(undefined);
        show(
            <ContractRequest
                contractUri={state.contract.uri}
                requestId="req-1"
                onDismiss={dismiss}
            />
        );
        fireEvent.click(await screen.findByLabelText('Dismiss invitation'));
        await waitFor(() => expect(dismiss).toHaveBeenCalled());
        expect(state.deny).not.toHaveBeenCalled();
    });
    it('retries a failed dismissal without refetching or deciding the request', async () => {
        const dismiss = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network'))
            .mockResolvedValue(undefined);
        show(
            <ContractRequest
                contractUri={state.contract.uri}
                requestId="req-1"
                onDismiss={dismiss}
            />
        );
        fireEvent.click(await screen.findByLabelText('Dismiss invitation'));
        await screen.findByRole('alert');
        const reads = state.getStatus.mock.calls.length;
        fireEvent.click(screen.getByText('Try Again'));
        await waitFor(() => expect(dismiss).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(state.getStatus).toHaveBeenCalledTimes(reads);
        expect(state.deny).not.toHaveBeenCalled();
    });
    it('shows a distinct audience including owner-only contracts', async () => {
        const recipients = state.contract.recipients;
        state.getContract.mockResolvedValue({
            ...state.contract,
            recipients: [state.contract.owner, ...recipients, ...recipients],
        });
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        const audience = await screen.findByTestId('contract-request-shared-with');
        expect(audience.querySelectorAll('li')).toHaveLength(2);
        cleanup();
        state.getContract.mockResolvedValue({ ...state.contract, recipients: [] });
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        expect(
            (await screen.findByTestId('contract-request-shared-with')).querySelectorAll('li')
        ).toHaveLength(1);
    });
    it('localizes known fields and categories while retaining custom names', async () => {
        setLocale('es');
        state.getContract.mockResolvedValue({
            ...state.contract,
            contract: {
                read: {
                    personal: { name: true, email: true, image: true },
                    credentials: {
                        categories: { Achievement: {}, ID: {}, 'Custom Partner Category': {} },
                    },
                },
                write: { personal: {}, credentials: { categories: { Achievement: true } } },
            },
        });
        show(<ContractRequest contractUri={state.contract.uri} requestId="req-1" details />);
        await screen.findByTestId('contract-request-shared-with');
        expect(screen.getByText(/Custom Partner Category/)).toHaveTextContent('Logros');
        expect(screen.getByText(/Custom Partner Category/)).not.toHaveTextContent('Achievement');
        expect(screen.getByText(/Custom Partner Category/)).not.toHaveTextContent('image');
    });
    it('fails closed on status read errors and supports retry', async () => {
        state.getStatus.mockRejectedValueOnce(new Error('private technical error'));
        show();
        await screen.findByRole('alert');
        expect(screen.queryByText('Accept & Connect')).toBeNull();
        expect(screen.queryByText('private technical error')).toBeNull();
        expect(screen.queryByText('This invitation is no longer available.')).toBeNull();
        fireEvent.click(screen.getByText('Try Again'));
        expect(await screen.findByText('Accept & Connect')).toBeEnabled();
    });
    it('stops background polling when a pending invitation becomes terminal', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        show();
        await screen.findByText('Accept & Connect');
        state.status.status = 'accepted';
        await vi.advanceTimersByTimeAsync(30_000);
        await screen.findByText('Connected');
        const reads = state.getStatus.mock.calls.length;
        await vi.advanceTimersByTimeAsync(90_000);
        expect(state.getStatus).toHaveBeenCalledTimes(reads);
    });
    it.each(['accepted', 'denied', 'cancelled'])('has no accept action for %s', async status => {
        state.status.status = status;
        show();
        await waitFor(() => expect(state.getContract).toHaveBeenCalled());
        await screen.findByRole('status');
        expect(screen.queryByText('Accept & Connect')).toBeNull();
    });
    it('rejects cancellation on the action-time recheck', async () => {
        show();
        await screen.findByText('Accept & Connect');
        state.status.status = 'cancelled';
        fireEvent.click(screen.getByText('Accept & Connect'));
        await screen.findByRole('alert');
        expect(state.modal).not.toHaveBeenCalled();
    });
    it('marks a pending request seen as the target', async () => {
        state.status.readStatus = 'unseen';
        state.seen.mockImplementation(async () => {
            state.status.readStatus = 'seen';
        });
        show();
        await waitFor(() => expect(state.seen).toHaveBeenCalledWith(state.contract.uri, 'learner'));
    });
    it('suppresses expired and replaced invitations', async () => {
        state.contract.expiresAt = '2020-01-01T00:00:00Z';
        show();
        await screen.findByText('This invitation is no longer available.');
        expect(screen.queryByText('Accept & Connect')).toBeNull();
        cleanup();
        state.contract.expiresAt = '';
        state.getStatus.mockResolvedValue({ ...state.status, requestId: 'req-2' });
        show();
        await screen.findByText('This invitation is no longer available.');
        expect(state.seen).not.toHaveBeenCalled();
    });
    it('uses the existing guardian review flow', async () => {
        state.contract.needsGuardianConsent = true;
        show();
        fireEvent.click(await screen.findByText('Accept & Connect'));
        await waitFor(() => expect(state.modal).toHaveBeenCalled());
        expect(state.modal.mock.calls[0][0].props.contractDetails.needsGuardianConsent).toBe(true);
    });
    it('recovers only generic pending invitations independently of archived alerts', () => {
        state.list = [
            { requestId: 'req-1', status: 'pending', contract: state.contract },
            { status: 'pending', contract: state.contract },
            { requestId: 'req-2', status: 'denied', contract: state.contract },
        ];
        show(<PendingContractRequests />);
        fireEvent.click(screen.getByText('Partner services'));
        expect(state.modal.mock.calls[0][0].props.requestId).toBe('req-1');
    });
    it.each([
        [false, true],
        [true, false],
        [false, false],
    ])('requires both gates: tenant=%s LD=%s', (tenant, flags) => {
        state.tenant = tenant;
        state.flags = flags;
        show(<PendingContractRequests />);
        expect(screen.queryByTestId('pending-contract-requests')).toBeNull();
    });
});
