# Task 4 report: Native start-stop shake bridge

Status: `DONE_WITH_CONCERNS`

## Outcome

Replaced the eager `@capgo/capacitor-shake` integration with a local Capacitor 8
plugin named `ShakeObserver` on iOS and Android. Native sensor registration is
now explicitly controlled by `start({ threshold, cooldownMs })` and `stop()`.
Plugin construction/loading does not start an accelerometer.

The React hook starts sensing only when all of these are true:

-   the hook is eligible/enabled;
-   Capacitor reports a native iOS or Android platform;
-   LaunchDarkly's `shakeToReportEnabled` flag is explicitly true;
-   the application is in the foreground.

It stops sensing on backgrounding, flag disable, eligibility loss, and unmount,
and restarts on the next foreground transition. Start/stop requests are
serialized in the hook and are idempotent in both native implementations.

Screenshot observation remains a separate iOS-only lifecycle. Changing the
shake flag does not remove or re-register its listener. The existing ten-second
shake forwarding cooldown remains in place above the new native two-second
debounce.

## TDD evidence

1. Added lifecycle tests for native start options, initial background state,
   background/foreground transitions, flag disable, eligibility loss, unmount,
   listener cleanup, screenshot independence, and the existing ten-second
   cooldown.
2. RED: the focused suite reported 9 failures and 7 passes because the prior
   hook never called native `start` or `stop`.
3. GREEN: after the implementation, the focused suite reports 16 passes.

The file now declares the `jsdom` Vitest environment because the repository's
direct single-file command otherwise starts in Node and fails before mounting
React hooks (`document is not defined`).

## Native implementation and registration

### TypeScript bridge

`src/feedback/reporting/native/ShakeObserver.ts` owns the typed Capacitor bridge
and the shared conservative physical tuning values:

-   total acceleration threshold: `2.7g`;
-   native event cooldown: `2,000ms`.

### iOS

`ShakeObserverPlugin.swift` uses `CMMotionManager`. `start` validates tuning,
registers 50 Hz accelerometer updates on the main queue, computes total
acceleration in g, and emits `shake` only after threshold/cooldown checks.
`stop` and `deinit` stop updates. Repeated start/stop calls are safe. There is no
`load()` override and no eager sensing.

The plugin is registered alongside `ScreenshotObserverPlugin` from
`MyViewController.capacitorDidLoad()`. The deterministic Xcode project template
contains explicit file/build references for both local plugins.

### Android

`ShakeObserverPlugin.java` uses `SensorManager` and implements
`SensorEventListener`. `load()` resolves references only. `start` registers the
accelerometer on the UI thread, normalizes readings by
`SensorManager.GRAVITY_EARTH`, and applies the shared threshold/cooldown. `stop`
unregisters the listener; `handleOnDestroy` also cleans up. Repeated start/stop
calls are safe.

`MainActivity` registers the local plugin before `BridgeActivity.onCreate`.

## Third-party removal

Removed `@capgo/capacitor-shake` from:

-   `apps/learn-card-app/package.json`;
-   `bun.lock`;
-   the iOS Podfile;
-   Android Capacitor settings and dependency Gradle files;
-   generated Android `capacitor.plugins.json` registration.

A repository search under `apps/learn-card-app` plus `bun.lock` finds no
`@capgo/capacitor-shake`, `CapgoCapacitorShake`, `CapacitorShakePlugin`, or
`capgo-capacitor-shake` references. The unrelated Capgo updater remains.

## Verification

-   `bunx vitest run apps/learn-card-app/src/feedback/reporting/useAutomaticFeedbackTriggers.test.tsx`
    -   PASS: 1 file, 16 tests.
-   `bunx prettier --check` for the changed TypeScript/TSX/package files
    -   PASS.
-   Capgo shake reference search
    -   PASS: no shake-specific references.
-   `bunx cap update android`
    -   PASS: 26 installed plugins; no Capgo shake plugin.
-   `bunx cap update ios`
    -   PASS after allowing CocoaPods access to its local cache; 26 installed
        plugins and no Capgo shake pod.
-   Android debug compile with Android Studio's bundled JDK and installed SDK:
    `:app:assembleDebug --no-daemon`
    -   PASS: `BUILD SUCCESSFUL`; app Java compile and debug APK assembly completed.
-   Unsigned iOS Simulator compile:
    `xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/lc-2086-ios-derived CODE_SIGNING_ALLOWED=NO build`
    -   PASS: `** BUILD SUCCEEDED **`.
-   `git diff --check`
    -   PASS.

## Concerns and blockers

The repository wrapper `bun run lc native sync learncard local` could not reach
Capacitor sync because its prerequisite Vite build lacks ignored workspace
artifacts in this worktree. The first missing import is
`@learncard/react/main.css`; directly building that workspace then fails on the
next missing artifact, `packages/learn-card-helpers/dist/helpers.esm.js`.
`bunx nx build react` also could not start its daemon because the sandbox denied
the Nx socket, and the daemonless fallback made no bounded progress, so it was
terminated. No stale or fabricated distribution artifacts were copied into the
worktree. Direct Capacitor updates for both platforms and both native compiles
passed, which verifies the changed native registration and APIs independently
of that missing JS workspace build chain.

Physical sensitivity remains an explicit hardware-QA item. Simulator builds
cannot validate a real accelerometer gesture, so `2.7g`/`2,000ms` should be
confirmed on representative iOS and Android devices before broad flag rollout.

Existing native dependency warnings (including Capacitor package patch-version
skew and CocoaPods/Gradle deprecation warnings) were not changed because they
are unrelated to this task and did not prevent compilation.

## Review fix round 1: cross-effect sensing arbitration

The original hook serialized native operations only inside each shake effect.
That left separate queues after a flag or eligibility rerender. With the first
effect's `start` pending, a disable queued its cleanup `stop`, while an immediate
re-enable created a new queue whose idempotent `start` could finish first. When
the old pending operation later resolved, its delayed `stop` ran last and left
an enabled, foreground hook with sensing disabled.

Added a hook-instance `ShakeSensingArbiter` held in a React ref. Every effect
generation now writes its desired state into the same arbiter. Only one native
operation can be in flight; after it resolves or rejects, the arbiter compares
the state it attempted with the newest requested state and keeps draining until
they match. Intermediate state changes may be coalesced, so an obsolete cleanup
cannot run after the current desired start.

TDD evidence:

1. RED: added an adversarial deferred-start regression that disables and
   immediately re-enables the flag before releasing the first `start`. The old
   implementation reported 18 passes and 1 failure, with the mocked native
   sensor ending stopped (`expected false to be true`).
2. GREEN: the ref-backed arbiter makes the same test finish with `start` as the
   final completed operation and sensing enabled; the complete focused suite
   reports 19 passes.
3. Additional coverage holds the first `start` through unmount and verifies the
   arbiter ultimately calls `stop`, and injects rejected `start` and `stop`
   promises to verify they are logged/handled and do not prevent a later state
   request from being applied.

No native source or registration file changed in this review round.
