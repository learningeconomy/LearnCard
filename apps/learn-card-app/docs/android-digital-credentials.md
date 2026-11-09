# Android digital credential provider (LC-2157)

This development slice adds an app-local Capacitor bridge and an Android Credential Manager provider Activity. It carries forward the local response prototype from [PR #1795](https://github.com/learningeconomy/LearnCard/pull/1795).

The production provider is **disabled by default**. The dedicated `com.learncard.app.dctest` development build connects the reusable Android module to LearnCard's account initialization, encrypted LearnCloud credential inventory and existing OpenID4VP consent screen. Separate debug lab applications provide a synthetic issuer and native verifier. The development build can use Vite or bundled assets; either account-flow mode still requires reachable test APIs and a provisioned synthetic account.

## Reviewer quick start: which apps do I need?

**Yes, the native-app demo needs a separate requesting app.** LearnCard Verifier Lab asks Android for a credential and checks the returned proof. It is not part of the normal LearnCard installation.

| What you want to test                            | Install                                                                            | Backend/account needed?                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Quick synthetic bridge demo                      | **LearnCard Holder Lab** + **LearnCard Verifier Lab**                              | No. Holder Lab creates its own synthetic sample.                                                                |
| Independent browser demo (#2008)                 | **LearnCard Holder Lab** + stable **Chrome 141+**                                  | No account backend. Run the synthetic-only verifier server below; Verifier Lab APK is unnecessary.              |
| The actual LearnCard account flow shown in #1835 | **LearnCard Native Dev** (`com.learncard.app.dctest`) + **LearnCard Verifier Lab** | Yes. Local test APIs, a disposable account and a provisioned Course Completion sample. Follow the next section. |

### Fastest hands-on demo (no backend)

Use the PR branch, the repo-pinned Bun, JDK 21 and Android SDK 36. Start a Google Play-enabled Android emulator in Android Studio (4 GiB RAM recommended), then run from the repository root:

```bash
bun install --frozen-lockfile
bun install --cwd apps/learn-card-app/android/digital-credentials-lab --frozen-lockfile
cd apps/learn-card-app/android/digital-credentials-lab
# macOS Android Studio paths; on Linux set these to your installed JDK/SDK.
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' \
ANDROID_HOME="$HOME/Library/Android/sdk" \
../gradlew :lab:assembleHolderDebug :lab:assembleVerifierDebug
adb devices -l
# Replace this value with the device serial printed above.
LC_ANDROID_SERIAL=emulator-5554
adb -s "$LC_ANDROID_SERIAL" install -r lab/build/outputs/apk/holder/debug/lab-holder-debug.apk
adb -s "$LC_ANDROID_SERIAL" install -r lab/build/outputs/apk/verifier/debug/lab-verifier-debug.apk
```

1. Open **LearnCard Holder Lab** → **Register Sample**.
2. Open **LearnCard Verifier Lab** → **Request Course Details**.
3. Choose **Sample Course Completion** in Android's selector and continue to consent.
4. Approve the two requested fields. Verifier Lab must show **Verified**; reaching consent alone is not a pass.
5. Request again and cancel. Expect **Canceled. No credential was received.**
6. In Holder Lab choose **Clear Samples** when finished.

These APKs build from source; there is no hosted APK download supplied by these instructions. This lab uses a simplified holder and synthetic data: it proves the shared bridge/request/response demo, **not** LearnCard account initialization, cloud inventory or the full account lifecycle. For that, use the real account setup below. The regular LearnCard release has its provider disabled and will not substitute for **LearnCard Native Dev**.

### Already have the full-account test build?

Install `app-debug.apk` built with `-PdigitalCredentialsDev` **and** `lab-verifier-debug.apk` on the same device. You do not need Holder Lab for this mode. Before opening Verifier Lab, confirm LearnCard Native Dev can reach the configured test APIs, sign into a disposable `android-native-*` account, provision the sample and foreground LearnCard to register it. Bundling the web assets removes Vite; it does not remove the API or sample-account prerequisites. Use synthetic credentials only.

## Try the real account flow

Use the repo-pinned Bun, JDK 21, Android SDK 36 and a Google Play-enabled emulator. A 4 GiB emulator avoids the low-memory caller termination seen with the full app and verifier on the original 2 GiB AVD. Keep your normal LearnCard installation: the development APK has its own application ID and account data.

1. Start the normal local LearnCard backend. Defaults below are Brain 4000, LearnCloud 4100 and LCA API 5100; override the helper's port flags for another owned stack.
2. From the repository root, configure the ignored development artifacts:

    ```bash
    bun apps/learn-card-app/scripts/native-digital-credentials/prepare-account-proof.ts
    ```

3. Run the app's normal environment preparation and `cap sync android` from `apps/learn-card-app`. Then run the helper again with `--after-sync` and start Vite on port 43157. The helper retains the real HTTPS tenant connectivity probe while routing account APIs to local services; it disables analytics and native Firebase authentication for the synthetic seed-based test.
4. Build from `apps/learn-card-app` with a command-scoped JDK/SDK:

    ```bash
    JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' \
    ANDROID_HOME="$HOME/Library/Android/sdk" \
    android/gradlew -p android :app:assembleDebug \
      :learncard-digital-credentials:testDebugUnitTest -PdigitalCredentialsDev
    adb -s emulator-5580 install -r android/app/build/outputs/apk/debug/app-debug.apk
    ```

5. Reverse ports 43157, 4000, 4100 and 5100 with `adb -s emulator-5580 reverse tcp:PORT tcp:PORT`. Open **LearnCard Native Dev** and sign into a disposable `android-native-*` profile through `/developer/sign-in`. Never use a personal account or production services for this setup.
6. In that development WebView's console, import `/scripts/native-digital-credentials/account-proof-client.ts` and call `provision()`. It signs a synthetic course credential bound to the active account, verifies its issuer, writes through the real encrypted store/index and checks readback. `inspect()` returns only safe counts/flags; `removeFixture()` removes only the synthetic index entry. The helper refuses other app IDs, nonlocal APIs and ordinary profiles. It is never imported by production code.
7. Foreground LearnCard. The normal listener automatically registers eligible inventory. Build/install only the verifier lab below, open **LearnCard Verifier Lab**, choose **Request Course Details**, then **Digital credential** → **Agree and continue**. LearnCard should display the shared consent screen with Course name and Completion date. A required field must stay selected before **Share** is enabled. The native verifier must display **Verified** after approval; seeing consent alone is insufficient.
8. Repeat with **Cancel**, Android Back and a cold process: background LearnCard, run `adb shell am kill com.learncard.app.dctest`, confirm its PID is absent and request again. Use ordinary process death rather than `force-stop`, which changes component eligibility. Removing the synthetic index entry and foregrounding LearnCard must remove its OS entry.

A sample with the wrong holder key, an invalid issuer signature, unrequested disclosure, a changed body or a removed index entry is rejected. Ordinary JSON-LD credentials are not automatically converted into native digital credentials.

## Build and run the emulator lab

Prerequisites: Android SDK 36 with build tools, a Google Play-enabled emulator, JDK 21, Bun, and the repository's workspace dependencies. Android Studio's bundled JDK can be used through a command-scoped `JAVA_HOME`; changing the machine's Java configuration is unnecessary.

From the repository root:

```bash
bun install --cwd apps/learn-card-app/android/digital-credentials-lab --frozen-lockfile
bun run --cwd apps/learn-card-app/android/digital-credentials-lab test
cd apps/learn-card-app/android/digital-credentials-lab
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' \
ANDROID_HOME="$HOME/Library/Android/sdk" \
../gradlew :lab:assembleHolderDebug :lab:assembleVerifierDebug
```

On Linux, use the installed JDK/SDK paths. The lab's Gradle `preBuild` bundles its web assets from source. Release variants of these applications are disabled.

Install both APKs on the selected emulator (replace the serial with your own):

```bash
adb -s emulator-5580 install -r lab/build/outputs/apk/holder/debug/lab-holder-debug.apk
adb -s emulator-5580 install -r lab/build/outputs/apk/verifier/debug/lab-verifier-debug.apk
```

1. Open **LearnCard Holder Lab** and select **Register Sample**.
2. Open **LearnCard Verifier Lab** and select **Request Course Details**.
3. Select **Sample Course Completion** in Android's system picker.
4. Review Course name and Completion date in the holder's Capacitor screen. Approve or cancel. Unchecking a required field disables approval.
5. On approval, the verifier checks the issuer signature, disclosure integrity, requested fields, nonce, certificate-origin audience, holder signature and SD-JWT key binding. It rejects unrequested learner-name/skills disclosure.

Use **Clear Samples** in the holder to remove its registry record and invalidate pending native handles. To check process restoration, background the holder, run `adb shell am kill com.learncard.dclab.holder`, then request again from the verifier. Android `force-stop` can affect component eligibility; record it separately from ordinary process death.

## Independent browser verifier (development only)

This adapter uses the separately maintained community package `@openeudi/openid4vp` **0.18.0** to build the request and verify the presentation. It is not an official EU reference verifier. The server imports only the public synthetic issuer key and Course Completion query, not LearnCard's parser/presenter/verifier. It requires the known lab issuer key, EdDSA signatures, the per-session nonce, HTTPS origin audience, holder binding and DCQL matching. The plaintext `dc_api` response is sent over HTTPS to the verifier server, where verification runs; it is never logged or persisted.

1. Use the #2008 branch. Install/register **Holder Lab** with the quick start above, and use current stable Chrome on the same Google Play-enabled emulator. For this browser demo, **do not install Verifier Lab** unless you also want the native-app demo. If Android offers both an older LearnCard development credential and the lab sample, open **More options** and choose **Sample Course Completion**.
2. Install the lab's pinned dependencies from the repo root:

    ```bash
    bun install --cwd apps/learn-card-app/android/digital-credentials-lab --frozen-lockfile
    ```

3. Serve this loopback-only endpoint through a trusted HTTPS proxy. One development option is an installed `cloudflared` CLI, in a separate terminal:

    ```bash
    cloudflared tunnel --url http://127.0.0.1:43164 --no-autoupdate
    ```

    Copy its generated `https://…trycloudflare.com` URL. This creates a temporary **public** URL; use synthetic credentials only. No production services or personal accounts are needed. A locally managed, trusted HTTPS reverse proxy can be used instead; do not bypass browser certificate checks.

4. Start the adapter with that exact HTTPS origin (no trailing slash):

    ```bash
    LC_VERIFIER_ORIGIN=https://YOUR-PRINTED-HOST.trycloudflare.com \
    bun run --cwd apps/learn-card-app/android/digital-credentials-lab verifier:browser
    ```

5. Open that URL in emulator Chrome. Choose **Request Course Details**, continue past Chrome's permission prompt, select **Sample Course Completion** in Android (using **More options** if needed), then **Agree and continue**. Consent must show that exact website origin. Approve: expect **Verified by independent verifier. Course name and Completion date checked.**
6. Repeat and cancel in LearnCard: expect **Canceled. No credential was received.** Unchecking a required field must disable approval. Repeat after ordinary holder-process death; keep this distinct from force-stop. Expired browser requests are refreshed before the next user-activated request; a long-running expired session fails rather than accepting a stale response.
7. Use **Clear Samples** when finished, and stop the server and temporary HTTPS proxy with Ctrl+C.

The adapter has single-use, five-minute sessions, a 32-session cap, an HttpOnly/Secure/SameSite cookie, exact-origin checks, bounded JSON input and no raw proof logging. The trusted public issuer key is an explicit **test trust anchor**; it is not a production issuer trust model. This browser/lab exercise does not establish the full LearnCard account lifecycle, an Android sample-verifier test, or physical-device acceptance. The release provider remains disabled. SQLite encryption is outside this sprint.

## Boundaries

- `android/digital-credentials/` is the reusable native library used by both the main application and the lab. It registers through AndroidX `OpenId4VpRegistry`, restricts registration to `openid4vp-v1-unsigned`, and returns results through `PendingIntentHandler`.
- `src/native-digital-credentials/` reads eligible SD-JWTs through the active account's encrypted read plane, stores private URI/digest mappings and routes native requests to the shared consent UI. Ownership follows the credential-bound Ed25519 key across the account's did:key/did:web aliases. Account replacement, logout and managed-profile switching invalidate native handles. Selected bodies, index membership, issuer verification and account ownership are checked again at approval.
- Registry refresh reads the authoritative LearnCloud index on every check, with at most four credential reads in flight, 200 reads per pass and 100 registered entries. A 60-second in-memory metadata/negative-result cache avoids rereading unchanged inventories on foreground; it never stores credential bodies. Budget-limited scans continue through cached results on retry. Index removal takes effect even while the metadata cache is fresh. Temporary body-read or issuer-resolution failures retain only still-indexed entries for the same account; confirmed invalid credentials are removed. Approval always rereads and revalidates. Inconclusive refreshes retry after 2, 10 and 30 seconds while foregrounded, then wait for a new inventory/foreground event. Oversized projections are rejected individually and reported as a count, without credential data.
- Native inventory reads, request preparation and approval bypass the SDK credential-body cache and read each LearnCloud index page with `cache: 'skip-cache'`. Skipping only the full-index cache is insufficient: LearnCloud's aggregate getter calls separately cached page getters without forwarding that option. Cache-first reads can reject a remaining credential before consent after registry replacement, or allow a removed credential through the index check. Failed index reads and incomplete pagination abort the operation; cached membership never authorizes approval. Regression tests exercise the real SDK cache wrappers and LearnCloud aggregation with fake transport, plus real SD-JWT response verification. An on-device warm A+B → B replay remains a separate acceptance gate.
- The typed bridge exposes `status`, `register`, `clear`, `getPendingRequest`, `complete`, `cancel`. Native handles are one-time and registry-generation-bound. Completion accepts no origin override. Expired requests can still be dismissed through Cancel or Android Back. The provider disables the main app's held native splash in its own Capacitor configuration, so its window can receive Back during account initialization.
- Only opaque entry IDs, VCT, title and claim paths/display labels cross the metadata boundary. `SdJwtClaim.value` is null. Value-constrained matching is not promised by this presence-based lab profile. Full credentials, private keys, claim values and LearnCloud URIs are rejected by the native projection schema.
- The native Activity requires Android's calling package. Delegation is restricted to `com.google.android.gms` with the pinned Google release certificate in its installed signing history and no multiple current signers. A system-app flag is not authority to impersonate another requester. Direct callers must match the installed launching package and certificate. Only Google Play services broker visibility is declared; `QUERY_ALL_PACKAGES` is unnecessary. Native-app origins use the caller's signing-certificate hash. Consent leads with the authenticated package (or browser origin); installed-app labels and request branding are not identity evidence.
- Privileged web origins require a package/certificate allowlist. The packaged allowlist contains only stable Chrome (`com.android.chrome`) with its Google-published release certificate; debug/other-channel/unknown/default-browser identities fail closed. AndroidX verifies the origin against that policy, followed by native HTTPS-origin validation. The device default-browser role alone grants no privilege. The pin comes from [Google’s published privileged-app list](https://www.gstatic.com/gpm-passkeys-privileged-apps/apps.json), checked November 9, 2026. Real Chrome DC API interoperability is still pending. No browser package or certificate supplied through JavaScript is trusted.
- The lab uses the existing synthetic Course Completion fixture, a publicly known development issuer seed and an independently generated holder key. Its private WebView storage contains only lab material; this is not a production key-storage design. Do not use real credentials or personal data in these apps. Both applications have distinct package IDs and backup is disabled.
- The lab uses a portable Ed25519 backend with the shared TypeScript SD-JWT/DCQL engine so older emulator WebViews do not need Ed25519 WebCrypto support. Both the lower-level DC API response builder and public convenience method require explicit request-bounded flat disclosure frames before signing.

## Remaining acceptance gates

- Qualify logged-out/recovery flows and all account/profile/key transitions beyond the synthetic personal-account path. The listener fences transitions; that is not a complete LC-2158 lifecycle qualification.
- Complete LC-2158 account/profile/key invalidation, credential lifecycle/status freshness, privacy, failure and interoperability qualification.
- LC-2159 SDK acceptance is implemented through #1835/#1981; broader query profiles are outside that ticket. LC-2158 independent-verifier interoperability remains pending. The public DC API helper now requires request-bounded flat disclosure frames; hosts remain responsible for credential matching/verification and presenting trusted consent UI.
- Validate browser callers and an independent verifier, then run physical-device tests on the Samsung Galaxy Fold after setup. One emulator does not satisfy the physical-device gate or supported-device matrix.
- Run the matching SDK/cross-surface `lc verify` journeys on Linux before rollout readiness. Browser journeys cannot prove Android provider behavior; native emulator/device evidence must remain separate.

Only `-PdigitalCredentialsDev` enables the dedicated debug app's provider. Production builds retain `lc_digital_credentials_enabled=false`; rollout remains gated on the remaining acceptance work.

## LC-2158 hardening and release qualification

The registry's `status()` is **local bookkeeping**, not a live GMS registry query. Startup and foreground synchronization reassert the eligible projection even when local IDs match, so a lost OS registration or an app update has a recovery path. This requires successful account initialization and index access. A provider request does not re-register while consent is open, because replacement invalidates its generation. Recovery after actual GMS reset/update is still a device acceptance test.

Registration invalidates local handles before calling GMS and commits new handles only if its generation has not changed. Generation capture and conditional replacement are atomic across plugin threads. An account/profile clear during registration cannot restore the old handles when registration returns. A failed register leaves handles unusable; a failed clear still removes the host's old account mapping. Empty projections retry clearing even if local preferences already look empty. GMS can retain stale display metadata until a later successful mutation; local generation checks and fresh account/body/index/issuer/holder checks must deny presentation in the meantime.

Eligibility remains intentionally narrow: flat holder-bound SD-JWTs only. Claim/issuance/index changes are observed through query invalidation and foreground refresh; deletion is checked against the index each time. Body-only changes can lag the 60-second cache. Credentials with `status` or `credentialStatus` payloads are excluded, because the SDK currently defers Token Status List checking. This does not establish complete revocation/suspension synchronization. Expiration and confirmed invalidity are checked on refresh and again for approval; while foregrounded with no open provider consent, the listener refreshes at the earliest known expiration, independently of query events. Verified expiration stays in the private mapping and prevents retaining a known-expired entry through a temporary body-read failure or scan-budget fallback. Background timers are canceled; foreground rechecks elapsed deadlines. This is not an OS background service: eviction while killed/backgrounded, index-outage recovery and offline status freshness are not promised.

Privacy boundaries remain generic credential titles, opaque random IDs, VCT and claim names/paths in the OS projection, with no claim values. URI/digest/account-key mappings stay in private app storage. Native diagnostics report only rejection stage and exception class; refresh diagnostics report projection-rejection counts. VCT and claim names can still reveal credential type and require issuer/schema review before rollout. No new analytics payloads are added.

Dependencies are pinned in the module to Credentials **1.6.0** and registry/OpenID/SD-JWT libraries **1.0.0-alpha05**. Alpha registry APIs, matcher behavior and Play services changes require renewed device qualification on upgrades. Broker certificate rotation is accepted only through Android-validated signing history rooted in the pinned release certificate; new roots, alternate brokers and browser allowlist changes require review. Google publishes the pinned legacy release digest in its [package certificate declarations](https://github.com/google/private-compute-services/blob/master/src/com/google/android/as/oss/AndroidManifest.xml). A passing JVM policy test does not prove a device's broker identity.

Before a controlled rollout, retain evidence for:

- Physical OS/Google Play services versions, Galaxy Fold, browser/native callers, and real spoofed/forged intent rejection.
- Sign-out, recovery, managed-profile switching and key replacement while consent and registry mutations are in flight.
- Claim, delete, revocation/suspension sync and expiration with fresh/stale indexes, including network failure during approval.
- Ordinary process death, cold boot, offline use, app update, GMS registry reset, failed clear/register recovery, and multiple installed providers.
- Android's sample verifier **and** an independent verifier implementation. The repository's synthetic verifier is useful regression coverage, not completion of this interoperability gate.
- Feature-disable and existing OpenID4VP deep-link behavior on a release build. Rollback keeps the provider disabled and deploys the known-good app; stale OS entries may remain until a successful clear, but a disabled Activity cannot fulfill them. Do not assume rollback clears GMS metadata or use destructive app-data reset as a substitute.

SQLite encryption, hardware-key storage and biometric release are separate follow-ups and are not dependencies of this sprint slice. Production enablement remains off.

## Investigating startup and SQLite errors

The shared SQLite ownership/initialization and web-loader fixes are isolated in [PR #1837](https://github.com/learningeconomy/LearnCard/pull/1837), which targets `main`. The Android PR stacks on that prerequisite; merge the shared fix first, then retarget the Android PR to `main`. The startup probe and native feature remain in the Android PR.

The initial 6–7 minute observation was a development-run outlier, not a repeatable measurement of Ed25519 signing or account-key derivation. An instrumented run of the previous build restored the account in 20.8 seconds, with key derivation around 1.4 seconds. Keep process startup, JavaScript/module loading, account readiness and consent readiness separate when comparing runs.

Two defects were reproduced and fixed:

- The HTML entry point loaded a web-only `jeep-sqlite` module from a public CDN before the app entry module. Holding just that request for 20 seconds kept React's root empty throughout. The web component now loads from the installed package inside the web-only effect; native startup makes no such CDN request.
- Cache, account-key, recovery-share and credential operations independently opened and closed the same SQLite connection. A captured baseline contained 107 close calls, including 70 failures, and five query-cache errors. Overlapping operations now hold shared connection leases; only the final owner closes it. Schema initialization is shared and idempotent, and native initialization has one owner per JavaScript context. The web hook's cleanup cannot close a native connection.

Use `withSQLiteDatabase` for work on the shared connection. Do not add independent `open`/`close` calls inside its callback. Nested SDK cache work is supported; serializing whole callbacks would deadlock nested operations. Logout still preserves the recovery-share table. Tests cover overlapping operations, error cleanup/retry, schema initialization, account-key persistence and recovery-share retention.

### Collect timings

After forwarding the dedicated development app's current WebView debugger socket with ADB, run from the repository root:

```bash
node apps/learn-card-app/scripts/native-digital-credentials/startup-probe.mjs \
  --cdp-port 19258 --output /absolute/new/private-startup.json
```

Start the probe soon after opening the app. It only accepts the local `com.learncard.app.dctest` WebView and refuses to overwrite an existing result. It records fixed development performance marks and native method names/counts/durations; it never records SQL, call arguments, credential bodies or keys. It removes its instrumentation when finished. The JSON is private investigation data, not an `lc verify` report or publishable media.

`learncard:startup:entry` begins after initial module evaluation; `react` follows tenant/updater/flag setup; `learncard:auth:wallet_ready` signals account readiness; `learncard:startup:consent` follows the consent render. Compare repeated runs with the same code, cache conditions, CPU/RAM allocation and recording settings. The original AVD had one CPU core and 2 GiB RAM; task launches override RAM to 4 GiB, and multi-core comparisons use `-cores 4` without changing the saved AVD configuration. Development-source timings do not establish production-bundle or physical-device performance.

### Test a bundled debug APK

This packages the current web app inside the isolated `com.learncard.app.dctest` APK. It still uses the local test APIs and the existing disposable account; it is not a production or fully offline build. Use the Node version in `.nvmrc` and the existing Android Studio JDK/SDK. From `apps/learn-card-app`, after configuring the local test tenant:

```bash
VITE_DOCKER_SOURCE=true VITE_ENABLE_AUTH_DEBUG_WIDGET=true NODE_OPTIONS=--max-old-space-size=6144 bunx vite build --mode development
bunx cap copy android
bun scripts/native-digital-credentials/prepare-account-proof.ts --after-sync --bundled --web-port 43157 --brain-port 43158 --cloud-port 43159 --api-port 43160
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME="$HOME/Library/Android/sdk" ./android/gradlew -p android :app:assembleDebug -PdigitalCredentialsDev --max-workers=2
adb -s emulator-5580 install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5580 reverse --remove tcp:43157
```

Keep the API reverse mappings for ports 43158–43160. `--bundled` removes `server.url` from the ignored native asset configuration, disables OTA downloads, and rejects a missing/unbuilt copied HTML entry. The live-server mode remains available by omitting `--bundled`; that requires restoring the web-port reverse mapping. Neither mode changes release provider defaults.

Verify the APK's `assets/capacitor.config.json` has no server URL and that its `assets/public/index.html` points to packaged `/assets/*.js` files. After launch, the timing probe reports the WebView origin, packaged entry names, resource counts and any Vite module requests; a bundled run should use `https://localhost` and make no Vite module requests. The proof helper for creating fixtures is development-server-only, so provision the disposable test fixture before switching to a bundled build.

For repeatable measurements, finish builds before measuring, avoid screen recording/CPU profiling during timing, keep the AVD CPU/RAM allocation fixed and note host contention. Force-stop and manually launch the dedicated app for fresh-process **main-app** measurements. For a fresh **provider** measurement, background the app, kill its process and confirm its PID absent before requesting through Verifier Lab; force-stop is not equivalent because it changes Android provider eligibility. Performance marks measure from WebView navigation, excluding some OS/process startup work. Native selection and successful cryptographic verification are separate acceptance checks from latency.

### Native consent presentation

Native requests use a compact credential summary and field list with persistent Share details and Cancel actions. Request signing identity and always-included credential metadata remain available in expandable details. The requester label/package comes from Android calling-app information; request JSON branding does not control this presentation. When Android cannot resolve an app label, the screen shows Android app with its package identifier.

The compact view uses the shared consent model and the same required-field checks: deselecting any required field disables approval, and the presenter revalidates the account, request and selected credential at approval. Fields and actions are disabled while a response is being prepared. Loading and unavailable-request states use the same visual surface, with cancellation available once native request context is established. Returning from an unavailable request completes cancellation without a credential. The development debug panel is hidden on this route while its diagnostic events remain enabled.
