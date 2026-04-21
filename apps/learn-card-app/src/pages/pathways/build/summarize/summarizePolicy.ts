/**
 * summarizePolicy — render a Policy as a short, jargon-free English
 * phrase suitable for collapsed section headers, outline rows, and the
 * learner-facing preview pane.
 *
 * The output intentionally reads like copy (not structured data):
 *
 *   { kind: 'artifact', expectedArtifact: 'link' }
 *     → "Submit a link"
 *
 *   { kind: 'practice', cadence: { frequency: 'weekly', perPeriod: 3 } }
 *     → "Practice 3× per week"
 *
 *   { kind: 'composite', pathwayRef: '<uuid>' }
 *     → "Complete AI in Finance" (when the pathway title can be resolved)
 *     → "Complete a nested pathway" (when it can't)
 *
 * The function is pure so it can be called from render without fear of
 * perf cliffs, and from tests without any React plumbing.
 *
 * Copy rules (see AGENTS.md):
 *   - No jargon: no "artifact", "policy", "MCP", "FSRS", "composite".
 *   - Lead with the verb the learner does.
 *   - Degrade gracefully when refs are incomplete (in-flight composite
 *     state) rather than rendering blanks or UUIDs.
 */

import type { ArtifactType, Policy } from '../../types';

export interface SummarizeContext {
    /**
     * Optional map from pathway id → title, used to resolve composite
     * policies' `pathwayRef` into a human name. When absent (or when
     * the ref doesn't resolve), falls back to a generic phrase.
     */
    pathwayTitleById?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Artifact type → human noun (singular + plural)
// ---------------------------------------------------------------------------

/**
 * Pluralisable human names for each ArtifactType. Keep "note" for
 * `text` because "submit a text" reads wrong in English; "submit a
 * note" / "submit 3 notes" is what a learner actually does.
 */
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

/** "a" vs "an" for the leading article. Keep simple; no edge-case words here. */
const article = (word: string): 'a' | 'an' =>
    /^[aeiou]/i.test(word) ? 'an' : 'a';

// ---------------------------------------------------------------------------
// Cadence phrasing
// ---------------------------------------------------------------------------

/**
 * Render cadence like:
 *   { daily, 1 }   → "daily"
 *   { daily, 3 }   → "3× per day"
 *   { weekly, 1 }  → "weekly"
 *   { weekly, 2 }  → "2× per week"
 *   { monthly, 1 } → "monthly"
 *   { ad-hoc, _ }  → "occasionally"
 */
const describeCadence = (
    frequency: 'daily' | 'weekly' | 'monthly' | 'ad-hoc',
    perPeriod: number,
): string => {
    if (frequency === 'ad-hoc') return 'occasionally';

    if (perPeriod <= 1) {
        switch (frequency) {
            case 'daily':
                return 'daily';
            case 'weekly':
                return 'weekly';
            case 'monthly':
                return 'monthly';
        }
    }

    const unit = frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : 'month';
    return `${perPeriod}× per ${unit}`;
};

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export const summarizePolicy = (
    policy: Policy,
    ctx: SummarizeContext = {},
): string => {
    switch (policy.kind) {
        case 'artifact': {
            const noun = artifactNoun(policy.expectedArtifact, 1);
            return `Submit ${article(noun)} ${noun}`;
        }

        case 'practice': {
            return `Practice ${describeCadence(
                policy.cadence.frequency,
                policy.cadence.perPeriod,
            )}`;
        }

        case 'review': {
            // Intentionally NOT surfacing stability/difficulty/dueAt
            // here — those are scheduler internals and meaningless to
            // an author scanning a list. The inspector detail view
            // still exposes them if the author expands the section.
            return 'Review over time';
        }

        case 'assessment': {
            const n = policy.rubric.criteria.length;

            if (n === 0) return 'Pass a check';
            if (n === 1) return 'Pass a 1-criterion check';
            return `Pass a ${n}-criterion check`;
        }

        case 'external': {
            const { serverId, toolName } = policy.mcp;

            // Degrade gracefully when the author hasn't filled the
            // tool in yet — showing "Use  → " with empty slots reads
            // as a bug, not an in-progress state.
            if (!serverId && !toolName) return 'Use a tool (not set up)';
            if (!toolName) return `Use ${serverId}`;
            if (!serverId) return `Use ${toolName}`;

            return `Use ${serverId} → ${toolName}`;
        }

        case 'composite': {
            if (!policy.pathwayRef) return 'Complete a nested pathway (pick one)';

            const title = ctx.pathwayTitleById?.[policy.pathwayRef];
            return title ? `Complete ${title}` : 'Complete a nested pathway';
        }
    }
};
