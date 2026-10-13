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
