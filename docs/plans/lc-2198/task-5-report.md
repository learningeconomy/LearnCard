# Task 5 Report — LC-2198: Independent review and concrete handoff

**Verdict: PASS** — every R1–R6 requirement is covered by evidence produced on the reviewed commit (re-verified first-hand where feasible), and there are **no unresolved correctness or security findings**. One low-severity latent defect (FINDING-1) and two observations are documented below as recommended follow-ups; none affects any shipped flow or requirement evidence. Details per the mandated format.

- **Branch:** `codex/lc-2198-refresh-send-task-5` (worktree `~/.claude/dispatch/worktrees/2026-09-16-lc-2198-refresh-send-task-5`)
- **Commit reviewed:** `32618175e6fd38f54fc6921b8f4784fb7919bac8` ("LC-2198: task 4 report") — the tip of the full chain `d6ef98765`/`d2f627a31` (T1) → `18ea54ecb` (T2) → `189dc46a3`/`7e62b82c7` (T3) → `c0a7dd68d`/`32618175e` (T4). `git merge-base --is-ancestor 6cc28b6f9 HEAD` → OK; all four task branches are ancestors of HEAD (verified with `git merge-base --is-ancestor` per branch). Working tree clean; combined diff vs baseline: **41 files, +6101/−325**.
- **Method:** reviewed the full combined diff file-by-file as a fresh reviewer (did not rely on authors' summaries), read all four task reports, reproduced key test evidence first-hand on this commit, and traced the literal snippet flow. No production code was changed by this task.

## Requirements coverage (R1–R6) — evidence I verified

| ID | Requirement | Verified evidence |
| --- | --- | --- |
| R1 | `send({ refresh: true })` and `POST /api/send` managed refresh for profile/DID recipients | **First-hand:** `tests/e2e/tests/refresh-send.spec.ts` 13/13 on commit `32618175e` against a stack running this commit's code (templateUri, inline template, DID recipient, pre-signed handoff, HTTP `/api/send` with real primary SA, sendBoost opt-in; each lifecycle reaches version 2). Server integration matrix (`test/refresh-send.spec.ts`, 25 tests) reviewed test-by-test; placement of the managed branch before all SDK early returns verified in `plugin.ts` (`send` managed branch precedes local-signing/remote-DID/federation shortcuts). |
| R2 | Receipt returned alongside `uri`, `activityId`, `credentialUri` | Receipt built from the **signed** v1 in both paths: server (`sendRefreshableCredential` → `buildReceipt()`) and SDK (`buildManagedRefreshReceipt` from signed VC + retained allocation). `ManagedCredentialRefreshReceiptValidator` is `.strip()`-ed (openapi.spec proves `credentialSubject` riding on the input is stripped). `uri` = boost URI, `credentialUri` = issued credential URI, `activityId` = real `logCredentialSent` id (asserted in T2/T4 tests). Type tests assert the composed `learnCard.invoke` types (see Type suite below). |
| R3 | Email/phone recipients rejected before any side effect | Server pre-mutation guard rejects via `isInboxRecipient` (pattern-based, so already-registered contacts also reject — verified in `boost.helpers.ts`) **before** boost creation/allocation/activity/delivery; SDK throws the same error before any allocation or signing. Node-count assertions prove nothing is created (T2 tests at lines 634–670; e2e first-hand). |
| R4 | `sendBoost(..., { enableRefresh: true })` callers can publish from returned state | First-hand e2e: opt-in result `{ credentialUri, refresh }` → publication → holder refresh to v2. Compiler-verified return-type opt-in (`refresh-send.test-d.ts`, 8 tests, negative control documented by T3); legacy boolean/omitted callers still get `string` (e2e + plugin unit matrix). The one string-assuming consumer (`credential-refresh.spec.ts`) updated mechanically — assertion intent unchanged (3/3 pass first-hand). |
| R5 | SDK injects the managed inline JSON-LD context automatically | `issueCredential` boundary calls `prepareManagedRefreshContext` before proof determination; SA publication path applies the same helper; conflict/idempotency/partial-completion semantics covered by 46 helper tests (132/132 pass first-hand). Real-proof context matrix first-hand: VC 1.1, VC 2.0, OBv3 (**versioned `context-3.0.3.json`**, matching the coordinator's compatibility evidence), CLR 2.0 — issuance **and** update, exactly one managed fragment, valid proofs. |
| R6 | Guide leads with `send()`; obsolete warning removed; snippets execute | Old warning block (`sendBoost … can't publish`) confirmed removed from `docs/how-to-guides/issue-and-refresh-a-managed-credential.md` (present at line 140–142 in `6cc28b6f9`, absent at HEAD); new sendBoost section is accurate. **First-hand:** `docs-refresh.spec.ts` 1/1 — executes the rewritten snippets verbatim end-to-end (issue → claim → publish → refresh); `check-docs-snippets.mjs` clean; `check-docs-links.mjs` clean. |

## Mandated review areas — results

- **API compatibility on actual `invoke` types:** `sendBoost` is const-generic; `SendBoostResultFor` resolves literal `{ enableRefresh: true }` → refresh result, omitted/false/legacy boolean → `string`, dynamic boolean → union. Verified against the real composed plugin type (not hand-written mocks). **I ran the full `--typecheck` suite (all 4 `*.test-d.ts` files), not just the new one: 65 passed + 6 skipped, no type errors** — this strengthens T3's evidence, which covered only the new file.
- **Response schema stripping:** `/send` documented; receipt validator strips unknown keys (openapi.spec first-hand reviewed; test asserts `credentialSubject` is stripped).
- **Return URI meanings:** preserved everywhere (`uri`=boost, `credentialUri`=issued credential, `activityId`=real tracked activity); asserted in both server-integration and e2e suites.
- **Duplicate allocation/signing:** single allocation before signing in all three injection sites (`plugin.ts:1750`, `plugin.ts:2003`, `boosts.ts:1119`); e2e/integration tests assert node counts (1 Credential, 1 CREDENTIAL_SENT, 1 allocation).
- **Early SDK DID/federation returns:** managed branch is the first block in `send`; unresolvable profiles delegate the **original refresh request** to the server (no non-refresh fallback); remote-DID non-refresh federation branch untouched and covered.
- **Real signing-authority issuer identity:** e2e HTTP `/api/send` test asserts receipt `issuerDid` = issuer profile's network did:web with SA `#saName` verification-method fragment on the proof (first-hand pass; matches the known delegate-signing model).
- **Frozen status descriptors:** publication uses `appendCredentialStatus: false`; receipts round-trip the exact v1 descriptor; T2 test publishes v2 with the identical descriptor; VC 1.1 legitimately has none (allocation is VC2-only) and publication tolerates absence.
- **JSON-LD context collisions:** conflicting inline definitions throw with the offending term/IRI; equivalent string/`@id` forms are idempotent; only top-level inline definitions participate (nested scopes respected); standard `1EdTechCredentialRefresh` services never touched. Tests use the versioned OBv3 3.0.3 context per the coordinator's 2026-09-16 compatibility note — no VC1/plain-VC2 substitution and no weakening of protected-term checks anywhere.
- **Mutation of pre-signed credentials:** caller-supplied `signedCredential` is forwarded untouched (deep-equal proof test in T3); the server never injects refresh into an already-signed credential (decision 6: reject without allocation, BAD_REQUEST, no second allocation node).
- **Holder-only persistence:** JWE recipients = holder profile's controller did:key (never the brain DID); the did:web→did:key recipient change (T2 deviation 2) preserves the privacy property and removes a remote-resolution dependency at encryption time; issuer `read.get` → undefined, holder → plaintext (e2e first-hand). Publication encrypts to the same holder-profile identity.
- **Owned/local allocation validation:** `extractManagedRefreshHandoff` derives the refreshId **only** from the service URL, requires exact origin/path match with this deployment (`getStatusListBaseUrl(domain)/refresh/{id}`), rejects conflicting managed services; foreign allocations rejected UNAUTHORIZED before storage (T2 tests).
- **Feature flag and scopes on direct helper use:** helpers are brain-service-internal; both the unified-send route (in-handler `credentials:write` on top of the route-level `boosts:write`) and the pre-existing dedicated refresh routes enforce feature flag + constraints + scopes. Restricted-token tests exist at both server (integration, line 717) and e2e/HTTP layers (first-hand pass).
- **Boost ownership / draft / blocked recipients:** managed branch runs **after** the existing issue-permission and draft checks (placement verified in `boosts.ts`); blocked recipients and unauthorized issuers rejected pre-mutation with node-count proof.
- **Activity/integration/contract relationships:** `CREDENTIAL_SENT` carries `activityId`+`integrationId` (backfilled on resume, no duplicates); `INSTANCE_OF` boost link; `ISSUED_VIA_TRANSACTION` → transaction → terms linkage created idempotently on fresh bind/resume/losing-race; SEND(DELIVERED)→CLAIM(CLAIMED) correlation on the same activityId (T2 tests; e2e first-hand).
- **Retry/resume:** digest-validated `peekCredentialRefreshInitialBinding` (CONFLICT on mismatch before any write); exact-same HTTP handoff replay is idempotent (same `credentialUri` + `activityId`) — proven over real HTTP at e2e (first-hand).
- **Notification behavior:** self-send suppresses the initial CREDENTIAL_RECEIVED notification (matches unified-send convention); exactly one notification for holder sends; normal BOOST_RECEIVED preserved for non-refresh sends.
- **No plaintext claims in receipt/persistence/logs:** receipt is metadata-only and stripped; refresh activities deliberately omit `templateData` (only the SA prep path consumes it in-memory); no new `console.*`/`logger.*` calls added in `services/` (diff-verified); stored roots are JWEs.
- **Literal guide trace:** snippet (ordinary OBv3 3.0.3 template, no copied context, no holder state) → `send({ refresh: true })` → receipt persisted → `issueCredential` rebuild from own claims + receipt (auto-context) → `publishCredentialRefresh` issuer-signed → holder refreshes to v2. No issuer readback of holder-only data anywhere in the flow; `docs-refresh.spec.ts` executes exactly these files (first-hand pass).

## Findings

### FINDING-1 — Low (latent, not reachable in any current flow): duplicate managed service on array-form re-injection

- **File:** `packages/learn-card-helpers/src/credential-refresh.ts:348-349`
- **Description:** `injectManagedRefreshService` filters existing entries with `existingManaged.includes(entry)`, comparing **object identity** against Zod `parse()` results. Zod 4 returns copies (verified empirically: `parse(x) === x` → `false`), so an existing same-id managed service inside an **array-form** `refreshService` is never excluded from `nonManagedEntries`, and re-injecting the same service yields the managed service **twice** in the result (reproduced: input `[managed, standard]` → output 3 services, 2 managed). The single-object form is handled by an explicit idempotent branch and is unaffected.
- **Reproduction:** re-inject the same `refreshService` into a credential whose `refreshService` is an array containing that same managed service (probe test written and deleted during this review; one-line repro available on request).
- **Reachability / impact:** all three in-repo call sites inject into freshly prepared credentials with no pre-existing `refreshService`, and each credential is injected exactly once, so **no shipped SDK/server/docs flow can trigger this**. Even if triggered (e.g. a future caller re-preparing a hand-crafted credential), the downstream handoff extractor tolerates same-id duplicates (`distinctIds.size === 1`), so the result is a malformed-but-functional signed payload — no security or privacy impact, no broken invariant.
- **Proposed correction (follow-up):** filter by `id` instead of identity: `existingServices.filter(entry => !managedIds.has(getServiceId(entry)))` — a one-line change plus a regression test for the array-form re-injection case. Not blocking PASS.

### OBSERVATION-1 — Info: fresh-worktree typecheck requires built workspace dists

Running `vitest --typecheck` on the full package suite in a clean checkout initially failed with `Cannot find module '@learncard/core'/'@learncard/types'/'@learncard/network-brain-client'`. This is provisioning, not code: after `bunx nx build network-brain-service` (the exact step T3 documents), **all** typecheck files pass with no type errors. Reviewers/CI should build before typechecking.

### OBSERVATION-2 — Confirmed pre-existing: 10 local `unified-send.spec.ts` failures

First-hand reproduction on `32618175e`: 10 failed | 35 passed | 1 skipped. All 10 are in the email/inbox claim-flow area (`performClaimFlow` → undefined credential; email verification auto-delivery; webhook notification) and match T4's pristine-baseline A/B at `6cc28b6f9` failure-for-failure. The new LC-2198 non-refresh compatibility test in that file **passes** first-hand. Recommendation stands: re-run this suite in CI where the email/workflow infra works.

## First-hand verification on the reviewed commit (exact commands/results)

Environment: `bun install --frozen-lockfile` (4757 packages, exit 0, lockfile untouched); docker stack brought up from this worktree's `tests/e2e/compose.yaml` (same `e2e` compose project left idle by T4; brain/lca-api/cloud recreated with mounts pointing at this worktree; support services reused, none stopped). In-container code verified to be this commit's (`extractManagedRefreshHandoff`, `ManagedCredentialRefreshReceiptValidator`, `prepareManagedRefreshContext` all present in the mounted sources).

```
git merge-base --is-ancestor 6cc28b6f943e05b6319dc861a8900248a844aa62 HEAD   # OK
git merge-base --is-ancestor codex/lc-2198-refresh-send-task-{1..4} HEAD     # OK × 4
git diff --check 6cc28b6f9...HEAD                                            # clean
node scripts/check-docs-snippets.mjs        # Snippets OK: 35 embedded, all in sync.
node scripts/check-docs-links.mjs           # Docs integrity OK: 111 files, 153 redirects, 14 grandfathered issues.

bunx nx build network-brain-service         # success (17 tasks, cache)
bunx nx build init                          # success (31 tasks, cache)

bun --cwd packages/learn-card-helpers test  # 132 passed (132)
bun --cwd packages/plugins/vc test          # 89 passed (89)
bun --cwd packages/plugins/learn-card-network test                        # 57 passed | 6 skipped (63)
bun --cwd packages/plugins/learn-card-network test -- --typecheck         # 65 passed | 6 skipped (71), Type Errors: no errors  [ALL *.test-d.ts files]

cd tests/e2e && E2E_MANAGE_DOCKER=false bunx vitest run tests/refresh-send.spec.ts
  → Test Files 1 passed (1) / Tests 13 passed (13)
cd tests/e2e && E2E_MANAGE_DOCKER=false bunx vitest run tests/docs-refresh.spec.ts tests/credential-refresh.spec.ts
  → Test Files 2 passed (2) / Tests 4 passed (4)
cd tests/e2e && E2E_MANAGE_DOCKER=false bunx vitest run tests/unified-send.spec.ts
  → Tests 10 failed | 35 passed | 1 skipped (46)  [all 10 pre-existing; see OBSERVATION-2]
cd tests/e2e && E2E_MANAGE_DOCKER=false bunx vitest run tests/unified-send.spec.ts -t "refresh receipt when refresh is not requested"
  → Tests 1 passed (1)
```

Note on docker evidence: T2's brain-integration suite (102/102) and T4's e2e runs executed on commits whose brain-service/helpers/types sources are byte-identical to `32618175e` (T3/T4 changed no `services/**` files; T4's only service-adjacent change is the compose mount). The first-hand e2e re-runs above exercised the exact reviewed code end-to-end. A Docker-`unified-send` failure is not a PASS-blocker per the task instructions; here it is additionally explained and bounded (OBSERVATION-2).

## Predecessor reports — unresolved blockers check

All four reports reviewed. No unresolved blockers. Known deviations were each checked against the code and accepted: shared `resolveContractForSend` extraction is behavior-identical (diff-reviewed line by line); JWE recipient change preserves holder-only privacy; tsconfig `lib` es2022 bump is additive (builds + eslint baseline re-verified by T3); compose helper-src mount is required for the shared helpers under `--conditions=development`; changeset situation is correct (one changeset, four public packages, e2e package changeset-ignored; verified in `.changeset/`).

## Ready-to-use PR content

**Title:** `[LC-2198] Refreshable sends: send({ refresh: true }) and sendBoost receipts`

**Body:**

> ### What
> - Unified `send({ type: 'boost', …, refresh: true })` and `POST /api/send` now issue managed refreshable credentials for profile/DID recipients. The SDK allocates the managed refresh service, injects it (with its inline JSON-LD context) before signing, signs once, and hands the signed credential to the server's unified send — preserving normal boost, activity, integration, and contract relationships. Without local signing, the signing-authority path serves the request. Email/phone recipients always reject before anything is created.
> - Both paths return a metadata-only issuance receipt (`refreshId`, `refreshService`, `credentialId`, `issuerDid`, `holderDid`, `credentialStatus`) populated from the actual signed version 1, alongside the existing `uri` (boost), `credentialUri` (issued credential), and `activityId`. Issuers publish updates from their own claims plus this receipt; the exact v1 status descriptor is preserved (no new allocation). Receipts are `.strip()`-ed and never carry claims, subject bodies, plaintext VCs, or JWEs.
> - Legacy `sendBoost` with literal `{ enableRefresh: true }` now returns `{ credentialUri, refresh }` instead of a plain string (opt-in; omitted/false/boolean callers unchanged, dynamic booleans degrade to the union — compiler-verified on the composed `invoke` type). Storage remains holder-only (JWE to the holder's controller did:key; the network cannot read the credential back).
> - SDK `issueCredential` and signing-authority publication automatically inject the managed context fragment — idempotent for equivalent definitions, clear error on conflicts, unrelated/third-party services untouched, inputs never mutated.
> - Docs lead with the one-call `send()` flow; the obsolete `sendBoost` warning and manual context-copy guidance are removed; snippets execute end-to-end in CI.
>
> ### Compatibility
> - Additive for `send` (`refresh` input, `refresh` receipt output). `sendBoost` return-shape changes **only** with literal `{ enableRefresh: true }` (the one existing refresh-enabled consumer in the repo was updated). Refresh sends additionally require the `credentials:write` scope (enforced server-side in-handler on top of the route's `boosts:write`), matching the dedicated refresh routes. Changeset: network-plugin minor, types minor, helpers minor, vc-plugin patch.
>
> ### Validation
> - Server integration: required matrix 102/102; refresh-send 25/25; unit 192/192. Plugin: 57+6skip incl. 8 compiler type tests (negative control). e2e on the reviewed commit: refresh-send 13/13, docs-refresh 1/1 (snippets executed), credential-refresh 3/3, helpers 132/132, vc 89/89. `git diff --check`, snippet sync, and docs links clean. Full command/counts in `docs/plans/lc-2198/task-{1..5}-reports`.
> - Context proofs with real signing for VC 1.1, VC 2.0, OBv3 (versioned 3.0.3), CLR 2.0 — issuance and update.
>
> ### Limits / follow-ups
> - Low (latent): array-form `refreshService` re-injection via the exported `injectManagedRefreshService` can duplicate a same-id service (reference-equality vs Zod copies); unreachable in current flows — fix by filtering on `id` (FINDING-1 in task-5 report).
> - 10 `unified-send.spec.ts` failures are pre-existing local email/inbox-infra issues (proven identical on pristine `6cc28b6f9`); re-run in CI.
> - Follow-up candidates: did:web cache invalidation on SA registration; inline BoostCredential-typed refreshables lack `boostId` at signing so the holder primitive's boost-authenticity warning blocks their refresh (ordinary OBv3 templates refresh cleanly; options documented in task-4 report).
> - Branch: `codex/lc-2198-refresh-send-task-5` @ `32618175e` (chain T1 `d6ef98765` → T2 `18ea54ecb` → T3 `189dc46a3` → T4 `c0a7dd68d`).

## Checklist

- [x] Reviewed the combined diff as a fresh reviewer (file-by-file); all required tests confirmed run against this worktree's artifacts; predecessor reports contain no unresolved blockers
- [x] API compatibility, schema stripping, URI semantics, duplicate allocation/signing, early SDK returns, real SA identity, frozen status descriptors, context collisions, pre-signed immutability — all checked (details above)
- [x] Security/behavior areas: holder-only persistence, allocation ownership, feature flag/scopes, boost ownership, blocked recipients, pre-side-effect rejection, relationships, retry/resume, notifications, plaintext hygiene — all checked
- [x] Literal snippet → send → receipt → publication → holder-update traced; no issuer readback of holder-only data; REST and sendBoost evidence reviewed
- [x] Targeted re-runs performed (unit/type/static checks + e2e refresh-send/docs-refresh/credential-refresh/unified-send); exact commit, commands, and counts recorded
- [x] Verdict **PASS** recorded independently of process status; findings documented with file/line, severity, reproduction, impact, and proposed correction
- [x] PR title/body provided; only this report committed (docs/plans force-add of this file only); no push, PR, merge, deploy, or Jira change; master tracker and live Dispatch metadata untouched
