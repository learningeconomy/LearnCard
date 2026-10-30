// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationType } from '@learncard/lca-api-plugin';
import { NotificationAnnouncementCard } from './NotificationAnnouncementCard';

const mocks = vi.hoisted(() => ({ update: vi.fn(), toast: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useUpdateNotification: () => ({ mutateAsync: mocks.update }),
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error' },
}));
vi.mock('./types', () => ({ notificationCardStyles: { shell: 'notification-shell' } }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('../../../paraglide/runtime.js', () => ({ getLocale: () => 'en' }));
vi.mock('../../../paraglide/messages.js', () => ({
    'alerts.announcement': () => 'Announcement',
    'alerts.newAlert': () => 'New',
    'alerts.markRead': () => 'Mark as read',
    'alerts.markingRead': () => 'Marking as read…',
    'alerts.read': () => 'Read',
    'alerts.archive': () => 'Archive',
    'alerts.archiving': () => 'Archiving…',
    'alerts.restore': () => 'Restore',
    'alerts.restoring': () => 'Restoring…',
    'alerts.updateFailed': () => 'Couldn’t update this alert. Please try again.',
}));

const notification: NotificationType = {
    _id: 'announcement-1',
    type: 'ANNOUNCEMENT',
    from: 'did:web:network.example.com',
    to: { did: 'did:key:recipient' },
    read: false,
    archived: false,
    sent: '2026-10-30T18:00:00Z',
    message: {
        title: 'Your next chapter starts here',
        body: 'Explore a new learning opportunity.\nMake it yours.',
    },
    data: { metadata: { campaignId: 'synthetic-campaign' } },
};
const show = (overrides: Partial<NotificationType> = {}) =>
    render(<NotificationAnnouncementCard notification={{ ...notification, ...overrides }} />);

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(true);
});

describe('announcement notifications', () => {
    it('renders authored copy, unread status and a semantic timestamp without exposing internal identifiers', () => {
        show();
        expect(
            screen.getByRole('article', { name: notification.message!.title })
        ).toBeInTheDocument();
        expect(screen.getByText(/Explore a new learning opportunity/)).toHaveTextContent(
            'Make it yours.'
        );
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(document.querySelector('time')).toHaveAttribute(
            'datetime',
            '2026-10-30T18:00:00.000Z'
        );
        expect(
            screen.queryByText(/did:web|synthetic-campaign|Notification$/)
        ).not.toBeInTheDocument();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('marks read once, shows loading, and updates the unread state after acknowledgment', async () => {
        let finish!: (value: boolean) => void;
        mocks.update.mockImplementation(
            () =>
                new Promise<boolean>(resolve => {
                    finish = resolve;
                })
        );
        show();
        const button = screen.getByRole('button', { name: 'Mark as read' });
        fireEvent.click(button);
        fireEvent.click(button);
        expect(screen.getByRole('button', { name: 'Marking as read…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
        expect(mocks.update).toHaveBeenCalledTimes(1);
        expect(mocks.update).toHaveBeenCalledWith({
            notificationId: 'announcement-1',
            payload: { read: true },
        });
        await act(async () => finish(true));
        expect(screen.queryByText('New')).not.toBeInTheDocument();
        expect(screen.getByText('Read')).toBeInTheDocument();
    });

    it.each([false, true])(
        'uses existing archive/restore metadata when archived=%s',
        async archived => {
            show({ archived, read: true });
            fireEvent.click(screen.getByRole('button', { name: archived ? 'Restore' : 'Archive' }));
            await waitFor(() =>
                expect(mocks.update).toHaveBeenCalledWith({
                    notificationId: 'announcement-1',
                    payload: { read: true, archived: !archived },
                })
            );
        }
    );

    it.each(['reject', 'false'])(
        'keeps failures retryable without exposing raw errors (%s)',
        async failure => {
            if (failure === 'reject')
                mocks.update.mockRejectedValueOnce(new Error('private server detail'));
            else mocks.update.mockResolvedValueOnce(false);
            show();
            fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
            await waitFor(() =>
                expect(mocks.toast).toHaveBeenCalledWith(
                    'Couldn’t update this alert. Please try again.',
                    { type: 'error', hasDismissButton: true }
                )
            );
            expect(screen.getByText('New')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Mark as read' })).toBeEnabled();
            fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
            await waitFor(() => expect(screen.getByText('Read')).toBeInTheDocument());
        }
    );

    it('handles legacy missing fields and renders markup as plain text', () => {
        show({
            _id: undefined,
            message: { body: '<img src=x onerror=alert(1)>' },
            sent: 'invalid',
        });
        expect(screen.getByRole('heading', { name: 'Announcement' })).toBeInTheDocument();
        expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
        expect(document.querySelector('img')).toBeNull();
        expect(document.querySelector('time')).toBeNull();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
