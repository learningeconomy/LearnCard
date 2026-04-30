/**
 * validatePathway — collect author-facing issues for a pathway.
 *
 * Two sources of truth:
 *
 *   1. **`PathwaySchema.safeParse`** — Zod tells us every structural
 *      problem the schema would reject at publish time. We walk
 *      the issues and map their paths to user-friendly copy + a
 *      section hint so the UI can jump the author to the right place.
 *
 *   2. **Handwritten warnings** — gentler "this isn't broken but
 *      probably isn't what you wanted" advice (no destination set,
 *      composite ref to a pathway that isn't loaded, etc.). Not
 *      schema-rejecting, but worth a nudge.
 *
 * Pure — takes a pathway (and optionally a map of other pathways for
 * cross-pathway checks) and returns a flat `Issue[]`. Callers
 * (ValidationBanner) decide how to group/show them.
 *
 * Copy rules follow AGENTS.md: no jargon, short sentences, human
 * phrasing. The author sees "This step needs a title", not
 * "nodes.2.title must be a non-empty string".
 */

import type { ZodIssue } from 'zod';

import type { PathwayMap } from '../../core/composition';
import { type Pathway, PathwaySchema } from '../../types';

// ---------------------------------------------------------------------------
// Issue shape
// ---------------------------------------------------------------------------

/**
 * Which inspector section does this issue live in? Used by the UI to
 * jump the author to the right place — tapping an issue in the
 * banner should scroll/expand the matching section.
 *
 * `action` was added alongside the ActionSection inspector panel so
 * author-actionable `node.action.*` errors (invalid URL, missing
 * topic URI, unresolved listing id) land in the right place instead
 * of falling through to `identity`.
 */
export type IssueSection =
    | 'identity'
    | 'what'
    | 'action'
    | 'done'
    | 'connections'
    | 'pathway';

export interface Issue {
    /**
     * `error` surfaces with a red tint and blocks publish-time
     * validation; `warning` is yellow/neutral and advisory.
     */
    level: 'error' | 'warning';

    /** Node this issue pertains to, or `null` for pathway-level issues. */
    nodeId: string | null;

    /**
     * Which inspector section this issue lives in. `pathway` is a
     * special hint for issues that don't map to a single node
     * (e.g. "no destination set").
     */
    section: IssueSection;

    /** Short, jargon-free human message. */
    message: string;
}

// ---------------------------------------------------------------------------
// Path → section mapping
// ---------------------------------------------------------------------------

/**
 * Walk a Zod path ending at the node subtree and classify which
 * section it belongs to. Falls back to `identity` so an unclassified
 * per-node issue at least lands somewhere reasonable.
 */
const classifyNodePath = (path: ReadonlyArray<PropertyKey>): IssueSection => {
    // path here is the sub-path AFTER ['nodes', N]
    const [first, second] = path;

    if (first === 'title' || first === 'description') return 'identity';
    if (first === 'stage' && second === 'policy') return 'what';
    if (first === 'stage' && second === 'termination') return 'done';
    // `action` lives directly on the node (not under `stage`), so its
    // classification is a single-segment check — everything from an
    // invalid URL in `external-url` to an unresolved `app-listing`
    // listingId surfaces here.
    if (first === 'action') return 'action';

    return 'identity';
};

// ---------------------------------------------------------------------------
// Zod-issue → Issue mapping
// ---------------------------------------------------------------------------

/**
 * Internal (system-supplied) field locations — Zod errors on these
 * paths are not actionable by the author ("pathwayId must be a UUID"
 * is not a form-fixable problem), so we suppress them. If one ever
 * goes malformed in production, other telemetry catches it — surfacing
 * it to the Builder would only add noise.
 *
 * Each matcher describes a path *shape* rather than a single segment.
 * An earlier iteration matched by "any segment equals one of these
 * names", which over-suppressed: a user-authored MCP `defaultArgs`
 * key called "id" would get its error dropped because some nested
 * `id` segment appeared. Shape-matching fixes that class of bug.
 *
 * Segment `null` in a pattern is a wildcard (matches any value);
 * other values match exactly.
 */
type PathPattern = ReadonlyArray<PropertyKey | null>;

const INTERNAL_PATH_PATTERNS: ReadonlyArray<PathPattern> = [
    // Pathway-level system fields
    ['id'],
    ['ownerDid'],
    ['status'],
    ['visibility'],
    ['source'],
    ['templateRef'],
    ['sourceUri'],
    ['sourceCtid'],
    ['createdAt'],
    ['updatedAt'],
    ['revision'],
    ['schemaVersion'],
    ['destinationNodeId'],
    // Per-node system fields ([..., null, ...] = any node index)
    ['nodes', null, 'id'],
    ['nodes', null, 'pathwayId'],
    ['nodes', null, 'createdBy'],
    ['nodes', null, 'createdAt'],
    ['nodes', null, 'updatedAt'],
    ['nodes', null, 'progress'],
    ['nodes', null, 'endorsements'],
    ['nodes', null, 'credentialProjection'],
    ['nodes', null, 'sourceUri'],
    ['nodes', null, 'sourceCtid'],
    ['nodes', null, 'stage', 'initiation'],
];

/**
 * Does `path` match `pattern`? `pattern` matches a *prefix* of `path`,
 * so errors deep inside a suppressed subtree (e.g. inside `progress`)
 * also get suppressed — `['nodes', 0, 'progress', 'streak', 'current']`
 * is rightly dropped when `['nodes', null, 'progress']` is internal.
 */
const matchesPathPattern = (
    path: ReadonlyArray<PropertyKey>,
    pattern: PathPattern,
): boolean => {
    if (path.length < pattern.length) return false;

    for (let i = 0; i < pattern.length; i += 1) {
        const expected = pattern[i];

        // Wildcard segment — any value matches.
        if (expected === null) continue;

        if (path[i] !== expected) return false;
    }

    return true;
};

/**
 * Is this path one the author can't act on? Used to drop Zod errors
 * the Builder can't show the author a fix for.
 */
const isInternalPath = (path: ReadonlyArray<PropertyKey>): boolean =>
    INTERNAL_PATH_PATTERNS.some(pattern => matchesPathPattern(path, pattern));

/**
 * Translate a Zod issue to a user-facing `Issue`. Returns `null` for
 * issues we deliberately suppress (internal fields, non-authored
 * metadata).
 *
 * We intentionally lean on `issue.message` only for codes that produce
 * decent prose; for the rest we hand-write copy keyed off the path.
 */
const mapZodIssue = (issue: ZodIssue, pathway: Pathway): Issue | null => {
    const path = issue.path;

    // Suppress errors on system-supplied fields — they're not
    // actionable from the Builder.
    if (isInternalPath(path)) return null;

    // Pathway-level fields
    if (path.length === 1) {
        const [k] = path;

        if (k === 'title') {
            return {
                level: 'error',
                nodeId: null,
                section: 'pathway',
                message: 'This pathway needs a title.',
            };
        }

        if (k === 'goal') {
            return {
                level: 'warning',
                nodeId: null,
                section: 'pathway',
                message: 'Describe what this pathway is for.',
            };
        }

        return null;
    }

    // Per-node fields: path is ['nodes', n, ...rest]
    if (path[0] === 'nodes' && typeof path[1] === 'number') {
        const nodeIdx = path[1];
        const node = pathway.nodes[nodeIdx];

        if (!node) return null;

        const rest = path.slice(2);
        const section = classifyNodePath(rest);

        // Specific, common messages keyed off the tail of the path.
        const tail = rest.join('.');

        if (tail === 'title') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'identity',
                message: 'This step needs a title.',
            };
        }

        if (tail === 'stage.policy.pathwayRef') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'what',
                message: 'Pick a nested pathway for this step.',
            };
        }

        if (tail === 'stage.termination.pathwayRef') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'done',
                message: 'This step is waiting on a nested pathway to point to.',
            };
        }

        if (tail.startsWith('stage.policy.rubric.criteria')) {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'what',
                message: 'Add at least one criterion to the rubric.',
            };
        }

        if (tail.startsWith('stage.termination.of')) {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'done',
                message: 'This sub-goal group needs at least one sub-goal.',
            };
        }

        // Termination-level requirement fields — the
        // `requirement-satisfied` termination wraps a full
        // `NodeRequirement` tree; friendly copy for its most common
        // empty-field shapes keeps the validation banner speaking
        // the author's language instead of Zod's.
        if (tail === 'stage.termination.requirement.type') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'done',
                message: 'Name the credential type this step is waiting for.',
            };
        }

        if (tail === 'stage.termination.requirement.uri') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'done',
                message: 'Paste the LearnCard boost URI to match.',
            };
        }

        if (tail === 'stage.termination.topicUri') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'done',
                message: 'Set the AI tutor topic this session will cover.',
            };
        }

        // Action-field messages — the inspector's ActionSection is
        // the right deep-link target, and most errors here are easy
        // for the author to fix with concrete copy.
        if (tail === 'action.url') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: 'Enter a full URL for this step\u2019s launch destination.',
            };
        }

        if (tail === 'action.listingId') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: 'Pick an app listing for this step.',
            };
        }

        if (tail === 'action.topicUri') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: 'Set the AI tutor topic this step will launch.',
            };
        }

        if (tail === 'action.to') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: 'Set the in-app route this step links to.',
            };
        }

        if (tail.startsWith('action.ref')) {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: 'Pick an MCP server and tool for this step.',
            };
        }

        // Any other `action.*` issue — route to the section but
        // lean on Zod's prose. Gives the author a deep-link even
        // when the specific message isn't friendly yet.
        if (path[2] === 'action') {
            return {
                level: 'error',
                nodeId: node.id,
                section: 'action',
                message: `This step\u2019s launch has a problem: ${issue.message}`,
            };
        }

        // Unknown specific — degrade to a generic message + Zod's copy.
        return {
            level: 'error',
            nodeId: node.id,
            section,
            message: `This step has a problem: ${issue.message}`,
        };
    }

    // Edges, visibility, etc. — fall through to generic.
    return {
        level: 'error',
        nodeId: null,
        section: 'pathway',
        message: `Structural problem: ${issue.message}`,
    };
};

// ---------------------------------------------------------------------------
// Handwritten warnings
// ---------------------------------------------------------------------------

/**
 * Non-schema warnings that depend on cross-pathway state or on
 * intent rather than shape. Kept separate from `mapZodIssue` because
 * these are opinion, not correctness.
 */
const collectWarnings = (pathway: Pathway, allPathways?: PathwayMap): Issue[] => {
    const out: Issue[] = [];

    if (pathway.nodes.length === 0) {
        out.push({
            level: 'warning',
            nodeId: null,
            section: 'pathway',
            message: 'No steps yet. Add one to get started.',
        });
    } else if (!pathway.destinationNodeId) {
        out.push({
            level: 'warning',
            nodeId: null,
            section: 'pathway',
            message:
                'No destination set. Mark the step the learner is earning so the pathway has an end.',
        });
    }

    for (const node of pathway.nodes) {
        // External tools missing a server or tool name — schema
        // accepts empty strings but the policy is non-functional.
        if (node.stage.policy.kind === 'external') {
            const { serverId, toolName } = node.stage.policy.mcp;

            if (!serverId || !toolName) {
                out.push({
                    level: 'warning',
                    nodeId: node.id,
                    section: 'what',
                    message: 'Tool isn\u2019t set up yet. Pick a provider and a tool.',
                });
            }
        }

        // Composite referencing a pathway that isn't in the store.
        // The schema only checks the shape of `pathwayRef`, not that
        // the target exists. We still flag this as an error since a
        // missing target makes the step unfinishable.
        if (node.stage.policy.kind === 'composite' && node.stage.policy.pathwayRef) {
            const ref = node.stage.policy.pathwayRef;

            if (allPathways && !allPathways[ref]) {
                out.push({
                    level: 'error',
                    nodeId: node.id,
                    section: 'what',
                    message: "The nested pathway isn\u2019t loaded here. Import it or pick another.",
                });
            }
        }
    }

    return out;
};

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

/**
 * Validate a pathway and return every issue (errors + warnings).
 *
 * Sorted by: level (errors first), then by node order (top-to-bottom
 * outline), then by section (identity → what → done → connections).
 * UI groups as it likes; consumers don't need to re-sort.
 */
export const validatePathway = (
    pathway: Pathway,
    allPathways?: PathwayMap,
): Issue[] => {
    const issues: Issue[] = [];

    // Zod-driven issues — every structural problem.
    const parsed = PathwaySchema.safeParse(pathway);

    if (!parsed.success) {
        for (const zodIssue of parsed.error.issues) {
            const mapped = mapZodIssue(zodIssue, pathway);

            if (mapped) issues.push(mapped);
        }
    }

    // Hand-written warnings.
    issues.push(...collectWarnings(pathway, allPathways));

    return sortIssues(issues, pathway);
};

const SECTION_ORDER: Record<IssueSection, number> = {
    identity: 0,
    what: 1,
    action: 2,
    done: 3,
    connections: 4,
    pathway: 5,
};

const sortIssues = (issues: Issue[], pathway: Pathway): Issue[] => {
    const nodeIndex = new Map<string, number>();
    pathway.nodes.forEach((n, i) => nodeIndex.set(n.id, i));

    return [...issues].sort((a, b) => {
        // Errors before warnings.
        if (a.level !== b.level) return a.level === 'error' ? -1 : 1;

        // Pathway-level issues last (they're typically the summary nudge).
        if ((a.nodeId === null) !== (b.nodeId === null)) {
            return a.nodeId === null ? 1 : -1;
        }

        // Among per-node issues, sort by outline order.
        if (a.nodeId && b.nodeId) {
            const ai = nodeIndex.get(a.nodeId) ?? 0;
            const bi = nodeIndex.get(b.nodeId) ?? 0;

            if (ai !== bi) return ai - bi;
        }

        // Within a node, by section order.
        return SECTION_ORDER[a.section] - SECTION_ORDER[b.section];
    });
};
