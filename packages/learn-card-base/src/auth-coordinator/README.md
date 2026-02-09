# AuthCoordinator

Unified state machine that coordinates **authentication** and **key derivation** across LearnCard applications. It replaces the previous ad-hoc Web3Auth flow with a composable, testable, provider-agnostic architecture.

## Design Goals

- **Provider-agnostic** — Works with any auth provider (Firebase, Supertokens, OIDC) and any key derivation strategy (SSS, Web3Auth).
- **Testable** — Pure state machine with injectable dependencies; 35+ unit tests cover every path.
- **Composable** — Base coordinator lives in `learn-card-base`; each app wraps it with app-specific logic (wallet init, LCN profile, overlays).
- **Private-key-first** — Can reach `ready` from a cached private key without an active auth session, enabling offline-first UX.

---

## Architecture: 3-Layer Auth Model

Each app's auth system is built from three independent layers:

```mermaid
graph TD
    subgraph "Layer 2 — Network Identity (optional)"
        LCN["LCN Profile<br/><i>needed for network interactions</i>"]
    end

    subgraph "Layer 1 — Auth Session (optional)"
        AUTH["Auth Provider (Firebase)<br/><i>needed for SSS server ops</i>"]
    end

    subgraph "Layer 0 — Core (required)"
        PK["Private Key"] --> DID["DID"]
        DID --> WALLET["Wallet (BespokeLearnCard)"]
    end

    WALLET -.->|"wallet.invoke.getProfile()"| LCN
    AUTH -.->|"getIdToken() for API calls"| PK

    style PK fill:#4f46e5,color:#fff
    style DID fill:#4f46e5,color:#fff
    style WALLET fill:#4f46e5,color:#fff
    style AUTH fill:#7c3aed,color:#fff
    style LCN fill:#9333ea,color:#fff
```

**Layer 0** is the only hard requirement. A user with a cached private key can use the wallet even if their Firebase session has expired. Layers 1 and 2 are checked opportunistically and tracked via `authSessionValid` and `lcnProfile`.

---

## State Machine

The coordinator manages 10 possible states. Every public method transitions between these states and fires `onStateChange` for each transition.

### States

| Status | Description | Key Fields |
|---|---|---|
| `idle` | No active auth session, no cached key | — |
| `authenticating` | Checking auth provider for current user | — |
| `authenticated` | Auth provider confirmed a user | `authUser` |
| `checking_key_status` | Querying server for key record + local key | — |
| `needs_setup` | New user, no server record exists | `authUser` |
| `needs_migration` | Server has `web3auth` key, must migrate to SSS | `authUser`, `web3AuthKey?` |
| `needs_recovery` | Server has key but local share missing/stale | `authUser`, `recoveryMethods[]` |
| `deriving_key` | Reconstructing or splitting private key | — |
| `ready` | Private key available, wallet can initialize | `authUser?`, `did`, `privateKey`, `authSessionValid` |
| `error` | Something failed | `error`, `canRetry`, `previousState?` |

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> authenticating : initialize()
    idle --> deriving_key : initialize() [cached PK exists]

    authenticating --> idle : no user found
    authenticating --> authenticated : user found
    authenticating --> idle : auth session expired

    authenticated --> checking_key_status : check server + local

    checking_key_status --> needs_setup : no server record
    checking_key_status --> needs_migration : server has web3auth
    checking_key_status --> needs_recovery : no local key / no auth share
    checking_key_status --> deriving_key : both keys present

    deriving_key --> ready : key reconstructed & DID matches
    deriving_key --> needs_recovery : DID mismatch (stale key)

    needs_setup --> deriving_key : setupNewKey()
    needs_migration --> deriving_key : migrate()
    needs_recovery --> deriving_key : recover()

    ready --> idle : logout()

    error --> idle : retry() [re-initialize]
    needs_setup --> error : failure
    needs_migration --> error : failure
    needs_recovery --> error : failure
    deriving_key --> error : failure
    authenticating --> error : unexpected failure
```

---

## `initialize()` — Decision Flowchart

This is the primary entry point. It runs automatically when the `AuthCoordinatorProvider` mounts.

```mermaid
flowchart TD
    START([initialize]) --> CACHED{getCachedPrivateKey<br/>configured?}

    CACHED -->|yes| PK_CHECK{Cached key<br/>exists?}
    CACHED -->|no| AUTH_START

    PK_CHECK -->|yes| DID_DERIVE[Derive DID from key]
    PK_CHECK -->|no| AUTH_START

    DID_DERIVE --> DID_OK{DID valid<br/>non-empty?}
    DID_OK -->|yes| AUTH_HEALTH[Check auth session<br/>opportunistically]
    DID_OK -->|no| AUTH_START

    AUTH_HEALTH --> READY_PK["✅ ready<br/>authSessionValid = !!authUser"]

    AUTH_START[authenticating] --> GET_USER[authProvider.getCurrentUser]
    GET_USER --> HAS_USER{User<br/>found?}

    HAS_USER -->|no| IDLE["idle"]
    HAS_USER -->|yes| AUTHED[authenticated]

    AUTHED --> CHECK[checking_key_status<br/>hasLocalKey + fetchServerKeyStatus]

    CHECK --> SRV_EXISTS{Server record<br/>exists?}
    SRV_EXISTS -->|no| SETUP["needs_setup"]

    SRV_EXISTS -->|yes| SRV_PROVIDER{keyProvider?}
    SRV_PROVIDER -->|web3auth| MIGRATION["needs_migration<br/>(+ getWeb3AuthKey)"]
    SRV_PROVIDER -->|sss| HAS_LOCAL{Has local<br/>key?}

    HAS_LOCAL -->|no| RECOVERY["needs_recovery"]
    HAS_LOCAL -->|yes| DERIVE[deriving_key<br/>reconstructKey]

    DERIVE --> HAS_SHARE{authShare<br/>exists?}
    HAS_SHARE -->|no| RECOVERY
    HAS_SHARE -->|yes| RECONSTRUCT[Reconstruct private key]

    RECONSTRUCT --> DID_MATCH{DID matches<br/>server?}
    DID_MATCH -->|yes| READY["✅ ready"]
    DID_MATCH -->|no| STALE[Clear stale local key]
    STALE --> RECOVERY

    style READY fill:#16a34a,color:#fff
    style READY_PK fill:#16a34a,color:#fff
    style IDLE fill:#6b7280,color:#fff
    style SETUP fill:#eab308,color:#000
    style MIGRATION fill:#f97316,color:#fff
    style RECOVERY fill:#ef4444,color:#fff
```

---

## Method Sequence Diagrams

### `setupNewKey(privateKey, did)`

Called by `useAuthCoordinatorAutoSetup` when state is `needs_setup`.

```mermaid
sequenceDiagram
    participant App as Auto-Setup Hook
    participant AC as AuthCoordinator
    participant KD as KeyDerivation (SSS)
    participant API as Server API

    App->>AC: setupNewKey(privateKey, did)
    AC->>AC: setState(deriving_key)
    AC->>KD: splitKey(privateKey)
    KD-->>AC: { localKey, remoteKey }
    AC->>KD: storeLocalKey(localKey)
    AC->>API: storeAuthShare(authProvider, remoteKey, did)
    AC->>AC: setState(ready)
    AC-->>App: UnifiedAuthState { status: 'ready' }
```

### `migrate(privateKey, did)`

Called by `useAuthCoordinatorAutoSetup` when state is `needs_migration`.

```mermaid
sequenceDiagram
    participant App as Auto-Setup Hook
    participant AC as AuthCoordinator
    participant KD as KeyDerivation (SSS)
    participant API as Server API

    App->>AC: migrate(web3AuthKey, did)
    AC->>AC: setState(deriving_key)
    AC->>KD: splitKey(privateKey)
    KD-->>AC: { localKey, remoteKey }
    AC->>KD: storeLocalKey(localKey)
    AC->>API: storeAuthShare(authProvider, remoteKey, did)
    AC->>API: markMigrated(authProvider)
    AC->>AC: setState(ready)
    AC-->>App: UnifiedAuthState { status: 'ready' }
```

### `recover(recoveryKey, did)`

Called by app-level recovery UI when state is `needs_recovery`.

```mermaid
sequenceDiagram
    participant UI as RecoveryFlowModal
    participant AC as AuthCoordinator
    participant KD as KeyDerivation (SSS)
    participant API as Server API

    UI->>AC: recover(recoveryKey, did)
    AC->>AC: setState(deriving_key)
    AC->>API: fetchServerKeyStatus(authProvider)
    API-->>AC: { authShare, primaryDid }

    alt No auth share
        AC->>AC: setState(error: "No auth share found")
    else Has auth share
        AC->>KD: reconstructKey(recoveryKey, authShare)
        KD-->>AC: privateKey

        alt DID mismatch
            AC->>AC: setState(error: "DID mismatch")
        else DID matches
            AC->>KD: splitKey(privateKey)
            KD-->>AC: { localKey, remoteKey }
            AC->>KD: storeLocalKey(localKey)
            AC->>API: storeAuthShare(authProvider, remoteKey, did)
            AC->>AC: setState(ready)
        end
    end

    AC-->>UI: UnifiedAuthState
```

### `logout()`

```mermaid
sequenceDiagram
    participant App
    participant AC as AuthCoordinator
    participant Auth as AuthProvider
    participant KD as KeyDerivation
    participant Cleanup as App onLogout

    App->>AC: logout()
    AC->>Auth: signOut()
    AC->>KD: clearLocalKeys()

    opt onLogout configured
        AC->>Cleanup: onLogout()
        Note over Cleanup: Clear stores, IndexedDB,<br/>localStorage, secure storage
    end

    AC->>AC: setState(idle)
```

### `retry()`

```mermaid
sequenceDiagram
    participant App
    participant AC as AuthCoordinator

    App->>AC: retry()

    alt Not in error state
        AC-->>App: current state (no-op)
    else In error state
        AC->>AC: Restore previousState (or idle)
        AC->>AC: initialize()
        AC-->>App: new UnifiedAuthState
    end
```

---

## Configuration Reference

### `AuthCoordinatorConfig`

| Field | Type | Required | Description |
|---|---|---|---|
| `authProvider` | `AuthProvider` | **yes** | Auth session manager (Firebase, Supertokens, etc.) |
| `keyDerivation` | `KeyDerivationStrategy` | **yes** | Key split/reconstruct implementation (SSS) |
| `api` | `AuthCoordinatorApi` | **yes** | Server API for key share operations |
| `onStateChange` | `(state) => void` | no | Callback fired on every state transition |
| `didFromPrivateKey` | `(pk) => Promise<string>` | no | Derives DID from private key; enables DID health checks |
| `getWeb3AuthKey` | `() => Promise<string \| null>` | no | Extracts legacy Web3Auth key for migration |
| `getCachedPrivateKey` | `() => Promise<string \| null>` | no | Enables private-key-first initialization path |
| `onLogout` | `() => Promise<void>` | no | App-specific cleanup after coordinator logout |

### `AuthCoordinatorApi`

| Method | Description |
|---|---|
| `fetchServerKeyStatus(authProvider)` | Returns `ServerKeyStatus`: exists, keyProvider, primaryDid, recoveryMethods, authShare |
| `storeAuthShare(authProvider, share, did)` | Stores the remote key component on the server |
| `markMigrated(authProvider)` | Marks the user as migrated from Web3Auth to SSS |

Default implementation: `createAuthCoordinatorApi(serverUrl)` — uses `fetch` with Bearer token auth against the SSS server endpoints.

### `KeyDerivationStrategy`

| Method | Description |
|---|---|
| `hasLocalKey()` | Check if device share exists |
| `getLocalKey()` | Retrieve device share |
| `storeLocalKey(key)` | Persist device share |
| `clearLocalKeys()` | Delete all local shares |
| `splitKey(privateKey)` | Split into `{ localKey, remoteKey }` |
| `reconstructKey(local, remote)` | Reconstruct private key from shares |
| `verifyKeys?(local, remote, did, didFn)` | Optional health check |

Default implementation: `createSSSStrategy()` from `@learncard/sss-key-manager`.

### `AuthProvider`

| Method | Description |
|---|---|
| `getIdToken()` | Returns a Bearer token for API calls |
| `getCurrentUser()` | Returns `AuthUser \| null` |
| `getProviderType()` | Returns `'firebase' \| 'supertokens' \| 'keycloak' \| 'oidc'` |
| `signOut()` | Signs the user out |

Default implementation: `createFirebaseAuthProvider({ getAuth, user, onSignOut })`.

---

## Server API Contract

`createAuthCoordinatorApi(serverUrl)` communicates with these endpoints:

### `POST /keys/auth-share` — Fetch key status

**Request:**
```json
{ "authToken": "<idToken>", "providerType": "firebase" }
```

**Response (200):**
```json
{
  "exists": true,
  "keyProvider": "sss",
  "primaryDid": "did:key:z...",
  "recoveryMethods": [{ "type": "password", "createdAt": "..." }],
  "authShare": { "encryptedData": "...", "encryptedDek": "", "iv": "" }
}
```

**Response (404):** Record not found → `{ exists: false }`

### `PUT /keys/auth-share` — Store/update auth share

**Request:**
```json
{
  "authToken": "<idToken>",
  "providerType": "firebase",
  "authShare": { "encryptedData": "<share>", "encryptedDek": "", "iv": "" },
  "primaryDid": "did:key:z...",
  "securityLevel": "basic"
}
```

### `POST /keys/migrate` — Mark migration complete

**Request:**
```json
{ "authToken": "<idToken>", "providerType": "firebase" }
```

---

## Error Handling

Errors are classified into two categories:

1. **Auth session gone** (expired token, no Firebase user) → returns to `idle`, not `error`. This is a normal state — the user simply isn't logged in.

2. **Unexpected failure** (network error, split failure, DID mismatch) → enters `error` state with:
   - `error`: human-readable message
   - `canRetry`: always `true` currently
   - `previousState`: the state before the error, enabling `retry()` to restore and re-initialize

---

## Testing

Unit tests are in `__tests__/AuthCoordinator.test.ts` (35 tests covering all paths).

```bash
# Run tests
pnpm --filter learn-card-base test

# Run in watch mode
pnpm --filter learn-card-base test:watch
```

Tests use mock factories for `AuthProvider`, `KeyDerivationStrategy`, and `AuthCoordinatorApi` — see the test file for patterns.

---

## File Map

```
packages/learn-card-base/src/auth-coordinator/
├── AuthCoordinator.ts           — Core state machine class
├── AuthCoordinatorProvider.tsx   — Base React provider + context
├── createAuthCoordinatorApi.ts   — Default server API factory
├── useAuthCoordinatorAutoSetup.ts — Auto handles needs_setup & needs_migration
├── types.ts                      — Type definitions (re-exports from sss-key-manager)
├── index.ts                      — Public exports
├── README.md                     — This file
├── INTEGRATION.md                — App integration guide
├── RECOVERY.md                   — Recovery system guide
└── __tests__/
    └── AuthCoordinator.test.ts   — Unit tests
```

## See Also

- [INTEGRATION.md](./INTEGRATION.md) — How to wire the coordinator into an app
- [RECOVERY.md](./RECOVERY.md) — Recovery methods, share lifecycle, hook APIs
