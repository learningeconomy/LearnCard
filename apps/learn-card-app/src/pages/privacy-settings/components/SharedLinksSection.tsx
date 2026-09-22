import React, { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    copyOutline,
    createOutline,
    qrCodeOutline,
    stopCircleOutline,
    timeOutline,
} from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';

import * as m from '../../../paraglide/messages.js';
import type { DataSharingSharedLinksViewModel, SharedLinkFilter } from '../DataSharingCenter.types';
import GlassCard from './GlassCard';

type RowPanel = 'qr' | 'expiry' | 'stop';

export const getSharedLinkViewStatus = (
    share: Pick<ShareLink, 'status' | 'expiresAt'>,
    now = Date.now()
): SharedLinkFilter => {
    if (share.status === 'stopped') return 'stopped';
    if (share.expiresAt && new Date(share.expiresAt).getTime() <= now) return 'expired';
    return 'active';
};

const dateValue = (value: string | null): string => (value ? value.slice(0, 10) : '');

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

const ShareLinkRow = ({ share, vm }: { share: ShareLink; vm: DataSharingSharedLinksViewModel }) => {
    const status = getSharedLinkViewStatus(share);
    const [panel, setPanel] = useState<RowPanel | null>(null);
    const [privateUrl, setPrivateUrl] = useState('');
    const [panelError, setPanelError] = useState(false);
    const [expiry, setExpiry] = useState(dateValue(share.expiresAt));
    const busy = vm.busyId === share.id;
    const canEdit = status !== 'stopped' && share.contentState === 'finalized';

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
                    <p className="mt-1 text-xs text-grayscale-600">
                        {m['dataShareCenter.shared.credentialCount']({
                            count: String(share.selectedCount),
                        })}
                        {' · '}
                        {m['dataShareCenter.shared.created']({
                            date: new Date(share.createdAt).toLocaleDateString(),
                        })}
                    </p>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}
                >
                    {statusLabel(status)}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-grayscale-600">
                {status === 'active' && share.expiresAt && (
                    <span>
                        {m['dataShareCenter.shared.expires']({
                            date: new Date(share.expiresAt).toLocaleDateString(),
                        })}
                    </span>
                )}
                {status === 'expired' && share.expiresAt && (
                    <span>
                        {m['dataShareCenter.shared.expiredOn']({
                            date: new Date(share.expiresAt).toLocaleDateString(),
                        })}
                    </span>
                )}
                {vm.showViewStats && share.viewCount !== undefined && share.viewCount > 0 && (
                    <span>
                        {m['dataShareCenter.shared.viewed']({
                            count: String(share.viewCount),
                            date: share.lastViewedAt
                                ? new Date(share.lastViewedAt).toLocaleDateString()
                                : m['dataShareCenter.shared.recently'](),
                        })}
                    </span>
                )}
                {vm.showViewStats && share.viewCount === 0 && (
                    <span>{m['dataShareCenter.shared.notViewed']()}</span>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    className={actionClass}
                    disabled={!canEdit || busy}
                    onClick={() => void vm.onCopy(share)}
                >
                    <IonIcon icon={copyOutline} /> {m['dataShareCenter.shared.copy']()}
                </button>
                <button
                    className={actionClass}
                    disabled={!canEdit || busy}
                    onClick={() => void showQr()}
                >
                    <IonIcon icon={qrCodeOutline} /> {m['dataShareCenter.shared.showQr']()}
                </button>
                <button
                    className={actionClass}
                    disabled={!canEdit || busy}
                    onClick={() => setPanel(panel === 'expiry' ? null : 'expiry')}
                >
                    <IonIcon icon={timeOutline} /> {m['dataShareCenter.shared.changeExpiry']()}
                </button>
                <button
                    className={actionClass}
                    disabled={!canEdit || busy}
                    onClick={() => vm.onUpdate(share)}
                >
                    <IonIcon icon={createOutline} /> {m['dataShareCenter.shared.update']()}
                </button>
                <button
                    className={`${actionClass} text-red-700 border-red-100 hover:bg-red-50`}
                    disabled={!canEdit || busy}
                    onClick={() => setPanel(panel === 'stop' ? null : 'stop')}
                >
                    <IonIcon icon={stopCircleOutline} /> {m['dataShareCenter.shared.stop']()}
                </button>
            </div>

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
                                    min={new Date(Date.now() + 86_400_000)
                                        .toISOString()
                                        .slice(0, 10)}
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

const SharedLinksSection: React.FC<{ vm: DataSharingSharedLinksViewModel; delay?: number }> = ({
    vm,
    delay = 0,
}) => {
    const filtered = useMemo(
        () => vm.records.filter(record => getSharedLinkViewStatus(record) === vm.filter),
        [vm.filter, vm.records]
    );
    const filters: SharedLinkFilter[] = ['active', 'expired', 'stopped'];

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
                <button
                    className="text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    disabled={vm.isLoading}
                    onClick={() => void vm.onRefresh()}
                >
                    {m['dataShareCenter.shared.refresh']()}
                </button>
            </div>

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

            <GlassCard className="overflow-hidden">
                {vm.isLoading ? (
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
                            onClick={vm.onOpenPassport}
                        >
                            {m['dataShareCenter.shared.openPassport']()}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="p-8 text-center text-sm text-grayscale-600">
                        {m['dataShareCenter.shared.emptyFilter']()}
                    </p>
                ) : (
                    filtered.map(share => <ShareLinkRow key={share.id} share={share} vm={vm} />)
                )}
            </GlassCard>

            {vm.hasMore && (
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
