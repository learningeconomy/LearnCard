# LearnCard Cross-Cutting Architecture

## LearnCard Plugin System

LearnCard uses a modular plugin system. Each plugin provides functionality through:

-   **Control Planes**: Standardized interfaces (`read`, `store`, `index`, `cache`, `id`, `context`)
-   **Methods**: Custom functions exposed via `learnCard.invoke.*`

### Control Planes

| Plane   | Purpose                   | Example                                          |
| ------- | ------------------------- | ------------------------------------------------ |
| Read    | Retrieve credentials/data | `learnCard.read.get(uri)`                        |
| Store   | Store/upload credentials  | `learnCard.store.LearnCloud.uploadEncrypted(vc)` |
| Index   | Query indexed data        | `learnCard.index.LearnCloud.get({ category })`   |
| Cache   | Temporary storage         | `learnCard.cache.getItem(key)`                   |
| Id      | Identity (DIDs, keypairs) | `learnCard.id.did()`                             |
| Context | Resolve context documents | `learnCard.context.resolve(url)`                 |

### Plugin Interface

```typescript
Plugin<Name, ControlPlanes, Methods, DependentControlPlanes, DependentMethods>;
```

Plugins depend on other plugins via `DependentControlPlanes` and `DependentMethods`. Order matters during initialization.

### Standard Plugin Stack (seed-based init)

DynamicLoader → Crypto → DidKit → DidKey → Encryption → VC → VCTemplates → Ceramic → LearnCloud → IDX → Expiration → Ethereum → Vpqr → CHAPI → LearnCard

Network-enabled init adds: VerifyBoost → LearnCardNetwork

### Initialization

```typescript
import { initLearnCard } from '@learncard/init';

// Seed-based
const lc = await initLearnCard({ seed: '...' });

// Network-enabled
const lc = await initLearnCard({ seed: '...', network: true });
```

## Adding a New Network Route

Types flow: `@learncard/types` → brain-service tRPC router → brain-client → network plugin → `learnCard.invoke.*`

1. **Define types** in `packages/learn-card-types/src/lcn.ts` (Zod validators)
2. **Implement route** in `services/learn-card-network/brain-service/src/routes/` — add to `AppRouter`
3. **Brain client auto-types** — it imports `AppRouter` type, new route is typed automatically
4. **Expose in network plugin** — add method in `packages/plugins/learn-card-network/src/plugin.ts`
5. **Test** in `tests/e2e/` — `pnpm test:e2e`

## Credential Storage Architecture

Three storage layers serve different purposes:

### Layer 1: LearnCloud Personal Index (MongoDB)

-   **Service**: `services/learn-cloud-service`
-   **Purpose**: User's personal wallet — what they SEE in the app
-   **Owner**: User (authenticated via DID)
-   **Access**: `wallet.index.LearnCloud.get/add/remove`
-   **Populated by**: Frontend on credential claim

### Layer 2: Brain Service Network Index (Neo4j)

-   **Service**: `services/learn-card-network/brain-service`
-   **Purpose**: Network-level tracking of who received what
-   **Relationship**: `(Profile)-[:CREDENTIAL_SENT]->(Credential)-[:CREDENTIAL_RECEIVED]->(Profile)`
-   **Status values**: `null` (claimed), `'pending'` (sent, not accepted), `'revoked'`
-   **Access**: `wallet.invoke.getReceivedCredentials()`

### Layer 3: Credential Storage (Various backends)

-   **Options**: Brain storage, Ceramic, IPFS, S3
-   **Purpose**: Actual VC JSON content
-   **Access**: `wallet.read.get(uri)`

### Why Two Indexes?

Brain-service stores the _network view_ (who sent what to whom). LearnCloud stores the _user view_ (personal wallet). They can differ because:

-   Users may have credentials from outside the network
-   Users may hide certain credentials
-   Brain-service can't modify LearnCloud (it's user-authenticated)
-   Frontend sync hooks bridge the gap (e.g., `useSyncRevokedCredentials`)

### Credential Lifecycle

```
ISSUE  → Brain: CREDENTIAL_SENT + Storage: VC JSON stored
CLAIM  → Brain: CREDENTIAL_RECEIVED (status=null) + LearnCloud: frontend adds to index
DISPLAY → LearnCloud: useGetIDs() + Storage: wallet.read.get()
REVOKE → Brain: status='revoked' + LearnCloud: frontend sync removes
```

### Common Queries

| Use Case                          | Layer      | Query                                             |
| --------------------------------- | ---------- | ------------------------------------------------- |
| User's IDs on Membership page     | LearnCloud | `wallet.index.LearnCloud.get({ category: 'ID' })` |
| Troop member list                 | Brain      | `getBoostRecipients(boostId)`                     |
| Credential content                | Storage    | `wallet.read.get(uri)`                            |
| Check if user received credential | Brain      | `getCredentialReceivedByProfile(credId, profile)` |

### Debugging

-   **Shows in brain but not Membership page** → Check LearnCloud index
-   **Shows in Membership page but is revoked** → Run `useSyncRevokedCredentials()`
-   **In member list but user says they don't have it** → Check CREDENTIAL_RECEIVED.status (null vs 'pending')

## Frontend Query Hooks

Located in `packages/learn-card-base/src/react-query/queries/`.

```typescript
// Boost recipients (excludes revoked always)
useGetBoostRecipients(boostUri, enabled, (includeUnacceptedBoosts = false));
useCountBoostRecipients(uri, enabled, (includeUnacceptedBoosts = false));

// Connections
useGetConnections();
useGetPaginatedConnections();
```

## Self-Issued Credentials Pattern

When a user self-issues a credential (e.g., creating a network and receiving their own admin ID), you MUST call `acceptCredential` after `sendBoostCredential`:

```typescript
if (profileId === currentLCNUser?.profileId) {
    const { sentBoost, sentBoostUri } = await sendBoostCredential(wallet, profileId, boostUri);
    await wallet.invoke.acceptCredential(sentBoostUri); // REQUIRED
    const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);
    await addCredentialToWallet({ uri: issuedVcUri });
}
```

Without this, the credential shows "Pending Acceptance" because only CREDENTIAL_SENT exists (no CREDENTIAL_RECEIVED).

## AuthCoordinator Architecture

The AuthCoordinator is a unified state machine that coordinates authentication and key derivation across LearnCard applications. It replaces the previous ad-hoc Web3Auth flow with a composable, provider-agnostic system.

### 3-Layer Auth Model

| Layer                    | Components                 | Required | Purpose                         |
| ------------------------ | -------------------------- | -------- | ------------------------------- |
| **0 — Core**             | Private Key → DID → Wallet | **yes**  | Everything depends on this      |
| **1 — Auth Session**     | Auth Provider (Firebase)   | no       | Needed for SSS server ops       |
| **2 — Network Identity** | LCN Profile                | no       | Needed for network interactions |

A user with a cached private key can use the wallet even without an active Firebase session.

#### Feature Launch Flow

1. Partner app calls `launchFeature()` with path and optional prompt
2. Host navigates to specified feature
3. Optional data passed for feature initialization

### Development Guidelines for AI Assistants

#### When Working with Partner Connect SDK

**Add New SDK Methods:**

1. Define types in `src/types.ts`
2. Implement method in `PartnerConnect` class
3. Add JSDoc documentation with examples
4. Test with example applications

**Security Considerations:**

-   Never bypass origin validation
-   Always use structured error types
-   Validate query parameter overrides
-   Test with different deployment scenarios

**Common Patterns:**

-   Use `sendMessage()` for all host communication
-   Implement proper cleanup in error cases
-   Follow browser compatibility guidelines (avoid Node.js types)
-   Use environment variables for sensitive configuration

#### When Working with Example Apps

**Creating New Example Apps:**

1. Follow existing directory structure in `examples/app-store-apps/`
2. Use Astro + Tailwind + Partner Connect SDK stack
3. Implement proper error handling and user feedback
4. Include environment configuration and README

**Backend Integration:**

-   Use `@learncard/init` for credential operations
-   Store issuer seeds in environment variables only
-   Validate inputs with Zod schemas
-   Handle network-related errors gracefully

**Testing and Deployment:**

-   Test with staging and production LearnCard hosts
-   Verify origin validation works correctly
-   Test error scenarios (timeouts, user rejection, network issues)
-   Ensure proper cleanup on component unmount

## ScoutPass App-Specific Features (`apps/scouts/`)

> **Note**: The following sections document features and workarounds that are **specific to the ScoutPass application** (`apps/scouts/`). These do not apply to the general LearnCard App or SDK.

### ScoutPass Permissions & Workarounds

#### National Admin Troop View Access

**Problem**: National admins saw "ID Revoked" or "Pending Acceptance" when viewing troops they managed but didn't own. This was because `useTroopIDStatus` checks if the _current user_ is the recipient.

**Workaround**: `TroopPage.tsx` uses `hasParentAdminAccess` to bypass the `isRevokedOrPending` check. If a user has `canEditChildren` permissions on the parent network boost, they see full troop details regardless of their personal credential status.

**Implementation Details**:

-   **File**: `apps/scouts/src/pages/troop/TroopPage.tsx`
-   **Logic**: Checks if user has admin access to parent network before enforcing credential status checks
-   **Applies to**: ScoutPass only (NSO → Troop → Scout hierarchy)

#### Network Admin Scout ID Issuance

**Requirement**: Network admins (Directors) must be able to issue Scout IDs for troops under their managed networks.

**Implementation**:

-   **`troops.helpers.ts`**: `canIssueChildren` and `canRevokeChildren` for `network` and `global` roles set to `'*'` (previously excluded `scoutId`).
-   **`InviteSelectionModal.tsx`**: Allows selection between Leader ID and Scout ID for network admins with elevated permissions.

**Implementation Details**:

-   **Files**:
    -   `apps/scouts/src/components/troopsCMS/troops.helpers.ts`
    -   `apps/scouts/src/pages/troop/InviteSelectionModal.tsx`
-   **Logic**: Network admins can issue both Leader IDs and Scout IDs to troops they manage
-   **Applies to**: ScoutPass only (NSO → Troop → Scout hierarchy)

## Generic Form Inputs (`learn-card-base`)

The `packages/learn-card-base` package provides reusable, styled form components for use in LearnCard applications. Import from `learn-card-base`:

```typescript
import { TextInput, TextArea, Toggle, Checkbox, SelectInput, RadioGroup } from 'learn-card-base';
```

### Available Components

| Component     | Purpose                                  | Key Props                                                                      |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| `TextInput`   | Single-line text input (uses IonInput)   | `value`, `onChange`, `placeholder`, `type`, `disabled`, `startIcon`, `endIcon` |
| `TextArea`    | Multi-line text input (uses IonTextarea) | `value`, `onChange`, `placeholder`, `rows`, `autoGrow`, `disabled`             |
| `Toggle`      | Boolean toggle switch                    | `checked`, `onChange`, `label`, `labelPosition`, `size`                        |
| `Checkbox`    | Pill-style checkbox with label           | `checked`, `onChange`, `label`, `disabled`, `className`                        |
| `SelectInput` | Dropdown select                          | `value`, `onChange`, `options`, `placeholder`                                  |
| `RadioGroup`  | Radio button group                       | `value`, `onChange`, `options`                                                 |

### Usage Examples

```tsx
// TextInput with icons
<TextInput
    value={location}
    onChange={value => setLocation(value ?? '')}
    placeholder="Enter location"
    endIcon={<MapPin className="w-5 h-5" />}
/>

// TextArea for longer content
<TextArea
    value={description}
    onChange={value => setDescription(value ?? '')}
    placeholder="Describe your experience"
    rows={2}
/>

// Toggle with label
<Toggle
    checked={isEnabled}
    onChange={setIsEnabled}
    label="Enable feature"
    labelPosition="left"
    size="sm"
/>

// Checkbox pill (label + circle indicator)
<Checkbox
    checked={isCurrentJob}
    onChange={setIsCurrentJob}
    label="Current Job"
/>
```

### Adding New Form Components

1. Create component in `packages/learn-card-base/src/components/form-inputs/`
2. Export from `packages/learn-card-base/src/components/form-inputs/index.ts`
3. Follow existing patterns: use Ionic components, grayscale-100 backgrounds, rounded-[10px] styling

## Privacy Preferences & Age-Gate System

GDPR/COPPA-compliant privacy controls based on user age and country. Minors have AI, analytics, and bug reporting disabled by default.

### Key Files

| File                                                                     | Purpose                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `packages/learn-card-base/src/constants/gdprAgeLimits.ts`                | `getMinorAgeThreshold(countryCode?)` — returns 18 (non-EU) or GDPR age (13–16, EU)        |
| `packages/learn-card-base/src/hooks/usePrivacyGate.ts`                   | Auto-initializes preferences on first login based on age/country                          |
| `packages/learn-card-base/src/hooks/useAiFeatureGate.ts`                 | Point-of-use AI gate with local DOB fallback                                              |
| `services/learn-card-network/lca-api/src/models/Preferences.ts`          | MongoDB schema with `aiEnabled`, `analyticsEnabled`, `bugReportsEnabled`, `isMinor`, etc. |
| `services/learn-card-network/lca-api/src/routes/preferences.ts`          | tRPC routes: `createPreferences`, `updatePreferences`, `getPreferencesForDid`             |
| `apps/learn-card-app/src/pages/privacy-settings/PrivacySettingsPage.tsx` | Three-toggle settings UI; locked for minors                                               |

### Important

-   Always use `getMinorAgeThreshold()` from `learn-card-base` for minor determination — NOT `getGdprAgeLimit()` from the app's local `gdpr.ts` (that one returns 16 for non-EU, only correct for EU parental consent modals)
-   Preference fields: `aiEnabled`, `aiAutoDisabled`, `analyticsEnabled`, `analyticsAutoDisabled`, `bugReportsEnabled`, `isMinor` (all optional booleans)
-   See CLAUDE.md for full architectural details

### State Machine (10 states)

`idle` → `authenticating` → `authenticated` → `checking_key_status` → one of:

-   `needs_setup` (new user, no server record)
-   `needs_migration` (server has web3auth key)
-   `needs_recovery` (no local key / stale key)
-   `deriving_key` → `ready`

Also: `error` (with `canRetry` + `previousState`)

Private-key-first shortcut: `idle` → `deriving_key` → `ready` (from cached key)

### Key Interfaces

-   `AuthProvider` — Auth session abstraction (`getIdToken`, `getCurrentUser`, `signOut`)
-   `KeyDerivationStrategy` — Key split/reconstruct abstraction (`splitKey`, `reconstructKey`, `hasLocalKey`)
-   `AuthCoordinatorConfig` — Full configuration passed to `new AuthCoordinator()`

### Logout vs Forget Device

-   **`logout()`** — Signs out the auth provider, runs cleanup/onLogout callbacks, resets state to `idle`. **Preserves the device share** in IndexedDB so the user can reconstruct their key on re-login without recovery.
-   **`forgetDevice()`** — Calls `clearLocalKeys()` to wipe the device share from IndexedDB. Use this for "public computer" scenarios where the device should not remain trusted. Can be called before or after `logout()`.

### File Map

```
packages/learn-card-base/src/
├── auth-coordinator/
│   ├── AuthCoordinator.ts           — Core state machine class
│   ├── AuthCoordinatorProvider.tsx   — Base React provider + context
│   ├── createAuthCoordinatorApi.ts   — Default server API factory
│   ├── useAuthCoordinatorAutoSetup.ts — Auto handles needs_setup & needs_migration
│   ├── types.ts                      — Type definitions (re-exports from sss-key-manager)
│   ├── index.ts                      — Public exports
│   ├── README.md                     — Core reference with Mermaid diagrams
│   ├── INTEGRATION.md                — App integration guide
│   ├── RECOVERY.md                   — Recovery system guide
│   └── __tests__/
│       └── AuthCoordinator.test.ts   — 46+ unit tests
├── auth-providers/
│   ├── createFirebaseAuthProvider.ts — Firebase AuthProvider factory
│   └── index.ts
├── config/
│   └── authConfig.ts                 — Environment-driven config (getAuthConfig)
├── helpers/
│   └── indexedDBHelpers.ts           — clearAllIndexedDB (preserves lcb-sss-keys)
├── key-derivation/
│   └── createWeb3AuthStrategy.ts    — Web3Auth KeyDerivationStrategy (migration only)
└── hooks/
    ├── useRecoveryMethods.ts         — Recovery execution (password, passkey, phrase, backup)
    └── useRecoverySetup.ts           — Recovery setup (add methods, export backup)

packages/sss-key-manager/src/
├── types.ts              — Canonical shared types (AuthProvider, KeyDerivationStrategy, etc.)
├── sss-strategy.ts       — createSSSStrategy() factory
├── sss.ts                — Shamir split/reconstruct
├── storage.ts            — IndexedDB device share storage (lcb-sss-keys)
├── crypto.ts             — Argon2id KDF + AES-GCM encryption
├── passkey.ts            — WebAuthn passkey operations
├── recovery-phrase.ts    — Mnemonic phrase encode/decode (25 words)
└── atomic-operations.ts  — splitAndVerify, atomicShareUpdate

apps/learn-card-app/src/providers/
└── AuthCoordinatorProvider.tsx — LCA app wrapper (wallet, LCN profile, recovery UI)

apps/scouts/src/providers/
└── AuthCoordinatorProvider.tsx — Scouts app wrapper (wallet, LCN profile)
```

### Environment Variables

All auth-related env vars use the `VITE_` prefix for Vite compatibility and are read via `getAuthConfig()` in `config/authConfig.ts`.

-   `VITE_AUTH_PROVIDER`: `'firebase' | 'supertokens' | 'keycloak' | 'oidc'` (default: `'firebase'`)
-   `VITE_KEY_DERIVATION`: `'sss' | 'web3auth'` (default: `'sss'`)
-   `VITE_SSS_SERVER_URL`: Server URL for key share operations (default: `'http://localhost:5100/api'`)
-   `VITE_ENABLE_MIGRATION`: `'true' | 'false'` (default: `'false'`)
-   `VITE_ENABLE_EMAIL_BACKUP_SHARE`: `'true' | 'false'` (default: `'true'`)
-   `VITE_WEB3AUTH_CLIENT_ID`: Web3Auth client ID (per app, from dashboard)
-   `VITE_WEB3AUTH_NETWORK`: Web3Auth network (e.g. `'testnet'`, `'sapphire_mainnet'`)
-   `VITE_WEB3AUTH_VERIFIER_ID`: Web3Auth verifier name (e.g. `'learncardapp-firebase'`)
-   `VITE_WEB3AUTH_RPC_TARGET`: Ethereum RPC URL for Web3Auth private key provider (e.g. Infura endpoint)

### Detailed Documentation

See `packages/learn-card-base/src/auth-coordinator/README.md` for full state machine diagrams, sequence diagrams for every method, configuration reference, and server API contract. See `INTEGRATION.md` and `RECOVERY.md` in the same directory for app integration and recovery system guides.
