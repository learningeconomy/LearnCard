import React, { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    addOutline,
    bookmarkOutline,
    calendarOutline,
    copyOutline,
    createOutline,
    eyeOutline,
    lockClosedOutline,
    lockOpenOutline,
    qrCodeOutline,
    refreshOutline,
    stopCircleOutline,
    timeOutline,
} from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';

import * as m from '../../../paraglide/messages.js';
import type {
    DataSharingSharedLinksViewModel,
    SavedCredentialCollection,
    SharedLinkFilter,
} from '../DataSharingCenter.types';
import GlassCard from './GlassCard';

type RowPanel = 'qr' | 'expiry' | 'update' | 'stop';
type SharedSectionView = 'my-shares' | 'saved-collections';

export const getSharedLinkViewStatus = (
    share: Pick<ShareLink, 'status' | 'expiresAt'>,
    now = Date.now()
): SharedLinkFilter => {
    if (share.status === 'stopped') return 'stopped';
    if (share.expiresAt && new Date(share.expiresAt).getTime() <= now) return 'expired';
    return 'active';
};

export const localDateValue = (value: Date): string => {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const dateValue = (value: string | null): string => (value ? localDateValue(new Date(value)) : '');

export const minimumExpiryDateValue = (now = new Date()): string => {
    const minimum = new Date(now);
    minimum.setDate(minimum.getDate() + 1);
    return localDateValue(minimum);
};

const credentialCountLabel = (count: number): string =>
    count === 1
        ? m['dataShareCenter.shared.credentialCountOne']({ count: String(count) })
        : m['dataShareCenter.shared.credentialCount']({ count: String(count) });

const statusLabel = (status: SharedLinkFilter): string =>
    ({
        active: m['dataShareCenter.shared.active'](),
        expired: m['dataShareCenter.shared.expired'](),
        stopped: m['dataShareCenter.shared.stopped'](),
    })[status];

const statusClass = (status: SharedLinkFilter): string =>
    status === 'active'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'expired'
          ? 'bg-amber-50 text-amber-900'
          : 'bg-grayscale-100 text-grayscale-700';

const actionClass =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-[20px] border border-grayscale-300 text-xs font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const primaryActionClass =
    'inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryActionClass =
    'inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-4 py-2.5 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40';
const textActionClass =
    'inline-flex items-center gap-1.5 py-2 text-xs font-medium text-grayscale-600 transition-colors hover:text-grayscale-900 disabled:cursor-not-allowed disabled:opacity-40';

const ShareLinkRow = ({ share, vm }: { share: ShareLink; vm: DataSharingSharedLinksViewModel }) => {
    const status = getSharedLinkViewStatus(share);
    const [panel, setPanel] = useState<RowPanel | null>(null);
    const [privateUrl, setPrivateUrl] = useState('');
    const [panelError, setPanelError] = useState(false);
    const [expiry, setExpiry] = useState(dateValue(share.expiresAt));
    const busy = vm.busyId === share.id;
    const pending = Boolean(vm.pendingActions[share.id]);
    const mutationsBlocked = pending;
    const minimumExpiry = minimumExpiryDateValue();
    const canEdit = status !== 'stopped' && share.contentState === 'finalized';
    const canPreview = status !== 'stopped' && share.contentState === 'finalized';

    const showQr = async () => {
        if (panel === 'qr') {
            setPanel(null);
            return;
        }
        setPanel('qr');
        setPanelError(false);
        try {
            setPrivateUrl(await vm.onGetPrivateUrl(share));
        } catch {
            setPanelError(true);
        }
    };

    const saveExpiry = async () => {
        setPanelError(false);
        if (expiry && expiry < minimumExpiry) {
            setPanelError(true);
            return;
        }
        try {
            await vm.onChangeExpiry(
                share,
                expiry ? new Date(`${expiry}T23:59:59.999`).toISOString() : null
            );
            setPanel(null);
        } catch {
            setPanelError(true);
        }
    };

    const stop = async () => {
        setPanelError(false);
        try {
            await vm.onStop(share);
            setPanel(null);
        } catch {
            setPanelError(true);
        }
    };

    return (
        <article className="p-5 border-b border-grayscale-100 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h4 className="font-medium text-grayscale-900 break-words">{share.title}</h4>
                    {share.note && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-grayscale-600">
                            {share.note}
                        </p>
                    )}
                    {canPreview ? (
                        <button
                            type="button"
                            aria-label={m['dataShareCenter.shared.viewCredentials']({
                                count: String(share.selectedCount),
                            })}
                            onClick={() => vm.onPreview(share)}
                            className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-grayscale-600 underline decoration-grayscale-300 underline-offset-4 transition-colors hover:text-grayscale-900"
                        >
                            <IonIcon icon={eyeOutline} />
                            {credentialCountLabel(share.selectedCount)}
                        </button>
                    ) : (
                        <p className="mt-1 text-xs text-grayscale-600">
                            {credentialCountLabel(share.selectedCount)}
                        </p>
                    )}
                </div>
                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}
                >
                    {statusLabel(status)}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-grayscale-600">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-medium ${share.passcodeProtected ? 'bg-emerald-50 text-emerald-700' : 'bg-grayscale-100 text-grayscale-600'}`}
                >
                    <IonIcon icon={share.passcodeProtected ? lockClosedOutline : lockOpenOutline} />
                    {share.passcodeProtected
                        ? m['dataShareCenter.shared.passcodeProtected']()
                        : m['dataShareCenter.shared.passcodeOff']()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-grayscale-100 px-2.5 py-1.5">
                    <IonIcon icon={calendarOutline} />
                    {m['dataShareCenter.shared.created']({
                        date: new Date(share.createdAt).toLocaleDateString(),
                    })}
                </span>
                {status === 'active' && share.expiresAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grayscale-100 px-2.5 py-1.5">
                        <IonIcon icon={timeOutline} />
                        {m['dataShareCenter.shared.expires']({
                            date: new Date(share.expiresAt).toLocaleDateString(),
                        })}
                    </span>
                )}
                {status === 'expired' && share.expiresAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-amber-900">
                        <IonIcon icon={timeOutline} />
                        {m['dataShareCenter.shared.expiredOn']({
                            date: new Date(share.expiresAt).toLocaleDateString(),
                        })}
                    </span>
                )}
                {vm.showViewStats && share.viewCount !== undefined && share.viewCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grayscale-100 px-2.5 py-1.5">
                        <IonIcon icon={eyeOutline} />
                        {m['dataShareCenter.shared.viewed']({
                            count: String(share.viewCount),
                            date: share.lastViewedAt
                                ? new Date(share.lastViewedAt).toLocaleDateString()
                                : m['dataShareCenter.shared.recently'](),
                        })}
                    </span>
                )}
                {vm.showViewStats && share.viewCount === 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grayscale-100 px-2.5 py-1.5">
                        <IonIcon icon={eyeOutline} />
                        {m['dataShareCenter.shared.notViewed']()}
                    </span>
                )}
            </div>

            {pending && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm leading-relaxed text-amber-900">
                        {m['dataShareCenter.shared.changePending']()}
                    </p>
                    <button
                        type="button"
                        className={`${actionClass} mt-3 border-amber-200 bg-white text-amber-900`}
                        disabled={busy}
                        onClick={() => void vm.onCheckPending(share)}
                    >
                        <IonIcon icon={refreshOutline} />
                        {busy
                            ? m['dataShareCenter.shared.checking']()
                            : m['dataShareCenter.shared.checkAgain']()}
                    </button>
                </div>
            )}

            {status === 'stopped' ? (
                <div className="mt-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['dataShareCenter.shared.stoppedExplanation']()}
                    </p>
                    <button className={`${primaryActionClass} mt-3`} onClick={vm.onCreateShare}>
                        <IonIcon icon={addOutline} /> {m['dataShareCenter.shared.shareAgain']()}
                    </button>
                </div>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                            className={primaryActionClass}
                            disabled={!canEdit || busy}
                            onClick={() => void vm.onCopy(share)}
                        >
                            <IonIcon icon={copyOutline} /> {m['dataShareCenter.shared.copy']()}
                        </button>
                        <button
                            className={secondaryActionClass}
                            disabled={!canEdit || busy}
                            onClick={() => void showQr()}
                        >
                            <IonIcon icon={qrCodeOutline} /> {m['dataShareCenter.shared.showQr']()}
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 border-t border-grayscale-100 pt-2">
                        <button
                            className={textActionClass}
                            disabled={!canEdit || busy || mutationsBlocked}
                            onClick={() => setPanel(panel === 'expiry' ? null : 'expiry')}
                        >
                            <IonIcon icon={timeOutline} />
                            {m['dataShareCenter.shared.changeExpiry']()}
                        </button>
                        <button
                            className={textActionClass}
                            disabled={!canEdit || busy || mutationsBlocked}
                            onClick={() => setPanel(panel === 'update' ? null : 'update')}
                        >
                            <IonIcon icon={createOutline} /> {m['dataShareCenter.shared.update']()}
                        </button>
                        <button
                            className={`${textActionClass} text-red-700 hover:text-red-700 sm:ml-auto`}
                            disabled={!canEdit || busy || mutationsBlocked}
                            onClick={() => setPanel(panel === 'stop' ? null : 'stop')}
                        >
                            <IonIcon icon={stopCircleOutline} />
                            {m['dataShareCenter.shared.stop']()}
                        </button>
                    </div>
                </>
            )}

            {panel && (
                <div className="mt-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                    {panel === 'qr' && (
                        <div className="flex flex-col items-center gap-3">
                            {privateUrl ? (
                                <QRCodeSVG
                                    value={privateUrl}
                                    size={184}
                                    level="M"
                                    includeMargin
                                    bgColor="#FFFFFF"
                                    fgColor="#18224E"
                                    role="img"
                                    aria-label={m['dataShareCenter.shared.qrLabel']()}
                                />
                            ) : !panelError ? (
                                <span className="text-sm text-grayscale-600">
                                    {m['dataShareCenter.shared.loadingLink']()}
                                </span>
                            ) : null}
                        </div>
                    )}
                    {panel === 'expiry' && (
                        <div className="space-y-3">
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['dataShareCenter.shared.expiryDate']()}
                                <input
                                    type="date"
                                    min={minimumExpiry}
                                    value={expiry}
                                    onChange={event => setExpiry(event.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </label>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button className={actionClass} onClick={() => setExpiry('')}>
                                    {m['dataShareCenter.shared.noExpiry']()}
                                </button>
                                <button
                                    className="px-4 py-2 rounded-[20px] bg-grayscale-900 text-white text-xs font-medium disabled:opacity-40"
                                    disabled={busy}
                                    onClick={() => void saveExpiry()}
                                >
                                    {busy
                                        ? m['dataShareCenter.shared.saving']()
                                        : m['dataShareCenter.shared.saveExpiry']()}
                                </button>
                            </div>
                        </div>
                    )}
                    {panel === 'update' && (
                        <div className="space-y-3">
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {m['dataShareCenter.shared.updateWarning']()}
                            </p>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button className={actionClass} onClick={() => setPanel(null)}>
                                    {m['common.cancel']()}
                                </button>
                                <button
                                    className="px-4 py-2 rounded-[20px] bg-grayscale-900 text-white text-xs font-medium"
                                    onClick={() => vm.onUpdate(share)}
                                >
                                    {m['dataShareCenter.shared.continueUpdate']()}
                                </button>
                            </div>
                        </div>
                    )}
                    {panel === 'stop' && (
                        <div className="space-y-3">
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {m['dataShareCenter.shared.stopWarning']()}
                            </p>
                            <div className="flex justify-end gap-2">
                                <button className={actionClass} onClick={() => setPanel(null)}>
                                    {m['common.cancel']()}
                                </button>
                                <button
                                    className="px-4 py-2 rounded-[20px] bg-red-700 text-white text-xs font-medium disabled:opacity-40"
                                    disabled={busy}
                                    onClick={() => void stop()}
                                >
                                    {busy
                                        ? m['dataShareCenter.shared.stopping']()
                                        : m['dataShareCenter.shared.confirmStop']()}
                                </button>
                            </div>
                        </div>
                    )}
                    {panelError && (
                        <p role="alert" className="mt-3 text-sm text-red-700">
                            {m['dataShareCenter.shared.actionError']()}
                        </p>
                    )}
                </div>
            )}
        </article>
    );
};

const SavedCollectionRow = ({
    collection,
    onPreview,
}: {
    collection: SavedCredentialCollection;
    onPreview: (collection: SavedCredentialCollection) => void;
}) => (
    <article className="border-b border-grayscale-100 p-5 last:border-b-0">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <h4 className="font-medium text-grayscale-900">
                    {collection.title ?? m['dataShareCenter.shared.savedCollectionTitle']()}
                </h4>
                {collection.note && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-grayscale-600">
                        {collection.note}
                    </p>
                )}
                {collection.sharer && (
                    <p className="mt-1 text-xs text-grayscale-500">
                        {m['dataShareCenter.shared.savedFrom']({
                            name: collection.sharer.displayName,
                        })}
                    </p>
                )}
                <p className="mt-1 text-xs text-grayscale-600">
                    {credentialCountLabel(collection.credentialCount)}
                </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-grayscale-100 px-2.5 py-1.5 text-xs text-grayscale-600">
                <IonIcon icon={calendarOutline} />
                {m['dataShareCenter.shared.savedOn']({
                    date: new Date(collection.receivedAt).toLocaleDateString(),
                })}
            </span>
        </div>
        <button
            type="button"
            className={`${secondaryActionClass} mt-4`}
            onClick={() => onPreview(collection)}
        >
            <IonIcon icon={eyeOutline} /> {m['dataShareCenter.shared.viewCollection']()}
        </button>
    </article>
);

const SharedLinksSection: React.FC<{ vm: DataSharingSharedLinksViewModel; delay?: number }> = ({
    vm,
    delay = 0,
}) => {
    const [view, setView] = useState<SharedSectionView>('my-shares');
    const filtered = useMemo(
        () => vm.records.filter(record => getSharedLinkViewStatus(record) === vm.filter),
        [vm.filter, vm.records]
    );
    const filters: SharedLinkFilter[] = ['active', 'expired', 'stopped'];
    const saved = vm.savedCollections;
    const selectView = (next: SharedSectionView) => {
        setView(next);
        if (next === 'saved-collections') void saved.onOpen();
    };
    const refresh = view === 'saved-collections' ? saved.onRefresh : vm.onRefresh;
    const refreshing = view === 'saved-collections' ? saved.isLoading : vm.isLoading;

    return (
        <div
            className="animate-fade-in-up"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="px-1 mb-3 flex items-end justify-between gap-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-grayscale-900">
                        {m['dataShareCenter.shared.heading']()}
                    </h3>
                    <p className="text-sm text-grayscale-600">
                        {m['dataShareCenter.shared.subtitle']()}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        aria-label={m['dataShareCenter.shared.refresh']()}
                        className="inline-flex items-center gap-1.5 rounded-[20px] border border-grayscale-300 bg-white px-3 py-2 text-xs font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                        disabled={refreshing}
                        onClick={() => void refresh()}
                    >
                        <IonIcon icon={refreshOutline} />
                        <span className="hidden sm:inline">
                            {m['dataShareCenter.shared.refresh']()}
                        </span>
                    </button>
                    <button
                        className="inline-flex items-center gap-1.5 rounded-[20px] bg-grayscale-900 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        onClick={vm.onCreateShare}
                    >
                        <IonIcon icon={addOutline} /> {m['dataShareCenter.shared.newShare']()}
                    </button>
                </div>
            </div>

            <div
                className="mb-3 grid grid-cols-2 gap-1 rounded-[20px] bg-grayscale-100 p-1"
                role="tablist"
                aria-label={m['dataShareCenter.shared.collectionTabsLabel']()}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'my-shares'}
                    onClick={() => selectView('my-shares')}
                    className={
                        view === 'my-shares'
                            ? 'rounded-[20px] bg-white px-4 py-2.5 text-sm font-medium text-grayscale-900 shadow-sm'
                            : 'rounded-[20px] px-4 py-2.5 text-sm font-medium text-grayscale-600 transition-colors hover:text-grayscale-900'
                    }
                >
                    {m['dataShareCenter.shared.myShares']()}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'saved-collections'}
                    onClick={() => selectView('saved-collections')}
                    className={
                        view === 'saved-collections'
                            ? 'rounded-[20px] bg-white px-4 py-2.5 text-sm font-medium text-grayscale-900 shadow-sm'
                            : 'rounded-[20px] px-4 py-2.5 text-sm font-medium text-grayscale-600 transition-colors hover:text-grayscale-900'
                    }
                >
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <IonIcon icon={bookmarkOutline} />
                        {m['dataShareCenter.shared.savedCollections']()}
                    </span>
                </button>
            </div>

            {view === 'my-shares' && (
                <div className="mb-3 flex flex-wrap gap-2" role="group">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            aria-pressed={vm.filter === filter}
                            className={
                                vm.filter === filter
                                    ? 'py-2.5 px-3 rounded-full bg-grayscale-900 text-white font-medium text-sm'
                                    : 'py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm'
                            }
                            onClick={() => vm.onFilterChange(filter)}
                        >
                            {statusLabel(filter)}
                        </button>
                    ))}
                </div>
            )}

            <GlassCard className="overflow-hidden">
                {view === 'saved-collections' ? (
                    saved.isLoading ? (
                        <div role="status" className="p-8 text-center text-sm text-grayscale-600">
                            {m['dataShareCenter.shared.savedLoading']()}
                        </div>
                    ) : saved.error ? (
                        <div className="space-y-3 p-8 text-center">
                            <p className="text-sm text-red-700">
                                {m['dataShareCenter.shared.savedLoadError']()}
                            </p>
                            <button className={actionClass} onClick={() => void saved.onRefresh()}>
                                {m['shareLinks.retry']()}
                            </button>
                        </div>
                    ) : saved.records.length === 0 ? (
                        <div className="space-y-2 p-8 text-center">
                            <p className="font-medium text-grayscale-900">
                                {m['dataShareCenter.shared.savedEmptyTitle']()}
                            </p>
                            <p className="text-sm text-grayscale-600">
                                {m['dataShareCenter.shared.savedEmptyBody']()}
                            </p>
                        </div>
                    ) : (
                        saved.records.map(collection => (
                            <SavedCollectionRow
                                key={collection.uri}
                                collection={collection}
                                onPreview={saved.onPreview}
                            />
                        ))
                    )
                ) : vm.isLoading ? (
                    <div role="status" className="p-8 text-center text-sm text-grayscale-600">
                        {m['dataShareCenter.shared.loading']()}
                    </div>
                ) : vm.error ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="text-sm text-red-700">
                            {m['dataShareCenter.shared.loadError']()}
                        </p>
                        <button className={actionClass} onClick={() => void vm.onRefresh()}>
                            {m['shareLinks.retry']()}
                        </button>
                    </div>
                ) : vm.records.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="font-medium text-grayscale-900">
                            {m['dataShareCenter.shared.emptyTitle']()}
                        </p>
                        <p className="text-sm text-grayscale-600">
                            {m['dataShareCenter.shared.emptyBody']()}
                        </p>
                        <button
                            className="px-4 py-2.5 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium"
                            onClick={vm.onCreateShare}
                        >
                            {m['dataShareCenter.shared.newShare']()}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="p-8 text-center text-sm text-grayscale-600">
                        {vm.hasMore
                            ? m['dataShareCenter.shared.emptyFilterMore']()
                            : m['dataShareCenter.shared.emptyFilter']()}
                    </p>
                ) : (
                    filtered.map(share => (
                        <ShareLinkRow key={`${share.id}:${share.version}`} share={share} vm={vm} />
                    ))
                )}
            </GlassCard>

            {view === 'my-shares' && vm.hasMore && (
                <button
                    className={`${actionClass} mt-3 w-full justify-center`}
                    disabled={vm.isLoadingMore}
                    onClick={() => void vm.onLoadMore()}
                >
                    {vm.isLoadingMore
                        ? m['dataShareCenter.shared.loading']()
                        : m['dataShareCenter.shared.loadMore']()}
                </button>
            )}
        </div>
    );
};

export default SharedLinksSection;
