/**
 * DoneSection — "done when" (termination).
 *
 * Hidden when the selected node's policy is `composite`: the
 * `composite` ⇔ `pathway-completed` invariant is owned by
 * `WhatSection` and exposing a manual termination editor would let
 * the author break that pairing. Instead we show a short explainer
 * card so the absence is intentional, not mysterious.
 *
 * When visible, this section wraps the existing `TerminationEditor`
 * and adds the jargon-free title + summary.
 */

import React, { useMemo } from 'react';

import { IonIcon } from '@ionic/react';
import { checkmarkDoneOutline, informationCircleOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../../../stores/pathways';
import type { Pathway, PathwayNode } from '../../../types';
import TerminationEditor from '../../TerminationEditor';
import { setTermination } from '../../buildOps';
import { summarizeTermination } from '../../summarize/summarizeTermination';
import Section from '../Section';

interface DoneSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const DoneSection: React.FC<DoneSectionProps> = ({ pathway, node, onChangePathway }) => {
    const allPathways = pathwayStore.use.pathways();

    const pathwayTitleById = useMemo(
        () =>
            Object.fromEntries(
                Object.values(allPathways).map(p => [p.id, p.title]),
            ),
        [allPathways],
    );

    const handleTerminationChange = (termination: PathwayNode['stage']['termination']) =>
        onChangePathway(setTermination(pathway, node.id, termination));

    // Composite nodes are "done" implicitly — when their referenced
    // pathway completes. Show a small callout instead of an editor;
    // the summary still reflects this honestly.
    if (node.stage.policy.kind === 'composite') {
        return (
            <Section
                icon={checkmarkDoneOutline}
                title="Done when"
                summary={summarizeTermination(node.stage.termination, { pathwayTitleById })}
                defaultOpen={false}
            >
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-grayscale-10 border border-grayscale-200">
                    <IonIcon
                        icon={informationCircleOutline}
                        aria-hidden
                        className="text-grayscale-500 text-base mt-0.5 shrink-0"
                    />

                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        This step finishes automatically when the nested pathway's
                        destination is reached. No manual rule needed.
                    </p>
                </div>
            </Section>
        );
    }

    return (
        <Section
            icon={checkmarkDoneOutline}
            title="Done when"
            summary={summarizeTermination(node.stage.termination, { pathwayTitleById })}
            defaultOpen={false}
        >
            <TerminationEditor
                value={node.stage.termination}
                onChange={handleTerminationChange}
            />
        </Section>
    );
};

export default DoneSection;
