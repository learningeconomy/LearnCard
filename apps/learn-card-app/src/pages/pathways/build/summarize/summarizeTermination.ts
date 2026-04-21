/**
 * summarizeTermination — render a Termination as a short, jargon-free
 * English phrase for collapsed section headers, outline rows, and the
 * learner-facing preview pane.
 *
 * Examples:
 *
 *   { kind: 'artifact-count', count: 3, artifactType: 'link' }
 *     → "Attach 3 links"
 *
 *   { kind: 'endorsement', minEndorsers: 2, trustedIssuers: [...] }
 *     → "Get 2 endorsements from trusted issuers"
 *
 *   { kind: 'composite', require: 'all', of: [...3 sub-goals] }
 *     → "Hit all 3 sub-goals"
 *
 *   { kind: 'pathway-completed', pathwayRef: '<uuid>' }
 *     → "Finish AI in Finance" (when resolvable)
 *     → "Finish the nested pathway" (when not)
 *
 * Pure. Does not dereference stores; takes the resolution map via
 * `SummarizeContext`, matching `summarizePolicy`'s shape so both can
 * be called from the same render without two context arguments.
 *
 * Copy rules (see AGENTS.md):
 *   - No jargon: no "termination", "artifact", "DID", "composite".
 *   - Lead with the achievement verb ("Attach", "Get", "Score", "Hit",
 *     "Finish"). The learner is doing something, not satisfying a
 *     predicate.
 */

import type { ArtifactType, Termination } from '../../types';

import type { SummarizeContext } from './summarizePolicy';

// ---------------------------------------------------------------------------
// Artifact noun table (duplicate of summarizePolicy's intentionally —
// keeping them co-located with their consumer avoids import churn if
// one noun changes in only one summarizer's context)
// ---------------------------------------------------------------------------

const ARTIFACT_NOUN: Record<ArtifactType, { one: string; many: string }> = {
    text: { one: 'note', many: 'notes' },
    image: { one: 'image', many: 'images' },
    audio: { one: 'audio clip', many: 'audio clips' },
    video: { one: 'video', many: 'videos' },
    pdf: { one: 'PDF', many: 'PDFs' },
    link: { one: 'link', many: 'links' },
    code: { one: 'code snippet', many: 'code snippets' },
    other: { one: 'file', many: 'files' },
};

const artifactNoun = (type: ArtifactType, count: number): string =>
    count === 1 ? ARTIFACT_NOUN[type].one : ARTIFACT_NOUN[type].many;

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export const summarizeTermination = (
    termination: Termination,
    ctx: SummarizeContext = {},
): string => {
    switch (termination.kind) {
        case 'artifact-count': {
            const noun = artifactNoun(termination.artifactType, termination.count);
            return `Attach ${termination.count} ${noun}`;
        }

        case 'endorsement': {
            const n = termination.minEndorsers;
            const base = n === 1 ? 'Get 1 endorsement' : `Get ${n} endorsements`;

            // Only surface "from trusted issuers" when the list is
            // non-empty — an empty-but-present array isn't meaningful
            // and would lie to the learner about who can endorse them.
            const hasTrusted =
                Array.isArray(termination.trustedIssuers) &&
                termination.trustedIssuers.length > 0;

            return hasTrusted ? `${base} from trusted issuers` : base;
        }

        case 'self-attest':
            return 'Self-attest';

        case 'assessment-score':
            return `Score ${termination.min} or higher`;

        case 'composite': {
            const n = termination.of.length;
            const verb = termination.require === 'all' ? 'Hit all' : 'Hit any of';
            const noun = n === 1 ? 'sub-goal' : 'sub-goals';

            return `${verb} ${n} ${noun}`;
        }

        case 'pathway-completed': {
            if (!termination.pathwayRef) return 'Finish the nested pathway';

            const title = ctx.pathwayTitleById?.[termination.pathwayRef];
            return title ? `Finish ${title}` : 'Finish the nested pathway';
        }
    }
};
