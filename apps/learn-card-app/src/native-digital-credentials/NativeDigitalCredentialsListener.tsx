import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useQueryClient } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet, useHasCurrentUserHydrated } from 'learn-card-base';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useAppAuth } from '../providers/AuthCoordinatorProvider';
import {
    captureHistoryAccount,
    isHistoryAccountEligible,
    useHistoryAccountRevision,
} from '../helpers/verifier-history/account';
import { nativeDigitalCredentials } from './plugin';
import { clearNativeInventory, synchronizeNativeInventory } from './runtime';
import type { DigitalCredentialWallet } from './inventory';
import { NATIVE_CREDENTIAL_PATH } from './types';
import { nativeAccountChanged } from './accountChange';
import * as m from '../paraglide/messages.js';

/** Account-aware registry synchronization plus native pending-intent routing. */
export default function NativeDigitalCredentialsListener() {
    const history = useHistory();
    const loggedIn = useIsLoggedIn();
    const hydrated = useHasCurrentUserHydrated();
    const { state } = useAppAuth();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const revision = useHistoryAccountRevision();
    const walletInitializer = useRef(initWallet);
    walletInitializer.current = initWallet;

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android' || !hydrated) return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let running = false;
        let dirty = false;
        let enabled = false;
        // Fence native handles before async wallet replacement. Each WebView has its own
        // JS stores, while the native registry generation is shared by all host Activities.
        const invalidate = () => {
            if (enabled) void nativeDigitalCredentials.clear().catch(() => undefined);
        };
        const unsubscribeAccount = currentUserStore.store.subscribe((next, previous) => {
            if (nativeAccountChanged(next, previous)) invalidate();
        });
        const unsubscribeProfile = switchedProfileStore.store.subscribe((next, previous) => {
            if (
                next.switchedDid !== previous.switchedDid ||
                next.profileType !== previous.profileType
            )
                invalidate();
        });
        const check = async () => {
            if (stopped) return;
            if (running) {
                dirty = true;
                return;
            }
            running = true;
            try {
                enabled = (await nativeDigitalCredentials.status()).enabled;
                if (!enabled || stopped) return;
                if (
                    !isHistoryAccountEligible() ||
                    (!loggedIn && !currentUserStore.get.currentUser() && state.status === 'idle')
                ) {
                    await clearNativeInventory();
                }
                const { pending, isProvider } = await nativeDigitalCredentials.getPendingRequest();
                if (stopped) return;
                if (pending || isProvider) {
                    if (history.location.pathname !== NATIVE_CREDENTIAL_PATH)
                        history.replace(NATIVE_CREDENTIAL_PATH);
                    return;
                }
                if (!loggedIn || !isHistoryAccountEligible()) return;
                const selectedAccount = captureHistoryAccount();
                const wallet =
                    (await walletInitializer.current()) as unknown as DigitalCredentialWallet;
                await synchronizeNativeInventory(
                    wallet,
                    () => !stopped && selectedAccount(),
                    m['nativeCredentials.credentialTitle']()
                );
            } catch {
                /* A platform/network failure is retried on the next inventory or foreground event. */
            } finally {
                running = false;
                if (dirty && !stopped) {
                    dirty = false;
                    schedule();
                }
            }
        };
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(() => void check(), 350);
        };
        // The persisted owner is compared after account initialization. A wallet becoming
        // available on cold start is not an account switch and must preserve the OS handle.
        const unsubscribe = queryClient.getQueryCache().subscribe(event => {
            const key = event.query.queryKey[0];
            if (
                event.type === 'updated' &&
                [
                    'boosts',
                    'useGetCredentials',
                    'useGetIDs',
                    'getPaginatedBoosts',
                    'useGetCredentialList',
                    'useGetCredentialsListFromIDX',
                    'useGetCredentialCount',
                    'useCountBoosts',
                    'totalBoostCounts',
                    'useGetPaginatedManagedBoosts',
                ].includes(String(key))
            )
                schedule();
        });
        const foreground = App.addListener('appStateChange', event => {
            if (event.isActive) schedule();
        });
        void check();
        return () => {
            stopped = true;
            clearTimeout(timer);
            unsubscribe();
            unsubscribeAccount();
            unsubscribeProfile();
            void foreground.then(listener => listener.remove());
        };
    }, [history, loggedIn, hydrated, revision, queryClient, state.status]);
    return null;
}
