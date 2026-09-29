import React from 'react';

import { useNetworkStatus } from './useNetworkStatus';
import { OfflineBanner } from './OfflineBanner';

/**
 * Mounts the app connectivity monitor and renders the connectivity banners.
 *
 * The monitor is the single owner of verified reachability: Capacitor Network
 * events are only HINTS fed into it (see ./connectivity.ts). Everything else
 * (React Query onlineManager, auth coordinator, banners, boot gate) reads the
 * shared connectivity store the monitor writes to.
 */
export const NetworkListener = () => {
    // Attaching is ref-counted; the returned status is the verified one.
    useNetworkStatus();

    return <OfflineBanner />;
};

export default NetworkListener;
