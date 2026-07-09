import React, { useState } from 'react';

import { useModal } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

import NotificationsListView from './NotificationsListView';
import NotificationsSubHeader from './notifications-subheader/NotificationsSubheader';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

/**
 * Desktop right-side modal presentation of the full notifications ("Alerts")
 * list. Mirrors the `/notifications` page content (subheader tabs +
 * {@link NotificationsListView}) but renders inside a `ModalTypes.Right` panel
 * instead of a routed page — matching the "My LearnCard" profile modal pattern
 * (see `useOpenMyLearnCard`). Opened on desktop from the header Alerts button.
 */
const NotificationsModal: React.FC = () => {
    const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
    const [tab, setTab] = useState('active');
    const notificationCount = 0;

    const { closeModal } = useModal();

    return (
        <section className="flex flex-col h-full w-full bg-white">
            <div className="relative shrink-0 bg-white pt-[15px]">
                <button
                    type="button"
                    onClick={() => closeModal()}
                    aria-label="Close alerts"
                    className="absolute right-[15px] top-[15px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full border border-solid border-grayscale-200 text-grayscale-800"
                >
                    <X className="h-[15px] w-[15px]" />
                </button>

                <NotificationsSubHeader
                    isEmptyState={isEmptyState}
                    notificationCount={notificationCount}
                    tab={tab}
                    setTab={setTab}
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
