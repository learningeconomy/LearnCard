import React, { useEffect, useId, useRef, useState } from 'react';
import type { CampaignAudienceSource } from '@learncard/types';
import { readMessageObject as readSourceObject, objectValue } from './message-editor/schemaFields';
import { Field, buttonClass, inputClass } from './ui';

const SOURCES: Record<CampaignAudienceSource['type'], string> = {
    emails: 'Email addresses',
    dids: 'Account identifiers',
    credentialsSentBy: 'Credentials sent by an account or app',
    inboxClaims: 'Claimed credentials from an issuer',
    boostRecipients: 'Boost recipients',
};
const DEFAULTS: Record<CampaignAudienceSource['type'], Record<string, unknown>> = {
    emails: { type: 'emails', emails: [] },
    dids: { type: 'dids', dids: [] },
    credentialsSentBy: { type: 'credentialsSentBy', senderProfileId: '', includePending: false },
    inboxClaims: { type: 'inboxClaims', issuerDid: '' },
    boostRecipients: { type: 'boostRecipients', boostUri: '', includePending: false },
};
export const splitAudienceEntries = (text: string, emails = false): string[] => [
    ...new Set(
        text
            .split(/[\n,;]+/)
            .map(entry => (emails ? entry.trim().toLowerCase() : entry.trim()))
            .filter(Boolean)
    ),
];
const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Retain separators while typing; only the source payload is trimmed and deduplicated. */
const EntryList: React.FC<{
    value: unknown;
    emails: boolean;
    onChange: (entries: string[]) => void;
}> = ({ value, emails, onChange }) => {
    const id = useId();
    const serialized = JSON.stringify(value ?? []);
    const [text, setText] = useState(Array.isArray(value) ? value.join('\n') : '');
    const lastEmitted = useRef(serialized);
    useEffect(() => {
        if (serialized !== lastEmitted.current) {
            const entries: unknown = JSON.parse(serialized);
            setText(Array.isArray(entries) ? entries.join('\n') : '');
            lastEmitted.current = serialized;
        }
    }, [serialized]);
    return (
        <div className="flex flex-col gap-2">
            <Field label={emails ? 'Email addresses' : 'Account identifiers'} htmlFor={id}>
                <textarea
                    id={id}
                    className={inputClass}
                    rows={5}
                    spellCheck={false}
                    value={text}
                    placeholder={
                        emails
                            ? 'learner@example.com\nmember@example.com'
                            : 'did:web:network.example:users:member'
                    }
                    onChange={event => {
                        const next = event.target.value;
                        setText(next);
                        const entries = splitAudienceEntries(next, emails);
                        lastEmitted.current = JSON.stringify(entries);
                        onChange(entries);
                    }}
                />
            </Field>
            <p className="text-xs leading-relaxed text-grayscale-600">
                One per line, or separate with commas. Duplicates are removed. Maximum 1,000 per
                source.
            </p>
            <p className="text-xs leading-relaxed text-grayscale-600">
                {emails
                    ? 'Matches verified email addresses on existing accounts. This does not send email or invite new members.'
                    : 'Use full account identifiers beginning with did:. Use network search above if you know the member’s name.'}
            </p>
        </div>
    );
};

const MetadataFields: React.FC<{
    value: unknown;
    onChange: (value: Record<string, unknown> | undefined) => void;
}> = ({ value, onChange }) => {
    const id = useId();
    const [key, setKey] = useState('');
    const [entry, setEntry] = useState('');
    const record = objectValue(value);
    const name = key.trim();
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-grayscale-200 p-4">
            <h4 className="text-sm font-medium text-grayscale-900">Metadata filters</h4>
            <p className="text-xs text-grayscale-600">
                Optional exact matches on credential send metadata, such as kind = transcript.
            </p>
            {Object.entries(record).map(([field, fieldValue], index) => (
                <div key={field} className="flex items-end gap-3">
                    <div className="min-w-0 flex-1">
                        <Field label={field} htmlFor={`${id}-${index}`}>
                            <input
                                id={`${id}-${index}`}
                                className={inputClass}
                                value={asText(fieldValue)}
                                onChange={event =>
                                    onChange({ ...record, [field]: event.target.value })
                                }
                            />
                        </Field>
                    </div>
                    <button
                        type="button"
                        className={buttonClass}
                        aria-label={`Remove filter ${field}`}
                        onClick={() => {
                            const next = { ...record };
                            delete next[field];
                            onChange(Object.keys(next).length ? next : undefined);
                        }}
                    >
                        Remove
                    </button>
                </div>
            ))}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <Field label="Filter name" htmlFor={`${id}-key`}>
                    <input
                        id={`${id}-key`}
                        className={inputClass}
                        value={key}
                        placeholder="kind"
                        onChange={event => setKey(event.target.value)}
                    />
                </Field>
                <Field label="Filter value" htmlFor={`${id}-value`}>
                    <input
                        id={`${id}-value`}
                        className={inputClass}
                        value={entry}
                        placeholder="transcript"
                        maxLength={2048}
                        onChange={event => setEntry(event.target.value)}
                    />
                </Field>
            </div>
            <button
                type="button"
                className={`${buttonClass} self-start`}
                disabled={!name || Object.hasOwn(record, name) || Object.keys(record).length >= 20}
                onClick={() => {
                    onChange({ ...record, [name]: entry });
                    setKey('');
                    setEntry('');
                }}
            >
                Add filter
            </button>
        </div>
    );
};

export const CampaignAudienceSourceEditor: React.FC<{
    value: string;
    onChange: (value: string) => void;
}> = ({ value, onChange }) => {
    const id = useId();
    const [mode, setMode] = useState<'fields' | 'json'>('fields');
    const drafts = useRef<Record<string, string>>({});
    const source = value ? readSourceObject(value) : DEFAULTS.emails;
    const type = asText(source?.type);
    const write = (next: Record<string, unknown>): void => onChange(JSON.stringify(next, null, 2));
    const set = (key: string, next: unknown): void => {
        const updated = { ...source, [key]: next };
        if (next === undefined) delete updated[key];
        write(updated);
    };
    const input = (key: string, label: string, placeholder?: string): React.ReactNode => (
        <Field label={label} htmlFor={`${id}-${key}`}>
            <input
                id={`${id}-${key}`}
                className={inputClass}
                value={asText(source?.[key])}
                placeholder={placeholder}
                onChange={event => set(key, event.target.value)}
            />
        </Field>
    );
    let localSince = '';
    if (typeof source?.since === 'string') {
        const date = new Date(source.since);
        if (Number.isFinite(date.getTime()))
            localSince = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
                .toISOString()
                .slice(0, -1);
    }
    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div
                role="tablist"
                aria-label="Audience source editing mode"
                className="inline-flex self-start gap-1 rounded-full bg-grayscale-100 p-1"
            >
                {(['fields', 'json'] as const).map(tab => (
                    <button
                        type="button"
                        role="tab"
                        key={tab}
                        id={`${id}-${tab}`}
                        aria-controls={`${id}-panel`}
                        aria-selected={mode === tab}
                        tabIndex={mode === tab ? 0 : -1}
                        className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${mode === tab ? 'bg-grayscale-900 text-white' : 'text-grayscale-700 hover:bg-grayscale-200'}`}
                        onClick={() => setMode(tab)}
                        onKeyDown={event => {
                            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                                return;
                            event.preventDefault();
                            const next =
                                event.key === 'Home'
                                    ? 'fields'
                                    : event.key === 'End'
                                      ? 'json'
                                      : mode === 'fields'
                                        ? 'json'
                                        : 'fields';
                            setMode(next);
                            document.getElementById(`${id}-${next}`)?.focus();
                        }}
                    >
                        {tab === 'fields' ? 'Fields' : 'JSON'}
                    </button>
                ))}
            </div>
            <div
                id={`${id}-panel`}
                role="tabpanel"
                aria-labelledby={`${id}-${mode}`}
                className="flex min-w-0 flex-col gap-4"
            >
                {mode === 'json' ? (
                    <Field label="Audience source JSON" htmlFor={`${id}-raw`}>
                        <textarea
                            id={`${id}-raw`}
                            className={`${inputClass} font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace]`}
                            rows={6}
                            spellCheck={false}
                            value={value}
                            onChange={event => onChange(event.target.value)}
                            placeholder={'{"type":"emails","emails":["learner@example.com"]}'}
                        />
                    </Field>
                ) : !source ? (
                    <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-900">
                            Enter a valid JSON object to use fields. Your original input is
                            preserved.
                        </p>
                        <button
                            type="button"
                            className={`${buttonClass} self-start`}
                            onClick={() => setMode('json')}
                        >
                            Edit audience JSON
                        </button>
                    </div>
                ) : (
                    <>
                        <Field label="Audience source" htmlFor={`${id}-type`}>
                            <select
                                id={`${id}-type`}
                                className={inputClass}
                                value={type}
                                onChange={event => {
                                    const next = event.target
                                        .value as CampaignAudienceSource['type'];
                                    if (type)
                                        drafts.current[type] = value || JSON.stringify(source);
                                    onChange(
                                        drafts.current[next] ??
                                            JSON.stringify(DEFAULTS[next], null, 2)
                                    );
                                }}
                            >
                                {!Object.hasOwn(SOURCES, type) && (
                                    <option value={type} disabled>
                                        Choose a source
                                    </option>
                                )}
                                {Object.entries(SOURCES).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        {(type === 'emails' || type === 'dids') && (
                            <EntryList
                                key={type}
                                value={source[type]}
                                emails={type === 'emails'}
                                onChange={entries => set(type, entries)}
                            />
                        )}
                        {type === 'credentialsSentBy' && (
                            <>
                                <Field label="Sender type" htmlFor={`${id}-sender-type`}>
                                    <select
                                        id={`${id}-sender-type`}
                                        className={inputClass}
                                        value={
                                            source.listingId !== undefined
                                                ? 'listingId'
                                                : 'senderProfileId'
                                        }
                                        onChange={event => {
                                            const next = { ...source };
                                            delete next.senderProfileId;
                                            delete next.listingId;
                                            write({ ...next, [event.target.value]: '' });
                                        }}
                                    >
                                        <option value="senderProfileId">Account</option>
                                        <option value="listingId">App listing</option>
                                    </select>
                                </Field>
                                {source.listingId !== undefined
                                    ? input('listingId', 'App listing ID')
                                    : input('senderProfileId', 'Sender username')}
                                <MetadataFields
                                    value={source.metadata}
                                    onChange={next => set('metadata', next)}
                                />
                            </>
                        )}
                        {type === 'inboxClaims' &&
                            input(
                                'issuerDid',
                                'Issuer account identifier',
                                'did:web:issuer.example'
                            )}
                        {type === 'boostRecipients' &&
                            input('boostUri', 'Source boost URI', 'lc:network:...')}
                        {(type === 'credentialsSentBy' || type === 'inboxClaims') && (
                            <div className="flex flex-col gap-2">
                                <Field label="Since (local time, optional)" htmlFor={`${id}-since`}>
                                    <input
                                        id={`${id}-since`}
                                        type="datetime-local"
                                        step="any"
                                        className={inputClass}
                                        value={localSince}
                                        onChange={event => {
                                            const date = new Date(event.target.value);
                                            set(
                                                'since',
                                                !event.target.value
                                                    ? undefined
                                                    : Number.isFinite(date.getTime())
                                                      ? date.toISOString()
                                                      : event.target.value
                                            );
                                        }}
                                    />
                                </Field>
                                {source.since !== undefined && (
                                    <button
                                        type="button"
                                        className={`${buttonClass} self-start`}
                                        onClick={() => set('since', undefined)}
                                    >
                                        Clear date
                                    </button>
                                )}
                            </div>
                        )}
                        {(type === 'credentialsSentBy' || type === 'boostRecipients') && (
                            <label className="flex items-center gap-3 text-sm text-grayscale-900">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-emerald-600"
                                    checked={source.includePending === true}
                                    onChange={event => set('includePending', event.target.checked)}
                                />
                                Include pending credentials
                            </label>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
