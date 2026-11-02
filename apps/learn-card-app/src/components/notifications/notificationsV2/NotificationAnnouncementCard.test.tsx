import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import type { NotificationType } from '@learncard/lca-api-plugin';
import { NotificationAnnouncementCard } from './NotificationAnnouncementCard';

vi.mock('./types', () => ({ notificationCardStyles: { shell: '', title: '', body: '' } }));
const mocks = vi.hoisted(() => ({ close: vi.fn(), mark: vi.fn() }));
vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/helpers/pushNotificationHelpers')),
    useMarkNotificationRead: () => ({ mutate: mocks.mark }),
    useModal: () => ({ closeAllModals: mocks.close }),
}));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
it.each([
    ['pilot', '/m/pilot'],
    [undefined, '/notifications'],
])('opens campaign %s and marks the inbox card read once', (campaignId, path) => {
    const history = createMemoryHistory();
    const onRead = vi.fn();
    const notification = {
        type: 'ANNOUNCEMENT',
        read: false,
        data: { metadata: { campaignId } },
        message: { title: 'Welcome', body: 'Learn something new' },
    } as NotificationType;
    render(
        <Router history={history}>
            <NotificationAnnouncementCard notification={notification} />
        </Router>
    );
    expect(screen.getByText('Learn something new')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(history.location.pathname).toBe(path);
    expect(mocks.mark).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mocks.mark).toHaveBeenCalledOnce();
});
