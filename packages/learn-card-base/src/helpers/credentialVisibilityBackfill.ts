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

/** @internal tests only */
export const resetCredentialVisibilityBackfillForTests = () => {
    completed.clear();
    runs.clear();
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
 * out by hash. Metadata is encrypted, so only the client can do this. Idempotent; only a
 * complete scan with every update applied is persisted, otherwise it retries next session.
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
        let cursor: string | undefined;
        let incomplete = false;
        let changed = false;
        type Page = { records?: LCR[]; hasMore?: boolean; cursor?: string };
        do {
            let page: Page | undefined;
            try {
                page = (await wallet.index.LearnCloud.getPage?.({}, { cursor, limit: 100 })) as
                    Page | undefined;
            } catch (error) {
                log.warn('Failed to scan wallet index for visibility backfill', error);
                incomplete = true;
                break;
            }
            if (!page || (page.hasMore && !page.cursor)) {
                incomplete = true;
                break;
            }
            for (const record of page.records ?? []) {
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
            cursor = page.hasMore ? page.cursor : undefined;
        } while (cursor);

        if (changed && queryClient) {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetVisibleCredentialCount'] }),
            ]).catch(error => log.warn('Failed to invalidate credential caches', error));
        }
        if (!incomplete) markComplete(key);
    })();

    const safeRun = run
        .catch(error => log.warn('Visibility backfill stopped unexpectedly', error))
        .finally(() => runs.delete(key));
    runs.set(key, safeRun);
    await safeRun;
};
