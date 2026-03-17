# LearnCard Cross-Cutting Architecture

## LearnCard Plugin System

LearnCard uses a modular plugin system. Each plugin provides functionality through:
- **Control Planes**: Standardized interfaces (`read`, `store`, `index`, `cache`, `id`, `context`)
- **Methods**: Custom functions exposed via `learnCard.invoke.*`

### Control Planes

| Plane | Purpose | Example |
|-------|---------|---------|
| Read | Retrieve credentials/data | `learnCard.read.get(uri)` |
| Store | Store/upload credentials | `learnCard.store.LearnCloud.uploadEncrypted(vc)` |
| Index | Query indexed data | `learnCard.index.LearnCloud.get({ category })` |
| Cache | Temporary storage | `learnCard.cache.getItem(key)` |
| Id | Identity (DIDs, keypairs) | `learnCard.id.did()` |
| Context | Resolve context documents | `learnCard.context.resolve(url)` |

### Plugin Interface

```typescript
Plugin<Name, ControlPlanes, Methods, DependentControlPlanes, DependentMethods>
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

- **Service**: `services/learn-cloud-service`
- **Purpose**: User's personal wallet — what they SEE in the app
- **Owner**: User (authenticated via DID)
- **Access**: `wallet.index.LearnCloud.get/add/remove`
- **Populated by**: Frontend on credential claim

### Layer 2: Brain Service Network Index (Neo4j)

- **Service**: `services/learn-card-network/brain-service`
- **Purpose**: Network-level tracking of who received what
- **Relationship**: `(Profile)-[:CREDENTIAL_SENT]->(Credential)-[:CREDENTIAL_RECEIVED]->(Profile)`
- **Status values**: `null` (claimed), `'pending'` (sent, not accepted), `'revoked'`
- **Access**: `wallet.invoke.getReceivedCredentials()`

### Layer 3: Credential Storage (Various backends)

- **Options**: Brain storage, Ceramic, IPFS, S3
- **Purpose**: Actual VC JSON content
- **Access**: `wallet.read.get(uri)`

### Why Two Indexes?

Brain-service stores the *network view* (who sent what to whom). LearnCloud stores the *user view* (personal wallet). They can differ because:
- Users may have credentials from outside the network
- Users may hide certain credentials
- Brain-service can't modify LearnCloud (it's user-authenticated)
- Frontend sync hooks bridge the gap (e.g., `useSyncRevokedCredentials`)

### Credential Lifecycle

```
ISSUE  → Brain: CREDENTIAL_SENT + Storage: VC JSON stored
CLAIM  → Brain: CREDENTIAL_RECEIVED (status=null) + LearnCloud: frontend adds to index
DISPLAY → LearnCloud: useGetIDs() + Storage: wallet.read.get()
REVOKE → Brain: status='revoked' + LearnCloud: frontend sync removes
```

### Common Queries

| Use Case | Layer | Query |
|----------|-------|-------|
| User's IDs on Membership page | LearnCloud | `wallet.index.LearnCloud.get({ category: 'ID' })` |
| Troop member list | Brain | `getBoostRecipients(boostId)` |
| Credential content | Storage | `wallet.read.get(uri)` |
| Check if user received credential | Brain | `getCredentialReceivedByProfile(credId, profile)` |

### Debugging

- **Shows in brain but not Membership page** → Check LearnCloud index
- **Shows in Membership page but is revoked** → Run `useSyncRevokedCredentials()`
- **In member list but user says they don't have it** → Check CREDENTIAL_RECEIVED.status (null vs 'pending')

## Frontend Query Hooks

Located in `packages/learn-card-base/src/react-query/queries/`.

```typescript
// Boost recipients (excludes revoked always)
useGetBoostRecipients(boostUri, enabled, includeUnacceptedBoosts=false)
useCountBoostRecipients(uri, enabled, includeUnacceptedBoosts=false)

// Connections
useGetConnections()
useGetPaginatedConnections()
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

| Layer | Components | Required | Purpose |
| ----- | ---------- | -------- | ------- |
| **0 — Core** | Private Key → DID → Wallet | **yes** | Everything depends on this |
| **1 — Auth Session** | Auth Provider (Firebase) | no | Needed for SSS server ops |
| **2 — Network Identity** | LCN Profile | no | Needed for network interactions |

A user with a cached private key can use the wallet even without an active Firebase session.

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
