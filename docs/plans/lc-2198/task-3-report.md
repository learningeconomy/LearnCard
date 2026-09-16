# Task 3 Report — LC-2198: SDK unified send and legacy sendBoost

**Status: COMPLETE** (not BLOCKED)

- **Branch:** `codex/lc-2198-refresh-send-task-3` (worktree `~/.claude/dispatch/worktrees/2026-09-16-lc-2198-refresh-send-task-3`)
- **Baseline verified:** `git merge-base --is-ancestor 6cc28b6f9 HEAD` → OK; Task 1 commits `d6ef98765`/`d2f627a31` and Task 2 commit `18ea54ecb` are ancestors (dependency merge was already applied by Dispatch when this worktree was created).
- **Report commit:** see git log (`docs/plans/` is gitignored; only this file was force-added).

## Files changed

| File | Change |
| --- | --- |
| `packages/plugins/learn-card-network/src/types.ts` | `sendBoost` is now a `const`-generic method: `<const Options extends boolean \| SendBoostNetworkOptions \| undefined>(profileId, boostUri, options?: Options) => Promise<SendBoostResultFor<Options>>`. New exported types `SendBoostNetworkOptions` (the former inline options object, including `enableRefresh`), `SendBoostRefreshResult` (`{ credentialUri, refresh }`), and `SendBoostResultFor<Options>` (literal `enableRefresh: true` → refresh result; omitted/false/legacy boolean/non-refresh objects → `string`; dynamic boolean → `string \| SendBoostRefreshResult`). JSDoc documents the opt-in return change. Added `ManagedCredentialRefreshReceipt` to the type imports. |
| `packages/plugins/learn-card-network/src/plugin.ts` | (1) Removed the private `MANAGED_REFRESH_SERVICE_CONTEXT` fragment and private `injectManagedRefreshService` copy; the plugin now delegates to the shared Task-1 helpers (`injectManagedRefreshService`, `getCredentialIssuerId` from `@learncard/helpers`) — merge/conflict semantics replace the old key-existence check + overwrite. (2) New `buildManagedRefreshReceipt` builds the metadata-only receipt from the **signed** v1 (issuerDid via `getCredentialIssuerId`, holderDid from credentialSubject ids, credentialId from `vc.id`, exact `credentialStatus` descriptor; empty status collections are omitted) plus the retained allocation. (3) `sendBoost` managed branch retains the allocation through signing and returns `{ credentialUri, refresh }`; the managed-send procedure call is unchanged (holder-only server-side encryption regardless of `encrypt`). (4) `send` has a dedicated managed branch before the ordinary local/remote-DID/federation shortcuts: email/phone throw before any work; with local signing it prepares the unsigned credential from BOTH template forms (`templateUri` via `getBoostTemplateForIssuance`; inline `template.credential` deep-cloned so caller input is never mutated and no `boostId` is embedded — the boost does not exist yet), renders `templateData` + evidence, sets dates/issuer/subject, ensures a stable credential ID, allocates once with the correct holder descriptor (profile → `{ profileId, did }`; DID → `{ did }`), injects the shared managed service + context, signs exactly once via `issueCredentialWithNetworkStatus`, and hands the signed credential to the server unified send (`client.boost.send.mutate({ ...input, signedCredential, refresh: true })`) which returns the canonical receipt and a real `activityId`. Unresolvable profiles delegate the ORIGINAL request to the server's authoritative guards (no local fallback). Without local signing capability, the unchanged request is delegated (server SA path). Caller-supplied `signedCredential` is forwarded untouched (proof never mutated, no re-sign, no second allocation). Absent/false refresh sends keep the existing branches byte-for-byte. |
| `packages/plugins/learn-card-network/src/test/index.test.ts` | Mock factories now spread `importOriginal` for `@learncard/types` and `@learncard/helpers` so the REAL shared validators and the shared inject helper execute under test (VC/UnsignedVC validator overrides preserved). The two `enableRefresh` tests assert the new `{ credentialUri, refresh }` return (receipt fields: refreshId, refreshService, generated credentialId, issuer/holder DIDs); new test asserts the receipt preserves the exact `credentialStatus` descriptor attached by network status allocation. Legacy-path matrix (encrypt/skipNotification/boolean options) unchanged and passing. |
| `packages/plugins/learn-card-network/src/test/refresh-send.test.ts` | **New:** 13 runtime tests for the unified-send managed branch (detailed below). |
| `packages/plugins/learn-card-network/src/test/refresh-send.test-d.ts` | **New:** 8 compiler-verified type tests on the actual composed `LearnCard<...>['invoke']` type (detailed below). |
| `packages/plugins/learn-card-network/tsconfig.json` | **Justified path drift** (lint-hook-driven, see Deviation 2): `lib` bumped `es2021` → `es2022` so the new catch can attach the caught error as `cause` (`preserve-caught-error` is enforced on new occurrences by the husky pre-commit hook). Additive type availability only; builds and tests re-verified. |
| `tests/e2e/tests/credential-refresh.spec.ts` | **Justified path drift** (outside the listed ownership; mandated by "update any real refresh-enabled consumers that assume a string"): the revocation test destructures `const { credentialUri: sentUri } = await issuer.invoke.sendBoost(USERS.b.profileId, boostUri, { enableRefresh: true })`. This was the only refresh-enabled consumer in the repo (`rg 'enableRefresh' packages apps tests examples docs`). |
| `.changeset/lc-2198-refreshable-sends.md` | **New:** documents the opt-in return change (network-plugin minor), the additive receipt/send validators (types minor), shared helpers (helpers minor), and SDK issueCredential context preparation (vc-plugin patch) — covering the changeset Task 1 intentionally deferred to this task. |

## Runtime tests (`src/test/refresh-send.test.ts`, 13 tests)

- Email/phone recipients throw before any allocation, signing, or delivery (R3 client side).
- `templateUri` + profile recipient, local signing: exactly one allocation **before** signing, allocated service + inline context present in the signed payload, subject/issuer set, handoff input carries `signedCredential` + `refresh: true` + original `templateUri`, the server's managed response (receipt + real `activityId`) is forwarded unchanged, and neither the managed-send shortcut nor legacy client-side JWE is used.
- Inline `template` + local signing: the template stays in the handoff (server creates exactly one boost from it; no second boost source), signed credential has no `boostId` (boost not yet created), one allocation only.
- DID recipient: allocation holder is `{ did }` (no profileId), subject id = recipient DID.
- No local signing capability: request delegated unchanged to the server SA path; no client allocation.
- Caller-supplied `signedCredential`: forwarded with a byte-identical proof (deep-equal snapshot); no re-sign, no allocation.
- Unresolvable profile recipient: original refresh request delegated to the server (authoritative rejection; no local non-refresh fallback).
- Server-side refresh rejection (feature disabled): surfaces as a failure with exactly one delivery attempt — no non-refresh retry, no managed-send shortcut.
- Absent/`false` refresh: existing local branch preserved (signed credential forwarded without `refreshService`, no allocation); remote did:web non-refresh federation branch preserved.

## Type tests (`src/test/refresh-send.test-d.ts`, 8 tests)

Composed via the real plugin machinery: `type NetworkLearnCard = LearnCard<[typeof basePlugin, LearnCardNetworkPlugin]>` — the same `GetPluginMethods` → `UnionToIntersection` over declared methods that `initLearnCard`/`addPlugin` use, so these assertions run against the actual `learnCard.invoke.sendBoost` / `learnCard.invoke.send` types (verified: a deliberately wrong assertion fails typechecking; the generic signature survives composition because `invoke` reads the plugins' raw declared methods).

- Omitted options → `Promise<string>`; `true`/`false` legacy booleans → `Promise<string>`; object without `enableRefresh` or with `enableRefresh: false` → `Promise<string>`.
- Literal `{ enableRefresh: true }` (with and without sibling options) → `Promise<SendBoostRefreshResult>`.
- Dynamic `boolean` → `Promise<string | SendBoostRefreshResult>`.
- `SendBoostRefreshResult['refresh']` is exactly `ManagedCredentialRefreshReceipt` with required publication inputs.
- `send({ ..., refresh: true })` resolves with `uri`/`credentialUri`/`activityId` and optional `refresh` receipt; `refresh` remains optional on the send input.

## Exact verification commands and results

```
bun install --frozen-lockfile                                                    # 4757 packages, lockfile untouched
bunx nx build network-brain-service                                              # success (17 tasks; provisions brain-service dist types for client typing)

bun --cwd packages/plugins/learn-card-network test -- src/test/index.test.ts src/test/refresh-send.test.ts
  → Test Files 2 passed (2) / Tests 37 passed | 6 skipped (43)   [6 skipped = pre-existing describe.skip block]

bun --cwd packages/plugins/learn-card-network test -- --typecheck src/test/refresh-send.test-d.ts
  → Tests 8 passed (8) / Type Errors: no errors    (existing Vitest 4 setup discovers *.test-d.ts with --typecheck; no extra config needed)

# negative control: deliberately wrong assertion in test-d → "Tests 1 failed | 7 passed, Type Errors 1 failed" (reverted)

bun --cwd packages/plugins/learn-card-network test                               # full package suite incl. verify-boost regression
  → Tests 57 passed | 6 skipped (63)
bun --cwd packages/learn-card-helpers test                                       # shared helpers used by the plugin
  → Tests 132 passed (132)
bun --cwd packages/plugins/vc test                                               # issueCredential context preparation boundary
  → Tests 89 passed (89)

bunx nx build network-plugin   → success (19 tasks)
bunx nx build init             → success (31 tasks; init composes LearnCardNetworkPlugin into NetworkLearnCard* types — strongest consumer typecheck)
bunx prettier --write <changed plugin/test files> → applied; all changed files prettier-clean
git diff --check               → clean

# lint (husky pre-commit enforces new-occurrence detection):
bunx eslint <changed plugin/test files>  → after the es2022 lib bump + { cause } fix: exactly the pristine baseline counts (97 problems / 34 errors on plugin.ts+types.ts); zero new occurrences

tests/e2e tsc -p tsconfig.json   → 191 errors BEFORE the change (git stash -u rerun), 191 AFTER — all pre-existing implicit-any/strictness issues not enforced by CI; my edit adds none
```

## Deviations / notes for reviewer and successors

1. **Path drift (authorized by the task):** `tests/e2e/tests/credential-refresh.spec.ts` was the one real refresh-enabled consumer assuming a string return; updated minimally to destructure `{ credentialUri }`. No app/`learn-card-base` caller passes `enableRefresh`, so every other existing call site still receives `string` (verified by `rg` over `packages apps tests examples docs`).
2. **`packages/plugins/learn-card-network/tsconfig.json` lib bump `es2021` → `es2022` (justified path drift):** the husky pre-commit hook enforces eslint with new-occurrence detection, which rejected the new `templateData` catch's `throw new Error(...)` (`preserve-caught-error`). The idiomatic fix (`{ cause: error }`) requires the ES2022 standard library (`ErrorOptions`), so the package `lib` was bumped one step (additive type availability only; no emitted declaration changed — `nx build network-plugin` and `nx build init` re-verified, and eslint across the changed files returns to the exact pristine baseline: 97 problems / 34 errors, zero new occurrences).
3. **Inline template + local signing does not embed `boostId`:** the boost is created server-side from the same inline template AFTER the handoff, so the URI is unknowable at signing time. The stored credential remains linked INSTANCE_OF the created boost via `boostUri` forwarding (server-side graph link), matching the caller-supplied `signedCredential` handoff semantics. Caller input objects are never mutated (deep clone before prep).
4. **`getBoostTemplateForIssuance` failure ordering:** with local signing, template resolution/rendering failures throw BEFORE allocation (no orphan allocation node); allocation failures throw BEFORE signing (no service-less credential can exist).
5. **Receipt construction is client-side for `sendBoost`** (the dedicated `/credential-refresh/send` route still returns a plain string per Task 2), populated from the signed VC + retained allocation exactly per plan decision 2. The unified `send` returns the server-built receipt validated by `SendBoostResponseValidator`.
6. **Type-test composition uses a minimal base plugin + the real `LearnCardNetworkPlugin`** rather than importing `@learncard/init` (which would create an undeclared reverse dependency from the plugin package). This exercises the identical `invoke` derivation path; the generic survives because `LearnCard['invoke']` reads plugins' declared `_methods` directly (verified empirically before implementation, including through the `AddImplicitLearnCardArgument` `Parameters`/`ReturnType` wrapper that `plugin.methods` exposes).
7. **Scoped `credentials:write` on refresh sends is enforced server-side** (Task 2, in-handler). The SDK adds no client-side scope check — API-token clients without the scope receive the server's `UNAUTHORIZED` as a terminal error (tested via the server-rejection surfacing test).

## Remaining risks

- Real-SA end-to-end SDK lifecycle (actual signing authority identity, real recipient claim, publish from a `sendBoost` receipt to version 2) is Task 4's explicit scope; the SDK-side handoff shape it consumes is pinned by the runtime tests here and the Task 2 integration suite (decision-6 handoff: validated, idempotent resume).
- The e2e `credential-refresh.spec.ts` consumer fix is type/runtime-correct but was not executed here (real network stack belongs to Task 4); it is exactly the call pattern Task 4 already exercises.
- If a future caller needs `sendBoost`'s receipt from an API-token client without `credentials:write`, allocation will fail server-side before signing — same authorization posture as the dedicated refresh routes (documented in the changeset).

## Checklist

- [x] Runtime + type tests for literal true, omitted/false, legacy boolean, dynamic boolean on the actual `learnCard.invoke.sendBoost`; generic typing survives the plugin type system (compiler-verified, negative control confirmed)
- [x] `{ credentialUri, refresh }` only for refresh-enabled `sendBoost`; allocation retained through signing; identity/status populated from the signed VC; private context fragment replaced by the shared preparation helper; template rendering/`overideFn`/status purposes/notifications preserved; managed encryption mandatory even with `encrypt: false`
- [x] `send({ refresh: true })` routed through a dedicated managed branch before local/DID/federation shortcuts; recipient category validated first; local signing resolves the template (both forms), allocates, prepares, signs once, and uses the validated server unified-send handoff (real activityId + canonical receipt; no ordinary `sendCredential`)
- [x] No-local-signing clients delegate unchanged (server SA path); caller-supplied `signedCredential` forwarded without proof mutation; no second template/boost for inline templates
- [x] Absent/false sends keep existing branches; local profile/DID, federation/email/phone regressions, receipt forwarding, feature-disabled errors, and no-fallback failures all tested
- [x] `rg 'enableRefresh'` audit done; the one string-assuming consumer updated; changeset documents the opt-in return change; LC-2195 untouched
- [x] Required test/typecheck/build commands green; `git diff --check` clean; report committed (this file); no master tracker or live Dispatch metadata touched
