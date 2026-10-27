import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: state.error }),
    useUpdateNotification: () => ({ mutateAsync: state.update }),
}));
vi.mock('./types', () => ({ notificationCardStyles: { shell: '' } }));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
beforeEach(() => {
    vi.clearAllMocks();
    setLocale('en', { reload: false });
});

const notification = {
    _id: 'notification-1',
    sent: '2026-10-01T00:00:00.000Z',
    read: false,
    data: { contractUri: 'https://example.test/contract' },
} as unknown as NotificationType;

describe('NotificationContractUpdateCard', () => {
    it('opens review even when marking the notification read fails', async () => {
        state.update.mockRejectedValueOnce(new Error('offline'));
        render(<NotificationContractUpdateCard notification={notification} />);

        fireEvent.click(screen.getByRole('button', { name: 'Review this update' }));

        expect(state.push).toHaveBeenCalledWith(
            '/consent-flow/review?uri=https%3A%2F%2Fexample.test%2Fcontract'
        );
        await waitFor(() => expect(state.error).toHaveBeenCalled());
    });

    it('shows an accessible dismiss button and does not navigate when it is clicked', async () => {
        render(
            <NotificationContractUpdateCard
                notification={notification}
                handleArchive={state.archive}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(state.archive).toHaveBeenCalledOnce();
        expect(state.push).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled());
    });

    it('shows a dismiss failure and allows another attempt', async () => {
        state.archive.mockRejectedValueOnce(new Error('offline'));
        render(
            <NotificationContractUpdateCard
                notification={notification}
                handleArchive={state.archive}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(await screen.findByRole('alert')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled();
    });

    it('renders a locally generated headline instead of the stored English preview', () => {
        setLocale('fr', { reload: false });
        render(
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

    it('does not describe a relaxed update as asking for less without a removal', () => {
        render(
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
