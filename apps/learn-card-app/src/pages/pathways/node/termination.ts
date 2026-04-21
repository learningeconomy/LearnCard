/**
 * termination — pure helpers that turn a `Termination` rule and a
 * `PathwayNode` into the shape the Node overlay actually needs.
 *
 * Kept out of the React components so the two things that encode a
 * choice (how to count toward "done", how to talk about it in plain
 * English) can be tested without a render. The overlay then just
 * reads progress numbers and copy, never recomputing them.
 */

import {
    computePathwayProgress,
    type PathwayMap,
} from '../core/composition';
import type { PathwayNode, Termination } from '../types';

/**
 * A view-model tuned for the overlay:
 *
 *   - `count`      → renders a progress ring (current / total).
 *   - `ready`      → no ring needed; self-attest unlocks immediately.
 *   - `unsupported`→ Phase 2 can't satisfy this (assessment, composite);
 *                   the overlay shows the requirement but stays locked.
 */
export type TerminationView =
    | {
          kind: 'count';
          current: number;
          total: number;
          done: boolean;
          /** Short plain-English requirement, e.g. "1 note" or "2 vouches". */
          requirement: string;
          /** Hint to render beneath a disabled commit button. */
          unmetHint: string;
      }
    | {
          kind: 'ready';
          requirement: string;
      }
    | {
          kind: 'unsupported';
          requirement: string;
          /** Reason shown beneath the (permanently) disabled commit button. */
          unmetHint: string;
      };

const ARTIFACT_UNIT: Record<string, { singular: string; plural: string }> = {
    text: { singular: 'note', plural: 'notes' },
    link: { singular: 'link', plural: 'links' },
    image: { singular: 'image', plural: 'images' },
    video: { singular: 'video', plural: 'videos' },
    audio: { singular: 'audio clip', plural: 'audio clips' },
    file: { singular: 'file', plural: 'files' },
    other: { singular: 'item', plural: 'items' },
};

const pluralize = (
    n: number,
    single: string,
    plural: string = `${single}s`,
): string => `${n} ${n === 1 ? single : plural}`;

/**
 * Count endorsements that have actually arrived. A `pending-*`
 * endorsementId means we've fired off a request but no one has
 * signed yet — those don't count toward "done".
 */
const countArrivedEndorsements = (node: PathwayNode): number =>
    node.endorsements.filter(e => !e.endorsementId.startsWith('pending-')).length;

/**
 * For `artifact-count` terminations, only artifacts whose type matches
 * the requested one should count. A learner who attaches an image when
 * we asked for a text note hasn't satisfied the termination. This
 * mirrors what the spec says but the old `terminationMet` helper
 * ignored artifactType — this is a quiet bug-fix.
 */
const countMatchingArtifacts = (
    node: PathwayNode,
    artifactType: string,
): number => node.progress.artifacts.filter(a => a.artifactType === artifactType).length;

/**
 * Context bundle for termination kinds that need to reach outside the
 * node itself. Right now only `pathway-completed` uses this, but
 * threading a single `ctx` object forward means future kinds (e.g.
 * endorser-trust-tier lookups) won't force signature churn.
 */
export interface TerminationContext {
    /** Active pathways in the store — used to resolve composite refs. */
    pathways: PathwayMap;
}

export const computeTerminationView = (
    termination: Termination,
    node: PathwayNode,
    ctx?: TerminationContext,
): TerminationView => {
    switch (termination.kind) {
        case 'artifact-count': {
            const unit = ARTIFACT_UNIT[termination.artifactType] ?? ARTIFACT_UNIT.other;
            const have = countMatchingArtifacts(node, termination.artifactType);
            const need = termination.count;
            const current = Math.min(have, need);
            const done = have >= need;
            const remaining = Math.max(0, need - have);

            return {
                kind: 'count',
                current,
                total: need,
                done,
                requirement: pluralize(need, unit.singular, unit.plural),
                unmetHint: done
                    ? ''
                    : `Attach ${pluralize(remaining, unit.singular, unit.plural)} to mark done.`,
            };
        }

        case 'endorsement': {
            const have = countArrivedEndorsements(node);
            const need = termination.minEndorsers;
            const current = Math.min(have, need);
            const done = have >= need;
            const remaining = Math.max(0, need - have);

            return {
                kind: 'count',
                current,
                total: need,
                done,
                requirement: pluralize(need, 'vouch', 'vouches'),
                unmetHint: done
                    ? ''
                    : `Waiting on ${pluralize(remaining, 'vouch', 'vouches')}.`,
            };
        }

        case 'self-attest':
            return {
                kind: 'ready',
                requirement: 'Ready when you are',
            };

        case 'assessment-score':
            return {
                kind: 'unsupported',
                requirement: `Score at least ${termination.min}`,
                unmetHint: 'Scored assessments arrive in a later release.',
            };

        case 'pathway-completed': {
            // A composite node is "done" when its referenced pathway's
            // destination is marked complete. We expose this as a
            // count-style view so the overlay gets a progress ring
            // instead of a binary lock — "3/7 steps" reads better than
            // "not yet" when you're mid-pathway.
            const nested = ctx?.pathways?.[termination.pathwayRef];

            if (!nested) {
                // Nested pathway isn't loaded — surface that honestly
                // rather than pretending it's just "in progress".
                return {
                    kind: 'unsupported',
                    requirement: 'Nested pathway completion',
                    unmetHint:
                        "We couldn't find the referenced pathway. Open Build to relink it.",
                };
            }

            const progress = computePathwayProgress(nested);
            const done = progress.destinationCompleted;
            const total = Math.max(progress.total, 1);
            const current = progress.destinationCompleted
                ? total
                : Math.min(progress.completed, total - 1);

            return {
                kind: 'count',
                current,
                total,
                done,
                requirement: `Finish "${nested.title}"`,
                unmetHint: done
                    ? ''
                    : progress.total === 0
                        ? "The nested pathway has no steps yet — add some in Build."
                        : `Complete the destination of "${nested.title}" to unlock.`,
            };
        }

        case 'composite': {
            const which = termination.require === 'all' ? 'All' : 'Any';

            return {
                kind: 'unsupported',
                requirement: `${which} of ${termination.of.length} sub-goals`,
                unmetHint: 'Composite goals arrive in a later release.',
            };
        }
    }
};

/**
 * Convenience: is the commit action currently available? Inverse of
 * "disabled" on the Done button.
 */
export const terminationDone = (view: TerminationView): boolean => {
    switch (view.kind) {
        case 'count':
            return view.done;
        case 'ready':
            return true;
        case 'unsupported':
            return false;
    }
};
