import React from 'react';

import Search from 'learn-card-base/svgs/Search';
import Settings from 'learn-card-base/svgs/Settings';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

export const NotificationsSubHeader: React.FC<{ notificationCount: number }> = ({
    notificationCount,
}) => {
    return (
        <AppGrid className="w-full flex items-center justify-center px-3">
            <AppRow className="w-full max-w-[600px]">
                <AppCol size="6" className="flex justify-start items-center">
                    <h2 className="text-grayscale-900 font-medium text-2xl tracking-[0.01rem]">
                        Notifications
                    </h2>
                </AppCol>
                {/* <AppCol size="6" className="flex justify-end items-center">
                <button
                    type="button"
                    className="flex justify-center items-center rounded-full text-grayscale-900 bg-grayscale-100 h-11 w-11 mr-1"
                >
                    <Search className="h-6 w-auto" />
                </button>
                <button
                    type="button"
                    className="flex justify-center items-center rounded-full text-grayscale-900 bg-grayscale-100 h-11 w-11"
                >
                    <Settings className="h-6 w-auto" />
                </button>
            </AppCol> */}
                <AppCol size="12">
                    <p className="font-light text-grayscale-600">
                        All Notifications &bull;{' '}
                        <span className="text-indigo-600 text-sm font-bold">
                            {notificationCount} Unclaimed
                        </span>
                    </p>
                </AppCol>
            </AppRow>
        </AppGrid>
    );
};

export default NotificationsSubHeader;
