import React, { useState, useEffect } from 'react';
import { useWallet } from 'learn-card-base';
import { enterSharePrivacy } from '../../../components/share-links/sharePrivacy';
import {
    captureHistoryAccount,
    captureHistoryContext,
    getHistoryAccountRevision,
    isHistoryAccountEligible,
    useHistoryAccountRevision,
} from '../../../helpers/verifier-history/account';
import {
    clearVerifierHistory,
    deleteVerifierReceipt,
    loadVerifierHistory,
    setVerifierHistoryEnabled,
    type HistoryContext,
} from '../../../helpers/verifier-history/history';
import * as m from '../../../paraglide/messages.js';
import { useLocale } from '../../../i18n';

type Loaded = Awaited<ReturnType<typeof loadVerifierHistory>>;
type State = { revision: number; context: HistoryContext; data: Loaded };
const button =
    'py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const VerifierHistorySection: React.FC<{ eligible: boolean }> = ({ eligible }) => {
    const { initWallet } = useWallet();
    const locale = useLocale();
    const revision = useHistoryAccountRevision();
    const allowed = isHistoryAccountEligible(eligible);
    const [state, setState] = useState<State | null>(null);
    const [busy, setBusy] = useState<number | null>(null);
    const [error, setError] = useState<{ revision: number; message: string } | null>(null);
    // Hide previous-account state synchronously; an effect would expose it for one render.
    const visible =
        allowed && state?.revision === revision && state.context.isCurrent() ? state : null;
    const loading = busy === revision;
    useEffect(() => {
        setState(previous => (previous?.revision === revision ? previous : null));
        setError(previous => (previous?.revision === revision ? previous : null));
        setBusy(previous => (previous === revision ? previous : null));
    }, [revision]);
    const run = async (action?: (context: HistoryContext) => Promise<unknown>) => {
        if (loading || !allowed) return;
        // Synchronous and sticky: recorders stop before any history decryption or render.
        enterSharePrivacy();
        const isSelectedAccount = captureHistoryAccount();
        setBusy(revision);
        setError(null);
        let context = visible?.context;
        try {
            if (!context) {
                const wallet = await initWallet();
                if (!isSelectedAccount()) return;
                context = captureHistoryContext(wallet, eligible);
            }
            if (!context.isCurrent()) return;
            const currentRevision = getHistoryAccountRevision();
            setBusy(currentRevision);
            if (action) await action(context);
            const data = await loadVerifierHistory(context);
            if (context.isCurrent()) setState({ revision: currentRevision, context, data });
        } catch {
            if (isSelectedAccount() && (!context || context.isCurrent()))
                setError({
                    revision: getHistoryAccountRevision(),
                    message: m['verifierHistory.loadFailed'](),
                });
        } finally {
            if (isSelectedAccount()) setBusy(null);
        }
    };
    return (
        <section
            aria-labelledby="verifier-history-title"
            className="rounded-[20px] border border-grayscale-200 bg-white p-6 font-poppins space-y-4 sentry-block ph-no-capture"
            data-feedback-exclude
        >
            <h2 id="verifier-history-title" className="text-xl font-semibold text-grayscale-900">
                {m['verifierHistory.title']()}
            </h2>
            <p className="text-sm text-grayscale-600 leading-relaxed">
                {m['verifierHistory.description']()}
            </p>
            {!allowed ? (
                <p className="text-sm text-grayscale-600">
                    {m['verifierHistory.managedUnavailable']()}
                </p>
            ) : (
                <>
                    {!visible && (
                        <button
                            type="button"
                            className={button}
                            onClick={() => void run()}
                            disabled={loading}
                        >
                            {loading ? m['verifierHistory.loading']() : m['verifierHistory.open']()}
                        </button>
                    )}
                    {error?.revision === revision && (
                        <p role="alert" className="text-sm text-red-700">
                            {error.message}
                        </p>
                    )}
                    {visible && (
                        <>
                            <label className="flex items-center gap-3 text-sm font-medium text-grayscale-700">
                                <input
                                    type="checkbox"
                                    checked={visible.data.enabled}
                                    disabled={loading}
                                    onChange={event =>
                                        void run(context =>
                                            setVerifierHistoryEnabled(context, event.target.checked)
                                        )
                                    }
                                />
                                {m['verifierHistory.record']()}
                            </label>
                            <p className="text-xs text-grayscale-600 leading-relaxed">
                                {m['verifierHistory.retention']()}
                            </p>
                            <p className="text-xs text-grayscale-600 leading-relaxed">
                                {m['verifierHistory.limits']()}
                            </p>
                            {!visible.data.cleanupComplete && (
                                <p role="status" className="text-sm text-amber-700">
                                    {m['verifierHistory.cleanupPending']()}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={button}
                                    disabled={loading}
                                    onClick={() => void run()}
                                >
                                    {m['verifierHistory.refresh']()}
                                </button>
                                <button
                                    type="button"
                                    className={button}
                                    disabled={loading || !visible.data.receipts.length}
                                    onClick={() =>
                                        void run(async context => {
                                            await clearVerifierHistory(context);
                                        })
                                    }
                                >
                                    {m['verifierHistory.clear']()}
                                </button>
                            </div>
                            {loading && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className="text-sm text-grayscale-600"
                                >
                                    {m['verifierHistory.loading']()}
                                </p>
                            )}
                            {!visible.data.receipts.length && (
                                <p className="text-sm text-grayscale-600">
                                    {m['verifierHistory.empty']()}
                                </p>
                            )}
                            <ul className="space-y-3" aria-label={m['verifierHistory.title']()}>
                                {visible.data.receipts.map(receipt => (
                                    <li
                                        key={receipt.eventId}
                                        className="rounded-2xl border border-grayscale-200 p-4 space-y-2"
                                    >
                                        <p className="text-sm font-medium text-grayscale-900 break-words">
                                            {receipt.label ??
                                                receipt.origin ??
                                                m['verifierHistory.unknownVerifier']()}
                                        </p>
                                        {receipt.label && receipt.origin && (
                                            <p className="text-xs text-grayscale-600 break-words">
                                                {receipt.origin}
                                            </p>
                                        )}
                                        <p className="text-xs text-grayscale-600">
                                            {new Date(receipt.sentAt).toLocaleString(locale)} ·{' '}
                                            {receipt.outcome === 'sent'
                                                ? m['verifierHistory.sent']()
                                                : m['verifierHistory.handedOff']()}
                                        </p>
                                        <p className="text-sm text-grayscale-700 break-words">
                                            {receipt.titles
                                                .map(title =>
                                                    title === 'Credential'
                                                        ? m['verifierHistory.credential']()
                                                        : title
                                                )
                                                .join(', ')}
                                        </p>
                                        {receipt.purpose && (
                                            <p className="text-xs text-grayscale-600 break-words">
                                                {receipt.purpose}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className={button}
                                            disabled={loading}
                                            onClick={() =>
                                                void run(async context => {
                                                    if (
                                                        !(await deleteVerifierReceipt(
                                                            context,
                                                            receipt.eventId
                                                        ))
                                                    )
                                                        throw new Error('Deletion incomplete');
                                                })
                                            }
                                            aria-label={m['verifierHistory.deleteLabel']({
                                                verifier:
                                                    receipt.label ??
                                                    receipt.origin ??
                                                    m['verifierHistory.unknownVerifier'](),
                                            })}
                                        >
                                            {m['verifierHistory.delete']()}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </>
            )}
        </section>
    );
};
export default VerifierHistorySection;
