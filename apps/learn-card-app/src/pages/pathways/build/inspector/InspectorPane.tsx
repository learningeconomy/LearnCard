/**
 * InspectorPane — right side of the Builder. Stitches together the
 * five collapsible sections for the currently-selected node.
 *
 * Rules:
 *   - Stays a dumb layout: every section owns its own editing
 *     affordances + commit path. InspectorPane just hands each
 *     section the same `onChangePathway` callback that BuildMode
 *     passes down.
 *   - Keeps the composite ⇔ pathway-completed invariant inside
 *     `WhatSection` (it has the policy surface) rather than here,
 *     so we don't get two places to edit the same rule.
 *   - Section ordering reflects the author's mental model:
 *
 *       Identity      — what am I editing?
 *       What happens  — what does the learner do?
 *       Where to act  — where does the learner go to do it?
 *       Done when     — how do they finish?
 *       Connections   — what unlocks this, what does it unlock?
 *       Danger zone   — destructive actions, always last.
 *
 *   - "Where to act" sits between What and Done because it shares
 *     a natural read with the policy (the work shape implies a
 *     launch destination) but the termination often depends on
 *     whether that launch happened (session-completed needs an
 *     ai-session action, for instance). Authors move top-to-bottom
 *     through the inspector, so action comes before termination.
 */

import React from 'react';

import type { Pathway, PathwayNode } from '../../types';
import type { Issue } from '../validate/validatePathway';

import ValidationBanner from './ValidationBanner';
import ActionSection from './sections/ActionSection';
import ConnectionsSection from './sections/ConnectionsSection';
import DangerSection from './sections/DangerSection';
import DoneSection from './sections/DoneSection';
import IdentitySection from './sections/IdentitySection';
import WhatSection from './sections/WhatSection';

interface InspectorPaneProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
    onDeleted?: () => void;

    /**
     * All validation issues for the pathway. The banner filters
     * down to the current node + pathway-level. Passing the whole
     * list (rather than pre-filtering at the call site) keeps the
     * filter logic beside the UI, where it can evolve as the banner
     * gains features (e.g. jump-to-section).
     */
    issues?: Issue[];

    /**
     * "Create a new nested pathway in place" — forwarded to
     * WhatSection → PolicyEditor → CompositeSpec. Passed in from
     * BuildMode so the commit + drill-in side-effects live at the
     * top of the tree, not buried in a leaf editor.
     */
    onCreateNestedPathway?: (title: string) => void;
}

const InspectorPane: React.FC<InspectorPaneProps> = ({
    pathway,
    node,
    onChangePathway,
    onDeleted,
    issues = [],
    onCreateNestedPathway,
}) => (
    <section
        /*
            `key` on the node id: force a remount when the author
            switches to a different node. This resets each Section's
            uncontrolled open state so a long-opened rubric editor
            doesn't leak across nodes.
        */
        key={node.id}
        className="space-y-3 font-poppins"
        aria-label={`Edit step ${node.title || 'untitled'}`}
    >
        <header className="space-y-1 px-1">
            <h2 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                Edit step
            </h2>

            <p className="text-xs text-grayscale-500">
                Changes save as you type.
            </p>
        </header>

        <ValidationBanner issues={issues} currentNodeId={node.id} />

        <IdentitySection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
        />

        <WhatSection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
            onCreateNestedPathway={onCreateNestedPathway}
        />

        {/*
            ActionSection returns null for composite-policy nodes
            (their launch is implicitly "drill into the nested
            pathway"), so it won't render for those — matches
            DoneSection's behavior for the same reason.
        */}
        <ActionSection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
        />

        <DoneSection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
        />

        <ConnectionsSection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
        />

        <DangerSection
            pathway={pathway}
            node={node}
            onChangePathway={onChangePathway}
            onDeleted={onDeleted}
        />
    </section>
);

export default InspectorPane;
