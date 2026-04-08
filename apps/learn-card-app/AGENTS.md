# LearnCard App (`apps/learn-card-app/`)

## Architecture

See root `CLAUDE.md` for app entry point, state management, routing, and UI overview.

## E2E Testing (Playwright)

### Running Tests

```bash
cd apps/learn-card-app

# Run all tests
npx playwright test

# Run specific test files
npx playwright test wallet-credentials.spec.ts app-store.spec.ts

# Run headed (visible browser)
npx playwright test wallet-credentials.spec.ts --headed

# No retries (faster feedback during development)
npx playwright test wallet-credentials.spec.ts --retries=0
```

**Config**: `playwright.config.ts` — Firefox only, 120s timeout, 1 worker, `docker compose up` for backend.

### Infrastructure

| Component             | URL                     | Purpose                          |
| --------------------- | ----------------------- | -------------------------------- |
| App (Vite dev server) | `http://localhost:3000` | Frontend under test              |
| Brain service (tRPC)  | `http://localhost:4000` | Network API                      |
| Neo4j                 | `bolt://localhost:7687` | Graph database                   |
| Test cleanup server   | `http://localhost:3100` | POST `/delete-all` between tests |

The test fixture (`tests/fixtures/test.ts`) automatically calls `/delete-all` after each test to reset state.

### Authentication

**Storage state authentication does NOT work** — the app requires a `privateKey` stored separately from localStorage. When localStorage is restored without the privateKey, the app logs out.

Instead, tests use seed-based login via `/hidden/seed`:

```typescript
// Basic login (lands on /wallet)
await waitForAuthenticatedState(page);

// Login with a network profile (creates profile via wallet.invoke.createProfile)
await waitForAuthenticatedState(page, { profileId: 'my-profile-id' });

// Login as a different user with a specific seed
await waitForAuthenticatedState(page, {
    seed: TEST_USER_2_SEED,
    profileId: TEST_USER_2_PROFILE_ID,
});
```

The `LoginWithSeed` page (`src/pages/hidden/LoginWithSeed.tsx`) creates a wallet from the seed and optionally creates a network profile if `?profileId=xxx` is in the URL.

### Global Setup

`playwright-global-setup.ts` runs before all tests:

1. Logs in with demo email → saves `demoState.json` (localStorage snapshot)
2. Logs in with seed `'2'.repeat(64)` → saves `test2State.json`
3. Both handle role selection and profile setup screens if they appear

### Test Constants

```typescript
// tests/constants.ts
TEST_USER_SEED = 'a'.repeat(64); // Primary test user
TEST_USER_2_SEED = '2'.repeat(64); // Secondary test user
TEST_USER_PROFILE_ID = 'e2e-test-user-1';
TEST_USER_2_PROFILE_ID = 'e2e-test-user-2';
```

### DIDKit WASM Mocking

Tests intercept CDN requests for the ~9MB DIDKit WASM file and serve it from the local monorepo (`packages/plugins/didkit/src/didkit/pkg/`). Applied automatically via the test fixture for the default context, but **must be applied manually for additional browser contexts**:

```typescript
const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
await mockDidKitWasmForContext(context2); // Required!
const page2 = await context2.newPage();
```

### Key Test Files

| File                         | What it tests                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `wallet-credentials.spec.ts` | Issue credential to self, issue to another user, wallet category navigation, credential detail view |
| `app-store.spec.ts`          | Browse app store, view detail, install and launch embedded app                                      |
| `login.spec.ts`              | Login flow                                                                                          |
| `consent-flow.spec.ts`       | ConsentFlow creation and acceptance                                                                 |
| `connect.spec.ts`            | User connections                                                                                    |

### Known Ionic Modal Gotchas

The app uses `useIonModal` (Ionic) in many components. These create phantom `ion-modal` DOM elements that:

-   Persist in the DOM with `show-modal` class even after dismiss
-   Set `aria-hidden="true"` on main content, blocking `getByRole` selectors
-   Intercept mouse events at the coordinate level, even with Playwright's `force: true`

**Workarounds for tests:**

-   Use `data-testid` attributes on buttons behind modals
-   Use `dispatchEvent('click')` instead of `.click()` to bypass hit-testing
-   Example: `page.locator('[data-testid="boost-cms-save"]').dispatchEvent('click')`

### Credential Issuance Flow (Test Perspective)

The credential issuance UI flow through BoostCMS:

```
Add to LearnCard → Boost Someone → pick template → fill form →
Next → Publish & Issue → Plus → Boost Myself (or Boost Others + search) → Save
```

After save, the app calls `history.goBack()` — tests must start from the page they want to return to (e.g., `/wallet`).

**Self-issue helper**: `issueCredentialToSelf(page)` handles the full flow.

**Two Save buttons exist** during issuance:

1. Address book modal Save — confirms recipient selection
2. Header Save (`data-testid="boost-cms-save"`) — issues the credential

### Wallet Page Category Verification

The wallet page (`/wallet`) shows credential categories as clickable cards with `role="button"`. Social Badges display as **"Boosts"** (from theme `labels.plural`). Clicking navigates to `/socialBadges`.

```typescript
const boostsCategory = page.locator('[role="button"]').filter({ hasText: 'Boosts' });
await expect(boostsCategory).toBeVisible({ timeout: 30_000 });
await boostsCategory.click();
await page.waitForURL(/\/socialBadges/);
```

### Credential Detail View

Clicking a credential card opens a FullScreen modal with `VCDisplayCard2`. Key selectors:

| Element        | Selector                                 | Notes                                             |
| -------------- | ---------------------------------------- | ------------------------------------------------- |
| Title          | `.vc-card-header-main-title`             | Use `.first()` — front + back face both render it |
| Issuer info    | `.issued-by`                             | "by **issuerName**" text, use `.first()`          |
| Description    | `.description-box`                       | Visible on back face after clicking "Details"     |
| Card container | `section[role="button"].vc-display-card` | Flipper between front/back                        |

### App Store Tests

App store tests seed data directly into Neo4j (`app-store.helpers.ts`):

-   `seedAppListing()` — creates an Integration + AppStoreListing with `CURATED_LIST` promotion level
-   Profile creation uses `waitForAuthenticatedState(page, { profileId: 'testa' })` — no direct Neo4j needed

The embed URL is mocked via `mockEmbedRoute(page)` to serve a simple HTML page instead of making real network requests.

## Partner Onboarding & CredentialBuilder

### CredentialBuilder Component

Location: `src/pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/`

A form-based OBv3 credential template builder used by partner onboarding guides. Key files:

| File                    | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `CredentialBuilder.tsx` | Main component — form mode, JSON mode, validation                                             |
| `types.ts`              | Template types: `OBv3CredentialTemplate`, `TemplateFieldValue` (static/dynamic/system)        |
| `utils.ts`              | `templateToJson()` / `jsonToTemplate()` serialization, `validateTemplate()` structural checks |
| `validateJsonLd.ts`     | Client-side JSON-LD expansion validation using bundled contexts                               |
| `contexts/`             | Bundled VC v2 + OBv3 3.0.3 context JSON + document loader                                     |
| `presets.ts`            | Template presets (badge, certificate, etc.)                                                   |
| `sections/`             | Form sections: Achievement, Evidence, Dates, CustomFields, etc.                               |

### JSON-LD Validation Architecture

The CredentialBuilder validates templates in three layers via `runValidation()` (debounced 2s after edits):

1. **Structural** (`validateTemplate()`) — required fields, URL format. If errors, sets status to `'invalid'` immediately and stops.
2. **JSON-LD** (`validateCredentialJsonLd()`) — runs `jsonld.expand()` with bundled contexts. If errors, sets `'invalid'` and stops.
3. **Server** (`onTestIssue()`) — actual test issuance via backend. Only runs if both previous layers pass.

All three layers feed into `onValidationChange(status, error)` which parent components use to block save/continue. Bundled contexts avoid network fetches. The `@digitalcredentials/jsonld` library is dynamically imported to keep it out of the initial bundle. Mustache `{{variables}}` are replaced with placeholder URIs before expansion.

**Note:** `issueCredential()` injects signing contexts (e.g., `ed25519-2020/v1`) into the credential's `@context`. `jsonToTemplate()` strips these via `SIGNING_ARTIFACT_CONTEXTS` to avoid validation failures when loading saved templates.

### Credential Context Layers

```
@context array in a credential:
┌─────────────────────────────────────────────┐
│ 1. W3C VC v2                                │  ← VerifiableCredential, issuer, credentialSubject, proof
│ 2. OBv3 3.0.3                               │  ← Achievement, criteria, alignment, evidence
│ 3. LearnCard Boost (optional, internal only) │  ← BoostCredential, display, skills, attachments
└─────────────────────────────────────────────┘
Each layer defines its own terms; later layers rely on earlier ones being present.
Properties not defined in ANY loaded context → "key expansion failed" error.
Boost contexts: packages/learn-card-contexts/boosts/ (lcn: namespace)
```

### Consumers of CredentialBuilder

-   `TemplateListManager.tsx` — used by IssueCredentialsGuide (LC-1635), tracks validation status, blocks save on errors
-   `TemplateBuilderStep.tsx` — used by other partner guides (CourseCatalog, Embed), multi-template support
-   `ChildEditModal.tsx` — inline editing in template lists

## App Dashboard Analytics Export

### Overview

The App Dashboard (`/app-store/developer/dashboards`) provides CSV export functionality for credential activity analytics. Users can download credential data filtered by event type and date range.

### Key Files

| File                                         | Purpose                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| `dashboards/components/ExportDialog.tsx`     | Export dialog UI with filters and progress display        |
| `dashboards/hooks/useActivityExport.ts`      | Export logic, CSV generation, and download handling       |
| `dashboards/hooks/useIntegrationActivity.ts` | Recent Activity list (shows all events)                   |
| `dashboards/tabs/OverviewTab.tsx`            | Dashboard overview with Recent Activity and export button |

### Two Data Modes

The system supports two different viewing modes for credential activity:

| Mode                | Use Case                   | Behavior                                                                 |
| ------------------- | -------------------------- | ------------------------------------------------------------------------ |
| **Recent Activity** | Timeline view on dashboard | Shows ALL events — a credential delivered then claimed appears as 2 rows |
| **CSV Export**      | Downloadable analytics     | Shows UNIQUE credentials filtered by current status                      |

This is controlled by the `groupByLatestStatus` parameter in `getMyActivities`:

-   `false` (default): Returns all individual events
-   `true`: Groups by `activityId`, returns only the latest event per credential

### Event Types

```typescript
type CredentialActivityEventType = 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';
```

### Derived Status Logic

When exporting with an event type filter (e.g., "Delivered"), the system returns credentials whose **current status** matches, not credentials that ever had that event. Example:

-   Credential A: CREATED → DELIVERED → CLAIMED (current status: CLAIMED)
-   Credential B: CREATED → DELIVERED (current status: DELIVERED)

Filtering by "Delivered" returns only Credential B.

### Filtering Options

The dashboard supports filtering activity by:

| Filter      | UI Location | Purpose                                           |
| ----------- | ----------- | ------------------------------------------------- |
| Event Type  | Dropdown    | Filter by status (Sent, Delivered, Claimed, etc.) |
| App Listing | Dropdown    | Filter by specific app (only shows if apps exist) |

**App Listing Filter**: When filtering by app listing, the system uses an `EXISTS` clause to find activities that share an `activityId` with any activity that has a `PERFORMED_BY_LISTING` relationship. This ensures chained events (e.g., CLAIMED after DELIVERED) are included even though only the initial event has the listing relationship.

### CSV Export Flow

```
User clicks "Download CSV" → ExportDialog opens →
Select filters (app listing, event type, date range) → Click "Download" →
useActivityExport.exportCsv() runs:
  1. Fetch stats (getActivityStats) for progress count
  2. Fetch activities (getMyActivities with groupByLatestStatus: true)
  3. For each activity, fetch full event chain (getActivityChain)
  4. Build CSV rows with derived status, timestamps, recipient info
  5. Download file (web: Blob URL, native: Capacitor Filesystem)
```

### CSV Columns

| Column              | Source                                 |
| ------------------- | -------------------------------------- |
| Credential Name     | `boost.name` from activity chain       |
| Credential Category | `boost.category` from activity chain   |
| Recipient Name      | `recipientProfile.displayName`         |
| Recipient Email     | `metadata.recipientEmail`              |
| Recipient Type      | Derived from `metadata.recipientType`  |
| Status              | Derived from latest event in chain     |
| Delivery Method     | `metadata.deliveryMethod`              |
| Sent Date           | Timestamp of CREATED/DELIVERED event   |
| Claimed Date        | Timestamp of CLAIMED event (if exists) |
| Time to Claim       | Calculated difference                  |
| Error Details       | From FAILED event metadata             |

### Backend Routes

| Route              | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `getMyActivities`  | Paginated activity records with optional `groupByLatestStatus`, `listingId` |
| `getActivityStats` | Aggregated counts by status with optional `listingId` filter                |
| `getActivityChain` | Full event history for a single `activityId`                                |

### Backend Implementation

Location: `services/learn-card-network/brain-service/src/accesslayer/credential-activity/read.ts`

The `getActivitiesForProfile` function uses different Cypher queries based on mode:

**Recent Activity mode** (`groupByLatestStatus: false`):

```cypher
MATCH (a:CredentialActivity)
WHERE a.actorProfileId = $profileId AND a.eventType = $eventType
ORDER BY a.timestamp DESC
```

**Export mode** (`groupByLatestStatus: true`):

```cypher
MATCH (a:CredentialActivity)
WHERE a.actorProfileId = $profileId
WITH a.activityId as aid, COLLECT({activity: a, boost: b, recipient: r}) as events
WITH aid, events, REDUCE(latest = HEAD(events), e IN TAIL(events) |
    CASE WHEN e.activity.timestamp > latest.activity.timestamp THEN e ELSE latest END) as latestEvent
WHERE latestEvent.activity.eventType = $eventType
```
