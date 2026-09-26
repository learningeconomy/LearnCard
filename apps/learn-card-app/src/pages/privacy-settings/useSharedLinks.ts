import { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import type { ShareLink, ShareLinkOperationKeyInput } from '@learncard/types';
import { ToastTypeEnum, useToast, useWallet } from 'learn-card-base';

import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import { environment } from '../../config/environment';
import {
    buildAppShareLinkUrl,
    classifySharePublication,
    readShareRecovery,
    shareWallet,
} from '../../components/share-links/shareLinkFlow';
import * as m from '../../paraglide/messages.js';
import { loadSavedCredentialCollections } from './savedCollections';
import type {
    DataSharingSharedLinksViewModel,
    PendingSharedLinkAction,
    SavedCredentialCollection,
    SharedLinkFilter,
} from './DataSharingCenter.types';

const PAGE_SIZE = 25;

type PendingOwnerOperation = PendingSharedLinkAction &
    ShareLinkOperationKeyInput & { baseVersion: number };

const isTransientOwnerError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return true;
    const code = (error as { data?: { code?: string } }).data?.code;
    return (
        !code ||
        ['TIMEOUT', 'INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'TOO_MANY_REQUESTS'].includes(
            code
        )
    );
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
    const [pendingOperations, setPendingOperations] = useState<
        Record<string, PendingOwnerOperation>
    >({});
    const [filter, setFilter] = useState<SharedLinkFilter>('active');
    const [savedCollections, setSavedCollections] = useState<SavedCredentialCollection[]>([]);
    const [savedCollectionsLoading, setSavedCollectionsLoading] = useState(enabled);
    const [savedCollectionsError, setSavedCollectionsError] = useState(false);
    const savedCollectionsPromiseRef = useRef<Promise<void> | null>(null);

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
            setPendingOperations(current => {
                const next = { ...current };
                for (const record of page.records) {
                    const pending = next[record.id];
                    if (
                        pending &&
                        (record.version > pending.baseVersion || record.status === 'stopped')
                    )
                        delete next[record.id];
                }
                return next;
            });
            setCursor(page.cursor);
            setHasMore(page.hasMore);
        } catch {
            setError(true);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const loadSavedCollections = useCallback((): Promise<void> => {
        if (savedCollectionsPromiseRef.current) return savedCollectionsPromiseRef.current;
        const promise = (async () => {
            setSavedCollectionsLoading(true);
            setSavedCollectionsError(false);
            try {
                const wallet = shareWallet(await walletRef.current());
                setSavedCollections(await loadSavedCredentialCollections(wallet));
            } catch {
                setSavedCollectionsError(true);
            } finally {
                setSavedCollectionsLoading(false);
                savedCollectionsPromiseRef.current = null;
            }
        })();
        savedCollectionsPromiseRef.current = promise;
        return promise;
    }, []);

    useEffect(() => {
        if (!enabled) return;
        void load();
        void loadSavedCollections();
    }, [enabled, load, loadSavedCollections]);

    const privateUrl = useCallback(async (share: ShareLink): Promise<string> => {
        const wallet = shareWallet(await walletRef.current());
        const recovery = await readShareRecovery(wallet, share);
        return buildAppShareLinkUrl(
            getAppBaseUrl(),
            share.id,
            recovery.latest.key,
            environment.DEV
        );
    }, []);

    const copy = useCallback(
        async (share: ShareLink): Promise<boolean> => {
            setBusyId(share.id);
            try {
                await Clipboard.write({ string: await privateUrl(share) });
                presentToast(m['dataShareCenter.shared.copied'](), {
                    type: ToastTypeEnum.Success,
                });
                return true;
            } catch {
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
                return false;
            } finally {
                setBusyId(null);
            }
        },
        [presentToast, privateUrl]
    );

    const replaceRecord = useCallback((share: ShareLink) => {
        setRecords(current => current.map(record => (record.id === share.id ? share : record)));
    }, []);

    const settleMutation = useCallback(
        (
            result: Parameters<typeof classifySharePublication>[0],
            shareId: string,
            action: PendingSharedLinkAction['action'],
            baseVersion: number
        ): ShareLink | undefined => {
            const outcome = classifySharePublication(result);
            if (outcome.status === 'pending') {
                setPendingOperations(current => ({
                    ...current,
                    [shareId]: { ...outcome.operation, shareId, action, baseVersion },
                }));
                return undefined;
            }
            if (outcome.status === 'abandoned') {
                setPendingOperations(current => {
                    const next = { ...current };
                    delete next[shareId];
                    return next;
                });
                throw new Error('operation');
            }
            setPendingOperations(current => {
                const next = { ...current };
                delete next[shareId];
                return next;
            });
            replaceRecord(outcome.share);
            return outcome.share;
        },
        [replaceRecord]
    );

    const changeExpiry = useCallback(
        async (share: ShareLink, expiresAt: string | null): Promise<void> => {
            setBusyId(share.id);
            try {
                const wallet = shareWallet(await walletRef.current());
                const updated = settleMutation(
                    await wallet.invoke.updateShareLink({
                        id: share.id,
                        expectedVersion: share.version,
                        clientRequestId: crypto.randomUUID(),
                        expiresAt,
                    }),
                    share.id,
                    'expiry',
                    share.version
                );
                presentToast(
                    updated
                        ? m['dataShareCenter.shared.expirySaved']()
                        : m['dataShareCenter.shared.changePending'](),
                    {
                        type: ToastTypeEnum.Success,
                    }
                );
            } catch {
                await load();
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
                throw new Error('expiry');
            } finally {
                setBusyId(null);
            }
        },
        [load, presentToast, settleMutation]
    );

    const stop = useCallback(
        async (share: ShareLink): Promise<void> => {
            setBusyId(share.id);
            try {
                const wallet = shareWallet(await walletRef.current());
                const stopped = settleMutation(
                    await wallet.invoke.revokeShareLink({
                        id: share.id,
                        expectedVersion: share.version,
                        clientRequestId: crypto.randomUUID(),
                    }),
                    share.id,
                    'stop',
                    share.version
                );
                presentToast(
                    stopped
                        ? m['dataShareCenter.shared.stoppedToast']()
                        : m['dataShareCenter.shared.changePending'](),
                    {
                        type: ToastTypeEnum.Success,
                    }
                );
            } catch {
                await load();
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
                throw new Error('stop');
            } finally {
                setBusyId(null);
            }
        },
        [load, presentToast, settleMutation]
    );

    const checkPending = useCallback(
        async (share: ShareLink): Promise<void> => {
            const pendingOperation = pendingOperations[share.id];
            if (!pendingOperation) return;
            setBusyId(share.id);
            try {
                const wallet = shareWallet(await walletRef.current());
                const updated = settleMutation(
                    await wallet.invoke.retryShareLinkOperation({
                        id: pendingOperation.id,
                        operationId: pendingOperation.operationId,
                    }),
                    share.id,
                    pendingOperation.action,
                    pendingOperation.baseVersion
                );
                presentToast(
                    !updated
                        ? m['dataShareCenter.shared.changePending']()
                        : pendingOperation.action === 'stop'
                          ? m['dataShareCenter.shared.stoppedToast']()
                          : m['dataShareCenter.shared.expirySaved'](),
                    { type: ToastTypeEnum.Success }
                );
            } catch (failure) {
                // Only transport/service uncertainty preserves the handle.
                if (
                    !isTransientOwnerError(failure) ||
                    (failure as Error)?.message === 'operation'
                ) {
                    setPendingOperations(current => {
                        const next = { ...current };
                        delete next[share.id];
                        return next;
                    });
                }
                await load();
                presentToast(m['dataShareCenter.shared.actionError'](), {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setBusyId(null);
            }
        },
        [load, pendingOperations, presentToast, settleMutation]
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
        pendingActions: Object.fromEntries(
            Object.entries(pendingOperations).map(([shareId, operation]) => [
                shareId,
                operation.action,
            ])
        ),
        showViewStats,
        savedCollections: {
            records: savedCollections,
            isLoading: savedCollectionsLoading,
            error: savedCollectionsError,
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
        onCheckPending: checkPending,
        onPreview,
        onUpdate,
        onCreateShare,
    };
};
