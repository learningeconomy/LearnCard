import type { QueryClient } from '@tanstack/react-query';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { isCredentialCollectionRecordVisible } from './credentialCollection';
import { reconcileQualificationCategories } from './qualificationCategoryBackfill';
import { getLogger } from '../logging/logger';

const log = getLogger('credential-visibility-backfill');

const completed = new Set<string>();
const listeners = new Set<() => void>();
const runs = new Map<string, Promise<boolean>>();
const backfillRuns = new Map<string, Promise<void>>();

export const getCredentialVisibilityBackfillKey = (did: string, cloudUrl = '') =>
    `credential-visibility-backfill:v1:${cloudUrl}:${did}`;

let sessionDids = new WeakMap<object, string>();
const didAliases = new Map<string, string>();

/**
 * The DID this wallet's backfill, marker read and index read are keyed by for the app session.
 * The LearnCard Network plugin reports did:key until the profile loads, then did:web, on the
 * same wallet, so the first DID seen stays the key and later ones point back to it.
 */
const getSessionDid = (wallet: BespokeLearnCard): string => {
    const did = wallet.id.did();
    const first = sessionDids.get(wallet) ?? didAliases.get(did) ?? did;
    sessionDids.set(wallet, first);
    if (did !== first) didAliases.set(did, first);
    return first;
};

const getSessionKeys = (wallet: BespokeLearnCard, cloudUrl: string) => {
    const session = getCredentialVisibilityBackfillKey(getSessionDid(wallet), cloudUrl);
    const current = getCredentialVisibilityBackfillKey(wallet.id.did(), cloudUrl);
    return { session, all: session === current ? [session] : [session, current] };
};

/**
 * True once every record this account had when the scan ran carries the `hidden` flag (or the
 * canonical 'Hidden' category) wherever the collection rules hide it. Until then the index
 * count would include unmarked internal records, so counts must come from the list walk.
 */
export const isCredentialVisibilityBackfillComplete = (key: string): boolean => {
    if (completed.has(key)) return true;
    try {
        if (typeof window !== 'undefined' && window.localStorage.getItem(key) === 'complete') {
            completed.add(key);
            return true;
        }
    } catch (error) {
        log.debug('Visibility backfill completion storage unavailable', error);
    }
    return false;
};

export const subscribeCredentialVisibilityBackfill = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const markComplete = (key: string) => {
    completed.add(key);
    try {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, 'complete');
    } catch (error) {
        log.debug('Unable to persist visibility backfill completion', error);
    }
    listeners.forEach(listener => listener());
};

/** LearnCloud custom document a finished backfill leaves, so other devices can trust the count. */
export const CREDENTIAL_VISIBILITY_MARKER = { credentialVisibilityBackfill: 'v1' } as const;

const markerReads = new Map<string, Promise<boolean>>();

const isCompleteFor = (keys: string[]) => keys.some(isCredentialVisibilityBackfillComplete);

/** True once this wallet's backfill is known finished, under any DID it had this session. */
export const isCredentialVisibilityBackfillCompleteFor = (
    wallet: BespokeLearnCard,
    cloudUrl = ''
): boolean => isCompleteFor(getSessionKeys(wallet, cloudUrl).all);

/**
 * True once any device has finished this account's backfill. Reads the LearnCloud marker once
 * per wallet per app session, unless this device already knows: every caller (the counts on
 * each page, the backfill) shares that read. A count of one or more is a marker; a failed
 * read counts as no marker, and the next caller reads again.
 */
export const readCredentialVisibilityMarker = (
    wallet: BespokeLearnCard,
    cloudUrl = ''
): Promise<boolean> => {
    const keys = getSessionKeys(wallet, cloudUrl);
    if (isCompleteFor(keys.all)) return Promise.resolve(true);
    const existing = markerReads.get(keys.session);
    if (existing) return existing;
    const read: Promise<boolean> = (async () => {
        const count = await wallet.invoke.learnCloudCount?.(CREDENTIAL_VISIBILITY_MARKER);
        // Two devices can both finish before either sees the other's marker; any count is done.
        if (Number(count) >= 1) {
            keys.all.forEach(markComplete);
            return true;
        }
        return false;
    })().catch(() => {
        if (markerReads.get(keys.session) === read) markerReads.delete(keys.session);
        return false;
    });
    markerReads.set(keys.session, read);
    return read;
};

/** Page size for reading the whole index; one request for nearly every account. */
export const CREDENTIAL_INDEX_SNAPSHOT_LIMIT = 1000;

const snapshotLoads = new Map<string, Promise<LCR[]>>();
const lastSnapshots = new Map<string, { loadedAt: number; records: LCR[] }>();

/** How old a finished read the backfill reuses, so it doesn't read the index right after the counts did. */
export const CREDENTIAL_INDEX_SNAPSHOT_REUSE_MS = 60_000;

/**
 * Every index record, in 1000-record pages. Concurrent callers (the counts' fallback and the
 * backfill) share one read. With `maxAgeMs`, a finished read at most that old is reused.
 * Rejects if any page fails or a page can't be continued.
 */
export const loadCredentialIndexSnapshot = (
    wallet: BespokeLearnCard,
    { maxAgeMs = 0 }: { maxAgeMs?: number } = {}
): Promise<LCR[]> => {
    const key = getSessionDid(wallet);
    const existing = snapshotLoads.get(key);
    if (existing) return existing;
    const last = lastSnapshots.get(key);
    if (last && Date.now() - last.loadedAt <= maxAgeMs) return Promise.resolve(last.records);
    type Page = { records?: LCR[]; hasMore?: boolean; cursor?: string };
    const load = (async () => {
        const records: LCR[] = [];
        let cursor: string | undefined;
        do {
            const page = (await wallet.index.LearnCloud.getPage?.(
                {},
                { cursor, limit: CREDENTIAL_INDEX_SNAPSHOT_LIMIT }
            )) as Page | undefined;
            if (!page || (page.hasMore && !page.cursor)) throw new Error('Index read incomplete');
            records.push(...(page.records ?? []));
            cursor = page.hasMore ? page.cursor : undefined;
        } while (cursor);
        lastSnapshots.set(key, { loadedAt: Date.now(), records });
        return records;
    })().finally(() => snapshotLoads.delete(key));
    snapshotLoads.set(key, load);
    return load;
};

/** @internal tests only */
export const resetCredentialVisibilityBackfillForTests = () => {
    completed.clear();
    runs.clear();
    markerReads.clear();
    snapshotLoads.clear();
    lastSnapshots.clear();
    backfillRuns.clear();
    sessionDids = new WeakMap();
    didAliases.clear();
};

/** The change, if any, that makes a record's stored metadata say what the collection shows. */
const getVisibilityUpdate = (record: LCR): Partial<LCR> | undefined => {
    const category = record.category as string | undefined;
    if (category?.toLowerCase() === 'hidden') {
        return category === 'Hidden' ? undefined : { category: 'Hidden' as LCR['category'] };
    }
    if (isCredentialCollectionRecordVisible(record) || record.hidden === true) return undefined;
    return { hidden: true };
};

/**
 * Once per account/cloud: mark every record the collection hides with `hidden: true`, and
 * spell the holder-facing Hidden category canonically, so the index count can leave both
 * out by hash. Metadata is encrypted, so only the client can do this. Idempotent; a
 * complete scan with every update applied leaves the LearnCloud marker and is remembered.
 * Skipped when another device left the marker. Resolves true once the marker exists.
 */
export const reconcileCredentialVisibility = async (
    wallet: BespokeLearnCard,
    queryClient?: QueryClient,
    cloudUrl = ''
): Promise<boolean> => {
    const keys = getSessionKeys(wallet, cloudUrl);
    const key = keys.session;
    if (isCompleteFor(keys.all)) return true;
    const existing = runs.get(key);
    if (existing) return existing;

    const run = (async () => {
        // Another device already finished it: nothing to scan here.
        if (await readCredentialVisibilityMarker(wallet, cloudUrl)) return true;

        let records: LCR[];
        try {
            // Usually the read the counts just made on this device.
            records = await loadCredentialIndexSnapshot(wallet, {
                maxAgeMs: CREDENTIAL_INDEX_SNAPSHOT_REUSE_MS,
            });
        } catch (error) {
            log.warn('Failed to scan wallet index for visibility backfill', error);
            return false;
        }
        let incomplete = false;
        let changed = false;
        for (const record of records) {
            const update = getVisibilityUpdate(record);
            if (!update) continue;
            if (!record.id) {
                incomplete = true;
                continue;
            }
            try {
                if (await wallet.index.LearnCloud.update(record.id, update)) changed = true;
                else incomplete = true;
            } catch (error) {
                log.warn('Failed to mark record visibility', { recordId: record.id, error });
                incomplete = true;
            }
        }

        // Other devices trust the count once this marker exists; without it, retry next session.
        let marked = false;
        if (!incomplete) {
            try {
                marked = Boolean(
                    await wallet.invoke.learnCloudCreate?.(CREDENTIAL_VISIBILITY_MARKER)
                );
            } catch {
                marked = false;
            }
        }
        if (marked) keys.all.forEach(markComplete);

        // Counts read before the marker existed were not trusted, so they refetch too.
        if ((changed || marked) && queryClient) {
            await Promise.all([
                ...(changed
                    ? [
                          queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
                          queryClient.invalidateQueries({
                              queryKey: ['useGetVisibleCredentialCount'],
                          }),
                      ]
                    : []),
                // Not the 1000-record read: the counts stop using it once the marker exists.
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialCount'],
                    predicate: query => query.queryKey[4] !== 'index-snapshot',
                }),
            ]).catch(error => log.warn('Failed to invalidate credential caches', error));
        }
        return marked;
    })();

    const safeRun = run
        .catch(error => {
            log.warn('Visibility backfill stopped unexpectedly', error);
            return false;
        })
        .finally(() => runs.delete(key));
    runs.set(key, safeRun);
    return safeRun;
};

/**
 * Both wallet index backfills, one after the other (both read-modify-write index records).
 * Visibility goes first, since the Passport/Home counts wait on its marker. The app shell
 * starts it, and so do the counts when the marker is missing (the demo login skips the auth
 * coordinator). Every caller for this wallet in the app session shares one run: kept once the
 * marker exists, dropped otherwise so the next caller can retry.
 */
export const runCredentialIndexBackfills = (
    wallet: BespokeLearnCard,
    queryClient?: QueryClient,
    cloudUrl = ''
): Promise<void> => {
    const key = getSessionKeys(wallet, cloudUrl).session;
    const existing = backfillRuns.get(key);
    if (existing) return existing;
    // Neither backfill rejects; each one handles its own failures.
    const run: Promise<void> = reconcileCredentialVisibility(wallet, queryClient, cloudUrl)
        .catch(() => false)
        .then(async marked => {
            await reconcileQualificationCategories(wallet, queryClient, cloudUrl).catch(
                () => undefined
            );
            if (!marked && backfillRuns.get(key) === run) backfillRuns.delete(key);
        });
    backfillRuns.set(key, run);
    return run;
};
