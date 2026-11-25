# In-App Messages — Agent Guide

Feature: a LaunchDarkly JSON flag (`inAppMessagesV2`, with legacy `inAppMessages` fallback) that drives conditional, targeted user prompts
in `learn-card-app` and `scouts`. Targeting is evaluated **on-device** (platform / semver /
role / credential facts / recent events), the flag value is just the payload. Read `README.md` in this folder for the authored-flag
reference; this file is for making **code** changes safely.

## Architecture (data flow)

```
LaunchDarkly `inAppMessagesV2` (JSON; legacy-only `inAppMessages` fallback when absent)
   → useFlags()                       (launchdarkly-react-client-sdk)
   → parseInAppMessagesFlagWithErrors() (@learncard/types — isolate invalid siblings)
   → useInAppMessages()               (targeting + triggers + frequency + fatigue, highest priority)
        ├─ useRuntimeContext()        (platform + native/web/capgo versions + role)
        ├─ useCredentialFacts()       (per-account shared loader → private IndexedDB summaries)
        ├─ useRecentInAppMessageEvents() (in-memory claim/app-open events)
        ├─ messageMatches()/evaluatePredicate()  (predicates.ts — PURE)
        └─ filterSuppressed()         (dismissalStore.ts)
   → InAppMessageHost                 (mounted in each app's FullApp.tsx)
        → modal | banner | toast | story | iframe
             ├─ useInAppMessageActions()  (internalLink/externalLink/appStore/dismiss)
             └─ useCapgoUpdate()          (capgoUpdate action: OTA download + progress)
```

Schema is the single source of truth: `packages/learn-card-types/src/inAppMessages.ts`
(Zod → inferred TS types). The runtime lives here in `learn-card-base` so both apps share it.

## Golden rules

- **Versioned delivery.** Credential targeting and all triggers belong in `inAppMessagesV2`.
  Keep `inAppMessages` parseable by released clients; payload version numbers do not isolate it.
- **Schema first.** Any new field/action/predicate starts in `@learncard/types/inAppMessages.ts`,
  then flows through `predicates.ts` (if it affects matching) and the UI. Keep `.passthrough()` /
  safe defaults for additive fields. New enum members are NOT safe on older clients; see rollout rules below.
- **Fail closed.** Missing/unparseable data in a predicate must return `false`, never throw. A
  malformed envelope must degrade to "show nothing"; invalid messages must not discard valid siblings.
- **`predicates.ts` stays pure** — no React, no Capacitor, no I/O. It is the unit-tested core.
  Every predicate/semver change requires a test in `__tests__/predicates.test.ts`.
- **Native plugins are dynamic-imported** (`@capacitor/app`, `@capgo/capacitor-updater`,
  `@capacitor/browser`) and guarded, so the web bundle and non-native paths never break. Do **not**
  add static imports of these, and do **not** add `@capacitor/app-launcher` (not installed).
- **UI follows `apps/*/AGENTS.md`**: only `grayscale-*/emerald-*/amber-*/red-*` tokens, `font-poppins`,
  `rounded-[20px]` pill buttons, `animate-fade-in-up`, Ionicons (no raw emoji). No `IonModal`/`IonInput`.
- **No `any` / `@ts-ignore` / `@ts-expect-error`.** Keep comments minimal (a repo hook flags them).
- **Credential privacy.** Never log summaries or credential-derived traces, or put them in
  analytics, Sentry, persisted React Query, or network payloads. Local debug inspection is allowed.
- **Incomplete negation vetoes the whole message.** Propagate the internal sentinel through
  every `all`/`any`/`not` branch; never let an unrelated matching OR branch bypass it.
- **One backfill per active DID.** Reuse `credentialFactsLoader.ts`, resolved-query cache entries,
  batches of four, and the 200-read session budget. Only explicit debug backfill bypasses the budget.
  Stop stale account work before publishing; logout clears both persisted and in-memory facts/events.
- **Claim ordering.** Successful claim helpers add the summary before emitting `credential.claimed`.
  Bookkeeping failure must not fail a claim. No event for a failed index write or unaccepted
  consent-flow credential. Defer claim recording during consent sync and exclude ownership-marker
  entries from backfill until acceptance succeeds.

## How to extend

### Rich presentations (LC-2263)

- Localize the selected message with `localizeMessage` at the host, never in targeting or persisted state.
- Stories and iframes use `InAppMessageSurface` / token-owned `useModal` cleanup; keep live content in
  its React portal. Shared surfaces own insets and accessibility. Never close an unrelated top modal.
  Reparent the stable portal container when responsive modal hosts change; never replace the portal
  target or unmount action owners during a pending update. Test with actual breakpoint replacements.
- `MessageActions` owns modal/story button and Capgo behavior. Report accepted actions separately from
  explicit dismissal; navigation completion, retries, and gate cleanup are not new impressions.
- Iframe bridge input is untrusted: validate window, origin, envelope, and safe target before running
  actions. No Capgo or identity APIs. Internal destinations must exactly match the campaign's
  `iframe.allowedInternalPaths` (default deny), including query/fragment. Required frames ignore
  bridge close/dismiss requests; their host-owned Close button becomes available on error or after 30 seconds, including after ready.
- Iframe campaigns are web-only: enforce `presentationSupport` in selection, host (including overrides),
  and renderer. Native subframes can bypass the JS allowlist through Capacitor handlers; the HTML
  sandbox is not native isolation. Do not enable native embedding without a verified native boundary.
- Presentation analytics use `InAppMessagePresentationEvent` (distinct from credential events).
  Keep payloads allowlisted and exclude overrides from app analytics.
- Story actions are final-screen-only; reject earlier overrides and keep the builder editor restricted.
  Localize overrides through `locales[locale].steps[index].actionLabels`; preserve positional fallbacks.
- Required stories need an effective action that the shared runner can actually close. Legacy
  required modals remain valid, including force-update campaigns.
  Respect `closeOnComplete`; do not count Capgo, environment-dependent store actions, or host-specific
  app navigation as guaranteed exits. Required story overrides are evaluated on the final screen.
- Mirror arrow, swipe, and tap navigation using the rendered direction, including language switches.
- Emit actions after successful completion, excluding no-ops/failures. Include `actionSource` alongside
  authored action indexes; bridge actions have no index/source. Capgo completion can be lost on reload.

### Message destinations (LC-2264)

- `deepLinkRequestStore` is memory-only. Preserve request tokens when clearing: completion of an
  older presentation must never clear a newer `openMessage` request. Clear on account change/logout.
- Direct requests precede ordinary selection but retain the presentation gate, localization,
  enabled/platform checks and seen → fatigue → shown ordering. Their event source is `deepLink`.
  Unknown IDs expire after five seconds; known requests wait for the gate without expiring.
- `InAppMessageDeepLinkRoute` belongs behind authentication in both apps. Preserve `/m/:id` through
  login, then replace the transient route with branded home. Native listeners handle cold and warm URLs.
- The shared runner only performs `openApp` when the host supplies `onOpenApp` (LearnCard App).
  Keep ScoutPass a no-op and reject both new actions at the untrusted iframe bridge boundary.
- Validate app paths at schema and runtime boundaries. `launchPad/buildEmbedUrlWithPath` is the
  pure URL-joining authority for initial pages and notification navigation. Preserve the embed
  origin, reject traversal/encoded escapes, and pin the host override. Installation still requires consent.
- Ship `openApp`/`openMessage` campaigns through V2 only; legacy fallback rejects these actions.

### Rollout rules for new presentations

Older clients parse the whole legacy flag and reject every campaign if any presentation enum is unknown.
`enabled: false` and on-device targeting cannot protect them: parsing comes first. New clients read
`inAppMessagesV2`; only when absent do they fall back to legacy `inAppMessages`, rejecting rich entries
there. An empty/off/invalid V2 value is authoritative. Never merge the two feeds. Keep all legacy-key
variations legacy-safe indefinitely while older binaries exist; merely shipping #1729 does not update
them. Copy still-needed legacy campaigns into V2 with the same IDs. The author confirmed existing
test campaigns use dev/staging only; moving them to V2 is a separate LaunchDarkly configuration step.

### Add a new action type (e.g. `share`)

1. **Schema** — `@learncard/types/inAppMessages.ts`: add a validator and include it in
   `inAppMessageActionTargetValidator`:
    ```ts
    export const shareActionValidator = z
        .object({ type: z.literal('share'), url: z.string() })
        .passthrough();
    // add shareActionValidator to the z.union([...]) in inAppMessageActionTargetValidator
    ```
2. **Runner** — `useInAppMessageActions.ts`: add a `case 'share':` returning `'closed' | 'noop'`.
3. **UI** — usually nothing; the modal/banner render buttons generically. Add a progress/inline
   state only if the action is long-running (like `capgoUpdate`).

### Add a new predicate leaf (e.g. `tenant`)

1. **Schema**: add `tenantPredicateValidator` and put it in the `inAppMessagePredicateValidator`
   union; extend the `InAppMessagePredicate` TS union to match.
2. **Context**: add the field to `InAppMessageRuntimeContext` (`predicates.ts`) and populate it in
   `useRuntimeContext.ts`.
3. **Evaluator**: add an `if ('tenant' in predicate)` branch in `evaluatePredicate`.
4. **Tests**: cover match / no-match / missing-context (fail-closed) in `predicates.test.ts`.

### Add a new presentation (e.g. `fullscreen`)

1. **Schema**: extend `inAppMessagePresentationValidator`.
2. **Host**: `InAppMessageHost.tsx` — add a branch selecting the new component.
3. Build the component next to `InAppMessageModal.tsx` following the UI rules above.

## Store links

`appStore` actions resolve via `storeLinks.ts` from tenant `links.appStoreUrl` /
`links.playStoreUrl` (see `tenantConfigSchema.ts`), with optional per-message
`iosUrl`/`androidUrl`/`webUrl` overrides. Native opens the `https` store URL through
`@capacitor/browser` (device redirects into the store app); web opens a new tab.

## Version sources (targeting `version.source`)

| source   | read from                                | present on                     |
| -------- | ---------------------------------------- | ------------------------------ |
| `native` | `@capacitor/app` `App.getInfo().version` | native only                    |
| `capgo`  | `@capgo/capacitor-updater` `.current()`  | native only (else fail-closed) |
| `web`    | `__APP_VERSION__` (Vite `define`)        | all platforms                  |

`__APP_VERSION__` is defined in both `apps/*/vite.config.ts` and declared module-locally in
`useRuntimeContext.ts` (do not add it to app `global.d.ts` — that causes duplicate-declaration
conflicts because the package is type-checked with its own ambient declaration).

## Presentation gate (don't interfere with login/critical flows)

`usePresentationGate.ts` decides whether the host may present _at all_, independent of targeting.
The host renders `null` and does **not** mark a message seen until the gate opens — so a boot-time
flash can never consume a `"once"` impression. Gate opens only when: auth settled
(`isAuthSettled(useAuthStatus())`), logged in (`useIsLoggedIn`, unless `requireAuth={false}`),
onboarding closed (`useIsOnboardingOpen`), not on a suppressed route
(`isRouteSuppressed(pathname, prefixes)`), no app-injected `suppressed`, and the state has been
stable for `settleDelayMs`.

Rules when touching this:

- Keep `routeSuppression.ts` **React-free and pure** (it's unit-tested and imported by the pure
  predicates test). Do not import React/stores/`react-router` into it — that pulls the heavy graph
  into the vitest node env and breaks collection. Put anything hook-based in `usePresentationGate.ts`.
- Prefix matching is `pathname === prefix || pathname.startsWith(prefix + '/')` — avoid bare
  `startsWith(prefix)` (over-matches `/connections` for `/connect`).
- New critical routes → add to `DEFAULT_SUPPRESSED_ROUTE_PREFIXES` (covers both apps) or pass
  `suppressedRoutePrefixes` from the app mount for app-specific paths.
- The host's gate props are optional. LearnCard wraps it with the consent-aware analytics adapter;
  both apps provide the shared i18n context for reactive presentation localization.

## Debugging

`debug.ts` gates all tracing behind `isInAppMessagesDebug()` (off by default; enabled via
`setInAppMessagesDebug(true)`, `localStorage['lcb-in-app-messages-debug']='1'`, or `?iamDebug=1`).
Use `iamDebug(event, data?)` to emit a log — it no-ops unless debug is on, then routes through the
central `logger` **and** `console.info`. `useInAppMessages` always builds an `InAppMessagesReport`
(per-message `matched`/`suppressed`/`willShow` + a recursive `PredicateTrace`) and stashes it in a
module-level `lastReport` (read via `getLastInAppMessagesReport()`); `debugGlobals.ts` exposes it on
`window.__inAppMessages`, installed from the host's mount effect.

When adding logging: call `iamDebug(...)` (never raw `console`), keep the report cheap (it runs
every evaluation), and add a `tracePredicate` branch for any new predicate leaf so the trace labels
stay complete. Keep credential traces in the local report only, never in `iamDebug`.

### Force/preview override (dev-only)

`debugOverrideStore.ts` holds an optional `overrideMessage`. When set (via
`__inAppMessages.forceShow(id)` / `.preview(obj)`), the host renders it **regardless of gate,
targeting, frequency, or `closedIds`, and does NOT call `markMessageSeen`** — closing it just clears
the override. `forceShow` looks the full message up in `getLastInAppMessages()` (the last parsed
flag, stashed by `useInAppMessages`); `preview` runs its arg through `parseInAppMessagesFlag` to
apply schema defaults. Keep this override strictly presentation-only — never let it write dismissal
state or affect the real evaluation path.

## Verify before you finish

```bash
# Pure core, persistence, loader, hook, and host tests
cd packages/learn-card-base && bunx vitest run src/in-app-messages src/hooks/useWallet.inbox.test.ts src/helpers/__tests__/indexedDBHelpers.test.ts
# Also run schema tests in packages/learn-card-types and builder/dry-run tests in learn-card-app.
```

- Run `lsp_diagnostics` on changed files in this folder and on `apps/*/src/FullApp.tsx`.
- If you touched the schema, sanity-check both apps still type-check (they consume it as source).

## Gotchas

- The host is mounted inside the router + `ModalsProvider` in `FullApp.tsx`, under the `LDProvider`
  at `index.tsx`. `useHistory()` / `useFlags()` therefore work; don't move the host above them.
- `frequency: "once"` persists in `localStorage` (`lcb-in-app-messages-seen`). During manual
  testing call `resetInAppMessageDismissals()` (exported) or clear that key to see a message again.
- JSX string literals with apostrophes must be wrapped (`{"You're …"}`) — ESLint
  `react/no-unescaped-entities`.
- LaunchDarkly here is **client-side only**; there is no server evaluation. All targeting is on-device.

```

```
