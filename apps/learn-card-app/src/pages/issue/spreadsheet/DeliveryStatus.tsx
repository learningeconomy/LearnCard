import React, { useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    ellipseOutline,
    helpCircleOutline,
    paperPlaneOutline,
    searchOutline,
    timeOutline,
} from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import { recipientDisplayName, recipientKey } from '../components/recipientTypes';
import { getFriendlyIssueError } from '../issueErrors';
import type { IssuanceRun, RowOutcomeState } from './issuanceTypes';
import { SpreadsheetDialog } from './SpreadsheetDialog';

type StatusFilter = 'all' | 'issues' | RowOutcomeState;
const STATES: RowOutcomeState[] = ['ready', 'queued', 'sent', 'failed', 'confirming'];
const STATUS_ICONS = {
    ready: ellipseOutline,
    queued: timeOutline,
    sent: checkmarkCircleOutline,
    failed: alertCircleOutline,
    confirming: helpCircleOutline,
};
const statusLabel = (state: RowOutcomeState): string =>
    m[`issueFlow.sheet.design.deliveryState.${state}`]();

export const DeliveryStatus: React.FC<{
    run: IssuanceRun;
    initialFilter?: StatusFilter;
    onClose: () => void;
}> = ({ run, initialFilter = 'all', onClose }) => {
    const filterId = useId();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<StatusFilter>(initialFilter);
    const [page, setPage] = useState(0);
    const counts: Record<RowOutcomeState, number> = {
        ready: 0,
        queued: 0,
        sent: 0,
        failed: 0,
        confirming: 0,
    };
    for (const row of run.draft.recipients)
        counts[run.outcomes[recipientKey(row)]?.state ?? 'ready']++;
    const rows = run.draft.recipients.filter(row => {
        const state = run.outcomes[recipientKey(row)]?.state ?? 'ready';
        const statusMatches =
            filter === 'all' ||
            state === filter ||
            (filter === 'issues' && (state === 'failed' || state === 'confirming'));
        return (
            statusMatches &&
            `${recipientDisplayName(row)} ${row.kind === 'email' ? row.email : row.profileId}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
        );
    });
    const size = 25;
    const current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));
    const BUTTON =
        'rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700 disabled:opacity-40';
    return (
        <SpreadsheetDialog
            title={m['issueFlow.sheet.design.deliveryStatus']()}
            subtitle={m['issueFlow.sheet.design.deliveryStatusHint']()}
            icon={paperPlaneOutline}
            iconTone="neutral"
            onClose={onClose}
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-grayscale-600" aria-live="polite">
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
            <div className="mb-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative">
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
                        aria-label={m['issueFlow.sheet.design.searchDeliveryStatus']()}
                        placeholder={m['issueFlow.sheet.design.searchDeliveryStatus']()}
                        className="w-full rounded-xl border border-grayscale-300 bg-white py-3 pe-4 ps-11 text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                    />
                </div>
                <div>
                    <label
                        htmlFor={filterId}
                        className="mb-1.5 block text-xs font-medium text-grayscale-700"
                    >
                        {m['issueFlow.sheet.design.statusFilter']()}
                    </label>
                    <select
                        id={filterId}
                        value={filter}
                        onChange={event => {
                            setFilter(event.target.value as StatusFilter);
                            setPage(0);
                        }}
                        className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-base text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                    >
                        <option value="all">
                            {m['issueFlow.sheet.design.allDeliveryStatuses']({
                                count: run.draft.recipients.length,
                            })}
                        </option>
                        {STATES.map(state => (
                            <option key={state} value={state}>
                                {statusLabel(state)} · {counts[state]}
                            </option>
                        ))}
                        <option value="issues">
                            {m['issueFlow.sheet.design.reviewDeliveryIssues']({
                                count: counts.failed + counts.confirming,
                            })}
                        </option>
                    </select>
                </div>
            </div>
            {filter === 'issues' && (
                <p className="mb-4 text-sm leading-relaxed text-grayscale-600">
                    {m['issueFlow.sheet.design.deliveryIssuesHint']()}
                </p>
            )}
            <ul className="space-y-3">
                {rows.slice(current * size, (current + 1) * size).map(row => {
                    const outcome = run.outcomes[recipientKey(row)];
                    const state = outcome?.state ?? 'ready';
                    return (
                        <li
                            key={recipientKey(row)}
                            className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-grayscale-900">
                                        {recipientDisplayName(row)}
                                    </p>
                                    {row.kind === 'email' && (
                                        <p className="mt-1 break-all text-sm text-grayscale-600">
                                            {row.email}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${state === 'sent' ? 'bg-emerald-50 text-emerald-700' : state === 'failed' ? 'bg-grayscale-100 text-red-700' : 'bg-grayscale-100 text-grayscale-700'}`}
                                >
                                    <IonIcon icon={STATUS_ICONS[state]} aria-hidden="true" />
                                    {statusLabel(state)}
                                </span>
                            </div>
                            {(state === 'confirming' || state === 'failed') && (
                                <p className="mt-2 text-sm leading-relaxed text-grayscale-700">
                                    {state === 'confirming'
                                        ? m['issueFlow.sheet.needsConfirmation']()
                                        : getFriendlyIssueError(
                                              { message: outcome?.error?.message },
                                              'people'
                                          ).message}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>
            {!rows.length && (
                <p className="py-10 text-center text-sm text-grayscale-600">
                    {m['issueFlow.sheet.design.noMatches']()}
                </p>
            )}
        </SpreadsheetDialog>
    );
};
