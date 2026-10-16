import React from 'react';
import * as m from '../../../paraglide/messages.js';
import { recipientDisplayName, recipientKey } from '../components/recipientTypes';
import { getFriendlyIssueError } from '../issueErrors';
import type { IssuanceRun } from './issuanceTypes';

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
                    <p className="text-sm text-amber-700">
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
                <ul className="space-y-2 text-sm text-grayscale-700">
                    {run.draft.recipients
                        .filter(row =>
                            ['failed', 'confirming'].includes(
                                run.outcomes[recipientKey(row)]?.state ?? ''
                            )
                        )
                        .map(row => (
                            <li key={recipientKey(row)}>
                                <strong>{recipientDisplayName(row)}</strong>
                                {' · '}
                                {run.outcomes[recipientKey(row)]?.state === 'confirming'
                                    ? m['issueFlow.sheet.needsConfirmation']()
                                    : getFriendlyIssueError(
                                          {
                                              message:
                                                  run.outcomes[recipientKey(row)]?.error?.message,
                                          },
                                          'people'
                                      ).message}
                            </li>
                        ))}
                </ul>
            )}
        </section>
    );
};
