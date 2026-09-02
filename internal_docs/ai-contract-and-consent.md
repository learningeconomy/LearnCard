# LearnCard AI Contract & Consent

## Overview

This PR introduced a **dedicated LearnCard AI ConsentFlow contract** that is separate from the general Network consent contract. The goal is to allow LearnCard AI services to read My Skill Profile data (Goals, Professional Title, Role Experience, Work Experience, Pay Rate, Work Life Balance, Job Stability, and Self-Assigned Skills) for AI Pathways and Insights, while giving users independent control over AI data sharing.

---

## Contract Separation

### Network Consent Contract

-   **URI**: `lc:network:network.learncard.com/trpc:contract:2ed7b889-c06e-47c4-835b-d924c17e9891`
-   **Location**: `packages/learn-card-base/src/react-query/mutations/networkConsent.ts`
-   **Purpose**: General network participation; grants broad read/write access across credential categories
-   **Behavior**: Unchanged by this PR

### LearnCard AI Passport Contract

-   **URI**: `lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b`
-   **Location**: `packages/learn-card-base/src/constants/aiPassport.ts`
-   **Purpose**: Scoped access to My Skill Profile verifiable data categories for AI features
-   **Detection**: `isLearnCardAiPassportContractUri(contractUri)` helper

Previously, both network consent and AI consent shared a single contract. Separating them means:

1.  Withdrawing from the AI contract does not break network functionality
2.  Updating the AI contract structure does not affect existing network consents
3.  Users can disable AI Features without losing network data sharing

---

## Auto-Consent Hook

### `useAutoConsentLearnCardAi`

**Location**: `apps/learn-card-app/src/hooks/useAutoConsentLearnCardAi.ts`

This hook provides two operations:

#### `autoConsentLearnCardAi({ enabled, userOverrides })`

1.  Checks if the user is already consented (via `getOrFetchConsentedContracts`)
2.  Fetches the contract definition from the network
3.  Builds full consent terms with `getFullTermsForContract`
4.  Populates `shared` URIs for each verifiable-data category by calling `getAllCredentialUrisForCategory`
5.  Enriches terms with `getTermsWithSharedUrisForWallet`
6.  Calls `wallet.invoke.consentToContract(...)`
7.  Invalidates `useConsentedContracts` query cache
8.  On failure, attempts **recovery consent check** — refreshes consented contracts and returns `true` if consent was actually created (handles race conditions)

**In-flight guard**: `autoConsentInFlight` (module-level Promise) prevents duplicate concurrent calls.

#### `withdrawLearnCardAiConsent()`

1.  Finds the active (non-withdrawn) LearnCard AI consent terms
2.  Calls `withdrawConsent(termsUri)`
3.  Invalidates query cache

**In-flight guard**: `withdrawConsentInFlight` (module-level Promise) prevents duplicate concurrent calls.

### App-Wide Auto-Consent in `AppRouter`

**Location**: `apps/learn-card-app/src/AppRouter.tsx`

A `useEffect` watches `[isLoggedIn, currentUser, isAiEnabled]` and calls `autoConsentLearnCardAi({ enabled: true })` whenever:

-   User is logged in
-   AI Features are enabled
-   Name/profileImage may have changed (used for consent terms)

This means **already-logged-in users** get auto-consented without needing to visit onboarding or toggle the setting.

---

## AI Consent Toggle

### `useAiConsentToggle`

**Location**: `apps/learn-card-app/src/hooks/useAiConsentToggle.ts`

Implements a **"Preferences-first with rollback"** strategy:

#### Turning OFF

1.  `updatePreferencesAsync({ aiEnabled: false })`
2.  `withdrawLearnCardAiConsent()`
3.  If withdrawal fails → **rollback** preferences to `aiEnabled: true`

#### Turning ON

1.  `updatePreferencesAsync({ aiEnabled: true })`
2.  `autoConsentLearnCardAi({ enabled: true })`
3.  If consent fails → **rollback** preferences to `aiEnabled: false`

#### Child Profiles

For child profiles (`profileType === 'child'`), the ON flow is wrapped in `guardedAction(..., { ignorePriorVerification: true })` so the guardian must verify before consent is created.

---

## Privacy Settings UI

### `PrivacySettingsModal`

**Location**: `apps/learn-card-app/src/pages/privacy-settings/PrivacySettingsModal.tsx`

The AI Features toggle now shows transient connection status:

-   `connecting` → "Connecting..."
-   `connected` → "Connected" (green checkmark, auto-hides after 2s)
-   `disconnecting` → "Disconnecting..."
-   `disconnected` → "Successfully Disconnected" (green checkmark, auto-hides after 2s)

**Warning banner**: If `preferences.aiEnabled === true` but no active LearnCard AI consent exists, a red warning banner appears with a "Try again" button that triggers `handleRetryAiConsent`.

**Toggle disabled states**:

-   `aiFeatureGateReason === 'disabled_minor'` (minor user)
-   `isSyncingAiConsent` (toggle in progress)
-   `retryingAiConsent` (retry in progress)

---

## Data Sharing Revoke Flow

### `ManageDataSharingModal`

**Location**: `apps/learn-card-app/src/components/data-sharing/ManageDataSharingModal.tsx`

Revoking the LearnCard AI contract shows a special confirmation:

-   Title: "Disable AI features?"
-   Body: "This will revoke LearnCard AI access and turn off AI features."
-   Button: "Disable AI & Revoke"

On confirm, `handleAiToggle(false)` is called, which withdraws consent **and** updates preferences. The modal stack closes only 2 levels (detail modal + confirmation modal) so the user lands back on the Data Sharing list.

---

## Key Files

| File                                                                         | Purpose                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| `packages/learn-card-base/src/constants/aiPassport.ts`                       | `LEARNCARD_AI_PASSPORT_CONTRACT_URI` constant + helper |
| `packages/learn-card-base/src/react-query/mutations/networkConsent.ts`       | Separate network consent mutation (unchanged URI)      |
| `apps/learn-card-app/src/hooks/useAutoConsentLearnCardAi.ts`                 | Auto-consent + withdrawal logic with in-flight guards  |
| `apps/learn-card-app/src/hooks/useAiConsentToggle.ts`                        | Transactional toggle with rollback                     |
| `apps/learn-card-app/src/AppRouter.tsx`                                      | App-wide auto-consent effect                           |
| `apps/learn-card-app/src/pages/privacy-settings/PrivacySettingsModal.tsx`    | AI toggle UI with status + warning banner              |
| `apps/learn-card-app/src/components/data-sharing/ManageDataSharingModal.tsx` | Revoke flow with special AI contract handling          |

---

## Known Limitations

-   The **AI Passport side** (OpenAI integration) still uses the old contract until [LC-1824](https://welibrary.atlassian.net/browse/LC-1824) is implemented. This PR only updates the LearnCard App contract and consent logic.
-   `autoConsentLearnCardAi` iterates all credential URIs per category, which can be slow for wallets with many credentials. The bug fix for "too many credentials" was addressed by improving the shared URI enrichment path.
