/**
 * CredentialClaimedPathwayCta — richer post-claim celebratory
 * affordance that replaces the generic "Successfully claimed
 * Credential!" toast on every claim surface.
 *
 * Renders nothing when the just-claimed credential doesn't advance
 * any pathway — claim surfaces always render this component and
 * fall back to their existing toast if it stays silent. That keeps
 * the wiring symmetric across surfaces and means adding a new
 * pathway-aware author doesn't require touching the UX surfaces
 * again.
 *
 * ## Copy
 *
 * Follows the app UI/UX guidelines from `AGENTS.md`:
 *   - `font-poppins`, `grayscale-*` / `emerald-*` tokens only
 *   - No jargon ("pathway" is fine — it's a first-class concept in
 *     the app; "node" is replaced with the actual node title).
 *   - Action verbs on the CTA ("See pathway →", "View progress").
 *   - Respects `prefers-reduced-motion` via the plain CSS
 *     transitions on Tailwind utility classes.
 */

import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, sparklesOutline } from 'ionicons/icons';

import {
    usePathwayProgressForCredential,
    type AffectedNode,
    type AffectedOutcome,
} from './usePathwayProgressForCredential';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CredentialClaimedPathwayCtaProps {
    /**
     * The wallet URI of the just-claimed credential. When null /
     * undefined the component renders nothing — useful for claim
     * surfaces that call this conditionally.
     */
    credentialUri: string | null | undefined;
    /**
     * Invoked when the learner clicks a "see pathway" link. The
     * caller uses this to close any open claim modal *before* the
     * navigation fires so the target surface doesn't render under
     * a lingering overlay.
     */
    onNavigate?: () => void;
    /**
     * Optional extra class applied to the outer card. Callers
     * sometimes want `w-full` or a margin tweak.
     */
    className?: string;
    /**
     * When true, compact variant (omits the pathway progress
     * breakdown on multi-pathway matches). Used by space-constrained
     * surfaces (toasts, bottom sheets).
     */
    compact?: boolean;
}

// ---------------------------------------------------------------------------
// Copy helpers
// ---------------------------------------------------------------------------

const describeAffectedNodes = (nodes: AffectedNode[]): string => {
    if (nodes.length === 0) return '';
    if (nodes.length === 1) {
        return `Advanced "${nodes[0].nodeTitle}" on ${nodes[0].pathwayTitle}.`;
    }

    const byPathway = new Map<string, { title: string; nodeCount: number }>();

    for (const node of nodes) {
        const existing = byPathway.get(node.pathwayId);

        if (existing) {
            existing.nodeCount += 1;
        } else {
            byPathway.set(node.pathwayId, {
                title: node.pathwayTitle,
                nodeCount: 1,
            });
        }
    }

    if (byPathway.size === 1) {
        const only = Array.from(byPathway.values())[0];

        return `Advanced ${only.nodeCount} step${only.nodeCount === 1 ? '' : 's'} on ${only.title}.`;
    }

    return `Advanced ${nodes.length} steps across ${byPathway.size} pathways.`;
};

const describeAffectedOutcomes = (outcomes: AffectedOutcome[]): string => {
    if (outcomes.length === 0) return '';
    if (outcomes.length === 1) {
        return `Bound "${outcomes[0].outcomeLabel}" on ${outcomes[0].pathwayTitle}.`;
    }

    return `Bound ${outcomes.length} outcomes across your pathways.`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CredentialClaimedPathwayCta: React.FC<CredentialClaimedPathwayCtaProps> = ({
    credentialUri,
    onNavigate,
    className = '',
    compact = false,
}) => {
    const history = useHistory();
    const progress = usePathwayProgressForCredential(credentialUri ?? null);

    // Zero-render path: when the reactor has finished and nothing
    // was affected, render absolutely nothing. The claim surface's
    // existing toast handles the baseline "successfully claimed"
    // affordance — we only take over when we have something meaningful
    // to add.
    if (!progress.isReady || !progress.hasProgress) return null;

    // Primary navigation target — the first affected node. For
    // multi-hit, the caller can still click into any pathway from
    // the breakdown, but the headline CTA links to the first (most
    // recently-activated route in dispatch order).
    const firstNode = progress.affectedNodes[0];
    const firstOutcome = progress.affectedOutcomes[0];

    const primaryTarget = firstNode
        ? `/pathways/node/${firstNode.pathwayId}/${firstNode.nodeId}`
        : firstOutcome
          ? '/pathways/today'
          : '/pathways/today';

    const handlePrimary = () => {
        onNavigate?.();
        history.push(primaryTarget);
    };

    const nodeLine = describeAffectedNodes(progress.affectedNodes);
    const outcomeLine = describeAffectedOutcomes(progress.affectedOutcomes);

    const pathwayCountForButton = new Set(
        progress.affectedNodes
            .map(n => n.pathwayId)
            .concat(progress.affectedOutcomes.map(o => o.pathwayId)),
    ).size;

    const buttonLabel = pathwayCountForButton > 1 ? 'See pathways' : 'See pathway';

    return (
        <div
            className={`
                font-poppins
                rounded-[20px] border border-emerald-100 bg-emerald-50
                p-4
                flex flex-col gap-3
                animate-fade-in-up
                ${className}
            `}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-2.5">
                <IonIcon
                    icon={checkmarkCircleOutline}
                    className="text-emerald-600 text-xl mt-0.5 shrink-0"
                    aria-hidden
                />

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-grayscale-900 leading-snug flex items-center gap-1.5">
                        <IonIcon
                            icon={sparklesOutline}
                            className="text-emerald-600 text-base shrink-0"
                            aria-hidden
                        />
                        <span>This credential advanced your work</span>
                    </p>

                    {nodeLine && (
                        <p className="mt-1 text-xs text-grayscale-700 leading-relaxed">
                            {nodeLine}
                        </p>
                    )}

                    {outcomeLine && (
                        <p className="mt-0.5 text-xs text-grayscale-700 leading-relaxed">
                            {outcomeLine}
                        </p>
                    )}

                    {/* Per-pathway breakdown — only in non-compact mode
                        and when we have more than one affected entry. */}
                    {!compact && progress.affectedNodes.length > 1 && (
                        <ul className="mt-2 space-y-1">
                            {progress.affectedNodes.map(node => (
                                <li
                                    key={`${node.pathwayId}:${node.nodeId}`}
                                    className="text-[11px] text-grayscale-600 leading-relaxed"
                                >
                                    <span className="font-medium text-grayscale-800">
                                        {node.pathwayTitle}
                                    </span>{' '}
                                    — {node.nodeTitle}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={handlePrimary}
                className="
                    self-stretch
                    py-2.5 px-4
                    rounded-[20px]
                    bg-emerald-600 hover:bg-emerald-700
                    text-white font-medium text-sm
                    flex items-center justify-center gap-1.5
                    transition-colors
                "
            >
                {buttonLabel}
                <span aria-hidden>→</span>
            </button>
        </div>
    );
};

export default CredentialClaimedPathwayCta;
