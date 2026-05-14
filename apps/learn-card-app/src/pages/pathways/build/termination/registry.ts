/**
 * Termination registry.
 *
 * Single source of truth for every Termination kind. Mirrors the
 * shape of `policy/registry.ts` deliberately — same distributive
 * union pattern for the iterable list, same `satisfies` on the
 * keyed map, same one-file-per-kind layout.
 *
 * `pathway-completed` is in the map (to keep the registry total over
 * `Termination['kind']`) but flagged `selectable: false`. UI surfaces
 * that enumerate user-pickable kinds filter on that flag.
 */

import type { Termination } from '../../types';

import artifactCountSpec from './ArtifactCountSpec';
import assessmentScoreSpec from './AssessmentScoreSpec';
import compositeSpec from './CompositeSpec';
import endorsementSpec from './EndorsementSpec';
import pathwayCompletedSpec from './PathwayCompletedSpec';
import requirementSatisfiedSpec from './RequirementSatisfiedSpec';
import selfAttestSpec from './SelfAttestSpec';
import sessionCompletedSpec from './SessionCompletedSpec';
import type { TerminationKindSpec } from './types';

export const TERMINATION_KINDS = {
    'artifact-count': artifactCountSpec,
    endorsement: endorsementSpec,
    'self-attest': selfAttestSpec,
    'assessment-score': assessmentScoreSpec,
    composite: compositeSpec,
    'pathway-completed': pathwayCompletedSpec,
    'requirement-satisfied': requirementSatisfiedSpec,
    'session-completed': sessionCompletedSpec,
} satisfies {
    [K in Termination['kind']]: TerminationKindSpec<K>;
};

/**
 * See `AnyPolicyKindSpec` for why this shape — `TerminationKindSpec<K>`
 * is contravariant in `K` via its Editor, so we can't widen the type
 * parameter directly.
 */
export type AnyTerminationKindSpec = {
    [K in Termination['kind']]: TerminationKindSpec<K>;
}[Termination['kind']];

/**
 * Ordered list of author-selectable kinds. Order reflects how
 * frequently each ends a stage in practice:
 *
 *   1. `artifact-count` — attach-something, the most concrete.
 *   2. `requirement-satisfied` — earn-a-credential (reactor-driven).
 *      High up because the reactor+binder pipeline makes this the
 *      default "done when the learner earns this" termination and
 *      every CTDL-imported pathway node uses it.
 *   3. `endorsement` — receive vouches.
 *   4. `self-attest` — learner marks done (weakest; late in list).
 *   5. `assessment-score` — numeric threshold.
 *   6. `session-completed` — AI tutor session ended. Pairs with an
 *      `ai-session` action on the same node (see templates).
 *   7. `composite` — power-user AND/OR over the above.
 *
 * `pathway-completed` is still excluded — managed by the composite
 * policy invariant, not author-picked.
 */
export const SELECTABLE_TERMINATION_KIND_LIST: readonly AnyTerminationKindSpec[] = [
    artifactCountSpec,
    requirementSatisfiedSpec,
    endorsementSpec,
    selfAttestSpec,
    assessmentScoreSpec,
    sessionCompletedSpec,
    compositeSpec,
];

/** Full list (includes non-selectable). Used by registry tests. */
export const TERMINATION_KIND_LIST: readonly AnyTerminationKindSpec[] = [
    artifactCountSpec,
    endorsementSpec,
    selfAttestSpec,
    assessmentScoreSpec,
    compositeSpec,
    pathwayCompletedSpec,
    requirementSatisfiedSpec,
    sessionCompletedSpec,
];
