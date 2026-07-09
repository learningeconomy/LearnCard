import React, { useState } from 'react';

import { useModal } from 'learn-card-base';

import NotificationsListView from './NotificationsListView';
import NotificationsSubHeader from './notifications-subheader/NotificationsSubheader';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

/**
 * Right-side modal presentation of the full notifications ("Alerts") list.
 * Mirrors the `/notifications` page content (subheader tabs +
 * {@link NotificationsListView}) but renders inside a `ModalTypes.Right` panel
 * instead of a routed page — matching the "My LearnCard" profile modal pattern
 * (see `useOpenMyLearnCard`). Opened from the header Alerts button on both
 * desktop and mobile.
 */
const NotificationsModal: React.FC = () => {
    const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
    const [tab, setTab] = useState('active');
    const notificationCount = 0;

    const { closeModal } = useModal();

    return (
        <section className="flex flex-col h-full w-full bg-white">
            {/* The subheader's back arrow (shown on every breakpoint via
                showBackButton, wired to closeModal via onBack) is the close
                control. It sits on the left, clear of the "Archive All" button. */}
            <div className="shrink-0 bg-white pt-[15px]">
                <NotificationsSubHeader
                    isEmptyState={isEmptyState}
                    notificationCount={notificationCount}
                    tab={tab}
                    setTab={setTab}
                    onBack={() => closeModal()}
                    showBackButton
                />
            </div>

            <GenericErrorBoundary>
                <div className="flex-1 overflow-y-auto bg-white px-[20px]">
                    <NotificationsListView
                        isEmptyState={isEmptyState}
                        setIsEmptyState={setIsEmptyState}
                        tab={tab}
                    />
                </div>
            </GenericErrorBoundary>
        </section>
    );
};

export default NotificationsModal;
