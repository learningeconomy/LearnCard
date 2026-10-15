# Native regression checks

Current configured suite: **273 cases** (110 Bun, 102 Swift, 61 simulator), plus one intentionally skipped live exchange. Account-motion, profile-photo, recent-stack and sharing-picker validation is recorded below; historical runs retain their original counts. The preceding category run [38700166174](https://github.com/learningeconomy/LearnCard/actions/runs/38700166174) passed 42 simulator cases and failed three; it is not a green baseline. See [STATUS](STATUS.md) for installed-build evidence and the new source-specific CI run.

The `Vesper checks` workflow runs on every push to `codex/vesper-73`, on pull requests from that branch, and on manual dispatch. Its check is **Native regression suite**. It uses macOS 15 and Xcode 26.3, selects an available iOS runtime, and creates/reuses a dedicated **LearnCard Native UI Checks** simulator. It does not change repository branch protection.

The same suite can run locally:

```bash
bash apps/learncard-native/scripts/test-ci.sh
```

An explicit `LC_NATIVE_SIMULATOR_ID` overrides simulator selection; choose a test simulator, since UI checks install and relaunch the app. The suite forces the non-deliverable `native-test@example.invalid` build configuration. Reconfigure the test email before installing a later live-account build.

## Account motion — October 15

The first motion pass passed all **100 Swift** cases (`artifacts/account-motion-core.log`: 75 XCTest and 25 Swift Testing). Four new motion-domain cases cover gathering/settlement, stable Reduce Motion, offscreen/inactive/VoiceOver gating and finite transforms. A new SDK case verifies the 15 localized transition strings in four languages. Account-runtime/Bun source is unchanged from the preceding passing 110-case photo run; no new Bun suite run is claimed here.

All **nine unique focused simulator** cases passed (`account-motion-ui-final.xcresult`): three new motion cases, all five existing account lifecycle cases and the pending-code recovery/background claim case. The three motion cases check actual pixel changes, a still Reduce Motion mark in dark appearance, and Arabic accessibility Continue geometry. The finish pass (`account-motion-finish-ui.xcresult`) passed the same three visual cases and pending-claim case after adding the watercolor material and stable caption spacing. Palette refinement passed all three motion cases in `account-motion-color-ui.xcresult`, and the final native-texture-only artwork passed them in `account-motion-pigment-ui.xcresult`. The user then requested continuing stop-motion life and broader floating paths after assembly; the final stop-motion pass passed all **102 Swift** cases (`account-motion-stop-core.log`: 77 XCTest and 25 Swift Testing) and all three current motion UI cases (`account-motion-stop-ui.xcresult`). New checks require held poses within each frame, differing later poses, bounded jitter, visible background travel outside the copy, actual settled-logo pixel changes and actual background-region pixel changes. This is targeted verification, not a full local 273-case run.

The first motion app build failed before running tests because a large SwiftUI result builder obscured an unsupported modifier. Splitting the scene into a focused view helper and using supported accessibility traits resolved it (`account-motion-ui.log`). Final appearance checks use the stronger, user-requested Colorful palette and lighter pigment overlay. Screenshots and a ten-second native recording are in `artifacts/`; they use DEBUG previews/disposable fixtures, never a real-account mutation.

Physical-device energy/frame pacing, cold-launch OS imagery and a human VoiceOver review remain manual gates. See [motion contracts](ACCOUNT_MOTION.md).

## Profile photo editing — October 15

All **110 Bun** cases passed (`artifacts/profile-photo-bun.log`) and source contracts passed (`profile-photo-types.log`, with the same 14 pre-existing dependency diagnostics). Five new cases cover image-field omission/removal/replacement, provider URL checks and input bounds.

All **95 Swift** cases passed (`artifacts/profile-photo-core-final.log`: 70 XCTest and 25 Swift Testing). Ten new cases cover bounded square JPEG generation and metadata stripping, four-locale copy, unchanged/clear/replace payloads, existing-photo preservation, upload and profile-save failures, cached-upload retry, changed-photo retry, background lock and sign-out during upload or a pending profile reply.

All **eight unique focused simulator** cases passed across two runs: the two English photo cases in `profile-photo-ui-final.xcresult` passed; its Arabic case initially used the English Account label and failed navigation. It was corrected to use the stable `account` identifier. `profile-photo-lifecycle-ui.xcresult` then passed the Arabic accessibility case and all five existing account lifecycle cases (repeated background/resume, failed recovery/retry/relaunch, recovery input clearing, sign-out and forget-device). The new editor was also visually reviewed in English on the checks simulator; the Arabic accessibility attachment verifies actual RTL/larger-type inheritance. This is targeted validation, not a new full 263-case local run.

The first app build caught and corrected a Swift catch-variable shadowing error before tests executed (`profile-photo-ui.log`). Final source also snapshots the PhotosPicker label before its Sendable closure, removing the new actor-isolation warning. Synthetic tests neither upload images nor change the real staging profile. An actual photo upload/web parity check remains manual. See [photo behavior](PROFILE_PHOTOS.md).

## Recent-stack browsing — October 15

All **85 Swift** cases passed (`artifacts/recent-stack-core.log`: 60 XCTest and 25 Swift Testing). Four new domain cases cover selection of five distinct recent records, category/date boundaries, unchanged payloads, bounded/reconciled position, gesture thresholds, vertical intent and RTL; one new SDK case validates four-locale copy.

Five focused simulator cases passed (`artifacts/recent-stack-ui.xcresult`): all three new stack cases plus existing category/detail parity and Collection search/reset. They exercise actual horizontal gestures, five-card limits, reverse browsing, the active card’s detail destination and retained position on Back, a short cancelled drag, vertical scrolling, search reset, single-card category reset and Arabic Reduce Motion. Synthetic screenshots are exported in `artifacts/recent-stack-attachments/`.

The final input-cap/partial-caption refinement passed another traversal/navigation test plus the existing automatic detail-card animation test (`artifacts/recent-stack-final-ui.xcresult`, two passed). The last cancelled-reverse-drag sleeve reset passed its expanded short-drag/vertical-scroll/search-reset case (`artifacts/recent-stack-cancel-final.xcresult`, one passed). Final Release/Debug install succeeded; all five artifact hashes match (`artifacts/recent-stack-install-proof.json`). The live Collection displays the new controls with real account records; no live credential mutation was performed. Bun/runtime transport code is unchanged from the prior 105-case sharing validation. This is focused UI validation, not a new local full 245-case run. See [stack contracts](RECENT_STACK.md).

## Larger-collection sharing — October 15

- All **105 Bun** cases passed (`artifacts/share-picker-bun-final.log`), including three cursor-progress regressions.
- All **80 Swift** cases passed: 59 XCTest and 21 Swift Testing (`artifacts/share-picker-core-final.log`). Six core picker cases cover 300 records, date boundaries, stable sorting, explicit selection and limits. Six SDK cases cover paging through 243 records, matching the last page, failure/explicit retry, empty display pages, cancellation and a filter applied during an existing read, plus locale/plural coverage within those cases.
- Source/type contracts passed (`artifacts/share-picker-types.log`); the same 14 dependency diagnostics remain scoped to their existing monorepo packages.
- Four focused simulator cases passed (`artifacts/share-picker-ui-final.xcresult`): three new picker cases and the existing multiple-credential/system-share case. All four passed again with explicit RTL/actual-large-text assertions (`artifacts/share-picker-accessibility.xcresult`). The final adaptive stacked-row refinement passed the affected Arabic/accessibility case (`artifacts/share-picker-large-row.xcresult`). Visual review caught and corrected a modal environment boundary; screenshots confirm mirrored navigation and full-width text at accessibility sizes.
- New simulator coverage checks combined categories, retained hidden selections, exact review contents, last-page search, issue-date reset, sorting and sample sharing. Negative review assertions are scoped to the review form, since the presenting Collection can remain in the app accessibility tree behind the sheet.
- Final Release and Debug review-install builds passed (`artifacts/share-picker-release-final.log`, `artifacts/share-picker-review-install.log`). All five installed artifact hashes match (`artifacts/share-picker-install-proof.json`). The live staging account resumed; opening the picker and searching showed real results and later-page progress without publication. The Design search completed with five matches; clearing it showed 38 available choices and no remaining-page indicator. Synthetic screenshots are exported under `artifacts/share-picker-accessibility-attachments/` and `artifacts/share-picker-large-row-attachments/`.

See [the sharing picker contract](SHARING_PICKER.md). All new cases are included automatically by `test-ci.sh`; this targeted local UI run is not a full 237-case simulator/SDK run. Live publication, actual large-account latency and physical-device review remain manual gates. New picker copy has 41 keys across four locales; legacy review/publication copy is not fully migrated.

## Coverage

| Layer                    | What it catches                                                                                                                                                               | Boundary                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Swift domain tests       | Duplicate claims, draft validation, personal collection versus reusable creations, share selection, malformed links                                                           | In-memory credential service                                                                                    |
| Account security tests   | Firebase custom-token exchange, refresh, persisted session, stale sign-in response after logout, scoped Keychain storage, token forwarding                                    | Synthetic HTTP via URLProtocol; real native Keychain in disposable services                                     |
| Account lifecycle tests  | Background → inactive → active, interruptions, late initialization/recovery replies, recovery retry/relaunch, sign-out priority, forgetting a locked account, cleanup failure | **Production account and collection controllers**, injected session/SDK hosts; deterministic continuation gates |
| Account UI tests         | Actual Home/activate transitions, repeated resume, email recovery failure/retry, cleared recovery input, relaunch, sign-out, cancel/confirm Forget this device                | **Production SwiftUI account screens and controller**, DEBUG-only fake backend and per-test Keychain markers    |
| iOS Keychain probe       | Device-only accessibility and isolated read/update/delete/relaunch behavior                                                                                                   | Runs inside the app process with synthetic values                                                               |
| Existing UI tests        | Navigation/title rendering, creation/recipient/category flows, claim, selection/sharing, Account navigation, dark-mode share sheet                                            | Unsigned demo fixtures                                                                                          |
| Bun protocol tests       | Web-compatible draft signing, encrypted selection/proof preservation, transport/redirect constraints                                                                          | Offline SDK fixtures                                                                                            |
| iOS SDK interoperability | Credential signatures and tamper checks, encryption, recovery, presentations, transfer                                                                                        | Real bundled WASM/SDK on simulator, followed by independent verification with the web SDK                       |

The account controller and collection store live in `ios/NativeCore/Sources/LearnCardNativeSDK/`. The app uses aliases to these same implementations. The fixture entry point changes backend boundaries only; it is excluded from Release builds. Continuation gates hold responses at known points so race assertions do not depend on arbitrary sleeps.

The command regression executes the actual browser account bundle in an isolated JavaScript realm. It checks every Swift command route, friendly invalid/signed-out replies, empty signed-out member searches, refusal of unknown/inherited method names, and absence of bridge requests. This caught sharing and profile-update handlers accidentally nested in the Firebase provider rather than the command dispatcher; both routes are now connected. Their real-account mutations still need live validation. CI also compiles Release to check the app with DEBUG fixtures excluded.

Sign-out invalidates outstanding UI operations and disposes the key-bearing SDK before awaiting native token cleanup. Ordinary sign-out preserves device access for the next sign-in. Forget additionally deletes this verified account's primary/pending share and version slots, including when its SDK host has already been disposed. Account screens clear unsubmitted recovery/code fields on background and submitted recovery fields immediately.

## Results and failures

CI keeps `.xcresult` bundles, test attachments/screenshots, independent interoperability verification, and Swift logs for seven days, including failed runs. Download `vesper-regression-results` from the workflow run and open the `.xcresult` in Xcode. Generated SDK resources, Firebase configuration, device shares, and local identity/vector files are not uploaded.

To run a focused regression locally:

```bash
bash apps/learncard-native/scripts/test-core.sh
LC_NATIVE_SIMULATOR_NAME='LearnCard Native UI Checks' \
  bash apps/learncard-native/scripts/test-ios.sh \
  -only-testing:LearnCardNativeUITests/AccountLifecycleUITests
```

CI does not send verification email, recover a real account, send credentials to real recipients, or run the opt-in staging exchange. Live SSS/Firebase service availability, physical-device lock/unlock, revoked credentials, minimum-iOS compatibility, and real upload/send/share/profile mutations still need separate validation. UI screenshots are evidence for review, not pixel-diff snapshot assertions. Keep testing the existing account connection as backend contracts evolve.

## Consumer Apps and localization regressions

CI additionally runs a strict check of native consumer modules against the source SDK (`scripts/typecheck-consumer.ts`, `account-runtime/tsconfig.json`), actual dispatch-table checks for every Apps/privacy command, consent materialization tests (full audience, explicit selection, required permissions, stale agreements, missing records and identity origin), and partner source/origin rejection. Swift tests cover response Bool/null fragments, FIFO/cancellation/disposal of SDK commands, agreement removal versus uninstall, and late reads/install responses after account lock. Native catalog translations/plurals/RTL use the real generated localization resources.

Consumer UI checks cover install/consent/withdraw, profile Data Sharing, the **actual PartnerConnect client** inside a WK iframe (host handshake, identity cancel/accept and unsupported action), account background closing the browser, and French/Arabic navigation. Samples are isolated and never install an app, publish consent, issue a credential or send an email on a real account. Catalog reads are public. Real published partner-app mutations, contract expiry/guardian gates against staging, device web sign-in continuity and physical-device browser behavior still require live validation.

The consumer type check fails native-module and global/config diagnostics. It resolves workspace sources with the development condition rather than depending on ignored local SDK `.d.ts` builds. Existing diagnostics in imported monorepo implementation files remain owned by those packages and are reported as a count; this check does not claim to type-check the whole monorepo.

## Verified implementation — 2026-10-13

[CI run 38412284027](https://github.com/learningeconomy/LearnCard/actions/runs/38412284027) passed at `10141da123da851425e3571a3bae53b4964eabcf`: 47 Bun cases, 36 Swift cases and 25 simulator tests, with one intentionally skipped opt-in live exchange. It also passed independent web-SDK verification of 10 iOS credential/crypto outputs and Release compilation. This is the earlier Apps baseline, superseded by the resumed Families/Colorful work below. See [STATUS.md](STATUS.md) for the current review build and live-validation scope.

## Families and visual refinement — 2026-10-13

The Families/Colorful baseline included 69 Bun cases, 43 Swift cases and 30 simulator checks, plus the intentionally skipped opt-in live exchange. Earlier local full native CI passed the Families account/lifecycle/UI/SDK checks and independent verification of 10 outputs; the final sender/UI refinements then passed all 69 protocol cases, the native source-contract check, all 22 UI-flow tests and Release compilation. The Colorful revision adds category round-trip/legacy/unknown-partner decoding checks and verifies an actual amber Family template with the SDK. Hosted results must be checked against the new branch commit after pushing.

The Colorful category revision passed the full local suite (142 cases, one opt-in live skip), independent web-SDK verification of 10 iOS outputs and Release compilation. Result bundle: `artifacts/native-regressions-20261013-211135-84923.xcresult`. The later stronger-backdrop pass changes only visual surfaces and framing; its focused title/language/dark/Families checks are recorded in the current handoff.

The stronger-backdrop pass passed all eight focused UI checks: the five Families flows, Collection scrolling/title branding, all main destination titles and dark share-sheet behavior. Attachments were inspected for Collection and French/light plus English/dark rosters. Result bundle: `artifacts/ui-20261013-212041-88379.xcresult`. Final Release compilation also passed after small contrast/framing refinements. No pixel-diff snapshot assertion is implied.

Family regressions cover full owned/member/roster pagination, foreign family refusal, permissions and claim-policy changes, PIN confirmation/clearing, ambiguous creation refusal, stable retry receipts, legacy template-proof/custom-appearance preservation and refusal of generic family delivery. Late reads/creation and new actions after account lock are tested in the production store. Simulator checks cover creation/editing, invite access review without immediate guardian addition, translated/dark rosters and background/resume. A full-suite run caught compact French Inbox text incorrectly replacing a canonical page/VoiceOver label; deterministic literal lookup and explicit compact keys now have a regression assertion.

These are synthetic mutations and real local SDK signatures, not live family setup or child-account access. See [Families integration](FAMILIES_INTEGRATION.md) and [the child-account test gate](FAMILIES_NEXT_PHASE.md).

## Earlier interactive credential experiment — 2026-10-14

This hold-and-drag interaction is superseded by the automatic-loop direction below. The local evidence is retained as history; hosted run `38517841840` for `77efd4fd9` failed. The abbreviated log does not establish a cause, and artifact retrieval timed out. The workflow now prints result summaries on failure as well as success.

The Families/Colorful source baseline `a0321e78c` passed [hosted CI 38496224004](https://github.com/learningeconomy/LearnCard/actions/runs/38496224004). This follow-up adds two UI regressions, bringing the suite to 69 Bun + 43 Swift + 32 simulator cases (144), plus the intentionally skipped opt-in live exchange.

The new cases hold/drag the actual detail card, then perform a quick swipe starting on it and claim the sample. They run with accessibility-size text so scrolling is necessary, including a static Reduce Motion preview of the same production branch. Dark-mode sharing is checked alongside them. They use synthetic samples and make no live account mutations. DEBUG large-text presentation is applied inside the review sheet too, since the modal does not inherit the outer preview override; Release ignores the preview flags.

The gesture waits 0.35 seconds before activation. A standard XCTest swipe has a 0.2-second touch lead-in, which the earlier 0.18-second threshold incorrectly treated as a hold. Quick swipes now fail the hold and reach the parent ScrollView. Global drag coordinates avoid feeding a rotating card's changing local origin back into its input. The implementation has no page-wide scroll-disabled state.

After the user requested neutral page canvases again, all five focused UI checks passed: the two new detail-card cases, Collection scroll/title branding, all main destination titles and dark-mode sharing. Result bundle: `artifacts/ui-20261014-013406-10109.xcresult`. Light Collection and dark detail/share attachments were inspected. This is functional and visual review, not a pixel-diff assertion or a new local full-suite run.

Native source-contract validation and final Release compilation passed. Debug was then rebuilt and installed on LearnCard Native Lab; executable, SDK and private configuration hashes matched the build. Build/test/install commands must run sequentially when sharing the same DerivedData directory, otherwise Xcode's build database can lock.

## Drawn shell, adaptive lists and automatic detail motion — 2026-10-14

The pre-resume drawn-shell suite had 69 Bun + 43 Swift + 34 simulator cases (146), plus the intentionally skipped opt-in live exchange. Two new UI cases check action/account entry on all four tabs and Collection search: all matches visible, no Latest issued card, illustrated no-match state and reset to browsing. The existing detail-card cases now exercise native scrolling and claiming with accessibility-size text under automatic motion and Reduce Motion; the touch recognizer is removed.

The shared-header test caught a real popover routing bug: using one presentation binding on all four toolbar anchors could target a hidden tab. Each anchor now presents only for the active tab. Container accessibility identifiers also overrode nested credential/reset button identifiers in SwiftUI; identifiers now remain on the controls themselves. These changes preserve the existing tests instead of weakening assertions.

The full local suite passed all **146 cases** (69 Bun, 43 Swift, 34 simulator; one opt-in live skip), including the source-contract check and independent web-SDK verification of 10 iOS outputs. Result bundle: `artifacts/native-regressions-20261014-021459-27510.xcresult`. Inbox, compact search results/empty state and dark detail/share screenshots were inspected. Xcode compiled the preserved-vector light/dark SVG assets. Search uses a short local-filter debounce; no network-wide search is claimed. This is not pixel-diff or iPad validation.

## Resumed drawn shell and Inbox — 2026-10-14

The suite now includes **171 cases**: 84 Bun, 51 Swift and 36 simulator cases, plus one intentionally skipped opt-in live exchange. The new command checks execute the real account bundle for `inboxList`/`inboxAction`. Inbox protocol cases cover owned identifiers, fresh request state, committed-write reconciliation, archive semantics, server-only POST_CLAIM prompts, prompt UUID deduplication, terminal server states/receipts, linked notification metadata, opaque/broken pagination and account switches. These are synthetic boundaries, not real connection writes.

Swift cases cover late reads/actions after lock, duplicate taps, terminal receipts when metadata fails, page reconciliation, duplicate credential-arrival suppression, demo-only post-claim prompts, response errors, localization and exact transport routes. Existing production account-controller background/resume and sign-out tests also assert that the old Inbox is cleared, remains locked and is replaced on resume.

Four focused simulator cases passed in `artifacts/inbox-focused.xcresult`: Inbox request/update actions, explicit post-claim decision, shared header across tabs and Collection search/reset. Their screenshots were inspected: new outlined tray icons/underline, readable plus, drawn avatar, compact rows and illustrated prompt. The full local 170-case suite passed, independently verified 10 iOS outputs with the web SDK, and compiled Release. Bundle: `artifacts/native-regressions-20261014-155632-36714.xcresult`. Final source-contract/protocol checks and all 51 core cases passed again after strengthening the production account-controller Inbox assertions.

Both direct UI runs and CI default to the dedicated LearnCard Native UI Checks simulator. An explicit device override is still supported. Build/test scripts use `nice -n 10` and two jobs by default; override with `LC_NATIVE_BUILD_JOBS`. Shared DerivedData operations remain sequential. Local full-suite runs must preserve/restore the private review configuration before installing a live-account build.

The later scale/brand feedback was applied after that full run. Five focused shell/search/large-type/scroll checks passed in `inbox-bold-shell.xcresult`, and four language/dark-mode/connection checks passed in `inbox-bold-languages.xcresult`. The painted mosaic/wordmark/smiley revision passed shared-header and French/Arabic checks; the new collapse assertion caught duplicate native AX wrappers, then an in-progress transition measurement. It now uses the first wrapper and waits for the collapsed geometry, retaining the assertion. `inbox-wordmark-settled.xcresult` passes the final scrolling-header check; `inbox-final-chrome.xcresult` passes dark sharing but retains the historical early measurement failure. The wordmark explicitly reserves its native layout width and hides its accessibility text when collapsed. These focused passes do not claim a second full 170-case run on the final visual source. Fresh hosted CI checks the pushed source.

A final protocol follow-up handles legacy sender strings: a staging did:web username is decoded and resolved through current pending membership; a same-named identity from another network cannot accept a local request. This adds one case (84 Bun, 51 Swift, 36 simulator = 171 current cases). The recorded full local 170-case run predates this final case; focused protocol/source-contract checks cover the change.

## Approved screens, stable header and rendered motion — 2026-10-15

At this checkpoint the suite had **174 cases**: 84 Bun, 51 Swift and 39 simulator cases, plus the opt-in live exchange intentionally skipped. The full local suite passed in `artifacts/native-regressions-20261015-014409-23844.xcresult`, independently verified 10 iOS outputs with the web SDK, and compiled Release. The preceding pushed baseline `c3db8563b` separately passed [hosted run 38638878502](https://github.com/learningeconomy/LearnCard/actions/runs/38638878502) at 171 cases. Check the new source SHA/run before claiming hosted success for this implementation.

Two new simulator cases compare actual cropped card pixels two seconds apart after navigation without touching the card: motion changes the rendering, while Reduce Motion leaves it identical. These verify rendered behavior rather than a Boolean alone. Existing large-text swipe/claim cases remain. The scroll regression now checks a fixed-width, fixed-position left brand/section label and tightly adjacent action/profile hit areas; the user rejected the old shrinking-width/centered-title transition.

A third new case opens an installed app directly from My apps and checks the real bundled partner SDK handshake through the existing sample browser. Account/Apps/privacy/Families screenshots are retained. The guardian case requires recipient selection then an explicit Review invitation step before a secure PIN field or Send action appears. It still checks incorrect-PIN errors, immediate input clearing and that an invite does not immediately add a guardian.

Eight focused checks passed in `artifacts/approved-design-focused.xcresult` before the final masked-PIN/disabled-contrast refinements. The full 174-case run includes those refinements. After that run, a five-digit cap prevents a sixth hidden character from disabling the five-indicator input; the strengthened guardian case and Account/Data Sharing checks passed on a dark simulator in `artifacts/approved-design-dark-final.xcresult` (three cases). Appearance was restored afterward. Screenshots were inspected in light/dark modes, including French/Arabic Apps and dark Families. These are dynamic frame comparisons and visual review, not golden-image snapshot testing or physical-device/iPad validation.

## Home, adaptive tray and illustrated fallbacks — 2026-10-15

At the Home checkpoint: **181 passing cases** — 84 Bun, 55 Swift (42 XCTest and 13 Swift Testing), and 42 simulator cases. One opt-in live exchange is intentionally skipped. The full run passed in `artifacts/native-regressions-20261015-022805-41537.xcresult`; `artifacts/home-full-ci.log` records the type/source checks, independent verification of ten iOS outputs using the web SDK, and successful Release compilation.

New coverage checks shared Home/tray unread counts (including duplicate credential arrival notices and read updates), initial installed-app loading versus empty state, lock clearing that state, native plural/name formatting, bounded navigation sizing by logical width, Home → Inbox/Collection/Create, installed app → native listing, My apps selection, and native Data Sharing. French dark mode and Arabic accessibility type screenshots are retained. Navigation labels cap at 18 points after visual review caught mid-word wrapping at large Arabic text sizes; page content continues scaling normally.

After the full run, an explicit Home → Apps entry was refined to clear a previous Apps search/detail stack while preserving normal tab state and reusing the account-owned store. Session activity also observes locale changes. All three Home cases passed again against these changes in `artifacts/home-final.xcresult`; the strengthened navigation case verifies both a prior search filter and a prior listing detail cannot intercept See all. Final compilation/install evidence is recorded in STATUS.

Screenshots were inspected for the Home light/dark/RTL layouts and the bold credential category illustrations in Collection/Inbox. Supplied artwork is still preferred; app fallback is a generic illustrated window, not an invented publisher identity. The wider-width sizing contract is tested, but physical-device and iPad layouts are not validated. These are functional checks and visual review, not golden-image baselines.

The preceding pushed parent `c9c0cfbf4` passed [hosted run 38690372140](https://github.com/learningeconomy/LearnCard/actions/runs/38690372140). The Home commit `4dde77e13383394163bad3ddaa7131d0f6d0adc3` subsequently passed [hosted run 38694796776](https://github.com/learningeconomy/LearnCard/actions/runs/38694796776). The category update gets a separate source-specific run.

## Consumer category parity — 2026-10-15

The configured suite now has **191 cases**: 89 Bun, 57 Swift (42 XCTest and 15 Swift Testing), and 45 simulator cases, plus the intentionally skipped opt-in live exchange. This category change passed all 89 Bun and 57 Swift cases, the native type/source contracts, and **seven focused simulator cases** in `artifacts/category-verified.xcresult`. This is targeted validation, not a new local full 191-case run. The preceding Home baseline passed its full 181-case suite and hosted run linked above.

New protocol cases cover stored/unknown category preservation, explicit issuer-tag precedence, conservative historic Qualifications inference, Certificate versus Certification, first subject/achievement arrays and the standard certified wrapper, with signed proof content unchanged. New core checks keep semantic categories distinct despite the legacy authoring kind and keep Family outside Collection.

Three new UI cases exercise Portfolio and Qualifications independently, category-scoped search/clear, Assistance detail labels, Family filter separation, and French/Arabic dark layouts. Existing creation/action-sheet, claim, Collection search and native sharing cases passed alongside them. Category chips are revealed using native touch-coordinate drags before activation: asking XCTest for an entirely offscreen activation point throws, and the convenience swipe did not reliably move this horizontal nested scroller. The explicit drag passes while retaining assertions on the actual visible controls. Selected pills center after selection.

Portfolio and Qualifications light screenshots and Arabic/French dark screenshots were visually inspected. These are synthetic unsigned fixtures, not account migration or proof reissuance. The suite uses a dedicated simulator and restores private review configuration. Full-category authoring, network-wide category search, physical-device and iPad validation remain outside this change. See [category sources and compatibility rules](CATEGORY_PARITY.md).

Final Release compilation passed in `artifacts/category-release.log`. Debug was rebuilt/installed in Native Lab, and all five installed-build comparisons passed (`artifacts/category-install-proof.json`). The existing staging account resumed with Collection 30+ and Inbox badge 3 during read-only review; no account mutations were performed.

## Native scanner and claim flow — 2026-10-15

All **102 Bun** and **68 Swift** cases passed, with native source/type contracts. The Swift total is 53 XCTest plus 15 Swift Testing cases. Results: `artifacts/claims-bun-final.log`, `claims-core-verified.log`, `claims-types-final.log`. New protocol checks execute the actual command dispatcher, preview/issue/finish/reconcile services, exact deployed `/api/storage/resolve` route construction, owned receipt guards, category preservation and real web-SDK signature/tamper verification. Production-store checks cover no issuance during review, duplicate confirmation, refused protected journal writes, pending sign-in/recovery intent, account switches, lock/late-read disposal, known-receipt relaunch, uncertain result reconciliation and late issued receipts without reopening UI.

Vision decodes actual generated QR PNG data in tests and rejects an image containing two distinct codes. Camera hardware is not simulated; PhotosPicker itself and physical capture still need manual validation. The app's permission resources have four locales, and photos remain local.

The initial **11 focused simulator checks** passed in `artifacts/claims-focused.xcresult`: three new scanner/recovery cases, all five account lifecycle UI cases, existing sample Receive/claim and native sharing selection. A subsequent five-case pass in `artifacts/claims-ui-final.xcresult` covered the four claim cases plus existing Receive after contrast and completion refinements. The large-text DEBUG override is applied inside the full-screen claim surface, as it is for other review sheets; final regression evidence follows below. Screenshots are reviewed layouts, not golden-image comparisons or a physical-camera claim.

While this work ran, the previous category head `9a96b20a2` completed [hosted CI 38700166174](https://github.com/learningeconomy/LearnCard/actions/runs/38700166174) with three simulator failures: email recovery, the system share action, and Portfolio-to-Qualifications switching. Its other 42 simulator cases passed. The summaries show a share remote container without the Copy action and an unselected offscreen Qualifications chip; they do not establish an account-controller defect. The updated checks retain the required assertions, wait for actual enabled/selected/hittable states and use a slow held horizontal drag without a flick. The system share test separately waits for its remote container and Copy action. Exact hosted success still requires the new commit's run; local passes are not substituted for it.

See [QR/claim contracts](QR_CLAIM_FLOW.md) for pending-intent lifetime, receipt metadata, unresolved-result limits, Family/web handling, other protocol boundaries and HTTPS associated-domain setup. Automated tests do not send credentials or consume claim links on the approved real account.

The final **ten focused cases** passed in `artifacts/claims-final-regressions.xcresult`: all four claim cases, all three category cases, the previously failing recovery and native share cases, and existing Receive cancellation. This follows the 11-case lifecycle/claim/sharing pass above. Final French accessibility-size/dark and Arabic dark layouts were inspected. The complete shared web category table was extracted unchanged into a dependency-light module; all 12 existing web credential-helper tests passed in `artifacts/claims-web-helper.log`, and the old/new table source was compared byte-for-byte. Final native protocol/type checks passed after that extraction.

Final Release passed in `artifacts/claims-release-final.log`. Debug was rebuilt/installed into LearnCard Native Lab; all five build/install hashes matched (`artifacts/claims-install-proof.json`), and all four camera-permission language resources are present. The real staging account resumed at Collection 30+ / Inbox badge 3. A public intentionally invalid native claim handoff reached the unavailable-link screen through the real bundled SDK and deployed preview path, then Cancel returned to Collection. This was read-only: no live claim capability was consumed and no credential was issued/sent/indexed by the agent. Physical capture and a successful dedicated live claim remain manual validation items. The checks simulator is shut down after validation.

One final production-store regression covers background during the protected marker write, before any issuance starts: the unused marker is removed so recovery can return to review rather than being stranded as uncertain. All 68 Swift cases passed after this fix; the new receipt marker is retained whenever a mutation may actually have started.
