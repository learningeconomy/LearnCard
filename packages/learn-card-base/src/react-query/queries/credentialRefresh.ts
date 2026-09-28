import { useQuery } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import { getSupportedRefreshService } from '@learncard/helpers';

import { switchedProfileStore, useWallet } from 'learn-card-base';

import { CREDENTIAL_REFRESH_CHECK_INTERVAL_MS } from '../../helpers/credentialRefresh';
import { getLogger } from '../../logging/logger';
import type { BespokeLearnCard } from '../../types/learn-card';
import type { LCR } from '../../types/credential-records';

const log = getLogger('credential-refresh-queries');

/**
 * Refresh candidate discovery and foreground-scan helpers (LC-2117, LC-2135, LC-2136).
 *
 * Candidates are LearnCloud index records that carry encrypted `refresh` metadata,
 * plus existing external credentials discovered lazily by resolving the credential
 * and inspecting its `refreshService` — no server-side migration is required.
 * Discovery keeps only per-session process memory; staleness is derived from the
 * encrypted record's `lastCheckedAt` timestamp. There is no server scheduler.
 */

/** Bounded concurrency for candidate discovery lazy reads and scan processing */
export const CREDENTIAL_REFRESH_SCAN_CONCURRENCY = 3;

/**
 * Processes items with a bounded worker pool. Worker errors propagate — callers
 * isolate per-item failures by catching inside the worker.
 */
export const processWithConcurrency = async <T>(
    items: readonly T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
): Promise<void> => {
    const queue = [...items];

    const runners = Array.from(
        { length: Math.max(1, Math.min(concurrency, queue.length)) },
        async () => {
            while (queue.length > 0) {
                const item = queue.shift() as T;

                await worker(item);
            }
        }
    );

    await Promise.all(runners);
};

/**
 * A refresh candidate is stale when it has never been checked or its last check is
 * older than the named 24-hour check interval. Records without refresh metadata are
 * always stale (they have never been checked).
 */
export const isCredentialRefreshCandidateStale = (
    record: LCR,
    now: number = Date.now()
): boolean => {
    const lastCheckedAt = record.refresh?.lastCheckedAt;

    if (!lastCheckedAt) return true;

    const parsed = Date.parse(lastCheckedAt);

    if (Number.isNaN(parsed)) return true;

    return now - parsed >= CREDENTIAL_REFRESH_CHECK_INTERVAL_MS;
};

/**
 * Reads the encrypted LearnCloud index and returns refresh candidates: records with
 * `refresh` metadata, plus records whose lazily resolved credential carries a
 * supported `refreshService`. A credential that cannot be resolved is skipped
 * without failing discovery.
 */
export const getCredentialRefreshCandidates = async (wallet: BespokeLearnCard): Promise<LCR[]> => {
    const records = (await wallet.index.LearnCloud.get({})) as LCR[];

    const candidates: LCR[] = [];
    const undiscovered: LCR[] = [];

    for (const record of records) {
        if (record.refresh) candidates.push(record);
        else undiscovered.push(record);
    }

    await processWithConcurrency(
        undiscovered,
        CREDENTIAL_REFRESH_SCAN_CONCURRENCY,
        async record => {
            try {
                const vc = (await wallet.read.get(record.uri)) as VC | undefined;

                if (vc && getSupportedRefreshService(vc)) candidates.push(record);
            } catch (error) {
                // An unreadable credential is skipped without failing the scan.
                log.warn('refresh.discovery.read-failed', error);
            }
        }
    );

    return candidates;
};

/**
 * Query hook over {@link getCredentialRefreshCandidates} for views that need the
 * current refresh candidates. Foreground scanning fetches imperatively instead so
 * each scan sees a fresh index read.
 */
export const useGetCredentialRefreshCandidates = (enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCR[]>({
        queryKey: ['useGetCredentialRefreshCandidates', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            return getCredentialRefreshCandidates(wallet);
        },
        staleTime: 1000 * 60 * 5,
        enabled,
    });
};
