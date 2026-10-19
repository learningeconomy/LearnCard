import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, chevronForwardOutline, searchOutline } from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import { recipientDisplayName, recipientKey } from '../components/recipientTypes';
import { getFriendlyIssueError } from '../issueErrors';
import type { IssuanceRun } from './issuanceTypes';
import { SpreadsheetDialog, useSpreadsheetDialog } from './SpreadsheetDialog';

const deliveryIssues = (run: IssuanceRun) =>
    run.draft.recipients.filter(row =>
        ['failed', 'confirming'].includes(run.outcomes[recipientKey(row)]?.state ?? '')
    );

export const IssuanceResults: React.FC<{
    run: IssuanceRun;
    busy: boolean;
    onResume: () => void;
    onRetry: () => void;
    onDownload: () => void;
    onNew: () => void;
}> = ({ run, busy, onResume, onRetry, onDownload, onNew }) => {
    const outcomes = Object.values(run.outcomes);
    const sent = outcomes.filter(row => row.state === 'sent').length;
    const failed = outcomes.filter(row => row.state === 'failed').length;
    const confirming = outcomes.filter(row => row.state === 'confirming').length;
    const waiting = outcomes.filter(row => row.state === 'queued' || row.state === 'ready').length;
    const ready = !run.attempts.length && !outcomes.some(row => row.state !== 'ready');
    const openIssues = useSpreadsheetDialog(close => <DeliveryIssues run={run} onClose={close} />);
    const BUTTON =
        'py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 disabled:opacity-40';
    return (
        <section className="font-poppins bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
            <div aria-live="polite" role="status">
                <h3 className="text-base font-semibold text-grayscale-900">
                    {busy
                        ? m['issueFlow.sheet.sending']({
                              count: sent,
                              total: run.draft.recipients.length,
                          })
                        : ready
                          ? m['issueFlow.sheet.savedDraft']()
                          : m['issueFlow.sheet.results']({ sent, failed })}
                </h3>
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
            <div className="flex flex-wrap gap-2">
                {(waiting > 0 || run.attempts.some(attempt => !attempt.done)) && (
                    <button type="button" disabled={busy} onClick={onResume} className={BUTTON}>
                        {m['issueFlow.sheet.resume']()}
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

export const DeliveryIssues: React.FC<{ run: IssuanceRun; onClose: () => void }> = ({
    run,
    onClose,
}) => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const rows = deliveryIssues(run).filter(row =>
        `${recipientDisplayName(row)} ${row.kind === 'email' ? row.email : row.profileId}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
    );
    const size = 25;
    const current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));
    const BUTTON =
        'rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700 disabled:opacity-40';
    return (
        <SpreadsheetDialog
            title={m['issueFlow.sheet.design.deliveryIssues']()}
            subtitle={m['issueFlow.sheet.design.deliveryIssuesHint']()}
            icon={alertCircleOutline}
            iconTone="neutral"
            onClose={onClose}
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-grayscale-600">
                        {m['issueFlow.sheet.pageRows']({
                            first: rows.length ? current * size + 1 : 0,
                            last: Math.min((current + 1) * size, rows.length),
                            total: rows.length,
                        })}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className={BUTTON}
                            disabled={!current}
                            onClick={() => setPage(current - 1)}
                        >
                            {m['common.back']()}
                        </button>
                        <button
                            type="button"
                            className={BUTTON}
                            disabled={(current + 1) * size >= rows.length}
                            onClick={() => setPage(current + 1)}
                        >
                            {m['common.next']()}
                        </button>
                        <button
                            type="button"
                            className="rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white"
                            onClick={onClose}
                        >
                            {m['common.done']()}
                        </button>
                    </div>
                </div>
            }
        >
            <label className="relative mb-5 block">
                <IonIcon
                    icon={searchOutline}
                    className="pointer-events-none absolute start-4 top-4 text-grayscale-500"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    value={query}
                    onChange={event => {
                        setQuery(event.target.value);
                        setPage(0);
                    }}
                    aria-label={m['issueFlow.sheet.design.searchDeliveryIssues']()}
                    placeholder={m['issueFlow.sheet.design.searchDeliveryIssues']()}
                    className="w-full rounded-xl border border-grayscale-300 bg-white py-3 pe-4 ps-11 text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                />
            </label>
            <ul className="space-y-3">
                {rows.slice(current * size, (current + 1) * size).map(row => (
                    <li
                        key={recipientKey(row)}
                        className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 space-y-1"
                    >
                        <p className="text-sm font-semibold text-grayscale-900">
                            {recipientDisplayName(row)}
                        </p>
                        {row.kind === 'email' && (
                            <p className="break-all text-sm text-grayscale-600">{row.email}</p>
                        )}
                        <p className="text-sm leading-relaxed text-grayscale-700">
                            {run.outcomes[recipientKey(row)]?.state === 'confirming'
                                ? m['issueFlow.sheet.needsConfirmation']()
                                : getFriendlyIssueError(
                                      { message: run.outcomes[recipientKey(row)]?.error?.message },
                                      'people'
                                  ).message}
                        </p>
                    </li>
                ))}
            </ul>
            {!rows.length && (
                <p className="py-10 text-center text-sm text-grayscale-600">
                    {m['issueFlow.sheet.design.noMatches']()}
                </p>
            )}
        </SpreadsheetDialog>
    );
};
