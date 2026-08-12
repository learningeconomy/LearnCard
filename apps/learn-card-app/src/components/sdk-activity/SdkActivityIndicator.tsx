import React from 'react';

import sdkActivityStore from '../../stores/sdkActivityStore';

/**
 * A thin top-edge progress bar that appears when SDK/partner-connect
 * operations are in progress. Sits flush at the top of the viewport so it
 * works equally well in fullscreen and side-panel contexts.
 */
const SdkActivityIndicator: React.FC = () => {
    const isActive = sdkActivityStore.use.isActive();

    if (!isActive) return null;

    return (
        <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[999991] h-1 overflow-hidden bg-violet-200/30">
            <div className="h-full w-1/3 rounded-r bg-gradient-to-r from-violet-500 to-indigo-500 animate-[sdk-bar_1.4s_ease-in-out_infinite]" />
        </div>
    );
};

export default SdkActivityIndicator;
