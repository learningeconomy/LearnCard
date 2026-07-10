# In-App Messages

A LaunchDarkly-driven system for **conditional, targeted user prompts** across LearnCard apps
(`learn-card-app` + `scouts`). One JSON flag (`inAppMessages`) delivers a prioritized list of
messages; each message carries its own **targeting predicate tree** that is evaluated _on device_
so it can see things LaunchDarkly's own rules cannot — the Capacitor platform, the native binary
version, and the live Capgo/OTA bundle version.

-   **Show a message** with title, body, and media (YouTube / image / GIF)
-   **Call-to-action buttons** — open an in-app feature, an external link, the app store, or run a Capgo update
-   **Dismissable or required** (blocking)
-   **Native-aware app-store links** — iOS → App Store, Android → Google Play, web → configured URL
-   **Capgo update with live progress** — check, download (with %), and reload onto the latest bundle
-   **Targeting** by platform, semver version (native / web / capgo), and profile role

---

## Quick start

The host is already mounted in both apps (`FullApp.tsx`), so **you don't write any React** — you
just author the flag value in LaunchDarkly. Create a JSON flag named **`inAppMessages`** and paste
a value like:

```json
{
    "version": 1,
    "messages": [
        {
            "id": "pathways-launch-2026",
            "priority": 100,
            "dismissible": true,
            "frequency": "once",
            "presentation": "modal",
            "media": { "type": "youtube", "url": "https://youtu.be/dQw4w9WgXcQ", "aspect": "16:9" },
            "title": "Introducing Pathways",
            "body": "Map your journey to any goal.",
            "actions": [
                {
                    "label": "Explore Pathways",
                    "style": "primary",
                    "action": { "type": "internalLink", "path": "/pathways" }
                },
                { "label": "Not now", "style": "dismiss", "action": { "type": "dismiss" } }
            ],
            "targeting": { "any": [{ "role": ["learner"] }, { "role": ["guardian"] }] }
        }
    ]
}
```

The **highest-`priority`** message whose `targeting` matches the current user is shown; frequency
rules then decide whether it's suppressed.

---

## The three anticipated use cases

### 1. Announce a new feature (deep-link into it)

```json
{
    "id": "announce-resume-builder",
    "priority": 80,
    "dismissible": true,
    "frequency": "once",
    "presentation": "modal",
    "media": {
        "type": "gif",
        "url": "https://cdn.learncard.com/promo/resume.gif",
        "aspect": "16:9"
    },
    "title": "Build your resume in seconds",
    "body": "Turn your credentials into a polished resume.",
    "actions": [
        {
            "label": "Try it now",
            "style": "primary",
            "action": { "type": "internalLink", "path": "/resume-builder" }
        },
        {
            "label": "Watch the guide",
            "style": "secondary",
            "action": { "type": "externalLink", "url": "https://docs.learncard.com/resume" }
        },
        { "label": "Maybe later", "style": "dismiss", "action": { "type": "dismiss" } }
    ]
}
```

### 2. Require a native app-store update (security / critical fix)

Blocking modal (no dismiss), targeted at native binaries **below** a version. The `appStore` action
resolves per-platform from tenant `links` config; add per-message overrides if you like.

```json
{
    "id": "force-update-1.0.9",
    "priority": 1000,
    "dismissible": false,
    "frequency": "always",
    "presentation": "modal",
    "title": "Update required",
    "body": "A critical security update is available. Please update to continue.",
    "actions": [
        {
            "label": "Update in the App Store",
            "style": "primary",
            "action": {
                "type": "appStore",
                "iosUrl": "https://apps.apple.com/app/id1508141215",
                "androidUrl": "https://play.google.com/store/apps/details?id=com.learncard.app"
            }
        }
    ],
    "targeting": {
        "all": [
            { "platform": ["ios", "android"] },
            { "version": { "source": "native", "op": "lt", "value": "1.0.9" } }
        ]
    }
}
```

### 3. Nudge users onto the latest Capgo (OTA) bundle — with progress

The `capgoUpdate` action checks for a newer bundle, downloads it (showing a live progress bar),
and reloads. Shown as a non-blocking banner, at most once every 3 days.

```json
{
    "id": "capgo-latest-nudge",
    "priority": 50,
    "dismissible": true,
    "frequency": { "everyDays": 3 },
    "presentation": "banner",
    "title": "New improvements are ready",
    "body": "Get the latest version of the app.",
    "actions": [
        { "label": "Update now", "style": "positive", "action": { "type": "capgoUpdate" } },
        { "label": "Later", "style": "dismiss", "action": { "type": "dismiss" } }
    ],
    "targeting": {
        "all": [
            { "platform": ["ios", "android"] },
            { "version": { "source": "capgo", "op": "lt", "value": "1.0.8" } }
        ]
    }
}
```

---

## Field reference

### Message

| Field          | Type                                     | Default   | Notes                                                     |
| -------------- | ---------------------------------------- | --------- | --------------------------------------------------------- |
| `id`           | `string`                                 | —         | Stable key; used to persist dismissal / frequency state   |
| `priority`     | `number`                                 | `0`       | Highest matching message wins                             |
| `dismissible`  | `boolean`                                | `true`    | `false` = required/blocking (no close affordance)         |
| `frequency`    | `"once" \| "session" \| "always" \| {…}` | `"once"`  | See [Frequency](#frequency)                               |
| `presentation` | `"modal" \| "banner" \| "toast"`         | `"modal"` | `toast` uses the app toast; no media/actions              |
| `media`        | `{ type, url, aspect?, alt? }`           | —         | `type`: `youtube \| image \| gif`; `aspect` e.g. `"16:9"` |
| `title`        | `string`                                 | —         | Required                                                  |
| `body`         | `string`                                 | —         | Optional                                                  |
| `actions`      | `Action[]`                               | `[]`      | See [Actions](#actions)                                   |
| `targeting`    | `Predicate`                              | —         | Omitted → matches everyone                                |
| `enabled`      | `boolean`                                | `true`    | Set `false` to disable without removing from the flag     |

### Actions

`{ "label": string, "style": "primary"|"secondary"|"positive"|"dismiss", "action": {…}, "closeOnComplete"?: boolean }`

| `action.type`  | Extra fields                        | Behavior                                                                  |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `internalLink` | `path: string`                      | `history.push(path)` — navigate within the app                            |
| `externalLink` | `url: string`                       | Capacitor `Browser.open` on native, new tab on web                        |
| `appStore`     | `iosUrl?`, `androidUrl?`, `webUrl?` | Opens the store page per platform; falls back to tenant `links` config    |
| `capgoUpdate`  | —                                   | Runs OTA check → download (with progress) → reload; button shows progress |
| `dismiss`      | —                                   | Closes the message                                                        |

`closeOnComplete` (default `true`) closes the message after the action runs. `capgoUpdate` never
auto-closes — it swaps into an inline progress state instead.

### Frequency

| Value                | Meaning                                                |
| -------------------- | ------------------------------------------------------ |
| `"once"`             | Show a single time, ever (persisted in `localStorage`) |
| `"session"`          | At most once per app session (in-memory)               |
| `"always"`           | Every eligible render (no suppression)                 |
| `{ "everyDays": n }` | Again only after `n` days since it was last shown      |

### Targeting predicates

Leaves:

```json
{ "platform": ["ios", "android", "web"] }
{ "role": ["learner", "teacher", "guardian", "admin", "counselor", "developer"] }
{ "version": { "source": "native" | "web" | "capgo", "op": "lt"|"lte"|"eq"|"gte"|"gt", "value": "1.2.3" } }
```

Combinators (nest arbitrarily):

```json
{ "all": [ … ] }   // every child must match (AND)
{ "any": [ … ] }   // at least one child matches (OR)
{ "not": { … } }   // negate a child
```

Version sources:

-   `native` — installed native binary version (`App.getInfo().version`)
-   `web` — web build's `package.json` version (`__APP_VERSION__`)
-   `capgo` — live Capgo/OTA bundle version (`CapacitorUpdater.current()`)

> **Fails closed:** if a `version` source is unavailable (e.g. `capgo` on web) or the string can't
> be parsed as semver, that predicate evaluates to `false` — the message simply won't show.

---

## Programmatic use (optional)

Everything is exported from `learn-card-base`:

```tsx
import { useInAppMessages, evaluatePredicate, compareSemver } from 'learn-card-base';

const { message, context, ready } = useInAppMessages(); // reads the `inAppMessages` flag
```

```ts
import { evaluatePredicate, type InAppMessageRuntimeContext } from 'learn-card-base';

const ctx: InAppMessageRuntimeContext = {
    platform: 'ios',
    role: 'learner',
    versions: { native: '1.0.5', capgo: '1.0.7' },
};

evaluatePredicate({ version: { source: 'capgo', op: 'lt', value: '1.0.8' } }, ctx); // true
```

The Zod schema and inferred types live in `@learncard/types` (`inAppMessages.ts`):
`parseInAppMessagesFlag`, `InAppMessagesFlag`, `InAppMessage`, `InAppMessagePredicate`, etc.

---

## When messages are allowed to appear (presentation gate)

To avoid interfering with login and other critical flows, the host will **not** present a message
until the app is in a stable, safe state. A message only shows when **all** of these hold:

-   **Auth is settled** — `isAuthSettled(useAuthStatus())` is true (never during the boot/resume
    window, which is what caused early flashes).
-   **The user is logged in** — `useIsLoggedIn()` (override with `requireAuth={false}`).
-   **Onboarding isn't open** — `useIsOnboardingOpen()` is false.
-   **Not on a critical route** — the current `location.pathname` isn't under a suppressed prefix
    (`/login`, `/claim`, `/consent-flow`, `/waitingsofa`, `/connect`, `/invite`, `/share`, `/legal`,
    `/hidden`, `/oid4vci`, `/oid4vp`, `/__/auth`, …).
-   **The state has settled for a moment** — the gate must stay open for `settleDelayMs` (default
    1200ms) to ride out transient route flicker during navigation.

A message's `frequency` impression is only consumed once it **actually** presents (post-gate), so a
boot-time flash can no longer burn a `"once"` message.

### Overriding the gate

`InAppMessageHost` accepts optional props (all default to the safe behavior above):

```tsx
<InAppMessageHost
    requireAuth={true} // set false to allow logged-out messages
    settleDelayMs={1200} // debounce before presenting
    suppressed={someAppSpecificBlockingState} // e.g. a full-screen flow is open
    suppressedRoutePrefixes={[...DEFAULT_SUPPRESSED_ROUTE_PREFIXES, '/my/custom/flow']}
    enabled={true} // master off switch
/>
```

`DEFAULT_SUPPRESSED_ROUTE_PREFIXES`, `isRouteSuppressed`, and `useInAppMessagePresentationGate` are
all exported from `learn-card-base` if you need to reuse or inspect the gate. When debug mode is on,
gate transitions log as `[in-app-messages] gate { canPresent, reason }` (reasons: `auth-resolving`,
`not-logged-in`, `suppressed-route`, `onboarding-open`, `app-suppressed`, `settling`, `disabled`,
`ok`).

## Debugging ("why did / didn't this message show?")

Turn on debug mode to trace the full decision pipeline — the resolved runtime context, every
message's targeting result (with the exact predicate that passed/failed), suppression state, and
the winner.

**From the browser/native devtools console** (a `window.__inAppMessages` dev-global is installed
whenever the feature is mounted):

```js
__inAppMessages.enable(); // turn tracing ON (persists in localStorage) — reload to trace boot
__inAppMessages.report(); // structured snapshot of the last evaluation (see shape below)
__inAppMessages.reset(); // clear "once"/"everyDays" dismissals so messages can re-show
__inAppMessages.disable(); // turn tracing OFF
__inAppMessages.isEnabled();

// Preview / force a message on demand (bypasses gate, targeting, AND frequency):
__inAppMessages.list(); // ["pathways-launch-2026", ...] ids from the current flag
__inAppMessages.forceShow('pathways-launch-2026'); // show that flag message right now
__inAppMessages.preview({
    // render an ad-hoc message not in the flag
    title: 'Test',
    body: 'Hello',
    presentation: 'modal',
    actions: [{ label: 'OK', style: 'primary', action: { type: 'dismiss' } }],
});
__inAppMessages.clearForce(); // stop forcing / close the preview
```

> `forceShow` / `preview` are **dev-only inspection tools**: they ignore the presentation gate,
> targeting, and frequency, and they **never** mark a message as seen (so they won't burn a `"once"`
> impression). Closing a forced/preview message just clears the override — it doesn't record a
> dismissal. This is the fastest way to eyeball any message's design without editing the flag.

You can also enable it **without the console**:

-   URL query param: append `?iamDebug=1`
-   localStorage: set `lcb-in-app-messages-debug` to `"1"`

When enabled, every evaluation logs a `[in-app-messages] evaluated` entry (via the central
`logger` + `console.info`) plus `shown` / `closed` / `capgo:*` lifecycle events.

**Programmatic access** (exported from `learn-card-base`):

```tsx
import { useInAppMessages } from 'learn-card-base';

const { report } = useInAppMessages();
// report.diagnostics: per-message { id, priority, enabled, matched, suppressed, willShow, trace }
// report.winnerId, report.context, report.flagMessageCount
```

Report / diagnostic shape:

```ts
interface InAppMessagesReport {
    ready: boolean;
    context: { platform; role; versions: { native?; web?; capgo? } } | null;
    flagMessageCount: number;
    winnerId: string | null;
    diagnostics: Array<{
        id: string;
        priority: number;
        enabled: boolean;
        matched: boolean; // targeting passed
        suppressed: boolean; // frequency/dismissal suppressed it
        willShow: boolean; // matched && !suppressed
        trace: PredicateTrace | null; // recursive pass/fail tree with human labels
    }>;
}
```

A `trace` node reads like `platform in [ios, android] — actual "web"` → `result: false`, so you
can see exactly which clause vetoed a message. `getLastInAppMessagesReport()` and
`setInAppMessagesDebug(true|false)` are also exported for non-React use.

## File map

```
in-app-messages/
├── predicates.ts             — pure semver compare + predicate-tree evaluator (unit-tested)
├── dismissalStore.ts         — per-id frequency/dismissal persistence (localStorage + session)
├── storeLinks.ts             — native-aware App Store / Play Store link resolution + open
├── useRuntimeContext.ts      — gathers { platform, native/web/capgo versions, role }
├── useCapgoUpdate.ts         — OTA check → download (progress) → set/reload
├── useInAppMessageActions.ts — runs an action target (router / browser / store / capgo)
├── useInAppMessages.ts       — reads flag, evaluates targeting + frequency, picks winner; builds report
├── routeSuppression.ts       — pure critical-route denylist + isRouteSuppressed (unit-tested)
├── usePresentationGate.ts    — gate: auth-settled + logged-in + route + onboarding + settle delay
├── debug.ts                  — debug toggle (global/localStorage/?iamDebug) + gated logger
├── debugGlobals.ts           — installs window.__inAppMessages dev-global
├── MessageMedia.tsx          — YouTube / image / GIF renderer
├── InAppMessageModal.tsx     — Overlay-based modal (Apple-glass); inline Capgo progress
├── InAppMessageBanner.tsx    — non-blocking top banner
├── InAppMessageHost.tsx      — mounts once per app; picks presentation, manages show/close
└── __tests__/predicates.test.ts
```

## Testing

```bash
cd packages/learn-card-base
bunx vitest run src/in-app-messages/__tests__/predicates.test.ts
```
