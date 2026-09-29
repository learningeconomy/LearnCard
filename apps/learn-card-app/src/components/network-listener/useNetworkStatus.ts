import { useEffect } from 'react';

import { connectivityStore, type ConnectivityStatus } from 'learn-card-base';

import { attachAppConnectivity } from './connectivity';

/**
 * Attaches the app connectivity monitor (ref-counted, StrictMode-safe) and
 * returns the VERIFIED connectivity status from the shared connectivity store.
 *
 * Raw Capacitor hints never leave this module: the monitor owns verification
 * (probe with deadline), optimistic positive hints, offline backoff, and the
 * diagnostic reason. Gating consumers read the store — this hook is just the
 * lifecycle owner plus a reactive status.
 */
export function useNetworkStatus(): ConnectivityStatus {
    useEffect(() => attachAppConnectivity(), []);

    return connectivityStore.use.status();
}
