# Android digital credential provider (LC-2157)

This development slice adds an app-local Capacitor bridge and an Android Credential Manager provider Activity. It carries forward the local response prototype from [PR #1795](https://github.com/learningeconomy/LearnCard/pull/1795).

The production provider is **disabled by default**. The dedicated `com.learncard.app.dctest` development build connects the reusable Android module to LearnCard's account initialization, encrypted LearnCloud credential inventory and existing OpenID4VP consent screen. Separate debug lab applications provide a synthetic issuer and native verifier. The development build uses a local Vite server; it does not prove an offline release bundle.

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

## Boundaries

- `android/digital-credentials/` is the reusable native library used by both the main application and the lab. It registers through AndroidX `OpenId4VpRegistry`, restricts registration to `openid4vp-v1-unsigned`, and returns results through `PendingIntentHandler`.
- `src/native-digital-credentials/` reads eligible SD-JWTs through the active account's encrypted read plane, stores private URI/digest mappings and routes native requests to the shared consent UI. Ownership follows the credential-bound Ed25519 key across the account's did:key/did:web aliases. Account replacement, logout and managed-profile switching invalidate native handles. Selected bodies, index membership, issuer verification and account ownership are checked again at approval.
- The typed bridge exposes `status`, `register`, `clear`, `getPendingRequest`, `complete`, `cancel`. Native handles are one-time and registry-generation-bound. Completion accepts no origin override. Expired requests can still be dismissed through Cancel or Android Back. The provider disables the main app's held native splash in its own Capacitor configuration, so its window can receive Back during account initialization.
- Only opaque entry IDs, VCT, title and claim paths/display labels cross the metadata boundary. `SdJwtClaim.value` is null. Value-constrained matching is not promised by this presence-based lab profile. Full credentials, private keys, claim values and LearnCloud URIs are rejected by the native projection schema.
- The native Activity requires Android's calling package. For a system broker, it uses the broker-authenticated `CallingAppInfo` certificates; for a direct caller, it checks them against the installed calling package. Arbitrary requester-package lookups are restricted by Android package visibility. Only Google Play services broker visibility is declared; `QUERY_ALL_PACKAGES` is unnecessary. Native-app origins use the caller's signing-certificate hash.
- Privileged web origins require a package/certificate allowlist. The supplied allowlist is empty and fails closed; browser interoperability requires a separately reviewed allowlist and tests. No browser package or certificate supplied through JavaScript is trusted.
- The lab uses the existing synthetic Course Completion fixture, a publicly known development issuer seed and an independently generated holder key. Its private WebView storage contains only lab material; this is not a production key-storage design. Do not use real credentials or personal data in these apps. Both applications have distinct package IDs and backup is disabled.
- The lab uses a portable Ed25519 backend with the shared TypeScript SD-JWT/DCQL engine so older emulator WebViews do not need Ed25519 WebCrypto support. It uses the draft's lower-level response builder with an explicit validated disclosure frame. This does not fix every review finding in the draft's public convenience method.

## Remaining acceptance gates

- Qualify logged-out/recovery flows and all account/profile/key transitions beyond the synthetic personal-account path. The listener fences transitions; that is not a complete LC-2158 lifecycle qualification.
- Complete LC-2158 account/profile/key invalidation, credential lifecycle/status freshness, privacy, failure and interoperability qualification.
- Finalize LC-2159 request-bound disclosure and selected-credential validation in the public shared API. The prototype fixes declaration compilation and adds native certificate-origin parsing as prerequisites for the lab.
- Validate browser callers and an independent verifier, then run physical-device tests on the Samsung Galaxy Fold after setup. One emulator does not satisfy the physical-device gate or supported-device matrix.
- Run the matching SDK/cross-surface `lc verify` journeys on Linux before rollout readiness. Browser journeys cannot prove Android provider behavior; native emulator/device evidence must remain separate.

Only `-PdigitalCredentialsDev` enables the dedicated debug app's provider. Production builds retain `lc_digital_credentials_enabled=false`; rollout remains gated on the remaining acceptance work.

## Investigating startup and SQLite errors

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
