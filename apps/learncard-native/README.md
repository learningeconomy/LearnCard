# LearnCard native client experiment

An independent personal credential app: SwiftUI on iOS first, Kotlin and Jetpack Compose on Android after the credential and account contracts are proven. It focuses on collecting, receiving, creating, claiming, sending, and sharing credentials. The user approved fully native clients on October 12, 2026.

**Current handoff:** [STATUS.md](STATUS.md) records the review build, validation and remaining scope. Learner Home, Passport, Apps, credential details/share/status, personal Skills/goals and [career exploration](CAREER_EXPLORATION.md) are implemented. Safe self-assessed skill editing leads the [remaining learning queue](LEARNER_LEARNING_PLAN.md). First-time setup, recovery and approval are documented in [FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md).

The default app now connects to the approved staging test account through native Firebase email-code sign-in, the existing SSS recovery flow, and device-bound Keychain storage. Existing-account recovery, profile loading, the first 30 encrypted collection records, incoming offers, and relaunch have been confirmed live. See [account integration](ACCOUNT_INTEGRATION.md) for evidence and remaining cases.

Run with `--demo` for **unsigned, in-memory sample content**. Samples reset on restart; sample sending records local activity and delivers no messages. The native redesign uses actual credential artwork, neutral light/dark canvases, colorful layered cards, round artwork windows, and reduced-motion-aware transitions. The main destinations are **Home, Passport, Inbox, and Apps**. Home is the initial destination after signup/sign-in: a streamlined dashboard with arrivals, creation, Families and session activity. Apps has native catalog discovery, installation, app details, agreement review and an in-app browser. Profile Data Sharing is native too; see [APPS_INTEGRATION.md](APPS_INTEGRATION.md) for support boundaries and follow-ups.

## Run on iOS

Requires macOS, Xcode 16 or newer, its command-line tools, Python 3, and an installed iOS simulator runtime. Development currently targets iPhone on iOS 18 or later. The sample UI needs no CocoaPods, XcodeGen, backend, secrets, or signing team for simulator use. The SDK compatibility tests additionally require Bun and the existing monorepo JavaScript dependencies.

From the repository root:

```bash
LC_NATIVE_TEST_EMAIL=your-test-login@example.com bash apps/learncard-native/scripts/run-ios.sh
```

The selected test email is a prefill saved only in ignored local build configuration and reused on later builds. Email is editable in the app; a fresh checkout starts with a non-deliverable placeholder. Native first-time setup uses staging services and requires saving/confirming an encrypted recovery backup before profile creation. No personal test email is committed. Run with `--demo` for sample mode.

This creates or reuses a dedicated **LearnCard Native Lab** simulator, builds the app, installs **LearnCard Lab**, and opens it. Set `LC_NATIVE_SIMULATOR_ID` to use a particular installed simulator. The experiment has its own bundle identifier, `org.learningeconomy.learncard.native.experiment`.

Open `ios/LearnCardNative.xcodeproj` in Xcode to edit or run interactively. For a physical device, select your own Apple development team under Signing and Capabilities; real-device verification is still required.

```bash
# Account security and domain tests, including sign-out races and claim/link validation
bash apps/learncard-native/scripts/test-core.sh

# Simulator build without launching
bash apps/learncard-native/scripts/build-ios.sh

# Native interaction tests and an iOS JavaScriptCore capability probe
bash apps/learncard-native/scripts/test-ios.sh

# SDK interoperability spike with independently verified iOS outputs
bash apps/learncard-native/scripts/test-sdk.sh -quiet

# Opt-in live staging exchange with fresh disposable test profiles and cleanup
bash apps/learncard-native/scripts/test-staging.sh -quiet

# Optional Nx entry points
bunx nx run learncard-native:run-ios
bunx nx run learncard-native:test-core
bunx nx run learncard-native:test-ios
```

UI results are saved under `artifacts/` as `.xcresult` bundles. Derived data and test artifacts are ignored. Native targets are named `build-ios`, `test-core`, `test-ios`, `test-sdk`, and `test-staging` so repository-wide web builds and tests do not require Xcode on Linux.

Native CI is available on demand, including account recovery, background/resume and sign-out regressions. It does not run on ordinary pushes or pull requests. Development stays in `learningeconomy/LearnCard` on `codex/vesper-73`; see [TESTING.md](TESTING.md) for manual dispatch, local commands, fixture isolation and failure artifacts.

The staging runner creates two private test profiles, sends an encrypted credential, runs the native claim/index/send exchange, and checks the results with the current SDK. It removes its own test records and profiles on exit. Generated identity material stays in ignored local files; native initialization refuses setup older than 20 minutes. If cleanup fails, the runner retains `sdk-spike/generated/staging-state.json`; retry with `bun --conditions=development apps/learncard-native/sdk-spike/staging-account.ts cleanup`. The regular scheme skips the live test; `LearnCardNativeStaging` explicitly enables it.

Staging network, LearnCloud, and account recovery endpoints are selected explicitly. Native sign-in uses the approved shared `learncard` Firebase project. The disposable staging exchange and the existing Firebase-backed account connection are separate validations; see [ACCOUNT_INTEGRATION.md](ACCOUNT_INTEGRATION.md).

Try a sample claim link after launching with `--demo`:

```bash
xcrun simctl openurl booted 'learncard-native-demo://claim/first-aid'
```

Use a specific simulator ID instead of `booted` if several simulators are running. Real LearnCard links are intentionally rejected by this sample adapter.

## Layout

```text
learncard-native/
  PLAN.md                         Product direction, architecture, integration gates
  project.json                    Optional Nx entry points
  scripts/                        Build, run, test, deterministic project generation
  ios/
    LearnCardNative.xcodeproj/     Committed project and shared scheme
    Info.plist                    Separate identity and demo URL scheme
    Sources/                      SwiftUI features and presentation state
    NativeCore/                   Domain package, platform SDK harness, and tests
    UITests/                      XCTest interaction tests
```

SwiftUI talks to `CredentialService`: `LiveCredentialService` uses the account SDK host, while `DemoCredentialService` powers sample mode. The original signed credential is retained separately from the display model. Changing its presentation never mutates or reissues its contents.

Adding Swift source files requires no project update because the project uses Xcode synchronized source groups. If project settings change, update `scripts/generate-project.py`, then run:

```bash
python3 apps/learncard-native/scripts/generate-project.py
```

See [the SDK spike results and account connection design](SDK_SPIKE.md) and [the product and implementation plan](PLAN.md) for the live-account integration sequence and Android follow-up.

Consumer Apps is implemented, and the first native Families slice covers roster, family creation/editing and guardian invitations. Native child-account creation/switching and guardian approval, AI career Pathways and AI Sessions remain follow-ups; résumé builder stays web-only. Store administration and developer publishing portals remain excluded; see [PLAN.md](PLAN.md).

The approved visual direction and implementation brief are saved in [design/BRIEF.md](design/BRIEF.md). Reproduce navigation artwork with `bun apps/learncard-native/scripts/prepare-branding.ts` from the repository root; The generator rasterizes deterministic vector artwork, including light/dark navigation variants.

The plus menu now provides Create new, Send existing creation, and Share credentials. Create includes artwork, format/category action sheets, criteria, recipient selection, and review. Home → Your creations holds reusable templates; Collection holds personal credentials. Sharing supports explicit single/multiple selection and reuses the web encrypted link contract. Demo sharing exports unsigned sample text and creates no online link. New live artwork upload, managed delivery, and share-link publication still require live end-to-end validation; see ACCOUNT_INTEGRATION.md.

```bash
# Draft signing, sharing protocol interoperability, and transport checks
bun --conditions=development test apps/learncard-native/account-runtime/*.test.ts apps/learncard-native/sdk-spike/staging.test.ts
```

The second visual pass replaces the floating tab island with an opaque bottom tray, matches the generated outlined icon style (including Apps rocket), uses compact thumb-left Inbox rows, shows artwork loading progress, and groups Account controls on a solid sheet. Name/bio editing is native; web-only settings have explicit handoffs. See [secondary design brief](design/SECONDARY_BRIEF.md).

Native localization uses `localization/Localizable.xcstrings`, with English, Spanish, French and Arabic output generated by `scripts/prepare-localization.ts`. Change the app language under Account. New Apps/Data Sharing flows are covered; selected existing labels are translated, while remaining builder/recovery/dashboard copy needs migration. Keep stable model/permission IDs and publisher/credential content out of translation lookups. [Apple String Catalogs](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog) handle the native layer; [Paraglide](https://paraglidejs.com/) remains a JavaScript/web tool.

## Inbox connections and drawn shell

Inbox now combines credential offers with account notifications, connection requests/updates and server-created suggestions. See [Inbox integration](INBOX_INTEGRATION.md) for supported actions and live-validation limits, and [the drawn-shell brief](design/DRAWN_SHELL_BRIEF.md) for current icons, typography, SVGs and neutral Colorful styling. Direct UI test runs default to LearnCard Native UI Checks; builds use two jobs at reduced priority (`LC_NATIVE_BUILD_JOBS` can override this).
