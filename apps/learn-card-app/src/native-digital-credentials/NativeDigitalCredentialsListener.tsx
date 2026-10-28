import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useQueryClient } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet, useHasCurrentUserHydrated } from 'learn-card-base';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { useAppAuth } from '../providers/AuthCoordinatorProvider';
import {
    captureHistoryAccount,
    isHistoryAccountEligible,
    useHistoryAccountRevision,
} from '../helpers/verifier-history/account';
import { nativeDigitalCredentials } from './plugin';
import { clearNativeInventory, synchronizeNativeInventory } from './runtime';
import type { DigitalCredentialWallet } from './inventory';
import * as m from '../paraglide/messages.js';

export const NATIVE_CREDENTIAL_PATH = '/native-digital-credentials';

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
        const check = async () => {
            if (stopped) return;
            if (running) {
                dirty = true;
                return;
            }
            running = true;
            try {
                if (!(await nativeDigitalCredentials.status()).enabled || stopped) return;
                if (
                    !isHistoryAccountEligible() ||
                    (!loggedIn && !currentUserStore.get.currentUser() && state.status === 'idle')
                ) {
                    await clearNativeInventory();
                }
                const { pending } = await nativeDigitalCredentials.getPendingRequest();
                if (stopped) return;
                if (pending) {
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
                ['boosts', 'useGetCredentials', 'useGetIDs', 'getPaginatedBoosts'].includes(
                    String(key)
                )
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
            void foreground.then(listener => listener.remove());
        };
    }, [history, loggedIn, hydrated, revision, queryClient, state.status]);
    return null;
}
