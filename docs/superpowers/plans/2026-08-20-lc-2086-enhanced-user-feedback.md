# LC-2086 Enhanced User Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a privacy-gated, first-party LearnCard feedback flow with Settings, error-boundary, shake, and iOS screenshot entry points, routing bugs to Sentry and ideas to PostHog through a provider-independent transport.

**Architecture:** A root `FeedbackProvider` captures privacy-safe context, owns automatic-trigger cooldown and one deferred in-memory draft, and presents a shared composer through the existing modal system. Focused adapters collect screenshots/diagnostics/logs and submit a typed `FeedbackReport`; only transport files import provider SDKs. The root modal host remains outside the guarded app surface so error-boundary reports can open a composer.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3.2, Capacitor 8.3, `html2canvas` 1.4.1, `@capgo/capacitor-shake` 8.0.37, Sentry React 8.34, existing LearnCard analytics/PostHog abstraction, Swift/UIKit.

**Spec:** `docs/superpowers/specs/2026-08-20-lc-2086-enhanced-user-feedback-design.md`

## Global Constraints

-   Pin `@capgo/capacitor-shake` to `8.0.37`; its current API has no sensitivity setting.
-   The LaunchDarkly flag is `shakeToReportEnabled` and a missing value means false.
-   Shake cooldown is exactly 10,000 ms; pending automatic drafts expire after exactly 300,000 ms.
-   Keep at most 200 diagnostic log entries and 10 normalized recent routes in memory.
-   Never persist screenshots, logs, pending drafts, or failed reports.
-   Bug eligibility requires adult/non-child status and `bugReportsEnabled !== false`.
-   Idea eligibility requires adult/non-child status and `analyticsEnabled !== false`.
-   Do not apply the existing micro-feedback frequency governor to explicit reports.
-   Do not collect DID, profile ID, UID, name, email, credential contents/URIs, claim URLs, seeds, private keys, passwords, tokens, authorization headers, or Capgo device ID.
-   Only `sentryFeedbackTransport.ts` may import `@sentry/react` for feedback submission; UI components may not import Sentry or PostHog.
-   Use LearnCard color tokens, Poppins typography, native HTML inputs, `rounded-[20px]` buttons, shared modal surfaces, friendly errors, and no emoji.
-   Do not add raw `<IonModal>` or safe-area logic inside feedback content.
-   The existing repository-wide test baseline has unrelated environment failures. Every changed LC-2086 module must have a focused passing test command.

---

### Task 1: Add the memory-only diagnostic log buffer and return captured error IDs

**Files:**

-   Create: `packages/learn-card-base/src/logging/diagnosticLogBuffer.ts`
-   Create: `packages/learn-card-base/src/logging/diagnosticLogBuffer.test.ts`
-   Modify: `packages/learn-card-base/src/logging/logger.ts`
-   Modify: `packages/learn-card-base/src/logging/logger.test.ts`
-   Modify: `packages/learn-card-base/src/index.ts`

**Interfaces:**

-   Produces: `DiagnosticLogEntry`, `recordDiagnosticLog(input)`, `getDiagnosticLogs()`, `clearDiagnosticLogs()`, and `setDiagnosticLogCollectionEnabled(enabled)`.
-   Produces: `Logger.error(...args): string | undefined` and `SentryTransport.captureException(...): string | undefined`.
-   Consumes: no LC-2086 application code.

-   [ ] **Step 1: Write failing diagnostic-buffer tests**

Add tests that prove capacity, copy-on-read, forced sanitization, disabled collection, and clearing:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearDiagnosticLogs,
    getDiagnosticLogs,
    recordDiagnosticLog,
    setDiagnosticLogCollectionEnabled,
} from './diagnosticLogBuffer';

beforeEach(() => {
    clearDiagnosticLogs();
    setDiagnosticLogCollectionEnabled(true);
});

it('keeps only the newest 200 records', () => {
    for (let index = 0; index < 205; index += 1) {
        recordDiagnosticLog({ level: 'info', message: `entry-${index}` });
    }
    const records = getDiagnosticLogs();
    expect(records).toHaveLength(200);
    expect(records[0].message).toBe('entry-5');
    expect(records[199].message).toBe('entry-204');
});

it('always scrubs keys and sensitive string shapes', () => {
    recordDiagnosticLog({
        level: 'error',
        message: 'failed for alice@example.com did:key:z6Secret',
        data: {
            allowPii: true,
            accessToken: 'secret',
            header: 'Bearer abc.def.ghi',
            url: 'https://learncard.app/claim?token=secret#fragment',
        },
    });
    expect(getDiagnosticLogs()[0]).toMatchObject({
        message: 'failed for [scrubbed-email] [scrubbed-did]',
        data: {
            accessToken: '[scrubbed]',
            header: '[scrubbed]',
            url: 'https://learncard.app/claim',
        },
    });
});
```

-   [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
bun run --cwd packages/learn-card-base test -- src/logging/diagnosticLogBuffer.test.ts
```

Expected: FAIL because `diagnosticLogBuffer.ts` does not exist.

-   [ ] **Step 3: Implement the bounded buffer and forced sanitizer**

Implement the exported shape and constants:

```ts
export type DiagnosticLogLevel = 'info' | 'warning' | 'error';

export interface DiagnosticLogEntry {
    timestamp: string;
    level: DiagnosticLogLevel;
    scope?: string;
    message: string;
    data?: unknown;
}

export interface DiagnosticLogInput {
    level: DiagnosticLogLevel;
    scope?: string;
    message: string;
    data?: unknown;
}

const MAX_DIAGNOSTIC_LOGS = 200;
const MAX_STRING_LENGTH = 1_000;
```

The sanitizer must recursively redact the logger's existing PII key patterns, remove `allowPii`, sanitize `Error` to `{ name, message }`, replace circular values, cap depth at 10, redact emails/DIDs/bearer/JWT strings, strip URL query/hash, and truncate long strings. `getDiagnosticLogs()` must return `structuredClone`-equivalent copies without depending on browser-only APIs.

-   [ ] **Step 4: Add failing logger-integration and event-ID tests**

Extend `logger.test.ts`:

```ts
it('records sanitized info, warning, and error entries when bug reports are enabled', () => {
    configureLoggerContext({ bugReportsEnabled: true });
    getLogger('feedback-test').info('opened', { email: 'alice@example.com', route: '/wallet' });
    expect(getDiagnosticLogs()).toEqual([
        expect.objectContaining({
            level: 'info',
            scope: 'feedback-test',
            message: 'opened',
            data: expect.objectContaining({ email: '[scrubbed]', route: '/wallet' }),
        }),
    ]);
});

it('clears and stops the diagnostic buffer when bug reports are disabled', () => {
    logger.info('before');
    configureLoggerContext({ bugReportsEnabled: false });
    logger.info('after');
    expect(getDiagnosticLogs()).toEqual([]);
});

it('returns the captured Sentry event id from error()', () => {
    const transport = makeMockTransport();
    transport.captureException = () => 'event-123';
    configureSentryTransport(transport);
    expect(logger.error('boom', new Error('boom'))).toBe('event-123');
});
```

-   [ ] **Step 5: Wire the logger and event-ID return value**

For info/warn/error, call `recordDiagnosticLog` after parsing arguments and before provider forwarding. Build `data` from `extra`, `values`, and the sanitized error. Do not record production-dropped debug calls. In `configureLoggerContext`, call `setDiagnosticLogCollectionEnabled(_bugReportsEnabled)` so disabling the preference clears the buffer.

Change the transport and logger signatures:

```ts
captureException(
    err: unknown,
    tags?: Record<string, string>,
    extra?: Record<string, unknown>
): string | undefined;

interface Logger {
    error(...args: unknown[]): string | undefined;
}
```

Return the capture ID only from the error path; console-only and message-only paths return `undefined`.

Export `DiagnosticLogEntry`, `getDiagnosticLogs`, and the other buffer functions from `packages/learn-card-base/src/index.ts` so application code imports them from `learn-card-base` rather than a private source path.

-   [ ] **Step 6: Run focused shared tests**

Run:

```bash
bun run --cwd packages/learn-card-base test -- src/logging/diagnosticLogBuffer.test.ts src/logging/logger.test.ts
```

Expected: both files PASS, including all pre-existing logger tests.

-   [ ] **Step 7: Commit Task 1**

```bash
git add packages/learn-card-base/src/logging/diagnosticLogBuffer.ts packages/learn-card-base/src/logging/diagnosticLogBuffer.test.ts packages/learn-card-base/src/logging/logger.ts packages/learn-card-base/src/logging/logger.test.ts packages/learn-card-base/src/index.ts
git commit -m "feat(LC-2086): buffer sanitized diagnostic logs"
```

---

### Task 2: Define the feedback domain, destination gates, and trigger timing policy

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/types.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/eligibility.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/eligibility.test.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/triggerPolicy.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/triggerPolicy.test.ts`

**Interfaces:**

-   Produces: all `FeedbackReport` domain types from the spec.
-   Produces: `getFeedbackReportingEligibility(input)` and `useFeedbackReportingEligibility()`.
-   Produces: `isAutomaticFeedbackSource(source)`, `isShakeInCooldown(now, lastShakeAt)`, and `isPendingFeedbackExpired(capturedAt, now)`.
-   Consumes: `calculateAge`, `getMinorAgeThreshold`, current profile type, current LCN profile, and preferences.

-   [ ] **Step 1: Write the failing eligibility matrix**

Use the pure function for exhaustive cases:

```ts
it.each([
    ['adult defaults', {}, 'guardian', undefined, { bug: true, idea: true }],
    [
        'bug opt-out',
        { bugReportsEnabled: false },
        'guardian',
        undefined,
        { bug: false, idea: true },
    ],
    [
        'analytics opt-out',
        { analyticsEnabled: false },
        'guardian',
        undefined,
        { bug: true, idea: false },
    ],
    ['server minor', { isMinor: true }, 'guardian', undefined, { bug: false, idea: false }],
    ['child profile', {}, 'child', undefined, { bug: false, idea: false }],
    ['underage DOB', {}, 'guardian', '2014-01-01', { bug: false, idea: false }],
])('%s', (_label, preferences, profileType, dob, expected) => {
    expect(
        getFeedbackReportingEligibility({
            isLoading: false,
            preferences,
            profileType,
            dob,
            country: 'US',
            now: new Date('2026-08-20T12:00:00Z'),
        })
    ).toMatchObject(expected);
});
```

Also assert that loading and invalid DOB fail closed, while absent DOB on an adult profile preserves the existing default-enabled behavior.

-   [ ] **Step 2: Write failing timing-policy tests**

```ts
expect(isShakeInCooldown(19_999, 10_000)).toBe(true);
expect(isShakeInCooldown(20_000, 10_000)).toBe(false);
expect(
    isPendingFeedbackExpired('2026-08-20T12:00:00.000Z', Date.parse('2026-08-20T12:05:00.000Z'))
).toBe(true);
expect(isAutomaticFeedbackSource('shake')).toBe(true);
expect(isAutomaticFeedbackSource('settings')).toBe(false);
```

-   [ ] **Step 3: Run both tests to verify they fail**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/eligibility.test.ts src/feedback/reporting/triggerPolicy.test.ts
```

Expected: FAIL because the modules do not exist.

-   [ ] **Step 4: Implement the domain types and pure policies**

Copy the approved report interfaces from the spec into `types.ts`, importing `DiagnosticLogEntry` as a type from `learn-card-base`. Also define the controller option types used by Task 8:

```ts
export interface ReportProblemOptions {
    source?: FeedbackSource;
    associatedEventId?: string;
    initialMessage?: string;
    submitImmediately?: boolean;
}

export interface ShareIdeaOptions {
    source?: FeedbackSource;
    initialMessage?: string;
}
```

Add the exact timing constants:

```ts
export const SHAKE_COOLDOWN_MS = 10_000;
export const PENDING_FEEDBACK_TTL_MS = 300_000;

export const isAutomaticFeedbackSource = (source: FeedbackSource): boolean =>
    source === 'shake' || source === 'screenshot';
```

The hook must only adapt current React-query/profile data into the tested pure function. It must not call `canPromptForFeedback` or mutate preferences.

-   [ ] **Step 5: Run the domain tests**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/eligibility.test.ts src/feedback/reporting/triggerPolicy.test.ts
```

Expected: PASS.

-   [ ] **Step 6: Commit Task 2**

```bash
git add apps/learn-card-app/src/feedback/reporting/types.ts apps/learn-card-app/src/feedback/reporting/eligibility.ts apps/learn-card-app/src/feedback/reporting/eligibility.test.ts apps/learn-card-app/src/feedback/reporting/triggerPolicy.ts apps/learn-card-app/src/feedback/reporting/triggerPolicy.test.ts
git commit -m "feat(LC-2086): define feedback privacy gates"
```

---

### Task 3: Record bounded normalized route history

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/routeHistory.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/routeHistory.test.ts`
-   Modify: `apps/learn-card-app/src/analytics/useScreenView.ts`

**Interfaces:**

-   Produces: `recordFeedbackRoute(route)`, `getRecentFeedbackRoutes()`, and `clearFeedbackRouteHistory()`.
-   Consumes: normalized route strings from `normalizeScreenName`.

-   [ ] **Step 1: Write the failing route-history tests**

```ts
beforeEach(clearFeedbackRouteHistory);

it('keeps the newest ten routes and collapses consecutive duplicates', () => {
    recordFeedbackRoute('/wallet');
    recordFeedbackRoute('/wallet');
    for (let index = 0; index < 11; index += 1) recordFeedbackRoute(`/route-${index}`);
    expect(getRecentFeedbackRoutes()).toHaveLength(10);
    expect(getRecentFeedbackRoutes()[0]).toBe('/route-1');
    expect(getRecentFeedbackRoutes()[9]).toBe('/route-10');
});

it('returns a defensive copy', () => {
    recordFeedbackRoute('/wallet');
    const first = getRecentFeedbackRoutes();
    first.push('/mutated');
    expect(getRecentFeedbackRoutes()).toEqual(['/wallet']);
});
```

-   [ ] **Step 2: Run the new test to verify it fails**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/routeHistory.test.ts
```

Expected: FAIL because the module does not exist.

-   [ ] **Step 3: Implement and connect route recording**

Use a module-local `string[]` capped at ten. In `useScreenView`, record the already normalized `screenName` immediately before `analytics.page`:

```ts
const screenName = normalizeScreenName(location.pathname);
recordFeedbackRoute(screenName);
void page(screenName);
```

Never pass query strings or fragments to the history module.

-   [ ] **Step 4: Run the focused route test**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/routeHistory.test.ts
```

Expected: PASS.

-   [ ] **Step 5: Commit Task 3**

```bash
git add apps/learn-card-app/src/feedback/reporting/routeHistory.ts apps/learn-card-app/src/feedback/reporting/routeHistory.test.ts apps/learn-card-app/src/analytics/useScreenView.ts
git commit -m "feat(LC-2086): retain normalized route history"
```

---

### Task 4: Extract reusable version diagnostics and build privacy-safe report context

**Files:**

-   Create: `apps/learn-card-app/src/components/versionInfoModal/versionInfo.helpers.ts`
-   Create: `apps/learn-card-app/src/components/versionInfoModal/versionInfo.helpers.test.ts`
-   Modify: `apps/learn-card-app/src/components/versionInfoModal/VersionInfoModal.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/collectFeedbackContext.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/collectFeedbackContext.test.ts`

**Interfaces:**

-   Produces: `VersionInfo`, `NetworkSummary`, `DeviceSummary`, `collectVersionInfo(fallbackVersion)`, and formatting helpers used by the modal.
-   Produces: `collectFeedbackContext({ kind, fallbackVersion, tenantId })` returning `FeedbackContext`.
-   Consumes: route history and `getDiagnosticLogs()`.

-   [ ] **Step 1: Write failing helper and privacy-mapping tests**

Cover web fallback, partial native plugin failure, Capgo version selection, and redaction by construction:

```ts
it('maps only the approved diagnostic subset', async () => {
    const context = await collectFeedbackContext(
        { kind: 'bug', fallbackVersion: '1.98.3', tenantId: 'learncard' },
        {
            collectVersionInfo: async () => ({
                platform: 'ios',
                isNative: true,
                displayVersion: '1.98.3',
                nativeVersion: '1.98.0',
                nativeBuild: '42',
                bundleVersion: '2026.08.20',
                channel: 'production',
                deviceId: 'must-not-leak',
                bundleInternalId: 'must-not-leak',
                bundleChecksum: 'must-not-leak',
                network: { connected: true, label: 'Wi-Fi · Connected' },
                device: { model: 'iPhone', osLabel: 'iOS 19' },
            }),
            getRoutes: () => ['/wallet', '/credential/:id'],
            getLogs: () => [],
        }
    );
    expect(JSON.stringify(context)).not.toContain('must-not-leak');
    expect(context.currentRoute).toBe('/credential/:id');
    expect(context.app?.bundleVersion).toBe('2026.08.20');
});

it('omits logs and device details for ideas', async () => {
    const context = await collectFeedbackContext({ kind: 'idea', fallbackVersion: '1.98.3' }, deps);
    expect(context.logs).toBeUndefined();
    expect(context.device).toBeUndefined();
    expect(context.network).toBeUndefined();
});
```

-   [ ] **Step 2: Run the focused tests to verify they fail**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/components/versionInfoModal/versionInfo.helpers.test.ts src/feedback/reporting/collectFeedbackContext.test.ts
```

Expected: FAIL because the helper modules do not exist.

-   [ ] **Step 3: Extract the existing modal helpers without changing visible behavior**

Move `Platform`, `NetworkSummary`, `DeviceSummary`, `VersionInfo`, `formatNetwork`, `summarizeDevice`, `formatRelativeTime`, `formatBuildDate`, and `collectVersionInfo` from `VersionInfoModal.tsx` into `versionInfo.helpers.ts`. Preserve the existing per-plugin `.catch(() => null)` behavior and the current Capgo bundle selection rules. Import these exports back into the modal.

-   [ ] **Step 4: Implement privacy-safe context mapping**

`collectFeedbackContext` accepts optional dependencies for deterministic tests and builds:

```ts
return {
    currentRoute: routes.at(-1) ?? normalizeScreenName(window.location.pathname),
    recentRoutes: routes,
    tenantId,
    app: {
        platform: info.platform,
        displayVersion: info.displayVersion,
        nativeVersion: info.nativeVersion,
        nativeBuild: info.nativeBuild,
        bundleVersion: info.bundleVersion,
        channel: info.channel,
    },
    ...(kind === 'bug' ? { device: info.device, network: info.network, logs: getLogs() } : {}),
};
```

Do not spread `VersionInfo`; enumerate allowed keys exactly.

-   [ ] **Step 5: Run the diagnostics tests**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/components/versionInfoModal/versionInfo.helpers.test.ts src/feedback/reporting/collectFeedbackContext.test.ts
```

Expected: PASS.

-   [ ] **Step 6: Commit Task 4**

```bash
git add apps/learn-card-app/src/components/versionInfoModal/versionInfo.helpers.ts apps/learn-card-app/src/components/versionInfoModal/versionInfo.helpers.test.ts apps/learn-card-app/src/components/versionInfoModal/VersionInfoModal.tsx apps/learn-card-app/src/feedback/reporting/collectFeedbackContext.ts apps/learn-card-app/src/feedback/reporting/collectFeedbackContext.test.ts
git commit -m "refactor(LC-2086): share privacy-safe app diagnostics"
```

---

### Task 5: Capture a non-blocking viewport screenshot

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/captureScreenshot.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/captureScreenshot.test.ts`

**Interfaces:**

-   Produces: `captureFeedbackScreenshot(options?): Promise<FeedbackScreenshot | undefined>`.
-   Consumes: `html2canvas` and `FeedbackScreenshot`.

-   [ ] **Step 1: Write failing success, failure, and timeout tests**

Mock `html2canvas` and fake timers:

```ts
it('captures the visible viewport as PNG', async () => {
    html2canvasMock.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,AAAA' });
    await expect(captureFeedbackScreenshot()).resolves.toEqual({
        dataUrl: 'data:image/png;base64,AAAA',
        filename: 'feedback-screenshot.png',
        contentType: 'image/png',
    });
    expect(html2canvasMock).toHaveBeenCalledWith(
        document.documentElement,
        expect.objectContaining({ useCORS: true, logging: false })
    );
});

it('returns undefined when rendering rejects', async () => {
    html2canvasMock.mockRejectedValue(new Error('unsupported CSS'));
    await expect(captureFeedbackScreenshot()).resolves.toBeUndefined();
});
```

Add a 2,000 ms timeout assertion that resolves `undefined` and clears its timer.

-   [ ] **Step 2: Run the test to verify it fails**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/captureScreenshot.test.ts
```

Expected: FAIL because the module does not exist.

-   [ ] **Step 3: Implement viewport capture**

Call:

```ts
html2canvas(document.documentElement, {
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    useCORS: true,
    logging: false,
    ignoreElements: element => element.hasAttribute('data-feedback-exclude'),
});
```

Race capture against the timeout, validate that the result starts with `data:image/png;base64,`, and log only a generic sanitized warning on failure.

-   [ ] **Step 4: Run the screenshot test**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/captureScreenshot.test.ts
```

Expected: PASS.

-   [ ] **Step 5: Commit Task 5**

```bash
git add apps/learn-card-app/src/feedback/reporting/captureScreenshot.ts apps/learn-card-app/src/feedback/reporting/captureScreenshot.test.ts
git commit -m "feat(LC-2086): capture feedback screenshots"
```

---

### Task 6: Implement Sentry and analytics feedback transports

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/sentryFeedbackTransport.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/sentryFeedbackTransport.test.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/createFeedbackTransport.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/createFeedbackTransport.test.ts`
-   Modify: `apps/learn-card-app/src/analytics/events.ts`
-   Modify: `apps/learn-card-app/src/constants/sentry.ts`

**Interfaces:**

-   Produces: `submitSentryFeedback(report): Promise<{ id?: string }>`.
-   Produces: `createFeedbackTransport(analytics): FeedbackTransport`, where `analytics` includes `track`, `isReady`, and `providerName`.
-   Produces: typed `AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED` payload.
-   Consumes: Sentry `captureFeedback`, analytics `track`, and the optional logger event ID from Task 1.

-   [ ] **Step 1: Write failing Sentry payload tests**

Mock `@sentry/react` and assert the installed 8.34 signature:

```ts
expect(captureFeedback).toHaveBeenCalledWith(
    expect.objectContaining({
        message: 'The claim button froze',
        associatedEventId: 'error-event-1',
        tags: expect.objectContaining({
            feedbackType: 'bug',
            feedbackSource: 'error-boundary',
            route: '/claim/:id',
            tenant: 'learncard',
            bundle: '2026.08.20',
        }),
    }),
    expect.objectContaining({
        attachments: expect.arrayContaining([
            expect.objectContaining({
                filename: 'feedback-screenshot.png',
                contentType: 'image/png',
            }),
            expect.objectContaining({
                filename: 'feedback-logs.json',
                contentType: 'application/json',
            }),
        ]),
    })
);
```

Also assert rejection when `Sentry.getClient()` is absent, and omission of empty attachments.

-   [ ] **Step 2: Write failing analytics routing tests**

```ts
it('sends ideas through the typed analytics adapter without bug diagnostics', async () => {
    const track = vi.fn().mockResolvedValue(undefined);
    const transport = createFeedbackTransport({ track, isReady: true, providerName: 'posthog' });
    await transport.submit(ideaReport);
    expect(track).toHaveBeenCalledWith(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED, {
        source: 'settings',
        message: 'Add a compact credential view',
        currentRoute: '/wallet',
        appVersion: '1.98.3',
    });
});
```

Assert bugs call `submitSentryFeedback` and never call analytics.
Assert an idea rejects with the friendly transport error when analytics is not ready or `providerName !== 'posthog'`; do not report success through the noop provider.

-   [ ] **Step 3: Run both transport tests to verify they fail**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/sentryFeedbackTransport.test.ts src/feedback/reporting/createFeedbackTransport.test.ts
```

Expected: FAIL because the adapters and analytics event do not exist.

-   [ ] **Step 4: Make the injected logger transport return event IDs**

In `constants/sentry.ts`, return from each capture callback:

```ts
captureException: (err, tags, extra) =>
    Sentry.withScope(scope => {
        if (tags) Object.entries(tags).forEach(([key, value]) => scope.setTag(key, value));
        if (extra) Object.entries(extra).forEach(([key, value]) => scope.setExtra(key, value));
        return Sentry.captureException(err);
    }),
```

Keep warning/message behavior unchanged except for satisfying any widened return type.

-   [ ] **Step 5: Implement the provider adapters**

Convert PNG data URLs with `atob` into `Uint8Array`. Encode logs with `new TextEncoder().encode(JSON.stringify(logs, null, 2))`. Pass structured app/device/network data in feedback context or scope extras, not tags. Enumerate the approved tags exactly.

Add:

```ts
FEEDBACK_IDEA_SUBMITTED: 'feedback_idea_submitted',
```

and its exact typed payload from the spec to `AnalyticsEventPayloads`.

-   [ ] **Step 6: Run transport and logger tests**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/sentryFeedbackTransport.test.ts src/feedback/reporting/createFeedbackTransport.test.ts
bun run --cwd packages/learn-card-base test -- src/logging/logger.test.ts
```

Expected: PASS.

-   [ ] **Step 7: Commit Task 6**

```bash
git add apps/learn-card-app/src/feedback/reporting/sentryFeedbackTransport.ts apps/learn-card-app/src/feedback/reporting/sentryFeedbackTransport.test.ts apps/learn-card-app/src/feedback/reporting/createFeedbackTransport.ts apps/learn-card-app/src/feedback/reporting/createFeedbackTransport.test.ts apps/learn-card-app/src/analytics/events.ts apps/learn-card-app/src/constants/sentry.ts
git commit -m "feat(LC-2086): route feedback through provider adapters"
```

---

### Task 7: Build the accessible one-screen composer and translations

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackComposer.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackComposer.test.tsx`
-   Modify: `apps/learn-card-app/public/locales/en/translation.json`
-   Modify: `apps/learn-card-app/public/locales/es/translation.json`
-   Modify: `apps/learn-card-app/public/locales/fr/translation.json`
-   Modify: `apps/learn-card-app/public/locales/ar/translation.json`

**Interfaces:**

-   Produces: `FeedbackComposer({ draft, onCancel, onSubmit })`.
-   Consumes: `FeedbackDraft`; emits a complete `FeedbackReport`.

-   [ ] **Step 1: Write failing component tests**

Mock Paraglide messages and test both kinds:

```tsx
render(<FeedbackComposer draft={bugDraft} onCancel={onCancel} onSubmit={onSubmit} />);
expect(screen.getByRole('heading', { name: 'Report a Problem' })).toBeVisible();
expect(screen.getByRole('img', { name: 'Screenshot attached' })).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Remove Screenshot' }));
expect(screen.queryByRole('img', { name: 'Screenshot attached' })).not.toBeInTheDocument();

await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
await user.click(screen.getByRole('button', { name: 'Send Report' }));
expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
        message: 'The claim button froze',
        screenshot: undefined,
    })
);
```

Also test empty validation, the idea copy/disclosure, loading text, success callback, friendly retry banner, and retained message after a rejected submit.

-   [ ] **Step 2: Run the component test to verify it fails**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/FeedbackComposer.test.tsx
```

Expected: FAIL because the component does not exist.

-   [ ] **Step 3: Implement the composer**

Use this controlled boundary:

```ts
export interface FeedbackComposerProps {
    draft: FeedbackDraft;
    onCancel(): void;
    onSubmit(report: FeedbackReport): Promise<void>;
}
```

Keep `message`, `screenshot`, `isSubmitting`, and friendly `error` in component state. Use a native `<textarea>` with explicit `text-grayscale-900`, `bg-white`, placeholder color, emerald focus ring, and an associated `<label>`. Render screenshot `alt="Screenshot attached"`. Use `<details>`/`<summary>` for “What we’ll send.” Show the standard red error banner after rejection and never render `error.message`.

-   [ ] **Step 4: Add all four locale key sets**

Merge this exact key set into each locale's `feedback.reporting` object. English:

```json
{
    "reportProblem": "Report a Problem",
    "shareIdea": "Share an Idea",
    "whatHappened": "What happened?",
    "problemPlaceholder": "Tell us what you expected and what happened.",
    "ideaQuestion": "What would make LearnCard better?",
    "ideaPlaceholder": "Describe your idea.",
    "screenshotAttached": "Screenshot attached",
    "removeScreenshot": "Remove Screenshot",
    "whatWeSend": "What we’ll send",
    "bugDisclosure": "Your message, optional screenshot, app and device details, recent screens, and sanitized logs.",
    "ideaDisclosure": "Your idea, current screen, app version, and tenant.",
    "cancel": "Cancel",
    "sendReport": "Send Report",
    "sendingReport": "Sending Report...",
    "shareIdeaAction": "Share Idea",
    "sharingIdea": "Sharing Idea...",
    "thanks": "Thanks for helping us improve LearnCard.",
    "error": "We couldn’t send your feedback. Please try again.",
    "tryAgain": "Try Again",
    "promptTitle": "Report a problem?",
    "promptBody": "We captured the current screen to help explain what happened.",
    "promptAction": "Report",
    "dismiss": "Dismiss"
}
```

Spanish:

```json
{
    "reportProblem": "Informar de un problema",
    "shareIdea": "Compartir una idea",
    "whatHappened": "¿Qué ocurrió?",
    "problemPlaceholder": "Cuéntanos qué esperabas y qué ocurrió.",
    "ideaQuestion": "¿Qué mejoraría LearnCard?",
    "ideaPlaceholder": "Describe tu idea.",
    "screenshotAttached": "Captura de pantalla adjunta",
    "removeScreenshot": "Eliminar captura",
    "whatWeSend": "Qué enviaremos",
    "bugDisclosure": "Tu mensaje, una captura opcional, datos de la aplicación y del dispositivo, pantallas recientes y registros depurados.",
    "ideaDisclosure": "Tu idea, la pantalla actual, la versión de la aplicación y la organización.",
    "cancel": "Cancelar",
    "sendReport": "Enviar informe",
    "sendingReport": "Enviando informe...",
    "shareIdeaAction": "Compartir idea",
    "sharingIdea": "Compartiendo idea...",
    "thanks": "Gracias por ayudarnos a mejorar LearnCard.",
    "error": "No pudimos enviar tus comentarios. Inténtalo de nuevo.",
    "tryAgain": "Intentar de nuevo",
    "promptTitle": "¿Informar de un problema?",
    "promptBody": "Capturamos la pantalla actual para ayudar a explicar lo ocurrido.",
    "promptAction": "Informar",
    "dismiss": "Cerrar"
}
```

French:

```json
{
    "reportProblem": "Signaler un problème",
    "shareIdea": "Partager une idée",
    "whatHappened": "Que s’est-il passé ?",
    "problemPlaceholder": "Dites-nous ce que vous attendiez et ce qui s’est passé.",
    "ideaQuestion": "Qu’est-ce qui améliorerait LearnCard ?",
    "ideaPlaceholder": "Décrivez votre idée.",
    "screenshotAttached": "Capture d’écran jointe",
    "removeScreenshot": "Supprimer la capture",
    "whatWeSend": "Ce que nous enverrons",
    "bugDisclosure": "Votre message, une capture facultative, les informations sur l’application et l’appareil, les écrans récents et les journaux nettoyés.",
    "ideaDisclosure": "Votre idée, l’écran actuel, la version de l’application et l’organisation.",
    "cancel": "Annuler",
    "sendReport": "Envoyer le rapport",
    "sendingReport": "Envoi du rapport...",
    "shareIdeaAction": "Partager l’idée",
    "sharingIdea": "Partage de l’idée...",
    "thanks": "Merci de nous aider à améliorer LearnCard.",
    "error": "Nous n’avons pas pu envoyer votre commentaire. Réessayez.",
    "tryAgain": "Réessayer",
    "promptTitle": "Signaler un problème ?",
    "promptBody": "Nous avons capturé l’écran actuel pour aider à expliquer ce qui s’est passé.",
    "promptAction": "Signaler",
    "dismiss": "Fermer"
}
```

Arabic:

```json
{
    "reportProblem": "الإبلاغ عن مشكلة",
    "shareIdea": "مشاركة فكرة",
    "whatHappened": "ماذا حدث؟",
    "problemPlaceholder": "أخبرنا بما توقعته وما حدث.",
    "ideaQuestion": "ما الذي يمكن أن يجعل LearnCard أفضل؟",
    "ideaPlaceholder": "صِف فكرتك.",
    "screenshotAttached": "لقطة شاشة مرفقة",
    "removeScreenshot": "إزالة لقطة الشاشة",
    "whatWeSend": "ما سنرسله",
    "bugDisclosure": "رسالتك ولقطة شاشة اختيارية وتفاصيل التطبيق والجهاز والشاشات الأخيرة والسجلات المنقحة.",
    "ideaDisclosure": "فكرتك والشاشة الحالية وإصدار التطبيق والمؤسسة.",
    "cancel": "إلغاء",
    "sendReport": "إرسال التقرير",
    "sendingReport": "جارٍ إرسال التقرير...",
    "shareIdeaAction": "مشاركة الفكرة",
    "sharingIdea": "جارٍ مشاركة الفكرة...",
    "thanks": "شكرًا لمساعدتنا في تحسين LearnCard.",
    "error": "تعذر إرسال ملاحظاتك. يُرجى المحاولة مرة أخرى.",
    "tryAgain": "المحاولة مرة أخرى",
    "promptTitle": "هل تريد الإبلاغ عن مشكلة؟",
    "promptBody": "التقطنا الشاشة الحالية للمساعدة في توضيح ما حدث.",
    "promptAction": "إبلاغ",
    "dismiss": "إغلاق"
}
```

-   [ ] **Step 5: Run component and i18n checks**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/FeedbackComposer.test.tsx
bun run --cwd apps/learn-card-app i18n:check-keys
```

Expected: PASS.

-   [ ] **Step 6: Commit Task 7**

```bash
git add apps/learn-card-app/src/feedback/reporting/FeedbackComposer.tsx apps/learn-card-app/src/feedback/reporting/FeedbackComposer.test.tsx apps/learn-card-app/public/locales/en/translation.json apps/learn-card-app/public/locales/es/translation.json apps/learn-card-app/public/locales/fr/translation.json apps/learn-card-app/public/locales/ar/translation.json
git commit -m "feat(LC-2086): add feedback composer"
```

---

### Task 8: Implement the root coordinator, deferred toast, and stable modal host

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackContext.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackContext.test.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackPromptToast.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/useFeedbackBusyState.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/useFeedbackBusyState.test.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/index.ts`
-   Modify: `apps/learn-card-app/src/FullApp.tsx`
-   Modify: `apps/learn-card-app/src/AppRouter.tsx`

**Interfaces:**

-   Produces: `FeedbackProvider`, `useFeedback()`, and `FeedbackController`.
-   Produces: `useFeedbackBusyState(): boolean`.
-   Consumes: Tasks 2–7, analytics, modal stack/actions, toast store, scanner store, keyboard store, tenant config, and app version.

-   [ ] **Step 1: Write failing busy-state tests**

Mock each source independently and assert:

```ts
expect(renderBusyState({ openModals: 1, scanner: false, keyboard: false })).toBe(true);
expect(renderBusyState({ openModals: 0, scanner: true, keyboard: false })).toBe(true);
expect(renderBusyState({ openModals: 0, scanner: false, keyboard: true })).toBe(true);
expect(renderBusyState({ openModals: 0, scanner: false, keyboard: false })).toBe(false);
```

Only modals with `open === true` count.

-   [ ] **Step 2: Write failing coordinator behavior tests**

Render the provider with injected `now`, screenshot, context, and transport dependencies. Assert:

-   explicit Settings bug capture opens the composer even while another modal is open;
-   shake while idle opens immediately;
-   screenshot while idle presents an actionable toast;
-   automatic trigger while busy captures immediately but defers presentation;
-   newer automatic draft replaces the older pending draft;
-   a pending draft at exactly 300,000 ms is discarded;
-   the prompt tap restores the preserved screenshot/context;
-   the composer stays open after transport rejection;
-   the provider never captures when destination eligibility is false.

Use a representative assertion:

```ts
await act(() => controller.reportProblem({ source: 'shake' }));
expect(captureScreenshot).toHaveBeenCalledTimes(1);
expect(collectContext).toHaveBeenCalledTimes(1);
expect(openModal).not.toHaveBeenCalled();

rerenderWithBusy(false);
expect(presentToast).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ autoDismiss: false })
);
```

-   [ ] **Step 3: Run coordinator tests to verify they fail**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/useFeedbackBusyState.test.tsx src/feedback/reporting/FeedbackContext.test.tsx
```

Expected: FAIL because the modules do not exist.

-   [ ] **Step 4: Implement the busy hook and controller**

Expose:

```ts
export interface FeedbackController {
    reportProblem(options?: ReportProblemOptions): Promise<void>;
    shareIdea(options?: ShareIdeaOptions): Promise<void>;
}
```

`reportProblem` must check bug eligibility, then await screenshot and context capture before deciding whether to open, toast, or store pending. `shareIdea` captures idea context without screenshot. A single `pendingRef`/state holds the newest automatic draft. Clear pending before presenting its toast. Track an `isComposerOpenRef` so automatic events are ignored while feedback UI is active.

When `submitImmediately === true`, require a non-empty trimmed `initialMessage`, build the same privacy-safe draft, call `transport.submit({ ...draft, message })` without opening a composer, and propagate transport failure to the caller. This path exists only for the existing micro-feedback follow-up.

Open the composer with:

```tsx
newModal(
    <FeedbackComposer draft={draft} onCancel={closeModal} onSubmit={submitAndClose} />,
    { sectionClassName: '!max-w-[480px]' },
    { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
);
```

Use a custom React element in the existing toast store for `FeedbackPromptToast`; give it explicit “Report” and dismiss buttons and `data-feedback-exclude` so a later capture cannot include it.

-   [ ] **Step 5: Mount the provider and keep the modal host outside the root boundary**

In `FullApp.tsx`, wrap the `IonApp` contents with `FeedbackProvider` inside `ModalsProvider` and existing analytics/auth providers.

In `AppRouter.tsx`, close the root `GenericErrorBoundary` after the guarded `#app-router` content, then render these persistent siblings:

```tsx
<GenericErrorBoundary>
    <div id="app-router">{/* guarded app surface */}</div>
</GenericErrorBoundary>
<Modals />
<ModalAccessibilityManager />
<ReducedMotionManager />
```

Preserve the existing comment explaining why `<Modals />` must survive loading transitions and update it to mention error fallbacks.

-   [ ] **Step 6: Run coordinator tests**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/useFeedbackBusyState.test.tsx src/feedback/reporting/FeedbackContext.test.tsx src/feedback/reporting/FeedbackComposer.test.tsx
```

Expected: PASS.

-   [ ] **Step 7: Commit Task 8**

```bash
git add apps/learn-card-app/src/feedback/reporting/FeedbackContext.tsx apps/learn-card-app/src/feedback/reporting/FeedbackContext.test.tsx apps/learn-card-app/src/feedback/reporting/FeedbackPromptToast.tsx apps/learn-card-app/src/feedback/reporting/useFeedbackBusyState.ts apps/learn-card-app/src/feedback/reporting/useFeedbackBusyState.test.tsx apps/learn-card-app/src/feedback/reporting/index.ts apps/learn-card-app/src/FullApp.tsx apps/learn-card-app/src/AppRouter.tsx
git commit -m "feat(LC-2086): coordinate feedback across app flows"
```

---

### Task 9: Add Settings, error-boundary, and existing-feedback entry points

**Files:**

-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackSettingsRows.tsx`
-   Create: `apps/learn-card-app/src/feedback/reporting/FeedbackSettingsRows.test.tsx`
-   Modify: `apps/learn-card-app/src/components/learncard/MyLearnCardModal.tsx`
-   Modify: `apps/learn-card-app/src/components/generic/GenericErrorBoundary.tsx`
-   Create: `apps/learn-card-app/src/components/generic/GenericErrorBoundary.test.tsx`
-   Modify: `apps/learn-card-app/src/feedback/FeedbackFollowUpSheet.tsx`
-   Create: `apps/learn-card-app/src/feedback/FeedbackFollowUpSheet.test.tsx`

**Interfaces:**

-   Consumes: `useFeedback()` and destination eligibility from the provider.
-   Consumes: optional event ID returned from `getLogger(...).error`.
-   Produces: no new provider-facing interface.

-   [ ] **Step 1: Write failing Settings-row tests**

Assert independent gates and actions:

```tsx
render(<FeedbackSettingsRows />, { wrapper: eligibleWrapper({ bug: true, idea: false }) });
expect(screen.getByRole('button', { name: 'Report a Problem' })).toBeVisible();
expect(screen.queryByRole('button', { name: 'Share an Idea' })).not.toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Report a Problem' }));
expect(reportProblem).toHaveBeenCalledWith({ source: 'settings' });
```

Test the inverse gate and both-disabled state.

-   [ ] **Step 2: Write failing error-boundary tests**

Mock the logger to return `event-123` and the feedback controller. Throw a non-chunk error from a child and assert “Send Report” is visible only when bug eligible. Clicking it must call:

```ts
reportProblem({
    source: 'error-boundary',
    associatedEventId: 'event-123',
});
```

Assert stale-chunk fallback retains its existing refresh-only behavior.

-   [ ] **Step 3: Run the entry-point tests to verify they fail**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/FeedbackSettingsRows.test.tsx src/components/generic/GenericErrorBoundary.test.tsx
```

Expected: FAIL because Settings rows and report action do not exist.

-   [ ] **Step 4: Implement explicit entry points**

Render `FeedbackSettingsRows` inside the guardian Settings row section of `MyLearnCardModal`, adjacent to Data Sharing/Admin tools. Use Ionicons or inline SVGs with `currentColor`; do not add raw emoji.

In `GenericErrorBoundary`, store the optional ID returned by `log.error` in state/ref during `onError`. Pass a report callback to `ErrorFallback`. Render a secondary pill button labeled from `feedback.reporting.sendReport` for non-chunk errors only.

-   [ ] **Step 5: Remove direct Sentry use from the existing follow-up sheet**

Delete `import * as Sentry from '@sentry/react'`. For the existing “broken or free text” branch, call the shared controller with a prefilled immediate report:

```ts
await reportProblem({
    source: 'micro-feedback',
    initialMessage:
        trimmedNote || `User reported a problem (${selected.join(', ') || 'unspecified'})`,
    submitImmediately: true,
});
```

Make `handleSubmit` async, retain the existing analytics event, preserve the resolved-ref guard, and add an `isSubmitting` spinner/disabled state while the immediate report is submitted. Log a sanitized warning without exposing a provider error, then close to preserve the existing follow-up behavior.

In `FeedbackFollowUpSheet.test.tsx`, select “broken,” submit, and assert `reportProblem` receives the exact `micro-feedback` options above. Resolve the mocked promise manually and assert the button shows contextual loading text until resolution and the modal closes afterward. Add a rejection case proving the modal still closes and no raw error is rendered.

-   [ ] **Step 6: Run entry-point and existing feedback tests**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/FeedbackSettingsRows.test.tsx src/components/generic/GenericErrorBoundary.test.tsx src/feedback/FeedbackFollowUpSheet.test.tsx src/feedback/feedbackGovernor.test.ts
```

Expected: PASS.

-   [ ] **Step 7: Verify UI files contain no direct provider imports**

Run:

```bash
rg -n "@sentry/react|posthog-js" apps/learn-card-app/src/feedback apps/learn-card-app/src/components/generic apps/learn-card-app/src/components/learncard/MyLearnCardModal.tsx
```

Expected: the only Sentry match under the reporting feature is `sentryFeedbackTransport.ts`; no UI component matches.

-   [ ] **Step 8: Commit Task 9**

```bash
git add apps/learn-card-app/src/feedback/reporting/FeedbackSettingsRows.tsx apps/learn-card-app/src/feedback/reporting/FeedbackSettingsRows.test.tsx apps/learn-card-app/src/components/learncard/MyLearnCardModal.tsx apps/learn-card-app/src/components/generic/GenericErrorBoundary.tsx apps/learn-card-app/src/components/generic/GenericErrorBoundary.test.tsx apps/learn-card-app/src/feedback/FeedbackFollowUpSheet.tsx apps/learn-card-app/src/feedback/FeedbackFollowUpSheet.test.tsx
git commit -m "feat(LC-2086): expose explicit feedback entry points"
```

---

### Task 10: Add native shake and iOS screenshot triggers

**Files:**

-   Modify: `apps/learn-card-app/package.json`
-   Modify: `bun.lock`
-   Create: `apps/learn-card-app/src/feedback/reporting/native/ScreenshotObserver.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/useAutomaticFeedbackTriggers.ts`
-   Create: `apps/learn-card-app/src/feedback/reporting/useAutomaticFeedbackTriggers.test.tsx`
-   Modify: `apps/learn-card-app/src/feedback/reporting/FeedbackContext.tsx`
-   Create: `apps/learn-card-app/ios/App/App/ScreenshotObserverPlugin.swift`
-   Create: `apps/learn-card-app/ios/App/App/MyViewController.swift`
-   Modify: `apps/learn-card-app/ios/App/App/Base.lproj/Main.storyboard`
-   Modify: `apps/learn-card-app/ios/App/App.xcodeproj/project.pbxproj`
-   Modify: `apps/learn-card-app/ios/App/App.xcodeproj/project.pbxproj.template`
-   Modify generated native dependency files produced by `bunx cap sync ios android` when Git reports them.

**Interfaces:**

-   Produces: typed `ScreenshotObserver.addListener('screenshotTaken', listener)`.
-   Produces: `useAutomaticFeedbackTriggers({ enabled, reportProblem })`.
-   Consumes: `CapacitorShake.addListener('shake', ...)`, Capacitor app state, platform, LaunchDarkly `shakeToReportEnabled`, bug eligibility, and controller timing policy.

-   [ ] **Step 1: Add the pinned shake dependency**

Run:

```bash
bun add --cwd apps/learn-card-app --exact @capgo/capacitor-shake@8.0.37
```

Verify `package.json` contains exactly `"@capgo/capacitor-shake": "8.0.37"` and the lockfile resolves the same version.

-   [ ] **Step 2: Write failing automatic-listener tests**

Mock Capacitor platform/app state, `CapacitorShake`, `ScreenshotObserver`, and time. Assert:

-   no listeners on web;
-   no shake listener when `shakeToReportEnabled` is missing/false;
-   no listeners when bug eligibility is false;
-   foreground shake calls `reportProblem({ source: 'shake' })` once inside ten seconds;
-   background shake is ignored;
-   iOS screenshot calls `reportProblem({ source: 'screenshot' })`;
-   Android does not register the iOS screenshot listener;
-   every listener handle is removed on cleanup.

```ts
expect(reportProblem).toHaveBeenCalledWith({ source: 'shake' });
now = 19_999;
shakeCallback();
expect(reportProblem).toHaveBeenCalledTimes(1);
now = 20_000;
shakeCallback();
expect(reportProblem).toHaveBeenCalledTimes(2);
```

-   [ ] **Step 3: Run the listener test to verify it fails**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/useAutomaticFeedbackTriggers.test.tsx
```

Expected: FAIL because the hook and bridge do not exist.

-   [ ] **Step 4: Implement the TypeScript listeners**

Register the local plugin:

```ts
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface ScreenshotObserverPlugin {
    addListener(
        eventName: 'screenshotTaken',
        listener: (event: { capturedAt: string }) => void
    ): Promise<PluginListenerHandle>;
}

export const ScreenshotObserver = registerPlugin<ScreenshotObserverPlugin>('ScreenshotObserver');
```

The hook reads the initial `App.getState()`, updates a ref from `App.addListener('appStateChange')`, and checks the ref inside callbacks. Use Task 2's cooldown helper. The provider passes `enabled: eligibility.bug`, and the hook separately reads `flags.shakeToReportEnabled === true` for shake registration.

-   [ ] **Step 5: Implement and register the Swift bridge**

Create:

```swift
import Capacitor
import UIKit

@objc(ScreenshotObserverPlugin)
public class ScreenshotObserverPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotObserverPlugin"
    public let jsName = "ScreenshotObserver"
    public let pluginMethods: [CAPPluginMethod] = []

    private var observer: NSObjectProtocol?

    public override func load() {
        observer = NotificationCenter.default.addObserver(
            forName: UIApplication.userDidTakeScreenshotNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.notifyListeners(
                "screenshotTaken",
                data: ["capturedAt": ISO8601DateFormatter().string(from: Date())]
            )
        }
    }

    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
    }
}
```

Register it through:

```swift
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ScreenshotObserverPlugin())
    }
}
```

Change the storyboard controller to `customClass="MyViewController" customModule="App"`. Add both Swift files to the App group and Sources build phase in the checked-in project and template.

-   [ ] **Step 6: Run listener tests and synchronize Capacitor**

```bash
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/useAutomaticFeedbackTriggers.test.tsx
cd apps/learn-card-app
bunx cap sync ios
bunx cap sync android
cd ../..
```

Expected: listener tests PASS; Capacitor reports the shake plugin on iOS and Android and preserves the local Swift files.

-   [ ] **Step 7: Compile the iOS bridge without signing**

Run:

```bash
xcodebuild -project apps/learn-card-app/ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

Expected: `** BUILD SUCCEEDED **` and no unknown plugin/custom-controller errors.

-   [ ] **Step 8: Commit Task 10**

Review `git status --short`, stage only package, lockfile, reporting, and native files associated with this task, then commit:

```bash
git commit -m "feat(LC-2086): add native feedback triggers"
```

---

### Task 11: Run focused regression, static, build, and manual-release verification

**Files:**

-   Modify only LC-2086 files if verification exposes a defect.

**Interfaces:**

-   Consumes: every task and the approved specification.
-   Produces: verified branch state ready for review.

-   [ ] **Step 1: Run all focused LC-2086 tests together**

```bash
bun run --cwd packages/learn-card-base test -- src/logging/diagnosticLogBuffer.test.ts src/logging/logger.test.ts
bun run --cwd apps/learn-card-app test:unit -- src/feedback/reporting/eligibility.test.ts src/feedback/reporting/triggerPolicy.test.ts src/feedback/reporting/routeHistory.test.ts src/components/versionInfoModal/versionInfo.helpers.test.ts src/feedback/reporting/collectFeedbackContext.test.ts src/feedback/reporting/captureScreenshot.test.ts src/feedback/reporting/sentryFeedbackTransport.test.ts src/feedback/reporting/createFeedbackTransport.test.ts src/feedback/reporting/FeedbackComposer.test.tsx src/feedback/reporting/useFeedbackBusyState.test.tsx src/feedback/reporting/FeedbackContext.test.tsx src/feedback/reporting/FeedbackSettingsRows.test.tsx src/feedback/reporting/useAutomaticFeedbackTriggers.test.tsx src/components/generic/GenericErrorBoundary.test.tsx src/feedback/FeedbackFollowUpSheet.test.tsx
```

Expected: all listed tests PASS with no unhandled errors.

-   [ ] **Step 2: Run formatting and policy checks**

```bash
bunx prettier --check packages/learn-card-base/src/logging/diagnosticLogBuffer.ts packages/learn-card-base/src/logging/logger.ts apps/learn-card-app/src/feedback/reporting apps/learn-card-app/src/components/versionInfoModal apps/learn-card-app/src/components/generic/GenericErrorBoundary.tsx apps/learn-card-app/src/components/learncard/MyLearnCardModal.tsx
bun run --cwd apps/learn-card-app i18n:check-keys
node scripts/check-safe-area.mjs
```

Expected: all checks PASS.

-   [ ] **Step 3: Run application build verification**

Generate the app's derived configuration/messages through its normal build path and build the affected packages:

```bash
bunx tsc -p packages/learn-card-base/tsconfig.lib.json --noEmit
bunx nx build learn-card-app
```

If Nx daemon state hangs as it did during baseline discovery, rerun the same commands with `NX_DAEMON=false`; do not reset unrelated repository caches.

Expected: both targets PASS.

-   [ ] **Step 4: Audit privacy and provider boundaries**

```bash
rg -n "profileId|currentLCNUser.*did|deviceId|privateKey|accessToken|Authorization" apps/learn-card-app/src/feedback/reporting
rg -n "@sentry/react|posthog-js" apps/learn-card-app/src/feedback/reporting apps/learn-card-app/src/feedback/FeedbackFollowUpSheet.tsx apps/learn-card-app/src/components/generic/GenericErrorBoundary.tsx apps/learn-card-app/src/components/learncard/MyLearnCardModal.tsx
```

Expected: privacy identifiers appear only in explicit exclusion tests/comments; `@sentry/react` appears only in `sentryFeedbackTransport.ts`; `posthog-js` does not appear.

-   [ ] **Step 5: Complete physical-device release checks**

On at least one physical iPhone and one physical Android device:

1. Confirm Settings bug and idea entries follow independent preferences.
2. Confirm screenshot capture preview/removal and Sentry attachments.
3. Confirm iOS screenshot notification produces the actionable toast.
4. Enable `shakeToReportEnabled` for the test user.
5. Confirm one shake opens a report and repeated shakes inside ten seconds do nothing.
6. Walk, rotate, and set down each device; confirm no disruptive repeated prompt.
7. Open a modal, scanner, and keyboard flow; trigger feedback and confirm the preserved prompt appears after returning idle.
8. Background the app; confirm shake events do not present feedback.
9. Force an error-boundary test build and confirm the submitted feedback is associated with the captured Sentry event.

Expected: every check matches the specification before widening the LaunchDarkly flag.

-   [ ] **Step 6: Review branch diff and commit verification fixes**

```bash
git status --short
git diff --check
git log --oneline --decorate -12
```

If verification required code changes, rerun their focused tests and commit them with:

```bash
git commit -m "fix(LC-2086): address feedback verification findings"
```

If no code changed, leave the already verified task commits unchanged.
