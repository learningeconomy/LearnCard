/**
 * nodeRequirementMatcher — evaluate a `NodeRequirement` tree against a
 * `CredentialIdentity`.
 *
 * ## Role in the pipeline
 *
 *   WalletEvent (CredentialIngested)
 *        │
 *        ▼
 *   extractCredentialIdentity(vc, hints)   → CredentialIdentity
 *        │
 *        ▼
 *   matchRequirement(requirement, identity) → MatchVerdict       ← YOU ARE HERE
 *        │
 *        ▼
 *   nodeProgressBinder (wraps verdict + trust check into a Proposal)
 *
 * The matcher is pure. No wallet access, no store access, no network,
 * no time — every input is supplied by the caller. That purity is
 * load-bearing: it lets us run the matcher inside tests, inside a
 * cold-start replay sweep, and later (if we want) inside a web worker
 * without rethinking any invariants.
 *
 * ## Why a registry
 *
 * New identity schemes appear faster than the core schema wants to
 * version. Rather than burying a giant switch statement in the
 * reactor, every requirement `kind` is registered through
 * `registerRequirementMatcher`. Adding a new kind = one entry, one
 * test. The stock registration for the built-in kinds happens at
 * module load time in `defaultRegistry()`; callers that want to
 * extend the registry (tests, future plugin consumers) can clone
 * the default and register new matchers without touching core.
 *
 * ## Verdicts
 *
 * The verdict shape mirrors `MatchResult` from `outcomeMatcher` so
 * future reconciliation between the two systems is a mechanical
 * refactor — same field names, same confidence semantics, same
 * failure-reason vocabulary. We deliberately do NOT reuse the type
 * right now because the two systems should remain independent until
 * we decide to unify; duplicating the shape keeps the coupling loose
 * and obvious.
 *
 * Composite verdicts add two richer pieces of context on failure:
 * `childReasons` (so debugging an `any-of` that fails tells the
 * author WHY every branch failed) and `satisfiedBy` on success (so
 * a passing `any-of` records which branch actually satisfied). Both
 * are useful for authoring UI ("3 out of 5 branches would have
 * matched") and for telemetry.
 */

import type { CredentialIdentity } from './credentialIdentity';
import type {
    BoostUriRequirement,
    CredentialTypeRequirement,
    CtdlCtidRequirement,
    IssuerCredentialIdRequirement,
    NodeRequirement,
    ObAchievementRequirement,
    ObAlignmentRequirement,
    ScoreThresholdRequirement,
    SkillTagRequirement,
} from '../types';
import type { VcLike } from './outcomeMatcher';

// ---------------------------------------------------------------------------
// Verdict shapes
// ---------------------------------------------------------------------------

/**
 * Union of every failure reason. Union-of-literals so downstream UI
 * can enumerate them and so adding a new one produces a compiler
 * error in any exhaustive switch. Kept intentionally open (prefixed
 * with `composite-`) so composite branches can surface their own
 * distinct failure.
 */
export type RequirementFailureReason =
    | 'type-mismatch'
    | 'issuer-mismatch'
    | 'boost-uri-mismatch'
    | 'ctid-mismatch'
    | 'credential-id-mismatch'
    | 'ob-achievement-mismatch'
    | 'ob-alignment-mismatch'
    | 'skill-tag-mismatch'
    | 'field-missing'
    | 'field-not-numeric'
    | 'threshold-unmet'
    | 'composite-empty'
    | 'composite-any-all-failed'
    | 'composite-all-one-failed'
    | 'kind-unsupported';

export interface LeafMatchSuccess {
    matched: true;
    confidence: number;
    /**
     * For score-threshold leaves, the numeric value that cleared the
     * threshold — kept here so the binder can echo "you scored 1450
     * (target 1400)" without re-parsing the VC.
     */
    observedValue?: number | string;
}

export interface LeafMatchFailure {
    matched: false;
    reason: RequirementFailureReason;
}

export type LeafMatchVerdict = LeafMatchSuccess | LeafMatchFailure;

export interface CompositeMatchSuccess {
    matched: true;
    confidence: number;
    observedValue?: number | string;
    /** Which branch indices of the composite satisfied (relative to `of`). */
    satisfiedBy?: number[];
}

export interface CompositeMatchFailure {
    matched: false;
    reason: RequirementFailureReason;
    /** Per-branch verdicts, same order as `of`. Useful for authoring UI. */
    childVerdicts?: MatchVerdict[];
}

export type MatchVerdict = CompositeMatchSuccess | CompositeMatchFailure;

// ---------------------------------------------------------------------------
// Low-level helpers (copied from outcomeMatcher and kept small on
// purpose; avoids creating a cross-module dependency that would
// force us to reorganise core/ for one shared helper).
// ---------------------------------------------------------------------------

/** Case-insensitive, prefix-stripped type match. */
const typeMatches = (identity: CredentialIdentity, expected: string): boolean => {
    const expectedLc = expected.toLowerCase();
    const expectedStripped = expectedLc.replace(/^.*[:/#]/, '');

    for (const type of identity.types) {
        const lc = type.toLowerCase();

        if (lc === expectedLc) return true;
        if (lc.replace(/^.*[:/#]/, '') === expectedStripped) return true;
    }

    return false;
};

/**
 * Read a dot path (`credentialSubject.score.total`, `score.total`, or
 * `total`) against a subject record. Mirrors the helper in
 * `outcomeMatcher` so authors writing score thresholds get the same
 * path semantics on both systems.
 */
const readPath = (subject: Record<string, unknown>, path: string): unknown => {
    const segments = path.split('.').filter(Boolean);
    const normalised = segments[0] === 'credentialSubject' ? segments.slice(1) : segments;

    let cursor: unknown = subject;

    for (const segment of normalised) {
        if (cursor === null || cursor === undefined) return undefined;
        if (typeof cursor !== 'object') return undefined;

        cursor = (cursor as Record<string, unknown>)[segment];
    }

    return cursor;
};

const coerceNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);

        return Number.isFinite(n) ? n : null;
    }

    return null;
};

const compareNumber = (
    observed: number,
    op: ScoreThresholdRequirement['op'],
    threshold: number,
): boolean => {
    switch (op) {
        case '>=':
            return observed >= threshold;
        case '>':
            return observed > threshold;
        case '==':
            return observed === threshold;
        case '<=':
            return observed <= threshold;
        case '<':
            return observed < threshold;
    }
};

const subjectObjects = (vc: VcLike): Array<Record<string, unknown>> => {
    const subject = vc.credentialSubject;

    if (!subject) return [];
    if (Array.isArray(subject)) return subject;

    return [subject];
};

const sameCaseInsensitive = (a: string, b: string): boolean =>
    a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;

// ---------------------------------------------------------------------------
// Per-kind matchers (stock).
// ---------------------------------------------------------------------------

const matchCredentialType = (
    req: CredentialTypeRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (!typeMatches(identity, req.type)) {
        return { matched: false, reason: 'type-mismatch' };
    }

    if (req.issuer && identity.issuerDid !== req.issuer) {
        return { matched: false, reason: 'issuer-mismatch' };
    }

    return { matched: true, confidence: 0.9 };
};

const matchBoostUri = (
    req: BoostUriRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (identity.boostUri && identity.boostUri === req.uri) {
        return { matched: true, confidence: 1 };
    }

    return { matched: false, reason: 'boost-uri-mismatch' };
};

const matchCtdlCtid = (
    req: CtdlCtidRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (!identity.ctdlCtid) return { matched: false, reason: 'ctid-mismatch' };

    // CTIDs are case-insensitive in CTDL ecosystems.
    if (sameCaseInsensitive(identity.ctdlCtid, req.ctid)) {
        return { matched: true, confidence: 1 };
    }

    return { matched: false, reason: 'ctid-mismatch' };
};

const matchIssuerCredentialId = (
    req: IssuerCredentialIdRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (identity.issuerDid !== req.issuerDid) {
        return { matched: false, reason: 'issuer-mismatch' };
    }

    if (identity.credentialId !== req.credentialId) {
        return { matched: false, reason: 'credential-id-mismatch' };
    }

    return { matched: true, confidence: 1 };
};

const matchObAchievement = (
    req: ObAchievementRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (!identity.obAchievementId) {
        return { matched: false, reason: 'ob-achievement-mismatch' };
    }

    if (identity.obAchievementId === req.achievementId) {
        return { matched: true, confidence: 0.95 };
    }

    return { matched: false, reason: 'ob-achievement-mismatch' };
};

const matchObAlignment = (
    req: ObAlignmentRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (!identity.obAlignments || identity.obAlignments.length === 0) {
        return { matched: false, reason: 'ob-alignment-mismatch' };
    }

    if (identity.obAlignments.some(url => url === req.targetUrl)) {
        return { matched: true, confidence: 0.85 };
    }

    return { matched: false, reason: 'ob-alignment-mismatch' };
};

const matchSkillTag = (
    req: SkillTagRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    const tags = identity.skillTags;

    if (!tags || tags.length === 0) {
        return { matched: false, reason: 'skill-tag-mismatch' };
    }

    // Two passes: exact match wins; otherwise try case-insensitive.
    // Skill registry URIs are case-sensitive; freeform tags are not.
    if (tags.some(t => t === req.tag)) {
        return { matched: true, confidence: 0.9 };
    }

    if (tags.some(t => sameCaseInsensitive(t, req.tag))) {
        return { matched: true, confidence: 0.7 };
    }

    return { matched: false, reason: 'skill-tag-mismatch' };
};

const matchScoreThreshold = (
    req: ScoreThresholdRequirement,
    identity: CredentialIdentity,
): LeafMatchVerdict => {
    if (!typeMatches(identity, req.type)) {
        return { matched: false, reason: 'type-mismatch' };
    }

    if (req.issuer && identity.issuerDid !== req.issuer) {
        return { matched: false, reason: 'issuer-mismatch' };
    }

    // Score thresholds have to reach into the raw VC; the identity
    // layer doesn't extract arbitrary numeric fields because the set
    // of interesting paths is unbounded (every issuer puts scores in
    // a different place). The `raw` escape hatch exists exactly for
    // this kind of reach-through.
    for (const subject of subjectObjects(identity.raw)) {
        const raw = readPath(subject, req.field);

        if (raw === undefined) continue;

        const numeric = coerceNumber(raw);

        if (numeric === null) {
            return { matched: false, reason: 'field-not-numeric' };
        }

        if (compareNumber(numeric, req.op, req.value)) {
            return {
                matched: true,
                confidence: 0.95,
                observedValue: numeric,
            };
        }

        return { matched: false, reason: 'threshold-unmet' };
    }

    return { matched: false, reason: 'field-missing' };
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Leaf-matcher signature. Composite kinds (`any-of`, `all-of`) are
 * handled directly in `matchRequirement` so they can recurse without
 * a custom registry lookup.
 */
export type LeafRequirementMatcher<K extends LeafRequirementKind> = (
    requirement: Extract<NodeRequirement, { kind: K }>,
    identity: CredentialIdentity,
) => LeafMatchVerdict;

type LeafRequirementKind = Exclude<NodeRequirement['kind'], 'any-of' | 'all-of'>;

/**
 * The registry maps requirement `kind` → matcher function. Using a
 * plain `Map` (rather than an object literal) preserves type-exact
 * registration semantics under TypeScript's widening rules.
 */
export type RequirementMatcherRegistry = Map<
    LeafRequirementKind,
    LeafRequirementMatcher<LeafRequirementKind>
>;

const registerAll = (registry: RequirementMatcherRegistry): RequirementMatcherRegistry => {
    // Each registration is type-narrowed by construction: the key
    // matches the exact leaf kind the matcher consumes. The `as` is
    // a concession to `Map`'s invariant value types — JavaScript's
    // runtime dispatch on `requirement.kind` is what enforces the
    // pairing, not the compile-time signature here.
    registry.set(
        'credential-type',
        matchCredentialType as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'boost-uri',
        matchBoostUri as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'ctdl-ctid',
        matchCtdlCtid as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'issuer-credential-id',
        matchIssuerCredentialId as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'ob-achievement',
        matchObAchievement as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'ob-alignment',
        matchObAlignment as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'skill-tag',
        matchSkillTag as LeafRequirementMatcher<LeafRequirementKind>,
    );
    registry.set(
        'score-threshold',
        matchScoreThreshold as LeafRequirementMatcher<LeafRequirementKind>,
    );

    return registry;
};

/**
 * Produce a fresh registry pre-populated with the built-in matchers.
 * Callers that want to extend can clone this and register additional
 * kinds; the default registry used by `matchRequirement` is module-
 * level and mutable through `registerRequirementMatcher`.
 */
export const defaultRegistry = (): RequirementMatcherRegistry =>
    registerAll(new Map());

const DEFAULT_REGISTRY = defaultRegistry();

/**
 * Register a matcher for a requirement kind. The kind must already
 * be part of the `NodeRequirement` union — authoring-side schema
 * additions and the matcher registration are two halves of the same
 * PR, by design. This function is idempotent: re-registering the
 * same kind overwrites the previous matcher (useful in tests).
 */
export const registerRequirementMatcher = <K extends LeafRequirementKind>(
    kind: K,
    matcher: LeafRequirementMatcher<K>,
    registry: RequirementMatcherRegistry = DEFAULT_REGISTRY,
): void => {
    // Double cast through `unknown` because `LeafRequirementMatcher<K>`
    // and `LeafRequirementMatcher<LeafRequirementKind>` are contravariant
    // over the requirement parameter; TS can't prove the narrowing is
    // safe statically, but runtime dispatch on `requirement.kind`
    // enforces the pairing correctly.
    registry.set(
        kind,
        matcher as unknown as LeafRequirementMatcher<LeafRequirementKind>,
    );
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Evaluate a `NodeRequirement` against a `CredentialIdentity`.
 *
 * Returns a `MatchVerdict` describing whether the requirement is
 * satisfied, with composite-aware context (child verdicts on failure,
 * satisfying branch indices on success). Pure: never mutates
 * `requirement`, `identity`, or the registry.
 *
 * Unknown leaf kinds return `kind-unsupported` rather than throwing —
 * a corrupt or forward-dated requirement should not crash the
 * reactor; it should just fail to satisfy and leave a breadcrumb.
 */
export const matchRequirement = (
    requirement: NodeRequirement,
    identity: CredentialIdentity,
    registry: RequirementMatcherRegistry = DEFAULT_REGISTRY,
): MatchVerdict => {
    switch (requirement.kind) {
        case 'any-of': {
            if (requirement.of.length === 0) {
                return { matched: false, reason: 'composite-empty' };
            }

            const childVerdicts: MatchVerdict[] = [];
            const satisfiedBy: number[] = [];
            let bestConfidence = 0;

            for (let i = 0; i < requirement.of.length; i++) {
                const child = requirement.of[i];
                const verdict = matchRequirement(child, identity, registry);

                childVerdicts.push(verdict);

                if (verdict.matched) {
                    satisfiedBy.push(i);
                    if (verdict.confidence > bestConfidence) {
                        bestConfidence = verdict.confidence;
                    }
                }
            }

            if (satisfiedBy.length > 0) {
                return { matched: true, confidence: bestConfidence, satisfiedBy };
            }

            return {
                matched: false,
                reason: 'composite-any-all-failed',
                childVerdicts,
            };
        }

        case 'all-of': {
            if (requirement.of.length === 0) {
                return { matched: false, reason: 'composite-empty' };
            }

            const childVerdicts: MatchVerdict[] = [];
            let worstConfidence = 1;

            for (const child of requirement.of) {
                const verdict = matchRequirement(child, identity, registry);

                childVerdicts.push(verdict);

                if (!verdict.matched) {
                    return {
                        matched: false,
                        reason: 'composite-all-one-failed',
                        childVerdicts,
                    };
                }

                if (verdict.confidence < worstConfidence) {
                    worstConfidence = verdict.confidence;
                }
            }

            return { matched: true, confidence: worstConfidence };
        }

        default: {
            const matcher = registry.get(requirement.kind);

            if (!matcher) {
                return { matched: false, reason: 'kind-unsupported' };
            }

            return matcher(requirement, identity);
        }
    }
};

/**
 * Convenience: a short circuit for the very common "does this
 * identity satisfy *any* of these requirements?" question. Returns
 * the first satisfied requirement index, or `-1`.
 */
export const firstSatisfying = (
    requirements: readonly NodeRequirement[],
    identity: CredentialIdentity,
    registry: RequirementMatcherRegistry = DEFAULT_REGISTRY,
): number => {
    for (let i = 0; i < requirements.length; i++) {
        const verdict = matchRequirement(requirements[i], identity, registry);

        if (verdict.matched) return i;
    }

    return -1;
};
