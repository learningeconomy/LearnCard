import type { CredentialSummary } from './credentialFacts';
import { trySummarizeCredential } from './credentialFacts';
import {
    loadCredentialFacts,
    onCredentialSummaryAdded,
    removeMissingCredentialFacts,
    saveCredentialFact,
} from './credentialFactsStore';

export const MAX_SESSION_DECRYPTS = 200;
const RESUME_THROTTLE_MS = 5 * 60 * 1000;
let readsUsed = 0;
const attempted = new Set<string>();

export interface CredentialFactsSnapshot {
    summaries: CredentialSummary[] | null;
    complete: boolean;
    total: number;
    readsUsed: number;
}

interface CredentialRecord {
    uri: string;
    category?: string | null;
    title?: string | null;
}

export interface CredentialFactsSource {
    list: () => Promise<CredentialRecord[]>;
    cached: (uri: string) => unknown;
    read: (uri: string) => Promise<unknown>;
    isActive: () => boolean;
}

const emptySnapshot = (): CredentialFactsSnapshot => ({
    summaries: null,
    complete: false,
    total: 0,
    readsUsed,
});

export interface CredentialFactsLoader {
    getSnapshot: () => CredentialFactsSnapshot;
    subscribe: (listener: () => void) => () => void;
    acquire: () => () => void;
    stop: () => void;
    refresh: (source: CredentialFactsSource, force?: boolean) => Promise<void>;
}

/** Create an isolated loader for one account. No credential facts enter React Query. */
export const createCredentialFactsLoader = (did: string): CredentialFactsLoader => {
    let snapshot = emptySnapshot();
    let generation = 0;
    let running: Promise<void> | null = null;
    let lastRefresh = 0;
    let cancelIdle: (() => void) | undefined;
    let releaseFactListener: (() => void) | undefined;
    let users = 0;
    const listeners = new Set<() => void>();
    const claimed = new Map<string, CredentialSummary>();

    const getSnapshot = (): CredentialFactsSnapshot => snapshot;

    const subscribe = (listener: () => void): (() => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    const publish = (nextSnapshot: CredentialFactsSnapshot): void => {
        snapshot = { ...nextSnapshot, readsUsed };
        listeners.forEach(listener => listener());
    };

    const stop = (): void => {
        generation += 1;
        cancelIdle?.();
        if (users === 0) {
            releaseFactListener?.();
            releaseFactListener = undefined;
        }
        claimed.clear();
        lastRefresh = 0;
        publish(emptySnapshot());
    };

    const acquire = (): (() => void) => {
        users += 1;
        if (!releaseFactListener) {
            releaseFactListener = onCredentialSummaryAdded((summaryDid, summary) => {
                if (summaryDid !== did) return;
                claimed.set(summary.uri, summary);
                const facts = new Map((snapshot.summaries ?? []).map(fact => [fact.uri, fact]));
                const added = !facts.has(summary.uri);
                facts.set(summary.uri, summary);
                publish({
                    ...snapshot,
                    summaries: [...facts.values()],
                    total: snapshot.total + Number(added),
                });
            });
        }
        return () => {
            users -= 1;
            if (users === 0) stop();
        };
    };

    const idle = (): Promise<void> =>
        new Promise(resolve => {
            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                const id = window.requestIdleCallback(
                    () => {
                        cancelIdle = undefined;
                        resolve();
                    },
                    { timeout: 1000 }
                );
                cancelIdle = () => {
                    window.cancelIdleCallback(id);
                    resolve();
                };
            } else {
                const id = setTimeout(() => {
                    cancelIdle = undefined;
                    resolve();
                }, 0);
                cancelIdle = () => {
                    clearTimeout(id);
                    resolve();
                };
            }
        });

    const refresh = async (source: CredentialFactsSource, force = false): Promise<void> => {
        if (running) {
            await running;
            if (force || (snapshot.summaries === null && source.isActive())) {
                return refresh(source, force);
            }
            return;
        }
        if (!source.isActive() || (!force && Date.now() - lastRefresh < RESUME_THROTTLE_MS)) return;
        const refreshGeneration = generation;
        claimed.clear();
        const active = (): boolean => refreshGeneration === generation && source.isActive();
        const run = async (): Promise<void> => {
            try {
                const cached = await loadCredentialFacts(did);
                if (!active()) return;
                publish({ ...snapshot, summaries: cached, complete: false });
                const records = await source.list();
                if (!active()) return;
                const unique = new Map(records.map(record => [record.uri, record]));
                const uris = new Set([...unique.keys(), ...claimed.keys()]);
                await removeMissingCredentialFacts(did, uris);
                if (!active()) return;
                const facts = new Map(
                    cached.filter(fact => uris.has(fact.uri)).map(fact => [fact.uri, fact])
                );
                const publishFacts = (): void => {
                    if (!active()) return;
                    claimed.forEach((fact, uri) => {
                        facts.set(uri, fact);
                        uris.add(uri);
                    });
                    publish({
                        summaries: [...facts.values()],
                        complete: facts.size === uris.size,
                        total: uris.size,
                        readsUsed,
                    });
                };
                // Categories can change without changing the encrypted credential URI.
                for (const record of unique.values()) {
                    if (!active()) return;
                    const fact = facts.get(record.uri);
                    const indexedName = record.title?.trim() || null;
                    if (
                        fact &&
                        (fact.category !== (record.category ?? null) ||
                            (indexedName !== null && fact.name !== indexedName))
                    ) {
                        const updated = {
                            ...fact,
                            name: indexedName ?? fact.name,
                            category: record.category ?? null,
                        };
                        await saveCredentialFact(did, updated);
                        facts.set(record.uri, updated);
                    }
                }
                const missing = [...unique.values()].filter(record => {
                    const fact = facts.get(record.uri);

                    return !fact || (force && fact.name === undefined);
                });
                publishFacts();
                for (let offset = 0; offset < missing.length; offset += 4) {
                    await idle();
                    if (!active()) return;
                    await Promise.all(
                        missing.slice(offset, offset + 4).map(async record => {
                            if (claimed.has(record.uri)) return;
                            const key = `${did}:${record.uri}`;
                            const resolved = source.cached(record.uri);
                            if (resolved == null) {
                                if (readsUsed >= MAX_SESSION_DECRYPTS) return;
                                if (!force && attempted.has(key)) return;
                                attempted.add(key);
                                readsUsed += 1;
                            }
                            try {
                                const vc = resolved ?? (await source.read(record.uri));
                                if (!active() || !vc) return;
                                const summarized = trySummarizeCredential(
                                    record.uri,
                                    vc,
                                    record.category
                                );
                                if (!summarized) return;
                                const summary = {
                                    ...summarized,
                                    name: record.title?.trim() || summarized.name,
                                };
                                await saveCredentialFact(did, summary);
                                if (active()) facts.set(record.uri, summary);
                            } catch {
                                // Failed reads remain incomplete and can be retried in a later session.
                            }
                        })
                    );
                    publishFacts();
                }
                if (active()) lastRefresh = Date.now();
            } catch {
                if (active()) publish({ ...snapshot, complete: false });
            }
        };
        running = run();
        try {
            await running;
        } finally {
            running = null;
        }
    };

    return { getSnapshot, subscribe, acquire, stop, refresh };
};

const loaders = new Map<string, CredentialFactsLoader>();

export const getCredentialFactsLoader = (did: string): CredentialFactsLoader => {
    let loader = loaders.get(did);
    if (!loader) {
        loader = createCredentialFactsLoader(did);
        loaders.set(did, loader);
    }
    return loader;
};

export const stopCredentialFactsLoaders = (): void => {
    loaders.forEach(loader => loader.stop());
};
