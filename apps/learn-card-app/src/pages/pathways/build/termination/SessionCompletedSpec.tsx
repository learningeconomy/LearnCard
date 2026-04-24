/**
 * Session-completed termination — the node completes when a
 * first-party LearnCard AI tutor session ends on `topicUri`.
 *
 * Naturally paired with an `ai-session` action on the same node;
 * completion is dispatched by the pathway progress reactor in
 * response to an `AiSessionCompleted` wallet event.
 *
 * Not author-selectable from the dropdown in v0.5: the only way to
 * pick it today is through the `ai-session` composite editor, which
 * sets the action and termination together so the `topicUri` fields
 * can never drift. Keeping it out of the generic dropdown avoids
 * an author authoring a session-completed termination with no
 * paired action (a guaranteed orphan).
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { informationCircleOutline, sparklesOutline } from 'ionicons/icons';

import type { Termination } from '../../types';

import type { TerminationKindSpec } from './types';

const SessionCompletedEditor: React.FC<{
    value: Extract<Termination, { kind: 'session-completed' }>;
    onChange: (next: Termination) => void;
}> = ({ value }) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-grayscale-10 border border-grayscale-200">
        <IonIcon
            icon={informationCircleOutline}
            aria-hidden
            className="text-grayscale-500 text-base mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1 text-xs text-grayscale-600 leading-relaxed">
            <p>Completes automatically when the tutor session finishes.</p>
            <p className="mt-1 text-grayscale-800">
                <span className="font-medium">Topic:</span>{' '}
                <span className="break-all">{value.topicUri}</span>
            </p>
            {value.minDurationSec && value.minDurationSec > 0 && (
                <p className="mt-1 text-grayscale-500">
                    Minimum duration:{' '}
                    <span className="font-medium">
                        {Math.ceil(value.minDurationSec / 60)} min
                    </span>
                </p>
            )}
        </div>
    </div>
);

const sessionCompletedSpec: TerminationKindSpec<'session-completed'> = {
    kind: 'session-completed',
    label: 'Finish tutor session',
    icon: sparklesOutline,
    blurb: 'Done when the AI tutor session on this topic ends.',
    selectable: false,

    // Placeholder `topicUri` — real values are set by the
    // `ai-session` composite editor alongside the matching action.
    default: () => ({
        kind: 'session-completed',
        topicUri: '',
    }),

    Editor: ({ value, onChange }) => (
        <SessionCompletedEditor value={value} onChange={onChange} />
    ),

    summarize: () => 'Finish tutor session',
};

export default sessionCompletedSpec;
