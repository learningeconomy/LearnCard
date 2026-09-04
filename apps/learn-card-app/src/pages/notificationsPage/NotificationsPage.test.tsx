// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const walletHost = vi.hoisted(() => ({
    wallet: {
        id: { did: () => 'did:example:account-a' },
        index: { LearnCloud: { get: vi.fn() } },
        read: { get: vi.fn() },
    },
}));

const refreshHost = vi.hoisted(() => ({ forceRefresh: vi.fn() }));
const locateHost = vi.hoisted(() => ({ locate: vi.fn() }));
const loggerHost = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    IonContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    IonCol: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: loggerHost.error }),
    useWallet: () => ({ initWallet: async () => walletHost.wallet }),
}));

vi.mock('../../components/main-header/MainHeader', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/notifications/NotificationsListView', () => ({
    default: () => <div data-testid="notifications-list">Notifications</div>,
}));
vi.mock('../../components/notifications/notifications-subheader/NotificationsSubheader', () => ({
    default: () => null,
}));
vi.mock('../../components/generic/GenericErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../hooks/useHeaderScrollSync', () => ({ default: () => vi.fn() }));
vi.mock('../../components/credential-refresh-listener/CredentialRefreshListener', () => ({
    useForceRefreshLearnCloudCredential: () => ({ forceRefresh: refreshHost.forceRefresh }),
}));
vi.mock(
    '../../components/notifications/notificationsV2/NotificationCredentialRefreshedCard',
    () => ({ locateCredentialRefreshRecord: locateHost.locate })
);

import NotificationsPage from './NotificationsPage';

const LocationProbe = () => {
    const location = useLocation();

    return <div data-testid="location-search">{location.search}</div>;
};

describe('NotificationsPage credential refresh deep link', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        locateHost.locate.mockResolvedValue({ id: 'record-1', uri: 'lc:cloud:current' });
        refreshHost.forceRefresh.mockResolvedValue({ status: 'unchanged' });
    });

    afterEach(() => cleanup());

    it('consumes the refresh query and force-refreshes its matching record once', async () => {
        render(
            <MemoryRouter
                initialEntries={['/notifications?refreshId=refresh-123&refresh=true&source=push']}
            >
                <NotificationsPage />
                <LocationProbe />
            </MemoryRouter>
        );

        expect(screen.getByTestId('notifications-list')).toBeInTheDocument();

        await waitFor(() => expect(refreshHost.forceRefresh).toHaveBeenCalledTimes(1));

        const record = { id: 'record-1', uri: 'lc:cloud:current' };
        expect(locateHost.locate).toHaveBeenCalledWith(walletHost.wallet, 'refresh-123');
        expect(refreshHost.forceRefresh).toHaveBeenCalledWith(record, walletHost.wallet);
        expect(screen.getByTestId('location-search')).toHaveTextContent('?source=push');

        await new Promise(resolve => setTimeout(resolve, 0));
        expect(refreshHost.forceRefresh).toHaveBeenCalledTimes(1);
    });

    it('keeps rendering and consumes the query when targeted refresh setup fails', async () => {
        locateHost.locate.mockRejectedValue(new Error('wallet unavailable'));

        render(
            <MemoryRouter initialEntries={['/notifications?refreshId=refresh-123&refresh=true']}>
                <NotificationsPage />
                <LocationProbe />
            </MemoryRouter>
        );

        expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
        await waitFor(() =>
            expect(loggerHost.error).toHaveBeenCalledWith(
                'refresh.deep-link.failed',
                expect.any(Error)
            )
        );

        expect(refreshHost.forceRefresh).not.toHaveBeenCalled();
        expect(screen.getByTestId('location-search')).toHaveTextContent('');
    });
});
