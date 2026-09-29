import { useEffect, useRef } from 'react';

import { connectivityStore, type ConnectivityStatus } from '../stores/connectivityStore';
import type { ConnectionQuality, ConnectionQualityReason } from '../connectivity/connectionQuality';

export const useConnectivityStatus = (): ConnectivityStatus => connectivityStore.use.status();

export const useIsOffline = (): boolean => connectivityStore.use.status() === 'offline';

/** Advisory quality — never use for gating. See connectionQuality.ts. */
export const useConnectionQuality = (): ConnectionQuality => connectivityStore.use.quality();

export const useConnectionQualityReason = (): ConnectionQualityReason | null =>
    connectivityStore.use.qualityReason();

/**
 * True when the advisory slow/unstable warning should show. Offline display
 * takes precedence — a verified offline state is not also "slow".
 */
export const useIsSlowOrUnstable = (): boolean => {
    const status = connectivityStore.use.status();
    const quality = connectivityStore.use.quality();
    return status !== 'offline' && quality === 'poor';
};

/**
 * Run `callback` once each time connectivity transitions offline → permissive (unknown/online).
 * For imperative systems that don't self-heal on reconnect (e.g. re-registering
 * push, refreshing feature flags). Data fetched through React Query recovers on
 * its own via the onlineManager bridge and does NOT need this.
 */
export const useOnReconnect = (callback: () => void): void => {
    const cbRef = useRef(callback);
    useEffect(() => {
        cbRef.current = callback;
    }, [callback]);

    const status = connectivityStore.use.status();
    const prevStatus = useRef<ConnectivityStatus>(status);

    useEffect(() => {
        if (prevStatus.current === 'offline' && status !== 'offline') cbRef.current();
        prevStatus.current = status;
    }, [status]);
};
