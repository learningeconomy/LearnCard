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
    schoolOutline,
    sparklesOutline,
    starOutline,
} from 'ionicons/icons';

import type { ActionDescriptor, Policy, Termination } from '../../types';

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

    /**
     * Optional disambiguation via action kind. When two templates share
     * a policy+termination pair but differ on the action (e.g. "Earn a
     * credential" with an `external-url` landing page vs. "AI tutor
     * session" with an `ai-session` launcher), the action kind is the
     * tie-breaker. The picker only considers this after
     * `matchPolicyKinds` and `matchTerminationKinds` have narrowed the
     * field.
     */
    matchActionKinds?: ReadonlyArray<ActionDescriptor['kind']>;

    /** Starting policy for this template. Pure. */
    policy: () => Policy;

    /** Starting termination for this template. Pure. */
    termination: () => Termination;

    /**
     * Optional starting action for this template. Pure. Returning
     * `null` (or omitting the field) leaves the node's `action`
     * untouched — use this for templates that don't care about the
     * launch destination (the author configures it later in
     * `ActionSection`).
     *
     * Templates that DO care (AI tutor session, earn-a-credential
     * pointing at an App Store listing) pre-seed the action here so
     * the node lands in a useful shape with a single click.
     */
    action?: () => ActionDescriptor | null;
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

    /**
     * Earn a credential — the reactor-driven completion shape. Pairs
     * an `artifact` policy placeholder with a `requirement-satisfied`
     * termination defaulting to a `credential-type` match. Authors
     * fill in the expected VC `type` (and optionally an App Store
     * listing via `ActionSection`) to finish wiring the node.
     *
     * No action is seeded — the learner might earn this credential
     * on an external issuer page, via an App Store listing, or off-
     * platform entirely, and we'd rather leave `action` absent than
     * pre-commit to the wrong destination. `matchPolicyKinds:
     * ['artifact']` gives this template tie-breaker disambiguation
     * against the 'submit' and 'endorse' templates via
     * `matchTerminationKinds` — it's the first (and currently only)
     * artifact-policy template that pairs with requirement-satisfied.
     */
    {
        id: 'earn',
        label: 'Earn a credential',
        icon: ribbonOutline,
        blurb: 'Done when a matching credential lands in the wallet.',
        matchPolicyKinds: ['artifact'],
        matchTerminationKinds: ['requirement-satisfied'],
        policy: () => ({ kind: 'artifact', prompt: '', expectedArtifact: 'link' }),
        termination: () => ({
            kind: 'requirement-satisfied',
            requirement: { kind: 'credential-type', type: '' },
            minTrustTier: 'trusted',
        }),
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

    /**
     * AI tutor session — learner opens LearnCard's first-party AI
     * tutor on a specific topic; the node auto-completes when the
     * session ends.
     *
     * Unique among templates because it **seeds all three of policy,
     * termination, and action**. The `topicUri` on the action and
     * the termination MUST match for the reactor to fire — we
     * initialise both to the same empty string so the author types
     * it once and both sides stay in lock-step until explicitly
     * diverged. `ActionSection` surfaces a callout if they drift.
     *
     * `policy` is `artifact` as a neutral placeholder — AI sessions
     * don't fit the existing policy kinds cleanly (they're not
     * "submit an artifact", not "pass an assessment", not an MCP
     * tool), and introducing a new `ai-session` policy kind would
     * duplicate the action's discriminator. The placeholder is
     * harmless: Today / NodeDetail dispatch on `action`, not policy,
     * once an action is set.
     */
    {
        id: 'ai-tutor',
        label: 'AI tutor session',
        icon: sparklesOutline,
        blurb: 'Learner completes a LearnCard AI tutor session on a topic.',
        matchPolicyKinds: ['artifact'],
        matchTerminationKinds: ['session-completed'],
        matchActionKinds: ['ai-session'],
        policy: () => ({ kind: 'artifact', prompt: '', expectedArtifact: 'text' }),
        termination: () => ({ kind: 'session-completed', topicUri: '' }),
        action: () => ({ kind: 'ai-session', topicUri: '' }),
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
 * kind, then by action kind. Returns `null` if no template matches
 * (shouldn't happen in practice, but defensive).
 *
 * Used by the picker to highlight the "current" card without
 * storing a template id on the node.
 */
export const matchTemplate = (
    policy: Policy,
    termination: Termination,
    action?: ActionDescriptor | null,
): NodeTemplate | null => {
    const candidates = NODE_TEMPLATES.filter(t =>
        t.matchPolicyKinds.includes(policy.kind),
    );

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Narrow by termination kind where declared.
    const terminationMatches = candidates.filter(t =>
        t.matchTerminationKinds?.includes(termination.kind),
    );

    const afterTermination =
        terminationMatches.length > 0 ? terminationMatches : candidates;

    if (afterTermination.length === 1) return afterTermination[0];

    // Secondary disambiguation by action kind. Only kicks in when
    // two templates share a policy+termination pair (e.g. a future
    // external-URL-earn variant competing with app-listing-earn).
    if (action) {
        const actionMatches = afterTermination.filter(t =>
            t.matchActionKinds?.includes(action.kind),
        );

        if (actionMatches.length > 0) return actionMatches[0];
    }

    return afterTermination[0];
};
