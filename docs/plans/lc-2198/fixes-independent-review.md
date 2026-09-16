# LC-2198 coordinator fixes — independent review

Date: 2026-09-16. Reviewer: independent Dispatch review task (Pi GLM 5.3 Flash).
Reviewed commit: **`487070bf547056da40bca469a10158470e4e87c8`** (`codex/lc-2198-review-fixes`, fast-forwarded onto `892d79411`; `git rev-parse HEAD` verified equal).
Diff under review: `git diff 892d79411..487070bf5` (production: `packages/learn-card-helpers/src/credential-refresh.ts`, `packages/learn-card-types/src/lcn.ts`, `packages/plugins/learn-card-network/src/plugin.ts`, `services/learn-card-network/brain-service/src/routes/boosts.ts`; tests + docs as listed in the coordinator report).
Coordinator claims in `docs/plans/lc-2198/review-fixes-report.md` were treated as claims and inspected against the code; nothing was accepted on report authority alone.

## Verdict: PASS

All six review focuses hold at this commit. Four findings below are non-blocking (one low pre-existing gap, one non-material ordering note, one documented non-atomicity window, one API-surface note). No verifier weakening, no post-signature mutation, exactly one boost per successful send.

## First-hand evidence (all run by this reviewer in the worktree at the reviewed commit)

- `bun install --frozen-lockfile`; `bunx nx build init` — 31 build tasks successful.
- `bun --cwd packages/learn-card-helpers test` — 133/133.
- `bun --cwd packages/plugins/learn-card-network test -- --typecheck` — 68 passed, 6 skipped, no type errors.
- `bun --cwd packages/plugins/vc test` — 89/89.
- `bun --cwd services/learn-card-network/brain-service typecheck` — build + entrypoint typechecks clean.
- `bun --cwd services/learn-card-network/brain-service test:integration -- test/refresh-send.spec.ts` — **36/36** first-hand, including the 11 new preparation cases: metadata/`claimPermissions`/skills preservation, single contract `RELATED_TO`, final `ISSUED_VIA_TRANSACTION`, zero-mutation rejections for email/phone/remote-`did:web`/`did:key`/unknown recipients, each missing scope, disabled feature, blocked recipient, draft template, and exactly one boost after signed delivery (`count === baseline + 1`).
- Real E2E, first-hand, `E2E_MANAGE_DOCKER=false`, no Docker services created/stopped/reconfigured: pre-verified the e2e checkout `/Users/donny/Work/LearnCard-lc-2198-review` is clean at exactly `487070bf5` and that compose mounts (`brain-service/src`, `learn-card-types/src`, `learn-card-helpers/src`) therefore serve the reviewed code; SDK artifacts built in this worktree via `nx build init`. `tests/refresh-send.spec.ts` **13/13**; `tests/docs-refresh.spec.ts` + `tests/credential-refresh.spec.ts` **4/4**.
- `node scripts/check-docs-links.mjs` — OK. `git diff --check` — clean.

## Focus-by-focus findings

### 1. Inline BoostCredential local signing anchors the real boostId; one boost per send — PASS

`plugin.ts` `send` (managed-refresh branch): for inline templates the SDK now calls `client.boost.prepareRefreshableSend.mutate({ recipient, template, contractUri })` **before** `boost.boostId = boostUri`, allocation, and the single `issueCredentialWithNetworkStatus` signing — so the real boost URI is inside the signed payload (unit test asserts issueCredential received `boostId === forwarded.templateUri`, exactly one signing, prepare strictly before sign). The final handoff is `{...input, template: undefined, templateUri: boostUri, signedCredential, refresh: true}`; the server resolves the prepared boost (`getBoostByUri`), `boostCreated` stays `false`, so no second boost and no duplicate `RELATED_TO` (contract linkage only fires when `boostCreated`; the duplicate-link risk from calling `resolveContractForSend` in both prepare and send is avoided by exactly this flag — verified in `boosts.ts` `resolveContractForSend` and by the brain test asserting exactly 1 `RELATED_TO` and `countNodes('Boost') === baseline + 1`). TemplateUri sends embed the same URI they forward. The templateUri-path semantics (`boost.boostId = templateUri`) are unchanged from `892d79411`.

### 2. Guard parity of preparation and final send — PASS

`validateRefreshSendRecipient` (new, `boosts.ts`) is a faithful extraction of the pre-mutation guard: refresh feature flag → `ensureCredentialRefreshConstraints` → `credentials:write` (route meta supplies `boosts:write` on both `prepareRefreshableSend` and `send`) → inbox-recipient rejection → local profile resolution (remote/unresolvable DIDs `NOT_FOUND`) → blocklist. `prepareRefreshableSend` adds the DRAFT rejection before `createInlineBoostForSend`; `createBoost` defaults status to `LIVE`, so an omitted status cannot strand a draft. The final send reruns the identical guard plus issue-permission, draft, handoff, proof, ownership, holder and blocklist checks in `sendRefreshableCredential`. Brain integration tests prove zero new Boost/Credential/Refresh/Activity/Inbox nodes for every rejection class, first-hand.

### 3. Pre-signed precedence and forwarding — PASS

`plugin.ts` now gates the local-signing branch on `!input.signedCredential`, so a caller-supplied signed credential is forwarded untouched (`client.boost.send.mutate(input)`) with no preparation, allocation, or re-signing — regardless of whether `templateUri` or an inline `template` accompanies it. Server side, `templateUri` resolves the existing boost (no creation) and the handoff service is re-derived and re-validated (`extractManagedRefreshHandoff`: this-deployment origin, derived refreshId, conflicting-service rejection); first delivery performs proof verification, issuer boost-ownership, and holder blocklist checks. Unit tests cover all three source forms (`{}`, `templateUri`, `template`); the e2e pre-signed test now includes `templateUri` and asserts the holder's stored credential deep-equals the caller's signed input (first-hand pass).

See Finding A for the one anchor-validation gap that remains (pre-existing, not introduced here).

### 4. Injector reinjection semantics — PASS

`injectManagedRefreshService` now classifies existing entries with `ManagedCredentialRefreshServiceValidator.safeParse` instead of comparing original entries to Zod's parsed clones by reference. Array re-injection yields exactly one managed entry; standard services survive — including a standard service sharing the managed id (the conflict check only inspects validator-passing entries); a different managed id throws; the input credential is never mutated (spread + copied array; test compares against a `structuredClone` snapshot); `prepareManagedRefreshContext` remains idempotent (fragment-empty early return). Object-form re-injection keeps object form. Covered by the new helpers test, first-hand.

### 5. Genuine lifecycle evidence — PASS

The inline e2e now uses `ordinaryTemplate`: VC 2.0 (`credentials/v2`) + OBv3 `context-3.0.3.json` + boosts `1.0.1` with `type` including `BoostCredential` — the exact shape that previously hit the missing-`boostId` warning → `INVALID_PROOF`. First-hand pass asserts: exactly one boost (`countBoosts` +1), held credential `boostId === result.uri`, `verifyCredential` warnings and errors both `[]`, issuer publishes v2 rebuilt from own template + receipt + `boostId: result.uri`, and holder `refreshCredential` succeeds. The brain integration comment claiming all VC2+OBv3 combos fail was corrected; the real-signing matrix still exercises the combination.

### 6. API scope, retry and partial-failure behavior — PASS with documented limits

- `prepareRefreshableSend` is a tRPC-only mutation (no `openapi` meta → no HTTP route; no SDK invoke wrapper), guarded by `boosts:write` + `credentials:write` and the full recipient guard set. It grants no capability beyond what `createBoost`-class routes already allow; see Finding D for the deploy-order coupling.
- Non-atomicity is real and correctly disclosed: after successful preparation, a signing/transport failure leaves an unsent boost (and, post-allocation, an unused refresh allocation). Exact-same-credential redelivery stays idempotent via `peekCredentialRefreshInitialBinding` + digest/boost-matched resume; a *whole-call* retry after a partial failure creates a second boost (first stays orphaned). Report does not claim atomicity — accepted as documented SDK orchestration behavior (Finding C).
- The 10 `unified-send.spec.ts` local email/inbox failures remain a pre-existing, baseline-established issue outside this diff; not rerun here (matches coordinator's stated limit; CI still owes that run).
- SA `did:web` cache invalidation on registration remains open, separately tracked; tests retain the explicit `noCache` resolver refresh.

## Findings (all non-blocking)

**A. [Low · pre-existing · unchanged by this commit] First-delivery pre-signed handoff never cross-checks `signedVc.boostId` against the resolved boost anchor.**
`credential-refresh.helpers.ts` `sendRefreshableCredential` validates proof, issuer boost-ownership and blocklist, and binds `refresh.boostId`/`INSTANCE_OF` to the boost resolved from `templateUri`; the VC's embedded `boostId` is only compared to the anchor on replay (`assertInitialCredentialMatches`) — a first delivery whose signed `boostId` names a different issuer-owned boost than the `templateUri` anchor is accepted. Impact is confined to the issuer self-inflicting an inconsistency between the signed claim and the graph anchor on their own credential (the issuer controls both inputs and the proof binds the VC to them); no cross-user escalation, and receipt/publication flows use the graph anchor consistently. SDK flows are safe by construction (same URI embedded and forwarded — this commit's fix). Suggested follow-up: in the refresh branch, reject `signedVc.boostId` present-and-different from the resolved boost id. File: `services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts` (`sendRefreshableCredential`, first-delivery path before the bind transaction). Not introduced by `487070bf5`; pre-dates it (task-2 code, untouched by this diff).

**B. [Non-material] Guard extraction reorders the signed-credential handoff check.**
Previously the `extractManagedRefreshHandoff` presence check ran before profile resolution/blocklist; now `validateRefreshSendRecipient` (resolution + blocklist) runs first. Same inputs still reject pre-mutation; only the error code/message for overlapping bad inputs differs (e.g. blocked recipient + handoff-less signed credential now surfaces the blocklist `NOT_FOUND` instead of the handoff `BAD_REQUEST`). No weakening: the extraction is otherwise line-faithful. File: `services/learn-card-network/brain-service/src/routes/boosts.ts` (`send`, refresh guard block).

**C. [Accepted, documented] Partial-failure window now also covers non-BoostCredential inline sends.**
Because preparation (boost creation) moved ahead of signing for all locally-signed inline sends, a signing/network failure after prepare leaves an orphan boost where `892d79411` left none. This is the coordinator's explicitly documented non-atomic orchestration ("can leave an unsent boost"); retry semantics unchanged. No action required for this fix pass; a follow-up sweep/GC for prepared-but-never-sent boosts is a reasonable future item, not a defect of this review's scope.

**D. [Note] Deploy-order coupling of the new procedure.**
The SDK inline path hard-requires `boost.prepareRefreshableSend` to exist on the brain service; an older service turns every inline managed refresh send into a rejection at preparation (before signing/allocation — fail-closed, confirmed by the SDK unit test "stops before allocation, signing or delivery"). Deploy the service before releasing the SDK, as the coordinator report states.

## Limits of this review

- Coordinator's pre-edit negative controls (regressions failing before the fix) were not re-reproduced; this review verified the fixed state directly.
- The 10 pre-existing `unified-send.spec.ts` failures were not rerun (out of scope; baseline established in tasks 4–5).
- `bunx nx build init` read 30/31 tasks from Nx cache; first-hand runs cover tests/typecheck/e2e, not a from-scratch cold build.
- E2E ran against the shared localhost:4000 stack serving the reviewed commit's mounted sources (verified: clean checkout at `487070bf5`); brain image layers outside the compose mounts were not byte-compared, but this diff's brain changes are entirely under the mounted `src/`.
