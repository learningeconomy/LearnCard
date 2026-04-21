/**
 * Node templates — starter shapes for common step archetypes.
 *
 * Each template materialises a policy + termination pair that makes
 * sense together. "Get endorsed" = artifact policy + endorsement
 * termination; "Practice regularly" = practice policy + artifact-count
 * termination; etc.
 *
 * Templates are **applied once**, at pick-time. There's no "current
 * template" tracking — after application, the author can diverge
 * the policy and termination independently via `WhatSection` and
 * `DoneSection`. The UI surfaces which template *best matches* the
 * current policy kind (first match wins), so the picker highlights
 * a card but doesn't claim the user is "on" that template.
 *
 * Adding a new template:
 *   1. Add a row to `NODE_TEMPLATES` below.
 *   2. Optionally add matching policy/termination specs if the kinds
 *      are new.
 *   3. Tests in `registry.test.ts` auto-cover Zod validity.
 *
 * Note on `nest`: its policy and termination intentionally include
 * empty `pathwayRef` placeholders. Zod rejects that shape, but
 * committing the in-flight state lets the author see their work as
 * they pick a target pathway. Publish-time validation catches the
 * incomplete ref separately; see `CompositeSpec` docs.
 */

import {
    cloudUploadOutline,
    constructOutline,
    gitBranchOutline,
    refreshOutline,
    repeatOutline,
    ribbonOutline,
    starOutline,
} from 'ionicons/icons';

import type { Policy, Termination } from '../../types';

export interface NodeTemplate {
    /** Stable id used for React keys and test assertions. */
    id: string;

    /** Short, jargon-free label. Matches the Policy spec's label where natural. */
    label: string;

    /** Ionicon name for the card. */
    icon: string;

    /** One-sentence description shown under the label on the card. */
    blurb: string;

    /**
     * Which policy kinds this template "matches". The picker highlights
     * the first template whose `matchPolicyKinds` contains the current
     * policy kind. A single kind can legitimately be the signature of
     * two templates (e.g. both `submit` and `endorse` start from a
     * `kind: 'artifact'` policy but differ in their termination) — in
     * that case we disambiguate by also checking `matchTerminationKinds`.
     */
    matchPolicyKinds: ReadonlyArray<Policy['kind']>;

    /** Optional additional disambiguation via termination kind. */
    matchTerminationKinds?: ReadonlyArray<Termination['kind']>;

    /** Starting policy for this template. Pure. */
    policy: () => Policy;

    /** Starting termination for this template. Pure. */
    termination: () => Termination;
}

export const NODE_TEMPLATES: readonly NodeTemplate[] = [
    {
        id: 'submit',
        label: 'Submit something',
        icon: cloudUploadOutline,
        blurb: 'One artifact from the learner — a link, a file, a note.',
        matchPolicyKinds: ['artifact'],
        matchTerminationKinds: ['artifact-count', 'self-attest'],
        policy: () => ({ kind: 'artifact', prompt: '', expectedArtifact: 'link' }),
        termination: () => ({ kind: 'artifact-count', count: 1, artifactType: 'link' }),
    },

    {
        id: 'endorse',
        label: 'Get endorsed',
        icon: starOutline,
        blurb: 'Learner submits evidence and collects endorsements.',
        matchPolicyKinds: ['artifact'],
        matchTerminationKinds: ['endorsement'],
        policy: () => ({ kind: 'artifact', prompt: '', expectedArtifact: 'link' }),
        termination: () => ({ kind: 'endorsement', minEndorsers: 1 }),
    },

    {
        id: 'practice',
        label: 'Practice regularly',
        icon: repeatOutline,
        blurb: 'Repeat work on a daily or weekly rhythm.',
        matchPolicyKinds: ['practice'],
        policy: () => ({
            kind: 'practice',
            cadence: { frequency: 'daily', perPeriod: 1 },
            artifactTypes: ['text'],
        }),
        termination: () => ({ kind: 'artifact-count', count: 7, artifactType: 'text' }),
    },

    {
        id: 'review',
        label: 'Review over time',
        icon: refreshOutline,
        blurb: 'Spaced-repetition reviews for recall and upkeep.',
        matchPolicyKinds: ['review'],
        policy: () => ({ kind: 'review', fsrs: { stability: 0, difficulty: 0 } }),
        termination: () => ({ kind: 'self-attest', prompt: 'I reviewed.' }),
    },

    {
        id: 'assess',
        label: 'Pass a check',
        icon: ribbonOutline,
        blurb: 'Score against a rubric of criteria.',
        matchPolicyKinds: ['assessment'],
        policy: () => ({
            kind: 'assessment',
            rubric: { criteria: [{ id: 'c1', description: '', weight: 1 }] },
        }),
        termination: () => ({ kind: 'assessment-score', min: 70 }),
    },

    {
        id: 'tool',
        label: 'Use a tool',
        icon: constructOutline,
        blurb: 'Hand off to an external tool via MCP.',
        matchPolicyKinds: ['external'],
        policy: () => ({ kind: 'external', mcp: { serverId: '', toolName: '' } }),
        termination: () => ({ kind: 'artifact-count', count: 1, artifactType: 'other' }),
    },

    {
        id: 'nest',
        label: 'Complete a nested pathway',
        icon: gitBranchOutline,
        blurb: 'Gate progress on finishing another pathway.',
        matchPolicyKinds: ['composite'],
        policy: () =>
            ({
                kind: 'composite',
                pathwayRef: '',
                renderStyle: 'inline-expandable',
            }) as Policy,
        termination: () =>
            ({
                kind: 'pathway-completed',
                pathwayRef: '',
            }) as Termination,
    },
];

/**
 * Pick the template whose `matchPolicyKinds` contains the current
 * policy kind — and, when available, disambiguates by termination
 * kind. Returns `null` if no template matches (shouldn't happen in
 * practice, but defensive).
 *
 * Used by the picker to highlight the "current" card without
 * storing a template id on the node.
 */
export const matchTemplate = (
    policy: Policy,
    termination: Termination,
): NodeTemplate | null => {
    const candidates = NODE_TEMPLATES.filter(t =>
        t.matchPolicyKinds.includes(policy.kind),
    );

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Disambiguate by termination kind where declared.
    const tieBroken = candidates.find(t =>
        t.matchTerminationKinds?.includes(termination.kind),
    );

    return tieBroken ?? candidates[0];
};
