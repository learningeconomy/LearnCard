# LearnCard SDK Guide

## Build & Test Commands

-   Build project: `pnpm build` or `pnpm exec nx build <package-name>`
-   Test all packages: `pnpm test` or `pnpm exec nx test`
-   (Vitest packages) Run tests once (non-watch): `pnpm test -- run` (equivalent to `vitest run`)
-   Run single test: `pnpm exec nx test <package-name> --testFile=path/to/test.spec.ts`
-   Run e2e tests: `pnpm exec nx test:e2e e2e`

## Code Style Guidelines

-   **TypeScript**: Use strict typing with interfaces in dedicated type files
-   **Imports**: Prefer named imports; avoid default exports when possible
-   **Formatting**: Follow Prettier config; 4-space indentation for JSX
-   **Naming**:
    -   PascalCase for classes, interfaces, types, React components
    -   camelCase for variables, functions, methods, properties
    -   ALL_CAPS for constants
-   **Error handling**: Use try/catch with specific error types
-   **Functions**: Prefer arrow functions with explicit return types
-   **React**: Function components with hooks preferred over class components
-   **Modules**: Keep files focused on single responsibility
-   **Documentation**: Add JSDoc comments for public APIs and complex logic

## Monorepo Structure

The project uses pnpm workspaces and NX for monorepo management with packages organized in `packages/` directory, services in the `services/` directory, and end-to-end tests in the `tests/` directory

## Documentation (`docs/`)

The `docs/` folder contains **GitBook documentation** that is synced to [docs.learncard.com](https://docs.learncard.com). These docs follow the **Diátaxis framework**, which organizes documentation into four distinct types:

### Diátaxis Structure

| Type | Purpose | Location |
|------|---------|----------|
| **Tutorials** | Learning-oriented, hands-on lessons | `docs/tutorials/` |
| **How-To Guides** | Task-oriented, step-by-step recipes | `docs/how-to-guides/` |
| **Reference** | Information-oriented, technical descriptions | `docs/sdks/` |
| **Explanation** | Understanding-oriented, conceptual discussion | `docs/core-concepts/` |

### Key Files

- `docs/README.md` — Landing page (What is LearnCard?)
- `docs/SUMMARY.md` — Table of contents / sidebar navigation (GitBook uses this)
- `docs/quick-start/` — Getting started guides
- `docs/apps/` — User-facing app documentation (LearnCard App, ScoutPass)

### App Documentation (`docs/apps/`)

For changes to user-facing applications in `apps/`:

| App | Doc Location | Focus |
|-----|--------------|-------|
| LearnCard App | `docs/apps/learn-card-app/` | Claiming, sharing, wallet flows |
| ScoutPass | `docs/apps/scouts/` | NSO→Troop→Scout hierarchy, BoostIDs, badge issuance |

Use **Mermaid diagrams** for user flows (e.g., claim flow, share flow, permission flow).

### Editing Guidelines

- **GitBook syntax**: Docs use GitBook-flavored markdown with special directives like `{% tabs %}`, `{% hint %}`, `{% content-ref %}`
- **Code snippets**: Must be accurate and runnable. Use `@learncard/init` for initialization (not `@learncard/core`)
- **Links**: Internal links use relative paths. GitBook handles `/broken/pages/` placeholders automatically
- **Context URLs**: Use current versions (e.g., `https://ctx.learncard.com/boosts/1.0.3.json`)
- **API patterns**: Use `learnCard.invoke.*` for methods, `learnCard.id.did()` for DID access
- **Simplicity**: Avoid jargon. Spell out acronyms on first use. Keep examples minimal

### Testing Doc Changes

Docs are not programmatically tested. When editing:

1. Verify code snippets match the actual SDK API
2. Check that imports reference the correct packages
3. Ensure `await` is used with async operations like `addPlugin()`

## LearnCard Plugin System

LearnCard uses a modular plugin system to extend functionality in a composable way. Understanding this architecture is critical for development.

### Core Concepts

#### Plugins

-   Each plugin is a self-contained module that adds specific capabilities
-   Plugins follow a standard interface: `Plugin<Name, ControlPlanes, Methods, DependentControlPlanes, DependentMethods>`
-   Each plugin can provide functionality through:
    -   **Control Planes**: Standard interfaces like `read`, `store`, `index`, `cache`, `id`, and `context`
    -   **Methods**: Custom functions exposed through the `invoke` API

#### Control Planes

Control planes are standardized interfaces that plugins implement to provide core functionality:

-   **Read Plane**: For retrieving credentials and data
-   **Store Plane**: For storing and uploading credentials
-   **Index Plane**: For querying and managing indexed data
-   **Cache Plane**: For temporary data storage and retrieval
-   **Id Plane**: For identity management (DID methods, keypairs)
-   **Context Plane**: For resolving context documents

#### LearnCard Object

The main LearnCard object combines all plugins and exposes:

-   Access to control planes (e.g., `learnCard.read.get()`, `learnCard.store.upload()`)
-   Access to all plugin methods through the `invoke` property (e.g., `learnCard.invoke.createProfile()`)
-   The ability to add more plugins using `addPlugin()`

### Plugin Dependencies

-   Plugins can depend on other plugins through their `DependentControlPlanes` and `DependentMethods`
-   When initializing LearnCard, plugins must be added in the correct order to respect dependencies

### Initialization Process

The `@learncard/init` package provides several initialization methods:

#### Main Initialization Functions

-   `initLearnCard()`: The primary entry point with multiple overloads
-   Different configurations determine which plugins are included:
    -   Empty initialization
    -   Seed-based initialization
    -   Network-enabled initialization
    -   DID Web initialization

#### Standard Plugin Stack

When initializing with `seed` parameter, the following plugins are typically added (in order):

1. `DynamicLoaderPlugin`: Enables dynamic loading of dependencies
2. `CryptoPlugin`: Core cryptographic operations
3. `DidKitPlugin`: DID operations using DIDKit
4. `DidKeyPlugin`: Key management for DIDs
5. `EncryptionPlugin`: Data encryption and decryption
6. `VCPlugin`: Verifiable Credential operations
7. `VCTemplatesPlugin`: Template handling for VCs
8. `CeramicPlugin`: Integration with Ceramic Network
9. `LearnCloudPlugin`: LearnCard Cloud storage
10. `IDXPlugin`: Identity indexing
11. `ExpirationPlugin`: Credential expiration handling
12. `EthereumPlugin`: Ethereum blockchain integration
13. `VpqrPlugin`: QR code handling for presentations
14. `CHAPIPlugin`: Credential Handler API integration
15. `LearnCardPlugin`: Core LearnCard functionality

#### Network-Enabled Initialization

When initializing with `network` parameter, these additional plugins are added:

1. `VerifyBoostPlugin`: Verification of boost credentials
2. `LearnCardNetworkPlugin`: Integration with LearnCard Network

### Using the Plugin System

When developing new features or extending functionality:

1. Identify which control planes and methods your code needs
2. Ensure the appropriate plugins are available in your LearnCard instance
3. Access functionality through the appropriate plane or `invoke` method

## ConsentFlow Architecture

ConsentFlow is a consent management system that allows users to create and manage consent for data sharing:

### Key Components

-   **Profiles**: Create and consent to contracts
-   **Contracts**: Define data access requirements (read/write permissions)
-   **Terms**: Record a profile's consent to a contract
-   **Transactions**: Record actions against Terms (consent, withdraw, update, sync)
-   **Credentials**: Can be issued through contracts with auto-boosts or synced by consenters

### Transaction Types

-   **Consent**: Initial consent to a contract
-   **Update**: Modification of existing terms
-   **Withdraw**: Revocation of consent
-   **Sync**: Adding existing credentials to a contract in specific categories
-   **Write**: Recording credentials issued by contract owner

### Data Flow Between Packages

1. **LearnCard Network Plugin** (`packages/plugins/learn-card-network/`) provides the API for interacting with consent flow
2. **Brain Service** (`services/learn-card-network/brain-service/`) implements the backend logic
3. **End-to-end tests** are written in `tests/e2e/` to test the full flow

The workflow typically involves:

1. Creating a contract with specific data requirements
2. Users consenting to the contract with their own terms
3. Recording transactions for consent actions (consent, update, withdraw, sync)
4. Optionally issuing credentials via auto-boosts when a user consents
5. Users syncing existing credentials to the contract in specified categories

## Service-Level Boost Sending via Signing Authority

### Context

Some LearnCard workflows, such as sending a boost (credential) to another profile, require issuing a credential on behalf of the user. In SDK/plugin contexts, this is straightforward because the user's key material is available. However, when using HTTP service routes, the server does not have access to user key material for security reasons.

### Solution: Signing Authorities

To enable credential issuance via HTTP routes, the system supports **Signing Authorities**:

-   A Signing Authority is a registered external service that can sign credentials on behalf of a user/profile.
-   Users can create and register signing authorities, specifying an endpoint and a name.
-   When sending a boost via the service, the route can use the registered signing authority to issue (sign) the credential, then deliver it to the target profile.

### Example: `/boost/send/via-signing-authority` Route

-   **Input:** `{ profileId, boostUri, signingAuthority: { name, endpoint } }`
-   **Flow:**
    1. Fetch the boost by URI.
    2. Fetch the recipient profile.
    3. Prepare an unsigned VC for the recipient.
    4. Use the specified signing authority to sign the VC.
    5. Deliver the signed VC to the recipient via the network.
-   **Testing:** E2E tests can use fetch to POST directly to the route, after creating and registering a signing authority for the sender.

### Best Practices for AI Assistants

-   When designing service routes that require credential issuance, always check if key material is available. If not, require a signing authority.
-   Document the expected flow and security implications (e.g., never handle user keys server-side unless explicitly intended).
-   For E2E tests, prefer direct HTTP calls over plugin methods for service-only routes, and show how to set up signing authorities in test code.

## Network type flow and adding routes

This guide traces how types defined in `@learncard/types` move through the network services into the final `LearnCard` used in end-to-end tests. It also shows how to expose a new route on the `LearnCard` object.

### Type definitions

Network request and response shapes live in `@learncard/types`. For example, profile data is described with Zod validators that are exported for reuse across the stack【F:packages/learn-card-types/src/lcn.ts†L1-L78】.

### Brain service

The Brain service composes these validators into a tRPC `AppRouter` that defines all server routes【F:services/learn-card-network/brain-service/src/app.ts†L1-L56】. Individual routes import the shared validators to enforce input and output types. A profile creation example is shown below【F:services/learn-card-network/brain-service/src/routes/profiles.ts†L84-L126】.

### Brain client

`@learncard/network-brain-client` imports the `AppRouter` type and uses it to create a fully typed tRPC client. The client handles challenge/response authentication and exposes strongly typed methods for every route【F:packages/learn-card-network/brain-client/src/index.ts†L1-L60】.

### Network plugin

The LearnCard Network plugin creates a Brain client and exposes it through plugin methods. When added to a wallet, these methods become available via `learnCard.invoke.*`. The plugin also exports the raw client for advanced use【F:packages/plugins/learn-card-network/src/plugin.ts†L1-L52】【F:packages/plugins/learn-card-network/src/plugin.ts†L1068-L1075】.

### Initialization

`@learncard/init` assembles a standard plugin stack and finally adds the Network plugin so that network routes are available on any initialized wallet【F:packages/learn-card-init/src/initializers/networkLearnCardFromSeed.ts†L1-L83】.

### End-to-end tests

End-to-end tests create a network-enabled wallet with `initLearnCard` and call plugin methods such as `createProfile` to exercise the entire stack【F:tests/e2e/tests/init.spec.ts†L1-L25】.

### Plugin system

Plugins are merged into the LearnCard via `addPlugin`, which rebuilds the wallet with the new plugin list【F:packages/learn-card-core/src/wallet/base/wallet.ts†L50-L60】. Plugin methods are bound onto the `invoke` helper so they are accessible from the final `learnCard` instance【F:packages/learn-card-core/src/wallet/base/wallet.ts†L780-L807】.

### Adding a new network route

1. **Define types** in `packages/learn-card-types/src/lcn.ts`.
2. **Implement the server route** in `services/learn-card-network/brain-service/src/routes` using those validators and ensure it is added to the `AppRouter`.
3. **Rebuild the Brain client** – it consumes the exported `AppRouter` so the new route is typed automatically.
4. **Expose the route in the Network plugin** by adding a method that calls the new client procedure.
5. **Initialize** with `initLearnCard` (the Network plugin is included by default) and call the new method via `learnCard.invoke`.
6. **Test** the new route in `tests/e2e` using the top-level script: `pnpm test:e2e`.

These steps ensure types flow consistently from definition to testing and help avoid stale builds by relying on Nx-managed scripts.

## Partner Connect SDK Architecture

The `@learncard/partner-connect` SDK enables secure cross-origin communication between partner applications and the LearnCard host application via a clean Promise-based API.

### Core Architecture

#### Security Model
- **Multi-layered Origin Validation**: Strict origin matching with configurable whitelists
- **Protocol Verification**: Messages must match expected protocol version
- **Request ID Tracking**: Only tracked requests are processed to prevent replay attacks
- **No Wildcard Origins**: Never uses `'*'` as target origin for security

#### Message Lifecycle Management
1. **Request Generation**: Unique ID generation with collision prevention
2. **Message Queue**: Map-based tracking of pending requests with timeouts
3. **Central Listener**: Single event handler for all message types with origin validation
4. **Promise Resolution**: Automatic cleanup and response handling

#### Configuration Hierarchy
1. **Default**: `https://learncard.app` (security anchor)
2. **Query Parameter Override**: `?lc_host_override=https://staging.learncard.app`
3. **Configured Origin**: From `hostOrigin` option in SDK initialization

### Key Components

#### PartnerConnect Class (`packages/learn-card-partner-connect-sdk/src/index.ts`)
- **Factory Function**: `createPartnerConnect()` for clean initialization
- **Request Management**: Handles timeout, cleanup, and error states
- **Security Enforcement**: Multi-layer origin validation
- **Browser Compatibility**: SSR-safe with proper cleanup

#### Type System (`packages/learn-card-partner-connect-sdk/src/types.ts`)
- **Comprehensive TypeScript**: Full type coverage for all APIs
- **Structured Errors**: Specific error codes for different failure scenarios
- **Message Protocols**: Internal postMessage format definitions
- **Browser Types**: Uses browser-native types (not Node.js) for compatibility

### Example App Architecture

Partner Connect example apps follow a consistent pattern:

#### Frontend Architecture
- **Framework**: Astro for simple static hosting compatibility
- **SDK Integration**: Partner Connect SDK for host communication
- **UI Framework**: Tailwind CSS for rapid development
- **State Management**: Simple vanilla JavaScript state management

#### Backend Architecture
- **Actions**: Astro actions using `@learncard/init` for credential operations
- **Environment Variables**: Secure storage of issuer seeds and configuration
- **Validation**: Zod schemas for input validation
- **Error Handling**: Structured error responses

#### Security Patterns
- **Frontend**: Never expose private keys, validate user input
- **Backend**: Environment-based secrets, proper error handling
- **Communication**: Secure postMessage with origin validation

### Integration Patterns

#### Authentication Flow
1. Partner app calls `requestIdentity()`
2. User authenticates in LearnCard host
3. Host returns JWT token and user DID
4. Partner app validates token with backend

#### Credential Flow
1. Partner backend issues credential using `@learncard/init`
2. Partner frontend calls `sendCredential()` with issued credential
3. Host adds credential to user's wallet
4. Success response with credential ID

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
- Never bypass origin validation
- Always use structured error types
- Validate query parameter overrides
- Test with different deployment scenarios

**Common Patterns:**
- Use `sendMessage()` for all host communication
- Implement proper cleanup in error cases
- Follow browser compatibility guidelines (avoid Node.js types)
- Use environment variables for sensitive configuration

#### When Working with Example Apps

**Creating New Example Apps:**
1. Follow existing directory structure in `examples/app-store-apps/`
2. Use Astro + Tailwind + Partner Connect SDK stack
3. Implement proper error handling and user feedback
4. Include environment configuration and README

**Backend Integration:**
- Use `@learncard/init` for credential operations
- Store issuer seeds in environment variables only
- Validate inputs with Zod schemas
- Handle network-related errors gracefully

**Testing and Deployment:**
- Test with staging and production LearnCard hosts
- Verify origin validation works correctly
- Test error scenarios (timeouts, user rejection, network issues)
- Ensure proper cleanup on component unmount

## Credential Revocation System

### Purpose

The revocation system allows troop leaders (or credential issuers) to revoke credentials from scouts (recipients) when they leave a troop or should no longer have access. When a credential is revoked:

1. The scout is removed from member/recipient lists
2. Any permissions granted via claim hooks are reversed
3. Any connections created via auto-connect are cleaned up
4. The credential is marked as revoked (not deleted) for audit purposes

### Neo4j Data Model

#### Key Relationship: `CREDENTIAL_RECEIVED`

```
(Credential)-[:CREDENTIAL_RECEIVED]->(Profile)
```

Properties on the `CREDENTIAL_RECEIVED` relationship:

| Property | Type | Description |
|----------|------|-------------|
| `status` | string | `null` (claimed), `'pending'` (not yet accepted), `'revoked'` |
| `date` | datetime | When the credential was received/claimed |
| `revokedAt` | datetime | When the credential was revoked (if revoked) |

#### Key Relationship: `CONNECTED_WITH`

```
(Profile)-[:CONNECTED_WITH]->(Profile)
```

Properties:

| Property | Type | Description |
|----------|------|-------------|
| `sources` | string[] | Array of source keys like `['boost:uuid1', 'boost:uuid2']` |

### Filtering Queries

#### Get Recipients (Excluding Revoked)

```cypher
MATCH (c:Credential)-[r:CREDENTIAL_RECEIVED]->(p:Profile)
WHERE c.boostId = $boostId
  AND (r.status IS NULL OR r.status <> 'revoked')
  AND ($includeUnacceptedBoosts = true OR r.status IS NULL)
RETURN p
```

- `r.status IS NULL` = claimed/accepted credential
- `r.status = 'pending'` = sent but not accepted
- `r.status = 'revoked'` = revoked credential

#### Setting Revoked Status

The `revokeCredentialReceived` function uses MERGE to handle both claimed and pending credentials:

```cypher
MATCH (credential:Credential { id: $credentialId })
MATCH (profile:Profile { profileId: $profileId })
MERGE (credential)-[received:CREDENTIAL_RECEIVED]->(profile)
ON CREATE SET received.status = "revoked", received.revokedAt = $revokedAt, received.date = $revokedAt
ON MATCH SET received.status = "revoked", received.revokedAt = $revokedAt
```

### Revoke Hooks (`services/learn-card-network/brain-service/src/helpers/revoke-hooks.helpers.ts`)

When a credential is revoked, several cleanup operations are performed:

| Hook | Purpose |
|------|---------|
| `processPermissionsRevokeHooks` | Removes HAS_ROLE relationships granted via GRANT_PERMISSIONS claim hooks |
| `processAutoConnectRevokeHooks` | Removes AUTO_CONNECT_RECIPIENT relationships |
| `processAdminRevokeHooks` | Removes admin role relationships granted via ADD_ADMIN claim hooks |
| `processConnectionRevoke` | Removes CONNECTED_WITH relationships sourced from the boost |

### Connection Source Keys

Connections created via `autoConnectRecipients` or AUTO_CONNECT hooks are tagged with source keys:
- Pattern: `boost:${boostId}`
- Connections can have multiple sources (from multiple boosts)
- On revoke, only the source key from the revoked boost is removed
- Connection is deleted only when all source keys are removed

### Important: Parent Boost Handling

When revoking, `processConnectionRevoke` checks:
1. Direct boost (if `autoConnectRecipients=true`)
2. All parent boosts with `autoConnectRecipients=true`
3. All boosts targeted by AUTO_CONNECT claim hooks

This mirrors the connection creation logic in `ensureConnectionsForCredentialAcceptance`.

### Frontend Query Behavior

| Query | `includeUnacceptedBoosts=false` (default) | `includeUnacceptedBoosts=true` |
|-------|-------------------------------------------|-------------------------------|
| `useGetBoostRecipients` | Only claimed credentials | Claimed + pending |
| `useCountBoostRecipients` | Count of claimed only | Count of claimed + pending |

Revoked credentials are **always** filtered out regardless of `includeUnacceptedBoosts`.

### Testing with SEED Environment Variable

Tests require a SEED to initialize LearnCard wallets:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa pnpm test -- revoke-credential.spec.ts
```


## Scouts App Architecture (`apps/scouts/`)

### Key Concepts

- **Troop**: A group that issues TroopID credentials to scouts
- **TroopID**: A credential issued to scouts when they join a troop
- **Boost**: A credential template that can be issued to recipients

### Troop Credential Status

The `useTroopIDStatus` hook determines credential status:

| Status | Meaning |
|--------|---------|
| `'valid'` | User is in the claimed recipients list |
| `'pending'` | User is in all recipients but not claimed list |
| `'revoked'` | User is not in either list |

### Key Files

| File | Purpose |
|------|---------|
| `TroopIdStatusButton.tsx` | Shows Valid ID / Pending Acceptance / ID Revoked |
| `TroopPage.tsx` | Main troop view, hides members for revoked/pending |
| `TroopPageIdAndTroopBox.tsx` | Share button, disabled for revoked/pending |
| `useBoostMenu.tsx` | Hook for boost menu actions |
| `AddressBookConnections.tsx` | Shows user connections, uses `useGetConnections` |

### Address Book

- **Main contacts**: Uses `useGetConnections()` → `CONNECTED_WITH` relationships
- **Troop-filtered**: Uses `getPaginatedBoostRecipientsWithChildren()` → boost recipients

### Running the Scouts App

```bash
cd apps/scouts
pnpm dev              # Start frontend
pnpm docker-start     # Start backend services (Neo4j, brain-service)
```

## Testing Brain Service

### Test Setup

Tests use `@testcontainers/neo4j` to spin up a Neo4j container:
- Requires Docker to be running
- `test-setup.ts` handles container lifecycle
- Uses `vitest` as the test framework

### Running Tests

```bash
cd services/learn-card-network/brain-service
pnpm test -- revoke-credential.spec.ts   # Run specific test file
pnpm test:watch                          # Watch mode
```

### Test Helpers

- `getUser(seed?)`: Creates a test user with clients
- `sendBoost(from, to, boostUri, accept)`: Helper to send and optionally accept boosts
- Direct Neo4j queries use `neogma.queryRunner.run(cypher, params)`

### Key Test Files

| File | Tests |
|------|-------|
| `revoke-credential.spec.ts` | Revocation and claim hook reversal |
| `claim-hooks.spec.ts` | Claim hook functionality |
| `boosts.spec.ts` | Boost CRUD and permissions |
| `auto-connect-hierarchy.spec.ts` | Auto-connect with boost hierarchies |

## Frontend Query Hooks (`packages/learn-card-base/src/react-query/queries/`)

### Boost Recipients

```typescript
// Get claimed recipients only (default for member lists)
useGetBoostRecipients(boostUri, enabled, includeUnacceptedBoosts=false)

// Get count (excludes pending by default)
useCountBoostRecipients(uri, enabled, includeUnacceptedBoosts=false)
```

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

## ScoutPass Permissions & Workarounds

### National Admin Troop View Access
**Problem**: National admins saw "ID Revoked" or "Pending Acceptance" when viewing troops they managed but didn't own. This was because `useTroopIDStatus` checks if the *current user* is the recipient.
**Workaround**: `TroopPage.tsx` uses `hasParentAdminAccess` to bypass the `isRevokedOrPending` check. If a user has `canEditChildren` permissions on the parent network boost, they see full troop details regardless of their personal credential status.

### Network Admin Scout ID Issuance
**Requirement**: Network admins (Directors) must be able to issue Scout IDs for troops under their managed networks.
**Implementation**:
- `troops.helpers.ts`: `canIssueChildren` and `canRevokeChildren` for `network` and `global` roles set to `'*'` (previously excluded `scoutId`).
- `TroopListItemCard.tsx`: `handleSelectInviteModal` allows use of `scoutBoostUri` if `scoutPermissionsData?.canIssue` is true, enabling non-leaders with elevated permissions to invite scouts.

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


Please read AGENTS.md
