# In-App Messages

A LaunchDarkly-driven system for **conditional, targeted user prompts** across LearnCard apps
(`learn-card-app` + `scouts`). The JSON flag `inAppMessagesV2` delivers a prioritized list of
messages; each message carries its own **targeting predicate tree** that is evaluated _on device_
so it can see things LaunchDarkly's own rules cannot — the Capacitor platform, the native binary
version, and the live Capgo/OTA bundle version.

- **Show a message** with title, body, and media (YouTube / image / GIF)
- **Call-to-action buttons** — open an in-app feature, an external link, the app store, or run a Capgo update
- **Dismissable or required** (blocking)
- **Native-aware app-store links** — iOS → App Store, Android → Google Play, web → configured URL
- **Capgo update with live progress** — check, download (with %), and reload onto the latest bundle
- **Targeting** by platform, semver version (native / web / capgo), and profile role
- **On-device credential targeting** without sending decrypted credential data to the server
- **Claim and app-open triggers** with blocking-message fatigue protection

---

## Quick start

The host is already mounted in both apps (`FullApp.tsx`), so **you don't write any React** — you
just author the flag value in LaunchDarkly. Create a client-readable JSON flag named **`inAppMessagesV2`** and paste
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
        },
        {
            "label": "Close",
            "style": "dismiss",
            "action": { "type": "dismiss" }
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

| Field          | Type                                                    | Default   | Notes                                                         |
| -------------- | ------------------------------------------------------- | --------- | ------------------------------------------------------------- |
| `id`           | `string`                                                | —         | Stable key; used to persist dismissal / frequency state       |
| `priority`     | `number`                                                | `0`       | Highest matching message wins                                 |
| `dismissible`  | `boolean`                                               | `true`    | `false` = required/blocking; iframe errors still offer Close  |
| `frequency`    | `"once" \| "session" \| "always" \| {…}`                | `"once"`  | See [Frequency](#frequency)                                   |
| `presentation` | `"modal" \| "banner" \| "toast" \| "story" \| "iframe"` | `"modal"` | Stories require `steps`; iframes require `iframe.url`         |
| `media`        | `{ type, url, aspect?, alt? }`                          | —         | `type`: `youtube \| image \| gif`; `aspect` e.g. `"16:9"`     |
| `emoji`        | `string`                                                | —         | Hero glyph shown when `media` is not set (modal/banner/toast) |
| `title`        | `string`                                                | —         | Required                                                      |
| `body`         | `string`                                                | —         | Optional                                                      |
| `actions`      | `Action[]`                                              | `[]`      | See [Actions](#actions)                                       |
| `targeting`    | `Predicate`                                             | —         | Omitted → matches everyone                                    |
| `enabled`      | `boolean`                                               | `true`    | Set `false` to disable without removing from the flag         |

### Actions

`{ "label": string, "style": "primary"|"secondary"|"positive"|"dismiss", "action": {…}, "closeOnComplete"?: boolean }`

| `action.type`  | Extra fields                        | Behavior                                                                           |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `internalLink` | `path: string`                      | `history.push(path)` — navigate within the app                                     |
| `externalLink` | `url: string`                       | Capacitor `Browser.open` on native, new tab on web                                 |
| `appStore`     | `iosUrl?`, `androidUrl?`, `webUrl?` | Opens the store page per platform; falls back to tenant `links` config             |
| `capgoUpdate`  | —                                   | Runs OTA check → download (with progress) → reload; button shows progress          |
| `dismiss`      | —                                   | Closes the message                                                                 |
| `openApp`      | `listingId`, optional `path`        | LearnCard App: open a listed embedded app, installing with consent first if needed |
| `openMessage`  | `messageId`                         | Request another enabled message from the current flag                              |

`closeOnComplete` (default `true`) closes the message after the action runs. `capgoUpdate` never
auto-closes — it swaps into an inline progress state instead. `appStore` can no-op when no URL is
available for the current platform. Legacy required modals remain valid, including force-update
campaigns with only `appStore` or `capgoUpdate`. Authors should provide a closing action when
appropriate: `dismiss`, `internalLink`, `externalLink`, or `openMessage`, with `closeOnComplete`
left enabled. Host-dependent `openApp` can no-op in an unsupported app.

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
{ "credential": { "issuers"?: ["did:…"], "nestedIssuers"?: ["did:…"], "vcTypes"?: ["ClrCredential"], "categories"?: ["Learning History"], "achievementTypes"?: ["Course"], "issuedWithinDays"?: 30, "minCount"?: 1 } }
```

Combinators (nest arbitrarily):

```json
{ "all": [ … ] }   // every child must match (AND)
{ "any": [ … ] }   // at least one child matches (OR)
{ "not": { … } }   // negate a child
```

Version sources:

- `native` — installed native binary version (`App.getInfo().version`)
- `web` — web build's `package.json` version (`__APP_VERSION__`)
- `capgo` — live Capgo/OTA bundle version (`CapacitorUpdater.current()`)

> **Fails closed:** if a `version` source is unavailable (e.g. `capgo` on web) or the string can't
> be parsed as semver, that predicate evaluates to `false` — the message simply won't show.

Credential fields are ANDed against one credential summary; values within a field are ORed. Fields
from different credentials are never combined. `minCount` defaults to 1; a match must specify at
least one field, and supplied lists must be nonempty. Unknown credential fields are rejected.
Missing facts do not match. Any credential rule below `not` vetoes the **entire message** while
facts are incomplete, including inside an otherwise-matching `any`. Positive rules may match
partial facts after the initial five-second loading deadline.

For example, target users who have a pilot CLR but no pilot course achievement:

```json
{
    "all": [
        { "credential": { "issuers": ["did:example:pilot-issuer"], "vcTypes": ["ClrCredential"] } },
        {
            "not": {
                "credential": {
                    "issuers": ["did:example:pilot-issuer"],
                    "achievementTypes": ["Course"]
                }
            }
        }
    ]
}
```

These are separate holder checks; each leaf still requires all of its fields on the same credential.
`nestedIssuers` checks credentials embedded in a CLR's `credentialSubject.verifiableCredential`.
Certified Boost wrappers are unwrapped before matching. Age uses `validFrom`, falling back to
`issuanceDate`; missing, invalid, and future dates do not satisfy `issuedWithinDays`.

### Triggers and blocking fatigue

Messages may add `trigger: { event, where?, windowMinutes? }`, where `event` is
`credential.claimed` or `app.opened`. Claim events are emitted only after the credential is stored;
`where` evaluates against that claimed credential's local summary. Events remain in memory for 30
minutes (at most 50 events) and are never persisted. The trigger window defaults to 10 minutes.
Facts are saved before emitting the claim event, but this bookkeeping runs in the background so
slow local storage does not delay completion of the claim.
Targeting and the trigger must both pass. `app.opened` is emitted when the presentation gate first
opens for the active account in this session. A claim made on a suppressed route remains eligible
after navigation only while its trigger window is still open.

The flag may add `settings: { maxBlockingPerSession, blockingCooldownHours }` (defaults: `1` and
`48`). Modal messages are subject to both limits. Banners and toasts are not. Required messages
(`dismissible: false`) and messages with `bypassFatigue: true` are exempt.
Limits are recorded only when a real message presents, never while waiting for the gate or during
a forced preview. The visible message stays mounted after consuming its own impression/cap.
Resetting seen state also resets fatigue. Session counts and persisted cooldowns are account-scoped.

### Credential-facts privacy and lifecycle

Only minimal summaries—URI, category, credential types, issuer identifiers, achievement types and
issued date—are stored in the dedicated `lcb-in-app-messages-facts` IndexedDB database. Full
decrypted credentials are never stored there. Summaries are isolated by active DID, cleared by the
normal logout IndexedDB cleanup, and never enter network requests, analytics, Sentry, or persisted
React Query state. Backfill reuses resolved-query cache entries first, decrypts at idle time in
batches of four, and caps ordinary work at 200 decrypts per app session.
The loader runs only while signed in and an enabled message uses credential targeting or
`trigger.where`. It reconciles against the personal index newest-first, removes missing URIs, and
shares work between host and debug panel. Resume/focus refreshes are throttled to five minutes.
Successful summaries survive cold starts; failed/unvisited reads leave `credentialsComplete=false`.
"Backfill now" explicitly overrides the session read budget and retries failed reads.

Messages are parsed independently: an invalid sibling is listed in `report.invalid` without
discarding valid messages. `parseInAppMessagesFlag` retains its compatibility signature;
`parseInAppMessagesFlagWithErrors` also returns the invalid IDs and parse errors.

---

## Programmatic use (optional)

Everything is exported from `learn-card-base`:

```tsx
import { useInAppMessages, evaluatePredicate, compareSemver } from 'learn-card-base';

const { message, context, ready } = useInAppMessages(); // reads `inAppMessagesV2`, legacy fallback only when absent
```

```ts
import { evaluatePredicate, type InAppMessageRuntimeContext } from 'learn-card-base';

const ctx: InAppMessageRuntimeContext = {
    platform: 'ios',
    role: 'learner',
    versions: { native: '1.0.5', capgo: '1.0.7' },
    now: Date.now(),
    credentials: null,
    credentialsComplete: false,
    recentEvents: [],
};

evaluatePredicate({ version: { source: 'capgo', op: 'lt', value: '1.0.8' } }, ctx); // true
```

The Zod schema and inferred types live in `@learncard/types` (`inAppMessages.ts`):
`parseInAppMessagesFlag`, `InAppMessagesFlag`, `InAppMessage`, `InAppMessagePredicate`, etc.

---

## When messages are allowed to appear (presentation gate)

To avoid interfering with login and other critical flows, the host will **not** present a message
until the app is in a stable, safe state. A message only shows when **all** of these hold:

- **Auth is settled** — `isAuthSettled(useAuthStatus())` is true (never during the boot/resume
  window, which is what caused early flashes).
- **The user is logged in** — `useIsLoggedIn()` (override with `requireAuth={false}`).
- **Onboarding isn't open** — `useIsOnboardingOpen()` is false.
- **Not on a critical route** — the current `location.pathname` isn't under a suppressed prefix
  (`/login`, `/claim`, `/consent-flow`, `/waitingsofa`, `/connect`, `/invite`, `/share`, `/legal`,
  `/hidden`, `/oid4vci`, `/oid4vp`, `/__/auth`, …).
- **The state has settled for a moment** — the gate must stay open for `settleDelayMs` (default
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

Use the local report/debug panel to inspect each targeting and trigger result, suppression state,
and winner. Tracing logs only non-credential evaluation metadata and presentation lifecycle events;
credential summaries and credential-derived predicate traces are never sent to the central logger.

**From the browser/native devtools console** (a `window.__inAppMessages` dev-global is installed
whenever the feature is mounted):

```js
__inAppMessages.enable(); // turn tracing ON (persists in localStorage) — reload to trace boot
__inAppMessages.report(); // structured snapshot of the last evaluation (see shape below)
__inAppMessages.reset(); // clear "once"/"everyDays" dismissals so messages can re-show
__inAppMessages.disable(); // turn tracing OFF
__inAppMessages.isEnabled();
__inAppMessages.facts(); // counts/completeness/budget only, not credential contents
await __inAppMessages.backfill(); // explicitly override the ordinary read budget
__inAppMessages.emit('app.opened'); // simulate an event for the active account
__inAppMessages.resetCap(); // reset blocking cap and cooldown

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

- URL query param: append `?iamDebug=1`
- localStorage: set `lcb-in-app-messages-debug` to `"1"`

When enabled, flag updates log a `[in-app-messages] flag:delivery` entry showing the requested and
selected flag keys, whether the legacy fallback was used, value shapes, raw message count, accepted
message IDs, and validation errors. Every evaluation also logs `[in-app-messages] evaluated` (via
the central `logger` + `console.info`) plus `shown` / `closed` / `capgo:*` lifecycle events. Flag
contents, message copy, URLs, and credential data are not logged.

**Programmatic access** (exported from `learn-card-base`):

```tsx
import { useInAppMessages } from 'learn-card-base';

const { report } = useInAppMessages();
// report.diagnostics: per-message { id, priority, enabled, matched, suppressed, willShow, trace }
// report.winnerId, report.context, report.flagMessageCount
// report.invalid: [{ id?, error }]
```

Report / diagnostic shape:

```ts
interface InAppMessagesReport {
    ready: boolean;
    context: {
        platform;
        role;
        versions;
        credentialsComplete;
        credentialCount;
        recentEventCount;
    } | null;
    flagMessageCount: number;
    winnerId: string | null;
    invalid: Array<{ id?: string; error: string }>;
    diagnostics: Array<{
        id: string;
        priority: number;
        enabled: boolean;
        matched: boolean; // targeting AND trigger passed
        suppressed: boolean; // frequency/dismissal suppressed it
        triggerSatisfied: boolean;
        fatigueSuppressed: boolean;
        presentationSupported: boolean;
        willShow: boolean; // presentationSupported && matched && !suppressed && !fatigueSuppressed
        trace: PredicateTrace | null; // recursive pass/fail tree with human labels
    }>;
}
```

A `trace` node reads like `platform in [ios, android] — actual "web"` → `result: false`, so you
can see exactly which clause vetoed a message. `getLastInAppMessagesReport()` and
`setInAppMessagesDebug(true|false)` are also exported for non-React use.

The LearnCard debug panel adds an issuer/type-filtered local facts inspector, copy-as-rule,
picked/hand-entered claim simulation, the last ten events, and invalid-message diagnostics.
Dry-run presets are **This device**, **None**, **Library CLR (`clr/minimal`)**, **Other-issuer
library CLR**, **Library fixture non-CLR**, and **Incomplete**, with an optional claim event and the
first failing rule shown. The CLR presets summarize the actual `clr/minimal` fixture from
`@learncard/credential-library`; the ready-made templates match its stable `ClrCredential` and
`Course` facts rather than its issuer because fixture issuance replaces the issuer with the signing
wallet's DID. The builder supports credential predicates, negation/nested JSON trees, triggers,
and fatigue bypass. Simulations do not add real credentials.
Scouts has the same console APIs without requiring the LearnCard debug panel. The panel is lazy
loaded only for dev/debug-enabled builds; normal production builds omit it.

## Stories, embedded pages, and translations (LC-2263)

`presentation` also accepts `story` and `iframe`. Modal/banner/toast rendering and legacy required
modal validation are unchanged. Targeting and triggers still
run before presentation; both new formats use the existing blocking fatigue rules. Deploy supporting
clients before enabling campaigns that use these values.
Presentation fields are exclusive: only stories may define `steps`, and only iframes may define
`iframe`. Mixed payloads are rejected per message while valid sibling campaigns remain available.

### Rollout compatibility

Older released clients validate the entire flag and only recognize `modal`, `banner`, and `toast`.
Receiving one `story` or `iframe` entry can make them reject **every campaign** in the flag.
The per-message isolation added in #1729 only protects clients that actually include that parser.
Adding passthrough fields is different from extending an enum; neither `enabled: false` nor on-device
version targeting protects older clients because validation runs before those checks.

Rich-capable clients now read a **separate key: `inAppMessagesV2`**. Older binaries continue reading
`inAppMessages`; shipping #1729 does not update those installed binaries. Keep every variation of the
legacy key limited to `modal`, `banner`, and `toast`, including its default/off values.

When V2 is absent, new clients fall back to the legacy key but reject rich entries there with a
diagnostic. When V2 is present it is authoritative (including settings): empty, off, or malformed
values never fall back or merge legacy campaigns. Copy any still-needed legacy campaigns into V2,
keeping their IDs stable so existing frequency state carries over. The JSON envelope `version`
field is not a delivery gate and does not need to change.

Configuration rollout: create the client-readable V2 JSON flag, copy the campaigns needed by new
clients, move story/iframe entries out of the legacy flag, and retain all unrelated legacy campaigns.
Use `{ "messages": [] }` as an explicit V2 off/default variation. This repository change does not
modify LaunchDarkly. The author confirmed existing test campaigns are dev/staging-only and inaccessible
to released builds; those test entries still need to be moved to V2 before testing this revision.

```json
{
    "id": "achievement-intro",
    "title": "Explore your achievements",
    "presentation": "story",
    "steps": [
        {
            "title": "Your achievements, together",
            "body": "Keep a record of what you have learned."
        },
        { "title": "Choose your next step" }
    ],
    "actions": [{ "label": "Done", "action": { "type": "dismiss" } }],
    "locales": {
        "es": {
            "title": "Explora tus logros",
            "actionLabels": ["Listo"],
            "steps": [{ "title": "Tus logros, juntos" }]
        }
    }
}
```

Stories require at least one screen. Each screen supports `title`, `body`, `media`, `emoji`, and
optional `actions` on the **final screen only**. Earlier action overrides (including empty arrays)
are rejected by the schema; the builder offers the action editor only on the final screen and warns
when reordering leaves an override on an earlier screen. Earlier screens show Next; the final screen
uses `step.actions ?? message.actions` (an explicitly empty array suppresses inherited actions).
There is no timer or wrapping. In LTR, tap the left third to go back, the right two thirds to continue,
swipe left to continue, or use Right/Left arrow keys for next/previous. RTL mirrors these controls:
right third goes back, left two thirds continue, swipe right continues, and ArrowLeft advances. Interactive
media and controls do not advance the story. Required stories should provide a completing final action.
Final-screen action state remains mounted across navigation and responsive modal replacement. The
same portal container moves between the mobile and desktop surfaces, preserving update progress and
operation ownership when a learner navigates back, rotates a device, or resizes split view.
An explicit final-screen `actions: []` still overrides message-level actions, but it is invalid when
the story is required. Required stories need a guaranteed closing action in their effective final
action list; optional stories may rely on the host close control.

`locales` supports `title`, `body`, `actionLabels`, `steps` (title/body/actionLabels), and `iframeUrl`. Each field
falls back independently: exact locale, language, original. Arrays are positional and never add
screens/actions; `null` entries can skip positions. Top-level `actionLabels` translates message-level
actions; `steps[i].actionLabels` translates that screen's override actions, independently. For example,
`"es": { "steps": [null, { "actionLabels": ["Listo"] }] }` translates the first action on screen 2.
Empty strings are intentional overrides. Localization
happens after winner selection and does not change targeting or consume another impression.

```json
{
    "id": "embedded-guide",
    "title": "Learn more",
    "presentation": "iframe",
    "iframe": {
        "url": "https://your-content.example/guide.html",
        "title": "Guide",
        "loadTimeoutMs": 10000,
        "allowedInternalPaths": ["/passport"]
    }
}
```

**Iframe campaigns are web-only.** Capacitor iOS/Android builds exclude them before selection,
including required campaigns, without consuming impressions or blocking supported siblings. Debug
overrides and direct iframe rendering cannot bypass this restriction. The local diagnostic report
sets `presentationSupported:false`. The HTML sandbox and our JavaScript action allowlist do not
isolate WebKit's native message handlers: remote subframes can call those handlers directly.
Native embedding must stay disabled until native main-frame/trusted-origin enforcement or an
unprivileged WebView is implemented and verified. This gate does not modify the native bridge itself.

Iframe URLs (including translated URLs) must be HTTPS, without embedded credentials. Same-origin
embeds are refused at runtime: a scripted same-origin page could access the parent app directly. The sandbox is
fixed to `allow-scripts allow-same-origin allow-forms allow-popups`. The app owns the close control,
loading skeleton, timeout/offline error, and retry. Dismissible frames accept a browser load event or
a valid `ready` message. Required frames (`dismissible:false`) require the validated `ready` handshake
to remove the skeleton and cancel the timeout; **load does not prove the remote page succeeded**. The remote server must allow
embedding through its CSP `frame-ancestors` / X-Frame-Options policy. These restrictions cannot be
bypassed by the app. Retry mounts a new frame; old listeners and completions are discarded.
`loadTimeoutMs` defaults to 10 seconds and accepts positive integer values through 30 seconds. Values
above that limit are rejected rather than silently clamped, isolating an outdated campaign instead
of changing its authored behavior. A required frame that never becomes ready reaches the error state
within that bound, where the app-owned Close action is always available.
For dismissible frames, a blocked/error-page load can still end the loading state and cancel the
timer, leaving a blank but closable surface. Cross-origin content cannot be inspected to detect this.
Use a required bridge-enabled frame with no `ready` handshake to verify blocked-page timeout/retry;
an actual missing load event or an offline event can also exercise failure handling on dismissible frames.

### Iframe protocol

Send to the known parent origin, never `*`:

```js
parent.postMessage({ type: 'LC_IN_APP_MESSAGE', event: 'ready' }, parentOrigin);
parent.postMessage({ type: 'LC_IN_APP_MESSAGE', event: 'close' }, parentOrigin);
parent.postMessage(
    {
        type: 'LC_IN_APP_MESSAGE',
        event: 'runAction',
        action: { type: 'internalLink', path: '/passport' },
    },
    parentOrigin
);
```

The app verifies the sender's window, the configured URL's exact origin, the envelope, and the action.
Only the navigation/dismiss actions listed in the bridge protocol are supported; `capgoUpdate` and `openApp`/`openMessage` targets are
rejected. Internal navigation is **denied by default**. A destination must exactly match an entry in
the campaign's `iframe.allowedInternalPaths`, including its query string and fragment. No prefix,
wildcard, decoding, or query-stripping match is performed. For example, approving `/passport` does
not approve `/passport?returnTo=/request` or `/passport#other`. Declare only destinations the campaign
actually needs; do not approve sensitive request/exchange/consent routes for untrusted content.
Paths must start with a single `/` and contain no whitespace/backslashes;
external/store overrides must use HTTPS. There is no identity, authentication, credential, or wallet
API. Do not place private account data in authored URLs. The bridge has no response channel.
Popups inherit the iframe sandbox: `allow-popups-to-escape-sandbox` is intentionally absent.
For external links that need an ordinary browser context (such as sign-in or store pages), send a
validated `runAction` with `externalLink` or `appStore` through the host instead of `window.open`.

For `dismissible:false`, neither `close` nor a `dismiss` action is honored. A successful navigation
action can complete the message; no-op/failed actions cannot. After an offline, timeout, frame-load,
or same-origin error, the app-owned **Close** button is available even for required frames, alongside
retry. Only the user can take this escape; a required frame's bridge close/dismiss requests stay
rejected. Retrying restores the required loading state. Use required campaigns sparingly.

The runnable [bridge example](examples/iframe.html) accepts a `parentOrigin` query parameter. Host it
on a separate HTTPS origin you control and pass the web app's exact origin; no hosting service is
created by this PR. Declare `"allowedInternalPaths": ["/passport"]` for its navigation button.
Native campaign embedding is disabled regardless of the configured origin.

#### Native isolation regression

Unit tests assert that native selection skips the iframe, previews open no modal/consume no
impression, and direct rendering never even creates an iframe element. These are mock-platform
tests, not a native reproduction. On an isolated iOS test build, serve the
[read-only probe](examples/native-bridge-probe.html) from a separate HTTPS origin and use it as a
campaign URL (both dismissible/required and flag/debug-preview paths). It attempts only `App.getState`
via the raw WebKit handler, without the JavaScript bridge allowlist. Confirm no request for the probe,
no campaign frame, no impression, and no native dispatch with callback ID
`lc-campaign-isolation-probe` in Xcode; confirm a lower-priority supported campaign still displays.
Do not disable the gate in a production build. This device check must be run separately; jsdom and
the Linux browser catalog cannot establish native isolation.

### Engagement and QA

The host optionally calls `onEvent` with `type` (`shown`, `action`, `dismissed`), `messageId`,
`presentation`, `source` (`flag`, `deepLink`, `override`), and optional zero-based `actionIndex`,
`stepIndex`, `actionSource` (`step` or `message`), and `actionType`. An `actionIndex` indexes
`steps[stepIndex].actions` when `actionSource` is `step`, otherwise `message.actions`.
`deepLink` identifies `/m/` and `openMessage` requests. Bridge actions have no authored action index or action source.
Action events are emitted after the runner succeeds, never for pending, rejected, or no-op actions.
Capgo reports after a successful update/check; failures are excluded, and an immediate webview reload
may prevent delivery of the completion event. Seen state is recorded before fatigue, then shown is emitted. Screen changes and retries
do not create new impressions. Navigation completion, automatic toast expiry, and lifecycle cleanup
are not dismissals. Tapping a toast without a navigation action is an explicit dismissal.
LearnCard forwards these to `in_app_message_shown`, `in_app_message_action`, and
`in_app_message_dismissed`, excluding previews. Payloads contain no credential data, URLs, or prose.

1. In Dev Debug → Messages → Preview, choose **Story walkthrough**; verify Next/Previous, arrows,
   final Done, mobile fullscreen, and desktop card layout.
   With a native story update pending, cross the 991px breakpoint in both directions: retain progress
   and the final screen, keep Update unavailable, and confirm exactly one download/application.
2. In Builder, add/reorder/remove screens; preview media and final actions. Enter valid and invalid
   locale JSON and confirm invalid drafts cannot preview. Check Spanish fallback and Arabic chrome.
3. On web, host the bridge example separately over HTTPS. Set its URL in **Embedded HTTPS page** and test
   ready, close, and navigation. Repeat with `dismissible:false` and confirm close/dismiss are ignored.
4. Test offline, timeout, retry, invalid messages, another source/origin, and stale frames. For blocked
   pages that still fire `load`, use `dismissible:false` and withhold `ready` to exercise the timeout.
   A dismissible third-party page can appear blank after a blocked load; verify the host close control.
   Check Safari separately; browser load alone is not proof of embedding success. On native,
   verify campaigns and previews are blocked using the isolation regression above.
5. Test Tab/Shift-Tab focus trapping, Escape, focus restoration, reduced motion, and `?insets=47,34`.
6. Use staging flag messages to verify one impression, fatigue, account isolation, and analytics.
   Preview overrides intentionally exercise none of those persisted effects.

Run `lc verify script packages/learn-card-base/src/in-app-messages/examples/verify-story.mjs`
against an owned Linux stack (from the root via the app's `lc` command). This script verifies the
real debug-preview story path, not flag delivery, analytics, or remote iframe hosting. Run the
`language` / `sdk` catalog journeys and the full catalog near PR readiness. macOS needs a Linux host
or the hosted verification workflow; ScoutPass and native webviews require separate checks.

## App destinations and direct message links (LC-2264)

Use these actions only in `inAppMessagesV2`; older clients do not recognize them.

```json
{
    "id": "course-next-step",
    "title": "Continue learning",
    "actions": [
        {
            "label": "Open course",
            "action": {
                "type": "openApp",
                "listingId": "your-listing-id",
                "path": "/courses/intro?lesson=2#start"
            }
        },
        {
            "label": "See the guide",
            "action": { "type": "openMessage", "messageId": "achievement-intro" }
        }
    ]
}
```

`openApp` is **LearnCard App only**. ScoutPass returns a no-op and keeps the message open.
Use an embedded-app listing ID, not an arbitrary URL. The app routes through
`/app/:listingId?launch=1&path=...`: installed apps launch once; other apps still require the normal
installation/consent flow before launching. The fullscreen `/apps/:appId` route replaces the listing,
so Back returns to the preceding page. Other listing launch types are not destinations for this action.
The shared `useAppLaunch` hook also accepts `handleLaunch({ path, replace })` for embedded destinations.

Paths start with one `/`. Schemes, protocol-relative URLs, backslashes, whitespace/control characters,
dot traversal and their encoded forms are rejected. `buildEmbedUrlWithPath` appends the page under
the listing's configured base path, keeps its origin and existing query parameters, applies the page's
query/fragment, and pins `lc_host_override` to the host app origin. Notification navigation uses the
same helper. Without a path, the configured page is retained.

Share `https://<tenant-host>/m/<encoded-message-id>` to open a message directly. Both apps protect
the route with sign-in and preserve the destination through login. The route requests the message
in memory and replaces itself with the tenant's branded home. Native listeners handle warm links
and the initial launch URL. The tracked iOS association files already allow `*`; Android's
`handle_all_urls` relations and HTTPS intent filters have no path restriction, so they include `/m/`.
Deployed association files, tenant domains/signing certificates, and actual OS handoff still need
device verification; repository configuration alone does not prove cold/warm native entry.

Message links accept an optional trailing slash. Login replaces its handoff entry, so Back after
dismissal cannot reopen the message. Encode IDs with `encodeURIComponent` for shareable links;
when passing that encoded pathname to history@4's `push`/`replace`, wrap it in `encodeURI` to
preserve escapes through the history library's decoding. The entry route decodes the original
URL component once, preserving literal percent signs, encoded-looking IDs, and slashes within IDs.

Requests take precedence over ordinary campaigns once the presentation gate opens. They bypass
targeting, triggers, previous impressions, session-close suppression and fatigue eligibility, but
still require an enabled, valid, platform-supported message. They use the same localization path,
mark seen and record applicable blocking fatigue before emitting `shown` with `source: "deepLink"`.
Debug previews retain their separate override behavior. Unknown, disabled or unsupported IDs clear
silently after five seconds; known IDs wait for the gate. Each request has a unique token, so an older
action completion cannot clear a new request, and the same ID can be explicitly requested again.
Account switching and logout clear pending requests. Requests never persist to disk.

QA: expand a flag message in Dev Debug → Messages and use **Copy /m/ link** or **Test deep link**.
The status panel shows the pending ID. Scouts exposes `__inAppMessages.openDeepLink(id)`.
Use **Open an app page** in the builder with a real embedded listing ID, then test installed and
uninstalled states, Back, invalid paths, locale switching, closed gates and unknown message IDs.
Test a message that fails normal targeting and has already been seen: direct entry must still show
it once per request. Keep iframe bridge `openApp`/`openMessage` rejection in place; remote content
cannot use these actions to bypass campaign targeting or access privileged app destinations.

Run `lc verify script packages/learn-card-base/src/in-app-messages/examples/verify-navigation.mjs --dir <owned-stack> --video`
from the repository root through the app's `lc` command. It seeds the existing local partner app,
uses the debug preview UI to open/install it, confirms the initial URL and Back history, corroborates
installation with the learner SDK, and checks unknown `/m/` routing. The hosted verification workflow
runs this before the full catalog. It cannot prove known flag-message delivery or analytics because
those services are disabled in the harness; use staging for those checks and devices for OS links.

## File map

```
in-app-messages/
├── predicates.ts             — pure semver compare + predicate-tree evaluator (unit-tested)
├── dismissalStore.ts         — per-id frequency/dismissal persistence (localStorage + session)
├── credentialFacts.ts        — pure credential summarization and matching
├── credentialFactsStore.ts   — DID-isolated IndexedDB storage with memory fallback
├── credentialFactsLoader.ts — shared, bounded idle backfill and index reconciliation
├── useCredentialFacts.ts     — auth/account gating and resume subscriptions
├── inAppMessageEvents.ts     — memory-only claim/app-open event buffer
├── fatigueStore.ts           — blocking session cap and cooldown
├── storeLinks.ts             — native-aware App Store / Play Store link resolution + open
├── useRuntimeContext.ts      — gathers { platform, native/web/capgo versions, role }
├── useCapgoUpdate.ts         — OTA check → download (progress) → set/reload
├── useInAppMessageActions.ts — runs an action target (router / browser / store / capgo)
├── MessageNavigationContext.ts — optional LearnCard App navigation supplied by the host
├── deepLinkRequestStore.ts   — memory-only tokenized direct message requests
├── InAppMessageDeepLinkRoute.tsx — requests a message and replaces the route with branded home
├── useInAppMessages.ts       — reads flag, evaluates targeting + frequency, picks winner; builds report
├── routeSuppression.ts       — pure critical-route denylist + isRouteSuppressed (unit-tested)
├── usePresentationGate.ts    — gate: auth-settled + logged-in + route + onboarding + settle delay
├── debug.ts                  — debug toggle (global/localStorage/?iamDebug) + gated logger
├── debugGlobals.ts           — installs window.__inAppMessages dev-global
├── MessageMedia.tsx          — YouTube / image / GIF renderer
├── MessageActions.tsx        — shared modal/story actions and Capgo progress
├── localizeMessage.ts        — pure field-level locale fallback
├── iframeBridge.ts           — secure bridge envelope and target validation
├── InAppMessageSurface.tsx   — token-owned shared modal surface and portal
├── InAppMessageStory.tsx     — bounded, accessible multi-screen presentation
├── InAppMessageIframe.tsx    — sandboxed page with retry and bridge lifecycle
├── InAppMessageModal.tsx     — existing glass modal, sharing MessageActions
├── InAppMessageBanner.tsx    — non-blocking top banner
├── InAppMessageHost.tsx      — mounts once per app; picks presentation, manages show/close
└── __tests__/predicates.test.ts
```

## Testing

```bash
cd packages/learn-card-base
bunx vitest run src/in-app-messages/__tests__/predicates.test.ts
```
