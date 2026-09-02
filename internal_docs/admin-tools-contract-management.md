# Admin Tools: Contract Management Improvements

## Overview

The contract viewing experience in **Admin Tools → Manage ConsentFlow Contracts** was updated to show actual contract details rather than only a raw list of consent records. A **"Use as template"** button was also added so admins can create new contracts starting from an existing structure.

---

## ViewContractDataModal

**Location**: `apps/learn-card-app/src/pages/adminToolsPage/ViewContractDataModal.tsx`

### What Changed

Previously, clicking a contract in the Admin Tools list showed consent records (raw JSON of who consented). Now it displays a rich contract detail view with:

1.  **Header** — Contract name, subtitle, image, plus action buttons
2.  **Contract Details card** — Owner, URI, created/updated/expires dates, guardian consent requirement, description, reason for accessing, redirect URL, front door boost URI
3.  **Sharing Metadata card** — Anonymize flag, auto-boosts list, writers list
4.  **Read Permissions card** — Personal fields as chips + credential categories with icons, titles, and permission mode labels (`Required`, `Opt-in`, `Opt-out`)
5.  **Write Permissions card** — Same as read but for write permissions
6.  **Collapsible Consent Records section** — Folded by default; shows count badge, loading spinner, and raw JSON records when expanded

### Permission Mode Labels

Each category entry shows a pill indicating how it behaves in the consent modal:

-   **Required** (`required: true`) — dark pill, user cannot opt out
-   **Opt-out** (`required: false`, `defaultEnabled: true`) — amber pill, user can uncheck
-   **Opt-in** (`required: false`, `defaultEnabled: false`) — gray pill, user must check

### Icons

Categories use `contractCategoryNameToCategoryMetadata(...)` from `learn-card-base` to resolve:

-   `IconWithShape` — colored shape icon (for verifiable-data categories like Goals, Work Experience, etc.)
-   `IconComponent` — fallback grayscale icon inside a circular background

---

## "Use as Template" Flow

### How It Works

1.  Admin opens a contract detail view
2.  Clicks **"Use as template"** (next to Share)
3.  `closeModal()` closes the detail view
4.  `setTimeout(..., 0)` opens `CreateContractModal` with `templateContract={resolvedContract}`

### CreateContractModal Template Support

**Location**: `apps/learn-card-app/src/pages/adminToolsPage/CreateContractModal.tsx`

The modal accepts an optional `templateContract?: ConsentFlowContractDetails` prop.

When a template is provided:

-   `getContractTypeForTemplate(template)` determines the initial tab (`Classic`, `GameFlow`, or `Front Door Cred`)
-   `getInitialContractState(template)` clones the template's:
    -   `contract.read` / `contract.write` (including personal fields and credential categories)
    -   `name`, `subtitle`, `description`, `image`, `expiresAt`, `reasonForAccessing`, `redirectUrl`, `frontDoorBoostUri`
    -   `needsGuardianConsent`

The admin can then edit any field before creating the new contract.

---

## UI Details

### Layout

-   Max-width: `!max-w-[500px]`
-   Max-height: `!max-h-[70vh]` for create modal
-   Scrollable content inside the detail view
-   Two-column grid on desktop for Contract Details / Sharing Metadata and Read / Write permissions
-   Single column on mobile

### Consent Records Collapsible

```html
<details>
    <summary>Consent records <span>{count}</span></summary>
    <div class="max-h-[420px] overflow-y-auto">
        <ol>
            {records.map(...)}
        </ol>
    </div>
</details>
```

-   Chevron rotates 180° when open
-   Loading spinner shown while `consentDataLoading` is true
-   Empty state: "No one has consented to this contract yet"

---

## Related Files

| File                                                                              | Purpose                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/learn-card-app/src/pages/adminToolsPage/ViewContractDataModal.tsx`          | Contract detail view + consent records            |
| `apps/learn-card-app/src/pages/adminToolsPage/CreateContractModal.tsx`            | Contract creation with template support           |
| `apps/learn-card-app/src/pages/adminToolsPage/ManageConsentFlowContractsPage.tsx` | List page that opens the detail view              |
| `packages/learn-card-base/src/types/boostAndCredentialMetadata.ts`                | `contractCategoryNameToCategoryMetadata` resolver |

---

## Future Improvements

-   Consent records could be rendered as a table or cards instead of raw JSON
-   Could add a "Clone and publish" one-click action without opening the create modal
