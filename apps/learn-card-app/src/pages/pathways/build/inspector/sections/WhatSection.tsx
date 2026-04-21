/**
 * WhatSection — "what happens here" (policy).
 *
 * M1 wraps the existing `PolicyEditor` verbatim so the edit surface
 * stays identical; the section adds:
 *
 *   - A jargon-free section title ("What happens here") instead of
 *     the raw word "Policy".
 *   - A one-line summary built from `summarizePolicy` so the author
 *     can see the current state when the section is collapsed.
 *
 * The composite invariant (policy ⇔ termination pairing) lives in
 * the parent `InspectorPane` — this section is intentionally dumb so
 * M2's registry-driven rewrite can replace just the inner editor
 * without touching the section shell.
 */

import React, { useMemo } from 'react';

import { flashOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../../../stores/pathways';
import type { Pathway, PathwayNode } from '../../../types';
import PolicyEditor from '../../PolicyEditor';
import { setPolicy, setTermination } from '../../buildOps';
import { DEFAULT_TERMINATION } from '../../buildOps';
import { summarizePolicy } from '../../summarize/summarizePolicy';
import Section from '../Section';

interface WhatSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const WhatSection: React.FC<WhatSectionProps> = ({ pathway, node, onChangePathway }) => {
    // The composite policy picker needs the full pathway map. We
    // subscribe here rather than threading it through so the section
    // surface stays narrow — InspectorPane doesn't need to know that
    // WhatSection secretly depends on the pathway store.
    const allPathways = pathwayStore.use.pathways();

    // Build a title map for the summarizer. Memoised by identity so
    // every keystroke doesn't reallocate a big record.
    const pathwayTitleById = useMemo(
        () =>
            Object.fromEntries(
                Object.values(allPathways).map(p => [p.id, p.title]),
            ),
        [allPathways],
    );

    const handlePolicyChange = (policy: PathwayNode['stage']['policy']) => {
        // Composite invariant (carried over verbatim from the
        // previous NodeEditor): a `composite` policy is always
        // paired with a `pathway-completed` termination pointing at
        // the same pathway ref. Flip both atomically so the learner
        // experience stays coherent.
        let next = setPolicy(pathway, node.id, policy);

        const wasComposite = node.stage.policy.kind === 'composite';
        const isComposite = policy.kind === 'composite';

        if (isComposite && policy.pathwayRef) {
            next = setTermination(next, node.id, {
                kind: 'pathway-completed',
                pathwayRef: policy.pathwayRef,
            });
        } else if (wasComposite && !isComposite) {
            // Switching away from composite: drop the now-orphaned
            // pathway-completed termination back to a sane default
            // so the node is still valid by Zod.
            next = setTermination(next, node.id, DEFAULT_TERMINATION);
        }

        onChangePathway(next);
    };

    const summary = summarizePolicy(node.stage.policy, { pathwayTitleById });

    return (
        <Section
            icon={flashOutline}
            title="What happens here"
            summary={summary}
            iconTone="emerald"
            defaultOpen
        >
            <PolicyEditor
                value={node.stage.policy}
                onChange={handlePolicyChange}
                parentPathwayId={pathway.id}
                allPathways={allPathways}
            />
        </Section>
    );
};

export default WhatSection;
