import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import type { NotificationType } from '@learncard/lca-api-plugin';
import NotificationToastListener from './NotificationToastListener';

const state = vi.hoisted(() => ({
    data: { notifications: [] as NotificationType[] },
    present: vi.fn(),
    dismiss: vi.fn(),
    mark: vi.fn(),
    open: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/helpers/pushNotificationHelpers')),
    useGetUnreadUserNotifications: () => ({ data: state.data }),
    useIsLoggedIn: () => true,
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    useToast: () => ({ presentToast: state.present, dismissToast: state.dismiss }),
    useMarkNotificationRead: () => ({ mutate: state.mark }),
    PushNotificationToast: ({ title, onClick }: { title: string; onClick: () => void }) => (
        <button onClick={onClick}>{title}</button>
    ),
}));
vi.mock('../notifications/useOpenNotifications', () => ({ default: () => state.open }));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
it.each(['pilot', undefined])(
    'opens the campaign or inbox from a foreground toast (%s)',
    campaignId => {
        const history = createMemoryHistory();
        state.data = { notifications: [] };
        const view = render(
            <Router history={history}>
                <NotificationToastListener />
            </Router>
        );
        expect(state.present).not.toHaveBeenCalled();
        state.data = {
            notifications: [
                {
                    _id: 'new',
                    type: 'ANNOUNCEMENT',
                    data: { metadata: { campaignId } },
                    message: { title: 'Campaign' },
                } as NotificationType,
            ],
        };
        view.rerender(
            <Router history={history}>
                <NotificationToastListener />
            </Router>
        );
        expect(state.present).toHaveBeenCalledOnce();
        render(state.present.mock.calls[0][0]);
        fireEvent.click(screen.getByRole('button', { name: 'Campaign' }));
        expect(history.location.pathname).toBe(campaignId ? '/m/pilot' : '/');
        expect(state.mark).toHaveBeenCalledWith({ notificationId: 'new' });
        expect(state.open).toHaveBeenCalledTimes(campaignId ? 0 : 1);
    }
);
