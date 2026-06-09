/**
 * outcomeMatcher — deterministic VC → OutcomeSignal predicate.
 *
 * Called by the credential binder (`agents/credentialBinder.ts`) when
 * a new credential lands in the wallet. Pure, schema-agnostic: walks
 * a plain-object VC (W3C VC / OBv3 / Boost — they share the fields
 * we read here) and decides whether the claim satisfies a given
 * signal's predicate.
 *
 * The matcher never mutates state and never produces a proposal — it
 * only answers "does this VC satisfy this signal, and if so, how
 * confidently?" Callers layer the proposal-emission and trust-tier
 * checks on top.
 *
 * See `types/outcome.ts` for the signal shapes and architecture doc
 * § 3.8 for the overall design.
 */

import type {
    CredentialReceivedSignal,
    EmploymentSignal,
    EnrollmentSignal,
    OutcomeSignal,
    OutcomeTrustTier,
    ScoreThresholdSignal,
    SelfReportedSignal,
    WageDeltaSignal,
} from '../types';

// -----------------------------------------------------------------
// Input shape — the subset of a VC we read
// -----------------------------------------------------------------

/**
 * A permissive VC-like shape. We only read the fields that every
 * real format (W3C VC v1/v2, OBv3, CLR v2, Boost) populates the same
 * way, so we can match across formats without branching.
 */
export interface VcLike {
    /** `type` may arrive as a string or an array of strings. */
    type?: string | string[];

    /** Issuer — may be a string DID or an `{ id: string }` object. */
    issuer?: string | { id?: string; [k: string]: unknown };

    /** Issuance date when available — used for window-of-effect checks. */
    issuanceDate?: string;
    validFrom?: string;

    /** The claim body. */
    credentialSubject?: Record<string, unknown> | Array<Record<string, unknown>>;

    /** Everything else — accepted and ignored. */
    [k: string]: unknown;
}

// -----------------------------------------------------------------
// Result shape
// -----------------------------------------------------------------

/**
 * Match verdict. A `matched` result carries enough context for the
 * binder to construct an `OutcomeBinding`:
 *
 *   - `observedValue` — the raw value read from the VC, if the signal
 *     kind expects one (`score-threshold`). Stored on the binding so
 *     surfaces can render "you scored 1450 (target 1400)" without
 *     re-parsing.
 *   - `outOfWindow` — true when the VC arrived outside the signal's
 *     declared window. The binder still proposes in that case; the
 *     flag tags the binding for analytics.
 *   - `confidence` — 0..1. We only ship strong (≥0.8) and weak
 *     (~0.5) right now. Speculative `wage-delta` paths return
 *     `matched: false` in v0.5 because the trusted payroll issuer
 *     roster isn't ready; the schema is here so authors can declare
 *     intent.
 */
export type MatchResult =
    | {
          matched: false;
          reason: MatchFailureReason;
      }
    | {
          matched: true;
          confidence: number;
          observedValue?: number | string;
          outOfWindow: boolean;
      };

export type MatchFailureReason =
    | 'kind-unsupported'
    | 'type-mismatch'
    | 'issuer-mismatch'
    | 'field-missing'
    | 'field-not-numeric'
    | 'threshold-unmet'
    | 'pending-implementation';

// -----------------------------------------------------------------
// VC-shape helpers
// -----------------------------------------------------------------

const asTypeArray = (type: VcLike['type']): string[] => {
    if (!type) return [];
    if (typeof type === 'string') return [type];

    return type;
};

const issuerId = (issuer: VcLike['issuer']): string | null => {
    if (!issuer) return null;
    if (typeof issuer === 'string') return issuer;
    if (typeof issuer === 'object' && typeof issuer.id === 'string') return issuer.id;

    return null;
};

const subjectObjects = (vc: VcLike): Array<Record<string, unknown>> => {
    const subject = vc.credentialSubject;

    if (!subject) return [];
    if (Array.isArray(subject)) return subject;

    return [subject];
};

/**
 * Walk a dot path (`credentialSubject.score.total`, `score.total`,
 * or `total`) against one subject object. The first segment is
 * allowed to be `credentialSubject` — the matcher strips it so
 * authors can write either style. Returns `undefined` on any miss.
 */
const readPath = (subject: Record<string, unknown>, path: string): unknown => {
    const segments = path.split('.').filter(Boolean);

    const normalized = segments[0] === 'credentialSubject' ? segments.slice(1) : segments;

    let cursor: unknown = subject;

    for (const seg of normalized) {
        if (cursor === null || cursor === undefined) return undefined;
        if (typeof cursor !== 'object') return undefined;

        cursor = (cursor as Record<string, unknown>)[seg];
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
    op: ScoreThresholdSignal['op'],
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

// -----------------------------------------------------------------
// Window helpers
// -----------------------------------------------------------------

export interface PathwayTiming {
    createdAt: string;
    completedAt?: string;
}

/**
 * Did `vc.issuanceDate` (or `validFrom`) land inside the signal's
 * window, measured from `pathway.createdAt` or `pathway.completedAt`?
 *
 * When the signal has no window, or the VC has no issuance date, we
 * return `inWindow: true` — it's a declaration of intent, not a
 * guard. Callers that want strict windowing can check `signal.window`
 * themselves before matching.
 */
export const checkWindow = (
    signal: OutcomeSignal,
    vc: VcLike,
    pathway: PathwayTiming,
): { inWindow: boolean } => {
    if (!signal.window) return { inWindow: true };

    const issued = vc.issuanceDate ?? vc.validFrom;
    if (!issued) return { inWindow: true };

    const issuedAt = new Date(issued).getTime();
    if (!Number.isFinite(issuedAt)) return { inWindow: true };

    const startRef =
        signal.window.startFrom === 'pathway-created'
            ? pathway.createdAt
            : pathway.completedAt ?? pathway.createdAt;

    const startAt = new Date(startRef).getTime();
    if (!Number.isFinite(startAt)) return { inWindow: true };

    const windowMs = signal.window.durationDays * 24 * 60 * 60 * 1000;

    // `durationDays = 0` means "no lower bound on long-tail
    // observations"; anything after `startAt` counts as in-window.
    const upperBound = windowMs === 0 ? Number.POSITIVE_INFINITY : startAt + windowMs;

    const inWindow = issuedAt >= startAt && issuedAt <= upperBound;

    return { inWindow };
};

// -----------------------------------------------------------------
// Per-kind matchers
// -----------------------------------------------------------------

const typeMatches = (vc: VcLike, expected: string): boolean => {
    const types = asTypeArray(vc.type);

    // Generous match: case-insensitive, trim `ceterms:`-style prefixes.
    const expectedLc = expected.toLowerCase();

    return types.some(t => {
        const lc = t.toLowerCase();

        if (lc === expectedLc) return true;

        // Strip common namespace prefixes.
        const stripped = lc.replace(/^.*[:/]/, '');

        return stripped === expectedLc.replace(/^.*[:/]/, '');
    });
};

const issuerMatches = (vc: VcLike, expected: string | undefined): boolean => {
    if (!expected) return true;

    return issuerId(vc.issuer) === expected;
};

const matchCredentialReceived = (signal: CredentialReceivedSignal, vc: VcLike): MatchResult => {
    if (!typeMatches(vc, signal.expectedCredentialType)) {
        return { matched: false, reason: 'type-mismatch' };
    }

    if (!issuerMatches(vc, signal.expectedIssuerDid)) {
        return { matched: false, reason: 'issuer-mismatch' };
    }

    return { matched: true, confidence: 0.9, outOfWindow: false };
};

const matchScoreThreshold = (signal: ScoreThresholdSignal, vc: VcLike): MatchResult => {
    if (!typeMatches(vc, signal.expectedCredentialType)) {
        return { matched: false, reason: 'type-mismatch' };
    }

    if (!issuerMatches(vc, signal.expectedIssuerDid)) {
        return { matched: false, reason: 'issuer-mismatch' };
    }

    // Try every subject in turn so multi-subject VCs resolve against
    // whichever object actually holds the score.
    for (const subject of subjectObjects(vc)) {
        const raw = readPath(subject, signal.field);

        if (raw === undefined) continue;

        const numeric = coerceNumber(raw);

        if (numeric === null) {
            return { matched: false, reason: 'field-not-numeric' };
        }

        if (compareNumber(numeric, signal.op, signal.value)) {
            return {
                matched: true,
                confidence: 0.95,
                observedValue: numeric,
                outOfWindow: false,
            };
        }

        return { matched: false, reason: 'threshold-unmet' };
    }

    return { matched: false, reason: 'field-missing' };
};

/**
 * Enrollment matcher: accepts any VC whose type array includes a
 * recognised enrollment shape. The list is intentionally short — we
 * only match things we can honestly call "enrollment" today, and
 * grow it as issuers in the network normalise.
 */
const ENROLLMENT_TYPES = [
    'EnrollmentCredential',
    'EnrollmentVerification',
    'AdmissionCredential',
];

const matchEnrollment = (_signal: EnrollmentSignal, vc: VcLike): MatchResult => {
    const types = asTypeArray(vc.type).map(t => t.replace(/^.*[:/]/, '').toLowerCase());

    const hit = ENROLLMENT_TYPES.some(expected => types.includes(expected.toLowerCase()));

    if (!hit) return { matched: false, reason: 'type-mismatch' };

    return { matched: true, confidence: 0.85, outOfWindow: false };
};

const EMPLOYMENT_TYPES = [
    'EmploymentCredential',
    'EmploymentVerification',
    'WorkExperienceCredential',
];

const matchEmployment = (_signal: EmploymentSignal, vc: VcLike): MatchResult => {
    const types = asTypeArray(vc.type).map(t => t.replace(/^.*[:/]/, '').toLowerCase());

    const hit = EMPLOYMENT_TYPES.some(expected => types.includes(expected.toLowerCase()));

    if (!hit) return { matched: false, reason: 'type-mismatch' };

    return { matched: true, confidence: 0.85, outOfWindow: false };
};

const matchWageDelta = (_signal: WageDeltaSignal, _vc: VcLike): MatchResult => {
    // v0.5 deliberately never auto-binds wage-delta. A trustworthy
    // payroll issuer roster doesn't exist yet, and self-reported
    // wages would poison cohort analytics. Leaving the schema in
    // place so authors can declare the intent; auto-bind lights up
    // when the issuer side ships.
    return { matched: false, reason: 'pending-implementation' };
};

const matchSelfReported = (_signal: SelfReportedSignal, _vc: VcLike): MatchResult => {
    // Self-reported signals never auto-bind from a wallet credential.
    // They require a human in the loop (the learner confirming the
    // prompt) — the binder emits a `manual` proposal path for those
    // separately.
    return { matched: false, reason: 'kind-unsupported' };
};

// -----------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------

/**
 * Decide whether `vc` satisfies `signal`.
 *
 * The return shape is stable across every signal kind so the binder
 * can propose or skip uniformly. Trust-tier enforcement is deliberately
 * *not* done here — the matcher answers the data question; the binder
 * answers the trust question. Separating keeps each piece unit-testable
 * without dragging in an issuer registry.
 */
export const matchVcAgainstOutcome = (signal: OutcomeSignal, vc: VcLike): MatchResult => {
    switch (signal.kind) {
        case 'credential-received':
            return matchCredentialReceived(signal, vc);

        case 'score-threshold':
            return matchScoreThreshold(signal, vc);

        case 'enrollment':
            return matchEnrollment(signal, vc);

        case 'employment':
            return matchEmployment(signal, vc);

        case 'wage-delta':
            return matchWageDelta(signal, vc);

        case 'self-reported':
            return matchSelfReported(signal, vc);
    }
};

// -----------------------------------------------------------------
// Trust helpers (exported for the binder)
// -----------------------------------------------------------------

/**
 * Classify an issuer DID into the trust tiers used by outcome
 * bindings. v0.5 is intentionally coarse: every DID resolves to
 * `trusted` unless the caller overrides via `trustedIssuers` /
 * `institutionIssuers` sets. A real issuer registry (Phase 3b)
 * replaces this with a proper lookup.
 *
 * The helper is colocated with the matcher (not the binder) because
 * outcome matching and trust classification are both pure data
 * operations — the binder is the only layer that should be aware
 * of *state*.
 */
export interface IssuerTrustRegistry {
    institutionIssuers?: Set<string>;
    trustedIssuers?: Set<string>;
    peerIssuers?: Set<string>;
}

export const classifyIssuerTrust = (
    issuerDid: string | null,
    registry: IssuerTrustRegistry = {},
): OutcomeTrustTier => {
    if (!issuerDid) return 'self';

    if (registry.institutionIssuers?.has(issuerDid)) return 'institution';
    if (registry.trustedIssuers?.has(issuerDid)) return 'trusted';
    if (registry.peerIssuers?.has(issuerDid)) return 'peer';

    // Default for any signed VC with a resolvable DID. The v0.5
    // ecosystem is small enough that most DIDs we see are actually
    // trusted-tier; we'll tighten this when the registry lands and
    // the "unknown" default becomes dangerous.
    return 'trusted';
};
