import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    resolveNotificationRoute,
    useModal,
    useMarkNotificationRead,
    getLogger,
} from 'learn-card-base';
import type { NotificationType } from '@learncard/lca-api-plugin';
import * as m from '../../../paraglide/messages.js';
import { notificationCardStyles } from './types';

export const NotificationAnnouncementCard: React.FC<{
    notification: NotificationType;
    className?: string;
}> = ({ notification, className }) => {
    const history = useHistory();
    const { mutate: markRead } = useMarkNotificationRead();
    const { closeAllModals } = useModal();
    const [read, setRead] = useState(notification.read);
    const destination = resolveNotificationRoute(notification);
    const open = (): void => {
        if (!read && notification._id) {
            setRead(true);
            markRead(
                { notificationId: notification._id },
                { onError: () => getLogger('campaigns').warn('Campaign notification read failed') }
            );
        }
        closeAllModals();
        history.push(destination);
    };
    return (
        <div className={`${notificationCardStyles.shell} font-poppins gap-3 ${className ?? ''}`}>
            {!read && <div className="notification-count-mobile unread-indicator-dot" />}
            <div className="flex-1 min-w-0 text-left">
                {notification.message?.title && (
                    <h4 className={notificationCardStyles.title}>{notification.message.title}</h4>
                )}
                {notification.message?.body && (
                    <p className={notificationCardStyles.body}>{notification.message.body}</p>
                )}
            </div>
            {destination.startsWith('/m/') && (
                <button
                    type="button"
                    onClick={open}
                    className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90"
                >
                    {m['notifications.viewCampaign']()}
                </button>
            )}
        </div>
    );
};
