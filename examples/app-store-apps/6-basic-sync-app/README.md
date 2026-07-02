# Basic Sync App

Minimal Partner Connect example for exercising LearnCard background sync end to end.

## What It Shows

-   `requestIdentity()` to connect to the LearnCard host.
-   `requestConsent()` to grant the configured data contract.
-   `getSyncStatus()` to inspect background sync progress.
-   `requestLearnerContext({ waitForSync: true })` to wait for a complete learner snapshot.
-   `onSyncComplete()` to retry context loading after the host reports sync is ready.

## Run Locally

```bash
pnpm exec nx dev 6-basic-sync-app
```

Set `HOST_ORIGIN` when embedding against a non-production LearnCard host:

```bash
HOST_ORIGIN=http://localhost:3000 pnpm exec nx dev 6-basic-sync-app
```

## E2E Selectors

-   `connect-btn`
-   `consent-btn`
-   `sync-status-btn`
-   `request-context-btn`
-   `sync-status`
-   `progress-text`
-   `credential-count`
-   `result`
