import React, { useEffect } from 'react';

import { useNetworkStatus } from './useNetworkStatus';
import { connectivityStore } from 'learn-card-base';
import { OfflineBanner } from './OfflineBanner';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();

    // Feed the shared connectivity model that boot/auth-gate logic reads.
    useEffect(() => {
        if (isConnected !== undefined) connectivityStore.set.report(isConnected);
    }, [isConnected]);

    return <OfflineBanner />;
};

export default NetworkListener;
