# PR Summary: `lc-1871-fix`

## Overview

This branch restructures the App Store consent/install flow so credential syncing no longer blocks app installation.

Previously, shared URI materialization and contract credential syncing happened in the critical path of install/consent. That made app installation slower, more fragile, and harder to reason about when large wallets or duplicate/shared-URI edge cases were involved.

The main goal of this branch is to:

1. Move contract credential syncing out of the install critical path
2. Handle syncing through a resumable background job
3. Expose sync state to Partner Connect apps so they can wait for a complete learner snapshot when needed
4. Provide a concrete demo app for validating the new flow end to end

In support of that, this branch also fixes shared-URI reuse bugs, retains finished sync jobs long enough to power app-side status checks, and adds a contract-scoped demo query for inspecting synced shared URIs by category.

## Primary Product Change

### Before

-   Installing an app and consenting to a contract attempted to materialize shared URIs immediately
-   Syncing credentials into contract terms happened inline with install
-   Large or noisy wallets could make install feel slow or unreliable
-   Partner apps had no first-class way to understand whether LearnCard was still syncing data in the background

### After

-   Install/consent completes first with minimal latency
-   LearnCard enqueues a background sync job after consent
-   The background worker materializes shared URIs and writes contract terms asynchronously
-   Partner Connect apps can:
    -   ask for current sync status
    -   request learner context with `waitForSync`
    -   react to readiness with `onSyncComplete`

## High-Level Change Groups

### 1. Background contract sync infrastructure

This branch introduces a new persisted job store plus a worker hook to process contract syncs outside the install path.

Key additions:

-   `packages/learn-card-base/src/stores/pendingContractSyncStore.ts`
-   `packages/learn-card-base/src/hooks/usePendingContractSync.ts`
-   `packages/learn-card-base/src/stores/pendingContractSyncStore.test.ts`

What this does:

-   Stores pending sync jobs keyed by learner DID + contract URI + terms URI + owner DID
-   Tracks:
    -   `queued` / `running` / `done` / `error`
    -   `totalCredentials`
    -   `processedCredentials`
    -   `completedCredentials`
    -   `failedCredentials`
    -   `retryCount`
    -   `syncedSharedUrisByCategory`
-   Runs a concurrency-limited worker (`MAX_CONCURRENT_CREDENTIAL_SYNCS = 8`)
-   Retries failed jobs up to a max retry threshold
-   Persists job state so work can resume across reloads

### 2. Install flow moved off the critical path

The consent/install flow now avoids materializing shared URIs inline.

Key changes:

-   `apps/learn-card-app/src/components/credentials/AppInstallConsentModal.tsx`
-   `packages/learn-card-base/src/hooks/useConsentToContract.ts`

What changed:

-   `useConsentToContract` now supports `skipSharedUriMaterialization`
-   App install consent uses that flag to send raw terms first
-   After consent succeeds, LearnCard enqueues a background contract sync job

Net effect:

-   App installation no longer blocks on full credential sync
-   Sync is deferred, resumable, and observable

### 3. LearnCard UI for background sync visibility

This branch adds app-level UI so users can see sync progress and completion state.

Key additions:

-   `apps/learn-card-app/src/components/common/ContractSyncStatusBanner.tsx`
-   `apps/learn-card-app/src/components/credential-sync-listener/CredentialSyncListener.tsx`

What changed:

-   Active syncs show a lightweight progress banner
-   Completed syncs show a completion banner
-   Sync telemetry is emitted from the listener
-   Completed jobs are no longer immediately deleted, so app-side calls can still read the latest sync summary

### 4. Partner Connect sync-aware learner context

This branch extends the host-side Partner Connect postMessage handlers and the app-side Partner SDK to expose sync state.

Key files:

-   `apps/learn-card-app/src/hooks/post-message/useLearnCardMessageHandlers.ts`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardPostMessage.handlers.ts`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardPostMessage.ts`
-   `packages/learn-card-partner-connect-sdk/src/index.ts`
-   `packages/learn-card-partner-connect-sdk/src/types.ts`
-   `packages/learn-card-partner-connect-sdk/README.md`
-   `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/tabs/PartnerConnectTab.tsx`

What changed:

-   Added `GET_SYNC_STATUS` postMessage action
-   Added `waitForSync?: boolean` to learner-context requests
-   Added SDK helpers:
    -   `getSyncStatus()`
    -   `onSyncComplete()`
    -   `requestLearnerContext({ waitForSync: true })`
-   Host-side handler now:
    -   returns `syncing` when background sync is still running
    -   returns `ready` with progress info when sync is complete
    -   can throw when the latest sync ended in terminal error

This gives partner apps a clean contract:

-   call `requestLearnerContext({ waitForSync: true })`
-   if still syncing, show progress / wait
-   retry when `onSyncComplete()` fires

### 5. Example app for end-to-end verification

This branch adds a dedicated demo app for testing the new background sync flow in an embedded App Store scenario.

Key files:

-   `examples/app-store-apps/6-basic-sync-app/src/pages/index.astro`
-   `examples/app-store-apps/6-basic-sync-app/src/pages/api/synced-credentials.json.ts`
-   `examples/app-store-apps/6-basic-sync-app/package.json`
-   `examples/app-store-apps/6-basic-sync-app/astro.config.mjs`
-   `examples/app-store-apps/6-basic-sync-app/.env.example`
-   `examples/app-store-apps/6-basic-sync-app/README.md`

What the example demonstrates:

-   Connect to LearnCard with Partner Connect
-   Request consent for the configured app contract
-   Poll or fetch sync status
-   Request synced learner context with `waitForSync`
-   Query server-side contract data for a specific learner + contract

The demo app also now exposes a contract-scoped API that summarizes:

-   total unique shared URIs
-   shared URIs grouped by category
-   category counts for the current learner + current app contract

## Important Bug Fixes Included

### Shared URI reuse bug

Key file:

-   `packages/learn-card-base/src/hooks/useSharedUrisInTerms.ts`
-   Test: `packages/learn-card-base/src/hooks/__tests__/useSharedUrisInTerms.test.ts`

Problem:

-   The sync helper could incorrectly reuse a shared URI from another credential in the same category
-   That caused multiple source credentials to collapse into too few synced shared URIs

Fix:

-   Shared URI reuse now only occurs for the exact source credential being synced
-   Recipient handling was also normalized across upload paths

### Completed sync job retention for app-side status checks

Key files:

-   `packages/learn-card-base/src/stores/pendingContractSyncStore.ts`
-   `packages/learn-card-base/src/stores/pendingContractSyncStore.test.ts`
-   `apps/learn-card-app/src/components/credential-sync-listener/CredentialSyncListener.tsx`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardMessageHandlers.ts`

This PR introduces completed-job retention as part of the new background sync model.

Behavior:

-   Completed jobs are retained instead of being immediately deleted by UI cleanup
-   `getSyncStatus` can fall back to the latest terminal job when nothing is actively syncing
-   `waitForSync` / post-sync context reads can still observe the most recent completed sync summary
-   Re-enqueuing a completed job resets it into a fresh queued job for a new sync run

Why this matters:

-   Partner apps may ask for sync state immediately after background sync completes
-   The host needs a stable summary of the most recent sync result for status and learner-context flows
-   Retaining the finished job keeps the new background-sync workflow predictable without preventing future sync attempts

## Files / Areas Changed

### LearnCard App

-   `apps/learn-card-app/src/AppRouter.tsx`
-   `apps/learn-card-app/src/FullApp.tsx`
-   `apps/learn-card-app/src/analytics/events.ts`
-   `apps/learn-card-app/src/components/common/ContractSyncStatusBanner.tsx`
-   `apps/learn-card-app/src/components/credential-sync-listener/CredentialSyncListener.tsx`
-   `apps/learn-card-app/src/components/credentials/AppInstallConsentModal.tsx`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardMessageHandlers.ts`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardPostMessage.handlers.ts`
-   `apps/learn-card-app/src/hooks/post-message/useLearnCardPostMessage.ts`
-   `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/tabs/PartnerConnectTab.tsx`

### Shared base package

-   `packages/learn-card-base/src/hooks/useConsentToContract.ts`
-   `packages/learn-card-base/src/hooks/usePendingContractSync.ts`
-   `packages/learn-card-base/src/hooks/useSharedUrisInTerms.ts`
-   `packages/learn-card-base/src/hooks/__tests__/useSharedUrisInTerms.test.ts`
-   `packages/learn-card-base/src/index.ts`
-   `packages/learn-card-base/src/stores/pendingContractSyncStore.ts`
-   `packages/learn-card-base/src/stores/pendingContractSyncStore.test.ts`

### Partner Connect SDK

-   `packages/learn-card-partner-connect-sdk/src/index.ts`
-   `packages/learn-card-partner-connect-sdk/src/types.ts`
-   `packages/learn-card-partner-connect-sdk/README.md`

### Types

-   `packages/learn-card-types/src/lcn.ts`

### Demo app

-   `examples/app-store-apps/6-basic-sync-app/**`

### Dependency / lockfile

-   `pnpm-lock.yaml`

## Commit Narrative

The branch history breaks down roughly as:

1. Create persisted pending-sync job store
2. Add tests for store behavior
3. Introduce `usePendingContractSync`
4. Remove inline credential syncing from install
5. Add Partner SDK sync-state support
6. Add UI banner + listener for sync status
7. Add and refine the basic sync demo app
8. Fix shared-URI reuse/materialization issues
9. Retain completed jobs for post-sync app queries
10. Add sync-aware learner context to Partner Connect

## Testing / Validation

Targeted validation performed during this branch’s work includes:

-   `pnpm --dir packages/learn-card-base test -- run src/hooks/__tests__/useSharedUrisInTerms.test.ts`
-   `pnpm --dir packages/learn-card-base test -- run src/stores/pendingContractSyncStore.test.ts`
-   `pnpm --dir examples/app-store-apps/6-basic-sync-app build`

Additional manual validation covered:

-   installing the demo app inside LearnCard
-   observing background sync state transitions
-   verifying that partner apps can wait for sync completion before reading learner context
-   querying synced shared URIs by learner DID + current app contract

## Developer / Reviewer Notes

### Why this is valuable

-   Improves install responsiveness
-   Reduces consent/install flakiness for large wallets
-   Gives app developers a supported way to coordinate with background sync
-   Makes sync progress observable in both LearnCard UI and Partner Connect

### Main reviewer focus areas

1. Background worker correctness
    - category eligibility
    - retry behavior
    - duplicate shared URI handling
2. Partner Connect contract changes
    - `REQUEST_LEARNER_CONTEXT` with `waitForSync`
    - `GET_SYNC_STATUS`
3. Retention semantics for completed jobs
    - completed job reuse
    - repeated syncs for same contract
4. Demo app behavior
    - contract-scoped vs cross-contract counting
    - learner DID + contract 1-to-1 contract data lookup

### Notable branch detail

The branch currently includes generated/example app support files under `examples/app-store-apps/6-basic-sync-app/.astro` and `dist`-adjacent outputs reflected in the diff stat. Reviewers may want to decide whether those generated artifacts should remain committed or be cleaned up before merge, depending on repo conventions for example Astro apps.

## Suggested PR Description

This PR moves App Store contract credential syncing out of the install critical path and into a persisted background job worker. It also adds sync-state support to Partner Connect so apps can wait for a complete learner snapshot before continuing.

Highlights:

-   enqueue contract sync after consent instead of syncing inline during install
-   add persisted pending-sync job store + background worker
-   add LearnCard UI for sync progress / completion
-   add `GET_SYNC_STATUS`, `waitForSync`, and `onSyncComplete()` support to Partner Connect
-   add a dedicated basic sync demo app for end-to-end validation
-   fix shared URI reuse bugs that could collapse many credentials into too few synced URIs
-   retain completed jobs long enough for app-side status/context reads

## Diff Summary

Against `main`, this branch currently contains:

-   17 commits
-   45 changed files
-   ~2449 insertions / ~154 deletions
