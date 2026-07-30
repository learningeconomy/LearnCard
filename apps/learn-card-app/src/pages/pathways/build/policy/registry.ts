/**
 * Policy registry.
 *
 * Single source of truth for every Policy kind. Consumers:
 *
 *   - `PolicyEditor` dispatches on `value.kind` to render
 *     `POLICY_KINDS[kind].Editor`.
 *   - `summarizePolicy` facade delegates to `POLICY_KINDS[kind].summarize`.
 *   - `TemplatePicker` reads `label` / `icon` / `blurb` / `default` when
 *     materialising new nodes.
 *   - Any registry-driven test reads `POLICY_KIND_LIST` to iterate
 *     every kind exactly once.
 *
 * Adding a new Policy variant:
 *   1. Declare it in `PolicySchema` (types/pathway.ts).
 *   2. Add a `FooSpec.tsx` in this folder.
 *   3. Register it below.
 *   4. (Optional) add a template in `templates/registry.ts`.
 *
 * `satisfies` narrows each entry to its specific `PolicyKindSpec<K>`,
 * so consumers that dispatch on `value.kind` get a correctly-typed
 * editor with no runtime casts.
 */

import type { Policy } from '../../types';

import artifactSpec from './ArtifactSpec';
import assessmentSpec from './AssessmentSpec';
import compositeSpec from './CompositeSpec';
import externalSpec from './ExternalSpec';
import practiceSpec from './PracticeSpec';
import reviewSpec from './ReviewSpec';
import type { PolicyKindSpec } from './types';

export const POLICY_KINDS = {
    artifact: artifactSpec,
    practice: practiceSpec,
    review: reviewSpec,
    assessment: assessmentSpec,
    external: externalSpec,
    composite: compositeSpec,
} satisfies {
    [K in Policy['kind']]: PolicyKindSpec<K>;
};

/**
 * Distributive union of every concrete spec. `PolicyKindSpec<K>` is
 * contravariant in `K` (via the `Editor`'s value prop), so
 * `PolicyKindSpec<'artifact'>` is NOT assignable to the widened
 * `PolicyKindSpec<Policy['kind']>`. The mapped-type-indexing trick
 * below produces a union of concrete specs instead, which *is*
 * usable as an iterable element type.
 */
export type AnyPolicyKindSpec = {
    [K in Policy['kind']]: PolicyKindSpec<K>;
}[Policy['kind']];

/**
 * Ordered list for UI surfaces that iterate every kind (card picker,
 * registry tests). Order reflects author frequency: the most common
 * ("submit something") first, the power-user kinds last.
 *
 * Kept separate from the keyed object so the iteration order is stable
 * and independent of property-declaration order (ES object iteration
 * order is spec-defined but relying on it for UI ordering reads as
 * accidental).
 */
export const POLICY_KIND_LIST: readonly AnyPolicyKindSpec[] = [
    artifactSpec,
    practiceSpec,
    reviewSpec,
    assessmentSpec,
    externalSpec,
    compositeSpec,
];
