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
        // Existing store binaries do not include this optional bridge. Avoid native
        // calls, subscriptions and retry timers until the installed binary has it.
        if (
            Capacitor.getPlatform() !== 'android' ||
            !Capacitor.isPluginAvailable('NativeDigitalCredentials') ||
            !hydrated
        )
            return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let expirationTimer: ReturnType<typeof setTimeout> | undefined;
        let running = false;
        let dirty = false;
        let enabled = false;
        let active = true;
        let retryAttempt = 0;
        // status() reports private preferences, not live GMS state. Reassert on boot/foreground.
        let reassertRevision = 1;
        let appliedRevision = 0;
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
            if (stopped || !active) return;
            if (running) {
                dirty = true;
                return;
            }
            running = true;
            let retryRequired = false;
            try {
                enabled = (await nativeDigitalCredentials.status()).enabled;
                if (!enabled || stopped) return;
                const { pending, isProvider } = await nativeDigitalCredentials.getPendingRequest();
                // The platform already selected this entry. Preserve its request and private
                // mapping while the provider asks for sign-in; approval still checks the
                // original owner and fresh inventory. Logout/established-account changes use
                // the immediate invalidation subscriptions above, including during login.
                if (
                    !isHistoryAccountEligible() ||
                    (!pending &&
                        !loggedIn &&
                        !currentUserStore.get.currentUser() &&
                        state.status === 'idle')
                ) {
                    await clearNativeInventory();
                }
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
                const refreshingRevision = reassertRevision;
                const result = await synchronizeNativeInventory(
                    wallet,
                    () => !stopped && selectedAccount(),
                    m['nativeCredentials.credentialTitle'](),
                    refreshingRevision !== appliedRevision
                );
                appliedRevision = refreshingRevision;
                retryRequired = result.retryRequired;
                clearTimeout(expirationTimer);
                if (!stopped && active && result.nextRefreshAt !== undefined) {
                    // Timers suspend in the background; foreground refresh checks wall-clock
                    // expiry again. Never replace the registry while provider consent is open.
                    expirationTimer = setTimeout(
                        () => void check(),
                        Math.min(2_147_483_647, Math.max(1, result.nextRefreshAt - Date.now()))
                    );
                }
            } catch {
                retryRequired = true;
            } finally {
                running = false;
                if (dirty && !stopped) {
                    dirty = false;
                    schedule();
                } else if (retryRequired && !stopped && active && retryAttempt < 3) {
                    const delay = [2_000, 10_000, 30_000][retryAttempt++];
                    timer = setTimeout(() => void check(), delay);
                }
            }
        };
        const schedule = () => {
            retryAttempt = 0;
            clearTimeout(timer);
            timer = setTimeout(() => void check(), 350);
        };
        // The persisted owner is compared after account initialization. A wallet becoming
        // available on cold start is not an account switch and must preserve the OS handle.
        const unsubscribe = queryClient.getQueryCache().subscribe(event => {
            const key = event.query.queryKey[0];
            if (
                event.type === 'updated' &&
                (event.action.type === 'success' || event.action.type === 'invalidate') &&
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
            active = event.isActive;
            if (active) {
                reassertRevision++;
                schedule();
            } else {
                clearTimeout(timer);
                clearTimeout(expirationTimer);
            }
        });
        void check();
        return () => {
            stopped = true;
            clearTimeout(timer);
            clearTimeout(expirationTimer);
            unsubscribe();
            unsubscribeAccount();
            unsubscribeProfile();
            void foreground.then(listener => listener.remove());
        };
    }, [history, loggedIn, hydrated, revision, queryClient, state.status]);
    return null;
}
