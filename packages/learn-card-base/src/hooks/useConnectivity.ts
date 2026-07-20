import { useEffect, useRef } from 'react';

import { connectivityStore, type ConnectivityStatus } from '../stores/connectivityStore';

export const useConnectivityStatus = (): ConnectivityStatus => connectivityStore.use.status();

export const useIsOffline = (): boolean => connectivityStore.use.status() === 'offline';

/**
 * Run `callback` once each time connectivity transitions offline → online.
 * For imperative systems that don't self-heal on reconnect (e.g. re-registering
 * push, refreshing feature flags). Data fetched through React Query recovers on
 * its own via the onlineManager bridge and does NOT need this.
 */
export const useOnReconnect = (callback: () => void): void => {
    const cbRef = useRef(callback);
    cbRef.current = callback;

    const status = connectivityStore.use.status();
    const prevStatus = useRef<ConnectivityStatus>(status);

    useEffect(() => {
        if (prevStatus.current === 'offline' && status === 'online') cbRef.current();
        prevStatus.current = status;
    }, [status]);
};
