import React, { ReactElement } from 'react';

import LaunchPadHeaderLinks from './LaunchPadHeaderLinks';
import LaunchPadHeaderTitle from './LaunchPadHeaderTitle';
import LaunchPadHeaderCurvedDivider from './LaunchPadCurvedDivider';
import LaunchPadHeaderUserGreeting from './LaunchPadHeaderUserGreeting';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';

const LaunchPadHeader: React.FC<{ children: ReactElement }> = ({ children }) => {
    const { launchPadQuickActions } = useFeatureConfig();

    return (
        <>
            <LaunchPadHeaderUserGreeting />
            {launchPadQuickActions ? (
                <LaunchPadHeaderLinks />
            ) : (
                <div className="w-full bg-white h-10" />
            )}
            <LaunchPadHeaderCurvedDivider />
            {/* <LaunchPadHeaderTitle /> */}
            {children}
        </>
    );
};

export default LaunchPadHeader;
