import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base/constants/aiPassport';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import ConsentFlowSyncCard from './ConsentFlowSyncCard';
const state = vi.hoisted(() => ({
    search: '',
    consent: vi.fn(),
    toast: vi.fn(),
    close: vi.fn(),
    push: vi.fn(),
    initWallet: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: {},
    ModalTypes: {},
    ToastTypeEnum: { Error: 'error' },
    useConsentToContract: () => ({ mutateAsync: state.consent }),
    useContract: () => ({ data: undefined }),
    useCurrentUser: () => ({}),
    useModal: () => ({ closeAllModals: state.close }),
    useToast: () => ({ presentToast: state.toast }),
    useWallet: () => ({ initWallet: state.initWallet }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
}));
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ search: state.search }),
    useHistory: () => ({ push: state.push }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'Test' }),
}));
vi.mock('../../helpers/contract.helpers', () => ({ getMinimumTermsForContract: () => ({}) }));
vi.mock('../../theme/hooks/useTheme', () => ({ default: () => ({ colors: {} }) }));
vi.mock('../../components/new-my-data/NewMyData', () => ({ default: () => null }));
vi.mock('../launchPad/ConsentFlowEditAccess', () => ({ default: () => null }));
vi.mock('../../paraglide/messages.js', () => ({
    'common.cancel': () => 'Cancel',
    'consentFlow.allow': () => 'Allow',
    'consentFlow.allowing': () => 'Allowing',
    'consentFlow.editAccess': () => 'Edit',
    'consentFlow.aiPassportReauthenticationRequired': () =>
        'Go back to AI Passport and sign in again.',
}));
const contract = {
    uri: LEARNCARD_AI_PASSPORT_CONTRACT_URI,
    contract: {},
    owner: { did: 'did:key:owner' },
    name: 'AI',
} as unknown as ConsentFlowContractDetails;
beforeEach(() => {
    vi.clearAllMocks();
    state.search = '';
    state.consent.mockResolvedValue({});
    networkStore.set.aiServiceUrl('https://api.example.test');
});
afterEach(cleanup);
it('rejects a known query callback before saving consent and keeps recovery visible', async () => {
    state.search = '?returnTo=https%3A%2F%2Fapi.example.test%2Fcallback';
    render(<ConsentFlowSyncCard contractDetails={contract} />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() =>
        expect(state.toast).toHaveBeenCalledWith(
            expect.stringMatching(/Go back to AI Passport.*sign in again/),
            expect.objectContaining({ type: 'error' })
        )
    );
    expect(state.consent).not.toHaveBeenCalled();
    expect(state.close).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
});
it('rejects an unexpected server callback without closing the review', async () => {
    state.consent.mockResolvedValue({ redirectUrl: 'https://api.example.test/callback' });
    render(<ConsentFlowSyncCard contractDetails={contract} />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(state.toast).toHaveBeenCalledOnce());
    expect(state.consent).toHaveBeenCalledOnce();
    expect(state.close).not.toHaveBeenCalled();
});
it('allows local navigation for the AI Passport contract', async () => {
    state.search = '?returnTo=%2Fai%2Fsessions';
    render(
        <ConsentFlowSyncCard
            contractDetails={{ ...contract, redirectUrl: 'https://api.example.test/callback' }}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(state.push).toHaveBeenCalledWith('/ai/sessions'));
    expect(state.toast).not.toHaveBeenCalled();
});

it('ignores the stored callback when falling back to launchpad', async () => {
    render(
        <ConsentFlowSyncCard
            contractDetails={{ ...contract, redirectUrl: 'https://api.example.test/callback' }}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() =>
        expect(state.push).toHaveBeenCalledWith(expect.stringContaining('/launchpad?uri='))
    );
    expect(state.consent).toHaveBeenCalledOnce();
    expect(state.toast).not.toHaveBeenCalled();
});

describe('challenged callback on the contract redirect origin', () => {
    const taylorBot = 'https://taylorbot.example.test';
    const taylorBotContract = {
        ...contract,
        uri: 'lc:network:example.test:contract:taylorbot',
        redirectUrl: `${taylorBot}/auth/callback`,
    } as ConsentFlowContractDetails;
    const search = (domain: string) =>
        `?${new URLSearchParams({
            uri: taylorBotContract.uri,
            returnTo: `${taylorBot}/auth/callback?challenge=backend-challenge&response_mode=fragment`,
            challenge: 'backend-challenge',
            domain,
        })}`;

    it('saves consent and signs for the contract redirect origin', async () => {
        state.search = search(taylorBot);
        // Stop before navigation; the proof request is what matters here.
        const issuePresentation = vi.fn().mockRejectedValue(new Error('stop'));
        state.initWallet.mockResolvedValue({
            id: { did: () => 'did:key:holder' },
            invoke: { issuePresentation },
        });
        render(<ConsentFlowSyncCard contractDetails={taylorBotContract} />);
        fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
        await waitFor(() => expect(issuePresentation).toHaveBeenCalledOnce());
        expect(issuePresentation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ challenge: 'backend-challenge', domain: taylorBot })
        );
        expect(state.consent).toHaveBeenCalledOnce();
    });

    it.each([
        ['a mismatched domain', search('https://attacker.example'), taylorBotContract],
        [
            'no contract redirect',
            search(taylorBot),
            { ...taylorBotContract, redirectUrl: undefined },
        ],
    ])('rejects %s before saving consent', async (_case, query, details) => {
        state.search = query;
        render(<ConsentFlowSyncCard contractDetails={details as ConsentFlowContractDetails} />);
        fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
        await waitFor(() => expect(state.toast).toHaveBeenCalledOnce());
        expect(state.consent).not.toHaveBeenCalled();
        expect(state.initWallet).not.toHaveBeenCalled();
    });
});
