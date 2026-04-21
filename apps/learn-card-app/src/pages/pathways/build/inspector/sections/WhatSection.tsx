/**
 * WhatSection — "what happens here" (policy).
 *
 * Structure when expanded:
 *
 *   1. TemplatePicker — 7 starter shapes. Tapping one sets BOTH
 *      policy + termination atomically. This is the primary entry
 *      point for 90% of nodes.
 *
 *   2. PolicyEditor — variant-specific fields for the current
 *      policy kind. Authors tweak the specifics here after (or
 *      without) picking a template.
 *
 * The composite invariant (policy ⇔ termination pairing) lives here
 * — both the template picker AND the policy editor can disturb it,
 * so it has to be owned at this one spot:
 *
 *   - Picking a template calls `onPick`, which writes policy +
 *     termination in one transaction.
 *
 *   - Editing a composite policy's `pathwayRef` flips the paired
 *     `pathway-completed` termination's ref too (same atomic write).
 *     Switching AWAY from composite resets the termination to the
 *     template default so we don't leak an orphan `pathway-completed`.
 */

import React, { useMemo } from 'react';

import { flashOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../../../stores/pathways';
import type { Pathway, PathwayNode, Policy } from '../../../types';
import PolicyEditor from '../../PolicyEditor';
import { DEFAULT_TERMINATION, setPolicy, setTermination } from '../../buildOps';
import { summarizePolicy } from '../../summarize/summarizePolicy';
import TemplatePicker from '../../templates/TemplatePicker';
import type { NodeTemplate } from '../../templates/registry';
import Section from '../Section';

interface WhatSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const WhatSection: React.FC<WhatSectionProps> = ({ pathway, node, onChangePathway }) => {
    // Composite picker needs the full pathway map. Subscribing here
    // keeps WhatSection's prop surface narrow — InspectorPane doesn't
    // need to know this section secretly depends on the store.
    const allPathways = pathwayStore.use.pathways();

    const pathwayTitleById = useMemo(
        () => Object.fromEntries(Object.values(allPathways).map(p => [p.id, p.title])),
        [allPathways],
    );

    /**
     * Apply a template — set policy + termination in one store
     * transaction so history / offline-queue get a single commit.
     */
    const handlePickTemplate = (template: NodeTemplate) => {
        let next = setPolicy(pathway, node.id, template.policy());
        next = setTermination(next, node.id, template.termination());
        onChangePathway(next);
    };

    /**
     * Edit the policy directly (variant-specific fields). Carries
     * the composite ⇔ pathway-completed invariant: when editing a
     * composite policy to point at a pathway, flip the paired
     * termination to the same ref. When switching AWAY from
     * composite, reset the termination to a sane default.
     */
    const handlePolicyChange = (policy: Policy) => {
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
            <div className="space-y-5">
                <TemplatePicker
                    policy={node.stage.policy}
                    termination={node.stage.termination}
                    onPick={handlePickTemplate}
                />

                <div className="pt-4 border-t border-grayscale-200">
                    <p className="text-xs font-medium text-grayscale-700 mb-2">Details</p>

                    <PolicyEditor
                        value={node.stage.policy}
                        onChange={handlePolicyChange}
                        parentPathwayId={pathway.id}
                        allPathways={allPathways}
                    />
                </div>
            </div>
        </Section>
    );
};

export default WhatSection;
