import React from 'react';
import { cleanup, fireEvent, render as renderReact, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalsProvider } from 'learn-card-base/components/modals/ModalsContext';
import Modals from 'learn-card-base/components/modals/Modals';
import { useModal } from 'learn-card-base/components/modals/useModal';
import { ModalTypes } from 'learn-card-base/components/modals/types/Modals';
import { ModalAccessibilityManager } from 'learn-card-base/components/modals/ModalAccessibilityManager';
import { TenantConfigProvider } from 'learn-card-base/config/TenantConfigProvider';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
import type { NotificationType } from '@learncard/lca-api-plugin';
import NotificationContractUpdateCard from './NotificationContractUpdateCard';
import { setLocale } from '../../../paraglide/runtime.js';
const state = vi.hoisted(() => ({
    push: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    error: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: state.push }) }));
vi.mock('learn-card-base', async () => ({
    getLogger: () => ({ error: state.error }),
    useModal: (await import('learn-card-base/components/modals/useModal')).useModal,
    useUpdateNotification: () => ({ mutateAsync: state.update }),
}));
vi.mock('./types', () => ({ notificationCardStyles: { shell: '' } }));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
beforeEach(() => {
    vi.clearAllMocks();
    setLocale('en', { reload: false });
});
afterEach(() => {
    cleanup();
    document.getElementById('app-router')?.remove();
    document.getElementById('modal-mid-root')?.remove();
});

const OpenAlerts = ({ children }: { children: React.ReactNode }) => {
    const { newModal } = useModal();
    return (
        <button
            onClick={() => {
                newModal(<section aria-label="Underlying modal">Underlying</section>);
                newModal(
                    <section aria-label="Alerts">{children}</section>,
                    {},
                    {
                        desktop: ModalTypes.Right,
                        mobile: ModalTypes.Right,
                    }
                );
            }}
        >
            Open Alerts
        </button>
    );
};

const showAlerts = async (notification: React.ReactNode) => {
    const root = document.createElement('div');
    root.id = 'app-router';
    document.body.append(root);
    const portal = document.createElement('div');
    portal.id = 'modal-mid-root';
    document.body.append(portal);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    renderReact(
        <QueryClientProvider client={client}>
            <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
                <ModalsProvider>
                    <OpenAlerts>{notification}</OpenAlerts>
                    <Modals />
                    <ModalAccessibilityManager />
                </ModalsProvider>
            </TenantConfigProvider>
        </QueryClientProvider>,
        { container: root }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open Alerts' }));
    await screen.findByRole('region', { name: 'Alerts' });
};

const notification = {
    _id: 'notification-1',
    sent: '2026-10-01T00:00:00.000Z',
    read: false,
    data: { contractUri: 'https://example.test/contract' },
} as unknown as NotificationType;
describe('NotificationContractUpdateCard', () => {
    it('closes Alerts and navigates without waiting for the read-status request', async () => {
        let resolveUpdate!: () => void;
        state.update.mockReturnValueOnce(new Promise<void>(resolve => (resolveUpdate = resolve)));
        await showAlerts(<NotificationContractUpdateCard notification={notification} />);

        fireEvent.click(screen.getByRole('button', { name: 'Review this update' }));

        expect(state.push).toHaveBeenCalledWith(
            '/consent-flow/review?uri=https%3A%2F%2Fexample.test%2Fcontract'
        );
        expect(state.update).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(screen.queryByRole('region', { name: 'Alerts' })).toBeNull();
            expect(screen.queryByRole('region', { name: 'Underlying modal' })).toBeNull();
        });
        resolveUpdate();
    });

    it('opens review even when marking the notification read fails', async () => {
        state.update.mockRejectedValueOnce(new Error('offline'));
        await showAlerts(<NotificationContractUpdateCard notification={notification} />);

        fireEvent.click(screen.getByRole('button', { name: 'Review this update' }));

        expect(state.push).toHaveBeenCalledWith(
            '/consent-flow/review?uri=https%3A%2F%2Fexample.test%2Fcontract'
        );
        await waitFor(() => expect(state.error).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByRole('region', { name: 'Alerts' })).toBeNull());
    });

    it('shows an accessible dismiss button and does not navigate when it is clicked', async () => {
        await showAlerts(
            <NotificationContractUpdateCard
                notification={notification}
                handleArchive={state.archive}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(state.archive).toHaveBeenCalledOnce();
        expect(state.push).not.toHaveBeenCalled();
        expect(screen.getByRole('region', { name: 'Alerts' })).toBeVisible();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled());
    });

    it('shows a dismiss failure and allows another attempt', async () => {
        state.archive.mockRejectedValueOnce(new Error('offline'));
        await showAlerts(
            <NotificationContractUpdateCard
                notification={notification}
                handleArchive={state.archive}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(await screen.findByRole('alert')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled();
    });

    it('renders a locally generated headline instead of the stored English preview', async () => {
        setLocale('fr', { reload: false });
        await showAlerts(
            <NotificationContractUpdateCard
                notification={
                    {
                        ...notification,
                        data: {
                            contractUri: 'https://example.test/contract',
                            contractName: 'Acme',
                            kind: 'requires_consent',
                            diff: { added: [], removed: [], changed: [] },
                            preview: { headline: 'Stale English headline' },
                        },
                    } as unknown as NotificationType
                }
            />
        );

        expect(screen.getByText(/Acme a modifié sa demande/)).toBeVisible();
        expect(screen.queryByText(/Stale English headline/)).toBeNull();
    });

    it('does not describe a relaxed update as asking for less without a removal', async () => {
        await showAlerts(
            <NotificationContractUpdateCard
                notification={
                    {
                        ...notification,
                        data: {
                            contractUri: 'https://example.test/contract',
                            contractName: 'Acme',
                            kind: 'relaxed',
                            diff: { added: [], removed: [], changed: [] },
                            preview: { headline: 'Stale no-removal headline' },
                        },
                    } as unknown as NotificationType
                }
            />
        );

        expect(screen.getByText(/Acme changed its request/)).toBeVisible();
        expect(screen.queryByText(/stopped asking/)).toBeNull();
    });
});
