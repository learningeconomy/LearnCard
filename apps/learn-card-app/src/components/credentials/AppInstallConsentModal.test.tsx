import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppInstallConsentModal } from './AppInstallConsentModal';

const state = vi.hoisted(() => ({
    consent: vi.fn(),
    fetchContract: vi.fn(),
    toast: vi.fn(),
    accept: vi.fn(),
    enqueue: vi.fn(),
    user: { profileId: 'synthetic-learner' },
}));
vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/helpers/consentErrors')),
    useWallet: () => ({
        initWallet: async () => ({ invoke: { getContract: state.fetchContract } }),
    }),
    useCurrentUser: () => state.user,
    useConsentToContract: () => ({ mutateAsync: state.consent }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useToast: () => ({ presentToast: state.toast }),
    useModal: () => ({ newModal: vi.fn() }),
    getLogger: () => ({ error: vi.fn() }),
    contractCategoryNameToCategoryMetadata: {},
    ModalTypes: { Right: 'right' },
    ToastTypeEnum: { Error: 'error' },
    enqueuePendingContractSync: state.enqueue,
}));
vi.mock('@analytics', () => ({ AnalyticsEvents: {}, useAnalytics: () => ({ track: vi.fn() }) }));
vi.mock('../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({ guardedAction: async (action: () => unknown) => action() }),
}));
vi.mock('../../helpers/contract.helpers', () => ({
    getMinimumTermsForContract: () => ({
        read: { personal: {}, credentials: { categories: {} } },
        write: { personal: {}, credentials: { categories: {} } },
    }),
}));
vi.mock('../../pages/consentFlow/ConsentFlowPrivacyAndData', () => ({ default: () => null }));
vi.mock('../../i18n/TransP', () => ({ default: () => <span>Install synthetic app</span> }));
vi.mock('../../i18n/categoryTitle', () => ({ localizeCategoryTitle: (title: string) => title }));
let client: QueryClient;
beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    state.fetchContract.mockResolvedValue({
        uri: 'lc:synthetic',
        owner: { did: 'did:example:owner' },
        contract: {},
    });
});
afterEach(() => {
    cleanup();
    client.clear();
});
const show = () =>
    render(
        <QueryClientProvider client={client}>
            <AppInstallConsentModal
                appName="Synthetic app"
                permissions={[]}
                contractUri="lc:synthetic"
                onAccept={state.accept}
                onReject={vi.fn()}
            />
        </QueryClientProvider>
    );
it('does not install or enqueue a sync after an audience conflict and refreshes the review', async () => {
    state.consent.mockRejectedValueOnce(
        Object.assign(new Error('Sharing audience changed'), { data: { code: 'CONFLICT' } })
    );
    show();
    await waitFor(() =>
        expect(
            (screen.getByRole('button', { name: 'Install' }) as HTMLButtonElement).disabled
        ).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    await waitFor(() => expect(state.toast).toHaveBeenCalledOnce());
    expect(state.fetchContract).toHaveBeenCalledTimes(2);
    expect(state.accept).not.toHaveBeenCalled();
    expect(state.enqueue).not.toHaveBeenCalled();
});
it('preserves installation for an explicit existing consent', async () => {
    state.consent.mockRejectedValueOnce(
        Object.assign(new Error("You've already consented to this contract!"), {
            data: { code: 'CONFLICT' },
        })
    );
    show();
    await waitFor(() =>
        expect(
            (screen.getByRole('button', { name: 'Install' }) as HTMLButtonElement).disabled
        ).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    await waitFor(() => expect(state.accept).toHaveBeenCalledOnce());
});
