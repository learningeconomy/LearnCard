/**
 * InAppMessageBuilder — form-driven composer for in-app messages.
 *
 * Lives inside the Messages debug tab. Produces a schema-valid message
 * object from form fields (content, presentation, actions, targeting,
 * frequency), validates it live against `inAppMessageValidator`, and offers:
 *
 *   - **Preview** — renders the draft immediately via the debug override
 *     store (bypasses gate/targeting/frequency, never marks seen)
 *   - **Copy message** — the single message JSON
 *   - **Copy flag** — a full `{ version: 1, messages: [draft] }` value ready
 *     to paste into the LaunchDarkly `inAppMessages` flag
 *
 * The parsed draft is also reported upward via `onDraftChange` so the tab's
 * targeting dry-run section can evaluate it against simulated contexts.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';

import { inAppMessageValidator, type InAppMessage } from '@learncard/types';
import { setInAppMessageOverride } from 'learn-card-base';

import {
    IN_APP_MESSAGE_TEMPLATES,
    IN_APP_MESSAGE_TEMPLATE_CATEGORIES,
} from './inAppMessageTemplates';

type BuilderActionType = 'internalLink' | 'externalLink' | 'appStore' | 'capgoUpdate' | 'dismiss';

interface BuilderAction {
    label: string;
    style: 'primary' | 'secondary' | 'positive' | 'dismiss';
    type: BuilderActionType;
    path: string;
    url: string;
}

type BuilderConditionKind = 'platform' | 'role' | 'version';

interface BuilderCondition {
    kind: BuilderConditionKind;
    platforms: string;
    roles: string;
    source: 'native' | 'web' | 'capgo';
    op: 'lt' | 'lte' | 'eq' | 'gte' | 'gt';
    value: string;
}

interface BuilderState {
    id: string;
    title: string;
    body: string;
    presentation: 'modal' | 'banner' | 'toast';
    frequency: 'once' | 'session' | 'always' | 'everyDays';
    everyDays: string;
    priority: string;
    dismissible: boolean;
    mediaType: '' | 'youtube' | 'image' | 'gif';
    mediaUrl: string;
    emoji: string;
    combinator: 'all' | 'any';
    conditions: BuilderCondition[];
    actions: BuilderAction[];
}

const emptyCondition = (): BuilderCondition => ({
    kind: 'platform',
    platforms: 'ios, android',
    roles: 'learner',
    source: 'native',
    op: 'lt',
    value: '1.0.0',
});

const emptyAction = (): BuilderAction => ({
    label: 'OK',
    style: 'primary',
    type: 'dismiss',
    path: '/',
    url: 'https://',
});

const initialState: BuilderState = {
    id: `message-${new Date().toISOString().slice(0, 10)}`,
    title: '',
    body: '',
    presentation: 'modal',
    frequency: 'once',
    everyDays: '3',
    priority: '0',
    dismissible: true,
    mediaType: '',
    mediaUrl: '',
    emoji: '',
    combinator: 'all',
    conditions: [],
    actions: [emptyAction()],
};

const csvToList = (csv: string): string[] =>
    csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

const conditionToPredicate = (c: BuilderCondition): Record<string, unknown> | null => {
    if (c.kind === 'platform') {
        const platforms = csvToList(c.platforms);

        return platforms.length > 0 ? { platform: platforms } : null;
    }

    if (c.kind === 'role') {
        const roles = csvToList(c.roles);

        return roles.length > 0 ? { role: roles } : null;
    }

    return { version: { source: c.source, op: c.op, value: c.value.trim() } };
};

const buildDraftJson = (s: BuilderState): Record<string, unknown> => {
    const predicates = s.conditions
        .map(conditionToPredicate)
        .filter((p): p is Record<string, unknown> => p !== null);

    const targeting =
        predicates.length === 0
            ? undefined
            : predicates.length === 1
            ? predicates[0]
            : { [s.combinator]: predicates };

    const actions = s.actions.map(a => ({
        label: a.label,
        style: a.style,
        action:
            a.type === 'internalLink'
                ? { type: a.type, path: a.path }
                : a.type === 'externalLink'
                ? { type: a.type, url: a.url }
                : { type: a.type },
    }));

    return {
        id: s.id,
        title: s.title,
        ...(s.body ? { body: s.body } : {}),
        presentation: s.presentation,
        frequency: s.frequency === 'everyDays' ? { everyDays: Number(s.everyDays) } : s.frequency,
        priority: Number(s.priority),
        dismissible: s.dismissible,
        ...(s.mediaType && s.mediaUrl ? { media: { type: s.mediaType, url: s.mediaUrl } } : {}),
        ...(s.emoji.trim() ? { emoji: s.emoji.trim() } : {}),
        actions,
        ...(targeting ? { targeting } : {}),
    };
};

const fieldInputClass =
    'flex-1 min-w-0 text-[10px] font-mono rounded px-1.5 py-1 placeholder:!text-gray-500 caret-sky-400 focus:outline-none focus:!border-sky-500 focus:ring-1 focus:ring-sky-500/40';

export const debugFieldInputStyle: React.CSSProperties = {
    backgroundColor: '#030712',
    color: '#f3f4f6',
    border: '1px solid #4b5563',
};

const fieldSelectClass =
    'text-[10px] !bg-gray-950 border !border-gray-600 rounded px-1 py-1 !text-gray-100 focus:outline-none focus:!border-sky-500';

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center gap-1.5">
        <label className="text-[9px] text-gray-500 w-16 shrink-0">{label}</label>
        {children}
    </div>
);

export const InAppMessageBuilder: React.FC<{
    onDraftChange: (draft: InAppMessage | null) => void;
}> = ({ onDraftChange }) => {
    const [state, setState] = useState<BuilderState>(initialState);
    const [copied, setCopied] = useState<'message' | 'flag' | null>(null);

    const set = useCallback(<K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
        setState(s => ({ ...s, [key]: value }));
    }, []);

    const draftJson = useMemo(() => buildDraftJson(state), [state]);
    const parsed = useMemo(() => inAppMessageValidator.safeParse(draftJson), [draftJson]);

    const validationError = useMemo(() => {
        if (parsed.success) return null;

        const issue = parsed.error.issues[0];

        return `${issue.path.join('.') || 'message'}: ${issue.message}`;
    }, [parsed]);

    useEffect(() => {
        onDraftChange(parsed.success ? parsed.data : null);
    }, [parsed, onDraftChange]);

    const loadTemplate = useCallback((key: string) => {
        const template = IN_APP_MESSAGE_TEMPLATES.find(t => t.key === key);

        if (!template) return;

        const result = inAppMessageValidator.safeParse(template.json);

        if (!result.success) return;

        const m = result.data;
        const targeting = m.targeting as Record<string, unknown> | undefined;

        const rawPredicates: Record<string, unknown>[] = !targeting
            ? []
            : 'all' in targeting
            ? (targeting.all as Record<string, unknown>[])
            : 'any' in targeting
            ? (targeting.any as Record<string, unknown>[])
            : [targeting];

        const conditions: BuilderCondition[] = rawPredicates.flatMap(p => {
            if ('platform' in p) {
                return [
                    {
                        ...emptyCondition(),
                        kind: 'platform' as const,
                        platforms: (p.platform as string[]).join(', '),
                    },
                ];
            }

            if ('role' in p) {
                return [
                    {
                        ...emptyCondition(),
                        kind: 'role' as const,
                        roles: (p.role as string[]).join(', '),
                    },
                ];
            }

            if ('version' in p) {
                const v = p.version as {
                    source: BuilderCondition['source'];
                    op: BuilderCondition['op'];
                    value: string;
                };

                return [
                    {
                        ...emptyCondition(),
                        kind: 'version' as const,
                        source: v.source,
                        op: v.op,
                        value: v.value,
                    },
                ];
            }

            return [];
        });

        setState({
            id: m.id,
            title: m.title,
            body: m.body ?? '',
            presentation: m.presentation,
            frequency: typeof m.frequency === 'object' ? 'everyDays' : m.frequency,
            everyDays: typeof m.frequency === 'object' ? String(m.frequency.everyDays) : '3',
            priority: String(m.priority),
            dismissible: m.dismissible,
            mediaType: m.media?.type ?? '',
            mediaUrl: m.media?.url ?? '',
            emoji: m.emoji ?? '',
            combinator: targeting && 'any' in targeting ? 'any' : 'all',
            conditions,
            actions: m.actions.map(a => ({
                label: a.label,
                style: a.style,
                type: a.action.type,
                path: 'path' in a.action ? String(a.action.path) : '/',
                url: 'url' in a.action ? String(a.action.url) : 'https://',
            })),
        });
    }, []);

    const handlePreview = useCallback(() => {
        if (parsed.success) setInAppMessageOverride(parsed.data);
    }, [parsed]);

    const copyJson = useCallback(
        async (kind: 'message' | 'flag') => {
            const payload =
                kind === 'message'
                    ? JSON.stringify(draftJson, null, 4)
                    : JSON.stringify({ version: 1, messages: [draftJson] }, null, 4);

            try {
                await navigator.clipboard.writeText(payload);
                setCopied(kind);
                setTimeout(() => setCopied(null), 1500);
            } catch {
                setCopied(null);
            }
        },
        [draftJson]
    );

    const updateCondition = useCallback((index: number, patch: Partial<BuilderCondition>) => {
        setState(s => ({
            ...s,
            conditions: s.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)),
        }));
    }, []);

    const updateAction = useCallback((index: number, patch: Partial<BuilderAction>) => {
        setState(s => ({
            ...s,
            actions: s.actions.map((a, i) => (i === index ? { ...a, ...patch } : a)),
        }));
    }, []);

    return (
        <div className="space-y-2">
            <FieldRow label="template">
                <select
                    defaultValue=""
                    onChange={e => {
                        loadTemplate(e.target.value);
                        e.target.value = '';
                    }}
                    className={`${fieldSelectClass} flex-1`}
                >
                    <option value="" disabled>
                        Load a template…
                    </option>

                    {IN_APP_MESSAGE_TEMPLATE_CATEGORIES.map(category => (
                        <optgroup key={category} label={category}>
                            {IN_APP_MESSAGE_TEMPLATES.filter(t => t.category === category).map(
                                t => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                )
                            )}
                        </optgroup>
                    ))}
                </select>
            </FieldRow>

            <FieldRow label="id">
                <input
                    type="text"
                    value={state.id}
                    onChange={e => set('id', e.target.value)}
                    style={debugFieldInputStyle}
                    className={fieldInputClass}
                />
            </FieldRow>

            <FieldRow label="title">
                <input
                    type="text"
                    value={state.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Required"
                    style={debugFieldInputStyle}
                    className={fieldInputClass}
                />
            </FieldRow>

            <FieldRow label="body">
                <input
                    type="text"
                    value={state.body}
                    onChange={e => set('body', e.target.value)}
                    placeholder="Optional"
                    style={debugFieldInputStyle}
                    className={fieldInputClass}
                />
            </FieldRow>

            <FieldRow label="present as">
                <select
                    value={state.presentation}
                    onChange={e =>
                        set('presentation', e.target.value as BuilderState['presentation'])
                    }
                    className={fieldSelectClass}
                >
                    <option value="modal">modal</option>
                    <option value="banner">banner</option>
                    <option value="toast">toast</option>
                </select>

                <label className="flex items-center gap-1 text-[9px] text-gray-500 ml-1">
                    <input
                        type="checkbox"
                        checked={state.dismissible}
                        onChange={e => set('dismissible', e.target.checked)}
                        className="w-3 h-3"
                    />
                    dismissible
                </label>
            </FieldRow>

            <FieldRow label="frequency">
                <select
                    value={state.frequency}
                    onChange={e => set('frequency', e.target.value as BuilderState['frequency'])}
                    className={fieldSelectClass}
                >
                    <option value="once">once</option>
                    <option value="session">session</option>
                    <option value="always">always</option>
                    <option value="everyDays">every N days</option>
                </select>

                {state.frequency === 'everyDays' && (
                    <input
                        type="number"
                        min={1}
                        value={state.everyDays}
                        onChange={e => set('everyDays', e.target.value)}
                        style={debugFieldInputStyle}
                        className={`${fieldInputClass} max-w-[50px]`}
                    />
                )}

                <label className="text-[9px] text-gray-500 ml-1">priority</label>

                <input
                    type="number"
                    value={state.priority}
                    onChange={e => set('priority', e.target.value)}
                    style={debugFieldInputStyle}
                    className={`${fieldInputClass} max-w-[50px]`}
                />
            </FieldRow>

            <FieldRow label="media">
                <select
                    value={state.mediaType}
                    onChange={e => set('mediaType', e.target.value as BuilderState['mediaType'])}
                    className={fieldSelectClass}
                >
                    <option value="">none</option>
                    <option value="image">image</option>
                    <option value="gif">gif</option>
                    <option value="youtube">youtube</option>
                </select>

                {state.mediaType && (
                    <input
                        type="text"
                        value={state.mediaUrl}
                        onChange={e => set('mediaUrl', e.target.value)}
                        placeholder="https://…"
                        style={debugFieldInputStyle}
                        className={fieldInputClass}
                    />
                )}
            </FieldRow>

            {!state.mediaType && (
                <FieldRow label="emoji">
                    <input
                        type="text"
                        value={state.emoji}
                        onChange={e => set('emoji', e.target.value)}
                        placeholder="Optional hero glyph, used when no media"
                        style={debugFieldInputStyle}
                        className={fieldInputClass}
                    />
                </FieldRow>
            )}

            <div className="space-y-1 bg-gray-900/40 rounded p-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">Actions</span>

                    <button
                        type="button"
                        onClick={() =>
                            setState(s => ({ ...s, actions: [...s.actions, emptyAction()] }))
                        }
                        className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                        title="Add action"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {state.actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-1 flex-wrap">
                        <input
                            type="text"
                            value={a.label}
                            onChange={e => updateAction(i, { label: e.target.value })}
                            placeholder="Label"
                            style={debugFieldInputStyle}
                            className={`${fieldInputClass} max-w-[80px]`}
                        />

                        <select
                            value={a.style}
                            onChange={e =>
                                updateAction(i, { style: e.target.value as BuilderAction['style'] })
                            }
                            className={fieldSelectClass}
                        >
                            <option value="primary">primary</option>
                            <option value="secondary">secondary</option>
                            <option value="positive">positive</option>
                            <option value="dismiss">dismiss</option>
                        </select>

                        <select
                            value={a.type}
                            onChange={e =>
                                updateAction(i, { type: e.target.value as BuilderActionType })
                            }
                            className={fieldSelectClass}
                        >
                            <option value="dismiss">dismiss</option>
                            <option value="internalLink">internalLink</option>
                            <option value="externalLink">externalLink</option>
                            <option value="appStore">appStore</option>
                            <option value="capgoUpdate">capgoUpdate</option>
                        </select>

                        {a.type === 'internalLink' && (
                            <input
                                type="text"
                                value={a.path}
                                onChange={e => updateAction(i, { path: e.target.value })}
                                placeholder="/path"
                                style={debugFieldInputStyle}
                                className={`${fieldInputClass} max-w-[90px]`}
                            />
                        )}

                        {a.type === 'externalLink' && (
                            <input
                                type="text"
                                value={a.url}
                                onChange={e => updateAction(i, { url: e.target.value })}
                                placeholder="https://…"
                                style={debugFieldInputStyle}
                                className={`${fieldInputClass} max-w-[90px]`}
                            />
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                setState(s => ({
                                    ...s,
                                    actions: s.actions.filter((_, j) => j !== i),
                                }))
                            }
                            className="p-0.5 rounded hover:bg-gray-700 text-gray-600 hover:text-red-400"
                            title="Remove action"
                        >
                            <Trash2 className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-1 bg-gray-900/40 rounded p-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">Targeting</span>

                        {state.conditions.length > 1 && (
                            <select
                                value={state.combinator}
                                onChange={e => set('combinator', e.target.value as 'all' | 'any')}
                                className={fieldSelectClass}
                            >
                                <option value="all">all (AND)</option>
                                <option value="any">any (OR)</option>
                            </select>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setState(s => ({
                                ...s,
                                conditions: [...s.conditions, emptyCondition()],
                            }))
                        }
                        className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                        title="Add condition"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {state.conditions.length === 0 && (
                    <p className="text-[9px] text-gray-600 italic">
                        No conditions — matches everyone.
                    </p>
                )}

                {state.conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 flex-wrap">
                        <select
                            value={c.kind}
                            onChange={e =>
                                updateCondition(i, { kind: e.target.value as BuilderConditionKind })
                            }
                            className={fieldSelectClass}
                        >
                            <option value="platform">platform</option>
                            <option value="role">role</option>
                            <option value="version">version</option>
                        </select>

                        {c.kind === 'platform' && (
                            <input
                                type="text"
                                value={c.platforms}
                                onChange={e => updateCondition(i, { platforms: e.target.value })}
                                placeholder="ios, android, web"
                                style={debugFieldInputStyle}
                                className={fieldInputClass}
                            />
                        )}

                        {c.kind === 'role' && (
                            <input
                                type="text"
                                value={c.roles}
                                onChange={e => updateCondition(i, { roles: e.target.value })}
                                placeholder="learner, teacher"
                                style={debugFieldInputStyle}
                                className={fieldInputClass}
                            />
                        )}

                        {c.kind === 'version' && (
                            <React.Fragment>
                                <select
                                    value={c.source}
                                    onChange={e =>
                                        updateCondition(i, {
                                            source: e.target.value as BuilderCondition['source'],
                                        })
                                    }
                                    className={fieldSelectClass}
                                >
                                    <option value="native">native</option>
                                    <option value="web">web</option>
                                    <option value="capgo">capgo</option>
                                </select>

                                <select
                                    value={c.op}
                                    onChange={e =>
                                        updateCondition(i, {
                                            op: e.target.value as BuilderCondition['op'],
                                        })
                                    }
                                    className={fieldSelectClass}
                                >
                                    <option value="lt">&lt;</option>
                                    <option value="lte">&le;</option>
                                    <option value="eq">=</option>
                                    <option value="gte">&ge;</option>
                                    <option value="gt">&gt;</option>
                                </select>

                                <input
                                    type="text"
                                    value={c.value}
                                    onChange={e => updateCondition(i, { value: e.target.value })}
                                    placeholder="1.2.3"
                                    style={debugFieldInputStyle}
                                    className={`${fieldInputClass} max-w-[70px]`}
                                />
                            </React.Fragment>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                setState(s => ({
                                    ...s,
                                    conditions: s.conditions.filter((_, j) => j !== i),
                                }))
                            }
                            className="p-0.5 rounded hover:bg-gray-700 text-gray-600 hover:text-red-400"
                            title="Remove condition"
                        >
                            <Trash2 className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ))}
            </div>

            {validationError && (
                <p className="text-[9px] text-red-400 break-words">{validationError}</p>
            )}

            <div className="flex items-center gap-1.5 flex-wrap">
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!parsed.success}
                    className="flex items-center gap-1 text-[10px] bg-sky-700 hover:bg-sky-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors"
                >
                    <Eye className="w-3 h-3" />
                    Preview
                </button>

                <button
                    type="button"
                    onClick={() => copyJson('message')}
                    disabled={!parsed.success}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-200 px-2 py-1 rounded transition-colors"
                >
                    {copied === 'message' ? 'Copied!' : 'Copy message'}
                </button>

                <button
                    type="button"
                    onClick={() => copyJson('flag')}
                    disabled={!parsed.success}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-200 px-2 py-1 rounded transition-colors"
                >
                    {copied === 'flag' ? 'Copied!' : 'Copy flag JSON'}
                </button>
            </div>

            <p className="text-[9px] text-gray-600 leading-tight">
                {'"Copy flag JSON" produces a complete value for the LaunchDarkly '}
                <code className="text-cyan-400">inAppMessages</code>
                {' flag containing just this message.'}
            </p>
        </div>
    );
};

export default InAppMessageBuilder;
