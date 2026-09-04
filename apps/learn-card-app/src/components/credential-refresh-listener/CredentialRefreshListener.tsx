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
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
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

// Per-session scan state is keyed by the active account DID. Module scope still
// protects against React StrictMode double-effects and listener remounts, while the
// DID key prevents one account's completed scan from suppressing another account.
const ordinaryScansCompletedThisSession = new Set<string>();
const scansInFlight = new Map<string, Promise<void>>();

/** Test-only reset of the per-session ordinary scan state */
export const resetCredentialRefreshSessionForTests = (): void => {
    ordinaryScansCompletedThisSession.clear();
    scansInFlight.clear();
};

/**
 * Forced entry point for credential detail views and refresh notification taps:
 * refreshes a single record through the shared in-place mutation, bypassing the
 * 24-hour staleness guard.
 */
export const useForceRefreshLearnCloudCredential = () => {
    const mutation = useRefreshLearnCloudCredentialMutation();
    const { mutateAsync } = mutation;

    const forceRefresh = useCallback(
        (record: LCR, wallet?: BespokeLearnCard): Promise<LearnCloudCredentialRefreshResult> =>
            mutateAsync({ record, force: true, wallet }),
        [mutateAsync]
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
            if (disposed) return undefined;

            const scan = (async () => {
                try {
                    const wallet = await dependenciesRef.current.initWallet();
                    const accountDid = wallet.id.did();

                    if (ordinaryScansCompletedThisSession.has(accountDid)) return;

                    const existingScan = scansInFlight.get(accountDid);
                    if (existingScan) return existingScan;

                    const accountScan = (async () => {
                        const candidates = await getCredentialRefreshCandidates(wallet);

                        // Discovery succeeded: the session's one ordinary scan is spent,
                        // even if individual records below fail.
                        ordinaryScansCompletedThisSession.add(accountDid);

                        const staleCandidates = candidates.filter(record =>
                            isCredentialRefreshCandidateStale(record)
                        );

                        await processWithConcurrency(
                            staleCandidates,
                            CREDENTIAL_REFRESH_SCAN_CONCURRENCY,
                            async record => {
                                try {
                                    await dependenciesRef.current.mutateAsync({ record, wallet });
                                } catch (error) {
                                    log.error('refresh.scan.record-failed', error);
                                }
                            }
                        );
                    })();

                    scansInFlight.set(accountDid, accountScan);

                    try {
                        await accountScan;
                    } finally {
                        if (scansInFlight.get(accountDid) === accountScan) {
                            scansInFlight.delete(accountDid);
                        }
                    }
                } catch (error) {
                    log.error('refresh.scan.failed', error);
                }
            })();

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
