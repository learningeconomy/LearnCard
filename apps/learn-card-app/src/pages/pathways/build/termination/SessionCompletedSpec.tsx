/**
 * Session-completed termination — the node completes when a
 * first-party LearnCard AI tutor session ends on `topicUri`.
 *
 * Naturally paired with an `ai-session` action on the same node;
 * completion is dispatched by the pathway progress reactor in
 * response to an `AiSessionCompleted` wallet event.
 *
 * ## Authoring in v1
 *
 * Author-selectable from the termination dropdown: yes. The editor
 * is a thin pair of inputs (`topicUri` + optional minimum duration
 * in minutes). The `topicUri` string **must match the one on the
 * node's `ai-session` action** for the reactor to fire — that
 * pairing isn't enforced by the schema (it's a cross-field rule
 * across two independent shapes), so:
 *
 *   - The "AI tutor session" template in `templates/registry.ts`
 *     seeds both with the same empty string at pick-time, so the
 *     author only types the URI once (in either editor) and the
 *     other side stays in lock-step until they're explicitly
 *     diverged.
 *   - The Inspector's `ActionSection` renders a small callout when
 *     a `session-completed` termination points at a different
 *     `topicUri` than the `ai-session` action on the same node,
 *     so an accidental drift is surfaced, not hidden.
 *
 * `minDurationSec` is a guard against "opened and immediately
 * closed" sessions — the binder declines to auto-complete a
 * session shorter than this. Authors type minutes; we store
 * seconds.
 */

import React from 'react';

import { sparklesOutline } from 'ionicons/icons';

import type { Termination } from '../../types';

import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

const SessionCompletedEditor: React.FC<{
    value: Extract<Termination, { kind: 'session-completed' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => {
    // Store seconds internally but author in minutes — the UX
    // convention for "how long should this session last at minimum".
    // Empty string means "no minimum".
    const minutesValue =
        value.minDurationSec && value.minDurationSec > 0
            ? Math.round(value.minDurationSec / 60).toString()
            : '';

    const handleTopicUri = (topicUri: string) =>
        onChange({
            ...value,
            topicUri,
        });

    const handleMinutes = (raw: string) => {
        // Blank input clears the guard entirely — `minDurationSec` is
        // truly optional on the schema, so we omit the key rather than
        // storing 0 (which would round-trip as "there IS a min, it's
        // just zero seconds").
        if (raw.trim() === '') {
            onChange({
                kind: 'session-completed',
                topicUri: value.topicUri,
            });

            return;
        }

        const mins = Math.max(0, Number(raw));

        if (!Number.isFinite(mins)) return;

        onChange({
            kind: 'session-completed',
            topicUri: value.topicUri,
            minDurationSec: Math.round(mins * 60),
        });
    };

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="session-topic-uri">
                    Topic URI
                </label>

                <input
                    id="session-topic-uri"
                    type="text"
                    className={INPUT}
                    value={value.topicUri}
                    onChange={e => handleTopicUri(e.target.value)}
                    placeholder="lc:topic:aws-iam-deep-dive"
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    The URI of the AI Topic boost this session covers. Must
                    match the topic on this step's AI session action for the
                    node to auto-complete.
                </p>
            </div>

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="session-min-minutes">
                    Minimum duration{' '}
                    <span className="text-grayscale-400 font-normal">
                        (minutes, optional)
                    </span>
                </label>

                <input
                    id="session-min-minutes"
                    type="number"
                    min={0}
                    step={1}
                    className={INPUT}
                    value={minutesValue}
                    onChange={e => handleMinutes(e.target.value)}
                    placeholder="e.g. 5"
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    Skip auto-complete if the session ends before this
                    duration. Leave blank to count any session end.
                </p>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Spec registration
// ---------------------------------------------------------------------------

const sessionCompletedSpec: TerminationKindSpec<'session-completed'> = {
    kind: 'session-completed',
    label: 'Finish tutor session',
    icon: sparklesOutline,
    blurb: 'Done when the AI tutor session on this topic ends.',
    // Author-selectable: the "AI tutor session" template pairs this
    // with a matching `ai-session` action so the default pick
    // lands both fields on the same `topicUri`.
    selectable: true,

    default: () => ({
        kind: 'session-completed',
        topicUri: '',
    }),

    Editor: ({ value, onChange }) => (
        <SessionCompletedEditor value={value} onChange={onChange} />
    ),

    summarize: value =>
        value.topicUri
            ? `Finish tutor session on ${value.topicUri}`
            : 'Finish tutor session',
};

export default sessionCompletedSpec;
