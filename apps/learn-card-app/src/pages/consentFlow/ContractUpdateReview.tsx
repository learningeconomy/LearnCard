import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, LockKeyhole, Plus, X } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import type {
    ConsentFlowContractDetails,
    ConsentFlowContractUpdatePreview,
} from '@learncard/types';
import AppModal from 'learn-card-base/components/modals/surfaces/AppModal';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import ConsentFlowGetAnAdultPrompt from './ConsentFlowGetAnAdult';
import './ContractUpdateReview.scss';

const accessListFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
});

export type ContractUpdateReviewProps = {
    open: boolean;
    name: string;
    image?: string;
    reason?: string;
    deadline?: string;
    preview: ConsentFlowContractUpdatePreview;
    needsGuardianConsent?: boolean;
    guardianContract?: ConsentFlowContractDetails;
    unchangedRows: string[];
    initialEnabledOptionalKeys?: string[];
    readOnly?: boolean;
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
    onAccept,
    onDecline,
    onClose,
}) => {
    const brandingConfig = useBrandingConfig();
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
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            window.clearTimeout(closeTimer.current);
        };
    }, []);
    const existingReadLabels = unchangedRows
        .filter(row => row.startsWith('Can see '))
        .map(row => row.slice('Can see '.length));
    const existingWriteLabels = unchangedRows
        .filter(row => row.startsWith('Can add '))
        .map(row => row.slice('Can add '.length));
    const existingSummary = existingReadLabels.length
        ? `${name} already sees ${accessListFormatter.format(existingReadLabels)}. That doesn't change.`
        : existingWriteLabels.length
          ? `${name} can already add ${accessListFormatter.format(existingWriteLabels)}. That doesn't change.`
          : 'Your existing choices stay the same.';

    const toggle = (key: string) =>
        setEnabled(current =>
            current.includes(key) ? current.filter(value => value !== key) : [...current, key]
        );
    const submit = async (guardianConfirmed = false) => {
        if (readOnly) {
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
            if (mounted.current) setError('Something went wrong. Please try again.');
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
                    aria-label="Close"
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
                            aria-label="Why am I seeing this?"
                            className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-grayscale-400 text-sm font-semibold text-grayscale-700"
                        >
                            ?
                        </button>
                        {showContext && (
                            <p className="mt-2 rounded-xl bg-grayscale-100 p-3 text-sm text-grayscale-700">
                                {name} is an app you connected to {brandingConfig.name}. You decide
                                what it can see and what it can add to your account. You can change
                                this any time.
                            </p>
                        )}
                        <section
                            aria-label="Changes"
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
                                                    {row.change === 'added'
                                                        ? 'New'
                                                        : row.change === 'removed'
                                                          ? 'Removed'
                                                          : row.scope.required
                                                            ? 'Now required'
                                                            : 'Updated'}
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
                                                    Turn on this option
                                                </label>
                                            )}
                                            {row.change !== 'removed' && row.scope.required && (
                                                <p className="mt-2 flex items-center gap-1 text-xs text-grayscale-600">
                                                    <LockKeyhole size={13} />
                                                    Required
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
                            className="mt-4 flex items-start gap-2 text-left text-sm text-grayscale-700"
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
                                            <li key={row}>{row}</li>
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
                    <p role="alert">A parent is needed to continue.</p>
                )}
            </main>
            {!askParent && (
                <footer className="shrink-0 border-t border-grayscale-200 px-5 py-4">
                    {confirmDecline && (
                        <p className="mb-3 text-sm leading-relaxed text-grayscale-700">
                            {name} will lose access to everything you've shared. You can reconnect
                            later.
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={busy || complete}
                        onClick={() => void submit()}
                        aria-label={complete ? 'Saved' : undefined}
                        className={`flex w-full items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-sm font-medium disabled:opacity-40 ${confirmDecline ? 'border border-red-200 text-red-700' : 'bg-grayscale-900 text-white'}`}
                    >
                        {complete ? (
                            <Check aria-hidden size={18} />
                        ) : busy ? (
                            <>
                                <IonSpinner name="crescent" />
                                Saving...
                            </>
                        ) : confirmDecline ? (
                            'Stop sharing'
                        ) : needsGuardianConsent ? (
                            'Ask a parent'
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
                            Keep sharing
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={busy || complete}
                            onClick={() => setConfirmDecline(true)}
                            className="mt-3 w-full text-center text-sm text-grayscale-700 underline"
                        >
                            Stop sharing with {name}
                        </button>
                    )}
                    {deadline && (
                        <p className="mt-3 text-center text-xs text-grayscale-500">
                            Respond by{' '}
                            {new Date(deadline).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                            })}{' '}
                            to keep sharing
                        </p>
                    )}
                </footer>
            )}
        </AppModal>
    );
};

export default ContractUpdateReview;
