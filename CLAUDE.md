# LearnCard SDK Guide

## Build & Test Commands

-   Build project: `pnpm build` or `pnpm exec nx build <package-name>`
-   Test all packages: `pnpm test` or `pnpm exec nx test`
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

