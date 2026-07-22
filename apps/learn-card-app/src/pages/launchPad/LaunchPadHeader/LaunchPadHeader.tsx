import React, { ReactElement } from 'react';

import * as m from '../../../paraglide/messages.js';

import LaunchPadHeaderLinks from './LaunchPadHeaderLinks';
import LaunchPadHeaderTitle from './LaunchPadHeaderTitle';
import LaunchPadHeaderCurvedDivider from './LaunchPadCurvedDivider';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';

const LaunchPadHeader: React.FC<{ children: ReactElement }> = ({ children }) => {
    const { launchPadQuickActions } = useFeatureConfig();

    return (
        <>
            <h1 className="text-[25px] text-slate-900 z-10 py-[5px] w-full max-w-[600px] px-3">
                {m['launchpad.title']()}
            </h1>
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
