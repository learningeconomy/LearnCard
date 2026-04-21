/**
 * presentation — pure helpers that shape the TodayMode surface.
 *
 * Kept separate from the React components so the pieces that actually
 * encode a choice (how we name a time of day, what "remaining" means on
 * a DAG, how a policy kind reads to a human) can be unit-tested and
 * replaced without touching any rendering code.
 */

import type { EarnUrlSource, Pathway, PathwayNode, Policy } from '../types';

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

export type Greeting =
    | 'Good morning'
    | 'Good afternoon'
    | 'Good evening'
    | 'Still here';

/**
 * Deterministic greeting keyed off the *local* hour of `now`.
 *
 *   05:00 – 11:59  → "Good morning"
 *   12:00 – 16:59  → "Good afternoon"
 *   17:00 – 21:59  → "Good evening"
 *   22:00 – 04:59  → "Still here"   (a quiet acknowledgement, not a scold)
 *
 * The late-night phrase is intentional — punishing the learner with
 * "it's 2am, go to bed" breaks trust; a neutral phrase keeps the page
 * from feeling absent at that hour.
 */
export const getGreeting = (now: Date): Greeting => {
    const h = now.getHours();

    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';

    return 'Still here';
};

// ---------------------------------------------------------------------------
// Journey progress
// ---------------------------------------------------------------------------

export interface Journey {
    /** Nodes the learner has finished. */
    completed: number;
    /** Every node in the pathway. */
    total: number;
    /** Nodes still ahead (not completed and not skipped). */
    remaining: number;
}

/**
 * Count-based summary of where the learner is on a pathway.
 *
 * Deliberately avoids saying "Step N of M" — a pathway is a DAG, not a
 * queue, and that phrasing would lie on branching pathways. `completed`
 * and `remaining` are defensible on any shape.
 *
 * `skipped` nodes are not counted as either completed *or* remaining —
 * they're set aside. `total` still reflects the full node count so the
 * learner can read "3 done · 2 to go" on a 7-node pathway where 2 were
 * skipped.
 */
export const buildJourney = (pathway: Pathway): Journey => {
    const total = pathway.nodes.length;

    let completed = 0;
    let remaining = 0;

    for (const node of pathway.nodes) {
        if (node.progress.status === 'completed') {
            completed += 1;
        } else if (node.progress.status !== 'skipped') {
            remaining += 1;
        }
    }

    return { completed, total, remaining };
};

/**
 * Short human description of a journey. The shape of the sentence shifts
 * with the learner's position so Today doesn't always read the same way:
 *
 *   - Fresh start  → "First step"
 *   - Mid-pathway  → "2 done · 5 to go"
 *   - Near the end → "Last one"
 *   - Final step   → "One more"
 *   - Complete     → "All done"
 */
export const journeyLabel = (journey: Journey): string => {
    const { completed, remaining } = journey;

    if (remaining === 0 && completed > 0) return 'All done';
    if (remaining === 1) return 'Last one';
    if (completed === 0) return 'First step';

    return `${completed} done · ${remaining} to go`;
};

// ---------------------------------------------------------------------------
// Policy labels
// ---------------------------------------------------------------------------

const POLICY_LABELS: Record<Policy['kind'], string> = {
    practice: 'Practice',
    review: 'Recall',
    assessment: 'Check',
    artifact: 'Make',
    external: 'External',
    // Composite nodes point at another pathway. Today mode surfaces
    // them as "Nested" so the chip reads honestly — the work itself
    // lives inside the referenced pathway, not in this node.
    composite: 'Nested',
};

/**
 * One-word label for the kind of work this node asks of the learner.
 * Used as a small header chip above the title so they know what they
 * are walking into (making vs. reviewing vs. being assessed).
 */
export const policyLabel = (kind: Policy['kind']): string => POLICY_LABELS[kind];

const POLICY_CALLS: Record<Policy['kind'], string> = {
    practice: 'Log a practice session',
    review: 'Start the review',
    assessment: 'Start the assessment',
    artifact: 'Work on the artifact',
    external: 'Open the external tool',
    // Composite fallback CTA — the final copy is resolved in
    // `resolvePolicyCallToAction` from the referenced pathway's
    // title ("Open Algebra I"). This generic stays honest when the
    // nested pathway hasn't loaded yet.
    composite: 'Open nested pathway',
};

/**
 * Verb-first call-to-action used on the Today hero button. Moved out of
 * `NextActionCard` so the same copy stays consistent if the CTA ever
 * appears elsewhere (e.g. a widget).
 */
export const policyCallToAction = (kind: Policy['kind']): string => POLICY_CALLS[kind];

/**
 * Resolve the CTA label for a specific policy, threading in MCP context
 * when the policy is `external`. A generic "Open the external tool" is
 * fine when we don't know the server (still-unresolved registry) but
 * terrible when we do — the learner should see "Open in Figma" /
 * "Open in Notion" / etc so the action sets clear expectations.
 *
 * The `mcpLabel` comes from `mcpRegistryStore.servers[serverId].label`
 * at the call site. We keep this module store-free so it stays
 * unit-testable.
 */
export const resolvePolicyCallToAction = (
    policy: Policy,
    mcpLabel?: string | null,
): string => {
    if (policy.kind === 'external' && mcpLabel) {
        return `Open in ${mcpLabel}`;
    }

    return policyCallToAction(policy.kind);
};

// ---------------------------------------------------------------------------
// Node-aware call-to-action
// ---------------------------------------------------------------------------

/**
 * Map a CTDL-style `achievementType` string to a short credential noun
 * we can use in CTA copy. The matching is intentionally forgiving:
 * real-world registries mix in values like `"Badge"`, `"DigitalBadge"`,
 * `"ceterms:Badge"`, `"Certification"`, etc.
 *
 * Returns `null` when nothing matches — callers should fall back to
 * the generic "credential" noun so we never invent a bad label.
 */
const credentialNoun = (achievementType: string | undefined): string | null => {
    if (!achievementType) return null;

    const t = achievementType.toLowerCase();

    if (t.includes('badge')) return 'badge';
    if (t.includes('certificate') || t.includes('certification')) return 'certificate';
    if (t.includes('diploma')) return 'diploma';
    if (t.includes('degree')) return 'degree';
    if (t.includes('license') || t.includes('licence')) return 'license';
    if (t.includes('microcredential') || t.includes('micro-credential')) {
        return 'micro-credential';
    }

    return null;
};

/**
 * CTA label for a full `PathwayNode`.
 *
 * Smarter than `resolvePolicyCallToAction` because it can see both the
 * policy *and* the termination *and* the credential projection — which
 * is exactly where a honest label comes from for CTDL-imported nodes.
 *
 * The generic `"Work on the artifact"` copy is a leaky abstraction
 * (artifact is our internal policy kind, not the learner's task). For
 * a CredentialComponent import the same node is really an "Earn this
 * badge" / "Earn this certificate" moment, and for assessment nodes
 * it's "Take the assessment". We surface that whenever we can, and
 * fall back to the policy-level copy only when the node has no better
 * signal.
 *
 * Precedence (highest wins):
 *   1. `external` + known MCP label → "Open in {Figma|Notion|…}"
 *   2. `credentialProjection` + endorsement-style termination
 *      → "Earn this {badge|certificate|credential}"
 *   3. termination kind → verb that matches what the learner actually
 *      submits ("Submit your work", "Take the assessment", "Mark
 *      complete", "Record practice")
 *   4. policy kind fallback (existing `resolvePolicyCallToAction`)
 *
 * Composite is intentionally *not* special-cased here; the caller that
 * has a resolved child pathway can override with "Open {child title}".
 * Doing it in this module would require the full pathway map.
 */
export const resolveNodeCallToAction = (
    node: PathwayNode,
    mcpLabel?: string | null,
): string => {
    const { policy, termination } = node.stage;

    // 1. MCP wins when present — the most specific label.
    if (policy.kind === 'external' && mcpLabel) {
        return `Open in ${mcpLabel}`;
    }

    // 2. Credential-aware copy. The CTDL import populates
    //    `credentialProjection` on every CredentialComponent, so this
    //    branch covers the entire IMA-style pathway.
    const projection = node.credentialProjection;

    if (projection) {
        const noun = credentialNoun(projection.achievementType) ?? 'credential';

        // Source-aware degrade: when the earn link is just a landing
        // page (`subjectWebpage`) we refuse to promise "Earn" — the
        // click doesn't award anything. Only `sourceData` is
        // CTDL-guaranteed to be the "go earn it" URL, so we keep the
        // "Earn this X" copy only in that case (or when there's no
        // external link at all and the work happens in-app).
        if (projection.earnUrlSource === 'subjectWebpage') return 'Learn more';

        // Endorsement terminations read as "earn the thing" — the
        // learner is working toward an outside-issued artifact.
        if (termination.kind === 'endorsement') {
            return `Earn this ${noun}`;
        }

        // An assessment that awards a credential reads as "take the
        // assessment" — that's the verb that gets them there.
        if (
            termination.kind === 'assessment-score' ||
            policy.kind === 'assessment'
        ) {
            return 'Take the assessment';
        }

        // Fallthrough for credential-bearing nodes: the honest verb
        // is submission (upload proof, attach link, etc.).
        if (
            termination.kind === 'artifact-count' ||
            policy.kind === 'artifact'
        ) {
            return 'Submit your proof';
        }
    }

    // 3. Termination-kind-aware fallback (no credential projection).
    //    Narrow to the terminations whose verbiage is sharper than the
    //    policy-level copy; everything else falls through to policy.
    switch (termination.kind) {
        case 'self-attest':
            return 'Mark complete';

        case 'assessment-score':
            return 'Take the assessment';

        case 'artifact-count':
            return 'Add evidence';

        // endorsement / pathway-completed / composite fall through to
        // the policy layer so composite's pathway-aware copy and
        // endorsement's nudge still read correctly.
        default:
            break;
    }

    // 4. Existing policy-kind fallback.
    return resolvePolicyCallToAction(policy, mcpLabel);
};

// ---------------------------------------------------------------------------
// Earn-link resolver (external target for a node)
// ---------------------------------------------------------------------------

export interface NodeEarnLink {
    /** Resolvable `http(s)` URL where the learner can act on this node. */
    href: string;
    /** Which CTDL field this URL came from; callers use it to hedge copy. */
    source: EarnUrlSource;
}

/**
 * Return the external earn-link for a node when one exists, or `null`.
 *
 * Kept separate from `resolveNodeCallToAction` so the two concerns —
 * *what to say* vs *where to go* — stay orthogonal. CTA surfaces can
 * combine them: render an `<a href>` when this returns a link, render
 * a plain `<button>` otherwise. The label stays the same resolver
 * output either way; only its target changes.
 *
 * Today this reads straight off `node.credentialProjection`, populated
 * by the CTDL importer from `ceterms:sourceData` / `subjectWebpage` /
 * `proxyFor`. Author-created nodes get `null` unless they grow their
 * own equivalent field.
 */
export const getNodeEarnLink = (node: PathwayNode): NodeEarnLink | null => {
    const projection = node.credentialProjection;

    if (!projection?.earnUrl || !projection.earnUrlSource) return null;

    return { href: projection.earnUrl, source: projection.earnUrlSource };
};

// ---------------------------------------------------------------------------
// Identity framing
// ---------------------------------------------------------------------------

/**
 * Mapping of common goal-verbs to their gerund (-ing) form. Used to turn
 * a goal like "write a novel" into "someone writing a novel" — the
 * past-progressive identity phrasing the architecture calls out as
 * load-bearing (§10, synthesis doc's "habit-identity" research).
 *
 * The list is intentionally small. If a verb isn't here we fall back to
 * rendering the goal verbatim rather than hand-rolling fragile English.
 */
const GERUND_MAP: Record<string, string> = {
    write: 'writing',
    build: 'building',
    ship: 'shipping',
    learn: 'learning',
    get: 'getting',
    become: 'becoming',
    make: 'making',
    create: 'creating',
    master: 'mastering',
    explore: 'exploring',
    practice: 'practicing',
    study: 'studying',
    read: 'reading',
    grow: 'growing',
    design: 'designing',
    teach: 'teaching',
    run: 'running',
    start: 'starting',
    publish: 'publishing',
    finish: 'finishing',
    change: 'changing',
    earn: 'earning',
    land: 'landing',
};

const IDENTITY_PREFIX = /^(a |an |the |someone |the next )/i;

/**
 * Transform a pathway's `goal` into an identity-tense phrase suitable
 * for the "You are becoming __" framing on Today.
 *
 *   "write a novel"          → "someone writing a novel"
 *   "ship one artifact"      → "someone shipping one artifact"
 *   "a better writer"        → "a better writer"          (already identity)
 *   "someone who writes"     → "someone who writes"       (already identity)
 *   "the next CEO"           → "the next CEO"             (already identity)
 *   "foo bar baz"            → "foo bar baz"              (can't transform)
 *   ""                       → ""
 *
 * The goal here is *honesty* over cleverness: if we can't produce a
 * grammatical identity phrase, we render the goal verbatim rather than
 * generating something grating.
 */
export const identityPhrase = (goal: string): string => {
    const trimmed = goal.trim();

    if (!trimmed) return '';

    // Already identity-phrased — leave it alone.
    if (IDENTITY_PREFIX.test(trimmed)) return trimmed;

    const [first, ...rest] = trimmed.split(/\s+/);
    const gerund = GERUND_MAP[first.toLowerCase()];

    if (!gerund) return trimmed;

    const suffix = rest.length > 0 ? ` ${rest.join(' ')}` : '';

    return `someone ${gerund}${suffix}`;
};
