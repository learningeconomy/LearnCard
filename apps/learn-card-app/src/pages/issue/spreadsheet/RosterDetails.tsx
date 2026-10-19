import React, { useState } from 'react';
import { useModal, ModalTypes } from 'learn-card-base';
import { MediaAttachments, type SimpleMediaAttachment } from '../components/MediaAttachments';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    peopleOutline,
    checkmarkCircleOutline,
    searchOutline,
    downloadOutline,
    cloudUploadOutline,
    lockClosedOutline,
    chevronForwardOutline,
} from 'ionicons/icons';
import { useScreenWidth } from 'learn-card-base/hooks/useScreenWidth';
import { SpreadsheetDialog, useSpreadsheetDialog } from './SpreadsheetDialog';
import * as m from '../../../paraglide/messages.js';
import { recipientKey, recipientDisplayName, type Recipient } from '../components/recipientTypes';
import { humanizeVariable } from '../components/variableSubstitution';
import { spreadsheetProblem } from './messages';
import type { ColumnScopes } from './roster';
import type { RowProblem } from './types';

const INPUT =
    'w-full min-w-[120px] py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:bg-grayscale-100';
export interface RosterDetailsProps {
    recipients: Recipient[];
    attachments: Record<string, SimpleMediaAttachment[]>;
    onAttachmentsChange: (rowId: string, attachments: SimpleMediaAttachment[]) => void;
    variables: string[];
    labels?: Record<string, string>;
    scopes: ColumnScopes;
    shared: Record<string, string>;
    values: Record<string, Record<string, string>>;
    evidence: Record<string, string>;
    problems: Record<string, RowProblem[]>;
    locked: (rowId: string) => boolean;
    canRemove?: (rowId: string) => boolean;
    disabled?: boolean;
    onRecipientsChange: (recipients: Recipient[]) => void;
    onScopeChange: (name: string, scope: 'shared' | 'perRecipient') => void;
    onSharedChange: (name: string, value: string) => void;
    onChange: (rowId: string, name: string, value: string) => void;
    onEvidenceChange: (rowId: string, value: string) => void;
    onDownload: () => void;
    onUpload: () => void;
}

export const RosterDetails: React.FC<RosterDetailsProps> = props => {
    const issues = props.recipients.filter(row => props.problems[recipientKey(row)]?.length).length;
    const open = useSpreadsheetDialog(close => <RosterEditor {...props} onClose={close} />);
    if (!props.recipients.length) return null;
    return (
        <section className="rounded-[20px] border border-grayscale-200 bg-white p-5 font-poppins space-y-4">
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <IonIcon icon={peopleOutline} className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-grayscale-900">
                        {m['issueFlow.sheet.details']()}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                        {m['issueFlow.sheet.design.peopleHint']()}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-grayscale-100 px-3 py-2 text-grayscale-700">
                    {m['issueFlow.sheet.peopleSummary']({ count: props.recipients.length })}
                </span>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${issues ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-700'}`}
                >
                    <IonIcon
                        icon={issues ? alertCircleOutline : checkmarkCircleOutline}
                        aria-hidden="true"
                    />
                    {issues
                        ? m['issueFlow.sheet.design.issueCount']({ count: issues })
                        : m['issueFlow.sheet.design.noIssues']()}
                </span>
            </div>
            <button
                type="button"
                onClick={open}
                className="flex w-full items-center justify-between gap-3 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
                {m['issueFlow.sheet.design.reviewPeople']()}
                <IonIcon icon={chevronForwardOutline} aria-hidden="true" />
            </button>
        </section>
    );
};

export const RosterEditor: React.FC<RosterDetailsProps & { onClose: () => void }> = props => {
    const { newModal, closeModal } = useModal();
    const width = useScreenWidth();
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState('');
    const [onlyIssues, setOnlyIssues] = useState(false);
    const { recipients, variables, scopes, shared, values, evidence, problems, disabled } = props;
    const issues = recipients.filter(row => problems[recipientKey(row)]?.length).length;
    const sorted = [...recipients]
        .filter(row => {
            const matches =
                `${recipientDisplayName(row)} ${row.kind === 'email' ? row.email : row.profileId}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase());
            return matches && (!onlyIssues || Boolean(problems[recipientKey(row)]?.length));
        })
        .sort(
            (a, b) =>
                Number(Boolean(problems[recipientKey(b)]?.length)) -
                Number(Boolean(problems[recipientKey(a)]?.length))
        );
    const pageSize = 25;
    const currentPage = Math.min(page, Math.max(0, Math.ceil(sorted.length / pageSize) - 1));
    const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const fieldLabel = (name: string): string => props.labels?.[name] ?? humanizeVariable(name);
    const input = (recipient: Recipient, name: string): React.ReactNode => (
        <input
            aria-label={`${recipientDisplayName(recipient)} ${fieldLabel(name)}`}
            className={INPUT}
            value={
                scopes[name] === 'perRecipient'
                    ? (values[recipientKey(recipient)]?.[name] ?? '')
                    : (shared[name] ?? '')
            }
            disabled={
                disabled || props.locked(recipientKey(recipient)) || scopes[name] !== 'perRecipient'
            }
            onChange={event => props.onChange(recipientKey(recipient), name, event.target.value)}
        />
    );
    const identity = (recipient: Recipient): React.ReactNode => (
        <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-grayscale-900">
                    {recipientDisplayName(recipient)}
                </span>
                {props.locked(recipientKey(recipient)) && (
                    <IonIcon
                        icon={lockClosedOutline}
                        className="text-grayscale-500"
                        aria-label={m['issueFlow.sheet.design.locked']()}
                    />
                )}
            </div>
            {recipient.kind === 'email' ? (
                <input
                    aria-label={m['issueFlow.sheet.emailFor']({
                        name: recipientDisplayName(recipient),
                    })}
                    className={INPUT}
                    aria-invalid={Boolean(problems[recipientKey(recipient)]?.includes('email'))}
                    value={recipient.email}
                    disabled={disabled || props.locked(recipientKey(recipient))}
                    onChange={event =>
                        props.onRecipientsChange(
                            recipients.map(row =>
                                row === recipient
                                    ? { ...row, email: event.target.value.trim().toLowerCase() }
                                    : row
                            )
                        )
                    }
                />
            ) : (
                <p className="break-all text-sm text-grayscale-600">@{recipient.profileId}</p>
            )}
            {problems[recipientKey(recipient)]?.length > 0 && (
                <p
                    className="flex items-start gap-1.5 text-xs leading-relaxed text-red-700"
                    role="status"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                    />
                    {problems[recipientKey(recipient)]!.map(spreadsheetProblem).join(' · ')}
                </p>
            )}
        </div>
    );
    const evidenceInput = (recipient: Recipient): React.ReactNode => (
        <div className="space-y-2">
            <input
                type="url"
                aria-label={m['issueFlow.sheet.evidenceFor']({
                    name: recipientDisplayName(recipient),
                })}
                placeholder="https://"
                value={evidence[recipientKey(recipient)] ?? ''}
                className={INPUT}
                disabled={disabled || props.locked(recipientKey(recipient))}
                onChange={event =>
                    props.onEvidenceChange(recipientKey(recipient), event.target.value)
                }
            />
            <button
                type="button"
                disabled={disabled || props.locked(recipientKey(recipient))}
                className="py-2 text-xs font-medium text-grayscale-600 hover:text-grayscale-900 disabled:opacity-40"
                onClick={() =>
                    newModal(
                        <RowAttachments
                            initial={props.attachments[recipientKey(recipient)] ?? []}
                            onChange={attachments =>
                                props.onAttachmentsChange(recipientKey(recipient), attachments)
                            }
                            onClose={closeModal}
                        />,
                        {},
                        { mobile: ModalTypes.Freeform, desktop: ModalTypes.Center }
                    )
                }
            >
                {m['issueFlow.media.title']()} (
                {props.attachments[recipientKey(recipient)]?.length ?? 0})
            </button>
        </div>
    );
    const remove = (recipient: Recipient): React.ReactNode => (
        <button
            type="button"
            disabled={
                disabled ||
                props.locked(recipientKey(recipient)) ||
                props.canRemove?.(recipientKey(recipient)) === false
            }
            onClick={() => props.onRecipientsChange(recipients.filter(row => row !== recipient))}
            className="rounded-[20px] border border-grayscale-300 px-3 py-2 text-sm text-grayscale-700 hover:bg-grayscale-10 disabled:opacity-40"
        >
            {m['issueFlow.sheet.skip']()}
        </button>
    );
    return (
        <SpreadsheetDialog
            title={m['issueFlow.sheet.design.reviewPeople']()}
            subtitle={m['issueFlow.sheet.design.editorHint']()}
            icon={peopleOutline}
            onClose={props.onClose}
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-grayscale-600">
                        {m['issueFlow.sheet.pageRows']({
                            first: sorted.length ? currentPage * pageSize + 1 : 0,
                            last: Math.min((currentPage + 1) * pageSize, sorted.length),
                            total: sorted.length,
                        })}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 0}
                            onClick={() => setPage(currentPage - 1)}
                            className="rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700 disabled:opacity-40"
                        >
                            {m['common.back']()}
                        </button>
                        <button
                            type="button"
                            disabled={(currentPage + 1) * pageSize >= sorted.length}
                            onClick={() => setPage(currentPage + 1)}
                            className="rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700 disabled:opacity-40"
                        >
                            {m['common.next']()}
                        </button>
                        <button
                            type="button"
                            onClick={props.onClose}
                            className="rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white"
                        >
                            {m['common.done']()}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            aria-pressed={!onlyIssues}
                            onClick={() => {
                                setOnlyIssues(false);
                                setPage(0);
                            }}
                            className={`rounded-full px-3 py-2 text-xs font-medium ${!onlyIssues ? 'bg-grayscale-900 text-white' : 'bg-grayscale-100 text-grayscale-700'}`}
                        >
                            {m['issueFlow.sheet.peopleSummary']({ count: recipients.length })}
                        </button>
                        <button
                            type="button"
                            aria-pressed={onlyIssues}
                            onClick={() => {
                                setOnlyIssues(true);
                                setPage(0);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${onlyIssues ? 'bg-amber-100 text-amber-900' : 'bg-amber-50 text-amber-900'}`}
                        >
                            <IonIcon icon={alertCircleOutline} aria-hidden="true" />
                            {m['issueFlow.sheet.design.issueCount']({ count: issues })}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={props.onDownload}
                            disabled={disabled}
                            className="inline-flex items-center gap-1.5 py-2 text-xs font-medium text-grayscale-700 disabled:opacity-40"
                        >
                            <IonIcon icon={downloadOutline} aria-hidden="true" />
                            {m['issueFlow.sheet.download']()}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                props.onClose();
                                props.onUpload();
                            }}
                            disabled={disabled}
                            className="inline-flex items-center gap-1.5 py-2 text-xs font-medium text-grayscale-700 disabled:opacity-40"
                        >
                            <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
                            {m['issueFlow.sheet.upload']()}
                        </button>
                    </div>
                </div>
                <label className="relative block">
                    <IonIcon
                        icon={searchOutline}
                        className="pointer-events-none absolute start-4 top-4 text-grayscale-500"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        aria-label={m['issueFlow.sheet.searchPeople']()}
                        placeholder={m['issueFlow.sheet.searchPeople']()}
                        className={`${INPUT} !ps-11`}
                        value={query}
                        onChange={event => {
                            setQuery(event.target.value);
                            setPage(0);
                        }}
                    />
                </label>
                {variables.length > 0 && (
                    <details className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                        <summary className="cursor-pointer text-sm font-medium text-grayscale-900">
                            {m['issueFlow.sheet.design.fieldSettings']({ count: variables.length })}
                        </summary>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {variables.map(name => (
                                <div key={name} className="space-y-2">
                                    <label
                                        htmlFor={`scope-${name}`}
                                        className="block text-xs font-medium text-grayscale-700"
                                    >
                                        {fieldLabel(name)}
                                    </label>
                                    <select
                                        id={`scope-${name}`}
                                        disabled={disabled}
                                        value={scopes[name] ?? 'shared'}
                                        onChange={event =>
                                            props.onScopeChange(
                                                name,
                                                event.target.value as 'shared' | 'perRecipient'
                                            )
                                        }
                                        className={INPUT}
                                    >
                                        <option value="shared">
                                            {m['issueFlow.fields.sameForAll']()}
                                        </option>
                                        <option value="perRecipient">
                                            {m['issueFlow.fields.perRecipient']()}
                                        </option>
                                    </select>
                                    {scopes[name] !== 'perRecipient' && (
                                        <input
                                            aria-label={fieldLabel(name)}
                                            className={INPUT}
                                            value={shared[name] ?? ''}
                                            disabled={disabled}
                                            onChange={event =>
                                                props.onSharedChange(name, event.target.value)
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
                {!visible.length ? (
                    <div className="rounded-2xl border border-dashed border-grayscale-300 p-10 text-center text-sm text-grayscale-600">
                        {m['issueFlow.sheet.design.noMatches']()}
                    </div>
                ) : width > 991 ? (
                    <div className="overflow-x-auto rounded-2xl border border-grayscale-200">
                        <table className="w-full border-separate border-spacing-0 text-start">
                            <thead className="bg-grayscale-100">
                                <tr>
                                    {[
                                        m['issueFlow.sheet.recipient'](),
                                        ...variables.map(fieldLabel),
                                        m['issueFlow.sheet.evidence'](),
                                        '',
                                    ].map((label, index) => (
                                        <th
                                            key={index}
                                            className="border-b border-grayscale-200 px-4 py-3 text-xs font-medium text-grayscale-700"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(recipient => (
                                    <tr
                                        key={recipientKey(recipient)}
                                        className={
                                            problems[recipientKey(recipient)]?.length
                                                ? 'bg-red-50'
                                                : 'bg-white'
                                        }
                                    >
                                        <td className="min-w-[270px] border-b border-grayscale-100 p-4 align-top">
                                            {identity(recipient)}
                                        </td>
                                        {variables.map(name => (
                                            <td
                                                key={name}
                                                className="min-w-[200px] border-b border-grayscale-100 p-4 align-top"
                                            >
                                                {input(recipient, name)}
                                            </td>
                                        ))}
                                        <td className="min-w-[260px] border-b border-grayscale-100 p-4 align-top">
                                            {evidenceInput(recipient)}
                                        </td>
                                        <td className="border-b border-grayscale-100 p-4 align-top">
                                            {remove(recipient)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map(recipient => (
                            <article
                                key={recipientKey(recipient)}
                                className={`rounded-2xl border p-4 space-y-4 ${problems[recipientKey(recipient)]?.length ? 'border-red-100 bg-red-50' : 'border-grayscale-200 bg-white'}`}
                            >
                                {identity(recipient)}
                                {variables.map(name => (
                                    <label
                                        key={name}
                                        className="block space-y-1.5 text-xs font-medium text-grayscale-700"
                                    >
                                        <span>{fieldLabel(name)}</span>
                                        {input(recipient, name)}
                                    </label>
                                ))}
                                <label className="block space-y-1.5 text-xs font-medium text-grayscale-700">
                                    <span>{m['issueFlow.sheet.evidence']()}</span>
                                    {evidenceInput(recipient)}
                                </label>
                                <div className="flex justify-end">{remove(recipient)}</div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </SpreadsheetDialog>
    );
};

const RowAttachments: React.FC<{
    initial: SimpleMediaAttachment[];
    onChange: (next: SimpleMediaAttachment[]) => void;
    onClose: () => void;
}> = ({ initial, onChange, onClose }) => {
    const [attachments, setAttachments] = useState(initial);
    return (
        <div className="font-poppins bg-white p-6 space-y-4">
            <MediaAttachments
                attachments={attachments}
                onChange={next => {
                    setAttachments(next);
                    onChange(next);
                }}
                bare
            />
            <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm"
            >
                {m['common.done']()}
            </button>
        </div>
    );
};
