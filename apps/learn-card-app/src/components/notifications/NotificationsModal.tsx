import React, { useState } from 'react';

import { useModal } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

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
            <div className="relative shrink-0 bg-white pt-[15px]">
                {/* Desktop close affordance. On mobile the subheader's back
                    arrow (wired to closeModal via onBack) handles dismissal. */}
                <button
                    type="button"
                    onClick={() => closeModal()}
                    aria-label="Close alerts"
                    className="absolute right-[15px] top-[15px] z-10 hidden h-[32px] w-[32px] items-center justify-center rounded-full border border-solid border-grayscale-200 text-grayscale-800 desktop:flex"
                >
                    <X className="h-[15px] w-[15px]" />
                </button>

                <NotificationsSubHeader
                    isEmptyState={isEmptyState}
                    notificationCount={notificationCount}
                    tab={tab}
                    setTab={setTab}
                    onBack={() => closeModal()}
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
