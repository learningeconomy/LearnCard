import React from 'react';
import type { InAppMessageAction, InAppMessageStep } from '@learncard/types';
import { remapStoryScreens, type BuilderState } from './inAppMessageBuilderState';

const input =
    'w-full py-2 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const button =
    'py-2 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 text-xs hover:bg-grayscale-10 disabled:opacity-40';
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="block text-xs font-medium text-grayscale-700 space-y-1.5">
        <span>{label}</span>
        {children}
    </label>
);

const StepActions: React.FC<{
    actions: InAppMessageAction[];
    onChange: (actions: InAppMessageAction[]) => void;
}> = ({ actions, onChange }) => {
    const update = (index: number, patch: Partial<InAppMessageAction>): void =>
        onChange(actions.map((action, i) => (i === index ? { ...action, ...patch } : action)));
    return (
        <div className="space-y-3">
            {actions.map((action, index) => (
                <fieldset
                    key={index}
                    className="border border-grayscale-200 rounded-xl p-3 space-y-3"
                >
                    <legend className="text-xs text-grayscale-700">Action {index + 1}</legend>
                    <Field label="Label">
                        <input
                            className={input}
                            value={action.label}
                            onChange={e => update(index, { label: e.target.value })}
                        />
                    </Field>
                    <Field label="Style">
                        <select
                            className={input}
                            value={action.style}
                            onChange={e =>
                                update(index, {
                                    style: e.target.value as InAppMessageAction['style'],
                                })
                            }
                        >
                            {['primary', 'secondary', 'positive', 'dismiss'].map(value => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Action type">
                        <select
                            className={input}
                            value={action.action.type}
                            onChange={e => {
                                const type = e.target.value;
                                if (type === 'internalLink')
                                    update(index, { action: { type, path: '/' } });
                                else if (type === 'externalLink')
                                    update(index, { action: { type, url: 'https://' } });
                                else if (type === 'openApp')
                                    update(index, { action: { type, listingId: '', path: '/' } });
                                else if (type === 'openMessage')
                                    update(index, { action: { type, messageId: '' } });
                                else if (
                                    type === 'appStore' ||
                                    type === 'capgoUpdate' ||
                                    type === 'dismiss'
                                )
                                    update(index, { action: { type } });
                            }}
                        >
                            {[
                                'internalLink',
                                'externalLink',
                                'appStore',
                                'capgoUpdate',
                                'dismiss',
                                'openApp',
                                'openMessage',
                            ].map(value => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </Field>
                    {action.action.type === 'openApp' && (
                        <>
                            <Field label="App listing ID">
                                <input
                                    className={input}
                                    value={action.action.listingId}
                                    onChange={e =>
                                        update(index, {
                                            action: {
                                                ...action.action,
                                                type: 'openApp',
                                                listingId: e.target.value,
                                            },
                                        })
                                    }
                                />
                            </Field>
                            <Field label="App page path">
                                <input
                                    className={input}
                                    value={action.action.path ?? ''}
                                    onChange={e =>
                                        update(index, {
                                            action: {
                                                ...action.action,
                                                type: 'openApp',
                                                listingId: String(action.action.listingId),
                                                path: e.target.value || undefined,
                                            },
                                        })
                                    }
                                />
                            </Field>
                        </>
                    )}
                    {action.action.type === 'openMessage' && (
                        <Field label="Message ID">
                            <input
                                className={input}
                                value={action.action.messageId}
                                onChange={e =>
                                    update(index, {
                                        action: { type: 'openMessage', messageId: e.target.value },
                                    })
                                }
                            />
                        </Field>
                    )}
                    {action.action.type === 'internalLink' && (
                        <Field label="Path">
                            <input
                                className={input}
                                value={action.action.path}
                                onChange={e =>
                                    update(index, {
                                        action: { type: 'internalLink', path: e.target.value },
                                    })
                                }
                            />
                        </Field>
                    )}
                    {action.action.type === 'externalLink' && (
                        <Field label="URL">
                            <input
                                className={input}
                                value={action.action.url}
                                onChange={e =>
                                    update(index, {
                                        action: { type: 'externalLink', url: e.target.value },
                                    })
                                }
                            />
                        </Field>
                    )}
                    {action.action.type === 'appStore' &&
                        (['iosUrl', 'androidUrl', 'webUrl'] as const).map(key => (
                            <Field key={key} label={key}>
                                <input
                                    className={input}
                                    value={String(action.action[key] ?? '')}
                                    onChange={e =>
                                        update(index, {
                                            action: {
                                                ...action.action,
                                                [key]: e.target.value || undefined,
                                            },
                                        })
                                    }
                                />
                            </Field>
                        ))}
                    <label className="text-xs text-grayscale-700 flex gap-2">
                        <input
                            type="checkbox"
                            checked={action.closeOnComplete}
                            onChange={e => update(index, { closeOnComplete: e.target.checked })}
                        />
                        Close on completion
                    </label>
                    <button
                        type="button"
                        className={button}
                        onClick={() => onChange(actions.filter((_, i) => i !== index))}
                    >
                        Remove action
                    </button>
                </fieldset>
            ))}
            <button
                type="button"
                className={button}
                onClick={() =>
                    onChange([
                        ...actions,
                        {
                            label: 'Done',
                            style: 'primary',
                            action: { type: 'dismiss' },
                            closeOnComplete: true,
                        },
                    ])
                }
            >
                Add action
            </button>
        </div>
    );
};

export const InAppMessageRichFields: React.FC<{
    state: BuilderState;
    onChange: (patch: Partial<BuilderState>) => void;
}> = ({ state, onChange }) => {
    const updateStep = (index: number, patch: Partial<InAppMessageStep>): void =>
        onChange({
            steps: state.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
        });
    const move = (index: number, direction: number): void => {
        const order = state.steps.map((_, i) => i);
        const other = index + direction;
        if (other < 0 || other >= order.length) return;
        [order[index], order[other]] = [order[other], order[index]];
        onChange(remapStoryScreens(state, order));
    };
    return (
        <section className="bg-white rounded-[20px] p-4 space-y-4 font-poppins">
            {state.presentation === 'story' && (
                <>
                    <h3 className="text-sm font-semibold text-grayscale-900">Story screens</h3>
                    {state.steps.map((step, index) => (
                        <fieldset
                            key={index}
                            className="border border-grayscale-200 rounded-xl p-3 space-y-3"
                        >
                            <legend className="text-xs text-grayscale-700">
                                Screen {index + 1}
                            </legend>
                            <Field label="Screen title">
                                <input
                                    className={input}
                                    value={step.title}
                                    onChange={e => updateStep(index, { title: e.target.value })}
                                />
                            </Field>
                            <Field label="Screen body">
                                <textarea
                                    className={input}
                                    value={step.body ?? ''}
                                    onChange={e => updateStep(index, { body: e.target.value })}
                                />
                            </Field>
                            <Field label="Screen media">
                                <select
                                    className={input}
                                    value={step.media?.type ?? ''}
                                    onChange={e =>
                                        updateStep(index, {
                                            media: e.target.value
                                                ? {
                                                      url: '',
                                                      aspect: '16:9',
                                                      ...step.media,
                                                      type: e.target.value as
                                                          'image' | 'gif' | 'youtube',
                                                  }
                                                : undefined,
                                        })
                                    }
                                >
                                    <option value="">None</option>
                                    {['image', 'gif', 'youtube'].map(value => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                            </Field>
                            {step.media && (
                                <>
                                    <Field label="Media URL">
                                        <input
                                            className={input}
                                            value={step.media.url}
                                            onChange={e => {
                                                if (step.media)
                                                    updateStep(index, {
                                                        media: {
                                                            ...step.media,
                                                            url: e.target.value,
                                                        },
                                                    });
                                            }}
                                        />
                                    </Field>
                                    <Field label="Alt text">
                                        <input
                                            className={input}
                                            value={step.media.alt ?? ''}
                                            onChange={e => {
                                                if (step.media)
                                                    updateStep(index, {
                                                        media: {
                                                            ...step.media,
                                                            alt: e.target.value,
                                                        },
                                                    });
                                            }}
                                        />
                                    </Field>
                                    <Field label="Aspect ratio">
                                        <input
                                            className={input}
                                            value={step.media.aspect}
                                            onChange={e => {
                                                if (step.media)
                                                    updateStep(index, {
                                                        media: {
                                                            ...step.media,
                                                            aspect: e.target.value,
                                                        },
                                                    });
                                            }}
                                        />
                                    </Field>
                                </>
                            )}
                            <Field label="Hero glyph">
                                <input
                                    className={input}
                                    value={step.emoji ?? ''}
                                    onChange={e => updateStep(index, { emoji: e.target.value })}
                                />
                            </Field>
                            {index === state.steps.length - 1 && (
                                <>
                                    <label className="text-xs text-grayscale-700 flex gap-2">
                                        <input
                                            type="checkbox"
                                            checked={step.actions !== undefined}
                                            onChange={e =>
                                                updateStep(index, {
                                                    actions: e.target.checked ? [] : undefined,
                                                })
                                            }
                                        />
                                        Override final-screen actions
                                    </label>
                                    {step.actions && (
                                        <StepActions
                                            actions={step.actions}
                                            onChange={actions => updateStep(index, { actions })}
                                        />
                                    )}
                                </>
                            )}
                            {index !== state.steps.length - 1 && step.actions !== undefined && (
                                <div
                                    role="alert"
                                    className="p-3 bg-amber-50 text-sm text-amber-900 rounded-2xl space-y-2"
                                >
                                    <p>
                                        Only the final screen can have actions. Move this screen to
                                        the end or remove its action override.
                                    </p>
                                    <button
                                        type="button"
                                        className={button}
                                        onClick={() => updateStep(index, { actions: undefined })}
                                    >
                                        Remove action override
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={button}
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                >
                                    Move up
                                </button>
                                <button
                                    type="button"
                                    className={button}
                                    disabled={index === state.steps.length - 1}
                                    onClick={() => move(index, 1)}
                                >
                                    Move down
                                </button>
                                <button
                                    type="button"
                                    className={button}
                                    onClick={() =>
                                        onChange(
                                            remapStoryScreens(
                                                state,
                                                state.steps
                                                    .map((_, i) => i)
                                                    .filter(i => i !== index)
                                            )
                                        )
                                    }
                                >
                                    Remove screen
                                </button>
                            </div>
                        </fieldset>
                    ))}
                    <button
                        type="button"
                        className={button}
                        onClick={() =>
                            onChange({ steps: [...state.steps, { title: 'New screen' }] })
                        }
                    >
                        Add screen
                    </button>
                </>
            )}
            {state.presentation === 'iframe' && (
                <>
                    <Field label="Iframe HTTPS URL">
                        <input
                            className={input}
                            value={state.iframeUrl}
                            onChange={e => onChange({ iframeUrl: e.target.value })}
                        />
                    </Field>
                    <Field label="Iframe title">
                        <input
                            className={input}
                            value={state.iframeTitle}
                            onChange={e => onChange({ iframeTitle: e.target.value })}
                        />
                    </Field>
                    <Field label="Load timeout (ms)">
                        <input
                            className={input}
                            type="number"
                            min="1"
                            value={state.iframeTimeout}
                            onChange={e => onChange({ iframeTimeout: e.target.value })}
                        />
                    </Field>
                    <Field label="Allowed internal destinations (one exact path per line)">
                        <textarea
                            className={input}
                            rows={3}
                            placeholder="/passport"
                            value={state.iframeAllowedInternalPaths}
                            onChange={e => onChange({ iframeAllowedInternalPaths: e.target.value })}
                        />
                    </Field>
                    <p className="text-xs text-grayscale-600">
                        Empty denies all internal navigation. Query strings and fragments must match
                        exactly.
                    </p>
                </>
            )}
            <Field label="Locale overrides (JSON)">
                <textarea
                    className={`${input} font-mono`}
                    rows={5}
                    placeholder={'{"es": {"title": "Hola"}}'}
                    value={state.localesJson}
                    onChange={e => onChange({ localesJson: e.target.value })}
                />
            </Field>
        </section>
    );
};
