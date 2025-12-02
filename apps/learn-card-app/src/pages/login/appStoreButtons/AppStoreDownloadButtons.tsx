import React from 'react';
import { Capacitor } from '@capacitor/core';

import AppleStoreIcon from 'learn-card-base/svgs/AppleStoreIcon';
import PlayStoreIcon from 'learn-card-base/svgs/PlayStoreIcon';

export const AppStoreDownloadButtons: React.FC = () => {
    if (Capacitor?.isNativePlatform()) return <></>;

    return (
        <div className="flex items-center justify-center pb-[20px] gap-[15px]">
            <a
                href="https://apps.apple.com/us/app/learncard/id1635841898"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[134px] min-h-[40px] max-w-[134px] max-h-[40px] overflow-hidden"
                onClick={e => {
                    e.stopPropagation();
                }}
            >
                <AppleStoreIcon />
            </a>
            <a
                href="https://play.google.com/store/apps/details?id=com.learncard.app"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[134px] min-h-[40px] max-w-[134px] max-h-[40px] overflow-hidden"
                onClick={e => {
                    e.stopPropagation();
                }}
            >
                <PlayStoreIcon />
            </a>
        </div>
    );
};

export default AppStoreDownloadButtons;
