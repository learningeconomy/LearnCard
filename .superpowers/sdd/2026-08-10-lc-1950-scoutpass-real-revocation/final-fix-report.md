# LC-1950 final review fix report

Date: 2026-08-10

Scope: repository source and local test fixtures only; no live or production data was read or changed.

## Outcome

All nine Important final-review findings are fixed in one coordinated wave. The final Task 7 matrix is 99/99 tests across 11 files (the 84-test baseline plus 15 new regressions), the three required builds are green, the isolated Scout semantic type check is green, and all static/format/scope checks pass.

## Per-finding RED, implementation, and GREEN evidence

### 1. Resolved verification errors opened Scout gates

-   RED: the focused shared hook run reported 1 failed and 4 passed; a resolved `VerificationCheck` containing `errors` returned `isError: false` instead of the expected `true`. The Scout decision coverage also demonstrated that an error-derived unavailable status must remain action-restricted.
-   Implementation: `useCredentialStatus` still returns fail-open lifecycle data (`status: 'active'`) when verification resolves with errors, but now preserves `isError: true`. `useTroopIDStatus` consequently normalizes that result to unavailable rather than valid.
-   GREEN: shared hook 5/5; Scout status/share and page-helper suites 22/22; the full shared/Scout matrix also passed.
-   Files: `packages/learn-card-base/src/hooks/useCredentialStatus.ts`, `packages/learn-card-base/src/hooks/__tests__/useCredentialStatus.test.tsx`, `apps/scouts/src/pages/troop/troopIdStatus.helpers.ts`, `apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts`.

### 2. Personal-row Share bypassed lifecycle gating

-   RED: the focused Scout run failed the six restricted personal Share cases (missing, loading, error, pending, suspended, and revoked); only a resolved valid issuance may share.
-   Implementation: `IdOptionsModal` now invokes the holder lifecycle adapter with the exact `credentialUri` and `issuanceState`. The Share row is rendered only when `canSharePersonalTroopId` receives a resolved valid status. This is independent of the parent-administrator protected-content bypass.
-   GREEN: all seven personal Share decision cases passed inside the 18-case Scout status suite; the Scouts production build passed.
-   Files: `apps/scouts/src/pages/troop/IdOptionsModal.tsx`, `apps/scouts/src/pages/troop/troopIdStatus.helpers.ts`, `apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts`.

### 3. Sibling issuance state could override an exact credential URI

-   RED: two focused data-flow assertions failed before implementation: an exact accepted URI could inherit the first pending sibling, and a present-but-unmatched exact URI could incorrectly fall back to a profile sibling.
-   Implementation: `selectHolderRecipient` selects by exact credential URI whenever one is supplied. Profile fallback is used only when no exact holder URI exists.
-   GREEN: exact-URI and fallback cases passed in `troopPage.helpers.test.ts` (4/4 file total with finding 4).
-   Files: `apps/scouts/src/pages/troop/TroopPage.tsx`, `apps/scouts/src/pages/troop/troopPage.helpers.ts`, `apps/scouts/src/pages/troop/__tests__/troopPage.helpers.test.ts`.

### 4. Pending-only member rows were unreachable

-   RED: the focused data-flow assertion showed that accepted count `0` hid the member box despite a pending row.
-   Implementation: visibility now uses `hasReachableMembers(totalCount, memberRows)`, keeping pending-only list/removal controls reachable while leaving the accepted count untouched.
-   GREEN: both pending-only visibility and truly-empty hiding assertions passed.
-   Files: `apps/scouts/src/pages/troop/TroopPageMembersBox.tsx`, `apps/scouts/src/pages/troop/troopPage.helpers.ts`, `apps/scouts/src/pages/troop/__tests__/troopPage.helpers.test.ts`.

### 5. Group removal invalidated nonexistent React Query keys

-   RED: 2/2 focused mutation tests failed after seeding actual `paginatedBoostRecipients` and `useCountBoostRecipients` consumer entries; neither real query became invalidated on success or failure.
-   Implementation: the invalidation prefixes now match those actual consumers. Tests use real `QueryClient` cache entries and assert their `isInvalidated` state rather than spying on constants.
-   GREEN: mutation suite 2/2 on both success and failure, and 13/13 in the full `learn-card-base` matrix.
-   Files: `packages/learn-card-base/src/react-query/mutations/revokeBoostRecipientGroup.ts`, `packages/learn-card-base/src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx`.

### 6. Scout result type was an invalid subtype

-   RED: temporarily restoring the old direct `extends CredentialStatusResult` declaration made the isolated semantic check fail with TS2430 because Scout replaces lifecycle `status`; the mutation was immediately reverted.
-   Implementation: shared lifecycle option/result interfaces live in the dependency-light `credentialStatus.types.ts`; `TroopIdStatusResult` extends `Omit<CredentialStatusResult, 'status'>` and has an explicit compile-time independence assertion. A narrow project file makes this contract reproducible without unrelated application-wide baseline errors.
-   GREEN: `bunx tsc --project apps/scouts/tsconfig.troop-status.json --pretty false` exited 0, and all builds passed.
-   Files: `packages/learn-card-base/src/hooks/credentialStatus.types.ts`, `packages/learn-card-base/src/hooks/useCredentialStatus.ts`, `apps/scouts/src/pages/troop/troopIdStatus.types.ts`, `apps/scouts/src/pages/troop/TroopIdStatusButton.tsx`, `apps/scouts/tsconfig.troop-status.json`.

### 7. Singular Bitstring failures falsely succeeded

-   RED: the focused backend run failed both singular cases: an injected thrown update and an explicit `failed` result resolved successfully instead of rejecting. The focused run also proved notification would otherwise follow the false success path.
-   Implementation: `revokeCredentialReceived` now returns false only when the graph credential was not found, throws `Failed to update credential status list` for an actual failed update, and preserves legacy `missing-entry` as success with a warning.
-   GREEN: both singular cases reject with the expected message and do not notify; the existing missing-entry compatibility test and the full backend matrix pass.
-   Files: `services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts`, `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts`.

### 8. Legacy received-side revoked state/audit was ignored

-   RED: the focused backend regression classified a received-side revoked fixture as newly revoked instead of already revoked and would assign a new sent-side audit timestamp.
-   Implementation: the graph transition reads both sent and received status/timestamps. Either revoked status is already revoked; repair copies the effective original timestamp to the sent relationship and still reruns mandatory status/cleanup work.
-   GREEN: the route reports the fixture only in `alreadyRevokedCredentialUris`, preserves the exact 2025 audit timestamp on both sides, reruns cleanup, and queues no notification.
-   Files: `services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts`, `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts`.

### 9. First partial graph transitions were never notified

-   RED: two focused backend cases failed because cleanup-partial and Bitstring-partial first transitions omitted their failed URI from the consolidated notification.
-   Implementation: the group route tracks first authoritative graph transitions independently from response success buckets. It notifies that transition set once even when mandatory side effects make the result partial; healing retries see an already-revoked graph state and cannot notify again.
-   GREEN: both partial cases notify once with the transitioned URI, retry successfully as already revoked, do not notify twice, and the Bitstring retry now asserts the real revocation bit is set.
-   Files: `services/learn-card-network/brain-service/src/routes/boosts.ts`, `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts`.

## Focused TDD commands and results

```bash
bun run --cwd packages/learn-card-base test -- src/hooks/__tests__/useCredentialStatus.test.tsx
# RED: 1 failed, 4 passed; GREEN: 5 passed

bun test \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts \
  apps/scouts/src/pages/troop/__tests__/troopPage.helpers.test.ts
# RED: 9 failed, 13 passed; GREEN: 22 passed

bun run --cwd packages/learn-card-base test -- \
  src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx
# RED: 2 failed; GREEN: 2 passed

env SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run --cwd services/learn-card-network/brain-service test -- run \
  --testTimeout=30000 test/revoke-boost-recipient-group.spec.ts \
  -t 'singular revocation|legacy received-side|retries cleanup hooks|retries a failed status-list update'
# RED: 5 failed, 7 skipped; GREEN: 5 passed, 7 skipped

bunx tsc --project apps/scouts/tsconfig.troop-status.json --pretty false
# Mutated old declaration: TS2430; restored Omit contract: exit 0
```

## Full Task 7 matrix

```bash
bun run --cwd packages/learn-card-base test -- \
  src/hooks/__tests__/deriveLifecycleStatus.test.ts \
  src/hooks/__tests__/useCredentialStatus.test.tsx \
  src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx
# 13 passed, 3 files

bun run --cwd apps/learn-card-app test:unit -- \
  src/hooks/__tests__/useCredentialStatus.test.ts
# 5 passed, 1 file

bun test \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts \
  apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts \
  apps/scouts/src/pages/troop/__tests__/troopPage.helpers.test.ts
# 25 passed, 3 files

env SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run --cwd services/learn-card-network/brain-service test -- run \
  --testTimeout=30000 \
  test/revoke-boost-recipient-group.spec.ts \
  test/revoke-suspend-per-instance.spec.ts \
  test/revoke-credential.spec.ts \
  test/scouts-hierarchy.spec.ts
# 56 passed, 4 files, exit 0, 174.39s
```

Aggregate: 99/99 tests across 11 files (84 baseline plus 15 new tests). Expected-only backend output consisted of DIDKit native fallback, deliberate missing-entry/suspension warnings, and the test-injected notification failure.

## Builds and static acceptance

```bash
bun run --cwd packages/learn-card-types build
# exit 0 — Build successful

bun run --cwd packages/plugins/learn-card-network build
# exit 0 — Build successful

bunx nx build scouts
# exit 0 — successfully built Scouts and its dependency graph

bunx tsc --project apps/scouts/tsconfig.troop-status.json --pretty false
# exit 0

rg -n "useSyncRevokedCredentials" apps/scouts/src
rg -n "isClaimedError|isAllError|useIsTroopIDRevokedFake" apps/scouts/src
rg -n "removeBoostAdmin|updateBoostPermissions" apps/scouts/src/pages/troop/IdOptionsModal.tsx
# all three: no matches (expected rg exit 1)

git diff --check
# exit 0, no output

git diff -- package.json bun.lock bun.lockb yarn.lock package-lock.json pnpm-lock.yaml
# exit 0, no output

bunx prettier --check \
  apps/scouts/src/pages/troop/IdOptionsModal.tsx \
  apps/scouts/src/pages/troop/TroopIdStatusButton.tsx \
  apps/scouts/src/pages/troop/TroopPage.tsx \
  apps/scouts/src/pages/troop/TroopPageMembersBox.tsx \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts \
  apps/scouts/src/pages/troop/__tests__/troopPage.helpers.test.ts \
  apps/scouts/src/pages/troop/troopIdStatus.helpers.ts \
  apps/scouts/src/pages/troop/troopIdStatus.types.ts \
  apps/scouts/src/pages/troop/troopPage.helpers.ts \
  apps/scouts/tsconfig.troop-status.json \
  packages/learn-card-base/src/hooks/credentialStatus.types.ts \
  packages/learn-card-base/src/hooks/__tests__/useCredentialStatus.test.tsx \
  packages/learn-card-base/src/hooks/useCredentialStatus.ts \
  packages/learn-card-base/src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx \
  packages/learn-card-base/src/react-query/mutations/revokeBoostRecipientGroup.ts \
  services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts \
  services/learn-card-network/brain-service/src/routes/boosts.ts \
  services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts
# all matched files use Prettier code style
```

The first network-plugin build was mistakenly overlapped with the type-package build and observed stale generated output (`TS2305: RevokeBoostRecipientGroupResult`); rerunning it after the type build completed passed. The final required build order above is fully green. Scouts emitted only existing Sass deprecation, dynamic/static import, `eval`, and large-chunk warnings.

## Final file set

-   Scout runtime and tests: `IdOptionsModal.tsx`, `TroopIdStatusButton.tsx`, `TroopPage.tsx`, `TroopPageMembersBox.tsx`, `troopIdStatus.helpers.ts`, `troopIdStatus.types.ts`, `troopPage.helpers.ts`, `troopIdStatus.helpers.test.ts`, `troopPage.helpers.test.ts`, `tsconfig.troop-status.json`.
-   Shared lifecycle/query runtime and tests: `credentialStatus.types.ts`, `useCredentialStatus.ts`, `useCredentialStatus.test.tsx`, `revokeBoostRecipientGroup.ts`, `revokeBoostRecipientGroup.test.tsx`.
-   Backend runtime and tests: `credential/relationships/update.ts`, `routes/boosts.ts`, `revoke-boost-recipient-group.spec.ts`.

## Self-review and scope audit

-   Rechecked each of the nine findings against the final diff and its named regression.
-   Lifecycle data remains fail-open `active`; verification error metadata keeps Scout unavailable/restricted.
-   Personal Share uses the exact issuance and does not inherit parent-admin protected-content access.
-   Exact URI selection takes precedence; pending-only rows remain reachable without changing counts.
-   Query tests observe actual consumer cache records; backend tests exercise real route/graph behavior and real Bitstring healing.
-   Singular thrown/failed updates reject; missing-entry compatibility remains a warned success.
-   Legacy received-side revocation preserves the original effective audit time and remains repairable without notification.
-   First graph transitions notify once even for partial side effects; healing retries do not duplicate.
-   No dependency/lockfile, schema migration, data migration, or self-service Leave changes were made. Existing Leave code was inspected and remains untouched.
-   No unrelated files, generated build output, or live data are included.

## Residual concerns

No automated finding remains open. Per the approved scope, rendered holder/member UI, Share/QR suppression, toast wording, and live offline behavior still require the documented manual release smoke test. Existing build warnings are unchanged and non-blocking.
