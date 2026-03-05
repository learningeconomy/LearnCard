# LearnCard SDK

## Tooling

- When vexp MCP is available, prefer `run_pipeline` for complex cross-cutting searches (impact analysis, multi-file refactors)
- For simple lookups (specific file, function, grep for a pattern), use built-in tools (Grep, Glob, Read) directly — they're faster and more reliable
- vexp is optional — if it errors or is unavailable, fall back to built-in tools

## Build & Test Commands

- Build project: `pnpm build` or `pnpm exec nx build <package-name>`
- Test all packages: `pnpm test` or `pnpm exec nx test`
- Run tests once (non-watch): `pnpm test -- run` (equivalent to `vitest run`)
- Run single test: `pnpm exec nx test <package-name> --testFile=path/to/test.spec.ts`
- Run e2e tests: `pnpm exec nx test:e2e e2e`

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces in dedicated type files
- **Imports**: Prefer named imports; avoid default exports when possible
- **Formatting**: Follow Prettier config; 4-space indentation for JSX
- **Naming**: PascalCase for classes/interfaces/types/components, camelCase for variables/functions/methods, ALL_CAPS for constants
- **Error handling**: Use try/catch with specific error types
- **Functions**: Prefer arrow functions with explicit return types
- **React**: Function components with hooks preferred over class components
- **Modules**: Keep files focused on single responsibility
- **Documentation**: Add JSDoc comments for public APIs and complex logic

## Monorepo Structure

pnpm workspaces + NX. Packages in `packages/`, services in `services/`, apps in `apps/`, e2e tests in `tests/`.

## Documentation (`docs/`)

GitBook docs synced to docs.learncard.com. Diataxis framework: tutorials in `docs/tutorials/`, how-to guides in `docs/how-to-guides/`, reference in `docs/sdks/`, concepts in `docs/core-concepts/`.

Key editing rules:
- GitBook-flavored markdown (`{% tabs %}`, `{% hint %}`, `{% content-ref %}`)
- Use `@learncard/init` for initialization (not `@learncard/core`)
- API patterns: `learnCard.invoke.*` for methods, `learnCard.id.did()` for DID access
- Internal links use relative paths

## Architecture Reference

For detailed architecture, read the relevant AGENTS.md when working in that area:

| Area | File | What's there |
|------|------|-------------|
| Plugin system, network routes, credential storage | `AGENTS.md` (root) | Plugin architecture, adding routes, 3-layer storage model |
| Brain service (Neo4j, tRPC, ConsentFlow, revocation) | `services/learn-card-network/brain-service/AGENTS.md` | Neo4j data model, tRPC routes, ConsentFlow, signing authorities, revocation, tracing |
| Partner Connect SDK | `packages/learn-card-partner-connect-sdk/AGENTS.md` | Security model, message lifecycle, adding methods |
| App Store examples | `examples/app-store-apps/AGENTS.md` | Example app patterns, Astro + Partner Connect stack |
| ScoutPass app | `apps/scouts/AGENTS.md` | Troop/Scout hierarchy, credential status, key components |
| LearnCard app (E2E testing, architecture) | `apps/learn-card-app/AGENTS.md` | Playwright E2E test setup, auth, Ionic modal gotchas, credential flows |

## Quick Reference — Common Patterns

```typescript
// Network plugin methods (tRPC client under the hood)
learnCard.invoke.createProfile(...)
learnCard.invoke.acceptCredential(uri)
learnCard.invoke.getRevokedCredentials()

// Control planes
learnCard.read.get(uri)                          // Resolve credential content
learnCard.index.LearnCloud.get({ category })     // Personal wallet index (MongoDB)
learnCard.index.LearnCloud.add(record)           // Add to personal index
learnCard.store.LearnCloud.uploadEncrypted(vc)   // Store credential

// Key locations
// Types:          packages/learn-card-types/src/lcn.ts
// Brain routes:   services/learn-card-network/brain-service/src/routes/
// Network plugin: packages/plugins/learn-card-network/src/plugin.ts
// React Query:    packages/learn-card-base/src/react-query/
```
<<<<<<< HEAD
=======

### Connections

```typescript
useGetConnections()           // All connections
useGetPaginatedConnections()  // Paginated connections
```

## Common Debugging Tips

### Check Docker Logs

```bash
docker logs lcn-brain-service --tail 100 -f
```

### Check Connection Sources

```cypher
MATCH (p:Profile {profileId: 'some-id'})-[r:CONNECTED_WITH]-(other)
RETURN other.profileId, r.sources
```

### Check Credential Status

```cypher
MATCH (c:Credential)-[r:CREDENTIAL_RECEIVED]->(p:Profile {profileId: 'some-id'})
RETURN c.id, r.status, r.revokedAt
```

## Credential Storage Architecture

Understanding where credentials are stored is crucial for debugging and feature development. LearnCard has **three storage layers**, each serving different purposes.

### The Three Storage Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S WALLET VIEW                           │
│                    (Membership Page, IDs Tab)                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: LearnCloud Personal Index (MongoDB)                      │
│  Service: learn-cloud-service                                       │
│  Collection: CredentialRecord                                       │
│  Purpose: User's personal wallet - what they SEE in the app        │
│  Owner: User (authenticated via DID)                                │
│  Access: wallet.index.LearnCloud.get({ uri })                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                     (populated by frontend on claim)
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Brain Service Network Index (Neo4j)                      │
│  Service: brain-service                                             │
│  Relationship: CREDENTIAL_RECEIVED                                  │
│  Purpose: Network-level tracking of who received what               │
│  Owner: System (managed by brain-service)                           │
│  Access: wallet.invoke.getReceivedCredentials()                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                     (references credential content)
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Credential Storage (Various backends)                    │
│  Options: Brain storage, Ceramic, IPFS, S3                          │
│  Purpose: Actual VC JSON content                                    │
│  Access: wallet.read.get(uri)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Layer Details

#### Layer 1: LearnCloud Personal Index (MongoDB)

**Location**: `services/learn-cloud-service`

**What it stores**:
```typescript
interface CredentialRecord {
  id: string;           // Unique record ID
  uri: string;          // Credential URI (e.g., "lc:credential:...")
  category: string;     // "ID", "Achievement", etc.
  // ... other metadata
}
```

**Key characteristics**:
- **User-owned**: Only the user can add/remove from their index
- **Frontend-populated**: When user claims a credential, frontend calls `wallet.index.LearnCloud.add()`
- **What shows in Membership page**: Queries like `useGetIDs` read from this

**Access pattern**:
```typescript
// Add to index (on claim)
await wallet.index.LearnCloud.add(credentialRecord);

// Query index
const records = await wallet.index.LearnCloud.get({ category: 'ID' });

// Remove from index
await wallet.index.LearnCloud.remove(recordId);
```

#### Layer 2: Brain Service Network Index (Neo4j)

**Location**: `services/learn-card-network/brain-service`

**What it stores**:
```
(Profile)-[:CREDENTIAL_SENT]->(Credential)-[:CREDENTIAL_RECEIVED]->(Profile)
```

**Key characteristics**:
- **System-managed**: Brain-service controls this based on send/receive actions
- **Source of truth for status**: `status` property = `null`, `'pending'`, or `'revoked'`
- **Used for member lists**: "Who received this boost?" queries this

**Key functions**:
- `getReceivedCredentialsForProfile()` - What credentials did this user receive?
- `getBoostRecipients()` - Who received this boost?
- `revokeCredentialReceived()` - Mark credential as revoked

#### Layer 3: Credential Storage

**What it stores**: The actual Verifiable Credential JSON

**Access pattern**:
```typescript
// Resolve credential content from URI
const vc = await wallet.read.get(uri);
```

### Credential Lifecycle Flow

```
1. ISSUE: Admin creates boost and sends to user
   ├── Brain: Creates CREDENTIAL_SENT relationship
   └── Storage: VC JSON stored

2. CLAIM: User accepts the credential
   ├── Brain: Creates CREDENTIAL_RECEIVED relationship (status=null)
   └── LearnCloud: Frontend adds to user's personal index

3. DISPLAY: User views Membership page
   ├── LearnCloud: useGetIDs() queries personal index
   ├── Storage: wallet.read.get() fetches VC content
   └── Brain: (optional) check status via getReceivedCredentials

4. REVOKE: Admin revokes user's credential
   ├── Brain: Sets CREDENTIAL_RECEIVED.status = 'revoked'
   └── LearnCloud: Frontend sync removes from personal index
```

### Common Queries by Layer

| Use Case | Layer | Query |
|----------|-------|-------|
| Show user's IDs on Membership page | LearnCloud | `wallet.index.LearnCloud.get({ category: 'ID' })` |
| Show troop member list | Brain | `getBoostRecipients(boostId)` |
| Get credential content | Storage | `wallet.read.get(uri)` |
| Check if user received credential | Brain | `getCredentialReceivedByProfile(credId, profile)` |
| Remove credential from user's view | LearnCloud | `wallet.index.LearnCloud.remove(recordId)` |

### Why Two Indexes?

**Q: Why not just use brain-service for everything?**

The brain-service stores the *network view* (who sent what to whom). The LearnCloud index stores the *user view* (user's personal wallet). They can differ:

- User might have credentials from outside the LearnCard Network
- User might want to hide certain credentials
- User might sync credentials from Ceramic
- Privacy: LearnCloud is user-authenticated, brain-service is system-authenticated

**Q: Why doesn't brain-service update LearnCloud directly on revoke?**

Brain-service doesn't have the user's authentication context. Only the user (via their wallet in the frontend) can modify their LearnCloud index. That's why we need frontend sync hooks.

### Debugging Tips

**"Credential shows in brain-service but not in Membership page"**
→ Check LearnCloud index: `wallet.index.LearnCloud.get({ uri })`

**"Credential shows in Membership page but is revoked"**
→ Run `useSyncRevokedCredentials()` to sync

**"Credential in member list but user says they don't have it"**
→ Check if they claimed it (CREDENTIAL_RECEIVED.status should be null, not 'pending')



### Two-Tier Storage Architecture

User credentials are stored in two places:

| Layer | Service | Technology | Purpose |
|-------|---------|------------|---------|
| **Network Index** | brain-service | Neo4j | `CREDENTIAL_RECEIVED` relationship - source of truth for credential status |
| **Personal Index** | learn-cloud-service | MongoDB | User's personal wallet index - what shows on Membership page |

**Important**: The brain-service cannot directly modify the learn-cloud index (it's user-authenticated). Frontend sync is required.

### Backend Filtering

When querying received credentials, the brain-service filters out revoked credentials:

**File**: `services/learn-card-network/brain-service/src/accesslayer/credential/read.ts`

```typescript
// getReceivedCredentialsForProfile now filters revoked
.where('received.status IS NULL OR received.status <> "revoked"')
```

### getRevokedCredentials Endpoint

New endpoint to query which credentials have been revoked for the current user:

```typescript
// In credentials.ts router
getRevokedCredentials: profileRoute
    .input(z.object({}).default({}))
    .output(z.array(z.string()))
    .query(async ({ ctx }) => {
        return getRevokedCredentialUrisForProfile(ctx.domain, ctx.user.profile);
    });
```

Returns an array of credential URIs that have `status='revoked'` for the authenticated user.

### Frontend Sync Hook

**File**: `packages/learn-card-base/src/react-query/queries/vcQueries.ts`

```typescript
export const useSyncRevokedCredentials = (enabled = true) => {
    // 1. Fetch revoked credential URIs from brain-service
    const revokedUris = await wallet.invoke.getRevokedCredentials();
    
    // 2. For each revoked URI, remove from learn-cloud index
    for (const uri of revokedUris) {
        const records = await wallet.index.LearnCloud.get({ uri });
        if (records?.length > 0) {
            await wallet.index.LearnCloud.remove?.(records[0]!.id);
        }
    }
    
    // 3. Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ['useGetIDs'] });
};
```

### Integration in Apps

Add to top-level component (e.g., `AppRouter.tsx`):

```typescript
import { useSyncRevokedCredentials } from 'learn-card-base';

// In component, alongside other sync hooks
useSyncConsentFlow(enablePrefetch);
useSyncRevokedCredentials(enablePrefetch);  // Add this
```

### Key Files Summary

| File | Purpose |
|------|---------|
| `brain-service/src/accesslayer/credential/read.ts` | `getReceivedCredentialsForProfile` filters revoked, `getRevokedCredentialUrisForProfile` queries revoked |
| `brain-service/src/routes/credentials.ts` | `getRevokedCredentials` endpoint |
| `learn-card-base/src/react-query/queries/vcQueries.ts` | `useSyncRevokedCredentials` hook |
| `apps/scouts/src/AppRouter.tsx` | Hook integration in ScoutPass |

## Self-Issued Credentials Bug (Fixed Feb 2026)

### Problem

When a user self-issues a credential (e.g., creating a Global Network and receiving their own Global Admin ID), the credential was showing "Pending Acceptance" instead of being automatically accepted.

### Root Cause

The `handleIssueBoost` function in several CMS components was calling `sendBoostCredential()` but NOT calling `acceptCredential()` for the self-boosting case. This created only a `CREDENTIAL_SENT` relationship in Neo4j, but no `CREDENTIAL_RECEIVED` relationship.

### The Fix

Added `wallet.invoke.acceptCredential(sentBoostUri)` after `sendBoostCredential` in these files:
- `apps/scouts/src/components/troopsCMS/TroopsCMS.tsx`
- `apps/scouts/src/components/boost/boostCMS/BoostCMS.tsx`
- `apps/scouts/src/components/boost/boostCMS/UpdateBoostCMS.tsx`

### Pattern (Correct)

```typescript
// Self-boosting flow
if (profileId === currentLCNUser?.profileId) {
    const { sentBoost, sentBoostUri } = await sendBoostCredential(
        wallet,
        profileId,
        boostUri
    );

    // REQUIRED: Accept the credential on LCN so it's not stuck in "pending" state
    await wallet.invoke.acceptCredential(sentBoostUri);

    // Store in personal index
    const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);
    await addCredentialToWallet({ uri: issuedVcUri });
}
```

### Backfill Script for Production

For credentials already self-issued before the fix, run this Cypher in Neo4j:

```cypher
// Backfill CREDENTIAL_RECEIVED for self-issued credentials
// Run with caution - test on staging first!

// DRY RUN: Find self-issued credentials missing CREDENTIAL_RECEIVED
MATCH (c:Credential)-[sent:CREDENTIAL_SENT]->(p:Profile)
WHERE c.issuerId = p.did
  AND NOT EXISTS((c)-[:CREDENTIAL_RECEIVED]->(p))
RETURN count(c) as credentials_to_backfill, collect(c.id)[..10] as sample_ids;

// EXECUTE: Create missing CREDENTIAL_RECEIVED relationships
MATCH (c:Credential)-[sent:CREDENTIAL_SENT]->(p:Profile)
WHERE c.issuerId = p.did
  AND NOT EXISTS((c)-[:CREDENTIAL_RECEIVED]->(p))
MERGE (c)-[received:CREDENTIAL_RECEIVED]->(p)
ON CREATE SET 
    received.date = sent.date,
    received.uri = sent.uri,
    received.status = null  // null = claimed/accepted
RETURN count(received) as backfilled_count;
```

**Alternative: Match by boost category (Global Admin IDs only)**

```cypher
// More targeted: Only Global Admin ID credentials
MATCH (b:Boost)<-[:CREDENTIAL_FOR]-(c:Credential)-[sent:CREDENTIAL_SENT]->(p:Profile)
WHERE b.category = 'globalAdminId'
  AND c.issuerId = p.did
  AND NOT EXISTS((c)-[:CREDENTIAL_RECEIVED]->(p))
MERGE (c)-[received:CREDENTIAL_RECEIVED]->(p)
ON CREATE SET 
    received.date = sent.date,
    received.uri = sent.uri,
    received.status = null
RETURN count(received) as backfilled_count;
```

### Verification Query

```cypher
// Check status of self-issued credentials after backfill
MATCH (c:Credential)-[sent:CREDENTIAL_SENT]->(p:Profile)
WHERE c.issuerId = p.did
OPTIONAL MATCH (c)-[received:CREDENTIAL_RECEIVED]->(p)
RETURN 
    c.id as credential_id,
    p.profileId as profile_id,
    sent IS NOT NULL as has_sent,
    received IS NOT NULL as has_received,
    received.status as received_status
LIMIT 20;
```


## Privacy Preferences & Age-Gate System

The app enforces GDPR/COPPA-compliant privacy controls based on user age and country. Minors have AI features, analytics, and bug reporting disabled by default; adults can toggle them freely.

### Preference Fields (MongoDB via lca-api)

Stored in the `preferences` collection alongside the existing `theme` field:

| Field | Type | Default (adults) | Default (minors) | Purpose |
|-------|------|-------------------|-------------------|---------|
| `aiEnabled` | boolean? | `true` | `false` | User's AI features toggle |
| `aiAutoDisabled` | boolean? | `false` | `true` | System flag: was AI auto-disabled at signup? |
| `analyticsEnabled` | boolean? | `true` | `false` | Firebase Analytics toggle |
| `analyticsAutoDisabled` | boolean? | `false` | `true` | System flag: was analytics auto-disabled? |
| `bugReportsEnabled` | boolean? | `true` | `false` | Sentry bug reports toggle |
| `isMinor` | boolean? | `false` | `true` | Cached minor status (age < threshold) |

**Schema**: `services/learn-card-network/lca-api/src/models/Preferences.ts`
**Routes**: `services/learn-card-network/lca-api/src/routes/preferences.ts` (tRPC: `createPreferences`, `updatePreferences`, `getPreferencesForDid`)
**Tests**: `services/learn-card-network/lca-api/test/preferences.spec.ts`

### GDPR Age Thresholds

**File**: `packages/learn-card-base/src/constants/gdprAgeLimits.ts`

```typescript
getMinorAgeThreshold(countryCode?: string): number
// EU countries → GDPR age-of-consent (13–16 by country)
// Non-EU / undefined → 18
```

**Important**: Do NOT use `getGdprAgeLimit()` from the app's local `gdpr.ts` for minor determination. That function returns `DEFAULT_EU_AGE_LIMIT` (16) for non-EU countries and is only correct for the EU parental consent modal during onboarding. Always use `getMinorAgeThreshold()` from `learn-card-base` for age-gate logic.

Country-specific thresholds:

| Country | Code | Age |
|---------|------|-----|
| Sweden | SE | 13 |
| Ireland | IE | 13 |
| Spain | ES | 14 |
| Austria | AT | 14 |
| Italy | IT | 14 |
| France | FR | 15 |
| Germany | DE | 16 |
| Netherlands | NL | 16 |
| Other EU | — | 16 (default) |
| Non-EU | — | 18 |

### Frontend Hooks

#### `usePrivacyGate` (`packages/learn-card-base/src/hooks/usePrivacyGate.ts`)

Runs on app load (called in `AppRouter.tsx`). On first run, auto-initializes all preference fields based on age/country. Also notifies the analytics system via `onAnalyticsChange` callback whenever `analyticsEnabled` changes.

```typescript
usePrivacyGate({ onAnalyticsChange: (enabled: boolean) => void })
// Returns: { isMinor: boolean, preferences }
```

#### `useAiFeatureGate` (`packages/learn-card-base/src/hooks/useAiFeatureGate.ts`)

Point-of-use gate for AI features. Includes a local DOB fallback so minors are blocked even before preferences have been persisted.

```typescript
useAiFeatureGate()
// Returns: { isAiEnabled: boolean, isLoading: boolean, reason: AiFeatureGateReason }
// reason: 'enabled' | 'disabled_by_user' | 'disabled_minor' | 'loading'
```

### UI Integration Points

| File | What it does |
|------|-------------|
| `AppRouter.tsx` | Calls `usePrivacyGate({ onAnalyticsChange })` to init preferences and gate Firebase Analytics |
| `PrivacySettingsPage.tsx` / `PrivacySettingsModal.tsx` | Three toggles (AI, Analytics, Bug Reports); locked for minors with amber warning |
| `LaunchPad.tsx` | AI tab shows "AI Apps Unavailable" banner when `!isAiEnabled` |
| `LaunchPadActionModal.tsx` | Filters out AI action buttons when `!isAiEnabled` |
| `AiSessionsContainer.tsx`, `AiInsights.tsx`, `AiPassportPersonalizationContainer.tsx`, `AiTutorConnectedView.tsx` | Wrapped in `<AiFeatureGate>` component |
| `SideMenuSecondaryLinks.tsx` | Intercepts AI nav links, shows toast when `!isAiEnabled` |
| `sentry.ts` (`useSentryIdentify`) | Reads `bugReportsEnabled` preference; clears Sentry user when disabled |
| `OnboardingNetworkForm.tsx` | Initializes preferences immediately after profile creation using `getMinorAgeThreshold(country)` |

### Data Flow

```
1. SIGNUP (OnboardingNetworkForm.tsx):
   ├── Creates profile with DOB + country
   └── Calls updatePreferences({ aiEnabled, analyticsEnabled, bugReportsEnabled, isMinor, ... })

2. APP LOAD (AppRouter.tsx):
   ├── usePrivacyGate runs → checks if preferences need first-run initialization
   ├── If aiAutoDisabled/analyticsAutoDisabled are undefined → initializes based on age
   └── Notifies Firebase Analytics via onAnalyticsChange callback

3. FEATURE GATE (any component):
   ├── useAiFeatureGate() → checks child profile, DOB fallback, then stored preferences
   └── <AiFeatureGate> component wraps AI views with disabled state

4. USER SETTINGS (PrivacySettingsPage.tsx):
   ├── Shows toggles; minors see locked state
   └── Calls updatePreferences({ field: newValue }) on toggle
```

### Testing Preferences Backend

```bash
cd services/learn-card-network/lca-api
pnpm test -- preferences.spec.ts
```

Please read AGENTS.md
>>>>>>> origin/main
