# First-time setup, Build My LearnCard and People

Updated October 16, 2026. First-time setup is implemented. People and the first optional Build My LearnCard intake hub are now native; private document copies and signed JSON imports now extend the hub. AI extraction and broader relationship features remain follow-ups. See [the implemented scope](PEOPLE_AND_INTAKE.md). The existing-account access pass stays separate. See [first-time behavior, recovery capability and manual gates](FIRST_TIME_SETUP.md).

## 1. First-time account setup — implemented

**Current product priority:** learner Home and optional first arrival after these required steps. The approved [composition and implemented native screens](design/LEARNER_HOME_BRIEF.md) now have a learner Home, labeled Add intake and an optional welcome after setup. Welcome completion is scoped to the account, survives relaunch and can be revisited from Home. Resume pending claims directly at review, allow welcome to be skipped, and prioritize receiving/understanding/sharing personal records. The personal destination is named **Passport**; existing collection API/route identifiers remain stable. Distinct [institution workspaces](WORKSPACES_PLAN.md) are recorded for later, while demo login and live Apple/Google activation stay deferred.

Editable email verification routes returning users through existing resume/recovery. Fresh accounts and existing identities without a network profile get native birth date/country, name/unique username/optional photo, separate privacy choices and encrypted backup enrollment. Under-13 independent signup hands off to Families. Required guardian approval has a dedicated waiting/resend/check state and blocks consumer features until the server confirms it.

The implementation reuses the current AuthCoordinator and SSS strategy. Same-identity retries, protected UID-scoped progress, the five-minute legacy heuristic, preference failure, username races, lost profile-create replies, export cancellation, background and late-result isolation are covered at the domain/controller/UI boundaries. No private key or recovery password is persisted in the setup journal. New email-backup delivery is disabled in staging, so native signup uses the canonical password-protected backup file and confirmation APIs before profile creation. Existing emailed keys still recover existing accounts.

The shared policy table now corrects Ireland to 16 in both maps, following [Irish DPC guidance](https://www.dataprotection.ie/sites/default/files/uploads/2023-04/DPC_ChildrensData_ParentalConsent.pdf). Current under-13, EU approval, non-EU teen-notice and younger-user preference behavior matches the audited web product logic. The partial country table/fallback, distinction between digital-consent age and minor feature policy, and server enforcement still need review. The inspected profile handler accepts client fields; native parity is not a complete backend authorization or legal audit.

The [generated composition and original SVG artwork](design/SIGNUP_BRIEF.md) follow the approved neutral/Colorful drawn direction. New copy covers en/es/fr/ar; nested country/date sheets inherit RTL and accessibility text size. The user has now completed real staging profile creation and required backup setup after an explicitly authorized staging-only reset; the shared Firebase login is retained. Physical-device, new Firebase identity creation, cross-client recovery and real guardian delivery/approval remain explicit manual gates. See [live reset/signup evidence](ACCOUNT_DELETION_AUDIT.md).

## 2. Build My LearnCard on Home — claim and file intake implemented

This is **optional credential intake after account setup**, available to existing users too. Home now shows an illustrated **Build My LearnCard** entry; a native page offers scan, QR photo and claim-link intake. Back freely leaves the optional page, which stays available for later use. Do not require the user to upload documents to finish signup or fabricate a completion percentage.

The native hub now also offers document-kind selection, one-file review/private-original saving, selected signed JSON import, real source counts and protected Quick Look viewing. It preserves web’s four source categories and `uploadType: rawVC`. The [intake contract](DOCUMENT_INTAKE.md) records limits, signature meanings, partial retry and duplicate boundaries. AI extraction and its privacy/session integration remain separate.

The current web feature includes résumé, certificate, transcript and diploma uploads, selected QR/claim-link intake, raw credential JSON import and optional demo/sample tools. LinkedIn, school-connect and self-attested-skills entries exist in enums but are commented out of the active checklist; do not advertise them as current supported actions. Sample data must remain visibly optional and separate from real records.

Native delivery can be incremental:

1. **Implemented:** Home entry and scan/photo/paste-claim routes, with mode-specific entry and review before adding. Unavailable document actions stay out until their contracts work.
2. **File intake implemented:** native document/credential file intake, encrypted storage, progress/failure/cancel/retry and selected-original review. Add extraction integration and review before saving generated credentials next. Audit existing parser/AI privacy gating first; uploading a document and processing its contents are distinct steps. Interrupted or partial import must not duplicate records or present self-authored extracted content as an issuer-verified achievement.
3. **Source bookkeeping implemented:** match web bookkeeping: shared LearnCloud categories/source tags and actual counts, with durable operation state where needed. Counts use `resume`, `certificate`, `transcript`, `diploma` and imported `uploadType: rawVC`, independently of semantic Collection categories. Existing web intake must be visible natively and vice versa. Completion follows saved data, not local taps or a subset of loaded Collection pages.

Adding an existing résumé here is compatible with keeping the separate résumé **builder/editor** web-only. AI career Pathways and AI Sessions remain their own native slices.

## 3. People and connections without a side menu — initial graph implemented

Keep the four tabs, now ordered **Home / Passport / Inbox / Apps** following the October 16 signup review. Home is the initial signed-in destination. A **People** page now has a Home entry and a stable Account → People shortcut. Inbox → People opens Requests; existing Inbox contextual actions remain. This gives relationships a destination without making a fifth bottom tab or introducing desktop navigation. Reassess a dedicated tab only if actual use warrants it.

- **Connections:** searchable paginated profiles, real supplied images or the drawn smiley, clear connection state and profile details.
- **Requests:** incoming requests and explicit Accept; **Sent** shows outgoing requests/cancellation. Blocked profiles have a secondary management view. The web SDK has no incoming decline endpoint: cancellation only removes outgoing requests, so native does not invent a Decline action. Explicit Block remains available.
- **Find:** existing username/profile search is implemented with relationship status and an explicit result limit. Invitation links/QR remain separate. Contact-invite QR is a different protocol from the credential-claim scanner and needs explicit parsing/routing/review support.
- **Details:** name/username, visible bio, connect/accept, cancel, disconnect and block/unblock are implemented. Profile-specific send/share shortcuts remain separate, with explicit review required. Connection alone must not imply credential access or approval of a data-sharing agreement.

Reuse the paginated SDK contracts (`getPaginatedConnections`, `getPaginatedConnectionRequests`, `getPaginatedPendingConnections`), connection mutations and blocked-profile APIs. Search must work beyond the first loaded page; inspect existing profile search filtering and add a server query only if needed. Share state and invalidation with Inbox so accepting a request updates the list, badge and prompt together. Preserve explicit connect/skip decisions after claiming credentials. Group all page, request and browser state under the current account; lock/sign-out removes private content and invalidates pending responses.

This is LearnCard's connection graph. Access to the device address book is a separate product choice and is not required for this slice. iPad split-view presentation can follow later without promising current tablet validation.

## Suggested delivery order and acceptance

| Slice                          | Relative scope                                                             | Acceptance gate                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared policy/approval audit   | Small focused investigation, potentially separate shared/backend fixes     | Reviewed policy table; explicit distinction between age, approval and feature restrictions                                                     |
| Native first-time registration | Implemented; live staging profile/backup setup completed on retained login | Fresh adult, missing-profile, underage, pending-approval and interrupted/retry paths; second-device recovery and real guardian approval remain |
| People                         | Initial graph implemented; invitation/send/share refinements remain        | Multi-page search, incoming/outgoing requests, block/disconnect, Inbox consistency and lifecycle isolation                                     |
| Build My LearnCard             | Native claim/file intake implemented; AI extraction is the next slice      | Real intake paths, web index parity, privacy-aware processing, review, partial failure and duplicate prevention                                |

Automated policy cases should cover birthday boundaries, leap days, missing/future dates, country changes, each configured threshold and unknown-policy behavior. Native account cases should cover losing a profile-create response, handle races, failed preference/email saves, delayed guardian approval, resume after five minutes, cancellation/sign-out and pending scan/Apps intents. People tests need pagination/search, duplicate requests, stale responses after account switch and badge consistency. Build My tests need malformed/large files, partial imports, retry/relaunch, cancellation, processing restrictions and truthful counts. All new UI needs four-language, RTL, dark/light, accessibility type and Reduce Motion review.

The live follow-up completed the selected staging reset/profile setup and one private self-issued credential round trip. It did not send an approval email, upload a personal document or perform a contact action. The implementation corrects the shared Ireland threshold; no backend route or deployment changed. Native CI remains manual-dispatch only. Current build and regression evidence is recorded in [TESTING](TESTING.md).

## Source map

- Web registration: `apps/learn-card-app/src/components/onboarding/v2/OnboardingFlow.tsx`; login routing in `src/pages/login/LoginPage.tsx`.
- Age and preferences: `src/components/onboarding/onboardingNetworkForm/helpers/gdpr.ts`, `helpers/validators.ts`, `src/components/onboarding/privacyPreferences.ts`; shared `packages/learn-card-base/src/constants/gdprAgeLimits.ts`.
- Account setup: `packages/learn-card-base/src/auth-coordinator/AuthCoordinator.ts`; native `account-runtime/runtime.ts`, `ios/Sources/AccountSignInView.swift` and `ios/NativeCore/Sources/LearnCardNativeSDK/AccountRuntime.swift`.
- Server profile and approval: `services/learn-card-network/brain-service/src/routes/profiles.ts` and `routes/inbox.ts` (`sendGuardianApprovalEmail`, `approveGuardianRequest`).
- Build My LearnCard: `apps/learn-card-app/src/components/learncard/checklist/CheckListContainer.tsx`, `CheckList.tsx`, `CredentialIntakeOptions.tsx`, `checklist-steps/`; `src/hooks/useUploadFile.tsx`; shared `src/hooks/useGetCheckListStatus.ts` and `src/react-query/queries/checklist.ts` under `packages/learn-card-base`.
- Contacts: `apps/learn-card-app/src/pages/addressBook/`; paginated hooks in `packages/learn-card-base/src/react-query/queries/queries.ts`; SDK methods in `packages/plugins/learn-card-network/src/types.ts` and `plugin.ts`.
- Native integration: `ios/Sources/HomeAppsView.swift`, `AccountView.swift`, `InboxActivityView.swift`, `RootView.swift`; `account-runtime/inbox.ts` and existing claim/creation/sharing coordinators.
