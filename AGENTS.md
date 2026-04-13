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
-   **React callbacks**: Use `onComplete`/`onSwitchComplete` callback props to let parent components control side effects after async actions complete, rather than hardcoding side effects in child components
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

For repo-wide environment setup and Infisical-managed `.env` generation, see [environment-variables.md](./environment-variables.md). It covers the pull, backup, and compare scripts used across the monorepo.

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

## Verifiable Data Storage (`useVerifiableData`)

A hook for storing arbitrary user data as self-issued verifiable credentials. Data is encrypted and stored in LearnCloud, providing a privacy-preserving way to collect user preferences, profile data, or any structured information.

**Location**: `packages/learn-card-base/src/hooks/useVerifiableData.ts`

### Usage

```typescript
import { useVerifiableData } from 'learn-card-base';

type SalaryData = { salary: string; salaryType: 'per_year' | 'per_hour' };

const { data, isLoading, save, saveIfChanged, isSaving, issuanceDate } =
    useVerifiableData<SalaryData>('skill-profile-salary');

// Pre-populate form from existing data
useEffect(() => {
    if (data) {
        setSalary(data.salary);
        setSalaryType(data.salaryType);
    }
}, [data]);

// Save on next (only if changed)
const handleNext = async () => {
    await saveIfChanged({ salary, salaryType });
    navigateToNextStep();
};
```

### How It Works

1. Data is serialized to JSON and stored in a self-issued VC's `achievement.description` field
2. The VC is signed by the user's wallet and encrypted via `store.LearnCloud.uploadEncrypted()`
3. An index record with `id: __verifiable_data_{key}__` enables fast lookups
4. On save, any existing record with the same key is deleted and replaced

### Return Values

| Property        | Type                            | Description                                            |
| --------------- | ------------------------------- | ------------------------------------------------------ |
| `data`          | `T \| undefined`                | Current data, or undefined if not loaded/doesn't exist |
| `issuanceDate`  | `string \| undefined`           | When the credential was issued                         |
| `isLoading`     | `boolean`                       | Whether data is being loaded                           |
| `isFetched`     | `boolean`                       | Whether loading has completed                          |
| `save`          | `(data: T) => Promise<string>`  | Save new data (always writes)                          |
| `saveIfChanged` | `(data: T) => Promise<boolean>` | Save only if different from existing                   |
| `hasChanged`    | `(data: T) => boolean`          | Check if data differs from existing                    |
| `isSaving`      | `boolean`                       | Whether a save is in progress                          |
| `exists`        | `boolean`                       | Whether data has been saved at least once              |

### Non-React Usage

```typescript
import { getVerifiableDataForKey, saveVerifiableData } from 'learn-card-base';

// Read
const data = await getVerifiableDataForKey<MyType>(wallet, 'my-key');

// Write
await saveVerifiableData(wallet, 'my-key', { foo: 'bar' });
```

### Current Usage: My Skills Profile

The AI Pathways "My Skills Profile" feature uses `useVerifiableData` to store user career data:

| Key                              | Data Type                     | Step   |
| -------------------------------- | ----------------------------- | ------ |
| `skill-profile-goals`            | Goals array                   | Step 1 |
| `skill-profile-profile`          | Title + experience            | Step 1 |
| `skill-profile-work-history`     | Selected credential URIs      | Step 2 |
| `skill-profile-salary`           | Salary + type                 | Step 3 |
| `skill-profile-job-satisfaction` | Work-life balance + stability | Step 4 |

Step 5 uses the existing self-assigned skills boost system (`useManageSelfAssignedSkillsBoost`).

## Credential Library (`@learncard/credential-library`)

A queryable library of Verifiable Credential fixtures for testing, development, and regression prevention. Located in `packages/credential-library/`.

### Architecture

```
packages/credential-library/src/
├── types.ts          — CredentialFixture, CredentialSpec, CredentialProfile, FixtureFilter
├── registry.ts       — In-memory fixture store with query/filter API
├── prepare.ts        — prepareFixture() — deep-clone + patch DIDs, UUIDs, timestamps
├── index.ts          — Public exports (types, registry, prepare, fixtures)
├── fixtures/
│   ├── index.ts      — Barrel that imports and registers ALL fixtures
│   ├── vc-v1/        — W3C VCDM v1 fixtures
│   ├── vc-v2/        — W3C VCDM v2 fixtures
│   ├── obv3/         — Open Badges v3 fixtures
│   ├── clr/          — CLR v2 fixtures (some with nested VCs)
│   ├── boost/        — LearnCard Boost fixtures
│   └── invalid/      — Intentionally malformed fixtures for negative testing
└── __tests__/
    ├── registry.test.ts  — Zod validation + query API tests
    └── issuance.test.ts  — Real wallet issuance for every valid fixture
```

### Key APIs

```typescript
import {
    getAllFixtures, getFixture, findFixture, getFixtures,
    getValidFixtures, getInvalidFixtures, getStats,
    prepareFixture, prepareFixtureById,
} from '@learncard/credential-library';

// Query
const badges = getFixtures({ spec: 'obv3', profile: 'badge' });

// Prepare + issue
const unsigned = prepareFixtureById('obv3/full-badge', { issuerDid: wallet.id.did() });
const signed = await wallet.invoke.issueCredential(unsigned);
```

### Adding a Fixture

1. Create `src/fixtures/<folder>/<name>.ts` exporting a `CredentialFixture`
2. Import + add to `ALL_FIXTURES` array in `src/fixtures/index.ts`
3. Run `pnpm test` — both the Zod validation and issuance tests auto-discover it

Alternatively, the `examples/credential-viewer` app has a **New Fixture** UI that writes the file and updates the index automatically via a Vite dev server plugin.

### JSON-LD Context Gotchas

- DidKit statically caches certain contexts (see `packages/plugins/didkit-plugin-node/native/src/lib.rs` `context_loader`)
- CLR: use `context.json` (cached) not `context-2.0.1.json` (requires `allowRemoteContexts`)
- VC v2 custom terms: use `https://www.w3.org/ns/credentials/examples/v2` (not `schema.org/` — causes protected term redefinition)
- VC v1 custom terms: use `https://www.w3.org/2018/credentials/examples/v1`

### CLR v2 Types (`@learncard/types`)

Added in `packages/learn-card-types/src/clr.ts`:

- `AssociationValidator` / `AssociationType`
- `ClrSubjectValidator` / `ClrSubject`
- `UnsignedClrCredentialValidator` / `UnsignedClrCredential`
- `ClrCredentialValidator` / `ClrCredential`

### Credential Viewer (`examples/credential-viewer/`)

Interactive React + Tailwind UI for browsing, issuing, and sending fixtures. Features:

- Browse/filter/search all fixtures
- Connect a LearnCard wallet (seed-based, configurable environment)
- Bulk issue and send credentials
- Create new fixtures with auto-inferred metadata

Run with `pnpm dev` from the `examples/credential-viewer/` directory.

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

## CredentialBuilder Component

Location: `apps/learn-card-app/src/pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/`

A form-based OBv3 credential template builder used by partner onboarding. Key files:

| File                    | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `CredentialBuilder.tsx` | Main component with form/JSON modes                                         |
| `types.ts`              | Template types: `OBv3CredentialTemplate`, `TemplateFieldValue`              |
| `utils.ts`              | `templateToJson()` / `jsonToTemplate()` serialization, `validateTemplate()` |
| `sections/`             | Form sections: Achievement, Evidence, Dates, CustomFields                   |

### Adding New Template Fields

1. Add optional field to interface in `types.ts` (e.g., `ctid?: TemplateFieldValue`)
2. Add `FieldEditor` in appropriate section component (e.g., `AchievementSection.tsx`)
3. Update `templateToJson()` to serialize the field to JSON
4. Update `jsonToTemplate()` to deserialize (round-trip support)
5. Add validation in `validateTemplate()` if format constraints exist
6. Add to `extractVariablesByType()` for dynamic field support
7. Write unit tests in `utils.test.ts`

### CTID (Credential Engine Registry) Integration

The `ctid` field links credentials to the Credential Engine Registry:

-   **Format**: `ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID with ce- prefix)
-   **Serialization**: Emits an OBv3 alignment entry with `targetFramework: 'Credential Engine Registry'`
-   **Round-trip**: Detected via `targetFramework` + `targetType: 'ceterms:Credential'`, extracted to `ctid` field
-   **Validation**: Regex pattern `/^ce-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

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

## Partner Connect SDK Architecture

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

## TenantConfig System

The TenantConfig system is the **single source of truth** for all tenant-specific configuration — API endpoints, auth providers, branding, feature toggles, observability, native build settings, and more. It replaces all legacy per-environment globals (`LCN_URL`, `CLOUD_URL`, `API_URL`, etc.) with a unified, Zod-validated config object.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      Build Time (CI / Local)                     │
│                                                                  │
│  environments/<tenant>.json  ──►  prepare-native-config.ts       │
│       (overrides only)             │                             │
│                                    ├─► deep-merge onto defaults  │
│                                    ├─► Zod schema validation     │
│                                    ├─► public/tenant-config.json │
│                                    └─► copy tenant assets        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      Runtime (App Boot)                          │
│                                                                  │
│  resolveTenantConfig()                                           │
│    1. Baked JSON  (/tenant-config.json — native builds)          │
│    2. Fresh fetch (/__tenant-config — web CNAME edge function)   │
│    3. localStorage cache (1h TTL)                                │
│    4. DEFAULT_LEARNCARD_TENANT_CONFIG fallback                   │
│                                                                  │
│  ──► initNetworkStoreFromTenant(config.apis)                     │
│  ──► <TenantConfigProvider config={config}>                      │
└──────────────────────────────────────────────────────────────────┘
```

### TenantConfig File Map

```
packages/learn-card-base/src/config/
├── tenantConfigSchema.ts       — Zod schema (single source of truth for types + validation)
├── tenantConfig.ts             — Re-exports types/schemas + getTenantBaseUrl() helper
├── tenantDefaults.ts           — DEFAULT_LEARNCARD_TENANT_CONFIG (hardcoded defaults)
├── resolveTenantConfig.ts      — Runtime resolution (baked → fetch → cache → default)
├── TenantConfigProvider.tsx    — React context + hooks (useTenantConfig, useApiConfig, etc.)
└── brandingHelpers.ts          — Data-driven branding (getCategoryLabel, getNavBarColor, etc.)

packages/learn-card-base/src/stores/
└── NetworkStore.ts             — Zustand store for network URLs + initNetworkStoreFromTenant()

apps/learn-card-app/
├── environments/
│   ├── learncard.json          — Production LearnCard (minimal — relies on defaults)
│   ├── local.json              — Local dev overrides (localhost URLs, debug flags)
│   └── vetpass.json            — VetPass tenant (full override with placeholder creds)
├── scripts/
│   ├── prepare-native-config.ts — Build script: merge + validate + write + copy assets
│   └── generate-tenant-assets.ts — Asset generator: logo → all icon/splash sizes
└── public/
    └── tenant-config.json      — Generated output (gitignored)
```

### Zod Schema

The schema in `tenantConfigSchema.ts` serves three purposes:

1. **Runtime validation** — `parseTenantConfig(raw, source)` validates config from any source
2. **Type inference** — `TenantConfig = z.infer<typeof tenantConfigSchema>` (no manual interfaces)
3. **Default values** — `.default()` on fields replaces the need for manual merge logic

All object sub-schemas use `.passthrough()` so newer config fields from the server don't break older clients.

**Root schema sections:**

| Section | Schema | Required | Purpose |
| --- | --- | --- | --- |
| `tenantId` | `z.string()` | yes | Unique tenant identifier |
| `domain` | `z.string()` | yes | Production domain |
| `devDomain` | `z.string()` | no | Local dev domain (default: `localhost:3000`) |
| `apis` | `tenantApiConfigSchema` | yes | All service endpoints |
| `auth` | `tenantAuthConfigSchema` | yes | Auth provider + key derivation |
| `branding` | `tenantBrandingConfigSchema` | yes | Visual identity + category labels |
| `features` | `tenantFeatureConfigSchema` | yes | Feature toggles |
| `observability` | `tenantObservabilityConfigSchema` | yes | Sentry, LaunchDarkly, Userflow |
| `links` | `tenantLinksConfigSchema` | yes | App Store / Play Store URLs |
| `native` | `tenantNativeConfigSchema` | no | Bundle ID, deep links, Capgo |
| `ecosystem` | `tenantEcosystemConfigSchema` | no | Ecosystem / root org IDs |

### Environment Files

Environment files live in `apps/learn-card-app/environments/<tenant>.json`. They contain **only the fields that differ from defaults** — the build script deep-merges them onto `DEFAULT_LEARNCARD_TENANT_CONFIG`.

**Creating a new tenant:**

1. Copy an existing file (e.g., `learncard.json`) as a starting point
2. Set `tenantId` and `domain` (required)
3. Override only the sections that differ from defaults
4. Add Firebase credentials, API endpoints, branding, etc.
5. Run `npx tsx scripts/prepare-native-config.ts <tenant>` to validate

**Minimal example** (`learncard.json`):
```json
{
    "tenantId": "learncard",
    "domain": "learncard.app"
}
```

**Full override example** (`vetpass.json`):
```json
{
    "tenantId": "vetpass",
    "domain": "vetpass.app",
    "devDomain": "localhost:3000",
    "apis": { "brainService": "https://network.vetpass.app/trpc", ... },
    "auth": { "firebase": { ... }, ... },
    "branding": { "name": "VetPass", "categoryLabels": { ... }, ... },
    "native": { "bundleId": "com.vetpass.app", ... }
}
```

### NetworkStore

`NetworkStore` is a persisted Zustand store that holds the active network URLs. It replaces all direct references to legacy globals.

**Initialization flow:**
1. `resolveTenantConfig()` returns the validated config
2. `initNetworkStoreFromTenant(config.apis)` populates the store
3. All code reads URLs via `networkStore.get.networkUrl()`, `networkStore.get.apiEndpoint()`, etc.

**Store fields:**

| Field | Source | Legacy equivalent |
| --- | --- | --- |
| `networkUrl` | `apis.brainService` | `LCN_URL` |
| `networkApiUrl` | `apis.brainServiceApi` | `LCN_API_URL` |
| `cloudUrl` | `apis.cloudService` | `CLOUD_URL` |
| `xapiUrl` | `apis.xapi` | `LEARN_CLOUD_XAPI_URL` |
| `apiEndpoint` | `apis.lcaApi` | `API_URL` |

### React Context & Hooks

`TenantConfigProvider` wraps the app and exposes config via context:

```tsx
<TenantConfigProvider config={resolvedConfig}>
    <App />
</TenantConfigProvider>
```

**Available hooks:**

| Hook | Returns |
| --- | --- |
| `useTenantConfig()` | Full `TenantConfig` |
| `useApiConfig()` | `TenantApiConfig` |
| `useAuthTenantConfig()` | `TenantAuthConfig` |
| `useBrandingConfig()` | `TenantBrandingConfig` |
| `useFeatureConfig()` | `TenantFeatureConfig` |
| `useObservabilityConfig()` | `TenantObservabilityConfig` |
| `useLinksConfig()` | `TenantLinksConfig` |
| `useNativeConfig()` | `TenantNativeConfig \| undefined` |
| `useTenantBaseUrl()` | `string` (e.g. `https://learncard.app`) |

### Branding Helpers

Data-driven helpers in `brandingHelpers.ts` replace hard-coded `BrandingEnum` switches:

- `getCategoryLabel(branding, key)` — credential category display name
- `getCategoryColor(branding, key)` — category color override
- `getNavBarColorOverride(branding, path)` — per-route nav bar color
- `getStatusBarColorOverride(branding, path)` — per-route status bar color
- `getHeaderTextColor(branding, path)` — per-route header text color
- `getHomeRoute(branding)` — tenant home route (default: `/wallet`)
- `getHeaderText(branding)` — header display text

### Build Scripts

#### `prepare-native-config.ts`

Generates `public/tenant-config.json` for native (Capacitor) builds and copies tenant assets.

```bash
# Default LearnCard
npx tsx scripts/prepare-native-config.ts

# Specific tenant
npx tsx scripts/prepare-native-config.ts vetpass

# Local dev
npx tsx scripts/prepare-native-config.ts local
```

**Steps:**
1. Load `environments/<tenant>.json` overrides
2. Deep-merge onto `DEFAULT_LEARNCARD_TENANT_CONFIG`
3. Validate merged config against the Zod schema (fails the build if invalid)
4. Write `public/tenant-config.json`
5. Copy tenant assets from `environments/<tenant>/assets/` into Capacitor dirs

**Docker scripts in `package.json`:**
- `docker-start` → `prepare-native-config.ts local && vite --host`
- `docker-start:tenant` → `prepare-native-config.ts ${TENANT:-learncard} && vite --host`
- `docker-build` → `prepare-native-config.ts local && vite build`

#### `generate-tenant-assets.ts`

Generates all native image assets from a single source logo using `sharp`.

```bash
npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> [options]

# Example
npx tsx scripts/generate-tenant-assets.ts vetpass ~/vetpass-logo.png --bg "#1A3C5E" --splash-bg "#0D1F30"
```

**Options:**
- `--bg <hex>` — Icon background color (default: `#FFFFFF`)
- `--splash-bg <hex>` — Splash background color (defaults to `--bg`)
- `--no-splash` — Skip splash screen generation

**Generated assets (~55 files) in `environments/<tenant>/assets/`:**

| Platform | Assets | Sizes |
| --- | --- | --- |
| **iOS** | `AppIcon.png` | 1024×1024 |
| **iOS** | `splash-2732x2732{,-1,-2}.png` | 2732×2732 (×3 copies for 1x/2x/3x) |
| **Android** | `ic_launcher.webp` | 48–192px (5 densities: mdpi→xxxhdpi) |
| **Android** | `ic_launcher_foreground.webp` | 108–432px (adaptive icon foreground) |
| **Android** | `ic_launcher_round.webp` | 48–192px (circular clip) |
| **Android** | `ic_launcher_background.xml` | Solid color vector + values resource |
| **Android** | `splash.9.png` | 9-patch PNGs in all drawable-* dirs |
| **Web** | `favicon.png` | 64×64 |
| **Web** | `icon.png` | 512×512 (PWA maskable) |

**Full workflow for a new tenant:**
```bash
# 1. Create environment file
# environments/mytenant.json  (only overrides)

# 2. Generate image assets from a logo
pnpm generate-assets mytenant ~/path/to/logo.png --bg "#123456"

# 3. Build config + copy assets into Capacitor project
pnpm prepare-config mytenant

# 4. Build the app
pnpm build
```

### Important Rules for AI Assistants

- **Never use legacy globals** (`LCN_URL`, `CLOUD_URL`, `API_URL`, `LCN_API_URL`, `LEARN_CLOUD_XAPI_URL`). These have been removed from `vite.config.ts` and `global.d.ts`. Always use `networkStore.get.*()` or the tenant config hooks instead.
- **Never hardcode URLs** in components. Read from `networkStore` or `useTenantConfig()`.
- **Environment files are overrides only** — never duplicate defaults. The build script deep-merges onto `DEFAULT_LEARNCARD_TENANT_CONFIG`.
- **All config is Zod-validated** at build time. Schema violations fail the build, not runtime.
- **`.passthrough()`** on all Zod sub-schemas means extra fields are preserved, not stripped.
- **Generated assets are gitignored** (`environments/*/assets/`). They are build artifacts.
- **`sharp`** is a devDependency of `learn-card-app` used only by the asset generation script.

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
