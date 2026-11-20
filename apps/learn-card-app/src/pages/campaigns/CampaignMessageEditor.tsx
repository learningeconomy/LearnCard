import React, { useId, useMemo, useState } from 'react';
import { inAppMessageValidator } from '@learncard/types';
import { IonIcon } from '@ionic/react';
import { codeSlashOutline, optionsOutline } from 'ionicons/icons';
import { z } from 'zod';
import { buttonClass, primaryClass, textButtonClass } from './ui';
import { SchemaField } from './message-editor/SchemaField';
import {
    objectValue,
    patchMessage,
    readMessageObject,
    removeMessageItem,
    unwrapSchema,
    type MessageObject,
} from './message-editor/schemaFields';

interface Props {
    value: string;
    campaignId: string;
    onChange: (value: string) => void;
}
const messageShape = inAppMessageValidator.shape;
const schemaFields = messageShape as Record<string, z.ZodType>;
const coveredFields = new Set([
    'id',
    'title',
    'body',
    'presentation',
    'frequency',
    'media',
    'actions',
    'steps',
    'iframe',
    'priority',
    'dismissible',
    'enabled',
    'bypassFatigue',
    'emoji',
    'targeting',
    'trigger',
    'locales',
]);

export const CampaignMessageEditor: React.FC<Props> = ({ value, campaignId, onChange }) => {
    const [mode, setMode] = useState<'fields' | 'json'>('fields');
    const [pendingFormat, setPendingFormat] = useState<string>();
    const id = useId();
    const message = useMemo(() => readMessageObject(value), [value]);
    const validation = useMemo(
        () =>
            message
                ? inAppMessageValidator.safeParse({
                      ...message,
                      id: campaignId || 'composer-preview',
                  })
                : undefined,
        [message, campaignId]
    );
    const write = (next: MessageObject): void => onChange(JSON.stringify(next, null, 2));
    const changeFormat = (format: string): void => {
        const next: MessageObject = { ...message, presentation: format };
        delete next.steps;
        delete next.iframe;
        if (format === 'story')
            next.steps = [{ title: message?.title ?? 'First screen', body: message?.body ?? '' }];
        if (format === 'iframe') next.iframe = { url: '' };
        write(next);
        setPendingFormat(undefined);
    };
    const field = (name: string, required = false): React.ReactNode => (
        <SchemaField
            key={name}
            schema={required ? unwrapSchema(schemaFields[name]) : schemaFields[name]}
            value={message?.[name]}
            path={[name]}
            onRemoveItem={(path, index) => write(removeMessageItem(message ?? {}, path, index))}
            onChange={next => {
                if (name === 'presentation' && typeof next === 'string') {
                    if (message?.steps !== undefined || message?.iframe !== undefined)
                        setPendingFormat(next);
                    else changeFormat(next);
                } else write(objectValue(patchMessage(message, [name], next)));
            }}
        />
    );
    return (
        <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                    role="tablist"
                    aria-label="Message editing mode"
                    className="inline-flex gap-1 rounded-full bg-grayscale-100 p-1"
                >
                    {(['fields', 'json'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            id={`${id}-${tab}`}
                            aria-selected={mode === tab}
                            tabIndex={mode === tab ? 0 : -1}
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
                                setPendingFormat(undefined);
                                document.getElementById(`${id}-${next}`)?.focus();
                            }}
                            aria-controls={`${id}-panel`}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${mode === tab ? 'bg-grayscale-900 text-white' : 'text-grayscale-700 hover:bg-grayscale-200'}`}
                            onClick={() => {
                                setMode(tab);
                                setPendingFormat(undefined);
                            }}
                        >
                            <IonIcon
                                icon={tab === 'fields' ? optionsOutline : codeSlashOutline}
                                aria-hidden="true"
                            />
                            {tab === 'fields' ? 'Fields' : 'JSON'}
                        </button>
                    ))}
                </div>
                <span
                    className={`text-xs font-medium ${validation?.success ? 'text-emerald-700' : 'text-amber-700'}`}
                >
                    {validation?.success ? 'Valid message' : 'Needs attention'}
                </span>
            </div>
            <div
                role="tabpanel"
                id={`${id}-panel`}
                aria-labelledby={`${id}-${mode}`}
                className="flex min-w-0 flex-col gap-5"
            >
                {mode === 'json' ? (
                    <div className="overflow-hidden rounded-2xl border border-grayscale-200">
                        <label
                            htmlFor={`${id}-json-input`}
                            className="block border-b border-grayscale-200 bg-grayscale-100 px-4 py-3 text-xs font-medium text-grayscale-700"
                        >
                            Message JSON
                        </label>
                        <textarea
                            id={`${id}-json-input`}
                            spellCheck={false}
                            rows={16}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            aria-describedby={`${id}-validation`}
                            className="block w-full resize-y bg-white p-4 font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace] text-sm leading-relaxed text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                        />
                    </div>
                ) : message ? (
                    <>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {field('presentation')}
                            {field('frequency')}
                        </div>
                        {pendingFormat && (
                            <div
                                role="alert"
                                className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                            >
                                <p className="text-sm leading-relaxed text-amber-900">
                                    Changing the format removes the current story screens or
                                    embedded-page settings.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className={primaryClass}
                                        onClick={() => changeFormat(pendingFormat)}
                                    >
                                        Change format
                                    </button>
                                    <button
                                        type="button"
                                        className={buttonClass}
                                        onClick={() => setPendingFormat(undefined)}
                                    >
                                        Keep current format
                                    </button>
                                </div>
                            </div>
                        )}
                        {field('title')}
                        {field('body')}
                        {field('media')}
                        {message.presentation === 'story' && field('steps', true)}
                        {message.presentation === 'iframe' && field('iframe', true)}
                        {field('actions')}
                        <details className="rounded-2xl border border-grayscale-200 p-4">
                            <summary className="cursor-pointer text-sm font-medium text-grayscale-900">
                                Display settings
                            </summary>
                            <div className="flex flex-col gap-5 pt-5">
                                {field('priority')}
                                {field('dismissible')}
                                {field('enabled')}
                                {field('bypassFatigue')}
                                {field('emoji')}
                            </div>
                        </details>
                        <details className="rounded-2xl border border-grayscale-200 p-4">
                            <summary className="cursor-pointer text-sm font-medium text-grayscale-900">
                                Targeting, triggers & translations
                            </summary>
                            <div className="flex flex-col gap-5 pt-5">
                                {field('targeting')}
                                {field('trigger')}
                                {field('locales')}
                                {Object.keys(schemaFields)
                                    .filter(name => !coveredFields.has(name))
                                    .map(name => field(name))}
                                {message.presentation !== 'story' &&
                                    message.steps !== undefined &&
                                    field('steps')}
                                {message.presentation !== 'iframe' &&
                                    message.iframe !== undefined &&
                                    field('iframe')}
                            </div>
                        </details>
                    </>
                ) : (
                    <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm leading-relaxed text-amber-900">
                            Use a valid JSON object to edit with fields. Your JSON has been kept
                            exactly as entered.
                        </p>
                        <button
                            type="button"
                            className={textButtonClass}
                            onClick={() => setMode('json')}
                        >
                            Edit JSON
                        </button>
                    </div>
                )}
            </div>
            <div id={`${id}-validation`} aria-live="polite">
                {!message ? (
                    <p className="text-xs text-red-700">message: Enter a valid JSON object.</p>
                ) : (
                    validation &&
                    !validation.success && (
                        <ul className="flex list-none flex-col gap-1 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                            {validation.error.issues.map((issue, index) => (
                                <li key={index}>
                                    {issue.path.join('.') || 'message'}: {issue.message}
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>
        </div>
    );
};
