import { useEffect, useRef } from 'react';

import {
    useIsLoggedIn,
    useWallet,
    getCategoryForCredential,
    walletStore,
    WalletSyncState,
    useIsCurrentUserLCNUser
} from 'learn-card-base';
import type { VC, LCNProfile } from '@learncard/types';
import { useVerifySuccessTick } from '../stores/autoVerifyStore';
import { captureException } from '@sentry/react';

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

const hasProfileId = (p: LCNProfile | undefined): boolean => !!p && typeof p.profileId === 'string' && p.profileId.length > 0;

export const useFinalizeInboxCredentials = () => {
    const { data: isLCNUser } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const verifySuccessTick = useVerifySuccessTick();

    const inFlightRef = useRef(false);

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

                const profile = await wallet?.invoke?.getProfile() as LCNProfile | undefined;
                if (!profile) return;
                const profileId = hasProfileId(profile) ? profile.profileId : undefined;
                if (!profileId) return;

                // Skip if recently finalized for this profile
                if (!needsFinalize(profileId)) return;

                const result = await wallet.invoke?.finalizeInboxCredentials();
                const vcs: VC[] = result?.verifiableCredentials || [];

                if (!vcs.length) {
                    // Nothing to store but consider finalization complete for a while
                    markFinalized(profileId);
                    return;
                }

                // mark syncing
                walletStore.set.setIsSyncing(WalletSyncState.Syncing);

                let storedCount = 0;

                for (const vc of vcs) {
                    try {
                        const category = await getCategoryForCredential(vc, wallet, false);

                        const uri = (await wallet.store.LearnCloud.uploadEncrypted?.(vc)) ?? '';

                        if (!uri) continue;

                        const id = vc?.id ||
                            (typeof crypto !== 'undefined' && crypto.randomUUID
                                ? crypto.randomUUID()
                                : `${Date.now()}-${Math.random().toString(36).slice(2, 18)}-${Math.random().toString(36).slice(2, 18)}-${performance.now()}`);

                        await wallet.index.LearnCloud.add({
                            id,
                            uri,
                            category,
                        });

                        storedCount += 1;
                    } catch (_) {
                        // continue storing other VCs
                    }
                }

                // complete syncing
                walletStore.set.setIsSyncing(WalletSyncState.Completed, storedCount);

                // Mark as finalized for this profile in ephemeral cache
                markFinalized(profileId);
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
