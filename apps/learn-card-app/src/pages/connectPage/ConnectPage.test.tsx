import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConnectPage from './ConnectPage';

const mocks = vi.hoisted(() => ({
    authSettled: false,
    isLoggedIn: false,
    initWallet: vi.fn(),
    walletGetProfile: vi.fn(),
    anonymousGetProfile: vi.fn(),
}));

vi.mock('react-router', () => ({
    useParams: () => ({ profileId: 'ai-passport' }),
    useNavigate: () => vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ info: vi.fn() }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
    usePathQuery: () => new URLSearchParams(),
    useIsLoggedIn: () => mocks.isLoggedIn,
}));
vi.mock('learn-card-base/helpers/anonymousNetworkClient', () => ({
    getAnonymousNetworkClient: () => ({
        profile: { getOtherProfile: { query: mocks.anonymousGetProfile } },
    }),
}));
vi.mock('../../providers/useAuthSettled', () => ({ useAuthSettled: () => mocks.authSettled }));
vi.mock('../../components/main-header/MainHeader', () => ({ default: () => null }));
vi.mock('learn-card-base/ui/chrome', () => ({
    AppPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    AppContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base/ui/feedback/AppSpinner', () => ({ AppSpinner: () => null }));
vi.mock('../addressBook/addContactView/AddContactView', () => ({
    AddContactViewMode: { requestConnection: 'requestConnection' },
    default: ({
        user,
        actionsPending,
    }: {
        user: { displayName: string };
        actionsPending: boolean;
    }) => (
        <div>
            <p>{user.displayName}</p>
            <p>{actionsPending ? 'actions pending' : 'actions ready'}</p>
        </div>
    ),
}));

const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
        <QueryClientProvider client={client}>
            <ConnectPage />
        </QueryClientProvider>
    );
    return {
        ...view,
        rerenderPage: () =>
            view.rerender(
                <QueryClientProvider client={client}>
                    <ConnectPage />
                </QueryClientProvider>
            ),
    };
};

describe('ConnectPage before sign-in settles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.authSettled = false;
        mocks.isLoggedIn = false;
        mocks.anonymousGetProfile.mockResolvedValue({
            profileId: 'ai-passport',
            displayName: 'AI Passport',
        });
        mocks.walletGetProfile.mockResolvedValue({
            profileId: 'ai-passport',
            displayName: 'AI Passport (signed in)',
        });
        mocks.initWallet.mockResolvedValue({ invoke: { getProfile: mocks.walletGetProfile } });
    });

    it('shows the public profile without a wallet and holds the actions', async () => {
        renderPage();

        expect(await screen.findByText('AI Passport')).toBeTruthy();
        expect(screen.getByText('actions pending')).toBeTruthy();
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it('re-reads the profile through the wallet once a signed-in user is known', async () => {
        const { rerenderPage } = renderPage();
        await screen.findByText('AI Passport');

        mocks.authSettled = true;
        mocks.isLoggedIn = true;
        rerenderPage();

        expect(await screen.findByText('AI Passport (signed in)')).toBeTruthy();
        expect(screen.getByText('actions ready')).toBeTruthy();
        expect(mocks.walletGetProfile).toHaveBeenCalledWith('ai-passport');
    });

    it('never builds a wallet for a signed-out visitor', async () => {
        const { rerenderPage } = renderPage();
        await screen.findByText('AI Passport');

        mocks.authSettled = true;
        rerenderPage();

        await waitFor(() => expect(screen.getByText('actions ready')).toBeTruthy());
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it('keeps loading instead of showing "not found" until sign-in settles', async () => {
        mocks.anonymousGetProfile.mockResolvedValue({});
        renderPage();

        await waitFor(() => expect(mocks.anonymousGetProfile).toHaveBeenCalled());
        expect(screen.queryByText('Unable to find user')).toBeNull();
    });
});
