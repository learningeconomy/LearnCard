import React, { useCallback, useEffect, useRef } from 'react';

import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    getLogger,
    useIsLoggedIn,
    useRefreshLearnCloudCredentialMutation,
    useWallet,
} from 'learn-card-base';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { LearnCloudCredentialRefreshResult } from 'learn-card-base/helpers/credentialRefresh';
import {
    CREDENTIAL_REFRESH_SCAN_CONCURRENCY,
    getCredentialRefreshCandidates,
    isCredentialRefreshCandidateStale,
    processWithConcurrency,
} from 'learn-card-base/react-query/queries/credentialRefresh';

const log = getLogger('credential-refresh-listener');

/**
 * LaunchDarkly flag gating automatic foreground scanning (LC-2117, LC-2135,
 * LC-2136). Managed issuer routes carry an independent server-side flag; a missing
 * client flag means scanning is off.
 */
export const CREDENTIAL_REFRESH_FOREGROUND_FLAG = 'credentialRefreshForegroundEnabled';

// Per-session scan state lives at module scope so React StrictMode double-effects
// and listener remounts cannot start a second ordinary scan. There is no persisted
// or server-side scheduler state — only this process memory plus the encrypted
// record timestamps.
let ordinaryScanCompletedThisSession = false;
let scanInFlight: Promise<void> | undefined;

/** Test-only reset of the per-session ordinary scan state */
export const resetCredentialRefreshSessionForTests = (): void => {
    ordinaryScanCompletedThisSession = false;
    scanInFlight = undefined;
};

/**
 * Forced entry point for credential detail views and refresh notification taps:
 * refreshes a single record through the shared in-place mutation, bypassing the
 * 24-hour staleness guard.
 */
export const useForceRefreshLearnCloudCredential = () => {
    const mutation = useRefreshLearnCloudCredentialMutation();

    const forceRefresh = useCallback(
        (record: LCR): Promise<LearnCloudCredentialRefreshResult> =>
            mutation.mutateAsync({ record, force: true }),
        [mutation.mutateAsync]
    );

    return { ...mutation, forceRefresh };
};

/**
 * Refreshes stale refreshable credentials when the app launches or returns to the
 * foreground.
 *
 * - The ordinary scan runs at most once per app session and only processes records
 *   stale by the named 24-hour check interval; a scan whose candidate discovery
 *   fails does not consume the session's scan and may retry on the next foreground
 *   event.
 * - Foreground triggers are Capacitor `appStateChange` (native), document
 *   `visibilitychange`, and window `focus` (web); background events are ignored.
 * - Records are processed with bounded concurrency and per-record failure
 *   isolation — a failure is logged and never interrupts wallet use.
 * - No work happens when the feature flag is disabled or the user is logged out.
 */
const CredentialRefreshListener: React.FC = () => {
    const flags = useFlags();
    const flagEnabled = flags[CREDENTIAL_REFRESH_FOREGROUND_FLAG] === true;
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const { mutateAsync } = useRefreshLearnCloudCredentialMutation();

    // Latest-dependencies ref so listener registration never churns on wallet or
    // mutation identity changes.
    const dependenciesRef = useRef({ initWallet, mutateAsync });
    dependenciesRef.current = { initWallet, mutateAsync };

    useEffect(() => {
        if (!flagEnabled || !isLoggedIn) return;

        let disposed = false;

        const runOrdinaryScan = (): Promise<void> | undefined => {
            if (disposed || ordinaryScanCompletedThisSession) return undefined;
            if (scanInFlight) return scanInFlight;

            const scan = (async () => {
                try {
                    const wallet = await dependenciesRef.current.initWallet();
                    const candidates = await getCredentialRefreshCandidates(wallet);

                    // Discovery succeeded: the session's one ordinary scan is spent,
                    // even if individual records below fail.
                    ordinaryScanCompletedThisSession = true;

                    const staleCandidates = candidates.filter(record =>
                        isCredentialRefreshCandidateStale(record)
                    );

                    await processWithConcurrency(
                        staleCandidates,
                        CREDENTIAL_REFRESH_SCAN_CONCURRENCY,
                        async record => {
                            try {
                                await dependenciesRef.current.mutateAsync({ record });
                            } catch (error) {
                                log.error('refresh.scan.record-failed', error);
                            }
                        }
                    );
                } catch (error) {
                    log.error('refresh.scan.failed', error);
                }
            })();

            scanInFlight = scan;
            void scan.finally(() => {
                if (scanInFlight === scan) scanInFlight = undefined;
            });

            return scan;
        };

        // App launch / initial foreground.
        void runOrdinaryScan();

        const handleAppStateChange = ({ isActive }: { isActive: boolean }): void => {
            if (isActive) void runOrdinaryScan();
        };
        const handleVisibilityChange = (): void => {
            if (document.visibilityState === 'visible') void runOrdinaryScan();
        };
        const handleWindowFocus = (): void => {
            void runOrdinaryScan();
        };

        let appStateHandle: PluginListenerHandle | undefined;

        App.addListener('appStateChange', handleAppStateChange)
            .then(handle => {
                if (disposed) {
                    void handle.remove();
                } else {
                    appStateHandle = handle;
                }
            })
            .catch(error => log.warn('refresh.listener.app-state-failed', error));

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            disposed = true;

            if (appStateHandle) void appStateHandle.remove();

            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [flagEnabled, isLoggedIn]);

    return null;
};

export default CredentialRefreshListener;
