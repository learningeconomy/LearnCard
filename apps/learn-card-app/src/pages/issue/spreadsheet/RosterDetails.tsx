import React, { useState } from 'react';
import { useModal, ModalTypes } from 'learn-card-base';
import { MediaAttachments, type SimpleMediaAttachment } from '../components/MediaAttachments';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
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
    scopes: ColumnScopes;
    shared: Record<string, string>;
    values: Record<string, Record<string, string>>;
    evidence: Record<string, string>;
    problems: Record<string, RowProblem[]>;
    locked: (rowId: string) => boolean;
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
    const { newModal, closeModal } = useModal();
    const [page, setPage] = useState(0);
    const { recipients, variables, scopes, shared, values, evidence, problems, disabled } = props;
    const sorted = [...recipients].sort(
        (a, b) =>
            Number(Boolean(problems[recipientKey(b)]?.length)) -
            Number(Boolean(problems[recipientKey(a)]?.length))
    );
    const pageSize = 50;
    const currentPage = Math.min(page, Math.max(0, Math.ceil(sorted.length / pageSize) - 1));
    const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const input = (recipient: Recipient, name: string): React.ReactNode => (
        <input
            aria-label={`${recipientDisplayName(recipient)} ${humanizeVariable(name)}`}
            className={INPUT}
            value={values[recipientKey(recipient)]?.[name] ?? ''}
            disabled={
                disabled || props.locked(recipientKey(recipient)) || scopes[name] !== 'perRecipient'
            }
            onChange={event => props.onChange(recipientKey(recipient), name, event.target.value)}
        />
    );
    const identity = (recipient: Recipient): React.ReactNode => (
        <div className="space-y-1">
            <p className="text-sm font-medium text-grayscale-900">
                {recipientDisplayName(recipient)}
            </p>
            {recipient.kind === 'email' ? (
                <input
                    aria-label={m['issueFlow.sheet.emailFor']({
                        name: recipientDisplayName(recipient),
                    })}
                    className={INPUT}
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
                <p className="text-xs text-grayscale-500">@{recipient.profileId}</p>
            )}
            {problems[recipientKey(recipient)]?.length > 0 && (
                <p className="flex gap-1 text-xs text-red-700" role="status">
                    <IonIcon icon={alertCircleOutline} />
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
                className="text-xs text-grayscale-600 hover:text-grayscale-900 disabled:opacity-40"
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
            disabled={disabled || props.locked(recipientKey(recipient))}
            onClick={() => props.onRecipientsChange(recipients.filter(row => row !== recipient))}
            className="py-2 px-3 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700 hover:bg-grayscale-10 disabled:opacity-40"
        >
            {m['issueFlow.sheet.skip']()}
        </button>
    );
    return (
        <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4 font-poppins">
            <div className="flex justify-between flex-wrap gap-3 items-center">
                <h3 className="text-base font-semibold text-grayscale-900">
                    {m['issueFlow.sheet.details']()}
                </h3>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={props.onDownload}
                        disabled={disabled}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900"
                    >
                        {m['issueFlow.sheet.download']()}
                    </button>
                    <button
                        type="button"
                        onClick={props.onUpload}
                        disabled={disabled}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900"
                    >
                        {m['issueFlow.sheet.upload']()}
                    </button>
                </div>
            </div>
            {variables.map(name => (
                <div key={name} className="space-y-1.5">
                    <div className="flex justify-between gap-3 items-center">
                        <label
                            className="text-xs font-medium text-grayscale-700"
                            htmlFor={`scope-${name}`}
                        >
                            {humanizeVariable(name)}
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
                            className="bg-white text-sm text-grayscale-900 border border-grayscale-300 rounded-xl p-2"
                        >
                            <option value="shared">{m['issueFlow.fields.sameForAll']()}</option>
                            <option value="perRecipient">
                                {m['issueFlow.fields.perRecipient']()}
                            </option>
                        </select>
                    </div>
                    {scopes[name] !== 'perRecipient' && (
                        <input
                            aria-label={humanizeVariable(name)}
                            className={INPUT}
                            value={shared[name] ?? ''}
                            disabled={disabled}
                            onChange={event => props.onSharedChange(name, event.target.value)}
                        />
                    )}
                </div>
            ))}
            {recipients.length > pageSize && (
                <div className="flex items-center justify-between gap-2 text-xs text-grayscale-600">
                    <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() => setPage(currentPage - 1)}
                        className="py-2 px-3 rounded-[20px] border border-grayscale-300 disabled:opacity-40"
                    >
                        {m['common.back']()}
                    </button>
                    <span>
                        {m['issueFlow.sheet.pageRows']({
                            first: currentPage * pageSize + 1,
                            last: Math.min((currentPage + 1) * pageSize, recipients.length),
                            total: recipients.length,
                        })}
                    </span>
                    <button
                        type="button"
                        disabled={(currentPage + 1) * pageSize >= recipients.length}
                        onClick={() => setPage(currentPage + 1)}
                        className="py-2 px-3 rounded-[20px] border border-grayscale-300 disabled:opacity-40"
                    >
                        {m['common.next']()}
                    </button>
                </div>
            )}
            {recipients.length >= 4 ? (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-white">
                            <tr>
                                {[
                                    m['issueFlow.sheet.recipient'](),
                                    ...variables.map(humanizeVariable),
                                    m['issueFlow.sheet.evidence'](),
                                    '',
                                ].map((label, index) => (
                                    <th
                                        key={index}
                                        className="text-xs font-medium text-grayscale-700 p-2 border-b border-grayscale-200"
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
                                        problems[recipientKey(recipient)]?.length ? 'bg-red-50' : ''
                                    }
                                >
                                    <td className="p-2 align-top">{identity(recipient)}</td>
                                    {variables.map(name => (
                                        <td key={name} className="p-2 align-top">
                                            {input(recipient, name)}
                                        </td>
                                    ))}
                                    <td className="p-2 align-top">{evidenceInput(recipient)}</td>
                                    <td className="p-2 align-top">{remove(recipient)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-4">
                    {sorted.map(recipient => (
                        <div
                            key={recipientKey(recipient)}
                            className="border border-grayscale-200 bg-grayscale-10 rounded-2xl p-4 space-y-3"
                        >
                            {identity(recipient)}
                            {variables
                                .filter(name => scopes[name] === 'perRecipient')
                                .map(name => (
                                    <label
                                        key={name}
                                        className="block text-xs font-medium text-grayscale-700 space-y-1.5"
                                    >
                                        <span>{humanizeVariable(name)}</span>
                                        {input(recipient, name)}
                                    </label>
                                ))}
                            <label className="block text-xs font-medium text-grayscale-700 space-y-1.5">
                                <span>{m['issueFlow.sheet.evidence']()}</span>
                                {evidenceInput(recipient)}
                            </label>
                            {remove(recipient)}
                        </div>
                    ))}
                </div>
            )}
        </section>
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
