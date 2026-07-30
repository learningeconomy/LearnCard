/**
 * NodeRequirement — the pluggable, recursive rule DSL that says
 * "this external evidence satisfies this node".
 *
 * ## Why this exists (and why it's distinct from OutcomeSignal)
 *
 * `OutcomeSignal` (`types/outcome.ts`) answers the *pathway-level*
 * question: "did executing the pathway produce the real-world result
 * the learner was aiming at?" Those signals are few and coarse
 * (enrollment, employment, score-threshold, self-reported) and they
 * bind once at the pathway level.
 *
 * `NodeRequirement` answers a completely different question: "did
 * *this specific* external event (a credential claim, a tutor
 * session end, a skill-tag match) complete *this specific* node's
 * termination?". That question has to cover a much messier space:
 *
 *   - Credentials identify themselves through a zoo of schemes —
 *     W3C `type` + `issuer`, LearnCard boost URIs, Credential Engine
 *     Registry CTIDs, OBv3 `achievement.id`, OBv3 `alignments[].targetUrl`,
 *     skill-tag URIs (CASE / ASN / Rich Skill Descriptors), the
 *     learner's wallet-local record id — and pathway authors need
 *     to be able to name any of them.
 *   - Authors want to express "this node completes if the learner
 *     earns a Coursera AWS cert **OR** an Udemy AWS cert **OR**
 *     anything with these three skill tags". That's boolean
 *     composition — `any-of` / `all-of` — which can't be expressed
 *     inside a single flat `OutcomeSignal`.
 *   - New identity schemes appear (new OBv3 minor, new CTDL dialect,
 *     a new issuer convention) faster than we want to version the
 *     core pathway schema. Extensibility has to come through
 *     *adding* requirement kinds, not mutating existing ones.
 *
 * Keeping this separate from `OutcomeSignal` means the two systems
 * can evolve independently: the outcome system stays stable and
 * narrow; the requirement system grows as the credential ecosystem
 * does. A thin adapter can later let outcome signals be evaluated
 * through the same matcher registry (`core/nodeRequirementMatcher`),
 * but they remain authored and persisted as `OutcomeSignal`.
 *
 * ## Shape
 *
 * `NodeRequirement` is a **recursive discriminated union** — every
 * leaf kind is a self-contained predicate, and two composite kinds
 * (`any-of`, `all-of`) wrap arrays of requirements to build boolean
 * expressions. The recursion is intentional; authors in the wild
 * quickly want things like "((boost A) OR (boost B)) AND (any
 * credential with skill X)" and a flat union can't express that.
 *
 * The matcher (`core/nodeRequirementMatcher.ts`) walks this tree
 * against a `CredentialIdentity` (`core/credentialIdentity.ts`) — a
 * normalised shape extracted once per credential from any VC format.
 * Both sides are pure; the reactor
 * (`events/pathwayProgressReactor.ts`) is the only stateful layer.
 *
 * ## Trust
 *
 * Trust-tier enforcement (`minTrustTier`) lives on the *termination*
 * that wraps a `NodeRequirement` — not on the requirement itself.
 * That mirrors the `OutcomeSignal` design where trust is a
 * binding-time policy question, not a data-match question. The
 * matcher's job is "does this evidence satisfy this predicate?";
 * the binder's job is "given that it does, should we trust the
 * issuer enough to record the satisfaction?". Keeping those
 * separate keeps each piece unit-testable in isolation.
 */

import { z } from 'zod';

import { ComparisonOpSchema } from './outcome';

// ---------------------------------------------------------------------------
// Leaf kinds — each is a single, self-contained predicate.
// ---------------------------------------------------------------------------

/**
 * Classic W3C-style match: the credential's `type` array contains
 * `type`, and (optionally) the issuer DID equals `issuer`. This is
 * the most common leaf; it's what `OutcomeSignal.credential-received`
 * has always done, just factored out so every other leaf kind can
 * coexist with it.
 *
 * Type matching is case-insensitive and strips namespace prefixes
 * (`ceterms:` / `https://w3id.org/openbadges#`) — see
 * `core/nodeRequirementMatcher` for the exact rule. Authors should
 * not be forced to guess at the issuer's namespacing.
 */
export const CredentialTypeRequirementSchema = z.object({
    kind: z.literal('credential-type'),
    /** Short type name, e.g. `AWSCertifiedCloudPractitioner`. */
    type: z.string().min(1),
    /** Optional issuer DID guard. Absent = any issuer that clears trust. */
    issuer: z.string().optional(),
});
export type CredentialTypeRequirement = z.infer<typeof CredentialTypeRequirementSchema>;

/**
 * Match a LearnCard boost by its canonical wallet URI. Use this
 * when the author knows exactly which boost artefact counts — e.g.
 * the first-party AWS IAM Deep Dive boost that launches the AI tutor
 * for this node. Exact string equality; no namespace stripping
 * because boost URIs are canonical.
 */
export const BoostUriRequirementSchema = z.object({
    kind: z.literal('boost-uri'),
    uri: z.string().min(1),
});
export type BoostUriRequirement = z.infer<typeof BoostUriRequirementSchema>;

/**
 * Match by Credential Engine Registry CTID (`ce-<uuid>`). This is
 * how CTDL-imported pathways reference real-world credentials
 * without depending on a LearnCard boost ever being issued: the
 * pathway author points at "whatever the learner claims with this
 * CTID". When a VC arrives whose `sourceCtid` / provenance matches,
 * the node completes.
 */
export const CtdlCtidRequirementSchema = z.object({
    kind: z.literal('ctdl-ctid'),
    ctid: z.string().regex(/^ce-[0-9a-f-]{32,}$/i, 'Expected CTID of the form ce-<uuid>'),
});
export type CtdlCtidRequirement = z.infer<typeof CtdlCtidRequirementSchema>;

/**
 * Match a specific credential by its W3C `id` **scoped to an
 * issuer**. Some ecosystems (federated learning records, enterprise
 * transcripts) mint stable credential ids that are unique *within
 * the issuer*; this leaf pins both halves so collisions across
 * issuers don't produce false matches.
 */
export const IssuerCredentialIdRequirementSchema = z.object({
    kind: z.literal('issuer-credential-id'),
    issuerDid: z.string().min(1),
    credentialId: z.string().min(1),
});
export type IssuerCredentialIdRequirement = z.infer<typeof IssuerCredentialIdRequirementSchema>;

/**
 * Match by OBv3 `credentialSubject.achievement.id`. OBv3 bakes a
 * stable achievement identifier into every open-badge credential;
 * this leaf lets a pathway author name an OB achievement directly
 * without caring about the issuer's VC `type` conventions (which
 * tend to be inconsistent).
 */
export const ObAchievementRequirementSchema = z.object({
    kind: z.literal('ob-achievement'),
    achievementId: z.string().min(1),
});
export type ObAchievementRequirement = z.infer<typeof ObAchievementRequirementSchema>;

/**
 * Match by any OBv3 `achievement.alignments[].targetUrl`. Alignments
 * point at external frameworks (CASE, ASN, employer competency
 * frames, …) — a pathway author can say "any credential aligned to
 * this Rich Skill Descriptor counts" without naming issuers. This
 * is the most author-friendly way to express "proof of X" when many
 * issuers produce equivalent evidence.
 */
export const ObAlignmentRequirementSchema = z.object({
    kind: z.literal('ob-alignment'),
    targetUrl: z.string().url(),
});
export type ObAlignmentRequirement = z.infer<typeof ObAlignmentRequirementSchema>;

/**
 * Match by a normalised skill tag — a URI from a public skills
 * registry (CASE, ASN, O*NET, Rich Skill Descriptors) OR a local
 * tag the authoring tool extracted from the credential. We treat
 * tag comparison as string-equal in v0.5; fuzzy / semantic
 * matching is out of scope until the skills registry is stable.
 * Authors who want fuzziness use `any-of` with explicit tag URIs.
 *
 * `minConfidence` is reserved for when the matcher graduates to
 * confidence-scored matching — unused today, accepted so callers
 * can author forward-compatibly.
 */
export const SkillTagRequirementSchema = z.object({
    kind: z.literal('skill-tag'),
    tag: z.string().min(1),
    minConfidence: z.number().min(0).max(1).optional(),
});
export type SkillTagRequirement = z.infer<typeof SkillTagRequirementSchema>;

/**
 * Credential-arrived AND a numeric field inside its
 * `credentialSubject` meets a threshold. Shares shape with
 * `ScoreThresholdSignal` from the outcomes system so both systems
 * can route through the same matcher implementation; kept as its
 * own kind here so the two schemas remain independent.
 */
export const ScoreThresholdRequirementSchema = z.object({
    kind: z.literal('score-threshold'),
    type: z.string().min(1),
    field: z.string().min(1),
    op: ComparisonOpSchema,
    value: z.number(),
    issuer: z.string().optional(),
});
export type ScoreThresholdRequirement = z.infer<typeof ScoreThresholdRequirementSchema>;

// ---------------------------------------------------------------------------
// Recursive composition — `any-of` (OR) and `all-of` (AND).
// ---------------------------------------------------------------------------

// Flat leaf union declared separately so composite kinds can
// reference it without triggering zod's discriminator limitations
// with lazy recursion.
const LeafRequirementSchema = z.discriminatedUnion('kind', [
    CredentialTypeRequirementSchema,
    BoostUriRequirementSchema,
    CtdlCtidRequirementSchema,
    IssuerCredentialIdRequirementSchema,
    ObAchievementRequirementSchema,
    ObAlignmentRequirementSchema,
    SkillTagRequirementSchema,
    ScoreThresholdRequirementSchema,
]);

/**
 * Recursive TS representation of the union. Zod's `lazy` gives us
 * the runtime schema below; TS needs an explicit type so editors
 * resolve property access inside composite branches without
 * tripping over `z.ZodType<unknown>`.
 */
export type NodeRequirement =
    | CredentialTypeRequirement
    | BoostUriRequirement
    | CtdlCtidRequirement
    | IssuerCredentialIdRequirement
    | ObAchievementRequirement
    | ObAlignmentRequirement
    | SkillTagRequirement
    | ScoreThresholdRequirement
    | { kind: 'any-of'; of: NodeRequirement[] }
    | { kind: 'all-of'; of: NodeRequirement[] };

/**
 * Runtime schema mirroring `NodeRequirement`. Declared with
 * `z.lazy` because two of its branches recursively reference the
 * schema itself. The explicit `ZodType<NodeRequirement>` annotation
 * tells zod's type inference to trust the recursive shape rather
 * than widening to `unknown`.
 *
 * The non-empty `min(1)` on composite branches is load-bearing: an
 * empty `any-of` is vacuously false (no child can match) and an
 * empty `all-of` is vacuously true (no child need match) — both are
 * authoring mistakes, not legitimate evaluations. We reject them at
 * parse time rather than baking the ambiguity into the matcher.
 */
export const NodeRequirementSchema: z.ZodType<NodeRequirement> = z.lazy(() =>
    z.union([
        LeafRequirementSchema,
        z.object({
            kind: z.literal('any-of'),
            of: z.array(NodeRequirementSchema).min(1),
        }),
        z.object({
            kind: z.literal('all-of'),
            of: z.array(NodeRequirementSchema).min(1),
        }),
    ]),
);

// ---------------------------------------------------------------------------
// Convenience constants
// ---------------------------------------------------------------------------

/**
 * Enumerates every requirement kind. Useful for exhaustive switches
 * in test fixtures and authoring UI pickers so adding a new kind
 * produces a compiler error everywhere the list is consumed.
 */
export const NODE_REQUIREMENT_KINDS = [
    'credential-type',
    'boost-uri',
    'ctdl-ctid',
    'issuer-credential-id',
    'ob-achievement',
    'ob-alignment',
    'skill-tag',
    'score-threshold',
    'any-of',
    'all-of',
] as const satisfies ReadonlyArray<NodeRequirement['kind']>;
