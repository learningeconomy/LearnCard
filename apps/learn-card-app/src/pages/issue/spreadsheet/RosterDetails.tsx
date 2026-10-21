import React, { useId, useState } from 'react';
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
import { RosterDateInput } from './RosterDateInput';
import type { RowFieldProblems, RowProblem } from './types';

const INPUT =
    'w-full min-w-[120px] py-3 px-4 border border-grayscale-300 rounded-xl text-base sm:text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:bg-grayscale-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:border-red-500 aria-[invalid=true]:focus:ring-red-500';
export interface RosterDetailsProps {
    recipients: Recipient[];
    attachments: Record<string, SimpleMediaAttachment[]>;
    onAttachmentsChange: (rowId: string, attachments: SimpleMediaAttachment[]) => void;
    variables: string[];
    labels?: Record<string, string>;
    dateVariables?: string[];
    scopes: ColumnScopes;
    shared: Record<string, string>;
    values: Record<string, Record<string, string>>;
    evidence: Record<string, string>;
    problems: Record<string, RowProblem[]>;
    fieldProblems?: Record<string, RowFieldProblems>;
    locked: (rowId: string) => boolean;
    canRemove?: (rowId: string) => boolean;
    disabled?: boolean;
    saveError?: string;
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
        <section className="rounded-[20px] border border-grayscale-200 bg-white p-5 font-poppins space-y-v3-4">
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${issues ? 'bg-grayscale-100 text-grayscale-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                    <IonIcon
                        icon={issues ? alertCircleOutline : checkmarkCircleOutline}
                        className={issues ? 'text-red-600' : undefined}
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
    const [editing, setEditing] = useState<{ id: string; attention: boolean }>();
    const errorPrefix = useId();
    const { recipients, variables, scopes, shared, values, evidence, problems, disabled } = props;
    const issues = recipients.filter(row => problems[recipientKey(row)]?.length).length;
    const sorted = [...recipients]
        .filter(row => {
            const matches =
                `${recipientDisplayName(row)} ${row.kind === 'email' ? row.email : row.profileId}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase());
            return (
                editing?.id === recipientKey(row) ||
                (matches && (!onlyIssues || Boolean(problems[recipientKey(row)]?.length)))
            );
        })
        .sort(
            (a, b) =>
                Number(
                    editing?.id === recipientKey(b)
                        ? editing.attention
                        : Boolean(problems[recipientKey(b)]?.length)
                ) -
                Number(
                    editing?.id === recipientKey(a)
                        ? editing.attention
                        : Boolean(problems[recipientKey(a)]?.length)
                )
        );
    const pageSize = 25;
    const currentPage = Math.min(page, Math.max(0, Math.ceil(sorted.length / pageSize) - 1));
    const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    // A partially corrected email can become valid before the person finishes typing.
    // Keep the focused row in its current issue group until focus leaves that row.
    const focusHandlers = (row: Recipient) => ({
        onFocusCapture: () =>
            setEditing(previous =>
                previous?.id === recipientKey(row)
                    ? previous
                    : {
                          id: recipientKey(row),
                          attention: Boolean(problems[recipientKey(row)]?.length),
                      }
            ),
        onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setEditing(undefined);
        },
    });
    const fieldLabel = (name: string): string => props.labels?.[name] ?? humanizeVariable(name);
    const errorId = (rowId: string, field: string): string =>
        `${errorPrefix}-${encodeURIComponent(JSON.stringify([rowId, field]))}`;
    const errorMessage = (rowId: string, field: string, errors: RowProblem[]): React.ReactNode =>
        errors.length ? (
            <p
                id={errorId(rowId, field)}
                className="flex items-start gap-1.5 text-xs leading-relaxed text-red-700"
                role="status"
            >
                <IonIcon icon={alertCircleOutline} className="mt-0.5 shrink-0" aria-hidden="true" />
                {[...new Set(errors)].map(spreadsheetProblem).join(' · ')}
            </p>
        ) : null;
    const errorAttributes = (rowId: string, field: string, errors: RowProblem[]) => ({
        'aria-invalid': Boolean(errors.length),
        'aria-describedby': errors.length ? errorId(rowId, field) : undefined,
    });
    const sharedProblems: Record<string, RowProblem[]> = Object.create(null);
    for (const row of Object.values(props.fieldProblems ?? {})) {
        for (const [name, errors] of Object.entries(row.variables)) {
            sharedProblems[name] = [...new Set([...(sharedProblems[name] ?? []), ...errors])];
        }
    }
    const input = (recipient: Recipient, name: string): React.ReactNode => {
        const rowId = recipientKey(recipient);
        const errors = props.fieldProblems?.[rowId]?.variables[name] ?? [];
        const value =
            props.locked(rowId) || scopes[name] === 'perRecipient'
                ? (values[rowId]?.[name] ?? '')
                : (shared[name] ?? '');
        const fieldProps = {
            ...errorAttributes(rowId, `variable:${name}`, errors),
            'aria-label': `${recipientDisplayName(recipient)} ${fieldLabel(name)}`,
            className: INPUT,
            value,
            disabled: disabled || props.locked(rowId) || scopes[name] !== 'perRecipient',
        };
        return (
            <div className="min-w-0 space-y-v3-1.5">
                {props.dateVariables?.includes(name) ? (
                    <RosterDateInput
                        {...fieldProps}
                        onChange={next => props.onChange(rowId, name, next)}
                    />
                ) : (
                    <input
                        {...fieldProps}
                        onChange={event => props.onChange(rowId, name, event.target.value)}
                    />
                )}
                {errorMessage(rowId, `variable:${name}`, errors)}
            </div>
        );
    };
    const identity = (recipient: Recipient): React.ReactNode => {
        const rowId = recipientKey(recipient);
        const details = props.fieldProblems?.[rowId];
        const identityErrors =
            details?.recipient ??
            problems[rowId]?.filter(problem => ['email', 'duplicate'].includes(problem)) ??
            [];
        const located = details
            ? [
                  ...details.recipient,
                  ...details.evidence,
                  ...Object.values(details.variables).flat(),
              ]
            : identityErrors;
        const rowErrors = problems[rowId]?.filter(problem => !located.includes(problem)) ?? [];
        return (
            <div className="min-w-0 space-y-v3-2">
                <div className="flex h-5 items-center gap-2">
                    <span
                        title={recipientDisplayName(recipient)}
                        className="min-w-0 truncate text-sm font-semibold leading-5 text-grayscale-900"
                    >
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
                        type="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        aria-label={m['issueFlow.sheet.emailFor']({
                            name: recipientDisplayName(recipient),
                        })}
                        className={INPUT}
                        {...errorAttributes(rowId, 'recipient', identityErrors)}
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
                {errorMessage(rowId, 'recipient', identityErrors)}
                {errorMessage(rowId, 'row', rowErrors)}
            </div>
        );
    };
    const evidenceInput = (recipient: Recipient): React.ReactNode => {
        const rowId = recipientKey(recipient);
        const errors = props.fieldProblems?.[rowId]?.evidence ?? [];
        return (
            <div className="space-y-v3-2">
                <input
                    type="url"
                    aria-label={m['issueFlow.sheet.design.additionalEvidenceFor']({
                        name: recipientDisplayName(recipient),
                    })}
                    placeholder="https://"
                    value={evidence[recipientKey(recipient)] ?? ''}
                    className={INPUT}
                    {...errorAttributes(rowId, 'evidence', errors)}
                    disabled={disabled || props.locked(recipientKey(recipient))}
                    onChange={event =>
                        props.onEvidenceChange(recipientKey(recipient), event.target.value)
                    }
                />
                {errorMessage(rowId, 'evidence', errors)}
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
    };
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
            subtitle={props.saveError ? undefined : m['issueFlow.sheet.design.editorHint']()}
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
            <div className="space-y-v3-5">
                {props.saveError && (
                    <p
                        role="alert"
                        className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {props.saveError}
                    </p>
                )}
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${onlyIssues ? 'bg-grayscale-200 text-grayscale-900' : 'bg-grayscale-100 text-grayscale-700'}`}
                        >
                            <IonIcon
                                icon={alertCircleOutline}
                                className={issues ? 'text-red-600' : 'text-grayscale-500'}
                                aria-hidden="true"
                            />
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
                        className="pointer-events-none absolute inset-s-4 top-4 text-grayscale-500"
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
                                <div key={name} className="space-y-v3-2">
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
                                        <>
                                            <input
                                                aria-label={fieldLabel(name)}
                                                {...errorAttributes(
                                                    'shared',
                                                    `shared:${name}`,
                                                    sharedProblems[name] ?? []
                                                )}
                                                className={INPUT}
                                                value={shared[name] ?? ''}
                                                disabled={disabled}
                                                onChange={event =>
                                                    props.onSharedChange(name, event.target.value)
                                                }
                                            />
                                            {errorMessage(
                                                'shared',
                                                `shared:${name}`,
                                                sharedProblems[name] ?? []
                                            )}
                                        </>
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
                    <div
                        aria-label={m['issueFlow.sheet.design.reviewPeople']()}
                        role="region"
                        // Keyboard users need a tab stop to scroll columns outside the viewport.
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                        tabIndex={0}
                        className="max-h-[52dvh] overflow-auto rounded-2xl border border-grayscale-200"
                    >
                        <table className="w-full border-separate border-spacing-0 text-start">
                            <thead className="bg-grayscale-100">
                                <tr>
                                    {[
                                        m['issueFlow.sheet.recipient'](),
                                        ...variables.map(fieldLabel),
                                        m['issueFlow.sheet.design.additionalEvidence'](),
                                        '',
                                    ].map((label, index) => (
                                        <th
                                            key={index}
                                            className={`sticky top-0 border-b border-grayscale-200 bg-grayscale-100 px-4 py-3 text-xs font-medium text-grayscale-700 ${index === 0 ? 'inset-s-0 z-30' : 'z-20'}`}
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
                                        {...focusHandlers(recipient)}
                                        className={
                                            problems[recipientKey(recipient)]?.length
                                                ? 'bg-grayscale-10'
                                                : 'bg-white'
                                        }
                                    >
                                        <td className="sticky inset-s-0 z-10 min-w-[270px] max-w-[320px] border-b border-grayscale-100 bg-inherit p-4 align-top">
                                            {identity(recipient)}
                                        </td>
                                        {variables.map(name => (
                                            <td
                                                key={name}
                                                className="min-w-[220px] border-b border-grayscale-100 px-4 pb-4 pt-11 align-top"
                                            >
                                                {input(recipient, name)}
                                            </td>
                                        ))}
                                        <td className="min-w-[260px] border-b border-grayscale-100 px-4 pb-4 pt-11 align-top">
                                            {evidenceInput(recipient)}
                                        </td>
                                        <td className="border-b border-grayscale-100 px-4 pb-4 pt-11 align-top">
                                            {remove(recipient)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-v3-3">
                        {visible.map(recipient => (
                            <article
                                key={recipientKey(recipient)}
                                {...focusHandlers(recipient)}
                                className={`rounded-2xl border p-4 space-y-v3-4 ${problems[recipientKey(recipient)]?.length ? 'border-red-100 bg-grayscale-10' : 'border-grayscale-200 bg-white'}`}
                            >
                                {identity(recipient)}
                                {variables.map(name => (
                                    <label
                                        key={name}
                                        className="block space-y-v3-1.5 text-xs font-medium text-grayscale-700"
                                    >
                                        <span>{fieldLabel(name)}</span>
                                        {input(recipient, name)}
                                    </label>
                                ))}
                                <label className="block space-y-v3-1.5 text-xs font-medium text-grayscale-700">
                                    <span>{m['issueFlow.sheet.design.additionalEvidence']()}</span>
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
        <div className="font-poppins bg-white p-6 space-y-v3-4">
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
