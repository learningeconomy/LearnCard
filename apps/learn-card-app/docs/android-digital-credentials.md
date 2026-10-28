# Android digital credential provider (LC-2157)

This development slice adds an app-local Capacitor bridge and an Android Credential Manager provider Activity. It carries forward the local response prototype from [PR #1795](https://github.com/learningeconomy/LearnCard/pull/1795).

The production LearnCard provider is **disabled by default**. The separate, debug-only holder and verifier lab applications enable the same native module to test OS registration, selection, consent, result delivery and process restoration without a personal account. This is not yet integration with LearnCard's real account, encrypted credential inventory or production consent screen.

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
- `src/native-digital-credentials/` is the typed host interface: `status`, `register`, `clear`, `getPendingRequest`, `complete`, `cancel`. Result handles are native-owned, one-time, and invalidated when the registry generation changes. Completion accepts no origin override.
- Only opaque entry IDs, VCT, title and claim paths/display labels cross the metadata boundary. `SdJwtClaim.value` is null. Value-constrained matching is not promised by this presence-based lab profile. Full credentials, private keys, claim values and LearnCloud URIs are rejected by the native projection schema.
- The native Activity derives caller identity from Android, verifies the claimed package certificates against the installed package, and limits direct invocation to the matching caller or a system broker. Native-app origins use the caller's signing-certificate hash.
- Privileged web origins require a package/certificate allowlist. The supplied allowlist is empty and fails closed; browser interoperability requires a separately reviewed allowlist and tests. No browser package or certificate supplied through JavaScript is trusted.
- The lab uses the existing synthetic Course Completion fixture, a publicly known development issuer seed and an independently generated holder key. Its private WebView storage contains only lab material; this is not a production key-storage design. Do not use real credentials or personal data in these apps. Both applications have distinct package IDs and backup is disabled.
- The lab uses a portable Ed25519 backend with the shared TypeScript SD-JWT/DCQL engine so older emulator WebViews do not need Ed25519 WebCrypto support. It uses the draft's lower-level response builder with an explicit validated disclosure frame. This does not fix every review finding in the draft's public convenience method.

## Remaining acceptance gates

- Connect the native request to the main LearnCard account/runtime and existing consent UI, including logged-out and recovery behavior. Prove encrypted storage readback and holder-key compatibility after a cold start.
- Complete LC-2158 account/profile/key invalidation, credential lifecycle/status freshness, privacy, failure and interoperability qualification.
- Finalize LC-2159 request-bound disclosure and selected-credential validation in the public shared API. The prototype fixes declaration compilation and adds native certificate-origin parsing as prerequisites for the lab.
- Validate browser callers and an independent verifier, then run physical-device tests on the Samsung Galaxy Fold after setup. One emulator does not satisfy the physical-device gate or supported-device matrix.
- Run the matching SDK/cross-surface `lc verify` journeys on Linux before rollout readiness. Browser journeys cannot prove Android provider behavior; native emulator/device evidence must remain separate.

To enable a future qualified host build, override `lc_digital_credentials_enabled` in its resources. Do not enable the production provider until its pending-request consumer, account isolation, lifecycle clearing and caller policy are wired and verified.
