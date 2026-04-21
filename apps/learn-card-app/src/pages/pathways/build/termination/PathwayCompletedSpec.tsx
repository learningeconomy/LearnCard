/**
 * Pathway-completed termination — the natural partner of a
 * `composite` policy. Managed automatically by the composite
 * invariant in `WhatSection` — authors never pick this kind from
 * the dropdown.
 *
 * We still register a spec so the registry is total (every `kind` in
 * the union has an entry). The Editor is a read-only explainer for
 * the defensive case where somehow a `pathway-completed` termination
 * lands on a non-composite node (e.g. migration bug, hand-edited
 * state). Authors see "this shouldn't be here" instead of a crash.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { informationCircleOutline, trophyOutline } from 'ionicons/icons';

import type { Termination } from '../../types';

import type { TerminationKindSpec } from './types';

const PathwayCompletedEditor: React.FC<{
    value: Extract<Termination, { kind: 'pathway-completed' }>;
    onChange: (next: Termination) => void;
}> = () => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-grayscale-10 border border-grayscale-200">
        <IonIcon
            icon={informationCircleOutline}
            aria-hidden
            className="text-grayscale-500 text-base mt-0.5 shrink-0"
        />

        <p className="text-xs text-grayscale-600 leading-relaxed">
            This termination is managed automatically and paired with a nested
            pathway. Use the "What happens here" section above to change it.
        </p>
    </div>
);

const pathwayCompletedSpec: TerminationKindSpec<'pathway-completed'> = {
    kind: 'pathway-completed',
    label: 'Finish nested pathway',
    icon: trophyOutline,
    blurb: "Done when the nested pathway's destination is reached.",
    selectable: false,

    // Zod-invalid placeholder. Never emitted from UI: the composite
    // invariant always pairs this with a real `pathwayRef` at the
    // same time it's chosen.
    default: () => ({
        kind: 'pathway-completed',
        pathwayRef: '' as unknown as Extract<
            Termination,
            { kind: 'pathway-completed' }
        >['pathwayRef'],
    }),

    Editor: ({ value, onChange }) => (
        <PathwayCompletedEditor value={value} onChange={onChange} />
    ),

    summarize: (value, ctx) => {
        if (!value.pathwayRef) return 'Finish the nested pathway';

        const title = ctx.pathwayTitleById?.[value.pathwayRef];
        return title ? `Finish ${title}` : 'Finish the nested pathway';
    },
};

export default pathwayCompletedSpec;
