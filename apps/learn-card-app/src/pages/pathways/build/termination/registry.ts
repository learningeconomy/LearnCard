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
import selfAttestSpec from './SelfAttestSpec';
import type { TerminationKindSpec } from './types';

export const TERMINATION_KINDS = {
    'artifact-count': artifactCountSpec,
    endorsement: endorsementSpec,
    'self-attest': selfAttestSpec,
    'assessment-score': assessmentScoreSpec,
    composite: compositeSpec,
    'pathway-completed': pathwayCompletedSpec,
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
 * frequently each ends a stage in practice: attach things (most
 * concrete), then endorsements, self-attest, score, and composite
 * (power-user). `pathway-completed` is excluded — managed by the
 * composite invariant, not author-picked.
 */
export const SELECTABLE_TERMINATION_KIND_LIST: readonly AnyTerminationKindSpec[] = [
    artifactCountSpec,
    endorsementSpec,
    selfAttestSpec,
    assessmentScoreSpec,
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
];
