import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import NotificationIcon from 'learn-card-base/svgs/NotificationIcon';
import NotificationIcon2 from 'learn-card-base/svgs/NotificationIcon2';
import { useGetUnreadUserNotifications } from 'learn-card-base';
import { getNotificationButtonColor } from 'learn-card-base/helpers/colorHelpers';

type NotificationButtonProps = {
    colorOverride?: string;
    /**
     * Which notification glyph to render. `'bell'` (default) keeps the legacy
     * bell; `'alerts'` uses the megaphone "Alerts" icon to match the LC-1921
     * header design.
     */
    iconVariant?: 'bell' | 'alerts';
    /**
     * Optional click handler override. When provided it is called instead of
     * navigating to `/notifications` — lets app-layer callers open the
     * right-side notifications modal (on both desktop and mobile) while keeping
     * this base component free of app dependencies.
     */
    onOpen?: () => void;
};

const NotificationButton: React.FC<NotificationButtonProps> = ({
    colorOverride,
    iconVariant = 'bell',
    onOpen,
}) => {
    const history = useHistory();
    const location = useLocation();
    const { data, isLoading: notificationsLoading, refetch } = useGetUnreadUserNotifications();
    const color = colorOverride ?? getNotificationButtonColor(location.pathname);

    const unreadCount =
        data?.notifications && data?.notifications?.length > 0 ? data?.notifications?.length : null;

    const Icon = iconVariant === 'alerts' ? NotificationIcon2 : NotificationIcon;

    return (
        <button
            className={`${color} main-header-notifications-btn relative`}
            onClick={() => (onOpen ? onOpen() : history.push('/notifications'))}
        >
            {unreadCount && <div className={`alert-indicator-dot ${color}`}>{unreadCount}</div>}
            <Icon className={`${color}`} />
        </button>
    );
};

export default NotificationButton;
