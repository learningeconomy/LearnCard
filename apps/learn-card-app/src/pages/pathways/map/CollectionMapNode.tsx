/**
 * CollectionMapNode — compact "collection card" that stands in for a
 * fan-in group of sibling nodes on the Map.
 *
 * Why this exists
 * ---------------
 * Pathways often encode "earn 10 of these to unlock that": ten badge
 * cards pointing at one certificate card. Rendered literally, it reads
 * as a chaotic wall. This component collapses such a group (detected
 * upstream by `detectCollections`) into one recognizable, scannable
 * card with:
 *
 *   - A **stacked avatar** showing up to 3 representative member
 *     images/glyphs (the "collection cover"),
 *   - A **pluralized title** ("Earn 10 Badges"),
 *   - A **progress bar + count** ("7 / 10 earned"),
 *   - An **expand affordance** so the learner can still see each
 *     individual member when they want to.
 *
 * The component is purely presentational. It never mutates pathway
 * state; it just receives a `CollectionGroup`, the member
 * `PathwayNode`s, and an `onExpand` callback.
 *
 * Visual language matches MapNode: 200 px width, rounded-2xl card,
 * soft status tint (here: always the "not-started" / "in-progress" /
 * "completed" wash depending on rollup fraction), and React Flow
 * handles in the same bottom-in / top-out orientation as every other
 * node so edges flow the same way.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { Handle, Position } from '@xyflow/react';
import {
    chevronForwardOutline,
    documentTextOutline,
    gitBranchOutline,
    layersOutline,
    openOutline,
    refreshOutline,
    repeatOutline,
    ribbonOutline,
} from 'ionicons/icons';
import { motion } from 'motion/react';

import type { PathwayNode, Policy } from '../types';

import type { CollectionGroup, CollectionProgress } from './collectionDetection';

type PolicyKind = Policy['kind'];

/**
 * Kind color tokens mirror MapNode.KIND_TONE exactly. Duplicated (not
 * imported) so the two components can diverge independently — a
 * collection card is a different object than a regular node even when
 * the underlying kind is the same.
 */
const KIND_TONE: Record<PolicyKind, { bg: string; fg: string }> = {
    practice: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    artifact: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    composite: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    assessment: { bg: 'bg-amber-100', fg: 'text-amber-800' },
    review: { bg: 'bg-grayscale-100', fg: 'text-grayscale-600' },
    external: { bg: 'bg-grayscale-100', fg: 'text-grayscale-600' },
};

const KIND_ICON: Record<PolicyKind, string> = {
    practice: repeatOutline,
    artifact: documentTextOutline,
    composite: gitBranchOutline,
    assessment: ribbonOutline,
    review: refreshOutline,
    external: openOutline,
};

/**
 * Pluralized copy for the collection title. If members all share a
 * credential type we use that ("Earn 10 Badges"); else we fall back to
 * the policy kind ("Complete 10 Practices").
 */
const KIND_PLURAL: Record<PolicyKind, string> = {
    practice: 'Practices',
    artifact: 'Artifacts',
    composite: 'Chapters',
    assessment: 'Assessments',
    review: 'Reviews',
    external: 'Steps',
};

const KIND_VERB: Record<PolicyKind, string> = {
    practice: 'Complete',
    artifact: 'Submit',
    composite: 'Finish',
    assessment: 'Pass',
    review: 'Review',
    external: 'Complete',
};

/**
 * Short credential-type plural for the collection title. Mirrors the
 * single-card `credentialTypeChip` in MapNode, but returns plurals.
 */
const credentialTypePlural = (achievementType: string | undefined): string => {
    if (!achievementType) return 'Credentials';
    const t = achievementType.toLowerCase();
    if (t.includes('badge')) return 'Badges';
    if (t.includes('certificate') || t.includes('certification')) return 'Certificates';
    if (t.includes('diploma')) return 'Diplomas';
    if (t.includes('degree')) return 'Degrees';
    if (t.includes('license') || t.includes('licence')) return 'Licenses';
    if (t.includes('microcredential') || t.includes('micro-credential')) {
        return 'Micro-credentials';
    }
    return 'Credentials';
};

/**
 * Derive the collection's title label. If every member carries a
 * `credentialProjection` of the same achievementType we use the
 * pluralized credential noun ("Badges"); otherwise we fall back to
 * the shared kind plural ("Practices").
 */
const deriveTitle = (members: PathwayNode[], kind: PolicyKind): string => {
    const types = new Set(
        members
            .map(m => m.credentialProjection?.achievementType)
            .filter((t): t is string => Boolean(t)),
    );

    const verb = kind === 'assessment' ? 'Pass' : 'Earn';

    if (types.size === 1 && members.every(m => m.credentialProjection)) {
        const label = credentialTypePlural([...types][0]);
        return `${verb} ${members.length} ${label}`;
    }

    return `${KIND_VERB[kind]} ${members.length} ${KIND_PLURAL[kind]}`;
};

export type CollectionMapNodeData = {
    group: CollectionGroup;
    members: PathwayNode[];
    progress: CollectionProgress;
    inFocus: boolean;
    /** Toggles this group back into its individual members on the Map. */
    onExpand: (groupId: string) => void;
} & Record<string, unknown>;

/**
 * Stacked avatar: up to 3 member avatars overlapping, left-to-right,
 * with a trailing "+N" chip when there are more members than slots.
 *
 * Each slot prefers the member's `credentialProjection.image`; falls
 * back to a kind-tinted glyph bubble — matching NodeAvatar's fallback
 * chain in MapNode so the visual vocabulary is consistent.
 */
const StackedAvatar: React.FC<{
    members: PathwayNode[];
    kind: PolicyKind;
}> = ({ members, kind }) => {
    const MAX_SLOTS = 3;
    const visible = members.slice(0, MAX_SLOTS);
    const overflow = Math.max(0, members.length - visible.length);
    const tone = KIND_TONE[kind];
    const glyph = KIND_ICON[kind];

    return (
        <span
            aria-hidden
            className="shrink-0 relative h-8 flex items-center"
            // Width = first avatar (32) + overlap increments (20 × N).
            // Trailing "+N" chip sits in its own slot after the stack.
            style={{ width: 32 + (visible.length - 1) * 20 + (overflow > 0 ? 26 : 0) }}
        >
            {visible.map((member, i) => {
                const image = member.credentialProjection?.image;

                return (
                    <span
                        key={member.id}
                        className="absolute top-0 w-8 h-8 rounded-full ring-2 ring-white bg-white shadow-sm overflow-hidden flex items-center justify-center"
                        style={{ left: i * 20, zIndex: visible.length - i }}
                    >
                        {image ? (
                            <img
                                src={image}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                draggable={false}
                            />
                        ) : (
                            <span
                                className={`w-full h-full flex items-center justify-center ${tone.bg} ${tone.fg}`}
                            >
                                <IonIcon icon={glyph} className="text-base" />
                            </span>
                        )}
                    </span>
                );
            })}

            {overflow > 0 && (
                <span
                    className="absolute top-0 h-8 px-1.5 rounded-full ring-2 ring-white bg-grayscale-100 text-grayscale-600 text-[10px] font-semibold flex items-center justify-center shadow-sm"
                    style={{ left: visible.length * 20, zIndex: 0 }}
                >
                    +{overflow}
                </span>
            )}
        </span>
    );
};

const CollectionMapNode: React.FC<{ data: CollectionMapNodeData }> = ({ data }) => {
    const { group, members, progress, inFocus, onExpand } = data;

    const title = deriveTitle(members, group.policyKind);
    const pct = Math.round(progress.fraction * 100);
    const allDone = progress.completed === progress.total && progress.total > 0;

    // Status-ish card tint mirrors MapNode so the collection card sits
    // visually with its neighbors:
    //   - complete  → emerald wash
    //   - some-done → amber wash
    //   - none      → plain white
    const cardTint = allDone
        ? 'bg-emerald-50/70 border-emerald-100'
        : progress.completed > 0
            ? 'bg-amber-50/60 border-amber-100'
            : 'bg-white border-grayscale-200';

    return (
        <motion.div
            className="relative font-poppins"
            style={{ width: 200 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: inFocus ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <Handle
                type="target"
                position={Position.Bottom}
                className="!bg-grayscale-300 !border-0 !w-1.5 !h-1.5 !opacity-60"
            />

            {/*
                Whole card is a button: clicking it expands the group
                back into its member nodes on the canvas. We wrap the
                visual container in a <button> (not the outer motion
                div) so React Flow's own click detection still sees
                the node; the button handles keyboard focus + Enter.
            */}
            <button
                type="button"
                onClick={event => {
                    // Don't bubble: React Flow's onNodeClick would
                    // otherwise also re-focus the collection; we want
                    // the explicit "expand" action to be the whole
                    // click gesture.
                    event.stopPropagation();
                    onExpand(group.id);
                }}
                className={`
                    w-full text-left
                    relative p-3 rounded-2xl border backdrop-blur-[1px]
                    transition-all duration-300 ease-out
                    hover:-translate-y-0.5 hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:ring-offset-2 focus:ring-offset-grayscale-10
                    ${cardTint}
                    ${inFocus ? 'shadow-sm' : ''}
                `}
                aria-label={`${title}, ${progress.completed} of ${progress.total} complete. Expand to see members.`}
            >
                {/*
                    Collection marker — top-left pill that tells the
                    learner "this isn't one card, it's a group". Uses
                    the `layers` glyph to match the copy ("collection")
                    and distinguish from the `git-branch` composite
                    pill used by nested-pathway nodes.
                */}
                <span
                    aria-hidden
                    className="absolute -top-1.5 -left-1.5 h-5 px-1.5
                               inline-flex items-center gap-1
                               rounded-full border
                               bg-white border-emerald-200 text-emerald-700
                               text-[10px] font-medium shadow-sm"
                >
                    <IonIcon icon={layersOutline} className="text-[11px]" />
                    <span>
                        {progress.completed}/{progress.total}
                    </span>
                </span>

                {allDone && (
                    <span
                        aria-hidden
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] leading-[20px] text-center font-bold shadow-sm"
                    >
                        ✓
                    </span>
                )}

                <div className="flex items-start gap-2.5">
                    <StackedAvatar members={members} kind={group.policyKind} />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2 pr-4">
                            {title}
                        </p>

                        {/*
                            Progress bar — same visual language as the
                            composite progress bar on MapNode so the
                            two fan-in affordances (one nested, one
                            aggregate) read as the same thought.
                        */}
                        <div
                            className="mt-1.5 h-1 w-full rounded-full bg-grayscale-100 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={progress.completed}
                            aria-valuemin={0}
                            aria-valuemax={progress.total}
                        >
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                                style={{ width: `${pct}%` }}
                            />
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-grayscale-500">
                                Collection
                            </span>

                            <span
                                aria-hidden
                                className="shrink-0 text-grayscale-300 text-[10px]"
                            >
                                ·
                            </span>

                            <span className="text-[10px] font-medium uppercase tracking-wide text-grayscale-500 truncate">
                                {allDone ? 'Done' : `${progress.completed}/${progress.total} earned`}
                            </span>
                        </div>
                    </div>

                    <IonIcon
                        aria-hidden
                        icon={chevronForwardOutline}
                        className="shrink-0 mt-1 text-grayscale-400"
                    />
                </div>
            </button>

            <Handle
                type="source"
                position={Position.Top}
                className="!bg-grayscale-300 !border-0 !w-1.5 !h-1.5 !opacity-60"
            />
        </motion.div>
    );
};

export default CollectionMapNode;
