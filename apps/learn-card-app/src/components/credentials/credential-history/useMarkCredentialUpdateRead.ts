import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useWallet } from 'learn-card-base';
import type { LCR } from 'learn-card-base/types/credential-records';

const log = getLogger('credential-history');

/**
 * Clears the unread refresh indicator on a LearnCloud index record (LC-2117, LC-2135,
 * LC-2136).
 *
 * The returned callback persists `refresh.unreadUpdate: false` on the same encrypted
 * index record, preserving the rest of the refresh metadata (including the update
 * date, which keeps rendering after the pill disappears). Callers invoke it only
 * after the latest credential has successfully rendered in a detail view; the
 * indicator is cleared only when the persistence succeeds — credential and index
 * queries are invalidated so views refetch the cleared record, and on failure the
 * unread state is left untouched so the pill remains.
 *
 * Resolves `true` when the cleared flag was persisted, `false` otherwise.
 */
export const useMarkCredentialUpdateRead = (record?: Partial<LCR>) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const recordId = record?.id;
    const recordUri = record?.uri;
    const unreadUpdate = record?.refresh?.unreadUpdate;
    const managedVersion = record?.refresh?.managedVersion;

    return useCallback(async (): Promise<boolean> => {
        if (!recordId || !unreadUpdate) return false;

        try {
            const wallet = await initWallet();
            const records = await wallet.index.LearnCloud.get({ id: recordId });
            const current = records?.[0] as LCR | undefined;
            const currentRefresh = current?.refresh;

            // The user viewed the version represented by `record`. If another refresh
            // advanced the record before this callback persisted, leave the newer
            // version unread and preserve its URI/history/ETag metadata.
            const recordAdvanced =
                !current ||
                current.uri !== recordUri ||
                (managedVersion !== undefined && currentRefresh?.managedVersion !== managedVersion);

            if (recordAdvanced || !currentRefresh?.unreadUpdate) return false;

            const updated = await wallet.index.LearnCloud.update(recordId, {
                refresh: { ...currentRefresh, unreadUpdate: false },
            });

            if (!updated) {
                log.warn('refresh.markRead.persist-failed', { recordId });

                return false;
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetRecordForUri'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetIDs'] }),
            ]);

            return true;
        } catch (error) {
            log.warn('refresh.markRead.failed', error, { recordId });

            return false;
        }
    }, [recordId, recordUri, unreadUpdate, managedVersion, initWallet, queryClient]);
};
