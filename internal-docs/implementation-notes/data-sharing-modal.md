# Data Sharing Modal Improvements

## Overview

The **Data Sharing** modal (`ManageDataSharingModal`) was improved to make reviewing and revoking consents more usable. Key changes include: most-recent-first ordering, fixed scrolling, a two-modal close limit on revoke, and a caching fix so revoked contracts disappear immediately.

---

## ManageDataSharingModal

**Location**: `apps/learn-card-app/src/components/data-sharing/ManageDataSharingModal.tsx`

### Most Recent First

Contracts are sorted by reversing the consented contracts array:

```typescript
const contracts = [...(consentedContracts ?? [])]
    .filter(contract => contract?.status !== 'withdrawn')
    .reverse();
```

This puts the newest consents at the top of the list.

### Scrolling Fix

The modal uses a flex column layout with `overflow-y-auto` on the contract list:

```tsx
<div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 pb-2">
    <div className="flex flex-col gap-2">
        {contracts.map(contract => ...)}
    </div>
</div>
```

-   `flex-1 min-h-0` ensures the scroll area shrinks correctly inside the modal
-   `-mx-2 px-2` compensates for internal padding so scrollbars sit flush

### Revoke: Two-Modal Close Limit

When a user revokes access, the modal stack closes exactly 2 levels:

```typescript
const handleRevoke = async () => {
    await withdrawConsent(contract.uri);
    await onUpdate?.();
    closeModal(); // closes detail view
    closeModal(); // closes confirmation modal
    // user lands back on ManageDataSharingModal
};
```

Previously, revoking closed all the way out of the modal stack. Now the user stays on the Data Sharing list to review remaining consents.

For the LearnCard AI contract, the same two-close behavior applies, but `handleAiToggle(false)` is called instead of `withdrawConsent`.

### Caching / Filtering Fix

After revocation, `onUpdate?.()` calls `refetch()` on the `useConsentedContracts` query. Combined with the filter:

```typescript
.filter(contract => contract?.status !== 'withdrawn')
```

...revoked contracts immediately disappear from the list without requiring a manual refresh.

---

## Contract Detail View (Inside Data Sharing)

### `ContractDetailView`

Tapping a contract row opens a detail modal showing:

-   App name, image, description
-   **Data Access Permissions** section with read/write category chips
    -   Read chips use `bg-cyan-50 border-cyan-100 text-cyan-700`
    -   Write chips use `bg-emerald-50 border-emerald-100 text-emerald-700`
    -   Each chip shows the category icon via `contractCategoryNameToCategoryMetadata(...).IconWithShape`
-   **Open App** button (if `redirectUrl` is set) — generates a delegate VP and opens the app
-   **xAPI Data Feed** button
-   **Edit Permissions** button — opens `ConsentFlowPrivacyAndData` in a right-side modal
-   **Revoke Access** button — opens the confirmation modal

### `PermissionsList` Component

Filters categories where `sharing !== false` (matching the logic in `AppInstallConsentModal`):

```typescript
const acceptedReadCategories = Object.entries(categories)
    .filter(([_, config]) => (config as { sharing?: boolean }).sharing !== false)
    .map(([category]) => category);
```

This ensures only actually-shared categories are displayed.

---

## Revoke Confirmation Modal

### `RevokeAccessConfirmationModal`

Special handling for the LearnCard AI contract:

-   **Icon**: Red trash can on red background
-   **Title**: "Disable AI features?" (instead of "Revoke Access?")
-   **Body**: "This will revoke LearnCard AI access and turn off AI features."
-   **Confirm button**: "Disable AI & Revoke" (instead of "Yes, Revoke Access")

For all other contracts:

-   **Title**: "Revoke Access?"
-   **Body**: "{name} will no longer be able to access your {brandName} data."
-   **Confirm button**: "Yes, Revoke Access"

---

## Related Files

| File                                                                         | Purpose                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `apps/learn-card-app/src/components/data-sharing/ManageDataSharingModal.tsx` | Main modal + detail view + permissions list              |
| `apps/learn-card-app/src/pages/consentFlow/ConsentFlowPrivacyAndData.tsx`    | Permission editing screen opened from detail view        |
| `apps/learn-card-app/src/components/data-sharing/XApiDataFeedModal.tsx`      | xAPI data feed opened from detail view                   |
| `apps/learn-card-app/src/hooks/useAiConsentToggle.ts`                        | AI toggle called when revoking the LearnCard AI contract |

---

## UX Notes

-   Empty state: shield icon + "No data sharing yet" + "When you connect apps, they'll appear here."
-   Each contract row shows the app image, name, and a permission summary like "3 read, 1 write"
-   ChevronRight icon indicates the row is tappable
-   The detail modal height is fixed at `80vh` with internal scrolling for permissions
