# LC-2086 Enhanced User Feedback Design

**Status:** Approved for implementation
**Date:** 2026-08-20
**Jira:** [LC-2086](https://welibrary.atlassian.net/browse/LC-2086)

## Goal

Build a first-party feedback experience for the LearnCard app that lets eligible users report a problem or share an idea without leaving the app. Bug reports go to Sentry, ideas go through the existing analytics abstraction to PostHog, and no UI component imports either provider SDK directly.

The experience must work on web, iOS, and Android. Native users can shake the device to start a bug report, iOS users get a report prompt after taking a screenshot, Settings exposes explicit bug and idea actions, and error boundaries can associate a report with the exact captured exception.

## Non-goals

-   A persistent or offline report queue.
-   Reading screenshots from the iOS Photos library.
-   A configurable native shake detector in v1.
-   A general-purpose public feedback SDK for other LearnCard applications.
-   Automatically creating Jira issues from submitted feedback.
-   Collecting a reporter's name, email, DID, profile ID, credential contents, seed, or authentication material.

## Approved Decisions

1. Use one `FeedbackProvider` and controller mounted near the LearnCard app root.
2. Keep UI, collection, and provider transports separate and injectable.
3. A bug report requires an adult/non-child user and `bugReportsEnabled`.
4. An idea requires an adult/non-child user and `analyticsEnabled`.
5. Explicit reporting is not subject to the existing micro-feedback frequency governor.
6. Use `html2canvas` for v1 screenshot capture on web and native WebViews.
7. The iOS bridge detects `UIApplication.userDidTakeScreenshotNotification`; it never reads Photos.
8. Use `@capgo/capacitor-shake@8.0.37` for v1. Its Capacitor 8 API has no sensitivity threshold.
9. Mitigate shake nuisance with a 10-second cooldown, foreground-only handling, a default-off LaunchDarkly flag named `shakeToReportEnabled`, and physical-device QA.
10. Capture context immediately during an automatic trigger. If a modal, scanner, or keyboard-sensitive flow is active, retain one in-memory pending draft, replacing it with a newer trigger, and offer it after the app becomes idle. Pending drafts expire after five minutes.
11. Do not persist screenshots or logs. A failed submission retains the draft only while its composer remains mounted.

## Architecture

```text
Shake / iOS screenshot / Settings / Error boundary / micro-feedback
                              │
                              ▼
                     Feedback controller
          eligibility • capture • cooldown • pending draft
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          Feedback composer       Deferred prompt toast
                 │                         │
                 └────────────┬────────────┘
                              ▼
                    FeedbackTransport
                        ┌─────┴─────┐
                        ▼           ▼
                 Sentry adapter  Analytics adapter
                    (bugs)          (ideas)
```

`FeedbackProvider` lives inside `AnalyticsContextProvider`, `IonReactRouter`, `AuthCoordinatorProvider`, and `ModalsProvider` in `apps/learn-card-app/src/FullApp.tsx`. It therefore has access to analytics, routing, authenticated preferences, the modal stack, scanner state, keyboard state, and app lifecycle events. It wraps `AppRouter` so `GenericErrorBoundary` and Settings components can consume the controller.

The root modal host in `AppRouter.tsx` must remain mounted when guarded app content throws. `<Modals />`, `ModalAccessibilityManager`, and `ReducedMotionManager` therefore become siblings after the root `GenericErrorBoundary`, rather than children inside it. This is a narrow ownership correction: the boundary still guards the application surface, while the modal host remains available to render the error fallback's feedback composer.

## Domain Model

```ts
export type FeedbackKind = 'bug' | 'idea';

export type FeedbackSource =
    | 'shake'
    | 'screenshot'
    | 'settings'
    | 'error-boundary'
    | 'micro-feedback';

export interface FeedbackScreenshot {
    dataUrl: string;
    filename: 'feedback-screenshot.png';
    contentType: 'image/png';
}

export interface FeedbackContext {
    currentRoute: string;
    recentRoutes: string[];
    tenantId?: string;
    app?: {
        platform: 'web' | 'ios' | 'android';
        displayVersion: string;
        nativeVersion?: string;
        nativeBuild?: string;
        bundleVersion?: string;
        channel?: string;
    };
    device?: {
        model?: string;
        manufacturer?: string;
        osLabel?: string;
        webViewVersion?: string;
        isVirtual?: boolean;
    };
    network?: {
        connected: boolean;
        label: string;
    };
    logs?: DiagnosticLogEntry[];
}

export interface FeedbackDraft {
    kind: FeedbackKind;
    source: FeedbackSource;
    capturedAt: string;
    screenshot?: FeedbackScreenshot;
    context: FeedbackContext;
    associatedEventId?: string;
    initialMessage?: string;
}

export interface FeedbackReport extends FeedbackDraft {
    message: string;
}

export interface FeedbackTransport {
    submit(report: FeedbackReport): Promise<{ id?: string }>;
}
```

`micro-feedback` is an internal compatibility source for the existing sentiment follow-up sheet. Adding it lets that component leave its current direct Sentry dependency without changing its visible flow.

## Privacy and Eligibility

The feedback reporting gate is separate from `useFeedbackEligibility`, which remains responsible for governed micro-prompts.

The new `useFeedbackReportingEligibility` returns:

```ts
{
    bug: boolean;
    idea: boolean;
    isLoading: boolean;
}
```

Both destinations are disabled while preferences are loading, for child profiles, when `preferences.isMinor === true`, or when a valid DOB places the user below the country-specific minor threshold. An invalid DOB fails closed. An absent DOB preserves the existing adult-profile behavior.

After the shared age/profile gate:

-   `bug` requires `preferences.bugReportsEnabled !== false`.
-   `idea` requires `preferences.analyticsEnabled !== false`.

When bug reporting becomes disabled, the in-memory diagnostic log buffer is cleared and stops recording. Automatic listeners remain mounted safely but do no capture or presentation work. Error-boundary and Settings bug actions are hidden. The idea row remains independently available when its gate permits it.

### Explicitly excluded data

-   DID and profile ID
-   Firebase UID
-   name and email
-   credential bodies, URIs, and claim URLs
-   seeds, private keys, passwords, tokens, and authorization headers
-   Capgo device ID
-   arbitrary URL query strings and fragments

The tenant ID is allowed because it identifies the deployed product configuration, not the user. Routes are normalized through the existing `normalizeScreenName` function before storage.

## Diagnostic Log Buffer

`learn-card-base` owns the central logger, so it also owns a memory-only diagnostic ring buffer. The buffer holds at most 200 `DiagnosticLogEntry` records. It records info, warning, and error calls after applying a stricter sanitizer than the normal Sentry metadata path.

```ts
export interface DiagnosticLogEntry {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    scope?: string;
    message: string;
    data?: unknown;
}
```

The diagnostic sanitizer:

-   ignores `allowPii` and always scrubs;
-   recursively redacts PII-shaped keys;
-   redacts bearer tokens, JWT-shaped values, email addresses, and DIDs inside strings;
-   strips URL query strings and fragments;
-   serializes `Error` values to a sanitized name/message pair without a stack;
-   replaces circular references;
-   limits recursion depth and string length.

The public read API returns a copy, never the mutable backing array. Nothing is written to storage.

## Context Capture

### Route history

The existing `useScreenView` continues to normalize routes and additionally records the last ten screens in a small memory-only route-history module. Consecutive duplicates are collapsed. `getRecentRoutes()` returns a snapshot.

### App diagnostics

The data-collection helpers currently private to `VersionInfoModal.tsx` move to `versionInfo.helpers.ts`. The modal continues using the full `VersionInfo` object. Feedback maps it to the privacy-safe subset in `FeedbackContext`; the Capgo device ID, internal bundle ID, checksum, account/profile values, and copy-only fields are never copied into a report.

Each native call is independently guarded, so one failing plugin does not block the report.

### Screenshot capture

`captureFeedbackScreenshot()` calls `html2canvas` against the visible application document with the current viewport dimensions, `useCORS: true`, logging disabled, and a PNG data URL result. It returns `undefined` on timeout or failure and logs only a sanitized warning.

The screenshot is captured before any feedback UI opens. This prevents the composer or prompt toast from appearing in its own attachment. On iOS, the OS screenshot notification fires after the system screenshot; the attached image is therefore a new HTML rendering of the current app state, not an image retrieved from Photos.

Bug drafts collect screenshots, full privacy-safe diagnostics, route history, and logs. Idea drafts collect the normalized route, tenant, app version, and message; screenshots, device details, and logs are not sent to PostHog.

## Coordinator State and Trigger Flow

The controller exposes:

```ts
export interface FeedbackController {
    reportProblem(options?: {
        source?: FeedbackSource;
        associatedEventId?: string;
        initialMessage?: string;
        submitImmediately?: boolean;
    }): Promise<void>;
    shareIdea(options?: { source?: FeedbackSource; initialMessage?: string }): Promise<void>;
}
```

### Explicit actions

Settings and error-boundary calls always open the composer after capture, even though Settings itself is already a modal. The feedback modal stacks above Settings and returns to it when closed.

### Shake

The Capgo listener is installed only when all of the following are true:

-   Capacitor is running natively;
-   the platform is iOS or Android;
-   bug reporting is eligible;
-   `shakeToReportEnabled === true`;
-   the application is in the foreground.

The first accepted shake captures a bug draft. Further shake events are ignored for ten seconds. If the app is idle, the composer opens. If busy, the draft becomes the single pending automatic draft.

### iOS screenshot

The local `ScreenshotObserver` Capacitor plugin emits `screenshotTaken` after observing `UIApplication.userDidTakeScreenshotNotification`. An eligible event captures a bug draft and presents a dismissible “Report a problem?” toast when idle. Busy events use the same pending slot.

### Busy state

Busy means any open modal, an active QR scanner, or an open native keyboard. Context capture happens before the busy decision. When busy state becomes false, an unexpired pending draft is offered through a custom actionable toast. Tapping the toast opens the preserved draft; dismissing it discards the draft. A newer automatic trigger replaces an older pending draft. Drafts older than 300,000 ms are discarded.

The feedback composer itself does not count as a reason to queue another report; automatic triggers are ignored while it is open.

## Composer UX

The composer uses the shared `AppModal` presentation through `useModal`, with a centered desktop surface and fullscreen mobile surface. It follows LearnCard design tokens and uses native HTML form controls.

Bug composer:

-   Heading: “Report a Problem”
-   One native textarea: “What happened?”
-   Screenshot preview when capture succeeded
-   “Remove Screenshot” action
-   Collapsed “What we’ll send” disclosure listing screenshot, app/device details, recent screens, and sanitized logs
-   “Cancel” and “Send Report” buttons

Idea composer:

-   Heading: “Share an Idea”
-   One native textarea: “What would make LearnCard better?”
-   Collapsed disclosure listing the idea text, current screen, app version, and tenant
-   “Cancel” and “Share Idea” buttons

The submit action is disabled for an empty trimmed message. While submitting, the primary action shows a spinner and contextual text. Success closes the modal and shows a short confirmation toast. Failure keeps the draft and message in place and displays the standard friendly error banner with a retry action.

The UI never asks for name or email and never renders raw provider errors.

All new user-visible strings are added to the four locale catalogs. English is the source language; Spanish, French, and Arabic receive reviewed translations before completion.

## Transports

### Sentry bugs

Only `sentryFeedbackTransport.ts` imports `@sentry/react`. It calls `Sentry.captureFeedback` with:

-   `message`
-   `associatedEventId` when supplied by an error boundary
-   tags for `feedbackType`, `feedbackSource`, normalized route, tenant, platform, app version, and Capgo bundle version
-   `feedback-screenshot.png` as an `image/png` attachment when present
-   `feedback-logs.json` as an `application/json` attachment when logs are present
-   structured privacy-safe app/device/network context

Screenshot data URLs are converted to `Uint8Array` before attachment. Logs remain structured JSON, not tags.

The logger's injected `SentryTransport.captureException` returns Sentry's event ID. `Logger.error` returns that optional ID while remaining backward compatible with existing callers that ignore the return value. `GenericErrorBoundary` stores the returned ID and passes it to `reportProblem({ source: 'error-boundary', associatedEventId })`.

### PostHog ideas

The analytics adapter calls the existing typed `AnalyticsProvider.track` abstraction with a new `feedback_idea_submitted` event. Its payload contains:

```ts
{
    source: FeedbackSource;
    message: string;
    currentRoute: string;
    appVersion?: string;
}
```

Tenant, platform, and other shared analytics context continue to be stamped by the central provider. No screenshot, logs, device model, error, or raw URL is sent.

### Existing sentiment follow-up

`FeedbackFollowUpSheet.tsx` stops importing Sentry. Its existing analytics event remains unchanged. When it needs to create a bug report, it submits a minimal `micro-feedback` report through the same Sentry adapter boundary.

## Native iOS Bridge

The app-local plugin follows Capacitor 8's documented custom-code pattern:

1. `ScreenshotObserverPlugin.swift` implements `CAPPlugin` and `CAPBridgedPlugin` with `jsName = "ScreenshotObserver"`.
2. `MyViewController.swift` subclasses `CAPBridgeViewController` and registers `ScreenshotObserverPlugin()` from `capacitorDidLoad()`.
3. `Main.storyboard` uses `MyViewController` in the App module instead of `CAPBridgeViewController`.
4. Both the checked-in Xcode project and `project.pbxproj.template` include the Swift files in the App target.
5. TypeScript links the bridge with `registerPlugin<ScreenshotObserverPlugin>('ScreenshotObserver')` and exposes only `addListener('screenshotTaken', ...)`.

The plugin observes and removes the UIKit notification lifecycle safely. It requests no Photos permission and adds no privacy-manifest API declaration.

Reference: [Capacitor 8 Custom Native iOS Code](https://capacitorjs.com/docs/ios/custom-code).

## Error Handling

-   Screenshot timeout/failure: continue without a screenshot.
-   Partial diagnostic failure: keep all successfully collected fields.
-   Native listener registration failure: log a sanitized warning and keep explicit entry points working.
-   Transport failure: keep the composer open with its draft and friendly retry state.
-   Missing Sentry client: reject as a submission failure rather than claiming success.
-   Analytics provider disabled/unavailable: the idea entry is already ineligible when analytics is disabled; an unready or non-PostHog provider is treated as a retryable submission failure. Once accepted by the PostHog SDK, delivery follows its normal best-effort queue semantics.
-   Stale-chunk errors: preserve the existing guarded reload behavior; do not offer a feedback action during the automatic update recovery path.

## Rollout

1. Ship Settings and error-boundary reporting behind existing privacy preferences.
2. Verify iOS screenshot prompting on physical devices.
3. Keep `shakeToReportEnabled` false by default until physical iOS and Android shake QA passes.
4. Enable the shake flag for internal/test users, then widen gradually.
5. Retain the remote flag as the shake kill switch.
6. Replace Capgo with a local configurable detector only if device QA shows unacceptable false positives.

## Verification Strategy

Automated tests cover:

-   adult/minor/child and preference eligibility matrices;
-   diagnostic ring capacity, ordering, clearing, and forced PII scrubbing;
-   route normalization and bounded history;
-   privacy-safe diagnostics mapping;
-   screenshot success, timeout, and failure;
-   ten-second cooldown, pending replacement, and five-minute expiry;
-   busy detection for modal, scanner, and keyboard state;
-   composer validation, screenshot removal, disclosure, loading, success, and retry;
-   Sentry attachments/tags/associated event IDs;
-   typed idea event payloads;
-   Settings and error-boundary visibility;
-   automatic listener cleanup and foreground checks.

Physical-device QA covers:

-   shake gestures on representative iOS and Android devices;
-   walking, rotation, and setting the phone down;
-   repeated shakes inside the cooldown;
-   screenshot notifications on iOS;
-   native foreground/background transitions;
-   screenshot rendering on routes, modals, scrolling screens, and representative tenant themes.

The full repository baseline is currently not green for unrelated environment reasons. Completion uses focused tests for all changed modules and records the known baseline failures separately.

## External Dependencies and Source-of-truth Notes

-   `@capgo/capacitor-shake@8.0.37` exports only `addListener('shake', ...)` and `getPluginVersion()`; it exposes no sensitivity or threshold setting. See the [current interface](https://raw.githubusercontent.com/Cap-go/capacitor-shake/main/src/definitions.ts).
-   `html2canvas@1.4.1` is already installed. It reconstructs the rendered DOM and may not perfectly reproduce every CSS or cross-origin asset; failure is non-blocking.
-   Sentry remains pinned at `8.34.0`; `captureFeedback` and event-hint attachments are supported by the installed SDK.
