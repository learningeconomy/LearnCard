# Native crash reporting (LC-2304)

The LearnCard app includes `@sentry/capacitor` 3.1.0 (CocoaPods compatible),
Sentry Cocoa 9.3.0, Android 8.31.0, and matching React/browser 10.40.0 packages.
ScoutPass keeps its existing SDK version.
The Bun patch for the Capacitor package only replaces its removed Gradle ProGuard
default with `proguard-android-optimize.txt`, matching this repo's Android Gradle
Plugin 9 setup; it does not enable obfuscation.

## Initialization and data

After the first resolved preference sync, native reporting starts before the Capacitor bridge: in iOS SceneDelegate before
creating the bridge controller, and Android MainActivity before `super.onCreate`.
It reads the **binary's baked** `public/tenant-config.json`; development, missing
DSN, or invalid config disables reporting. Failures earlier in AppDelegate or
Android Application startup are outside this capture window.

`NativeCrashReportingPlugin` owns native initialization and privacy callbacks.
**Do not call `@sentry/capacitor.init()` in JavaScript:** its automatic native init
would replace these callbacks. The official plugin supplies native dependencies;
React initializes once independently and sends JavaScript events through its web
transport. Arbitrary JS scope, credentials, user identity, and breadcrumbs are
never mirrored to the native SDK.

Native events preserve exception types, stacks, binary images and standard device
contexts. Free-form exception values, messages, requests, users, extras and
breadcrumbs are removed, except the fixed WebView termination diagnostic. This
intentionally sacrifices native assertion text that could contain entered data.
Native replay, screenshots, view hierarchies, network breadcrumbs and performance
tracing are not enabled.

The native SDK derives release/dist from the binary's bundle ID/version/build.
`web_version`, `web_sha`, and `ota_bundle` identify the independently updated JS.
Only static route families are sent as `route_group`, without IDs or queries.
JS uses `learncard-web@<package version>+<commit>` and uploaded chunk debug IDs;
Capgo source maps belong to the exact build uploaded, including staging bundles.

A WebKit process termination is a warning tagged `error_kind=webview_termination`.
The delegate forwards Capacitor's original termination callback, preserving its
bridge reset/reload. A native WebCore SIGSEGV is instead a fatal native crash.
Watchdog/memory termination inference is best effort; it is not a complete record
of every OS process kill. Force-quitting and WebView process death are distinct.

## Preferences and private sharing

Remote crash reporting retains the existing raw `bugReportsEnabled` semantics,
including anonymous/onboarding reporting. Adult eligibility still only controls
user-attachable feedback diagnostics; this change does not introduce an age gate.

The native opt-out persists across process death and is checked **before** native
startup/cache upload. Auth/preferences loading does not overwrite it. A resolved
account preference or real logout updates it through the bridge. A cold launch
with a previous opt-out stays disabled until a resolved preference is available.
On the first SDK launch, an absent native preference defaults to disabled: an
upgrading account may have an existing opt-out that has not been loaded yet.
Consequently first-install anonymous/onboarding and early startup failures are
outside Sentry's capture window until preferences resolve. Subsequent launches
use the persisted choice. PostHog's existing JS instrumentation is unchanged.
JS autocapture also honors this gate, and replay stops on opt-out.

Entering `/s` sharing is sticky for that process. Native launch/deep-link handlers
check share URLs before starting/forwarding navigation; JS also notifies native
code for internal navigation. Reporting closes, the cache is removed, and its
persisted generation rotates. An old transport finishing after shutdown cannot
cause old reports to be replayed on a later opt-in. Requests already transmitted
before disabling reporting cannot be recalled.

## CI and release

Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in the relevant GitHub
Environment for native releases, web releases, and Capgo uploads. These are
build-only credentials; never use `VITE_` prefixes. Official publish jobs require
them. A local build without them works with no source-map upload.

Vite generates hidden maps, injects debug IDs, uploads them, then deletes the maps
before packaging. Fastlane uploads the archive's dSYMs before distribution. Upload
failures fail the build. Android currently has `minifyEnabled false`, so Java/Kotlin
frames need no R8 mapping upload. Enabling obfuscation later also requires adding
the Sentry Android Gradle plugin/mapping upload and verifying mapping UUIDs.

Ship a **new native binary** listening on Capgo channel `1.0.14` (staging uses its
normal suffix). An OTA update cannot install this plugin. Old binaries retain JS
reporting, but cannot gain native capture through OTA.

## Release validation (physical devices required)

1. Build a staging binary, verify source-map and dSYM uploads succeeded, then
   install on an iPhone. Sign in normally once with bug reporting enabled and let
   preferences resolve. Run it **without Xcode's debugger attached**.
2. In a throwaway local test build, temporarily schedule `fatalError("Sentry QA")`
   on the main queue after startup. Launch from the home screen, let it terminate,
   relaunch, and verify a readable native stack with binary version/build and web
   bundle tags. Remove the temporary code before committing/distributing.
3. Repeat an uncaught Java exception on Android in a temporary test build; relaunch
   and verify its stack and release. No permanent crash trigger is shipped.
4. Verify a JS exception resolves to the original TS line for both the embedded
   bundle and a separately built Capgo bundle with uploaded debug IDs.
5. Opt out, restart, and repeat a controlled crash. Confirm no event uploads.
   Also crash offline, relaunch offline, opt out, reconnect and restart: no cached
   event may upload. Opt back in and confirm old cache generations stay discarded.
6. Enter a share viewer via cold/warm deep link and internal navigation, then
   repeat crash/restart checks. Inspect received payloads for URLs, fragments,
   credential data, auth tokens, and user data.
7. Terminate the WebKit content process in a test session. Verify one warning and
   Capacitor's normal reload, separate from fatal native crash counts.

Compilation and unit tests cannot prove crash delivery or symbolication. Keep the
PR in draft until physical-device capture, privacy, and hosted upload checks pass.
