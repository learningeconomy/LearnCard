# First-time setup, Build My LearnCard and People

Updated October 16, 2026. First-time setup was approved as the priority and is now implemented; Build My LearnCard and People remain planned. The existing-account access pass stays separate. See [first-time behavior, recovery capability and manual gates](FIRST_TIME_SETUP.md).

## 1. First-time account setup — implemented

Editable email verification routes returning users through existing resume/recovery. Fresh accounts and existing identities without a network profile get native birth date/country, name/unique username/optional photo, separate privacy choices and encrypted backup enrollment. Under-13 independent signup hands off to Families. Required guardian approval has a dedicated waiting/resend/check state and blocks consumer features until the server confirms it.

The implementation reuses the current AuthCoordinator and SSS strategy. Same-identity retries, protected UID-scoped progress, the five-minute legacy heuristic, preference failure, username races, lost profile-create replies, export cancellation, background and late-result isolation are covered at the domain/controller/UI boundaries. No private key or recovery password is persisted in the setup journal. New email-backup delivery is disabled in staging, so native signup uses the canonical password-protected backup file and confirmation APIs before profile creation. Existing emailed keys still recover existing accounts.

The shared policy table now corrects Ireland to 16 in both maps, following [Irish DPC guidance](https://www.dataprotection.ie/sites/default/files/uploads/2023-04/DPC_ChildrensData_ParentalConsent.pdf). Current under-13, EU approval, non-EU teen-notice and younger-user preference behavior matches the audited web product logic. The partial country table/fallback, distinction between digital-consent age and minor feature policy, and server enforcement still need review. The inspected profile handler accepts client fields; native parity is not a complete backend authorization or legal audit.

The [generated composition and original SVG artwork](design/SIGNUP_BRIEF.md) follow the approved neutral/Colorful drawn direction. New copy covers en/es/fr/ar; nested country/date sheets inherit RTL and accessibility text size. Physical-device, live new-user cross-client recovery and real guardian delivery/approval remain explicit manual gates. The existing real review account is preserved.

## 2. Build My LearnCard on Home

This is **optional credential intake after account setup**, available to existing users too. Home should show an illustrated **Build My LearnCard** card with a useful next action and Continue; a full native page holds the intake options. It can be skipped or dismissed and reopened later. Do not require the user to upload documents to finish signup or fabricate a completion percentage.

The current web feature includes résumé, certificate, transcript and diploma uploads, selected QR/claim-link intake, raw credential JSON import and optional demo/sample tools. LinkedIn, school-connect and self-attested-skills entries exist in enums but are commented out of the active checklist; do not advertise them as current supported actions. Sample data must remain visibly optional and separate from real records.

Native delivery can be incremental:

1. Add the real Home entry and useful scan/paste-claim routes already supported by native. Keep unavailable document actions out until their contracts work.
2. Add native document/credential file intake, upload/storage, progress/failure/cancel/retry and review before saving extracted credentials. Audit existing parser/AI privacy gating first; uploading a document and processing its contents are distinct steps. Interrupted or partial import must not duplicate records or present self-authored extracted content as an issuer-verified achievement.
3. Match web bookkeeping: shared LearnCloud categories/source tags and actual counts, with durable operation state where needed. Counts use `resume`, `certificate`, `transcript`, `diploma` and imported `uploadType: rawVC`, independently of semantic Collection categories. Existing web intake must be visible natively and vice versa. Completion follows saved data, not local taps or a subset of loaded Collection pages.

Adding an existing résumé here is compatible with keeping the separate résumé **builder/editor** web-only. AI career Pathways and AI Sessions remain their own native slices.

## 3. People and connections without a side menu

Keep Collection / Inbox / Apps / Home initially. Add a **People** page with a prominent Home entry and a stable Account → People shortcut. Connection requests in Inbox link into that page and retain contextual actions. This gives relationships a destination without making a fifth bottom tab or introducing desktop navigation. Reassess a dedicated tab only if actual use warrants it.

- **Connections:** searchable paginated profiles, real supplied images or the drawn smiley, clear connection state and profile details.
- **Requests:** incoming requests and existing explicit accept/decline flows; **Sent** shows outgoing requests/cancellation. Keep blocked profiles available in a secondary management view.
- **Find or invite:** existing username/profile search and supported profile invitation links/QR. Contact-invite QR is a separate protocol from the implemented credential-claim scanner and needs explicit parsing/routing/review support.
- **Details:** name/username, public bio, send an existing creation or share selected credentials through explicit review, disconnect and block/unblock. Connection alone must not imply credential access or approval of a data-sharing agreement.

Reuse the paginated SDK contracts (`getPaginatedConnections`, `getPaginatedConnectionRequests`, `getPaginatedPendingConnections`), connection mutations and blocked-profile APIs. Search must work beyond the first loaded page; inspect existing profile search filtering and add a server query only if needed. Share state and invalidation with Inbox so accepting a request updates the list, badge and prompt together. Preserve explicit connect/skip decisions after claiming credentials. Group all page, request and browser state under the current account; lock/sign-out removes private content and invalidates pending responses.

This is LearnCard's connection graph. Access to the device address book is a separate product choice and is not required for this slice. iPad split-view presentation can follow later without promising current tablet validation.

## Suggested delivery order and acceptance

| Slice                          | Relative scope                                                         | Acceptance gate                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Shared policy/approval audit   | Small focused investigation, potentially separate shared/backend fixes | Reviewed policy table; explicit distinction between age, approval and feature restrictions                                |
| Native first-time registration | Implemented; live validation remains                                   | Fresh adult, missing-profile, underage, pending-approval and interrupted/retry paths; existing-account recovery unchanged |
| People                         | Moderate, largely existing SDK APIs                                    | Multi-page search, incoming/outgoing requests, block/disconnect, Inbox consistency and lifecycle isolation                |
| Build My LearnCard             | Small navigation entry; document processing is a larger slice          | Real intake paths, web index parity, privacy-aware processing, review, partial failure and duplicate prevention           |

Automated policy cases should cover birthday boundaries, leap days, missing/future dates, country changes, each configured threshold and unknown-policy behavior. Native account cases should cover losing a profile-create response, handle races, failed preference/email saves, delayed guardian approval, resume after five minutes, cancellation/sign-out and pending scan/Apps intents. People tests need pagination/search, duplicate requests, stale responses after account switch and badge consistency. Build My tests need malformed/large files, partial imports, retry/relaunch, cancellation, processing restrictions and truthful counts. All new UI needs four-language, RTL, dark/light, accessibility type and Reduce Motion review.

No live signup, approval email, document upload or contact action was performed. The implementation corrects the shared Ireland threshold; no backend route or deployment changed. Native CI remains manual-dispatch only. Current builds and targeted verification are recorded in [TESTING](TESTING.md).

## Source map

- Web registration: `apps/learn-card-app/src/components/onboarding/v2/OnboardingFlow.tsx`; login routing in `src/pages/login/LoginPage.tsx`.
- Age and preferences: `src/components/onboarding/onboardingNetworkForm/helpers/gdpr.ts`, `helpers/validators.ts`, `src/components/onboarding/privacyPreferences.ts`; shared `packages/learn-card-base/src/constants/gdprAgeLimits.ts`.
- Account setup: `packages/learn-card-base/src/auth-coordinator/AuthCoordinator.ts`; native `account-runtime/runtime.ts`, `ios/Sources/AccountSignInView.swift` and `ios/NativeCore/Sources/LearnCardNativeSDK/AccountRuntime.swift`.
- Server profile and approval: `services/learn-card-network/brain-service/src/routes/profiles.ts` and `routes/inbox.ts` (`sendGuardianApprovalEmail`, `approveGuardianRequest`).
- Build My LearnCard: `apps/learn-card-app/src/components/learncard/checklist/CheckListContainer.tsx`, `CheckList.tsx`, `CredentialIntakeOptions.tsx`, `checklist-steps/`; `src/hooks/useUploadFile.tsx`; shared `src/hooks/useGetCheckListStatus.ts` and `src/react-query/queries/checklist.ts` under `packages/learn-card-base`.
- Contacts: `apps/learn-card-app/src/pages/addressBook/`; paginated hooks in `packages/learn-card-base/src/react-query/queries/queries.ts`; SDK methods in `packages/plugins/learn-card-network/src/types.ts` and `plugin.ts`.
- Native integration: `ios/Sources/HomeAppsView.swift`, `AccountView.swift`, `InboxActivityView.swift`, `RootView.swift`; `account-runtime/inbox.ts` and existing claim/creation/sharing coordinators.
