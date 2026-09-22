# CLR fixture scenarios

## LC-2184: beyond academic transcripts

These six **synthetic, unsigned display/issuance templates** extend the existing
academic CLR corpus. Both the enclosing CLR and the embedded achievement
credentials intentionally omit proofs. `validity: 'valid'` follows the library's
unsigned-template convention; it is not a claim of cryptographic verification or
1EdTech certification.

The data uses the VC v2, OBv3 3.0.3, and cached CLR v2 contexts already used by
the library. The outer context adds explicit mappings for `partial` and the
learner `identifier`, which the cached CLR context does not retain during
JSON-LD signing. The [CLR 2.0 errata](https://www.imsglobal.org/spec/clr/v2p0/errata)
describes the `identifier` context gap. The versioned CLR 2.0.1 context is not
bundled in the current DIDKit runtime, so these samples use the cached URL plus
those mappings for local signing checks.
Category names here are scenario labels, not new CLR properties or enums.
There are no changes to the production renderer, schemas, wallet categorization,
server endpoints, or existing fixtures.

| Fixture ID                             | Children | What to inspect                                                                                                                                                                    |
| -------------------------------------- | -------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clr/employment-record`                |        3 | Workplace role, activity interval, distinct award/validity dates, assessor and creator, fieldwork hours, rubric-level-only competency result.                                      |
| `clr/training-provider-record`         |        4 | Non-credit course, score/required score, completion certificate, in-progress training, explicitly labeled hours, no GPA or academic term.                                          |
| `clr/military-training-record`         |        3 | Fictional non-combat logistics training, fieldwork role, assessment source, rubric level, and a training recognition award.                                                        |
| `clr/professional-organization-record` |        3 | Membership period and identifier, volunteer mentoring, and development evidence issued by a separate provider.                                                                     |
| `clr/licensing-regulatory-record`      |        3 | Synthetic license number, distinct validity windows, expired historical certification, renewal, and multiple issuer profiles.                                                      |
| `clr/mixed-career-record`              |        6 | A course first, followed by employment activity, membership, apprenticeship, competency and license. Non-course records must not disappear when the transcript layout is selected. |

### Discover and preview

```ts
import { getFixtures, clrMixedCareerRecord } from '@learncard/credential-library';

const scenarios = getFixtures({ spec: 'clr-v2', tags: ['lc-2184'] });
const previewPayload = structuredClone(clrMixedCareerRecord.credential);
```

All fixtures are registered in `ALL_FIXTURES` and named-exported, so the existing
credential viewer can discover them. The patch does not alter that viewer's UI.
For a raw JSON preview use the unsigned payload; a real issued/claimable record
requires the normal signing/delivery workflow.

### Review checklist

Compare the source JSON with the current app, recording omissions rather than
changing source data to match a renderer limitation:

1. Keep every child reachable when courses and other achievement types coexist.
2. Preserve `Membership`, `Fieldwork`, `CommunityService`,
   `CertificateOfCompletion`, and `ApprenticeshipCertificate` data even when there
   is no specialized section.
3. Display child issuers separately from the CLR publisher. `source` is assessor
   attribution; `achievement.creator` describes the achievement author.
4. Keep activity start/end, `awardedDate`, `validFrom`, and `validUntil` separate.
   The employment fixture deliberately uses three different event dates.
5. Preserve an achieved-level-only `Result`. Resolve `achievedLevel` and
   `requiredLevel` within the associated achievement's `resultDescription`.
6. Show stated score requirements without manufacturing pass/fail claims.
7. Show membership identifiers and `licenseNumber` with appropriate labels.
   The membership identity type is the extensible value `ext:membershipId`.
8. Do not translate labeled participation hours into academic credits or CEUs.
9. Keep narrative-only evidence visible even though it has no download URL.
10. Render a partial record as partial, not necessarily as a partial transcript.
11. Resolve `association.sourceId`/`targetId` to achievement IDs; those are not
    interchangeable with the containing credential IDs.
12. Do not label a whole collection expired just because one historical child is
    expired. The licensing fixture's snapshot is **2026-09-01** and its outer
    `validUntil` is **2030-08-31**; one child expired on **2025-01-31**.

The mixed fixture includes exact copies of selected source child credentials, with
their IDs retained deliberately. Their in-memory objects are independent. This
also supplies a realistic cross-collection deduplication scenario.

### Signing and recipient binding

These are not pre-signed CLRs. `did:example` identifiers have no resolvable keys.
Do not add fabricated `proof` objects just to make verification UI look successful.

`prepareFixture()` changes the **outer** issuer, subject and timestamps and remaps
UUID references throughout the document. It does not recursively bind or sign
embedded credentials. Consequently, calling it once and signing only the outer
record does not establish independent child verification or same-learner binding
after a recipient change.

For an end-to-end multi-issuer test:

-   Start from a cloned unsigned fixture and prepare/remap IDs before any signing.
-   Bind the outer and all child subjects to the intended test learner. Replace or
    remove the synthetic display-name/membership identifiers where appropriate.
-   Map each fictional issuer to its own test signing wallet. Keep assessor/creator
    provenance distinct instead of treating every profile as the signer.
-   Sign each child with its mapped issuer, preserving achievement and result IDs.
-   Embed the resulting children unchanged and sign the outer CLR with the publisher.
-   Verify parent and children independently using the intended time and status policy.

Do not run UUID/identity rewriting over already-signed child credentials. Avoid
routing these rich payloads through a lossy form-template round trip during display
review. Direct JSON/template previews are not equivalent to verified credentials.

### Deliberate boundaries

All people and organizations are fictional. `.example` framework/profile URLs
are identifiers for sample data, not live downloads or real qualification links.
Evidence is intentionally narrative-only to keep samples self-contained. No real
employment, licensing authorization, military rank, clearance or cross-domain
qualification equivalence is asserted.

There are no fake status-list services, JWTs, endorsements, remote images, or
invented sector-specific CLR properties. `Result.status: Completed` describes the
recorded outcome, not current license standing. `partial` is explicitly true
because these scenarios are selected record excerpts.

`Provisional` status and arbitrary external employment-VC schemas are not part of
these baseline fixtures: those need separate validator/adapter coverage rather
than registering known incompatible data as a supported baseline.

### Tests

From `packages/credential-library` in an installed workspace:

```sh
bun run test -- src/__tests__/clr-non-academic.test.ts
bun run test
bun run test:integration
```

The new suite tests registration, local shared unsigned validators, consistent
learner identity, association/result/rubric references, UUID remapping, immutable
fixture inputs, scenario-specific fields and deliberate expired-child behavior.
The existing integration issuance suite discovers all six through the registry
and can sign each outer CLR using its bundled contexts.
That suite's outer-proof assertion alone is not recursive CLR conformance testing.

These fixture tests do not assert that missing UI support has already been fixed.
Use the scenarios for manual app review and add renderer tests with each follow-on
implementation ticket.

References: [CLR v2](https://www.imsglobal.org/spec/clr/v2p0),
[Open Badges v3](https://www.imsglobal.org/spec/ob/v3p0),
[credential library](../../../README.md).
