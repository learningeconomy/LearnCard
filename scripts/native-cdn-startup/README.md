# Native CDN startup A/B measurement

This measures the actual bundled LearnCard Android development app, not a desktop browser or
minimal WebView fixture. Use a new task-owned emulator with **no accounts or other tasks' data**.
The tools refuse production package IDs and physical devices. They clear only the isolated
`com.learncard.app.dctest` package on an explicitly identified `codex_cdn_*` AVD.

## Prepare

Prerequisites: Node 24, Python 3, JDK 21, Android SDK/build tools 36, a fresh owned Android emulator,
and a bundled `com.learncard.app.dctest` APK with OTA auto-update disabled. The source APK is only
read. Its runtime source/version must be reported separately from the measurement scripts.

```sh
python3 scripts/native-cdn-startup/prepare-apks.py \
  --apk /absolute/path/to/bundled-dctest.apk \
  --output /absolute/new/private/apks \
  --build-tools /absolute/android-sdk/build-tools/36.0.0

JAVA_HOME=/absolute/jdk21 ANDROID_HOME=/absolute/android-sdk \
  apps/learn-card-app/android/gradlew -p scripts/native-cdn-startup/android \
  :app:assembleDebug :app:assembleDebugAndroidTest --max-workers=2
```

Install the two measurement APKs under `android/app/build/outputs/apk/` on the **owned serial**.
They only locate public sign-in/offline text through Android's native accessibility interface.
They never sign in, provision an account or read SQLite contents.

The preparation script adds identical timing instrumentation to both APK copies and adds the
original jeep-sqlite module tag immediately before the application module in only one. Both copies
are signed with the same fresh throwaway key. The audit verifies that every non-signature entry
except `assets/public/index.html` is byte-identical between variants. Do not publish APKs or keys.

## Measure

Every invocation needs a new private output directory. For example:

```sh
node scripts/native-cdn-startup/measure.mjs \
  --adb /absolute/android-sdk/platform-tools/adb \
  --serial emulator-5592 --owned-avd codex_cdn_ab \
  --apks /absolute/private/apks --output /absolute/new/private/cold \
  --mode cold --samples 6 --visual
```

- `cold` runs all four tag-present/tag-absent × Wi-Fi-online/fully-offline combinations. Each
  run installs its variant, clears the isolated app, starts a fresh process, and alternates order
  across blocks. Mobile data stays disabled. Both guest connectivity and `navigator.onLine` are
  checked. CDN load/error and actual native SQLite call completion are buffered before CDP attaches.
- `warm` primes each variant online, then force-stops and launches it without clearing its cache.
  Priming rows have `block: -1` and must be excluded from reported sample counts/statistics.
- `held` runs tag-present/tag-absent online through a task-owned HTTPS CONNECT proxy. The proxy
  allows `cdn.jsdelivr.net:443`, `learncard.app:443` (the app's remote connectivity probe),
  and real Android/Google connectivity validation. It denies local/other endpoints and does not
  decrypt TLS. Connectivity requests are forwarded without delay.
  `--delay-ms 10000` holds CDN connections behind a shared ten-second barrier; later connections
  do not stack additional delays. `--delay-ms 0` is the matching proxy control. Both variants use
  the same proxy policy. These are controlled restricted-proxy conditions, not ordinary unrestricted Wi-Fi.

`--visual` uses Android monotonic time from launch until public text is visible in the active
accessibility window. It also records Android's `am start -W` launch time. React first-frame and
SQLite milestones use WebView Navigation Timing. They can occur behind the native splash and
are not authentication or full splash-animation completion metrics. `--settle-ms 8000` can capture
settled screenshots for the first block without adding that wait to measured timings.

Keep raw timing JSON, logs and screenshots private; publish inspected public-screen images or
aggregate results only. Complete builds before measuring. Record WebView/API versions, CPU/RAM,
host contention, source APK hashes, sample counts, ordering, cache state and failures. Do not
combine native-UI instrumentation timings with uninstrumented runs into one performance estimate.

The runner force-stops only its test app, removes its CDP forwarding, restores the owned emulator's
proxy and Wi-Fi state, and closes its proxy server. When finished, uninstall only the two probe
packages plus `.dctest`, then stop only the emulator you created. Do not use existing account data.

This is an Android debug/emulator experiment. It does not establish iOS, physical-device, release
build, authenticated offline restoration, or production-backend performance.
