import React from 'react';
import { Capacitor } from '@capacitor/core';

import AppleStoreIcon from 'learn-card-base/svgs/AppleStoreIcon';
import PlayStoreIcon from 'learn-card-base/svgs/PlayStoreIcon';
import { getResolvedTenantConfig } from '../../../config/bootstrapTenantConfig';

export const AppStoreDownloadButtons: React.FC = () => {
    if (Capacitor?.isNativePlatform()) return <></>;

    const config = getResolvedTenantConfig();
    const appStoreUrl = config.links.appStoreUrl;
    const playStoreUrl = config.links.playStoreUrl;

    if (!appStoreUrl && !playStoreUrl) return <></>;

    return (
        <div className="flex items-center justify-center pb-[20px] gap-[15px]">
            {appStoreUrl && (
                <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[134px] min-h-[40px] max-w-[134px] max-h-[40px] overflow-hidden"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppleStoreIcon />
                </a>
            )}
            {playStoreUrl && (
                <a
                    href={playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[134px] min-h-[40px] max-w-[134px] max-h-[40px] overflow-hidden"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <PlayStoreIcon />
                </a>
            )}
        </div>
    );
};

export default AppStoreDownloadButtons;
