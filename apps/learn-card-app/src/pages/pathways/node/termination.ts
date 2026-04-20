/**
 * termination — pure helpers that turn a `Termination` rule and a
 * `PathwayNode` into the shape the Node overlay actually needs.
 *
 * Kept out of the React components so the two things that encode a
 * choice (how to count toward "done", how to talk about it in plain
 * English) can be tested without a render. The overlay then just
 * reads progress numbers and copy, never recomputing them.
 */

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

export const computeTerminationView = (
    termination: Termination,
    node: PathwayNode,
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
