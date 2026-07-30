/**
 * OutcomeSignal — real-world results the pathway is trying to produce.
 *
 * Termination answers *"did the learner execute the pathway?"*.
 * Outcome signals answer *"did executing it produce the intended
 * real-world result?"*. The gap between them is the iteration loop —
 * a pathway can hit 100% termination and still fail its outcome, and
 * we want that visible rather than hidden behind a single green check.
 *
 * Signals are declared at the pathway level (not per-node) because
 * they're about the pathway-as-a-whole, not any individual step.
 * A binding is created when a wallet credential, a self-report, or
 * an explicit learner confirmation satisfies the signal. Bindings
 * are immutable once recorded (replacing a bound VC would lose the
 * record of what actually satisfied the signal at the time); callers
 * that want to re-bind clear the binding first.
 *
 * See architecture doc § 3.8.
 */

import { z } from 'zod';

// -----------------------------------------------------------------
// Shared enums
// -----------------------------------------------------------------

/**
 * Who we consider a trustworthy source for an outcome claim.
 *
 *   - `self`        — the learner said so. Fine for narrative outcomes,
 *                     insufficient for score / enrollment signals.
 *   - `peer`        — another learner or peer endorser.
 *   - `trusted`     — a known issuer inside the LearnCard network
 *                     (registered partner, verified org).
 *   - `institution` — a top-tier issuer (College Board, ETS, an
 *                     accredited college). Required for signals that
 *                     drive policy/funding decisions.
 *
 * The `minTrustTier` on a signal is the *minimum* that will bind; a
 * higher tier always satisfies a lower one.
 */
export const OutcomeTrustTierSchema = z.enum(['self', 'peer', 'trusted', 'institution']);
export type OutcomeTrustTier = z.infer<typeof OutcomeTrustTierSchema>;

const TRUST_TIER_ORDER: Record<OutcomeTrustTier, number> = {
    self: 0,
    peer: 1,
    trusted: 2,
    institution: 3,
};

/**
 * Pure comparator: does `candidate` meet the bar set by `required`?
 * Shared here so matcher and binder agree on tier semantics.
 */
export const meetsTrustTier = (
    candidate: OutcomeTrustTier,
    required: OutcomeTrustTier,
): boolean => TRUST_TIER_ORDER[candidate] >= TRUST_TIER_ORDER[required];

/**
 * Numeric comparison op used by `score-threshold` signals. Kept as an
 * explicit enum (not a free string) so both the matcher and any UI
 * that lets an author pick one stay in lock-step.
 */
export const ComparisonOpSchema = z.enum(['>=', '>', '==', '<=', '<']);
export type ComparisonOp = z.infer<typeof ComparisonOpSchema>;

/**
 * Measurement window relative to the pathway. Outcomes that land
 * outside the window still produce proposals (the learner can
 * manually confirm late bindings), but the auto-binder marks them
 * `outOfWindow` so analytics can separate in-window effectiveness
 * from long-tail outcomes.
 */
export const OutcomeWindowSchema = z.object({
    startFrom: z.enum(['pathway-created', 'pathway-completed']),
    /** Positive integer days. `0` means "no lower bound." */
    durationDays: z.number().int().nonnegative(),
});
export type OutcomeWindow = z.infer<typeof OutcomeWindowSchema>;

// -----------------------------------------------------------------
// Binding — the record of what satisfied the signal
// -----------------------------------------------------------------

export const OutcomeBindingSchema = z.object({
    /** URI of the wallet credential that bound the signal, when applicable. */
    credentialUri: z.string().optional(),

    /** Datetime of binding (not issuance — these can differ). */
    boundAt: z.string().datetime(),

    /**
     * How the binding happened:
     *   - `auto`   — the credential binder matched a wallet VC.
     *   - `manual` — the learner explicitly confirmed the signal.
     */
    boundVia: z.enum(['auto', 'manual']),

    /** Trust tier of the issuer at binding time. */
    issuerTrustTier: OutcomeTrustTierSchema,

    /**
     * For `score-threshold` signals, the numeric value we actually
     * observed on the credential (not the threshold). Lets a later
     * UI say "you scored 1450 (target: 1400)" without re-parsing
     * the VC.
     */
    observedValue: z.union([z.number(), z.string()]).optional(),

    /**
     * `true` when the binding happened outside `window`. Retained as
     * a binding (learner confirmed) but flagged so cohort analytics
     * can split in-window vs. out-of-window effectiveness.
     */
    outOfWindow: z.boolean().default(false),
});
export type OutcomeBinding = z.infer<typeof OutcomeBindingSchema>;

// -----------------------------------------------------------------
// Per-kind predicates (discriminated union)
// -----------------------------------------------------------------

const OutcomeCommonFields = {
    id: z.string().uuid(),
    /** Short human label shown in the pathway outline. */
    label: z.string().min(1),
    description: z.string().optional(),
    minTrustTier: OutcomeTrustTierSchema.default('trusted'),
    window: OutcomeWindowSchema.optional(),
    binding: OutcomeBindingSchema.optional(),
};

/**
 * A credential of a given type arrived in the wallet.
 *
 * The matcher looks at `vc.type` (array) for `expectedCredentialType`.
 * `expectedIssuerDid` is an optional extra guard — useful when the
 * credential type is generic (e.g. `OpenBadgeCredential`) and only a
 * specific issuer counts.
 */
export const CredentialReceivedSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('credential-received'),
    expectedCredentialType: z.string().min(1),
    expectedIssuerDid: z.string().optional(),
});
export type CredentialReceivedSignal = z.infer<typeof CredentialReceivedSignalSchema>;

/**
 * A credential was received AND a numeric field inside
 * `credentialSubject` meets a threshold.
 *
 * The matcher reads `vc.credentialSubject[field]`. Dot paths
 * (`credentialSubject.score.total`) are supported — matcher walks
 * them. Non-numeric values fail the predicate silently.
 */
export const ScoreThresholdSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('score-threshold'),
    expectedCredentialType: z.string().min(1),
    expectedIssuerDid: z.string().optional(),
    field: z.string().min(1),
    op: ComparisonOpSchema,
    value: z.number(),
});
export type ScoreThresholdSignal = z.infer<typeof ScoreThresholdSignalSchema>;

/**
 * An enrollment-type credential arrived. Treated as a specialisation
 * of `credential-received` with a canonical expected type
 * (`EnrollmentCredential`) plus an optional institution hint.
 *
 * Separate kind (rather than a generic preset) so UIs can render
 * an enrollment-shaped card ("Enrolled at Miskatonic U"), and so we
 * can later specialise the matcher without disturbing the general
 * `credential-received` path.
 */
export const EnrollmentSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('enrollment'),
    /** Free-text hint ("University of X", "Common App confirmation"). */
    institutionHint: z.string().optional(),
});
export type EnrollmentSignal = z.infer<typeof EnrollmentSignalSchema>;

/**
 * An employment-verification credential arrived.
 */
export const EmploymentSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('employment'),
    employerHint: z.string().optional(),
});
export type EmploymentSignal = z.infer<typeof EmploymentSignalSchema>;

/**
 * Wage change between two employment VCs. Deliberately left
 * lightweight in v0.5 — real wage telemetry demands a trusted payroll
 * issuer we don't have yet. The schema is here so authors can
 * declare intent; the matcher returns `matched: false` until the
 * issuer roster lands.
 */
export const WageDeltaSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('wage-delta'),
    /** Expected percentage lift. e.g. `0.1` means +10%. */
    minDeltaPercent: z.number().optional(),
});
export type WageDeltaSignal = z.infer<typeof WageDeltaSignalSchema>;

/**
 * Freeform self-report. No auto-binder support; exists so qualitative
 * outcomes (confidence, belonging, agency) can still be declared
 * rather than swept under the rug.
 */
export const SelfReportedSignalSchema = z.object({
    ...OutcomeCommonFields,
    kind: z.literal('self-reported'),
    prompt: z.string().min(1),
});
export type SelfReportedSignal = z.infer<typeof SelfReportedSignalSchema>;

// -----------------------------------------------------------------
// Union
// -----------------------------------------------------------------

export const OutcomeSignalSchema = z.discriminatedUnion('kind', [
    CredentialReceivedSignalSchema,
    ScoreThresholdSignalSchema,
    EnrollmentSignalSchema,
    EmploymentSignalSchema,
    WageDeltaSignalSchema,
    SelfReportedSignalSchema,
]);
export type OutcomeSignal = z.infer<typeof OutcomeSignalSchema>;

export const OUTCOME_SIGNAL_KINDS = [
    'credential-received',
    'score-threshold',
    'enrollment',
    'employment',
    'wage-delta',
    'self-reported',
] as const satisfies ReadonlyArray<OutcomeSignal['kind']>;
