# Native personal Skills and goals — October 18, 2026

This is the source audit and first implementation contract for the next learner slice. The [concept boards](design/LEARNER_SKILLS_BRIEF.md) cover personal Skills/goals and the subsequent career-exploration destination. They are generated sample screens, not installed native features. The [wider learning plan](LEARNER_LEARNING_PLAN.md) remains authoritative for sequencing and exclusions.

## Placement and scope

Keep Home / Passport / Inbox / Apps. Add Skills & goals and career exploration to a distinct first-party learning group in Apps, using the existing [LearnCard utilities composition](ios/Sources/ConsumerAppsView.swift). Home continuation can follow when real personal state and availability justify it. There is no fifth tab, desktop side menu or organization-role prerequisite for a learner's own Skills.

Start with reading supported credential-linked skills and personal goals, opening their source credentials, and explicit goal editing. Follow with choosing supported existing skills and self-assessment after the replacement-write contract below is resolved. Career search/detail follows its own provider and policy audit. Journeys Today/map/progress and Sessions/Insights remain later integrations.

Framework names and read-only context can explain where a skill came from. Framework/taxonomy creation, editing, publishing and assessment builders remain excluded, along with institutional administration and Journey authoring. Optional salary/employment questions must not become mandatory onboarding or a student completion score.

## Evidence checked

Personal Skills/profile code was inspected on this worktree at `cc3f6d7a0905357aa2c904dc3b28ee4870555253`. Journeys defaults were also inspected on freshly fetched `origin/main` at `f7f37e319` on October 18. This was read-only source analysis; no live profile, consent, credential or rollout changes were made.

| Concern                  | Current source                                                                                                                                                                          | Native implication                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Learner Skills entry     | [SkillsPage](../learn-card-app/src/pages/skills/SkillsPage.tsx), [routes](../learn-card-app/src/routes.tsx)                                                                             | The personal hub is separate from its conditional admin panel and is not wrapped in the career AI gate. Do not port the admin panel. |
| Credential sources       | [useGetCredentialsForSkills](../../packages/learn-card-base/src/react-query/queries/vcQueries.ts), [useAlignments](../learn-card-app/src/hooks/useAlignments.ts)                        | Preserve actual credential provenance and supported framework identity; a display name alone is not an identity.                     |
| Personal selection       | [self-assigned skill queries](../../packages/learn-card-base/src/react-query/queries/queries.ts), [boost mutations](../../packages/learn-card-base/src/react-query/mutations/boosts.ts) | Personal self-assessment uses a separate Boost/credential lifecycle, not a new preference array.                                     |
| Profile storage          | [useVerifiableData](../../packages/learn-card-base/src/hooks/useVerifiableData.ts)                                                                                                      | Reuse the current encrypted VC/index wire format and existing keys. Older helper descriptions are stale.                             |
| Goals and profile writes | [SkillProfileStep1](../learn-card-app/src/pages/ai-pathways/ai-pathways-skill-profile/SkillProfileStep1.tsx)                                                                            | Save explicitly, preserve untouched data, and account for existing contract synchronization.                                         |
| Existing sharing         | [syncAllCredentials](../../packages/learn-card-base/src/react-query/mutations/syncAllCredentials.ts)                                                                                    | Existing consented agreements can include these records; provide a real route to review sharing.                                     |
| AI availability          | [useAiFeatureGate](../../packages/learn-card-base/src/hooks/useAiFeatureGate.ts), [AiPathways](../learn-card-app/src/pages/ai-pathways/AiPathways.tsx)                                  | Career AI availability is age/profile/privacy dependent. A route or learner role cannot grant access.                                |

## Credential-linked skills and self-assessment

The web query reads nine credential categories: learning history, badges, achievements, accomplishments, work history, accommodations, IDs, skills and self-assigned skills. It resolves originals and sorts by issuance date. Its alignment projection currently examines `boostCredential.credentialSubject.achievement.alignment`, groups by `targetUrl`, carries framework/skill IDs and source credentials, and filters to configured global frameworks.

Native should preserve those identities and source URIs, distinguish an unavailable source from a missing skill, and report partial reads/paging honestly. Confirm which native wrapper and standard Open Badges alignment shapes are supported instead of assuming every original has the web wrapper. Do not mutate signed originals or manufacture a credential from a skill label. Counts mean actual distinct sources, not verified mastery; deduplicate source identity before counting.

The [web proficiency values](../learn-card-app/src/pages/skills/skillTypes.ts) are Hidden `0`, Novice `1`, Beginner `2`, Proficient `3`, Advanced `4`, Expert `5`. Preserve their wire semantics where supported, with an explicit **Self-assessed** label. An institution-linked skill and the learner's assessment can coexist. Neither a self-rating nor a colorful medallion proves mastery, issuer trust or endorsement.

The current `useManageSelfAssignedSkillsBoost` implementation fetches the existing personal Boost, deletes matching old credential records, updates/creates the Boost, sends it to the learner with encryption and no notification, then reads, uploads and indexes the replacement. Success also updates consent synchronization and queues insight refresh.

**Do not copy the delete-before-replacement sequence into native.** Resolve a compatible durable operation before enabling Add/remove/assessment writes: retain the prior usable record until the replacement is confirmed, reconcile an uncertain send/index result, and prevent duplicate retry records. Verify whether the existing Boost identity/update APIs support that sequence without backend changes. Changing a draft chip must not silently issue a replacement or delete the previous credential.

## Current interoperable profile schema

All keys below use the existing verifiable-data mechanism; this table is not a request to put every field into the first native screen.

| Data key                           | JSON payload                                                                | First native treatment                                                              |
| ---------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `skill-profile-goals`              | `{ goals: string[] }`                                                       | Read and explicitly edit freeform personal goals.                                   |
| `skill-profile-professional-title` | `{ professionalTitle: string }`                                             | Preserve; optional career details later. The old profile constant aliases this key. |
| `skill-profile-role-experience`    | `{ lifetimeExperience: { years: number \| null, months: number \| null } }` | Preserve; optional career details later.                                            |
| `skill-profile-work-history`       | `{ selectedCredentialUris: string[] }`                                      | Preserve existing credential references; do not select documents automatically.     |
| `skill-profile-salary`             | `{ salary: string, salaryType: 'per_year' \| 'per_hour' }`                  | Preserve; optional, outside the first learner task.                                 |
| `skill-profile-work-life-balance`  | `{ workLifeBalance: string \| null }`                                       | Preserve; optional.                                                                 |
| `skill-profile-job-stability`      | `{ jobStability: string \| null }`                                          | Preserve; optional.                                                                 |

The old `skill-profile-job-satisfaction` constant/type remains in source, while current writers split work-life balance and job stability. Do not overwrite or migrate legacy data opportunistically. The web eight-part profile progress also includes self-assigned skills; do not turn that employment-heavy completion model into mandatory student onboarding.

Current `useVerifiableData` writes a VC v2 with `VerifiableData` type, its inline JSON-LD terms, own issuer/subject identity and `validFrom`. The subject carries `dataKey` and native JSON `dataPayload`. It uploads encrypted content, stores the stable index ID `__verifiable_data_${key}__`, and maintains `verifiableData`, `issuanceDate`, title and supplied category metadata. An existing record is updated in place and its shared URIs cleared; it is not routinely deleted and re-added. Reads prefer indexed data and otherwise read the subject payload.

This supersedes older descriptions of JSON serialized into `achievement.description`. Use the exact executable helper format for interoperability. The exported non-React helpers live in a React/query module: extract or reuse the pure storage logic without pulling UI hooks into the headless native runtime merely to access those functions.

The current web reader catches some failures and returns undefined. Native must distinguish loading, genuinely absent data and a failed read. A failed read must not prefill an empty draft that overwrites existing data. Preserve unknown fields and untouched profile keys. After loading, no-change Save and Cancel must make no write. Preserve the draft on save failure; scope late responses to the active account/generation.

Goals are freeform strings. The web commit handler trims input and limits it to 35 JavaScript code units. The concept shows a 35-character hint, but implementation must settle Unicode-safe compatible validation without splitting a surrogate pair, silently truncating existing web goals or inventing goal enums. Existing longer entries should remain readable and preservable. Native character-count wording must match the actual rule.

## Sharing and AI boundaries

Web profile saves and self-assigned-skill success handlers can synchronize changed credentials to existing consented contracts and queue insight refresh. The sync code honors contract categories, settings and expiry; this is not unconditional public publication. Conversely, “Only you can see this” would be an inaccurate blanket promise.

Opening Skills, viewing a source or editing a goal draft must not start a new AI session, create consent or process private Build My LearnCard originals. At Save, follow the established account choices and supported sharing contract; make those choices reviewable through the existing Data Sharing route. Audit the exact insight-refresh trigger/purpose before porting its side effect. Do not silently broaden access as part of a UI port.

The AI gate checks age restrictions first, waits for preferences, requires explicit enabled preferences for child profiles and honors user opt-out. Non-child accounts currently default differently when the preference is missing. Reuse the actual policy decision at the native boundary, including relevant server enforcement. Keep loading, disabled-by-choice and age-unavailable states distinct. Personal Skills access must not be unnecessarily blocked by the separate career AI gate.

Career occupations, learning resources, insight prerequisites, pagination, query availability and external providers still need a focused executable-contract audit. The [career composition](design/LEARNER_SKILLS_BRIEF.md) uses sample occupations without salary figures, personalized scores or provider claims. Its Add a career goal action should open an explicit editable goal review, not silently save or launch AI.

## Journeys checkpoint

The fetched upstream snapshot still defaults [agent dispatch](../learn-card-app/src/pages/pathways/agents/proxy.ts) to `mockDispatch` and persists [pathwayStore](../learn-card-app/src/stores/pathways/pathwayStore.ts) through the browser-local default. A boot-time dispatch setter can replace the default; deployed wiring has not been verified. Both tenant `features.pathways` and LaunchDarkly `enableJourneys` must be true in [the availability hook](../learn-card-app/src/pages/pathways/hooks/usePathwaysEnabled.ts).

No filenames containing pathway/journey were found in that snapshot's brain-service routes tree. This is a scoped source-search result, not proof that no service or deployment override exists elsewhere. Confirm account-owned shared persistence, revisions/conflicts, offline reconciliation and actual endpoints before claiming native cross-device Today/map/progress. Do not scrape browser state, enable flags, or present scripted proposals as live output.

## First implementation and verification sequence

1. Design the remaining loading, empty/search-empty, partial/error, unavailable-AI, skill-picker and unsaved-change variants. Keep the generated happy paths as composition references, with shared native tokens and real tray artwork.
2. Add pure profile/skill projections and bounded commands through [account-runtime](account-runtime/runtime.ts), its [types](account-runtime/types.ts), the native SDK boundary and account-scoped stores. The disposable SDK-spike runtime is not the production command host. Retain the transport origin restrictions; external resource support needs typed destinations, not an arbitrary proxy.
3. Ship credential-source reads and goals read/explicit-save first, reusing existing index IDs, metadata and sharing decisions. Validate web → native → web round trips, unknown/legacy fields, malformed/duplicate records, no-change/cancel, failed/uncertain save, retry and account interruption.
4. Resolve the safe self-assigned-skill replacement contract and supported framework picker before enabling its mutations. Test one source skill plus a self-rating without conflating their provenance, and failure at every replacement phase without losing the prior usable data.
5. Audit occupation/resource queries and AI availability, then implement career search/detail/resources and explicit goal review. Cover missing services, no results, paging, changed account choices and failed resources without fabricated recommendations or dead actions.
6. Verify 402/375-point layouts, English/Spanish/French/Arabic, RTL, enlarged text, VoiceOver, reduced motion, background/resume/sign-out and navigation back to the source credential. Native hosted CI stays manual; use focused local checks for the actual implementation.

This October 18 slice changes concepts/planning only. It adds no runtime commands, native screens, live writes or new test results. The installed app remains the approved sky-refresh build; source findings are readiness evidence, not implementation completion.
