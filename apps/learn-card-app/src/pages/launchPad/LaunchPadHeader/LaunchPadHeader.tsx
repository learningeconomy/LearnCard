import React, { ReactElement } from 'react';

import LaunchPadHeaderLinks from './LaunchPadHeaderLinks';
import LaunchPadHeaderTitle from './LaunchPadHeaderTitle';
import LaunchPadHeaderCurvedDivider from './LaunchPadCurvedDivider';
import LaunchPadHeaderUserGreeting from './LaunchPadHeaderUserGreeting';

const LaunchPadHeader: React.FC<{ children: ReactElement }> = ({ children }) => {
    return (
        <>
            <LaunchPadHeaderUserGreeting />
            <LaunchPadHeaderLinks />
            <LaunchPadHeaderCurvedDivider />
            <LaunchPadHeaderTitle />
            {children}
        </>
    );
};

export default LaunchPadHeader;
