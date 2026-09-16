# LC-2198 — Refreshable sends: implementation and review plan

**Status:** Ready for plan review; implementation has not started.

**Goal:** An issuer can send a refreshable boost through `send()` or `sendBoost()`, retain the returned issuance receipt, and publish a valid update without reading holder-encrypted storage or copying JSON-LD definitions.

**Architecture:** Extend the existing managed allocation → sign → managed-send path. Share context preparation across SDK and server signing. Keep the managed service's validation, holder-only encryption, immutable version chain, and publication protocol. Unified send must preserve its normal boost, activity, integration, and contract relationships.

**Tech stack:** TypeScript, Zod 4, LearnCard plugins, tRPC/OpenAPI, Neo4j, signing authority, Vitest, Bun/Nx, Dispatch UI.

## Source and baseline

- [LC-2198](https://welibrary.atlassian.net/browse/LC-2198), read via the authenticated Jira CLI on 2026-09-16. Feature, Highest priority, assigned to Donny Cheng, status **Scoping**; no comments returned. Jira status remains the Product Owner's responsibility.
- [Original PR #1533](https://github.com/learningeconomy/LearnCard/pull/1533), merged as `80d2ebf54`: LC-2117 / LC-2135 / LC-2136 managed refresh.
- Reviewed current `origin/main`: `6cc28b6f943e05b6319dc861a8900248a844aa62`. Includes the original feature, subsequent deployment/CORS fixes, and newer unwrapped-credential issuance changes.
- Planning worktree: `/Users/donny/Work/LearnCard-lc-2198-planning`, branch `codex/lc-2198-planning`. Source checkout `/Users/donny/Work/LearnCard` has older local planning commits and unrelated untracked work; do not reset it or use its HEAD as an implementation base.
- LC-2195 (VC-JWT refresh) is separate work. Do not reimplement it here.

## Ticket requirements

| ID | Requirement | Evidence for completion |
| --- | --- | --- |
| R1 | `send({ type: 'boost', ..., refresh: true })` and `POST /api/send` support managed refresh for profile/DID recipients | SDK and real REST lifecycle tests reach version 2 |
| R2 | Unified send returns `refresh.refreshId` and `refresh.refreshService` alongside `uri`, `activityId`, and `credentialUri` | Runtime validators, OpenAPI schema, and SDK assertions retain the receipt |
| R3 | Email/phone recipients get a clear error when requesting refresh | SDK and server reject before creating a boost, allocation, inbox entry, activity, or delivery |
| R4 | `sendBoost(..., { enableRefresh: true })` callers can publish using returned state | Real sendBoost → publish → holder refresh test |
| R5 | SDK injects the managed inline JSON-LD context automatically | Real proof issuance from ordinary contexts, including explicit allocation/update flows |
| R6 | Guide leads with `send()` and removes the obsolete warning | `docs-refresh.spec.ts` executes the published snippets; snippet drift check passes |

## Code findings that shape the work

| Area | Current behavior / consequence |
| --- | --- |
| `packages/learn-card-types/src/lcn.ts` | `SendBoostInputValidator` has no refresh option; output validator has no receipt and would strip an undeclared field |
| `packages/plugins/learn-card-network/src/plugin.ts` | `sendBoost` already allocates and injects context, but returns only the managed URI. `send` has local-signing and DID/federation early returns that can bypass `boost.send` |
| `services/learn-card-network/brain-service/src/routes/boosts.ts` | `boost.send` serves `/api/send`; creates/resolves templates, selects inbox/federation/local delivery, signs through a primary signing authority, and records activity/contracts |
| `.../src/helpers/credential-refresh.helpers.ts` | Managed send has no activity/integration/contract arguments. It requires boost ownership, validates proof/issuer/holder/service, and stores holder-only JWE. Replacing it with ordinary `sendBoost` would break privacy |
| `.../src/routes/credential-refreshes.ts` | Refresh enablement and graph-constraint setup are middleware, not inside allocation/send helpers; calling helpers from `/send` must apply equivalent guards |
| `packages/plugins/vc/src/issueCredential.ts` | General SDK signing does not inject managed context; manual issuance and subsequent updates currently need copied context definitions |
| Publication invariants | ID, issuer, subject identity, refresh service, and original `credentialStatus` must match. Automatic status allocation means the ticket's two-field receipt alone is insufficient to rebuild some updates |
| Docs/tests | Runnable source lives in `docs/snippets/refresh/*.mjs`; Markdown is checked against it. Brain integration specs use `test:integration`, not its default unit-test command |

## Proposed API decisions

These are implementation choices for review, not extra requirements attributed to Jira.

1. Use top-level `refresh?: boolean` on unified send; retain `enableRefresh` on legacy `sendBoost`.
2. Define a reusable managed issuance receipt extending the allocation result:

   ```ts
   type ManagedCredentialRefreshReceipt = {
       refreshId: string;
       refreshService: ManagedCredentialRefreshService;
       credentialId: string;
       issuerDid: string;
       holderDid: string;
       credentialStatus?: VC['credentialStatus'];
   };
   ```

   Populate these from the actual signed version 1, not just the template or allocation. This is issuance metadata returned to the authenticated issuer; it must not contain credential claims, subject bodies, plaintext VC, or JWE. The issuer retains its own template/claims and this receipt. Preserve the exact status descriptor when publishing; do not allocate another one.
3. Unified send keeps its existing result and adds optional `refresh`. `uri` remains the **boost URI**, `credentialUri` remains the **issued credential URI**, and `activityId` remains a real tracked activity.
4. `sendBoost` with literal `enableRefresh: true` returns `{ credentialUri, refresh }`. Omitted/false/legacy boolean options still return a string. A dynamic boolean gets a correctly typed union. Verify the actual `learnCard.invoke` types, since plugin method transformations can erase overloads. Document the opt-in return change and use an appropriate changeset; audit existing refresh-enabled callers.
5. Automatic context handling runs before proof creation for managed services only, including SDK `issueCredential` and server signing-authority initial/publication paths. Do not modify an already signed credential, replace unrelated services, or change third-party refresh behavior. Preserve input objects and existing context order; equivalent definitions are idempotent, conflicting definitions produce a clear error.
6. For `refresh: true` plus `signedCredential`, accept only an already allocated, correctly embedded **local managed** service belonging to this issuer and holder. Derive/validate its refresh ID against the local managed endpoint and allocation; never fetch an arbitrary service URL. Reject a signed credential without a suitable allocation rather than injecting after signing. SDK local signing uses this same validated handoff, so the server does not allocate twice.
7. Supported recipients are profiles and DIDs resolvable to local profiles under existing managed allocation rules (including local profile DID/controller DID where supported). Email/phone always reject, even if the contact is already registered. Remote/unresolvable DIDs fail clearly; adding federated managed refresh is outside scope. Reject before SDK federation shortcuts or remote delivery.
8. Preserve existing managed boost ownership restrictions; do not widen authorization to make tests pass. Preserve ordinary send behavior when refresh is absent/false. Reuse the current refresh feature guard/constraints and scope checks; refresh sends require the applicable existing `boosts:write` and managed `credentials:write` permissions consistently across SDK and REST. Document this requirement and test restricted API tokens.

## Dispatch and tracking

Five tasks, deliberately sequential:

```text
1 Shared receipt and context preparation
  → 2 Server unified send and relationship preservation
    → 3 SDK call sites and sendBoost return compatibility
      → 4 Executable guide and real lifecycle tests
        → 5 Independent review and handoff
```

Tasks 2/3 depend on contracts and each other's runtime behavior; Task 4 verifies the combined result. A sequential chain also avoids simultaneous destructive resets of shared local test databases.

- Canonical task files: `docs/plans/dispatch/lc-2198/` in this worktree. Live copies: `/Users/donny/.claude/dispatch/plans/2026-09-16-lc-2198-refresh-send-task-N.md`.
- Live files are initially **`queued` (held)**. Inspection of this Dispatch version confirmed only `pending` tasks auto-run. The skill's `pending` review-first example would start work immediately here, so it is intentionally not used.
- Task 1 explicitly bases from `codex/lc-2198-planning`; each successor inherits its dependency branch. Branches are `codex/lc-2198-refresh-send-task-N`. Dispatch creates worktrees and merges dependencies; agents must not create nested worktrees.
- User-selected executor (2026-09-16): `pi`, `zai/glm-5.3-flash` (GLM 5.3 Flash). Planning budgets: 60m / 120m / 90m / 120m / 90m. These are ceilings, not estimates or reservations. They can be edited before release.
- After plan review, release the chain by changing these five live statuses from `queued` to `pending` using the Dispatch plan/status editor or its `PUT /api/tasks/{name}` endpoint. Dependencies control ordering. Do not use **Run now** on successors: this version bypasses dependency checks.
- Do not retry a completed task casually: Dispatch recreates that task's worktree/branch. Preserve its commits and report first; use a new follow-up task for fixes.
- Live status/logs: [Dispatch UI](http://localhost:8090). Review report and final commit are the handoff; no auto-merge, push, deployment, or Jira transition is part of this plan.

### Execution rules for every task

- Read repository `AGENTS.md`, relevant scoped instructions, and this plan. Use the dualmem launcher specified by the user for context/search/saving; do not use MEMORY.md.
- Confirm the current directory is the assigned Dispatch worktree, not `/Users/donny/Work/LearnCard` or the planning worktree. Abort if Dispatch fell back to the source checkout or dependency merge is unresolved.
- Confirm the baseline includes `6cc28b6f9` and predecessor changes before editing. Use `git merge-base --is-ancestor` and inspect dependency reports. Never reset, rebase, switch branches, or repair the source checkout.
- Use focused failing tests for behavioral changes, then implement and run them. Never report a test as passing when it found no tests, skipped the required case, used stale builds, or could not reach a service.
- Check dualmem co-change context before modifying code. Keep each task's edits within its file ownership; record justified path drift.
- Use `bun install --frozen-lockfile` in the isolated worktree, then build affected workspace dependencies with Nx. Do not change lockfiles just to provision.
- Integration runners reset databases. Use a dedicated test stack built from the assigned worktree; do not run against someone's active app, staging, or production. Fixed host ports mean a busy stack is a concrete blocker to report, not permission to stop unrelated containers. Never copy issuer seeds or private QA state.
- `docs/plans/` is gitignored in this repository. Force-add only the explicitly named task report when committing it; never force-add the entire directory or private QA artifacts.
- Commit only task changes. Write `docs/plans/lc-2198/task-N-report.md` with commit SHA, files, exact commands/results/counts, deviations, blockers, and remaining risks. Do not edit the master tracker or live Dispatch metadata; the orchestrator owns those.
- If requirements cannot be met, leave work reviewable and report **BLOCKED** explicitly. Dispatch `done`/exit 0 means the process finished, not that acceptance passed; the coordinator/reviewer must inspect the report before treating the task as complete.

## Acceptance ledger

All implementation evidence is pending. Update this centrally after inspecting worker reports.

| Task | State | Commit / evidence |
| --- | --- | --- |
| 1 Contracts + context | Held | — |
| 2 Server | Held | — |
| 3 SDK | Held | — |
| 4 Docs + E2E | Held | — |
| 5 Independent review | Held | — |

---

### Task 1: Shared receipt and automatic managed context

**Files:**

- Modify: `packages/learn-card-types/src/credential-refresh.ts`, `packages/learn-card-types/src/lcn.ts`
- Modify: `packages/learn-card-helpers/src/credential-refresh.ts`, `packages/learn-card-helpers/src/index.ts`
- Modify: `packages/plugins/vc/src/issueCredential.ts`
- Test: `packages/learn-card-helpers/test/credential-refresh.test.ts`, `packages/plugins/vc/src/issueCredential.test.ts`
- Create: `packages/learn-card-helpers/test/refresh-send-contracts.test.ts`
- Create: `docs/plans/lc-2198/task-1-report.md`

- [ ] Add and export the receipt validator/type; add `refresh` to unified input/output validators without changing unrelated response fields. Test omitted/false/true, receipt retention through parsing, and malformed receipts. Reuse existing credential status validators/types and avoid import cycles.
- [ ] Extract a shared immutable managed-context preparation helper, including support for object/array `refreshService`, string/array contexts, VCDM 1.1/2.0, OBv3, and CLR contexts. Add the full required mapping, including refresh-service terms absent from a base context; keep standard 1EdTech services unchanged. Test repeat calls and incomplete/conflicting existing mappings instead of merely checking whether a key exists.
- [ ] Apply preparation at the SDK `issueCredential` boundary before determining/signing the final payload. Preserve signing options and issuer selection; untouched credentials must retain existing behavior. Do not alter a proof after creation.
- [ ] Run focused suites and build shared types/helpers/VC plugin. Real DIDKit proof coverage is also required in Task 4; mocked issue tests alone are insufficient.

```bash
bun --cwd packages/learn-card-helpers test -- test/credential-refresh.test.ts test/refresh-send-contracts.test.ts
bun --cwd packages/plugins/vc test -- src/issueCredential.test.ts src/refreshCredential.test.ts
bunx nx build types
bunx nx build helpers
bunx nx build vc-plugin
git diff --check
```

**Done when:** Shared runtime contracts and automatic signing preparation pass; existing unmanaged signing remains unchanged; report and code committed.

### Task 2: Server unified send preserves managed invariants and normal send relationships

**Depends on:** Task 1.

**Files:**

- Modify: `services/learn-card-network/brain-service/src/routes/boosts.ts`
- Modify: `services/learn-card-network/brain-service/src/routes/credential-refreshes.ts`
- Modify: `services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts`
- Modify as needed: `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts`, `services/learn-card-network/brain-service/src/helpers/boost.helpers.ts`
- Create: `services/learn-card-network/brain-service/test/refresh-send.spec.ts`
- Test: `services/learn-card-network/brain-service/test/openapi.spec.ts`, `services/learn-card-network/brain-service/test/credential-refresh-allocation.spec.ts`, `services/learn-card-network/brain-service/test/credential-refresh-publication.spec.ts`, `services/learn-card-network/brain-service/test/credential-refresh-lifecycle.spec.ts`
- Create: `docs/plans/lc-2198/task-2-report.md`

- [ ] Add server tests before implementation: REST/tRPC `refresh: true`, inline template and template URI, local profile/public DID/controller DID, absent/false behavior, and early rejection for email/phone/remote DID, feature disabled, missing scope, blocked recipient, unauthorized/draft boost.
- [ ] Apply refresh feature/constraint/scope and supported-recipient checks before mutation. Keep root Zod object compatibility with OpenAPI. Test request and response schema generation; response validation must not remove `refresh`.
- [ ] Reuse existing template rendering/evidence and permission logic. For server signing, assign/reuse a stable credential ID after template preparation, allocate once, inject service/context before signing, allocate status once, and sign via the registered primary authority. Use the managed send helper for final holder-only storage. Verify the actual returned issuer identity matches the owner-controlled identity accepted by managed binding; test the real authority in Task 4, since test mocks rewrite issuer identity.
- [ ] Handle preallocated signed handoffs using decision 6. Check endpoint origin/path, allocation ownership, holder, ID, boost anchor, proof, and service descriptor. Reject missing/foreign/mismatched allocations without unsigned fallback or a second allocation. Never derive authority from caller-supplied receipt fields.
- [ ] Extend managed binding/finalization to preserve `activityId`, `integrationId`, and approved contract linkage on the same root credential, including retry/resume paths. Preserve self-send notification behavior and existing acceptance semantics; use normal acceptance helpers when acceptance occurs. Do not create a second stored VC, duplicate notification, or duplicate issuance/activity on resume. Do not persist plaintext claims/templateData to refresh records or notifications.
- [ ] Return the typed receipt from the actual signed VC and validated allocation; ensure status descriptors reflect version 1. Keep original `uri`/`credentialUri` meanings and a real `activityId`. Verify SEND → CLAIM activity correlation.
- [ ] Apply the shared context helper to unsigned signing-authority publication as well, without changing issuer/service/status or appending new status entries. Signed publication is verification-only and must remain unchanged.
- [ ] Verify failed sends do not appear successful. Retain existing bound-root idempotency; do not promise new HTTP-level send idempotency. If allocation/signing fails, do not fall back to ordinary storage or silently create a new managed root on resume.
- [ ] Run integration and unit regression checks with their correct runners, build the service, and commit report/code.

```bash
bun --cwd services/learn-card-network/brain-service test:integration -- test/refresh-send.spec.ts test/openapi.spec.ts test/credential-refresh-allocation.spec.ts test/credential-refresh-publication.spec.ts test/credential-refresh-lifecycle.spec.ts
bun --cwd services/learn-card-network/brain-service test -- src/routes/credential-refreshes.test.ts src/helpers/credential-refresh-initial-binding.helpers.test.ts src/helpers/signingAuthority.helpers.test.ts
bunx nx build network-brain-service
git diff --check
```

**Done when:** Server issuance and preallocated handoff produce usable receipts, keep normal send relationships, reject unsupported requests early, and retain managed privacy/authorization.

### Task 3: SDK unified send and legacy sendBoost

**Depends on:** Task 2 (and transitively Task 1).

**Files:**

- Modify: `packages/plugins/learn-card-network/src/plugin.ts`, `packages/plugins/learn-card-network/src/types.ts`
- Test: `packages/plugins/learn-card-network/src/test/index.test.ts`
- Create: `packages/plugins/learn-card-network/src/test/refresh-send.test.ts`
- Create: `packages/plugins/learn-card-network/src/test/refresh-send.test-d.ts`
- Create: `docs/plans/lc-2198/task-3-report.md`
- Inspect: existing `sendBoost` refresh-enabled callers and SDK method transformation types.

- [ ] Add runtime and type tests for literal true, omitted/false, legacy boolean, and dynamic boolean options on the actual `learnCard.invoke.sendBoost`. Ensure overload/generic typing survives the plugin type system and tests actually typecheck.
- [ ] Return `{ credentialUri, refresh }` only for refresh-enabled `sendBoost`; retain the allocation descriptor through signing and populate identity/status from the signed VC. Replace the private copied context fragment with the shared preparation helper. Preserve template rendering, `overideFn`, status purposes, and notification options. Managed encryption remains mandatory even if `encrypt: false`.
- [ ] Route `send({ refresh: true })` through a dedicated managed branch before ordinary local/DID/federation shortcuts. Validate recipient category first. For local signing, resolve/create the boost as needed for both template forms, allocate, prepare, sign once, then call the validated server unified-send handoff to get activity/contract behavior and the canonical receipt. Do not call ordinary `sendCredential` or return an empty activity ID.
- [ ] For clients without local signing capability, delegate the unchanged refresh request to the server authority path. For caller-supplied `signedCredential`, use the validated handoff and never mutate its proof. Ensure no second template/boost is created for inline templates after client-side preparation.
- [ ] Keep absent/false refresh sends on their existing branches. Test local profile/DID and ordinary federation/email/phone regressions, receipt forwarding, feature-disabled errors, and failures that must not fall back to a non-refresh send.
- [ ] Audit call sites found by `rg 'enableRefresh' packages apps tests examples docs`; update any real refresh-enabled consumers that assume a string. Do not migrate unrelated app issuance or expand into LC-2195.

```bash
bun --cwd packages/plugins/learn-card-network test -- src/test/index.test.ts src/test/refresh-send.test.ts
bun --cwd packages/plugins/learn-card-network test -- --typecheck src/test/refresh-send.test-d.ts
bunx nx build network-plugin
git diff --check
```

If the existing Vitest typecheck setup does not discover `.test-d.ts`, add a narrowly scoped test config/tsconfig and run it explicitly; record the command and test count. Do not substitute runtime `expectTypeOf` for compiler verification.

**Done when:** Both SDK entry points return publishable state; non-opt-in callers keep string compatibility and unchanged routing; real invocation types are verified.

### Task 4: Executable guide, end-to-end proof, and release notes

**Depends on:** Task 3.

**Files:**

- Modify: `docs/how-to-guides/issue-and-refresh-a-managed-credential.md`, `docs/how-to-guides/send-credentials.md`, `docs/core-concepts/credential-refresh.md`
- Modify: `docs/snippets/refresh/issue-refreshable.mjs`, `docs/snippets/refresh/publish-update.mjs`
- Inspect/update only if needed: `docs/snippets/refresh/refresh-held.mjs`
- Test: `tests/e2e/tests/docs-refresh.spec.ts`, `tests/e2e/tests/unified-send.spec.ts`, `tests/e2e/tests/credential-refresh.spec.ts`
- Create: `tests/e2e/tests/refresh-send.spec.ts`, `.changeset/lc-2198-refresh-send.md`
- Create: `docs/plans/lc-2198/task-4-report.md`

- [ ] Rewrite the lead issuance snippet around `send({ type: 'boost', ..., refresh: true })`, using an ordinary credential template with no hand-copied managed JSON-LD context. Persist the returned receipt plus the issuer's original claims/template locally; never recover data using holder credentials. Update publication to reuse exact identity/service/status metadata. Keep `@learncard/init`, `invoke.*`, and explicit `await` usage.
- [ ] Include a concise `sendBoost` example showing its opt-in result shape and publication. Document local recipient scope, permissions, feature flag, unsigned-vs-pre-signed behavior, and non-refresh compatibility. Remove the obsolete warning and context-copy troubleshooting instruction. Retain the lower-level allocate/send path as an advanced alternative and show automatic context handling there too.
- [ ] Keep snippet files and embedded Markdown synchronized (`--fix` rewrites Markdown from runnable files). Update Mermaid to lead with unified send and explain allocation/signing underneath.
- [ ] Add real lifecycle coverage for SDK `send` (template URI + inline), `sendBoost`, and authenticated **HTTP `POST /api/send`**, including a primary signing authority. Each uses only its receipt plus known source claims to publish version 2; holder claims and refreshes successfully. Assert stable IDs/issuer/service/status, valid proofs, boost membership, nonempty activity ID, activity correlation, and holder-only storage. Do not read decrypted issuer state out of a database to make the test pass.
- [ ] Exercise pre-signed/preallocated handoff, email/phone/remote rejection without writes, feature-disabled and restricted-scope behavior, contract linkage, self-send notification behavior, replay, and non-refresh compatibility at the most appropriate server/SDK/E2E layer. Preserve existing tests; avoid redundant full lifecycle cases for every combination.
- [ ] Prove automatic context behavior with real signing for representative VC 1.1, VC 2.0, OBv3, and CLR credentials, both initial issuance and update. Keep existing refresh/revocation/privacy regression coverage. Do not remove existing security assertions to accommodate the new routing.
- [ ] Add changesets for changed public packages, describing the opt-in result shape and unchanged non-refresh calls. Do not manually bump versions or regenerate all API clients. Check current release policy for the appropriate bump level.
- [ ] Run the focused suite on services built from this branch, build affected packages, and save test counts/commands. Existing E2E setup does not start Docker unless explicitly configured; readiness alone does not prove the service image contains these changes.

```bash
node scripts/check-docs-snippets.mjs --fix
node scripts/check-docs-snippets.mjs
node scripts/check-docs-links.mjs
bunx nx build network-plugin
# Provision a dedicated current-worktree test stack first; see execution rules.
bun --cwd tests/e2e test:run -- tests/docs-refresh.spec.ts tests/refresh-send.spec.ts tests/unified-send.spec.ts tests/credential-refresh.spec.ts
git diff --check
```

**Done when:** The ticket's published `send()` snippet and both convenience issuance paths demonstrably publish and refresh; REST is tested separately; docs and changesets are committed.

### Task 5: Independent review and concrete handoff

**Depends on:** Task 4.

**Files:**

- Inspect: all changes since `6cc28b6f943e05b6319dc861a8900248a844aa62`, all four task reports, and the ticket acceptance ledger.
- Create: `docs/plans/lc-2198/task-5-report.md` (review only; no production code changes).

- [ ] Review the combined diff as a fresh reviewer; do not rely on Dispatch's done badge or authors' summaries. Confirm all required tests ran against this worktree's artifacts and predecessor reports contain no unresolved blockers.
- [ ] Check API compatibility on actual `invoke` types; response schema stripping; return URI meanings; duplicate allocation/signing; early SDK DID/federation returns; real signing-authority issuer identity; frozen status descriptors; JSON-LD context collisions; and mutation of pre-signed credentials.
- [ ] Check holder-only persistence, owned/local allocation validation, feature flag and scopes on direct helper use, boost ownership, blocked recipients, pre-side-effect rejection, activity/integration/contract relationships, retry/resume, and notification behavior. Ensure no plaintext claims escaped into receipt/refresh persistence/log additions.
- [ ] Trace the literal guide snippet → `send(refresh:true)` → returned receipt → publication → holder update, and verify there is no issuer readback of holder-only data or copied inline context. Review the equivalent REST and legacy sendBoost evidence.
- [ ] Rerun targeted checks only where evidence is missing or a finding needs reproduction. Run snippet/link checks and `git diff --check 6cc28b6f9...HEAD`. Record exact commit reviewed and findings as file/line, severity, reproduction, impact, and proposed correction.
- [ ] Report **PASS**, **CHANGES_REQUIRED**, or **BLOCKED** independently of process exit status. A PASS requires every R1–R6 item covered with no unresolved correctness/security findings. A blocked Docker run is not a PASS.
- [ ] Write a ready-to-use PR title/body containing `[LC-2198]`, concrete behavior, compatibility change, validation, and limits. Include branch/commit and test evidence. Commit only the report; do not push, create a PR, merge, deploy, or transition Jira in this planning workflow.

**Review/fix loop:** If findings exist, the coordinator creates a new fix task based on the reviewed branch with explicit finding IDs, then a new review task against its resulting commit. Keep the previous review intact; do not overwrite/retry its branch. The implementation is ready for human approval only after this loop returns PASS.

**Done when:** A review report and final commit make readiness or outstanding work unambiguous. Jira closure still belongs to the Product Owner.
