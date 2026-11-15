import type { QueryClient } from '@tanstack/react-query';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { isCredentialCollectionRecordVisible } from './credentialCollection';
import { getLogger } from '../logging/logger';

const log = getLogger('credential-visibility-backfill');

const completed = new Set<string>();
const listeners = new Set<() => void>();
const runs = new Map<string, Promise<void>>();

export const getCredentialVisibilityBackfillKey = (did: string, cloudUrl = '') =>
    `credential-visibility-backfill:v1:${cloudUrl}:${did}`;

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

/**
 * True once any device has finished this account's backfill. Reads the LearnCloud marker,
 * unless this device already knows, and remembers a marker it finds. Callers in the same
 * tick share one read, so it goes out in the same batched request as the counts. A failed
 * read counts as no marker.
 */
export const readCredentialVisibilityMarker = (
    wallet: BespokeLearnCard,
    cloudUrl = ''
): Promise<boolean> => {
    const key = getCredentialVisibilityBackfillKey(wallet.id.did(), cloudUrl);
    if (isCredentialVisibilityBackfillComplete(key)) return Promise.resolve(true);
    const existing = markerReads.get(key);
    if (existing) return existing;
    const read = (async () => {
        try {
            const count = await wallet.invoke.learnCloudCount?.(CREDENTIAL_VISIBILITY_MARKER);
            if (Number(count) > 0) {
                markComplete(key);
                return true;
            }
        } catch {
            // No marker: the caller falls back to reading the index.
        }
        return false;
    })().finally(() => markerReads.delete(key));
    markerReads.set(key, read);
    return read;
};

/** Page size for reading the whole index; one request for nearly every account. */
export const CREDENTIAL_INDEX_SNAPSHOT_LIMIT = 1000;

const snapshotLoads = new Map<string, Promise<LCR[]>>();

/**
 * Every index record, in 1000-record pages. Concurrent callers (the counts' fallback and the
 * backfill) share one read. Rejects if any page fails or a page can't be continued.
 */
export const loadCredentialIndexSnapshot = (wallet: BespokeLearnCard): Promise<LCR[]> => {
    const key = wallet.id.did();
    const existing = snapshotLoads.get(key);
    if (existing) return existing;
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
 * complete scan with every update applied leaves the LearnCloud marker and is remembered,
 * otherwise it retries next session. Skipped when another device left the marker.
 */
export const reconcileCredentialVisibility = async (
    wallet: BespokeLearnCard,
    queryClient?: QueryClient,
    cloudUrl = ''
): Promise<void> => {
    const key = getCredentialVisibilityBackfillKey(wallet.id.did(), cloudUrl);
    if (isCredentialVisibilityBackfillComplete(key)) return;
    const existing = runs.get(key);
    if (existing) return existing;

    const run = (async () => {
        // Another device already finished it: nothing to scan here.
        if (await readCredentialVisibilityMarker(wallet, cloudUrl)) return;

        let records: LCR[];
        try {
            records = await loadCredentialIndexSnapshot(wallet);
        } catch (error) {
            log.warn('Failed to scan wallet index for visibility backfill', error);
            return;
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
        if (marked) markComplete(key);

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
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
            ]).catch(error => log.warn('Failed to invalidate credential caches', error));
        }
    })();

    const safeRun = run
        .catch(error => log.warn('Visibility backfill stopped unexpectedly', error))
        .finally(() => runs.delete(key));
    runs.set(key, safeRun);
    await safeRun;
};
