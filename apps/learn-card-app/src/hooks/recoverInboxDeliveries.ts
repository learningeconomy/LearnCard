import type { VC } from '@learncard/types';
import { getCategoryForCredential } from 'learn-card-base';
import type { useWallet } from 'learn-card-base';

type Wallet = Awaited<ReturnType<ReturnType<typeof useWallet>['initWallet']>>;

/** Save recovery deliveries once, using persistent index records rather than a session cache. */
export const recoverInboxDeliveries = async (
    wallet: Wallet,
    onStored: (credential: VC) => void = () => {}
): Promise<{ stored: number; failed: number }> => {
    let stored = 0;
    let failed = 0;
    let cursor: string | undefined;
    const cursors = new Set<string>();

    let hasMore = true;
    while (hasMore) {
        const page = await wallet.invoke.recoverInboxCredentials({ limit: 100, cursor });
        for (const delivery of page.records) {
            try {
                // The inbox id also works for credentials without a VC id. Preserve the
                // normal claim path's VC index id to avoid duplicating an already-saved claim.
                const id = delivery.credential.id || `inbox:${delivery.id}`;
                const existing = await wallet.index.LearnCloud.get({
                    inboxDeliveryId: delivery.id,
                });
                if (existing.length || (await wallet.index.LearnCloud.get({ id })).length) continue;
                const category = await getCategoryForCredential(delivery.credential, wallet, false);
                const uri = await wallet.store.LearnCloud.uploadEncrypted?.(delivery.credential);
                if (!uri) throw new Error('Recovery upload did not return a URI');
                const added = await wallet.index.LearnCloud.add({
                    id,
                    uri,
                    category,
                    inboxDeliveryId: delivery.id,
                });
                if (!added) throw new Error('Recovery credential was not indexed');
                stored += 1;
                onStored(delivery.credential);
            } catch {
                // A failed upload/index must remain retryable, without blocking other records.
                failed += 1;
            }
        }
        hasMore = page.hasMore;
        if (!hasMore) break;
        const nextCursor = page.cursor;
        if (!nextCursor || cursors.has(nextCursor)) throw new Error('Invalid recovery cursor');
        cursor = nextCursor;
        cursors.add(nextCursor);
    }

    return { stored, failed };
};
