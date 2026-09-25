import { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import type { ShareLink, ShareLinkOwnerCommitOutput } from '@learncard/types';
import { buildShareLinkUrl } from 'learn-card-base/helpers/share-links';
import { ToastTypeEnum, useToast, useWallet } from 'learn-card-base';

import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import { readShareRecovery, shareWallet } from '../../components/share-links/shareLinkFlow';
import * as m from '../../paraglide/messages.js';
import { loadSavedCredentialCollections } from './savedCollections';
import type {
    DataSharingSharedLinksViewModel,
    SavedCredentialCollection,
    SharedLinkFilter,
} from './DataSharingCenter.types';

const PAGE_SIZE = 25;

const completedShare = async (
    result: ShareLinkOwnerCommitOutput,
    wallet: ReturnType<typeof shareWallet>
): Promise<ShareLink> => {
    if (result.status === 'completed') return result.share;
    const retried = await wallet.invoke.retryShareLinkOperation({
        id: result.id,
        operationId: result.operationId,
    });
    if (retried.status !== 'completed') throw new Error('pending');
    return retried.share;
};

export const useSharedLinks = (
    enabled: boolean,
    showViewStats: boolean,
    onPreview: (share: ShareLink) => void,
    onPreviewSavedCollection: (collection: SavedCredentialCollection) => void,
    onUpdate: (share: ShareLink) => void,
    onCreateShare: () => void
): DataSharingSharedLinksViewModel | null => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const walletRef = useRef(initWallet);
    walletRef.current = initWallet;
    const [records, setRecords] = useState<ShareLink[]>([]);
    const [cursor, setCursor] = useState<string>();
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [filter, setFilter] = useState<SharedLinkFilter>('active');
    const [savedCollections, setSavedCollections] = useState<SavedCredentialCollection[]>([]);
    const [savedCollectionsLoading, setSavedCollectionsLoading] = useState(false);
    const [savedCollectionsError, setSavedCollectionsError] = useState(false);
    const savedCollectionsLoadedRef = useRef(false);

    const load = useCallback(async (pageCursor?: string): Promise<void> => {
        const append = Boolean(pageCursor);
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        setError(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            const page = await wallet.invoke.listShareLinks({
                limit: PAGE_SIZE,
                ...(pageCursor ? { cursor: pageCursor } : {}),
            });
            setRecords(current =>
                append
                    ? [
                          ...new Map(
                              [...current, ...page.records].map(record => [record.id, record])
                          ).values(),
                      ]
                    : page.records
            );
            setCursor(page.cursor);
            setHasMore(page.hasMore);
        } catch {
            setError(true);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) void load();
    }, [enabled, load]);

    const loadSavedCollections = useCallback(async (): Promise<void> => {
        setSavedCollectionsLoading(true);
        setSavedCollectionsError(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            setSavedCollections(await loadSavedCredentialCollections(wallet));
            savedCollectionsLoadedRef.current = true;
        } catch {
            setSavedCollectionsError(true);
        } finally {
            setSavedCollectionsLoading(false);
        }
    }, []);

    const openSavedCollections = useCallback(async (): Promise<void> => {
        if (savedCollectionsLoadedRef.current) return;
        await loadSavedCollections();
    }, [loadSavedCollections]);

    const privateUrl = useCallback(async (share: ShareLink): Promise<string> => {
        const wallet = shareWallet(await walletRef.current());
        const recovery = await readShareRecovery(wallet, share);
        return buildShareLinkUrl(new URL(getAppBaseUrl()).host, share.id, recovery.latest.key);
    }, []);

    const copy = useCallback(
        async (share: ShareLink): Promise<void> => {
            setBusyId(share.id);
            try {
                await Clipboard.write({ string: await privateUrl(share) });
                presentToast(m['dataShareCenter.shared.copied'](), {
                    type: ToastTypeEnum.Success,
                });
            } catch {
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setBusyId(null);
            }
        },
        [presentToast, privateUrl]
    );

    const replaceRecord = useCallback((share: ShareLink) => {
        setRecords(current => current.map(record => (record.id === share.id ? share : record)));
    }, []);

    const changeExpiry = useCallback(
        async (share: ShareLink, expiresAt: string | null): Promise<void> => {
            setBusyId(share.id);
            try {
                const wallet = shareWallet(await walletRef.current());
                const updated = await completedShare(
                    await wallet.invoke.updateShareLink({
                        id: share.id,
                        expectedVersion: share.version,
                        clientRequestId: crypto.randomUUID(),
                        expiresAt,
                    }),
                    wallet
                );
                replaceRecord(updated);
                presentToast(m['dataShareCenter.shared.expirySaved'](), {
                    type: ToastTypeEnum.Success,
                });
            } catch {
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
                throw new Error('expiry');
            } finally {
                setBusyId(null);
            }
        },
        [presentToast, replaceRecord]
    );

    const stop = useCallback(
        async (share: ShareLink): Promise<void> => {
            setBusyId(share.id);
            try {
                const wallet = shareWallet(await walletRef.current());
                const stopped = await completedShare(
                    await wallet.invoke.revokeShareLink({
                        id: share.id,
                        expectedVersion: share.version,
                        clientRequestId: crypto.randomUUID(),
                    }),
                    wallet
                );
                replaceRecord(stopped);
                presentToast(m['dataShareCenter.shared.stoppedToast'](), {
                    type: ToastTypeEnum.Success,
                });
            } catch {
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
                throw new Error('stop');
            } finally {
                setBusyId(null);
            }
        },
        [presentToast, replaceRecord]
    );

    if (!enabled) return null;

    return {
        records,
        filter,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        busyId,
        showViewStats,
        savedCollections: {
            records: savedCollections,
            isLoading: savedCollectionsLoading,
            error: savedCollectionsError,
            onOpen: openSavedCollections,
            onRefresh: loadSavedCollections,
            onPreview: onPreviewSavedCollection,
        },
        onFilterChange: setFilter,
        onRefresh: () => load(),
        onLoadMore: () => (cursor ? load(cursor) : Promise.resolve()),
        onCopy: copy,
        onGetPrivateUrl: privateUrl,
        onChangeExpiry: changeExpiry,
        onStop: stop,
        onPreview,
        onUpdate,
        onCreateShare,
    };
};
