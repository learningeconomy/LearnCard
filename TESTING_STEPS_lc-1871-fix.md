# How To Test

## Local Setup

1. Start the full local LearnCard stack

```bash
pnpm lc
```

Choose the full local app / fullstack local option.

2. Give your test user App Store admin access

In [services/learn-card-network/brain-service/.env](/Users/gerardoparedes/Documents/work/LearnCard/services/learn-card-network/brain-service/.env), set:

```env
APP_STORE_ADMIN_PROFILE_IDS=your_test_profile_id
```

Restart the brain service after updating the env.

## Create a Test App

3. Create a new App Store listing

The app must:

-   be an embedded app
-   have a consent contract configured
-   use this embed URI:

```text
http://localhost:4321/
```

Save the contract URI, since it is required for the demo app.

4. Approve the app as an admin

Approve the app so it appears in Launchpad / the app dashboard for installation.

## Configure the Demo App

5. Configure the `6-basic-sync-app` example

In [examples/app-store-apps/6-basic-sync-app/.env](/Users/gerardoparedes/Documents/work/LearnCard/examples/app-store-apps/6-basic-sync-app/.env), set:

```env
LEARNCARD_ISSUER_SEED=YOUR_TEST_USER_SEED
APP_CONTRACT_URI=YOUR_APP_CONTRACT_URI
```

Then start the demo app:

```bash
pnpm dev
```

## Prepare Test Data

6. Seed the learner wallet with credentials

Use a learner/test user with credentials already in their wallet.

Recommended:

-   at least 50–60 VCs

This helps create enough latency to clearly observe the background sync flow.

7. Enable network throttling in the browser

Set the browser/devtools network profile to:

```text
Slow 4G
```

This makes the install + sync timing easier to observe and helps validate that install is not blocked by credential materialization.

## Test the Install + Sync Flow

8. Install the embedded app from LearnCard

Expected behavior:

-   install completes immediately
-   credential syncing starts in the background
-   a syncing indicator appears

9. Open the embedded demo app

The demo app exposes buttons to check:

-   sync status
-   synced learner context
-   query-by-DID summary

Use them in this order:

1. Click `Check Sync Status`
2. Wait until the status is no longer `syncing`
3. Click `Request Synced Context`
4. Click `Query Synced By DID`

## What To Verify

10. Confirm the following behavior

-   app install is not blocked by credential syncing
-   a background sync job starts after install / consent
-   sync progress is visible while the job is running
-   once sync completes, learner context loads successfully
-   query-by-DID returns the final synced shared URIs and category counts for the current app contract

## Success Criteria

-   install feels immediate
-   sync happens after install, not during install
-   `getSyncStatus()` reports active progress while syncing
-   `requestLearnerContext({ waitForSync: true })` works after sync completes
-   query-by-DID confirms the final contract-scoped synced credential set and category totals
