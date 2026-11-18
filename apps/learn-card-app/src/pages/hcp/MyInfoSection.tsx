import React, { useState } from 'react';

import { useHcpChange, useHcpEntries, type HcpEntry } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';
import { categoryName, entryText, groupEntries, REGISTERED_CATEGORY_IDS } from './hcpModel';
import { HcpEmpty, HcpError, HcpLoading, Spinner } from './HcpStates';

const GENERAL_CONTEXT_PROFILE = 'https://hcp.example/spec/profiles/general-context/2.0';
const HCP_ENTRY_SCHEMA = 'https://hcp.example/spec/entry/2.0';
const PROVENANCE = { source: 'learncard-app' };

type Editing = { kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; entry: HcpEntry };

const EntryForm: React.FC<{
    editing: Exclude<Editing, { kind: 'closed' }>;
    onDone: () => void;
}> = ({ editing, onDone }) => {
    const change = useHcpChange();
    const [category, setCategory] = useState<string>(
        editing.kind === 'edit'
            ? (editing.entry.classification.categories[0] ?? REGISTERED_CATEGORY_IDS[0])
            : REGISTERED_CATEGORY_IDS[0]
    );
    const [text, setText] = useState(editing.kind === 'edit' ? entryText(editing.entry) : '');
    const value = text.trim();

    const save = () =>
        change.mutate(
            editing.kind === 'add'
                ? {
                      kind: 'add',
                      input: {
                          schema: HCP_ENTRY_SCHEMA,
                          content: { profile: GENERAL_CONTEXT_PROFILE, value },
                          classification: { categories: [category] },
                          assertion: { declarationType: 'person-declared' },
                          record: { provenance: PROVENANCE },
                      },
                  }
                : {
                      kind: 'edit',
                      input: {
                          entryId: editing.entry.id,
                          expectedVersion: editing.entry.record.version,
                          // Keep the entry's own content profile; only the text changes.
                          content: { ...editing.entry.content, value },
                          reason: 'Edited by the person',
                          record: { provenance: PROVENANCE },
                      },
                  },
            { onSuccess: onDone }
        );

    return (
        <form
            className="space-y-4 p-4 border border-grayscale-200 rounded-2xl bg-white"
            onSubmit={event => {
                event.preventDefault();
                if (value && !change.isPending) save();
            }}
        >
            {editing.kind === 'add' && (
                <div>
                    <label
                        htmlFor="hcp-topic"
                        className="block text-xs font-medium text-grayscale-700 mb-1.5"
                    >
                        {m['hcp.info.topic']()}
                    </label>
                    <select
                        id="hcp-topic"
                        value={category}
                        onChange={event => setCategory(event.target.value)}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                        {REGISTERED_CATEGORY_IDS.map(id => (
                            <option key={id} value={id}>
                                {categoryName(id)}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div>
                <label
                    htmlFor="hcp-text"
                    className="block text-xs font-medium text-grayscale-700 mb-1.5"
                >
                    {m['hcp.info.textLabel']()}
                </label>
                <textarea
                    id="hcp-text"
                    value={text}
                    maxLength={20000}
                    rows={3}
                    onChange={event => setText(event.target.value)}
                    placeholder={m['hcp.info.textPlaceholder']()}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
            </div>
            {change.isError && (
                <p role="alert" className="text-sm text-red-700">
                    {m['hcp.error.save']()}
                </p>
            )}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onDone}
                    disabled={change.isPending}
                    className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700"
                >
                    {m['common.cancel']()}
                </button>
                <button
                    type="submit"
                    disabled={!value || change.isPending}
                    className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium disabled:opacity-50"
                >
                    {change.isPending ? (
                        <span className="flex items-center gap-2">
                            <Spinner />
                            {m['common.saving']()}
                        </span>
                    ) : (
                        m['common.save']()
                    )}
                </button>
            </div>
        </form>
    );
};

/** LC-2423: an app suggested this; apps can't read it until the person accepts it. */
const SuggestedEntryRow: React.FC<{ entry: HcpEntry }> = ({ entry }) => {
    const change = useHcpChange();
    const pending = change.isPending ? change.variables?.kind : undefined;

    return (
        <li className="py-3 border-b border-grayscale-200 last:border-b-0">
            <p className="text-xs font-medium text-amber-700 mb-1">{m['hcp.info.suggested']()}</p>
            <p className="text-sm text-grayscale-900 whitespace-pre-wrap break-words">
                {entryText(entry)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => change.mutate({ kind: 'accept', entryId: entry.id })}
                    disabled={change.isPending}
                    className="py-1.5 px-3 rounded-[20px] bg-grayscale-900 text-white text-sm disabled:opacity-50"
                >
                    {pending === 'accept' ? <Spinner /> : m['hcp.info.accept']()}
                </button>
                <button
                    type="button"
                    onClick={() => change.mutate({ kind: 'dismiss', entryId: entry.id })}
                    disabled={change.isPending}
                    className="py-1.5 px-3 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700 disabled:opacity-50"
                >
                    {pending === 'dismiss' ? <Spinner /> : m['hcp.info.dismiss']()}
                </button>
                {change.isError && (
                    <p role="alert" className="basis-full text-sm text-red-700">
                        {m['hcp.error.save']()}
                    </p>
                )}
            </div>
        </li>
    );
};

const EntryRow: React.FC<{ entry: HcpEntry; onEdit: () => void }> = ({ entry, onEdit }) => {
    const change = useHcpChange();
    const [confirming, setConfirming] = useState(false);
    const expired = entry.record.status !== 'active';
    // Text is all this screen can edit; structured info from apps stays read-only here.
    const editable = typeof entry.content.value === 'string';

    return (
        <li className="py-3 border-b border-grayscale-200 last:border-b-0">
            <p className="text-sm text-grayscale-900 whitespace-pre-wrap break-words">
                {entryText(entry)}
            </p>
            {expired && (
                <p className="text-xs text-grayscale-500 mt-1">{m['hcp.info.notShared']()}</p>
            )}
            {confirming ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-grayscale-700">
                        {m['hcp.info.removeConfirm']()}
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            change.mutate(
                                { kind: 'remove', entryId: entry.id },
                                { onSuccess: () => setConfirming(false) }
                            )
                        }
                        disabled={change.isPending}
                        className="py-1.5 px-3 rounded-[20px] bg-red-600 text-white text-sm disabled:opacity-50"
                    >
                        {change.isPending ? (
                            <span className="flex items-center gap-2">
                                <Spinner />
                                {m['hcp.info.removing']()}
                            </span>
                        ) : (
                            m['hcp.info.remove']()
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={change.isPending}
                        className="text-sm text-grayscale-700"
                    >
                        {m['common.cancel']()}
                    </button>
                    {change.isError && (
                        <p role="alert" className="basis-full text-sm text-red-700">
                            {m['hcp.error.remove']()}
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-1 flex gap-4">
                    {editable && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="text-sm font-medium text-grayscale-700"
                        >
                            {m['common.edit']()}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="text-sm font-medium text-red-600"
                    >
                        {m['hcp.info.remove']()}
                    </button>
                </div>
            )}
        </li>
    );
};

const MyInfoSection: React.FC = () => {
    const entries = useHcpEntries();
    const [editing, setEditing] = useState<Editing>({ kind: 'closed' });
    const close = () => setEditing({ kind: 'closed' });

    if (entries.isPending) return <HcpLoading />;
    if (entries.isError) return <HcpError onRetry={() => void entries.refetch()} />;

    const groups = groupEntries(entries.data.entries);

    return (
        <div className="space-y-5">
            {editing.kind === 'closed' ? (
                <button
                    type="button"
                    onClick={() => setEditing({ kind: 'add' })}
                    className="w-full py-3 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium"
                >
                    {m['hcp.info.add']()}
                </button>
            ) : (
                <EntryForm
                    key={editing.kind === 'edit' ? editing.entry.id : 'add'}
                    editing={editing}
                    onDone={close}
                />
            )}
            {entries.data.truncated && (
                <p className="text-sm text-grayscale-600">{m['hcp.info.truncated']()}</p>
            )}
            {groups.length === 0 ? (
                <HcpEmpty title={m['hcp.info.emptyTitle']()} body={m['hcp.info.emptyBody']()} />
            ) : (
                groups.map(group => (
                    <section key={group.category} aria-label={group.name}>
                        <h3 className="text-[15px] font-semibold text-grayscale-900 mb-1">
                            {group.name}
                        </h3>
                        <ul className="bg-white rounded-2xl px-4 border border-grayscale-200">
                            {group.entries.map(entry =>
                                entry.record.status === 'suggested' ? (
                                    <SuggestedEntryRow key={entry.id} entry={entry} />
                                ) : (
                                    <EntryRow
                                        key={entry.id}
                                        entry={entry}
                                        onEdit={() => setEditing({ kind: 'edit', entry })}
                                    />
                                )
                            )}
                        </ul>
                    </section>
                ))
            )}
        </div>
    );
};

export default MyInfoSection;
