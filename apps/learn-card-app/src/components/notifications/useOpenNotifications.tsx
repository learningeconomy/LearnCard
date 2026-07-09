import React from 'react';

import { useModal, ModalTypes } from 'learn-card-base';

import NotificationsModal from './NotificationsModal';

/**
 * Opens the notifications ("Alerts") list in a right-loading modal on both
 * desktop and mobile (matching the "My LearnCard" profile modal pattern — see
 * `useOpenMyLearnCard`). Using a single presentation on every breakpoint keeps
 * the logic straightforward and avoids the desktop/mobile split where a
 * notification action (e.g. claiming a boost) would reroute the page behind the
 * modal.
 *
 * The full-page `/notifications` route still exists for deep links and push
 * notifications.
 */
export const useOpenNotifications = () => {
    const { newModal: openNotificationsModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    return () => openNotificationsModal(<NotificationsModal />);
};

export default useOpenNotifications;
