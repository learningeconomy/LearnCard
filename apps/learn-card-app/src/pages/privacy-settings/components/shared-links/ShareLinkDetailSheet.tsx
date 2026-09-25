import React, { useEffect, useId, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    addOutline,
    chevronForward,
    closeOutline,
    createOutline,
    eyeOutline,
    qrCodeOutline,
    refreshOutline,
    stopCircleOutline,
} from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';

import * as m from '../../../../paraglide/messages.js';
import CopyIconButton from './CopyIconButton';
import { useSharedLinksStore } from './sharedLinksStore';
import {
    credentialCountLabel,
    dateInputValue,
    expiryHint,
    formatShortDate,
    getSharedLinkViewStatus,
    minimumExpiryDateValue,
    statusLabel,
} from './sharedLinkFormat';
import './sharedLinks.css';

type Panel = 'qr' | 'expiry' | 'update' | 'stop';

const quietButton =
    'inline-flex items-center gap-1.5 rounded-[20px] border border-grayscale-300 px-3 py-2 text-xs font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40';
const squareButton =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-grayscale-300 text-lg text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-grayscale-900 aria-pressed:text-white aria-pressed:border-grayscale-900';

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
        <dt className="text-grayscale-600">{label}</dt>
        <dd className="text-end text-grayscale-900">{children}</dd>
    </div>
);

type ShareLinkDetailSheetProps = {
    shareId: string;
    fallback: ShareLink;
    onClose: () => void;
};

const ShareLinkDetailSheet: React.FC<ShareLinkDetailSheetProps> = ({
    shareId,
    fallback,
    onClose,
}) => {
    const vm = useSharedLinksStore(state => state.vm);
    const lastKnown = useRef(fallback);
    const live = vm?.records.find(record => record.id === shareId);
    // Intentional render-time write: keeps the sheet showing the freshest known
    // snapshot of this share without an extra render. It's idempotent — writing
    // the same object reference (or an equal one) repeatedly is harmless — and
    // it never fires when `live` is undefined, so the last-known snapshot (or
    // the initial `fallback`) is preserved when the record drops out of view.
    if (live) lastKnown.current = live;
    const share = lastKnown.current;

    const [panel, setPanel] = useState<Panel | null>(null);
    const [privateUrl, setPrivateUrl] = useState('');
    const [errorPanel, setErrorPanel] = useState<Panel | null>(null);
    const [expiry, setExpiry] = useState(dateInputValue(share.expiresAt));

    const panelRef = useRef<Panel | null>(null);
    const qrRequestRef = useRef(0);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const changeExpiryButtonRef = useRef<HTMLButtonElement>(null);
    const hadVmRef = useRef(false);
    const pendingFocusRef = useRef<'change' | null>(null);

    const qrPanelId = useId();
    const expiryPanelId = useId();
    const updatePanelId = useId();
    const stopPanelId = useId();
    const stopWarningId = useId();

    // If the section unmounts (or the store is otherwise cleared), the store's
    // `vm` transitions to null out from under an already-open sheet. Close it
    // rather than rendering against a stale/absent view model.
    useEffect(() => {
        if (vm) {
            hadVmRef.current = true;
        } else if (hadVmRef.current) {
            onClose();
        }
    }, [vm, onClose]);

    // `busy`/`pending` come from the live vm (or default to false while it's
    // briefly null), computed before the early return so the focus effect
    // below — which must run unconditionally — can depend on them.
    const busy = vm?.busyId === share.id;
    const pending = Boolean(vm?.pendingActions[share.id]);

    // A successful expiry save can't focus the Change button synchronously:
    // `busyId` on the vm is still set at that point (it's cleared by the
    // section in a later store update), so the button is still `disabled`
    // and `.focus()` silently no-ops. Defer the focus to this effect, which
    // re-runs once `busy`/`pending` settle, and fall back to the heading if
    // the button is still disabled (e.g. the change ended up pending).
    useEffect(() => {
        if (pendingFocusRef.current !== 'change') return;
        if (busy) return;
        const button = changeExpiryButtonRef.current;
        if (button && !button.disabled) {
            button.focus();
        } else {
            titleRef.current?.focus();
        }
        pendingFocusRef.current = null;
    }, [panel, busy, pending]);

    if (!vm) return null;

    const status = getSharedLinkViewStatus(share);
    const finalized = share.contentState === 'finalized';
    const canEdit = status !== 'stopped' && finalized;
    const mutationsDisabled = !canEdit || busy || pending;
    const minimumExpiry = minimumExpiryDateValue();

    const setPanelState = (next: Panel | null) => {
        panelRef.current = next;
        setPanel(next);
    };

    const togglePanel = (next: Panel) => {
        setErrorPanel(null);
        setPanelState(panel === next ? null : next);
    };

    const toggleExpiryPanel = () => {
        if (panel !== 'expiry') setExpiry(dateInputValue(share.expiresAt));
        togglePanel('expiry');
    };

    const toggleQr = async () => {
        if (panel === 'qr') {
            setPanelState(null);
            return;
        }
        setErrorPanel(null);
        setPanelState('qr');
        const requestId = ++qrRequestRef.current;
        try {
            const url = await vm.onGetPrivateUrl(share);
            if (panelRef.current !== 'qr' || qrRequestRef.current !== requestId) return;
            setPrivateUrl(url);
        } catch {
            if (panelRef.current !== 'qr' || qrRequestRef.current !== requestId) return;
            setErrorPanel('qr');
        }
    };

    const saveExpiry = async () => {
        setErrorPanel(null);
        if (expiry && expiry < minimumExpiry) {
            setErrorPanel('expiry');
            return;
        }
        try {
            await vm.onChangeExpiry(
                share,
                expiry ? new Date(`${expiry}T23:59:59.999`).toISOString() : null
            );
            pendingFocusRef.current = 'change';
            setPanelState(null);
        } catch {
            setErrorPanel('expiry');
        }
    };

    const stop = async () => {
        setErrorPanel(null);
        try {
            await vm.onStop(share);
            setPanelState(null);
            titleRef.current?.focus();
        } catch {
            setErrorPanel('stop');
        }
    };

    return (
        <div className="relative w-full max-w-[480px] bg-white px-5 pb-6 pt-5 text-grayscale-900">
            <button
                type="button"
                aria-label={m['common.close']()}
                onClick={onClose}
                className="absolute end-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-grayscale-500 hover:bg-grayscale-100"
            >
                <IonIcon icon={closeOutline} aria-hidden="true" />
            </button>

            <header className="pe-10">
                <h2
                    ref={titleRef}
                    tabIndex={-1}
                    className="break-words text-lg font-semibold leading-snug focus:outline-none"
                >
                    {share.title}
                </h2>
                {share.note && (
                    <p className="mt-1 text-sm leading-relaxed text-grayscale-600">{share.note}</p>
                )}
                {status !== 'active' && (
                    <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status === 'expired' ? 'bg-amber-50 text-amber-900' : 'bg-grayscale-100 text-grayscale-700'}`}
                    >
                        {statusLabel(status)}
                    </span>
                )}
            </header>

            {status === 'stopped' ? (
                <div className="mt-5 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                    <p className="text-sm leading-relaxed text-grayscale-600">
                        {m['dataShareCenter.shared.stoppedExplanation']()}
                    </p>
                    <button
                        type="button"
                        onClick={vm.onCreateShare}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                        <IonIcon icon={addOutline} aria-hidden="true" />
                        {m['dataShareCenter.shared.shareAgain']()}
                    </button>
                </div>
            ) : (
                <>
                    <div className="mt-5 flex items-center gap-2">
                        <CopyIconButton
                            variant="primary"
                            label={m['dataShareCenter.shared.copy']()}
                            text={m['dataShareCenter.shared.copy']()}
                            disabled={!canEdit || busy}
                            onCopy={() => vm.onCopy(share)}
                        />
                        <button
                            type="button"
                            aria-label={m['dataShareCenter.shared.showQrLabel']()}
                            aria-pressed={panel === 'qr'}
                            aria-controls={qrPanelId}
                            disabled={!canEdit || busy}
                            onClick={() => void toggleQr()}
                            className={squareButton}
                        >
                            <IonIcon icon={qrCodeOutline} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            aria-label={m['dataShareCenter.shared.viewCredentials']({
                                count: String(share.selectedCount),
                            })}
                            disabled={!finalized}
                            onClick={() => vm.onPreview(share)}
                            className={squareButton}
                        >
                            <IonIcon icon={eyeOutline} aria-hidden="true" />
                        </button>
                    </div>
                    {panel === 'qr' && (
                        <div
                            id={qrPanelId}
                            className="mt-3 flex justify-center rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4"
                        >
                            {privateUrl ? (
                                <QRCodeSVG
                                    className="sl-qr-in"
                                    value={privateUrl}
                                    size={184}
                                    level="M"
                                    includeMargin
                                    bgColor="#FFFFFF"
                                    fgColor="#18224E"
                                    role="img"
                                    aria-label={m['dataShareCenter.shared.qrLabel']()}
                                />
                            ) : errorPanel === 'qr' ? (
                                <span role="alert" className="text-sm text-red-700">
                                    {m['dataShareCenter.shared.actionError']()}
                                </span>
                            ) : (
                                <span className="text-sm text-grayscale-600">
                                    {m['dataShareCenter.shared.loadingLink']()}
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}

            {pending && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm leading-relaxed text-amber-900">
                        {m['dataShareCenter.shared.changePending']()}
                    </p>
                    <button
                        type="button"
                        className={`${quietButton} mt-3 border-amber-200 bg-white text-amber-900`}
                        disabled={busy}
                        onClick={() => void vm.onCheckPending(share)}
                    >
                        <IonIcon icon={refreshOutline} aria-hidden="true" />
                        {busy
                            ? m['dataShareCenter.shared.checking']()
                            : m['dataShareCenter.shared.checkAgain']()}
                    </button>
                </div>
            )}

            <dl className="mt-5 divide-y divide-grayscale-100 border-y border-grayscale-100">
                <DetailRow label={m['dataShareCenter.shared.statusLabel']()}>
                    {statusLabel(status)}
                </DetailRow>
                <DetailRow label={m['dataShareCenter.shared.credentialsLabel']()}>
                    {credentialCountLabel(share.selectedCount)}
                </DetailRow>
                <DetailRow label={m['dataShareCenter.shared.passcodeLabel']()}>
                    {share.passcodeProtected
                        ? m['dataShareCenter.shared.passcodeOn']()
                        : m['dataShareCenter.shared.passcodeOffValue']()}
                </DetailRow>
                <DetailRow label={m['dataShareCenter.shared.createdLabel']()}>
                    {formatShortDate(share.createdAt)}
                </DetailRow>
                <DetailRow label={m['dataShareCenter.shared.expiresLabel']()}>
                    <span className="inline-flex items-center gap-2">
                        {share.expiresAt
                            ? status === 'active'
                                ? expiryHint(share.expiresAt).label
                                : formatShortDate(share.expiresAt)
                            : m['dataShareCenter.shared.neverExpires']()}
                        {status !== 'stopped' && (
                            <button
                                ref={changeExpiryButtonRef}
                                type="button"
                                aria-label={m['dataShareCenter.shared.changeExpiry']()}
                                aria-expanded={panel === 'expiry'}
                                aria-controls={expiryPanelId}
                                disabled={mutationsDisabled}
                                onClick={toggleExpiryPanel}
                                className="text-sm font-medium text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {m['dataShareCenter.shared.change']()}
                            </button>
                        )}
                    </span>
                </DetailRow>
                {vm.showViewStats && share.viewCount !== undefined && (
                    <DetailRow label={m['dataShareCenter.shared.viewsLabel']()}>
                        {share.viewCount > 0
                            ? m['dataShareCenter.shared.viewed']({
                                  count: String(share.viewCount),
                                  date: share.lastViewedAt
                                      ? formatShortDate(share.lastViewedAt)
                                      : m['dataShareCenter.shared.recently'](),
                              })
                            : m['dataShareCenter.shared.notViewed']()}
                    </DetailRow>
                )}
            </dl>

            {panel === 'expiry' && (
                <div
                    id={expiryPanelId}
                    className="mt-3 space-y-3 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4"
                >
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
                        <button type="button" className={quietButton} onClick={() => setExpiry('')}>
                            {m['dataShareCenter.shared.noExpiry']()}
                        </button>
                        <button
                            type="button"
                            className="rounded-[20px] bg-grayscale-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                            disabled={busy || pending}
                            onClick={() => void saveExpiry()}
                        >
                            {busy
                                ? m['dataShareCenter.shared.saving']()
                                : m['dataShareCenter.shared.saveExpiry']()}
                        </button>
                    </div>
                </div>
            )}

            {status !== 'stopped' && (
                <div className="mt-4 flex flex-col">
                    <button
                        type="button"
                        aria-expanded={panel === 'update'}
                        aria-controls={updatePanelId}
                        disabled={mutationsDisabled}
                        onClick={() => togglePanel('update')}
                        className="flex items-center justify-between rounded-xl px-1 py-3 text-sm font-medium text-grayscale-800 hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="inline-flex items-center gap-2">
                            <IonIcon icon={createOutline} aria-hidden="true" />
                            {m['dataShareCenter.shared.updateContents']()}
                        </span>
                        <IonIcon
                            icon={chevronForward}
                            aria-hidden="true"
                            className="text-grayscale-400 rtl:-scale-x-100"
                        />
                    </button>
                    {panel === 'update' && (
                        <div
                            id={updatePanelId}
                            className="mb-2 space-y-3 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4"
                        >
                            <p className="text-sm leading-relaxed text-grayscale-700">
                                {m['dataShareCenter.shared.updateWarning']()}
                            </p>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    className={quietButton}
                                    onClick={() => setPanelState(null)}
                                >
                                    {m['common.cancel']()}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-[20px] bg-grayscale-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                                    disabled={busy || pending}
                                    onClick={() => vm.onUpdate(share)}
                                >
                                    {m['dataShareCenter.shared.continueUpdate']()}
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        aria-expanded={panel === 'stop'}
                        aria-controls={stopPanelId}
                        disabled={mutationsDisabled}
                        onClick={() => togglePanel('stop')}
                        className="flex items-center gap-2 rounded-xl px-1 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <IonIcon icon={stopCircleOutline} aria-hidden="true" />
                        {m['dataShareCenter.shared.stop']()}
                    </button>
                    {panel === 'stop' && (
                        <div
                            id={stopPanelId}
                            data-testid="stop-sharing-panel"
                            className="space-y-3 rounded-2xl border border-red-100 bg-red-50/60 p-4"
                        >
                            <p
                                id={stopWarningId}
                                className="text-sm leading-relaxed text-grayscale-700"
                            >
                                {m['dataShareCenter.shared.stopWarning']()}
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className={quietButton}
                                    onClick={() => setPanelState(null)}
                                >
                                    {m['common.cancel']()}
                                </button>
                                <button
                                    type="button"
                                    aria-describedby={stopWarningId}
                                    className="rounded-[20px] bg-red-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                                    disabled={busy || pending}
                                    onClick={() => void stop()}
                                >
                                    {busy
                                        ? m['dataShareCenter.shared.stopping']()
                                        : m['dataShareCenter.shared.confirmStop']()}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(panel === 'expiry' || panel === 'stop') && errorPanel === panel && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                    {m['dataShareCenter.shared.actionError']()}
                </p>
            )}
        </div>
    );
};

export default ShareLinkDetailSheet;
