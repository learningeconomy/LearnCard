# In-App Messages — Agent Guide

Feature: a LaunchDarkly JSON flag (`inAppMessages`) that drives conditional, targeted user prompts
in `learn-card-app` and `scouts`. Targeting is evaluated **on-device** (platform / semver /
role / credential facts / recent events), the flag value is just the payload. Read `README.md` in this folder for the authored-flag
reference; this file is for making **code** changes safely.

## Architecture (data flow)

```
LaunchDarkly `inAppMessages` (JSON)
   → useFlags()                       (launchdarkly-react-client-sdk)
   → parseInAppMessagesFlagWithErrors() (@learncard/types — isolate invalid siblings)
   → useInAppMessages()               (targeting + triggers + frequency + fatigue, highest priority)
        ├─ useRuntimeContext()        (platform + native/web/capgo versions + role)
        ├─ useCredentialFacts()       (per-account shared loader → private IndexedDB summaries)
        ├─ useRecentInAppMessageEvents() (in-memory claim/app-open events)
        ├─ messageMatches()/evaluatePredicate()  (predicates.ts — PURE)
        └─ filterSuppressed()         (dismissalStore.ts)
   → InAppMessageHost                 (mounted in each app's FullApp.tsx)
        → InAppMessageModal | InAppMessageBanner | toast
             ├─ useInAppMessageActions()  (internalLink/externalLink/appStore/dismiss)
             └─ useCapgoUpdate()          (capgoUpdate action: OTA download + progress)
```

Schema is the single source of truth: `packages/learn-card-types/src/inAppMessages.ts`
(Zod → inferred TS types). The runtime lives here in `learn-card-base` so both apps share it.

## Golden rules

- **Schema first.** Any new field/action/predicate starts in `@learncard/types/inAppMessages.ts`,
  then flows through `predicates.ts` (if it affects matching) and the UI. Keep `.passthrough()` /
  safe defaults so old clients never break on new flag fields.
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
  Bookkeeping failure must not fail a claim. No event for a failed index write.

## How to extend

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
- The host's gate props are optional; both apps currently mount `<InAppMessageHost />` bare.

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
