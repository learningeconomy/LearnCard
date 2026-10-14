# Native regression checks

The `Vesper checks` workflow runs on every push to `codex/vesper-73`, on pull requests from that branch, and on manual dispatch. Its check is **Native regression suite**. It uses macOS 15 and Xcode 26.3, selects an available iOS runtime, and creates/reuses a dedicated **LearnCard Native UI Checks** simulator. It does not change repository branch protection.

The same suite can run locally:

```bash
bash apps/learncard-native/scripts/test-ci.sh
```

An explicit `LC_NATIVE_SIMULATOR_ID` overrides simulator selection; choose a test simulator, since UI checks install and relaunch the app. The suite forces the non-deliverable `native-test@example.invalid` build configuration. Reconfigure the test email before installing a later live-account build.

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

## Interactive credential details — 2026-10-14

The Families/Colorful source baseline `a0321e78c` passed [hosted CI 38496224004](https://github.com/learningeconomy/LearnCard/actions/runs/38496224004). This follow-up adds two UI regressions, bringing the suite to 69 Bun + 43 Swift + 32 simulator cases (144), plus the intentionally skipped opt-in live exchange.

The new cases hold/drag the actual detail card, then perform a quick swipe starting on it and claim the sample. They run with accessibility-size text so scrolling is necessary, including a static Reduce Motion preview of the same production branch. Dark-mode sharing is checked alongside them. They use synthetic samples and make no live account mutations. DEBUG large-text presentation is applied inside the review sheet too, since the modal does not inherit the outer preview override; Release ignores the preview flags.

The gesture waits 0.35 seconds before activation. A standard XCTest swipe has a 0.2-second touch lead-in, which the earlier 0.18-second threshold incorrectly treated as a hold. Quick swipes now fail the hold and reach the parent ScrollView. Global drag coordinates avoid feeding a rotating card's changing local origin back into its input. The implementation has no page-wide scroll-disabled state.

After the user requested neutral page canvases again, all five focused UI checks passed: the two new detail-card cases, Collection scroll/title branding, all main destination titles and dark-mode sharing. Result bundle: `artifacts/ui-20261014-013406-10109.xcresult`. Light Collection and dark detail/share attachments were inspected. This is functional and visual review, not a pixel-diff assertion or a new local full-suite run.

Native source-contract validation and final Release compilation passed. Debug was then rebuilt and installed on LearnCard Native Lab; executable, SDK and private configuration hashes matched the build. Build/test/install commands must run sequentially when sharing the same DerivedData directory, otherwise Xcode's build database can lock.
