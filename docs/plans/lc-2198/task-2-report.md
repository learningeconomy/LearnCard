# Task 2 Report — LC-2198: Server unified send preserves managed invariants and normal send relationships

**Status: COMPLETE** (not BLOCKED; one pre-existing test failure documented below is unrelated to this task and reproduced on the pristine baseline)

- **Branch:** `codex/lc-2198-refresh-send-task-2` (worktree `~/.claude/dispatch/worktrees/2026-09-16-lc-2198-refresh-send-task-2`)
- **Baseline verified:** `git merge-base --is-ancestor 6cc28b6f9 HEAD` → OK; branch includes Task 1 commits `d6ef98765` (code) + `d2f627a31` (report) via the dependency merge.
- **Report commit:** see git log (code and report committed together in one task commit; `docs/plans/` is gitignored so only this file was force-added).

## Files changed

| File | Change |
| --- | --- |
| `services/learn-card-network/brain-service/src/routes/boosts.ts` | Unified `send` route (`POST /api/send`): (1) pre-mutation refresh guard — feature gate (`CREDENTIAL_REFRESH_ENABLED`), `ensureCredentialRefreshConstraints()`, in-handler `credentials:write` scope check via `userHasRequiredScopes` (route itself still requires `boosts:write`), email/phone rejection, remote/unresolvable-DID rejection via early profile resolution, blocked-recipient rejection, and signed-handoff shape validation — all before ANY write (no boost, allocation, activity, or delivery). (2) Managed branch after the standard issue-permission/draft checks: contract resolution via a newly extracted `resolveContractForSend` (shared with the normal path, behavior unchanged), server signing path (prepare from template → stable credential ID assignment → single `allocateCredentialRefresh` → `injectManagedRefreshService` (service + inline JSON-LD context) → `issueCredentialWithSigningAuthority` with default status allocation), preallocated handoff path (decision 6: `extractManagedRefreshHandoff` + resume detection via `peekCredentialRefreshInitialBinding`), single activity log, managed send, receipt in response. `logCredentialFailed` on failure; resume retries reuse the original activity instead of duplicating it. TemplateData is deliberately omitted from refresh activity metadata (no plaintext claims on refresh records). Normal (non-refresh) path byte-identical behavior; the `/boost/send/{profileId}` CMS route was NOT touched. |
| `services/.../src/helpers/credential-refresh.helpers.ts` | `sendRefreshableCredential`: new optional `activityId` / `integrationId` / `contractTerms` params; CREDENTIAL_SENT props on fresh bind; resume paths backfill missing activity/integration on the same relationship (no duplicate); contract linkage (`ISSUED_VIA_TRANSACTION` chain) created idempotently on fresh bind, resume, and losing-race paths; **return type changed** from `string` to `{ uri, receipt }` where `receipt` is the Task-1 `ManagedCredentialRefreshReceipt` built from the signed VC (issuerDid as signed, holderDid from the validated aggregate, exact `credentialStatus` descriptor) + allocation. New exports: `extractManagedRefreshHandoff` (decision 6 service validation: single managed service, endpoint origin/path = this deployment's `getStatusListBaseUrl(domain)/refresh/{id}`, refreshId derived from the URL only), `peekCredentialRefreshInitialBinding` (digest-validated resume detection; throws CONFLICT on mismatch before any write), plus internal `ensureCredentialIssuedViaContractRelationship`. JWE encryption recipients changed from `aggregate.holderDid` to the holder profile's controller did:key (`holderProfile.did`) in both initial send and publication — still holder-only (never the brain DID), but no longer requires remote did:web resolution at encryption time. `publishCredentialRefresh` signing-authority mode now applies the shared `prepareManagedRefreshContext` to the unsigned body before handing it to the SA (idempotent when the issuer already supplied the terms). |
| `services/.../src/routes/credential-refreshes.ts` | `sendRefreshableCredential` route adapted to the new `{ uri, receipt }` return (route output remains `z.string()`). |
| `services/.../src/routes/credential-refreshes.test.ts` | Unit tests updated for the new return shape (mocks return `{ uri, receipt }`; assertions unchanged in intent). |
| `services/.../test/refresh-send.spec.ts` | **New:** 25 integration tests (detailed below). |
| `services/.../test/openapi.spec.ts` | New test: `/send` is documented and the response schema retains the `refresh` receipt (parsed through `SendBoostResponseValidator`; also proves unknown keys are stripped by the receipt validator). |

## Test coverage (`test/refresh-send.spec.ts`, 25 tests)

- **Receipt production:** templateUri / inline template / did:key and did:web recipients; receipt fields (`refreshId`, managed `refreshService`, `credentialId`, `issuerDid` = signed identity, `holderDid`, `credentialStatus` from signed v1); `uri` remains the boost URI and `credentialUri` the managed credential URI; stored root is a holder-only JWE (plaintext substring absent, `JWEValidator` parses); head bound at version 1.
- **Relationship preservation:** CREDENTIAL_SENT carries `activityId` + `integrationId`; INSTANCE_OF boost link on the root; SEND (DELIVERED) → CLAIM (CLAIMED) activity correlation through the same `activityId` after holder acceptance; approved contract linkage (`ISSUED_VIA_TRANSACTION` → ConsentFlowTransaction → IS_FOR → ConsentFlowTerms) on the managed root using a real consented contract (`writers: [issuer]`, category write consent).
- **Preallocated handoff (decision 6):** binds a client-allocated + client-signed credential with receipt from the signed VC; rejects unsigned-service credentials with BAD_REQUEST and no second allocation/credential node; rejects foreign allocations with UNAUTHORIZED without storage; retry of the exact same signed credential is idempotent (same `credentialUri`, same `activityId`, 1 Credential node, 1 CREDENTIAL_SENT, 1 CREDENTIAL_RECEIVED notification, still version 1).
- **Absent/false behavior:** `refresh` omitted or `false` → no receipt, no CredentialRefresh node, BOOST_RECEIVED notification still fires (normal path untouched).
- **Early rejection (nothing created — asserted via node counts):** email, phone (BAD_REQUEST, message mentions refresh), remote did:web and unresolvable did:key (NOT_FOUND before federation/inbox), feature disabled (NOT_FOUND), missing `credentials:write` scope with `boosts:write` present (UNAUTHORIZED), blocked recipient (NOT_FOUND), non-admin issuer (UNAUTHORIZED), draft boost (FORBIDDEN).
- **Self-send & notifications:** self-send suppresses the initial CREDENTIAL_RECEIVED notification (matches unified-send convention); holder send produces exactly one.
- **Receipt-driven publication:** issuer-signed publish from the receipt reaches version 2 preserving the v1 status descriptor; signing-authority publish with a context-less unsigned body gets the managed fragment injected before the SA call (captured body asserted) and reaches version 2 without replacing the issuer/service/status.
- **Allocation integrity:** aggregate state (`awaiting_claim`, version 1, issuer/holder/credentialId binding) after a unified refresh send.

## Exact verification commands and results

```
bun install --frozen-lockfile                                                  # 4757 packages, lockfile untouched
cd services/learn-card-network/brain-service && bun run typecheck              # clean (build + entrypoints)
bunx nx build types helpers core crypto-plugin didkit-plugin didkey-plugin encryption-plugin \
      vc-plugin vc-templates-plugin expiration-plugin learn-card-plugin did-web-plugin \
      dynamic-loader-plugin email-templates network-brain-service               # all success (dep chain for typecheck/build)

TESTCONTAINERS_REUSE_ENABLE=false bun --cwd services/learn-card-network/brain-service test:integration -- \
  test/refresh-send.spec.ts test/openapi.spec.ts test/credential-refresh-allocation.spec.ts \
  test/credential-refresh-publication.spec.ts test/credential-refresh-lifecycle.spec.ts
  → Test Files 5 passed (5) / Tests 102 passed (102)      [final run, post-formatting]

bun --cwd services/learn-card-network/brain-service test:integration -- test/refresh-send.spec.ts
  → Test Files 1 passed (1) / Tests 25 passed (25)

bun --cwd services/learn-card-network/brain-service test:integration -- \
  test/credential-refresh-endpoint.spec.ts test/credential-refresh-notifications.spec.ts \
  test/credential-refresh-model.spec.ts test/boosts.spec.ts test/consentflow.spec.ts
  → Tests 1 failed | 500 passed — the single failure is the pre-existing endpoint
    rate-limit flake (see Deviations); boosts.spec + consentflow.spec (which exercise the
    unified-send contract refactor and normal sends) fully passed.

bun --cwd services/learn-card-network/brain-service test -- \
  src/routes/credential-refreshes.test.ts src/helpers/credential-refresh-initial-binding.helpers.test.ts \
  src/helpers/signingAuthority.helpers.test.ts
  → Test Files 3 passed (3) / Tests 19 passed (19)

bun --cwd services/learn-card-network/brain-service test                        # full unit suite
  → Test Files 23 passed (23) / Tests 192 passed (192)

bunx nx build network-brain-service                                             # success (17 tasks incl. deps)
git diff --check                                                                # clean
bunx prettier --write <touched files>                                           # formatting applied, re-tested green after
```

## Deviations / notes for reviewer and successors

1. **Pre-existing integration flake (not introduced by this task):** `test/credential-refresh-endpoint.spec.ts > rate limits > applies a coarse pre-auth limit per source IP across refresh IDs` fails (429 on first request instead of 401). Verified on the PRISTINE baseline by `git stash -u` + rerun → same failure; it is rate-limiter state sensitivity within the shared in-process redis-mock, unrelated to LC-2198 send changes. Not fixed here (rate limiting is outside task file ownership); reviewer may want a dedicated cleanup task.
2. **JWE recipient change (behavior delta):** managed initial send + publication now encrypt to the holder profile's controller did:key instead of `aggregate.holderDid` when they differ. Reason: the native DIDKit `createDagJwe` must resolve each recipient DID; resolving a did:web holder identity performs a network fetch (impossible locally, an unwanted dependency in production). The holder profile controls that did:key, so the privacy property (holder-only decryption, brain excluded) is unchanged. SDK-issued aggregates (did:key holderDids) are unaffected — same recipient as before.
3. **Pre-existing VCDM 2.0 + OBv3 expansion incompatibility:** the brain's native DIDKit stack throws "Protected term redefinition" when a credential carries both `https://www.w3.org/ns/credentials/v2` and the OBv3 remote context, with or without managed refresh fragments (reproduced in isolation). Tests use shapes that work (VCDM2 + managed fragment, or VC1.1 + OBv3 + fragment). This is a DIDKit/SSI context-processing limitation outside Task 2's file ownership; Task 4's real-credential guide snippets should avoid the VCDM2+OBv3 combination until it is addressed upstream.
4. **Local test provisioning:** this worktree had no `node_modules` and uninitialized git submodules (`lib/didkit`, `lib/ssi`) plus no native DIDKit addon. Provisioned WITHOUT touching tracked files: `bun install --frozen-lockfile`, `git submodule update --init lib/didkit lib/ssi`, and a cargo release build of `packages/plugins/didkit-plugin-node/native` copied to the gitignored `packages/plugins/didkit-plugin-node/index.darwin-arm64.node`. `git status` shows only task files. One test-side lesson: seed strings whose 32 decoded bytes exceed the secp256k1 curve order (e.g. `'f'.repeat(64)`) abort key generation in both the WASM and native engines — tests use safe seeds.
5. **Issuer identity in server-signed sends:** `issueCredentialWithSigningAuthority` is unit-mocked in this suite to sign as the issuer's own key (a real SA is issuer-controlled). As planned, real-SA verification (actual authority identity end-to-end) is explicitly deferred to Task 4.
6. **Refresh activity metadata omits templateData:** the normal send persists `{ templateData }` on the send activity; the refresh branch deliberately omits it so plaintext template claims never attach to refresh-issuance records or notifications (plan privacy requirement).
7. **`sendBoost` (SDK) return-shape work remains in Task 3** as planned; this task only changed the brain-service helper return type (`sendRefreshableCredential` → `{ uri, receipt }`) whose public route output is still a string, so no client-visible API changed in Task 2.

## Remaining risks

- The receipt reflects the aggregate/signed-VC at bind time; concurrent publications racing the initial bind are prevented by the existing single-writer CAS, but a hostile concurrent publisher with the same credentials:write scope is out of threat scope (same trust level as the dedicated refresh routes).
- `peekCredentialRefreshInitialBinding` and the bind share digest checks; a rare race between peek and send on two simultaneous identical handoff requests falls back to the helper's idempotent resume (may log one extra activity in that exact race — same activity semantics as normal sends).
- The `credentials:write` scope check for refresh sends is enforced in-handler (route metadata only supports one scope); OpenAPI docs show `boosts:write` only.

## Checklist

- [x] Tests written before implementation (failing spec drove the work); REST/tRPC `refresh: true` covered for template/URI/signed inputs, profile/DID recipients, absent/false, and all early-rejection cases (email/phone/remote DID/feature disabled/missing scope/blocked/unauthorized/draft)
- [x] Refresh feature/constraint/scope and supported-recipient checks run before any mutation; root Zod/OpenAPI compatibility kept; response validation retains `refresh`
- [x] Template rendering/evidence/permission logic reused; server signing assigns/reuses stable credential ID, allocates once, injects service + context before signing, allocates status once, signs via registered primary authority; managed send helper performs holder-only storage
- [x] Preallocated handoff validated per decision 6 (endpoint origin/path, allocation ownership, holder, ID, boost anchor, proof, descriptor); no unsigned fallback, no second allocation, authority never derived from caller-supplied receipt fields
- [x] Managed binding/finalization preserves activityId, integrationId, contract linkage on the same root, including retry/resume; no second stored VC, duplicate notification, or duplicate activity; no plaintext claims/templateData persisted to refresh records
- [x] Typed receipt returned from the actual signed VC + validated allocation; status descriptors reflect version 1; `uri`/`credentialUri`/`activityId` semantics preserved; SEND → CLAIM correlation verified
- [x] Shared context helper applied to unsigned signing-authority publication (issuer/service/status unchanged, no new status entries); signed publication untouched
- [x] Failed sends surface as failures (FAILED activity + rethrow); bound-root idempotency retained; no silent fallback on resume
- [x] Integration + unit regressions run with correct runners; service built; `git diff --check` clean; report committed
