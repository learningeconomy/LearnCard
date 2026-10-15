# Native credential category parity

October 15, 2026. Collection filters and labels use semantic credential categories, independently of the three legacy `CredentialKind` authoring/transport values. Portfolio, Assistance and other web categories must not appear as Achievements merely because their legacy kind is `Achievements`.

## Categories

The Collection filter bar includes Badges, Achievements, Qualifications, Studies, Portfolio, Assistance, Experiences, IDs, Skills, AI Sessions, Pathways and Insights. Unknown partner categories remain readable under All/Other with their original label. Families is kept in the dedicated native Families area, outside Collection's All view and category bar; no Family records are deleted or reindexed.

| Stored web category                           | Native label   |
| --------------------------------------------- | -------------- |
| Social Badge / Merit Badge                    | Badges         |
| Achievement                                   | Achievements   |
| Qualifications                                | Qualifications |
| Learning History / Course                     | Studies        |
| Accomplishment                                | Portfolio      |
| Accommodation                                 | Assistance     |
| Work History / Experience / Resume            | Experiences    |
| ID / Membership / established scout/admin IDs | IDs            |
| Skill                                         | Skills         |
| AI Topic                                      | AI Sessions    |
| AI Pathway                                    | Pathways       |
| AI Insight                                    | Insights       |

Rows, featured cards and credential detail metadata share the same localized label. The filters use `Credential.displayCategory`, not the coarse kind. Selected pills scroll fully into view. English, Spanish, French and Arabic labels are in the native String Catalog. Qualifications uses Colorful `orange-300` (`#FDBA74`) with a bold certificate/seal SVG.

These remain filters over loaded account pages. A selected category's count describes loaded matches; a partial-page caption and Load more remain available. An empty loaded subset is not proof the account has no credentials in that category. AI category filters display existing credential records; they do not implement the deferred native AI apps or change their service permissions.

## Qualifications source and older records

[Web PR #1638](https://github.com/learningeconomy/LearnCard/pull/1638), merged at `aaeca3dad4a899a4ce7e96009ba211b4c27af7a2`, added the canonical category **Qualifications** after this experiment branched. The current upstream shared category metadata, Colorful theme, `credentialHelpers.ts` and `qualificationCategoryBackfill.ts` were audited read-only. The primary checkout was not modified or merged wholesale into the experiment.

`account-runtime/credential-category.ts` adapts the narrow presentation rules without importing web UI dependencies or changing signed payloads/index records:

- Valid explicit issuer `lc:category` tags take priority; the last valid tag wins. The shared valid-category list is reused, extended with Qualifications for this branch's older SDK source.
- License (historically ID), Certification (Achievement), and ApprenticeshipCertificate/JourneymanCertificate/MasterCertificate (Work History) can display as Qualifications when the indexed category is the matching historic value or absent.
- An intentional different category remains intact. Certificate is not Certification. A non-qualification achievement type prevents an unrelated outer type from forcing a move.
- Plain type-based credentials, first subject/achievement arrays and the standard CertifiedBoostCredential wrapper are supported by this narrow read adapter. This is not a general replacement for the web credential parser or its persisted backfill.
- Original signed JSON and account data stay unchanged. No background migration is run.

Missing category fields remain compatible with older native replies using the legacy kind fallback. A nonempty unknown category is no longer silently relabeled as Achievements/IDs.

## Boundaries

Creation still uses the existing three authoring/transport kinds and its current SDK validation. Full authoring parity for all categories, including Qualifications, needs a separate builder/SDK contract update; the new browse filters do not claim that capability. Family creation/invitation restrictions remain unchanged.

Regression coverage includes canonical aliases, category preservation during encoding, unknown/legacy records, Family separation, conservative qualification inference and explicit-tag precedence, proof preservation, independent Portfolio/Qualifications filtering, scoped search, metadata labels and French/Arabic dark layouts. Exact results and installed-build evidence are tracked in [TESTING](TESTING.md) and [STATUS](STATUS.md).
