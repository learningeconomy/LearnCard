import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, LockKeyhole, Plus, X } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import type {
    ConsentFlowContractDetails,
    ConsentFlowContractUpdatePreview,
} from '@learncard/types';
import AppModal from 'learn-card-base/components/modals/surfaces/AppModal';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useLocale } from '../../i18n';
import ConsentFlowGetAnAdultPrompt from './ConsentFlowGetAnAdult';
import { mDynamic } from '../../i18n/mDynamic';
import './ContractUpdateReview.scss';
export type ContractUpdateReviewProps = {
    open: boolean;
    name: string;
    image?: string;
    reason?: string;
    deadline?: string;
    preview: ConsentFlowContractUpdatePreview;
    needsGuardianConsent?: boolean;
    guardianContract?: ConsentFlowContractDetails;
    unchangedRows: { area: 'read' | 'write'; label: string }[];
    initialEnabledOptionalKeys?: string[];
    readOnly?: boolean;
    alreadyHandled?: boolean;
    onAccept?: (enabledOptionalKeys: string[]) => Promise<void>;
    onDecline?: () => Promise<void>;
    onClose: () => void;
};

/** The one review surface used by inbox links and the developer dry-run preview. */
export const ContractUpdateReview: React.FC<ContractUpdateReviewProps> = ({
    open,
    name,
    image,
    reason,
    deadline,
    preview,
    needsGuardianConsent = false,
    guardianContract,
    unchangedRows,
    initialEnabledOptionalKeys = [],
    readOnly = false,
    alreadyHandled = false,
    onAccept,
    onDecline,
    onClose,
}) => {
    const brandingConfig = useBrandingConfig();
    const locale = useLocale();
    const [enabled, setEnabled] = useState<string[]>(initialEnabledOptionalKeys);
    const [showUnchanged, setShowUnchanged] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [confirmDecline, setConfirmDecline] = useState(false);
    const [busy, setBusy] = useState(false);
    const [complete, setComplete] = useState(false);
    const [error, setError] = useState('');
    const [askParent, setAskParent] = useState(false);
    const closeTimer = useRef<number | undefined>(undefined);
    const mounted = useRef(true);
    const doneOnly =
        alreadyHandled && !preview.rows.some(row => row.change === 'added' && !row.scope.required);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            window.clearTimeout(closeTimer.current);
        };
    }, []);
    const existingReadLabels = unchangedRows
        .filter(row => row.area === 'read')
        .map(row => row.label);
    const existingWriteLabels = unchangedRows
        .filter(row => row.area === 'write')
        .map(row => row.label);
    const listFormatter = new Intl.ListFormat(locale, {
        style: 'long',
        type: 'conjunction',
    });
    const existingSummary = existingReadLabels.length
        ? mDynamic('consentUpdate.ui.unchangedRead', {
              name,
              items: listFormatter.format(existingReadLabels),
          })
        : existingWriteLabels.length
          ? mDynamic('consentUpdate.ui.unchangedWrite', {
                name,
                items: listFormatter.format(existingWriteLabels),
            })
          : mDynamic('consentUpdate.ui.unchangedDefault');

    const toggle = (key: string) =>
        setEnabled(current =>
            current.includes(key) ? current.filter(value => value !== key) : [...current, key]
        );
    const submit = async (guardianConfirmed = false) => {
        if (readOnly || (doneOnly && !confirmDecline)) {
            onClose();
            return;
        }
        if (needsGuardianConsent && !confirmDecline && !guardianConfirmed) {
            setAskParent(true);
            return;
        }
        setBusy(true);
        setError('');
        try {
            if (confirmDecline) await onDecline?.();
            else await onAccept?.(enabled);
            if (!mounted.current) return;
            setComplete(true);
            closeTimer.current = window.setTimeout(onClose, 400);
        } catch {
            if (mounted.current) setError(mDynamic('consentUpdate.ui.saveError'));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    return (
        <AppModal
            rootId="full-screen-modal"
            variant="fullscreen"
            open={open}
            onDimmerClick={onClose}
            sectionClassName="!bg-white !w-full !h-full !max-w-none !rounded-none overflow-hidden flex flex-col font-poppins"
        >
            <header className="shrink-0 flex items-center gap-4 border-b border-grayscale-200 px-5 py-4">
                {image ? (
                    <img src={image} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                    <div aria-hidden className="h-16 w-16 rounded-full bg-grayscale-100" />
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-semibold text-grayscale-900">{preview.headline}</h1>
                    <p className="text-sm text-grayscale-600">{preview.subhead}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={mDynamic('consentUpdate.ui.close')}
                    className="rounded-full p-2 focus-visible:outline focus-visible:outline-2"
                >
                    <X aria-hidden />
                </button>
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {askParent && guardianContract ? (
                    <ConsentFlowGetAnAdultPrompt
                        contractDetails={guardianContract}
                        handleNextStep={() => {
                            setAskParent(false);
                            void submit(true);
                        }}
                    />
                ) : (
                    <div>
                        <p className="text-sm text-grayscale-700">{name}</p>
                        {reason && (
                            <blockquote className="mt-3 border-s-2 border-grayscale-300 ps-3 text-sm italic text-grayscale-700">
                                “{reason}”
                            </blockquote>
                        )}
                        <button
                            type="button"
                            aria-expanded={showContext}
                            onClick={() => setShowContext(value => !value)}
                            aria-label={mDynamic('consentUpdate.ui.whySeeing')}
                            className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-grayscale-400 text-sm font-semibold text-grayscale-700"
                        >
                            ?
                        </button>
                        {showContext && (
                            <p className="mt-2 rounded-xl bg-grayscale-100 p-3 text-sm text-grayscale-700">
                                {mDynamic('consentUpdate.ui.appContext', {
                                    name,
                                    brand: brandingConfig.name,
                                })}
                            </p>
                        )}
                        <section
                            aria-label={mDynamic('consentUpdate.ui.changes')}
                            className="contract-update-changes mt-5 rounded-2xl border border-grayscale-200 divide-y divide-grayscale-100"
                        >
                            {preview.rows.map((row, index) => {
                                const optional = row.change === 'added' && !row.scope.required;
                                const scopeKey = `${row.scope.area}|${row.scope.type}|${row.scope.key}`;
                                const isEnabled = enabled.includes(scopeKey);
                                return (
                                    <div
                                        key={`${row.scope.area}-${row.scope.type}-${row.scope.key}-${index}`}
                                        className="flex items-start gap-3 p-4"
                                    >
                                        <span
                                            aria-hidden
                                            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${row.change === 'added' ? 'bg-emerald-50 text-emerald-700' : row.change === 'removed' ? 'bg-grayscale-100 text-grayscale-700' : 'bg-amber-50 text-amber-700'}`}
                                        >
                                            {row.change === 'added' ? (
                                                <Plus size={15} />
                                            ) : row.change === 'removed' ? (
                                                <X size={15} />
                                            ) : (
                                                <LockKeyhole size={14} />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`font-medium ${row.change === 'removed' ? 'text-grayscale-500 line-through' : 'text-grayscale-900'}`}
                                                >
                                                    {row.label}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${row.change === 'added' ? 'bg-emerald-50 text-emerald-700' : row.change === 'removed' ? 'bg-grayscale-100 text-grayscale-700' : row.scope.required ? 'bg-amber-50 text-amber-700' : 'bg-grayscale-100 text-grayscale-700'}`}
                                                >
                                                    {mDynamic(
                                                        row.change === 'added'
                                                            ? 'consentUpdate.ui.new'
                                                            : row.change === 'removed'
                                                              ? 'consentUpdate.ui.removed'
                                                              : row.scope.required
                                                                ? 'consentUpdate.ui.nowRequired'
                                                                : 'consentUpdate.ui.updated'
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-grayscale-600">
                                                {row.subtitle}
                                            </p>
                                            {optional && (
                                                <label className="mt-3 flex items-center gap-2 text-sm text-grayscale-800">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 accent-emerald-600"
                                                        checked={isEnabled}
                                                        onChange={() => toggle(scopeKey)}
                                                    />
                                                    {mDynamic('consentUpdate.ui.turnOnOption')}
                                                </label>
                                            )}
                                            {row.change !== 'removed' && row.scope.required && (
                                                <p className="mt-2 flex items-center gap-1 text-xs text-grayscale-600">
                                                    <LockKeyhole size={13} />
                                                    {mDynamic('consentUpdate.ui.required')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                        <button
                            type="button"
                            aria-expanded={showUnchanged}
                            onClick={() => setShowUnchanged(value => !value)}
                            className="mt-4 flex items-start gap-2 text-start text-sm text-grayscale-700"
                        >
                            {existingSummary}{' '}
                            {showUnchanged ? (
                                <ChevronUp className="shrink-0" size={16} />
                            ) : (
                                <ChevronDown className="shrink-0" size={16} />
                            )}
                        </button>
                        {showUnchanged && (
                            <div className="mt-2 rounded-xl bg-grayscale-100 p-3 text-sm text-grayscale-600">
                                {unchangedRows.length > 0 && (
                                    <ul className="space-y-1">
                                        {unchangedRows.map(row => (
                                            <li key={`${row.area}:${row.label}`}>{row.label}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {error && (
                            <p role="alert" className="mt-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}
                    </div>
                )}
                {askParent && !guardianContract && (
                    <p role="alert">{mDynamic('consentUpdate.ui.parentNeeded')}</p>
                )}
            </main>
            {!askParent && (
                <footer className="shrink-0 border-t border-grayscale-200 px-5 py-4">
                    {confirmDecline && (
                        <p className="mb-3 text-sm leading-relaxed text-grayscale-700">
                            {mDynamic('consentUpdate.ui.stopSharingWarning', { name })}
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={busy || complete}
                        onClick={() => void submit()}
                        aria-label={complete ? mDynamic('consentUpdate.ui.saved') : undefined}
                        className={`flex w-full items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-sm font-medium disabled:opacity-40 ${confirmDecline ? 'border border-red-200 text-red-700' : 'bg-grayscale-900 text-white'}`}
                    >
                        {complete ? (
                            <Check aria-hidden size={18} />
                        ) : busy ? (
                            <>
                                <IonSpinner name="crescent" />
                                {mDynamic('consentUpdate.ui.saving')}
                            </>
                        ) : confirmDecline ? (
                            mDynamic('consentUpdate.ui.stopSharing')
                        ) : doneOnly ? (
                            mDynamic('consentUpdate.action.done')
                        ) : needsGuardianConsent ? (
                            mDynamic('consentUpdate.ui.askParent')
                        ) : alreadyHandled ? (
                            mDynamic('consentUpdate.action.saveChoices')
                        ) : (
                            preview.primaryLabel
                        )}
                    </button>
                    {confirmDecline ? (
                        <button
                            type="button"
                            disabled={busy || complete}
                            onClick={() => setConfirmDecline(false)}
                            className="mt-3 w-full text-center text-sm text-grayscale-700"
                        >
                            {mDynamic('consentUpdate.ui.keepSharing')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={busy || complete}
                            onClick={() => setConfirmDecline(true)}
                            className="mt-3 w-full text-center text-sm text-grayscale-700 underline"
                        >
                            {mDynamic('consentUpdate.ui.stopSharingWith', { name })}
                        </button>
                    )}
                    {deadline && (
                        <p className="mt-3 text-center text-xs text-grayscale-500">
                            {mDynamic('consentUpdate.ui.respondBy', {
                                date: new Date(deadline).toLocaleDateString(locale, {
                                    month: 'short',
                                    day: 'numeric',
                                }),
                            })}
                        </p>
                    )}
                </footer>
            )}
        </AppModal>
    );
};

export default ContractUpdateReview;
