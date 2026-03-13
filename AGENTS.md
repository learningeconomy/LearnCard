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
