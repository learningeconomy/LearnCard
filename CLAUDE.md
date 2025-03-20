# LearnCard SDK Guide

## Build & Test Commands
- Build project: `pnpm build` or `pnpm exec nx build <package-name>`
- Test all packages: `pnpm test` or `pnpm exec nx test`
- Run single test: `pnpm exec nx test <package-name> --testFile=path/to/test.spec.ts`
- Run e2e tests: `pnpm exec nx test:e2e e2e`

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces in dedicated type files
- **Imports**: Prefer named imports; avoid default exports when possible
- **Formatting**: Follow Prettier config; 4-space indentation for JSX
- **Naming**:
  - PascalCase for classes, interfaces, types, React components
  - camelCase for variables, functions, methods, properties
  - ALL_CAPS for constants
- **Error handling**: Use try/catch with specific error types
- **Functions**: Prefer arrow functions with explicit return types
- **React**: Function components with hooks preferred over class components
- **Modules**: Keep files focused on single responsibility 
- **Documentation**: Add JSDoc comments for public APIs and complex logic

## Monorepo Structure
The project uses pnpm workspaces and NX for monorepo management with packages organized in `packages/` directory, services in the `services/` directory, and end-to-end tests in the `tests/` directory

## LearnCard Plugin System

LearnCard uses a modular plugin system to extend functionality in a composable way. Understanding this architecture is critical for development.

### Core Concepts

#### Plugins
- Each plugin is a self-contained module that adds specific capabilities
- Plugins follow a standard interface: `Plugin<Name, ControlPlanes, Methods, DependentControlPlanes, DependentMethods>`
- Each plugin can provide functionality through:
  - **Control Planes**: Standard interfaces like `read`, `store`, `index`, `cache`, `id`, and `context`
  - **Methods**: Custom functions exposed through the `invoke` API

#### Control Planes
Control planes are standardized interfaces that plugins implement to provide core functionality:
- **Read Plane**: For retrieving credentials and data
- **Store Plane**: For storing and uploading credentials
- **Index Plane**: For querying and managing indexed data
- **Cache Plane**: For temporary data storage and retrieval
- **Id Plane**: For identity management (DID methods, keypairs)
- **Context Plane**: For resolving context documents

#### LearnCard Object
The main LearnCard object combines all plugins and exposes:
- Access to control planes (e.g., `learnCard.read.get()`, `learnCard.store.upload()`)
- Access to all plugin methods through the `invoke` property (e.g., `learnCard.invoke.createProfile()`)
- The ability to add more plugins using `addPlugin()`

### Plugin Dependencies
- Plugins can depend on other plugins through their `DependentControlPlanes` and `DependentMethods`
- When initializing LearnCard, plugins must be added in the correct order to respect dependencies

### Initialization Process

The `@learncard/init` package provides several initialization methods:

#### Main Initialization Functions
- `initLearnCard()`: The primary entry point with multiple overloads
- Different configurations determine which plugins are included:
  - Empty initialization
  - Seed-based initialization
  - Network-enabled initialization
  - DID Web initialization

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
- **Profiles**: Create and consent to contracts
- **Contracts**: Define data access requirements (read/write permissions)
- **Terms**: Record a profile's consent to a contract
- **Transactions**: Record actions against Terms (consent, withdraw, update)
- **Credentials**: Can be issued through contracts with auto-boosts

### Data Flow Between Packages
1. **LearnCard Network Plugin** (`packages/plugins/learn-card-network/`) provides the API for interacting with consent flow
2. **Brain Service** (`services/learn-card-network/brain-service/`) implements the backend logic
3. **End-to-end tests** are written in `tests/e2e/` to test the full flow

The workflow typically involves:
1. Creating a contract with specific data requirements
2. Users consenting to the contract with their own terms
3. Recording transactions for consent actions
4. Optionally issuing credentials via auto-boosts when a user consents

## OIDC Integration
LearnCard supports OpenID Connect (OIDC) for external applications to access LearnCard APIs through the `learn-cloud-service`:

### Key Features
- **Standard OIDC Endpoints**:
  - `/.well-known/openid-configuration` - OIDC discovery endpoint
  - `/oidc/jwks` - JSON Web Key Set endpoint for token verification

- **Authentication**:
  - Uses RS256 algorithm for signing JWTs
  - Supports client_secret_basic and client_secret_post methods
  - Tokens expire after 1 hour
  - Implements standard JWT claims plus a custom "did" claim

- **Supported Scopes**:
  - openid
  - lrs:all
  - lrs:read
  - lrs:write

- **Integration with Learning Record Store (LRS)**:
  - Provides authenticated access to xAPI endpoints
  - Permissions based on subject's DID and delegated credentials

## LTI 1.3 Integration
LearnCard supports LTI 1.3 (Learning Tools Interoperability) for integration with Learning Management Systems:

### Key Features
- **Complete LTI 1.3 Implementation**:
  - OpenID Connect-based authentication flow
  - Support for resource link launches and deep linking
  - Customizable platform registration
  - Integration with LearnCard credential issuance

- **Endpoints**:
  - `/.well-known/jwks.json` - JWK Set for token verification
  - `/lti/config` - XML configuration for LMS integration
  - `/lti/login` - OIDC login flow
  - `/lti/launch` - Resource link launch processing
  - `/lti/deep-linking` - Content selection launches

- **LearnCard Integration Points**:
  - Map LMS users to DIDs
  - Issue verifiable credentials based on LTI context
  - Provide access to LearnCard wallet functionality
  - Store/verify credentials through LearnCard ecosystem
