# Task 1 Report — LC-2198: Shared receipt and automatic managed context

**Status: COMPLETE** (not BLOCKED)

- **Branch:** `codex/lc-2198-refresh-send-task-1` (worktree `~/.claude/dispatch/worktrees/2026-09-16-lc-2198-refresh-send-task-1`)
- **Baseline verified:** `git merge-base --is-ancestor 6cc28b6f9 HEAD` → OK; based on `codex/lc-2198-planning` (`3976e6342`), which sits on `6cc28b6f9`.
- **Code commit:** `d6ef98765` — "LC-2198: shared refresh receipt contract and automatic managed context preparation (task 1/5)"
- **Report commit:** committed separately (docs/plans is gitignored; only this file force-added).

## Files changed (all within task ownership)

| File | Change |
| --- | --- |
| `packages/learn-card-types/src/credential-refresh.ts` | Added `ManagedCredentialRefreshReceiptValidator` + type (`.strip()` so claims/proofs cannot ride along): `refreshId`, `refreshService` (managed validator, authorization optional), `credentialId`, `issuerDid`, `holderDid`, optional `credentialStatus` reusing existing `CredentialStatusValidator` (object or array form). No new imports that could cycle (`./vc` only, already imported). |
| `packages/learn-card-types/src/lcn.ts` | `SendBoostInputValidator`: added optional `refresh: boolean` (describe: managed refresh, profile/DID only). `SendBoostResponseValidator`: added optional `refresh: ManagedCredentialRefreshReceiptValidator`. No existing response fields touched. |
| `packages/learn-card-helpers/src/credential-refresh.ts` | Added shared managed-context preparation: `MANAGED_REFRESH_SERVICE_CONTEXT` (canonical inline fragment), exported IRIs (`MANAGED_REFRESH_TYPE_IRI`, `MANAGED_REFRESH_AUTHORIZATION_IRI`, `MANAGED_REFRESH_DID_AUTH_IRI`), `getManagedRefreshServices`, `prepareManagedRefreshContext`, `injectManagedRefreshService`. |
| `packages/learn-card-helpers/src/index.ts` | No change needed — the file already has `export * from './credential-refresh'`. |
| `packages/plugins/vc/src/issueCredential.ts` | Calls `prepareManagedRefreshContext(credential)` before proof-type determination and signing; prepared payload (not the original) is passed to `initLearnCard.invoke.issueCredential`. Signing options, issuer selection, and cryptosuite logic untouched. No proof is modified after creation. |
| `packages/learn-card-helpers/test/credential-refresh.test.ts` | Extended: 18 new tests for context preparation/injection/service detection. |
| `packages/learn-card-helpers/test/refresh-send-contracts.test.ts` | **New:** 10 tests covering receipt parsing/strip semantics, `refresh` omitted/false/true, receipt retention through `SendBoostResponseValidator`, malformed rejections. |
| `packages/plugins/vc/src/issueCredential.test.ts` | Extended: 5 new tests — untouched passthrough, managed-context injection with options preserved, no duplicate fragment, conflicting mapping rejection, explicit proof type preserved. |

## Behavior implemented

1. **Receipt contract (R2 groundwork):** metadata-only receipt per plan decision 2. `credentialStatus` uses the existing VC status validator, so the exact descriptor can round-trip for publication. Unknown keys are stripped (receipts cannot carry subject bodies/proofs).
2. **Context preparation (R5 groundwork):** `prepareManagedRefreshContext` returns the credential **by reference** when no managed `LearnCardCredentialRefresh2026` service is present (zero behavior change for unmanaged signing). With one present it: normalizes string/array `@context` to an array, checks the effective (last-wins) top-level definition of each required term (`LearnCardCredentialRefresh2026`, `authorization`, nested `LearnCardDIDAuth`), appends **only the missing terms** as a new inline fragment, treats string/`@id` shorthand as equivalent (idempotent repeat calls append nothing), and throws a clear "Conflicting JSON-LD definition for term …" error when a term is bound to a different IRI. Never mutates the input; standard `1EdTechCredentialRefresh` services are never altered.
3. **`injectManagedRefreshService`** (for senders that allocate first, e.g. later tasks): validates the service, rejects a second/different managed service, makes the managed service primary while keeping existing standard services, and prepares the context. Object-form `refreshService` is preserved when re-injecting the same service (idempotent).
4. **SDK boundary:** managed refreshable credentials get the inline context automatically before signing; everything else is byte-identical to before.

## Exact verification commands and results

```
bun install --frozen-lockfile                                  # 4757 packages installed
bun --cwd packages/learn-card-helpers test -- test/credential-refresh.test.ts test/refresh-send-contracts.test.ts
  → Test Files 2 passed (2) / Tests 46 passed (46)
bun --cwd packages/plugins/vc test -- src/issueCredential.test.ts src/refreshCredential.test.ts
  → Test Files 2 passed (2) / Tests 83 passed (83)
bun --cwd packages/learn-card-helpers test                     # full helpers suite → 6 files, 132 passed
bun --cwd packages/plugins/vc test                             # full vc suite → 89 passed
bunx nx build types        → success
bunx nx build helpers      → success (3 tasks)
bunx nx build vc-plugin    → success (6 tasks)  [after fixing a test-only TS error: refreshService on local Credential fixture type]
bunx nx build network-plugin → success (19 tasks)  # extra: read-only downstream typecheck through the largest consumer of lcn.ts validators
git diff --check           → clean
prettier --check           → 4 files reformatted, re-tested green afterwards
```

## Deviations / notes for reviewer and successors

- **Test import path:** contracts tests import validators from `@learncard/types` (helpers does not re-export type validators; `../src` only carries helper functions). This matches the helper package's dependency layout.
- **`packages/plugins/learn-card-network/src/plugin.ts` still has its local `injectManagedRefreshService`** (context-presence checked by key-existence, overwrites `refreshService`). It is outside Task 1's file ownership; **Task 3 should replace it with the shared `injectManagedRefreshService`** (behavior delta: merge instead of overwrite; conflict detection instead of key check). Recorded here so the duplication is intentional and temporary.
- **No changeset added in Task 1** (not in the task file list). Task 3 owns the changeset for the `sendBoost` return-shape change; reviewer may want it to also cover the additive `refresh` input/output fields and the vc-plugin context preparation.
- **Fragment vs. original plugin constant:** content is identical to the plugin's `MANAGED_REFRESH_SERVICE_CONTEXT` for the all-missing case, so existing signed-payload shapes stay compatible.
- **Real DIDKit proof coverage** is explicitly deferred to Task 4 per the task instructions (mocked issue tests here are unit-level: payload shape, options preservation, conflict rejection).
- `bunx prettier --write` touched 4 of my files after the initial commit attempt ordering; the code commit contains the formatted versions (re-tested after formatting).

## Remaining risks

- Publish/injection integration (receipt population from signed v1, recipient-kind rejection before any write) lands in Tasks 2–3; until then nothing consumes `refresh: true` at runtime.
- Conflict errors surface at signing time by design; a friendlier pre-sign UX check can be layered later without contract changes.

## Checklist

- [x] Receipt validator/type added and exported; `refresh` on unified input/output validators; unrelated response fields unchanged
- [x] Shared immutable managed-context preparation helper (object/array refreshService, string/array contexts, VCDM 1.1/2.0/OBv3/CLR compatibility, partial/conflict handling, idempotency, no input mutation)
- [x] Preparation applied at SDK `issueCredential` boundary before proof determination/signing; options and issuer selection preserved; untouched credentials unchanged
- [x] Focused suites + all three required builds green; `git diff --check` clean
- [x] Report committed (this file), no master tracker or live Dispatch metadata touched
