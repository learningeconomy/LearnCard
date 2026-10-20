import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

import { useWallet } from '../hooks/useWallet';
import { useIsLoggedIn } from '../stores/currentUserStore';
import { switchedProfileStore, walletStore } from '../stores/walletStore';
import type { LCR } from '../types/credential-records';
import { clearCredentialFacts } from './credentialFactsStore';
import {
    getCredentialFactsLoader,
    type CredentialFactsSnapshot,
    type CredentialFactsSource,
} from './credentialFactsLoader';

export { addCredentialSummary } from './credentialFactsStore';

export interface CredentialFactsState extends CredentialFactsSnapshot {
    accountDid: string | null;
    backfillNow: () => Promise<void>;
    clearFacts: () => Promise<void>;
}

const EMPTY: CredentialFactsSnapshot = {
    summaries: null,
    complete: false,
    total: 0,
    readsUsed: 0,
};
const emptySnapshot = (): CredentialFactsSnapshot => EMPTY;
const noSubscribe = (): (() => void) => () => undefined;

export const useCredentialFacts = (required: boolean): CredentialFactsState => {
    const isLoggedIn = useIsLoggedIn();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const wallet = walletStore.use.wallet();
    const accountDid = isLoggedIn ? (switchedDid ?? wallet?.id.did() ?? null) : null;
    const { initWallet } = useWallet();
    const initRef = useRef(initWallet);
    const queryClient = useQueryClient();
    const activeRef = useRef<string | null>(null);
    useLayoutEffect(() => {
        initRef.current = initWallet;
        activeRef.current = required ? accountDid : null;
        return () => {
            activeRef.current = null;
        };
    }, [accountDid, initWallet, required]);
    const loader = useMemo(
        () => (required && accountDid ? getCredentialFactsLoader(accountDid) : null),
        [accountDid, required]
    );
    const snapshot = useSyncExternalStore(
        loader?.subscribe ?? noSubscribe,
        loader?.getSnapshot ?? emptySnapshot,
        emptySnapshot
    );
    const source = useMemo<CredentialFactsSource>(
        () => ({
            isActive: () => activeRef.current !== null && activeRef.current === accountDid,
            cached: uri => queryClient.getQueryData(['useGetResolvedCredential', uri]),
            read: async uri => {
                const currentWallet = await initRef.current();
                if (activeRef.current !== accountDid || currentWallet.id.did() !== accountDid)
                    return null;
                return currentWallet.read.get(uri);
            },
            list: async () => {
                const currentWallet = await initRef.current();
                if (currentWallet.id.did() !== accountDid) throw new Error('Account changed');
                const records: LCR[] = [];
                if (!currentWallet.index.LearnCloud.getPage)
                    throw new Error('Index pagination unavailable');
                let cursor: string | undefined;
                const cursors = new Set<string>();
                do {
                    if (activeRef.current !== accountDid) throw new Error('Account changed');
                    const page = await currentWallet.index.LearnCloud.getPage<LCR>(undefined, {
                        cursor,
                        limit: 100,
                        sort: 'newestFirst',
                    });
                    records.push(...page.records);
                    if (!page.hasMore) break;
                    if (!page.cursor || cursors.has(page.cursor))
                        throw new Error('Incomplete index');
                    cursor = page.cursor;
                    cursors.add(page.cursor);
                } while (cursor);
                return records;
            },
        }),
        [accountDid, queryClient]
    );

    useEffect(() => {
        if (!loader) return;
        const release = loader.acquire();
        const resume = (): void => {
            void loader.refresh(source);
        };
        const onVisibility = (): void => {
            if (document.visibilityState === 'visible') resume();
        };
        resume();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', resume);
        let disposed = false;
        let removeNative: (() => void) | undefined;
        if (Capacitor.isNativePlatform()) {
            void import('@capacitor/app')
                .then(({ App }) =>
                    App.addListener('appStateChange', ({ isActive }) => {
                        if (isActive) resume();
                    })
                )
                .then(handle => {
                    if (disposed) void handle.remove();
                    else
                        removeNative = () => {
                            void handle.remove();
                        };
                })
                .catch(() => undefined);
        }
        return () => {
            disposed = true;
            release();
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', resume);
            removeNative?.();
        };
    }, [loader, source]);

    const backfillNow = useCallback(async (): Promise<void> => {
        await loader?.refresh(source, true);
    }, [loader, source]);
    const clearFacts = useCallback(async (): Promise<void> => {
        if (!loader || !accountDid) return;
        loader.stop();
        await clearCredentialFacts(accountDid);
    }, [accountDid, loader]);

    return { ...snapshot, accountDid, backfillNow, clearFacts };
};
