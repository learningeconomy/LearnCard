import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    useIsLoggedIn,
    useWallet,
    walletStore,
    WalletSyncState,
    useIsCurrentUserLCNUser,
    connectionPromptKeys,
} from 'learn-card-base';
import type { LCNProfile } from '@learncard/types';
import { useVerifySuccessTick } from '../stores/autoVerifyStore';
import { captureException } from '@sentry/react';
import {
    useAnalytics,
    AnalyticsEvents,
    ProfileBuildMethod,
    useProfileSnapshotCapture,
    ACCOUNT_CREATED_AT_KEY,
    SESSION_START_KEY,
} from '@analytics';

import { recoverInboxDeliveries } from './recoverInboxDeliveries';

// Finalize cache settings
const FINALIZE_CACHE_TTL_MS = 30 * 60_000; // 30 minutes

type FinalizeCacheEntry = { ts: number };

// Ephemeral per-profile cache to avoid redundant finalization in a short window
const finalizedProfileCache = new Map<string, FinalizeCacheEntry>();

const needsFinalize = (profileId?: string | null): boolean => {
    if (!profileId) return false;
    const entry = finalizedProfileCache.get(profileId);
    if (!entry) return true;
    const age = Date.now() - entry.ts;
    return age > FINALIZE_CACHE_TTL_MS;
};

const markFinalized = (profileId?: string | null): void => {
    if (!profileId) return;
    finalizedProfileCache.set(profileId, { ts: Date.now() });
};

/** Clear finalize cache so the next effect run re-checks the inbox. */
export const clearFinalizeCache = (): void => {
    finalizedProfileCache.clear();
};

const hasProfileId = (p: LCNProfile | undefined): boolean =>
    !!p && typeof p.profileId === 'string' && p.profileId.length > 0;

export const useFinalizeInboxCredentials = () => {
    const { data: isLCNUser } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const verifySuccessTick = useVerifySuccessTick();

    const inFlightRef = useRef(false);
    const { track } = useAnalytics();
    const { capture, snapshotRef } = useProfileSnapshotCapture();
    const storedCountAtStartRef = useRef(0);

    useEffect(() => {
        if (!isLoggedIn) {
            inFlightRef.current = false;
            return;
        }

        if (inFlightRef.current) return;

        (async () => {
            if (!isLCNUser || !isLoggedIn) return;
            try {
                inFlightRef.current = true;

                const wallet = await initWallet();
                if (!wallet) return;

                const profile = (await wallet?.invoke?.getProfile()) as LCNProfile | undefined;
                if (!profile) return;
                const profileId = hasProfileId(profile) ? profile.profileId : undefined;
                if (!profileId) return;

                // Even if the response is dropped after finalization, recovery can still
                // retrieve the committed holder-only copy. Also sweep older claims at login.
                let finalizeFailed = false;
                if (needsFinalize(profileId)) {
                    try {
                        await wallet.invoke.finalizeInboxCredentials();
                    } catch (error) {
                        finalizeFailed = true;
                        captureException(error);
                    }
                }

                await queryClient.invalidateQueries({ queryKey: connectionPromptKeys.all });
                let storedCount = 0;
                const recovery = await recoverInboxDeliveries(wallet, () => {
                    if (storedCount === 0) {
                        walletStore.set.setIsSyncing(WalletSyncState.Syncing);
                        capture();
                        storedCountAtStartRef.current = snapshotRef.current.credentialCount;
                    }
                    storedCount += 1;
                    // LC-1853: fire profile_item_added for each auto-accepted credential
                    try {
                        const now = Date.now();
                        const sessionStart = Number(localStorage.getItem(SESSION_START_KEY) ?? now);
                        const accountCreatedAt = Number(
                            localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? now
                        );
                        track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
                            method: ProfileBuildMethod.ReceivedBoost,
                            itemType: 'credential',
                            itemCount: 1,
                            totalItemsAfter: storedCountAtStartRef.current + storedCount,
                            msSinceAccountCreated: now - accountCreatedAt,
                            msSinceSessionStart: now - sessionStart,
                        });
                    } catch (_) {
                        // analytics must not break credential storage
                    }
                });
                if (recovery.stored) {
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
                        queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
                    ]);
                }

                // complete syncing
                if (storedCount > 0) {
                    walletStore.set.setIsSyncing(WalletSyncState.Completed, storedCount);
                } else {
                    walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
                }

                // Mark as finalized for this profile in ephemeral cache
                if (!finalizeFailed && recovery.failed === 0) markFinalized(profileId);
            } catch (e) {
                // Capture and reset syncing state on error
                captureException(e);
                walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
            } finally {
                inFlightRef.current = false;
            }
        })();
    }, [isLoggedIn, isLCNUser, verifySuccessTick]);
};

export default useFinalizeInboxCredentials;
