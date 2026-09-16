---
title: "LC-2198 - Task 3: SDK unified send and legacy sendBoost"
status: queued
project: /Users/donny/Work/LearnCard
model: zai/glm-5.3-flash
harness: pi
branch: codex/lc-2198-refresh-send-task-3
priority: 2
max_runtime: 90m
created: 2026-09-16
depends_on: ["2026-09-16-lc-2198-refresh-send-task-2"]
allowed_tools: Edit,Write,Bash,Read,Glob,Grep
setup: "bun install --frozen-lockfile"
setup_timeout: 15m
---

## Context

Task 3 of 5 for LC-2198. Execute only this task. Held for review; release by setting status to pending.

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


## Instructions

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

## Task acceptance

- Complete this task's checkboxes and verification, or explicitly report BLOCKED with evidence.
- Write and commit docs/plans/lc-2198/task-3-report.md with exact results and commit references.
- Do not update master tracking or live Dispatch files. Do not publish, merge, deploy, or change Jira status.
