import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useWallet } from '../hooks/useWallet';
import { useIsLoggedIn } from '../stores/currentUserStore';
import { switchedProfileStore, walletStore } from '../stores/walletStore';
import type { LCR } from '../types/credential-records';
import type { BespokeLearnCard } from '../types/learn-card';
import { summarizeCredential, type CredentialSummary } from './credentialFacts';
import {
    clearCredentialFacts,
    loadCredentialFacts,
    onCredentialSummaryAdded,
    removeMissingCredentialFacts,
    saveCredentialFact,
} from './credentialFactsStore';

const MAX_SESSION_DECRYPTS = 200;
const BACKFILL_BATCH_SIZE = 4;
const RESUME_THROTTLE_MS = 5 * 60 * 1000;

let sessionDecryptsUsed = 0;
const attemptedThisSession = new Set<string>();

const attemptKey = (did: string, uri: string): string => `${did}:${uri}`;

const activeDid = (): string | null =>
    switchedProfileStore.get.switchedDid() ?? walletStore.get.wallet()?.id.did() ?? null;

export { addCredentialSummary } from './credentialFactsStore';

const scheduleIdle = (task: () => void): (() => void) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(task);

        return () => window.cancelIdleCallback(id);
    }

    const id = globalThis.setTimeout(task, 0);

    return () => globalThis.clearTimeout(id);
};

const listCredentialRecords = async (wallet: BespokeLearnCard): Promise<LCR[]> => {
    const records: LCR[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
        const page = await wallet.index.LearnCloud.getPage<LCR>(undefined, {
            ...(cursor ? { cursor } : {}),
            limit: 100,
        });

        records.push(...(page.records ?? []));
        hasMore = Boolean(page.hasMore && page.cursor && page.cursor !== cursor);
        cursor = page.cursor;
    }

    return records;
};

export interface CredentialFactsState {
    accountDid: string | null;
    summaries: CredentialSummary[] | null;
    complete: boolean;
    total: number;
    readsUsed: number;
    backfillNow: () => Promise<void>;
    clearFacts: () => Promise<void>;
}

export const useCredentialFacts = (required: boolean): CredentialFactsState => {
    const isLoggedIn = useIsLoggedIn();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const wallet = walletStore.use.wallet();
    const accountDid = switchedDid ?? wallet?.id.did() ?? null;
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const [summaries, setSummaries] = useState<CredentialSummary[] | null>(null);
    const [complete, setComplete] = useState(false);
    const [total, setTotal] = useState(0);
    const [readsUsed, setReadsUsed] = useState(sessionDecryptsUsed);
    const [stateDid, setStateDid] = useState<string | null>(null);
    const refreshRef = useRef<(force: boolean) => Promise<void>>(async () => undefined);
    const clearRef = useRef<() => Promise<void>>(async () => undefined);

    useEffect(() => {
        if (!required || !isLoggedIn || !accountDid) {
            return;
        }

        let cancelled = false;
        let cancelIdle: (() => void) | undefined;
        let refreshInFlight: Promise<void> | null = null;
        let lastRefreshAt = 0;

        const publish = (next: CredentialSummary[], isComplete: boolean): void => {
            if (cancelled) return;

            setStateDid(accountDid);
            setSummaries(next);
            setComplete(isComplete);
            setReadsUsed(sessionDecryptsUsed);
        };

        const runRefresh = async (force: boolean): Promise<void> => {
            if (refreshInFlight) return refreshInFlight;

            const refresh = (async () => {
                const currentWallet = await initWallet();

                if (cancelled || currentWallet.id.did() !== accountDid) return;

                const cached = await loadCredentialFacts(accountDid);

                publish(cached, false);

                const records = await listCredentialRecords(currentWallet);

                if (cancelled || activeDid() !== accountDid) return;

                const uris = new Set(records.map(record => record.uri));

                await removeMissingCredentialFacts(accountDid, uris);

                const byUri = new Map(
                    cached
                        .filter(summary => uris.has(summary.uri))
                        .map(summary => [summary.uri, summary])
                );
                const missing = records.filter(record => !byUri.has(record.uri));

                setTotal(records.length);
                publish([...byUri.values()], missing.length === 0);

                const processNextBatch = (): void => {
                    if (cancelled) return;

                    const batch: LCR[] = [];

                    while (missing.length > 0 && batch.length < BACKFILL_BATCH_SIZE) {
                        const record = missing.shift();

                        if (!record) continue;

                        const key = attemptKey(accountDid, record.uri);
                        const resolved = queryClient.getQueryData<unknown>([
                            'useGetResolvedCredential',
                            record.uri,
                        ]);

                        if (resolved !== undefined) {
                            batch.push(record);
                            continue;
                        }

                        if (!force && sessionDecryptsUsed >= MAX_SESSION_DECRYPTS) {
                            missing.unshift(record);
                            break;
                        }
                        if (!force && attemptedThisSession.has(key)) continue;

                        attemptedThisSession.add(key);
                        sessionDecryptsUsed += 1;
                        batch.push(record);
                    }

                    if (batch.length === 0) {
                        publish(
                            [...byUri.values()],
                            missing.length === 0 && byUri.size === records.length
                        );
                        return;
                    }

                    void Promise.all(
                        batch.map(async record => {
                            try {
                                const cachedVc = queryClient.getQueryData<unknown>([
                                    'useGetResolvedCredential',
                                    record.uri,
                                ]);
                                const vc = cachedVc ?? (await currentWallet.read.get(record.uri));

                                if (!vc || cancelled || activeDid() !== accountDid) return;

                                const summary = summarizeCredential(
                                    record.uri,
                                    vc,
                                    record.category
                                );

                                await saveCredentialFact(accountDid, summary);
                                byUri.set(record.uri, summary);
                            } catch {
                                // A single unreadable credential leaves facts incomplete.
                            }
                        })
                    ).then(() => {
                        publish(
                            [...byUri.values()],
                            missing.length === 0 && byUri.size === records.length
                        );
                        cancelIdle = scheduleIdle(processNextBatch);
                    });
                };

                cancelIdle = scheduleIdle(processNextBatch);
                lastRefreshAt = Date.now();
            })().finally(() => {
                refreshInFlight = null;
            });

            refreshInFlight = refresh;
            return refresh;
        };

        const onFact = (did: string, summary: CredentialSummary): void => {
            if (did !== accountDid) return;

            setSummaries(current => {
                const byUri = new Map((current ?? []).map(item => [item.uri, item]));

                byUri.set(summary.uri, summary);
                return [...byUri.values()];
            });
        };

        const resume = (): void => {
            if (Date.now() - lastRefreshAt < RESUME_THROTTLE_MS) return;

            void runRefresh(false);
        };
        const onVisibilityChange = (): void => {
            if (document.visibilityState === 'visible') resume();
        };

        const unsubscribeFacts = onCredentialSummaryAdded(onFact);
        refreshRef.current = runRefresh;
        clearRef.current = async () => {
            await clearCredentialFacts(accountDid);
            publish([], false);
            await runRefresh(false);
        };

        void runRefresh(false);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', resume);

        let removeNativeListener: (() => void) | undefined;

        void import('@capacitor/app')
            .then(({ App }) =>
                App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) resume();
                })
            )
            .then(handle => {
                if (cancelled) {
                    void handle.remove();
                } else {
                    removeNativeListener = () => void handle.remove();
                }
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
            cancelIdle?.();
            unsubscribeFacts();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('focus', resume);
            removeNativeListener?.();
        };
    }, [accountDid, initWallet, isLoggedIn, queryClient, required]);

    const backfillNow = useCallback(() => refreshRef.current(true), []);
    const clearFacts = useCallback(() => clearRef.current(), []);

    const active = required && isLoggedIn && accountDid !== null && stateDid === accountDid;

    return {
        accountDid,
        summaries: active ? summaries : null,
        complete: active ? complete : false,
        total: active ? total : 0,
        readsUsed,
        backfillNow,
        clearFacts,
    };
};
