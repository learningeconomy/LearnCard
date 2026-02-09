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

## UI/UX Design Guidelines

All user-facing UI in `apps/learn-card-app`, `apps/scouts`, and shared components in `packages/learn-card-base` must follow these guidelines. The goal is **world-class, buttery UX** inspired by Airbnb, Headspace, Slack, and Google Maps — clean, clear, never flashy, never in the way.

### Design Tokens (Tailwind)

The apps define a custom color palette in their `tailwind.config.js`. **Never use generic Tailwind colors** (`gray-*`, `purple-*`, `blue-*`) — always use the app tokens:

| Token | Hex | Usage |
|-------|-----|-------|
| `grayscale-900` | `#18224E` | Headings, primary button fills, dark text |
| `grayscale-800` | `#353E64` | Strong secondary text |
| `grayscale-700` | `#52597A` | Secondary text, cancel button text |
| `grayscale-600` | `#6F7590` | Body text, descriptions |
| `grayscale-500` | `#8B91A7` | Hint text, subtitles |
| `grayscale-400` | `#A8ACBD` | Placeholder text, disabled icons |
| `grayscale-300` | `#C5C8D3` | Borders, dividers |
| `grayscale-200` | `#E2E3E9` | Light borders, separator lines |
| `grayscale-100` | `#EFF0F5` | Inactive tab fills, subtle backgrounds |
| `grayscale-10` | `#FBFBFC` | Hover background on light surfaces |
| `emerald-50`–`emerald-900` | — | Success states, positive actions, focus rings |
| `amber-50`–`amber-900` | — | Warnings, caution callouts |
| `red-50`–`red-700` | — | Errors, destructive states |

### Typography

- **Font family**: `font-poppins` (maps to Poppins in LCA, Noto Sans in Scouts)
- **Headings**: `text-xl font-semibold text-grayscale-900`
- **Body text**: `text-sm text-grayscale-600 leading-relaxed`
- **Labels**: `text-xs font-medium text-grayscale-700`
- **Hints / placeholders**: `text-xs text-grayscale-400` or `placeholder:text-grayscale-400`

### Buttons

| Type | Classes |
|------|---------|
| **Primary** | `py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed` |
| **Secondary / Cancel** | `py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors` |
| **Positive action** | `py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors` |
| **Tab (active)** | `py-2.5 px-3 rounded-full bg-grayscale-900 text-white font-medium text-sm` |
| **Tab (inactive)** | `py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm` |
| **Text link / back** | `text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors` |

All buttons use `rounded-[20px]` (pill shape), **never** `rounded-lg`.

### Form Inputs

**Never use `IonItem` / `IonInput` / `IonTextarea` for modal or overlay forms.** Ionic's theme layer can override text color, causing white-on-white text that is invisible. Use styled native HTML inputs instead:

```tsx
<input
    type="password"
    value={value}
    onChange={e => setValue(e.target.value)}
    placeholder="Placeholder text"
    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
               placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
               focus:border-transparent bg-white"
/>
```

Key rules:
- Always set explicit `text-grayscale-900` and `bg-white` — never rely on defaults
- Always set `placeholder:text-grayscale-400`
- Use `rounded-xl` for inputs (slightly less rounded than buttons)
- Focus state: `focus:ring-2 focus:ring-emerald-500 focus:border-transparent`
- Add a `<label>` above: `text-xs font-medium text-grayscale-700 mb-1.5`

### Overlays & Modals

Use the shared `Overlay` component from `packages/learn-card-base/src/auth-coordinator/components/Overlay.tsx`:

```tsx
<Overlay>
    <div className="p-8 text-center space-y-5">
        {/* content */}
    </div>
</Overlay>
```

Overlay renders a fixed fullscreen backdrop with a white `rounded-[20px]` card, max-width 480px, with `font-poppins` and `animate-fade-in-up` entrance animation.

### Loading States

Never leave the user without feedback. Every async action must show a loading state:

```tsx
{loading ? (
    <span className="flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Recovering...
    </span>
) : 'Recover Account'}
```

Use contextual loading text: "Setting up...", "Recovering...", "Verifying...", "Generating...".

### Error States

Use the standard error banner pattern:

```tsx
{error && (
    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
        <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
    </div>
)}
```

Map raw error messages to friendly language:
- Decrypt errors → "Incorrect password or corrupted data. Please try again."
- Network errors → "Connection issue. Please check your internet and try again."
- Generic fallback → "Something went wrong. Please try again."

### Success States

```tsx
{success && (
    <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
        <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500 text-lg mt-0.5 shrink-0" />
        <span className="text-sm text-emerald-700 leading-relaxed">{success}</span>
    </div>
)}
```

### Copy & Language Rules

- **No jargon.** Never use: "wallet", "migration", "device key", "key derivation", "SSS", "share", "DID". These are internal implementation details.
- **User-friendly alternatives**: "account" (not "wallet"), "account upgrade" (not "migration"), "sign in" (not "authenticate")
- **Be concise.** One short sentence for descriptions. No paragraphs.
- **Be direct.** "Choose how you'd like to restore access." not "Please select one of the available recovery options below to proceed with restoring access to your wallet."
- **Error titles**: "Something went wrong" — never expose stack traces or error codes.
- **Button labels**: Use action verbs. "Recover Account", "Try Again", "Set Up Password". Not "Submit", "OK", "Proceed".
- **Dismiss buttons**: "Skip for Now" (if optional), "Cancel" (if abandoning), "Done" (after success).

### Icons

- Use **Ionicons** (`ionicons/icons`) for inline icons: `alertCircleOutline`, `keyOutline`, `fingerPrint`, `checkmarkCircleOutline`, etc.
- For larger decorative icons (e.g., modal hero images), use **inline SVGs** with `stroke="currentColor"` so they inherit text color.
- **Never use raw emoji** (`&#x1F4F7;`, `&#x2705;`) — they render inconsistently across platforms.

### Background Context Awareness

Shared components from `learn-card-base` may render on different backgrounds:
- **Inside an Overlay**: White card background → `grayscale-*` text is fine
- **On a login page**: Colored background (green, purple) → **wrap in a white card**

When placing a shared component on a colored page background, always wrap it:

```tsx
<div className="w-full max-w-[500px] bg-white rounded-[20px] shadow-2xl">
    <QrLoginRequester ... />
</div>
```

### Spacing & Layout

- Modal padding: `p-6` (inner content) or `p-8` (simple overlays with fewer elements)
- Section spacing: `space-y-5` for major sections, `space-y-4` for form fields
- Between heading + description: `mb-1`
- Between description + content: `mb-5` or `mb-6`
- Card content max-width: `max-w-md mx-auto` (inside overlays already constrained to 480px)

### Checklist for New UI Components

Before shipping any new modal, overlay, or form:

1. **Colors**: Only `grayscale-*`, `emerald-*`, `amber-*`, `red-*` from the app palette — no generic Tailwind
2. **Typography**: `font-poppins` set on container, `text-grayscale-900` for headings
3. **Inputs**: Native `<input>` / `<textarea>` with explicit `text-grayscale-900 bg-white` — not IonItem
4. **Buttons**: `rounded-[20px]` pill shape, `bg-grayscale-900` primary, `border-grayscale-300` secondary
5. **Loading**: Every button with an async handler shows a spinner + contextual text
6. **Errors**: Friendly error messages, never raw `error.message`
7. **Copy**: No jargon, concise, action-oriented
8. **Icons**: Ionicons or inline SVGs, never raw emoji
9. **Contrast**: Text readable on its background (test on white AND colored backgrounds)
10. **Animation**: Use `animate-fade-in-up` for overlay entrance, `transition-colors` / `transition-opacity` for interactions

## Monorepo Structure

The project uses pnpm workspaces and NX for monorepo management with packages organized in `packages/` directory, services in the `services/` directory, and end-to-end tests in the `tests/` directory

## Documentation (`docs/`)

The `docs/` folder contains **GitBook documentation** that is synced to [docs.learncard.com](https://docs.learncard.com). These docs follow the **Diátaxis framework**, which organizes documentation into four distinct types:

### Diátaxis Structure

| Type              | Purpose                                       | Location              |
| ----------------- | --------------------------------------------- | --------------------- |
| **Tutorials**     | Learning-oriented, hands-on lessons           | `docs/tutorials/`     |
| **How-To Guides** | Task-oriented, step-by-step recipes           | `docs/how-to-guides/` |
| **Reference**     | Information-oriented, technical descriptions  | `docs/sdks/`          |
| **Explanation**   | Understanding-oriented, conceptual discussion | `docs/core-concepts/` |

### Key Files

-   `docs/README.md` — Landing page (What is LearnCard?)
-   `docs/SUMMARY.md` — Table of contents / sidebar navigation (GitBook uses this)
-   `docs/quick-start/` — Getting started guides
-   `docs/apps/` — User-facing app documentation (LearnCard App, ScoutPass)

### App Documentation (`docs/apps/`)

For changes to user-facing applications in `apps/`:

| App           | Doc Location                | Focus                                               |
| ------------- | --------------------------- | --------------------------------------------------- |
| LearnCard App | `docs/apps/learn-card-app/` | Claiming, sharing, wallet flows                     |
| ScoutPass     | `docs/apps/scouts/`         | NSO→Troop→Scout hierarchy, BoostIDs, badge issuance |

Use **Mermaid diagrams** for user flows (e.g., claim flow, share flow, permission flow).

### Editing Guidelines

-   **GitBook syntax**: Docs use GitBook-flavored markdown with special directives like `{% tabs %}`, `{% hint %}`, `{% content-ref %}`
-   **Code snippets**: Must be accurate and runnable. Use `@learncard/init` for initialization (not `@learncard/core`)
-   **Links**: Internal links use relative paths. GitBook handles `/broken/pages/` placeholders automatically
-   **Context URLs**: Use current versions (e.g., `https://ctx.learncard.com/boosts/1.0.3.json`)
-   **API patterns**: Use `learnCard.invoke.*` for methods, `learnCard.id.did()` for DID access
-   **Simplicity**: Avoid jargon. Spell out acronyms on first use. Keep examples minimal

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
-   `VITE_ENABLE_MIGRATION`: `'true' | 'false'` (default: `'true'`)
-   `VITE_WEB3AUTH_CLIENT_ID`: Web3Auth client ID (per app, from dashboard)
-   `VITE_WEB3AUTH_NETWORK`: Web3Auth network (e.g. `'testnet'`, `'sapphire_mainnet'`)
-   `VITE_WEB3AUTH_VERIFIER_ID`: Web3Auth verifier name (e.g. `'learncardapp-firebase'`)
-   `VITE_WEB3AUTH_RPC_TARGET`: Ethereum RPC URL for Web3Auth private key provider (e.g. Infura endpoint)

### Detailed Documentation

See `packages/learn-card-base/src/auth-coordinator/README.md` for full state machine diagrams, sequence diagrams for every method, configuration reference, and server API contract. See `INTEGRATION.md` and `RECOVERY.md` in the same directory for app integration and recovery system guides.

## Partner Connect SDK Architecture

The `@learncard/partner-connect` SDK enables secure cross-origin communication between partner applications and the LearnCard host application via a clean Promise-based API.

### Core Architecture

#### Security Model

-   **Multi-layered Origin Validation**: Strict origin matching with configurable whitelists
-   **Protocol Verification**: Messages must match expected protocol version
-   **Request ID Tracking**: Only tracked requests are processed to prevent replay attacks
-   **No Wildcard Origins**: Never uses `'*'` as target origin for security

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

-   **Factory Function**: `createPartnerConnect()` for clean initialization
-   **Request Management**: Handles timeout, cleanup, and error states
-   **Security Enforcement**: Multi-layer origin validation
-   **Browser Compatibility**: SSR-safe with proper cleanup

#### Type System (`packages/learn-card-partner-connect-sdk/src/types.ts`)

-   **Comprehensive TypeScript**: Full type coverage for all APIs
-   **Structured Errors**: Specific error codes for different failure scenarios
-   **Message Protocols**: Internal postMessage format definitions
-   **Browser Types**: Uses browser-native types (not Node.js) for compatibility

### Example App Architecture

Partner Connect example apps follow a consistent pattern:

#### Frontend Architecture

-   **Framework**: Astro for simple static hosting compatibility
-   **SDK Integration**: Partner Connect SDK for host communication
-   **UI Framework**: Tailwind CSS for rapid development
-   **State Management**: Simple vanilla JavaScript state management

#### Backend Architecture

-   **Actions**: Astro actions using `@learncard/init` for credential operations
-   **Environment Variables**: Secure storage of issuer seeds and configuration
-   **Validation**: Zod schemas for input validation
-   **Error Handling**: Structured error responses

#### Security Patterns

-   **Frontend**: Never expose private keys, validate user input
-   **Backend**: Environment-based secrets, proper error handling
-   **Communication**: Secure postMessage with origin validation

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
