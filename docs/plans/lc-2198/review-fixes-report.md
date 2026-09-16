# LC-2198 coordinator fixes and validation

Date: 2026-09-16. Branch: `codex/lc-2198-review-fixes`, based on `892d79411` (completed Dispatch task chain). Independent follow-up review **PASS**, recorded in [fixes-independent-review.md](./fixes-independent-review.md). Reviewed production commit: `487070bf547056da40bca469a10158470e4e87c8`; reviewer report commit: `32493ce67`.

## Corrections

1. Inline `BoostCredential` sends now establish a real boost URI before signing. A tRPC-only `boost.prepareRefreshableSend` operation shares the managed-send feature/constraints/scope/local-recipient/blocklist guards, then creates the inline boost with its metadata, skills, claim permissions and contract link. The SDK puts that URI in the unsigned `boostId`, allocates the service and status, signs once, and sends with `templateUri` instead of the inline template. Delivery therefore reuses one boost. Final send still performs its own guards and proof/holder/ownership validation. No verifier exceptions or post-signature mutation.
2. Reinjecting a managed service in array form now classifies entries by the managed service validator instead of comparing original entries to Zod's cloned output by reference. Other services are retained, including a standard service with the same ID. Regression checks repeated injection and input immutability.
3. An explicitly supplied signed credential takes precedence even when a template URI or inline template is supplied. The SDK forwards the original signed credential without preparing another boost, allocating another service, or signing again. Unit tests cover all three source forms; real E2E compares the holder's stored credential with the caller's signed input.
4. Corrected the old integration-test comment claiming all VC2+OBv3 contexts fail. Current versioned OBv3 3.0.3 works and remains exercised in the real signing E2E matrix. Documented preserving the returned boost URI as `boostId` in subsequent updates.

## Evidence

Negative controls before production edits: helper array regression failed; SDK inline-anchor regression and both template-plus-pre-signed cases failed. All now pass.

Executed locally from this worktree (Bun 1.3.14, frozen lockfile install):

- `bunx nx build init`: 31 build tasks successful, includes brain/types/SDK dependencies.
- `bun --cwd packages/learn-card-helpers test`: 133 passed.
- `bun --cwd packages/plugins/learn-card-network test -- --typecheck`: 68 passed, 6 skipped; no type errors.
- `bun --cwd packages/plugins/vc test`: 89 passed.
- `bun --cwd services/learn-card-network/brain-service typecheck`: both build and entrypoint typechecks passed.
- `bun --cwd services/learn-card-network/brain-service test:integration -- test/refresh-send.spec.ts`: 36 passed (25 original plus 11 preparation tests). Includes zero new Boost/Credential/Refresh/Activity/Inbox nodes on feature-disabled, missing either scope, unsupported/blocked recipient and draft rejection; real metadata, skills, claim permissions, RELATED_TO and ISSUED_VIA_TRANSACTION preservation; one boost after signed delivery.
- `bun --cwd tests/e2e test:run -- tests/refresh-send.spec.ts tests/docs-refresh.spec.ts tests/credential-refresh.spec.ts`: 17 passed. Inline lifecycle now uses a VC2/OBv3 3.0.3 `BoostCredential`, asserts exactly one boost, warning/error-free verification, publishes v2 with its actual boostId and refreshes successfully.
- After strengthening pre-signed E2E to include `templateUri` and compare the exact stored credential: targeted `tests/refresh-send.spec.ts -t pre-signed` passed (1 test, 12 excluded).
- Docs snippets/links and `git diff --check`: pass. Prior task reports retain historical evidence; this report supersedes their recommendation to defer the above defects.

The e2e brain and cloud were recreated from this worktree's compose file using the existing image and support containers. Brain mounts this worktree's service, helper and type sources. SDK artifacts were built here. Integration tests use their own testcontainer DB, separate from e2e.

## Limits and review targets

- Preparation and signing are separate requests. A signing/transport failure after successful preparation can leave an unsent boost (and, after allocation, an unused refresh allocation). Whole-call retries are not advertised as idempotent. Existing validated pre-signed delivery replay remains idempotent. Do not claim an atomic transaction for the entire SDK call.
- The new SDK inline path requires the matching brain-service preparation procedure; deploy the service before releasing the SDK changes. No new public invoke method or HTTP route is exposed.
- Previous task 4/5 baseline comparison found 10 local email/inbox failures in `unified-send.spec.ts`. Those unrelated full-suite failures were not rerun in this fix pass; CI still needs that coverage. The managed E2E and ordinary compatibility coverage inside it pass.
- DID-document cache invalidation on signing-authority registration remains separate work. The tests retain their explicit resolver refresh after SA setup.
- No push, PR creation, deployment, merge to main, or Jira transition performed.

## Final coordinator assessment

The fresh GLM 5.3 Flash reviewer independently reproduced all package tests/typechecks, 36 server integrations and 17 real E2Es. No blocking findings remain for this fix pass. The reviewer report is preserved alongside this evidence. Local branch `codex/lc-2198-review-fixes` contains the complete original implementation, fixes and independent review.

One low-severity follow-up is retained: manually signed credentials can embed boost A while delivery names issuer-owned boost B. Coordinator confirmed the same missing cross-check in baseline `6cc28b6f9`, before LC-2198. Clarification of Finding A's replay wording: replay validates the credential digest against the original credential and the graph anchor against the original graph anchor separately; it does **not** compare the embedded boost URI to the graph anchor, even on replay. The SDK's fixed local-signing flow uses the same URI in both places. A future validation change should reject a present mismatching embedded boost URI before persistence, with initial-send and replay regression tests; compare URI to URI, not the graph's bare boost ID. This is tracked separately from the completed fixes, along with SA DID-document cache invalidation.

Suggested PR title: **Enable managed refresh through unified credential sends**. Use the original task-5 PR outline plus this correction: inline SDK sends prepare the boost before signing, explicit pre-signed inputs remain unchanged, and array reinjection is idempotent. Replace task-5's obsolete deferred-defect list with the current limits above.
