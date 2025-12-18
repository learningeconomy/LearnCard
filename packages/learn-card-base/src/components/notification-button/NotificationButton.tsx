import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import NotificationIcon from 'learn-card-base/svgs/NotificationIcon';
import { useGetUnreadUserNotifications } from 'learn-card-base';
import { getNotificationButtonColor } from 'learn-card-base/helpers/colorHelpers';

const NotificationButton: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const { data, isLoading: notificationsLoading, refetch } = useGetUnreadUserNotifications();
    const color = getNotificationButtonColor(location.pathname);

    const unreadCount =
        data?.notifications && data?.notifications?.length > 0 ? data?.notifications?.length : null;

    return (
        <button
            className={`${color} main-header-notifications-btn relative`}
            onClick={() => history.push('/notifications')}
        >
            {unreadCount && <div className={`alert-indicator-dot ${color}`}>{unreadCount}</div>}
            <NotificationIcon className={`${color}`} />
        </button>
    );
};

export default NotificationButton;
