# LC-1656: Credential Edit in Review Step

**Date:** 2026-03-20
**Branch:** `lc-1656-credential-review-validation`
**Status:** Design approved, pending implementation

## Problem

When users upload a resume or transcript in the "Build My LearnCard" checklist, the AI service parses the file and extracts credentials. The current review step (shipped in LC-1656 phase 1) lets users select/deselect credentials but not edit them. AI parsing can produce incorrect or incomplete field values (wrong title, missing role, incorrect dates). Users need a way to correct these before the credentials are issued and stored.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Editing scope | Moderate — 7 key fields | Covers AI parsing errors without overwhelming the user |
| Navigation | Drill-in detail view | Simpler than responsive inline/drill-in. Works well on mobile where this flow primarily runs |
| Architecture | Standalone CredentialEditView | Existing CredentialBuilder operates on `OBv3CredentialTemplate` (wrapper types with `TemplateFieldValue`), not raw `UnsignedVC`. Conversion layer adds fragility for minimal reuse. Purpose-built component is simpler |
| Empty fields | Always show all 7 fields | Lets users add values the AI missed (e.g., add a description to a credential that only got a name) |
| Validation | None | VCs are already valid from the API. We only edit simple string/date/array fields. `issueCredential()` downstream catches structural issues |

## Component Architecture

### New Component

**`CredentialEditView`** (`checklist-steps/CredentialEditView.tsx`, ~150-200 lines)

The drill-in edit screen for a single parsed credential.

**Props:**
```typescript
type Props = {
    credential: { vc: any; metadata?: { name?: string; category?: string } };
    onSave: (editedVc: any) => void;
    onBack: () => void;
};
```

**Layout (top to bottom):**
- Header: Back arrow + credential name as title. Back arrow discards unsaved changes without confirmation (edits are local-only; the original VC is preserved until Save is tapped).
- Form body: Scrollable, fields in labeled card containers (white bg, rounded-[15px], shadow-button-bottom — matches checklist design language)
- Footer: "Save Changes" button (primaryColor, full-width, rounded-[30px])

### Editable Fields

| Field | Input Type | VC Path (read/write) |
|-------|-----------|---------------------|
| Credential Name | Text input | `credentialSubject.achievement.name` |
| Description | Textarea (3 rows, expandable) | `credentialSubject.achievement.description` |
| Achievement Type | Dropdown (OBv3 enum) | `credentialSubject.achievement.achievementType` |
| Role | Text input | `credentialSubject.role` |
| Start Date | Date picker | `credentialSubject.activityStartDate` |
| End Date | Date picker | `credentialSubject.activityEndDate` |
| Skills / Tags | Chip input (type + enter to add, x to remove) | `credentialSubject.achievement.tag[]` |

Empty fields show placeholder text (e.g., "Add a description...").

Achievement Type dropdown uses the existing `OBV3_ACHIEVEMENT_TYPES` constant from `CredentialBuilder/types.ts`.

**Field notes:**
- Dates stored as ISO 8601 strings (e.g., `"2024-06-15T00:00:00.000Z"`). Use date-only picker; time component set to `T00:00:00.000Z`. Prefer native HTML `<input type="date">` for simplicity.
- Skills/Tags: Initialize `tag` to `[]` if `undefined`. Duplicates silently ignored on add.
- Import the `ParsedCredential` type from `CheckListCredentialReviewStep` rather than redefining it.

### State Flow

```
User uploads file
  → fetchParsedCredentials() returns ParsedCredential[]
  → CheckListCredentialReviewStep shows credential list
  → User taps credential row (edit icon / chevron)
  → setEditingIndex(i) → renders CredentialEditView
  → User edits fields (local state in CredentialEditView)
  → User taps "Save Changes"
  → onSave(editedVc) → parent updates parsedCredentials[i].vc
  → Returns to list view with updated name/category
  → User taps "Confirm" on list
  → storeSelectedCredentials() receives edited VCs
  → Wallet issues credentials as normal
```

### Navigation Pattern

Conditional rendering (same pattern as `showReview` in `CheckListUploadResume`):

```
CheckListUploadResume
  └─ showReview === false → Upload UI
  └─ showReview === true
       └─ editingIndex === null → Credential list
       └─ editingIndex !== null → CredentialEditView
```

`editingIndex` state lives in `CheckListCredentialReviewStep`. This same pattern applies to both `CheckListUploadResume` and `CheckListTranscripts`.

### Integration

**CheckListCredentialReviewStep changes:**
- Add edit affordance (pencil icon or chevron) on each credential row
- Add `editingIndex` state (number | null)
- Conditionally render `CredentialEditView` when `editingIndex !== null`
- New prop: `onEditCredential(index: number, editedVc: any) => void`

**CheckListUploadResume changes:**
- Handler to update `parsedCredentials[index]` when a credential is edited via `setParsedCredentials` from `useUploadFile` hook (do not create duplicate local state — `storeSelectedCredentials` reads from the hook's `parsedCredentials`)
- Pass `onEditCredential` callback through to `CheckListCredentialReviewStep`

**CheckListTranscripts changes:**
- Same pattern as Resume: pass `onEditCredential` to `CheckListCredentialReviewStep`, update via `setParsedCredentials` from hook

## File Changes

| File | Change |
|------|--------|
| `checklist-steps/CredentialEditView.tsx` | **NEW** — Edit screen component |
| `checklist-steps/CheckListCredentialReviewStep.tsx` | Add edit navigation, `editingIndex` state, `onEditCredential` prop |
| `checklist-steps/CheckListUploadResume.tsx` | Add `onEditCredential` handler, update `parsedCredentials` on edit |
| `checklist-steps/CheckListTranscripts.tsx` | Pass `onEditCredential` to review step (same pattern as resume) |

## Explicitly Out of Scope

- No JSON-LD validation on edits
- No image editing
- No custom/arbitrary field editing
- No adding new credentials manually
- No reuse of CredentialBuilder components
- No responsive inline-on-desktop behavior (drill-in everywhere)
