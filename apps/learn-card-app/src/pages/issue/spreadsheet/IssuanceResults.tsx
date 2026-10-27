import React, { useEffect, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, chevronForwardOutline } from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import type { IssuanceRun } from './issuanceTypes';
import { useSpreadsheetDialog } from './SpreadsheetDialog';
import { DeliveryStatus } from './DeliveryStatus';
import { BatchDeliveryAnimation } from './BatchDeliveryAnimation';
import { canCheckIssuanceStatus } from './issuance';

export interface IssuanceCompletionSummary {
    sent: number;
    failed: number;
    confirming: number;
    total: number;
}

export const IssuanceResults: React.FC<{
    run: IssuanceRun;
    busy: boolean;
    onResume: () => void;
    onRetry: () => void;
    onDownload: () => void;
    onNew: () => void;
    onCheckStatus?: () => void;
    checking?: boolean;
    onComplete?: (summary: IssuanceCompletionSummary) => void;
}> = ({ run, busy, onResume, onRetry, onDownload, onNew, onCheckStatus, checking, onComplete }) => {
    const progress = useRef<HTMLElement>(null);
    const revealedRun = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!busy || revealedRun.current === run.id) return;
        revealedRun.current = run.id;
        // Issuance can start from the sticky header while the form is scrolled down.
        // Reveal progress once; polling must never pull people away from their review.
        progress.current?.scrollIntoView?.({
            block: 'center',
            behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
                ? 'auto'
                : 'smooth',
        });
    }, [busy, run.id]);
    const outcomes = Object.values(run.outcomes);
    const sent = outcomes.filter(row => row.state === 'sent').length;
    const failed = outcomes.filter(row => row.state === 'failed').length;
    const confirming = outcomes.filter(row => row.state === 'confirming').length;
    const waiting = outcomes.filter(row => row.state === 'queued' || row.state === 'ready').length;
    const ready = !run.attempts.length && !outcomes.some(row => row.state !== 'ready');
    const total = run.draft.recipients.length;
    const allSent =
        !busy && total > 0 && sent === total && failed === 0 && confirming === 0 && waiting === 0;
    const needsAttention = !busy && !ready && (failed > 0 || confirming > 0);
    const activeRun = useRef<string>();
    useEffect(() => {
        if (busy) {
            activeRun.current = run.id;
            return;
        }
        // Announce the end of an active send, not a restored completed run or a poll.
        if (
            activeRun.current !== run.id ||
            waiting > 0 ||
            sent + failed + confirming !== total ||
            !total
        )
            return;
        activeRun.current = undefined;
        onComplete?.({ sent, failed, confirming, total });
    }, [busy, run.id, waiting, sent, failed, confirming, total, onComplete]);
    const openStatus = useSpreadsheetDialog(close => <DeliveryStatus run={run} onClose={close} />);
    const openIssues = useSpreadsheetDialog(close => (
        <DeliveryStatus run={run} initialFilter="issues" onClose={close} />
    ));
    const BUTTON =
        'py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 disabled:opacity-40';
    return (
        <section
            ref={progress}
            data-testid="issuance-progress"
            className={`font-poppins border rounded-[20px] p-4 sm:p-5 space-y-3 ${allSent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-grayscale-200'}`}
        >
            {!allSent && !needsAttention && (
                <BatchDeliveryAnimation active={busy || (!ready && waiting > 0)} />
            )}
            <div className="flex items-center gap-3">
                {(allSent || needsAttention) && (
                    <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${allSent ? 'bg-white text-emerald-700' : 'bg-red-50 text-red-600'}`}
                    >
                        <IonIcon
                            icon={allSent ? checkmarkCircleOutline : alertCircleOutline}
                            className="h-7 w-7"
                            aria-hidden="true"
                        />
                    </span>
                )}
                <div className="min-w-0 flex-1" aria-live="polite" aria-atomic="true" role="status">
                    <h3 className="text-base font-semibold text-grayscale-900">
                        {checking
                            ? m['issueFlow.sheet.checking']()
                            : busy
                              ? m['issueFlow.sheet.sending']({
                                    count: sent,
                                    total: run.draft.recipients.length,
                                })
                              : ready
                                ? m['issueFlow.sheet.savedDraft']()
                                : allSent
                                  ? m['issueFlow.sheet.reviewWorkspace.allSent']()
                                  : needsAttention
                                    ? m['issueFlow.sheet.reviewWorkspace.attention']()
                                    : m['issueFlow.sheet.results']({ sent, failed })}
                    </h3>
                    {(allSent || needsAttention) && (
                        <p className="mt-1 text-sm leading-relaxed text-grayscale-700">
                            {m['issueFlow.sheet.reviewWorkspace.completionCount']({ sent, total })}
                        </p>
                    )}
                    {allSent && (
                        <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                            {m['issueFlow.sheet.reviewWorkspace.completionHelp']()}
                        </p>
                    )}
                    {needsAttention && (
                        <p className="mt-1 text-xs leading-relaxed text-grayscale-600">
                            {confirming > 0
                                ? m['issueFlow.sheet.reviewWorkspace.confirmationHelp']()
                                : m['issueFlow.sheet.reviewWorkspace.failureHelp']()}
                        </p>
                    )}
                    {confirming > 0 && (
                        <p className="text-sm text-grayscale-700">
                            {m['issueFlow.sheet.confirming']({ count: confirming })}
                        </p>
                    )}
                    {waiting > 0 && !busy && !ready && (
                        <p className="text-sm text-grayscale-600">
                            {m['issueFlow.sheet.waiting']({ count: waiting })}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={openStatus}
                    className={`${BUTTON} inline-flex items-center gap-2`}
                >
                    {m['issueFlow.sheet.design.viewDeliveryStatus']()}
                    <IonIcon
                        icon={chevronForwardOutline}
                        className="rtl:rotate-180"
                        aria-hidden="true"
                    />
                </button>
                {!ready && (waiting > 0 || run.attempts.some(attempt => !attempt.done)) && (
                    <button type="button" disabled={busy} onClick={onResume} className={BUTTON}>
                        {m['issueFlow.sheet.resume']()}
                    </button>
                )}
                {onCheckStatus && canCheckIssuanceStatus(run) && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onCheckStatus}
                        className={`${BUTTON} inline-flex items-center gap-2`}
                    >
                        {checking && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 rounded-full border-2 border-grayscale-300 border-t-grayscale-900 animate-spin"
                            />
                        )}
                        {checking
                            ? m['issueFlow.sheet.checking']()
                            : m['issueFlow.sheet.checkStatus']()}
                    </button>
                )}
                {failed > 0 && (
                    <>
                        <button type="button" disabled={busy} onClick={onRetry} className={BUTTON}>
                            {m['issueFlow.sheet.retryFailed']()}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onDownload}
                            className={BUTTON}
                        >
                            {m['issueFlow.sheet.downloadFailed']({ count: failed })}
                        </button>
                    </>
                )}
                {!busy && (
                    <button type="button" onClick={onNew} className={BUTTON}>
                        {m['issueFlow.sheet.newRun']()}
                    </button>
                )}
            </div>
            {confirming > 0 && (
                <p className="text-xs text-grayscale-600 leading-relaxed">
                    {m['issueFlow.sheet.confirmingHelp']()}
                </p>
            )}
            {(failed > 0 || confirming > 0) && (
                <button
                    type="button"
                    onClick={openIssues}
                    className="flex w-full items-center gap-2 rounded-[20px] bg-grayscale-100 px-4 py-3 text-start text-sm font-medium text-grayscale-900 hover:bg-grayscale-200 transition-colors"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-600"
                        aria-hidden="true"
                    />
                    <span className="flex-1">
                        {m['issueFlow.sheet.design.reviewDeliveryIssues']({
                            count: failed + confirming,
                        })}
                    </span>
                    <IonIcon
                        icon={chevronForwardOutline}
                        className="rtl:rotate-180"
                        aria-hidden="true"
                    />
                </button>
            )}
        </section>
    );
};
