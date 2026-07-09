import React from 'react';
import { useHistory } from 'react-router-dom';

import { useModal, ModalTypes } from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';

import NotificationsModal from './NotificationsModal';

/**
 * Opens the notifications ("Alerts") list. On desktop it slides in as a
 * right-loading modal beside the nav (matching the "My LearnCard" profile modal
 * pattern — see `useOpenMyLearnCard`); on mobile it keeps navigating to the
 * full-page `/notifications` route.
 *
 * Shared by the header Alerts button (ProfileAlertsIsland) so every desktop
 * entry point presents the same modal.
 */
export const useOpenNotifications = () => {
    const history = useHistory();
    const { isMobile } = useDeviceTypeByWidth();
    const { newModal: openNotificationsModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    return () => {
        if (isMobile) {
            history.push('/notifications');
            return;
        }

        openNotificationsModal(<NotificationsModal />);
    };
};

export default useOpenNotifications;
