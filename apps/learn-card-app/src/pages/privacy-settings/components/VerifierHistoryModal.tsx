import React, { useEffect, useId, useRef, useState } from 'react';
import { enterSharePrivacy } from '../../../components/share-links/sharePrivacy';
import { useHistoryAccountRevision } from '../../../helpers/verifier-history/account';
import { useVerifierHistoryEligibility } from '../../../helpers/verifier-history/useEligibility';
import {
    clearVerifierHistory,
    deleteVerifierReceipt,
    loadVerifierHistory,
    type HistoryContext,
} from '../../../helpers/verifier-history/history';
import { historyButton, VerifierHistoryList } from './VerifierHistoryList';
import * as m from '../../../paraglide/messages.js';
import './VerifierHistoryModal.css';
import { useConfirmClearVerifierHistory } from './useConfirmClearVerifierHistory';
import { VerifierHistoryLoading } from './VerifierHistoryLoading';

type Loaded = Awaited<ReturnType<typeof loadVerifierHistory>>;
const PAGE_SIZE = 20;

/** Page an already-decrypted bounded history; page navigation never calls storage. */
export const VerifierHistoryModal: React.FC<{
    context: HistoryContext;
    initialData: Loaded;
    onUpdate: (data: Loaded) => void;
    onClose: () => void;
}> = ({ context, initialData, onUpdate, onClose }) => {
    const revision = useHistoryAccountRevision();
    const eligible = useVerifierHistoryEligibility();
    const current = context.isCurrent() && context.eligible && eligible();
    const confirmClear = useConfirmClearVerifierHistory(current);
    const titleId = useId();
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const inFlight = useRef(false);
    const scroller = useRef<HTMLDivElement>(null);
    const pageCount = Math.max(1, Math.ceil(data.receipts.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount - 1);
    useEffect(() => {
        // Hide the old account synchronously above, then dismiss this exact modal instance.
        if (!current) onClose();
    }, [current, revision, onClose]);
    useEffect(() => {
        if (scroller.current) scroller.current.scrollTop = 0;
    }, [currentPage]);
    const run = async (action?: (context: HistoryContext) => Promise<unknown>) => {
        if (inFlight.current || !context.isCurrent() || !context.eligible || !eligible()) return;
        enterSharePrivacy();
        inFlight.current = true;
        setBusy(true);
        setError(false);
        try {
            const result = action ? await action(context) : undefined;
            if (!context.isCurrent() || !context.eligible || !eligible()) return;
            const next = await loadVerifierHistory(context);
            if (result === false) next.cleanupComplete = false;
            if (context.isCurrent() && context.eligible && eligible()) {
                setData(next);
                setPage(previous =>
                    Math.min(previous, Math.max(0, Math.ceil(next.receipts.length / PAGE_SIZE) - 1))
                );
                onUpdate(next);
            }
        } catch {
            if (context.isCurrent() && context.eligible && eligible()) setError(true);
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    };
    return (
        <div
            data-testid="verifier-history-modal"
            className="sentry-block ph-no-capture flex h-full min-h-0 flex-col bg-white font-poppins text-grayscale-900"
            data-html2canvas-ignore
            data-feedback-exclude
        >
            <header className="shrink-0 border-b border-grayscale-200 p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h2 id={titleId} className="text-xl font-semibold">
                        {m['verifierHistory.title']()}
                    </h2>
                    <button type="button" className={historyButton} onClick={onClose}>
                        {m['common.done']()}
                    </button>
                </div>
                {current && (
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className={historyButton}
                            disabled={busy}
                            onClick={() => void run()}
                        >
                            {m['verifierHistory.refresh']()}
                        </button>
                        <button
                            type="button"
                            className={historyButton}
                            disabled={
                                busy || (!data.receipts.length && data.cleanupComplete && !error)
                            }
                            onClick={() =>
                                confirmClear(
                                    () =>
                                        void run(historyContext =>
                                            clearVerifierHistory(historyContext)
                                        ),
                                    error || !data.cleanupComplete
                                )
                            }
                        >
                            {m['verifierHistory.clear']()}
                        </button>
                    </div>
                )}
            </header>
            {current && (
                <>
                    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
                        <p className="text-xs text-grayscale-600 leading-relaxed">
                            {m['verifierHistory.limits']()}
                        </p>
                        {error && (
                            <p role="alert" className="text-sm text-red-700">
                                {m['verifierHistory.loadFailed']()}
                            </p>
                        )}
                        {!data.cleanupComplete && (
                            <p role="status" className="text-sm text-amber-700">
                                {m['verifierHistory.cleanupPending']()}
                            </p>
                        )}
                        {busy && <VerifierHistoryLoading />}
                        {!data.receipts.length && (
                            <p className="text-sm text-grayscale-600">
                                {m['verifierHistory.empty']()}
                            </p>
                        )}
                        <VerifierHistoryList
                            receipts={data.receipts.slice(
                                currentPage * PAGE_SIZE,
                                (currentPage + 1) * PAGE_SIZE
                            )}
                            loading={busy}
                            onDelete={id =>
                                void run(async historyContext => {
                                    if (!(await deleteVerifierReceipt(historyContext, id)))
                                        throw new Error('Deletion incomplete');
                                })
                            }
                        />
                    </div>
                    <footer className="shrink-0 border-t border-grayscale-200 p-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            className={historyButton}
                            disabled={busy || currentPage === 0}
                            onClick={() => setPage(currentPage - 1)}
                        >
                            {m['verifierHistory.previous']()}
                        </button>
                        <p role="status" aria-live="polite" className="text-xs text-grayscale-600">
                            {m['verifierHistory.page']({
                                page: String(currentPage + 1),
                                total: String(pageCount),
                            })}
                        </p>
                        <button
                            type="button"
                            className={historyButton}
                            disabled={busy || currentPage + 1 >= pageCount}
                            onClick={() => setPage(currentPage + 1)}
                        >
                            {m['verifierHistory.next']()}
                        </button>
                    </footer>
                </>
            )}
        </div>
    );
};
