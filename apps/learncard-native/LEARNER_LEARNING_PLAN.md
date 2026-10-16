# Learner Pathways, Journeys and related features

Planning checkpoint, October 16, 2026. The user explicitly asked to queue the missing learner experiences alongside the Apps redesign. Native UI should support discovering possibilities and following a personal learning journey; it does not need skill-framework creation/editing or institutional authoring tools.

This supersedes earlier notes saying Journeys scope is unconfirmed. It authorizes planning the learner subset, not enabling web flags or claiming these features are already in the native app. [Apps composition](design/APPS_RENDERED_BRIEF.md) is the immediate visual task.

## Two distinct existing products

| Experience                             | Current web surface                                                       | Learner value                                                                              | Native scope                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| AI career Pathways                     | `/ai/pathways`, `/ai/pathways/discovery`                                  | Personal skills/goals, career possibilities, training and related learning content         | Native personal profile and exploration; real content destinations use the appropriate native view or in-app browser           |
| Journeys, called Pathways v2 in source | `/pathways` with Today, Map, What-if, Build, proposals and node routes    | Understand a chosen journey, see a next step, follow progress and review suggested changes | Start with learner arrival, Today, a readable map/step list and step details; stage writes and advanced exploration separately |
| AI Sessions and Insights               | Links from the career Pathways surface to `/ai/topics` and `/ai/insights` | Continue learning and understand resulting insights                                        | Separate integration after identity, privacy, session and result contracts are audited                                         |
| Personal skills                        | Career profile and existing skills features                               | Understand earned/self-reported skills and choose personal goals                           | Read/choose from supported skills and preserve provenance; no taxonomy/framework authoring                                     |

Career exploration and Journeys are learner features. They are not organization-only functionality. Keeping them separate from an earlier Apps visual task was a scheduling decision, not an institutional permission boundary.

## Source-grounded findings

Checked against this branch on October 16; this is not a claim about the latest upstream deployment.

- [Web routes](../learn-card-app/src/routes.tsx) mount career Pathways separately from Journeys. The [career screen](../learn-card-app/src/pages/ai-pathways/AiPathways.tsx) includes My Skill Profile, career exploration and Grow Skills, plus links to sessions/skills/insights.
- The personal profile uses encrypted self-issued verifiable data through [useVerifiableData](../../packages/learn-card-base/src/hooks/useVerifiableData.ts). [Profile progress](../learn-card-app/src/pages/ai-pathways/ai-pathways-skill-profile/SkillProfileProgressBar.tsx) reads goals, professional title, role experience, work history, salary, work-life balance, job stability and selected skills. Audit exact schemas/options at implementation time; do not invent a parallel native preference store. Optional salary/employment questions should not block a student's useful first experience.
- [Grow Skills content](../learn-card-app/src/pages/ai-pathways/useGrowSkillsContent.ts) combines existing insight/pathway data, occupations, training/course and media queries. It also includes AI-session destinations. Query availability, credential prerequisites and external providers need a focused audit before porting. A generic empty state must not pretend useful recommendations already exist.
- [AI feature gating](../../packages/learn-card-base/src/hooks/useAiFeatureGate.ts) considers profile type, date/country and stored preferences. Carry policy and server enforcement through the native boundary; route labels or a selected persona cannot grant AI access. Do not automatically process private Build My LearnCard originals as part of exploration.
- [Journeys availability](../learn-card-app/src/pages/pathways/hooks/usePathwaysEnabled.ts) requires tenant `features.pathways` and LaunchDarkly `enableJourneys`. Its existing web entry is the conditional secondary side-menu link. Native should share the availability decision, without adding a desktop side menu.
- [Journeys shell](../learn-card-app/src/pages/pathways/PathwaysShell.tsx) and [four stores](../learn-card-app/src/stores/pathways/index.ts) are client-side foundations. The stores enable browser persistence. [Agent dispatch](../learn-card-app/src/pages/pathways/agents/proxy.ts) currently defaults to scripted mock behavior. No pathway/journey route files were found in this branch's brain-service route directory. The [older architecture/readme](../learn-card-app/src/pages/pathways/README.md) also describes unfinished server integration; verify executable contracts before relying on that historical status.
- Consequently, a complete cross-device native Journeys feature is not just a visual port. Confirm authenticated persistence, account isolation, versions/conflicts, offline writes, evidence and real agent support first. Never scrape browser-local state or silently create a separate unsynced journey.

## Proposed placement

Keep **Home / Passport / Inbox / Apps**. Add native Career Pathways and Journeys destinations within a later **From LearnCard** learning group in Apps, alongside the existing first-party tools but visually distinct from installed partner apps. Home can show one compact Continue your journey/Explore next steps entry when the feature is available and real personal data warrants it. Do not add a fifth top-level tab.

“AI career Pathways” and “Journeys” are working names for planning; use clear distinct labels in their own mockup pass. Ordinary learners should not need to understand the internal v1/v2 distinction. Do not expose disabled placeholder buttons during the current Apps visual implementation.

## Delivery queue

### 1. Personal skills/goals and career exploration

- [ ] Audit current exact data keys, schemas, SDK methods, policy gates, consent synchronization and external query services. Record which existing web behaviors require explicit opt-in.
- [ ] Generate native learner mockups: first visit without insights, returning profile, career results/detail, no results, unavailable/disabled AI. Keep optional career/employment fields progressive rather than mandatory student onboarding.
- [ ] Implement native read/explicit-save personal profile and career search/detail using existing interoperable storage. Do not conflate self-reported skills with institution-issued evidence.
- [ ] Route available learning resources into native detail or the browser as appropriate. Defer session creation until its own integration is ready; no dead CTA.
- [ ] Verify web/native round trip, cancellation, no-change saves, unavailable upstream services, pagination, translations and account background/resume/sign-out isolation.

### 2. Journeys contract and storage checkpoint

- [ ] Audit latest upstream source before integration, reconcile with this branch and identify real endpoints. Confirm whether persistence remains local-only and whether dispatch remains mock.
- [ ] Decide the minimal account-owned shared document/index contract, schema/revision compatibility, optimistic conflict handling and lifecycle clearing. Reuse existing services where supported; explicitly record any missing backend work.
- [ ] Define supported action descriptors (native destination, installed app, external URL, session), typed route validation and return/completion reconciliation. Do not widen the partner browser bridge with arbitrary native routes.
- [ ] Define evidence/completion authority and credential binding. A personal completion tick or an app returning must not mean an issuer signed or verified an achievement.
- [ ] Keep user availability/age/privacy/guardian checks consistent. A developer preview may use explicit labeled fixtures; never show mock proposals as a live AI response.

### 3. Journeys learner UI

- [ ] Design and implement choosing/joining an available journey, Today/next step, an accessible map with equivalent linear step list, step detail and real progress.
- [ ] Support existing app/resource actions with correct account/consent context and a clear return path. Do not launch a session or disclose credentials merely by opening a step.
- [ ] Add explicit completion/evidence submission only once the shared contract is verified. Preserve retry/uncertain-write state, duplicate prevention and pending-versus-confirmed outcomes.
- [ ] Add resume/switch among actual journeys. Home continuation must use real active state; no fabricated completion percentage.
- [ ] Validate restart, offline/reconnect, concurrent edits, account switching/sign-out, deep-link interruption, map accessibility, RTL and reduced motion.

### 4. Related learner features, staged separately

- [ ] AI Sessions: start/resume/result lifecycle, media/transcript handling, limits and account/guardian/privacy decisions. Respect existing opt-outs; synchronization needs explicit purpose.
- [ ] Insights and skills: show existing learner results, provenance and understandable empty/error states. Allow selecting existing skills/personal goals where supported.
- [ ] Journeys proposal review and optional What-if: compare suggested alternatives and explicitly accept/reject with undo/reconciliation where the real model supports it. No silent rerouting or invented agent output.
- [ ] Join learning results to Passport only through actual issued/imported credential semantics; document originals and self-reported preferences stay distinguishable.

## Explicit exclusions

Skill-framework creation/editing/publishing, competency taxonomy management, custom assessment/framework builders, Journey Build-mode graph/policy/template authoring, institution rosters, staff administration, batch issuance, marketplace/developer portals and organization reporting remain outside this learner queue. A learner changing their own goals or choosing existing skills is still part of the personal experience.

Institution workspaces retain their [separate plan](WORKSPACES_PLAN.md). Résumé builder stays web-only. AI document extraction remains the distinct [Build My LearnCard follow-up](DOCUMENT_INTAKE.md), not an automatic requirement for these screens.

## Definition of ready

Each slice needs a real account/data contract, state/error/cancel design, explicit disclosure/commit points, native four-language/accessibility coverage and focused lifecycle regressions. Generated mockups are not implementation evidence. Do not enable providers, rollout flags or hosted native CI as a side effect of planning. Preserve the current review account and credential.
