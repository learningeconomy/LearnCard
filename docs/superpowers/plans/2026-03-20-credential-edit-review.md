# Credential Edit in Review Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drill-in credential edit view to the checklist review step so users can correct AI-parsed fields before credentials are issued.

**Architecture:** New `CredentialEditView` component operates directly on `UnsignedVC` objects (no template conversion). `CheckListCredentialReviewStep` gains `editingIndex` state and conditionally renders the edit view. Edits propagate up to the `parsedCredentials` array in `useUploadFile` hook via callback prop.

**Tech Stack:** React, TypeScript, Tailwind CSS, Ionic (existing checklist UI patterns)

**Spec:** `docs/superpowers/specs/2026-03-20-credential-edit-review-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CredentialEditView.tsx` | CREATE | Drill-in edit screen for a single parsed credential (7 fields) |
| `apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListCredentialReviewStep.tsx` | MODIFY | Add edit icon per row, `editingIndex` state, conditional render of CredentialEditView, new `onEditCredential` prop |
| `apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListUploadResume.tsx` | MODIFY | Add `onEditCredential` handler that updates `parsedCredentials` via `setParsedCredentials` |
| `apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListTranscripts.tsx` | MODIFY | Same `onEditCredential` handler pattern as Resume |

Base path for all files: `apps/learn-card-app/src/components/learncard/checklist/checklist-steps/`

---

## Task 1: Create CredentialEditView Component

**Files:**
- Create: `checklist-steps/CredentialEditView.tsx`

- [ ] **Step 1: Create CredentialEditView with header, form fields, and footer**

```tsx
import React, { useState } from 'react';
import { useTheme } from '../../../../theme/hooks/useTheme';
import { OBV3_ACHIEVEMENT_TYPES } from '../../../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { ParsedCredential } from './CheckListCredentialReviewStep';

type Props = {
    credential: ParsedCredential;
    onSave: (editedVc: any) => void;
    onBack: () => void;
};

/** Read a nested VC path, returning '' for missing values */
const getField = (vc: any, path: string): string => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], vc);
    return typeof value === 'string' ? value : '';
};

/** Return the tags array or [] */
const getTags = (vc: any): string[] => {
    return Array.isArray(vc?.credentialSubject?.achievement?.tag)
        ? vc.credentialSubject.achievement.tag
        : [];
};

/** Set a nested path on a deep-cloned VC. Empty string removes the key. */
const setField = (vc: any, path: string, value: string): any => {
    const clone = JSON.parse(JSON.stringify(vc));
    const keys = path.split('.');
    let obj = clone;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (value === '') {
        delete obj[lastKey];
    } else {
        obj[lastKey] = value;
    }
    return clone;
};

export const CredentialEditView: React.FC<Props> = ({ credential, onSave, onBack }) => {
    const [vc, setVc] = useState<any>(() => JSON.parse(JSON.stringify(credential.vc)));
    const [tagInput, setTagInput] = useState('');
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const name = getField(vc, 'credentialSubject.achievement.name');

    const updateField = (path: string, value: string) => {
        setVc((prev: any) => setField(prev, path, value));
    };

    const tags = getTags(vc);

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            const clone = JSON.parse(JSON.stringify(vc));
            if (!clone.credentialSubject) clone.credentialSubject = {};
            if (!clone.credentialSubject.achievement) clone.credentialSubject.achievement = {};
            clone.credentialSubject.achievement.tag = [...tags, trimmed];
            setVc(clone);
        }
        setTagInput('');
    };

    const removeTag = (index: number) => {
        const clone = JSON.parse(JSON.stringify(vc));
        clone.credentialSubject.achievement.tag = tags.filter((_: string, i: number) => i !== index);
        setVc(clone);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    /** Convert ISO datetime to YYYY-MM-DD for date input */
    const toDateInputValue = (isoString: string): string => {
        if (!isoString) return '';
        return isoString.slice(0, 10);
    };

    /** Convert YYYY-MM-DD from date input to ISO 8601 */
    const fromDateInputValue = (dateStr: string): string => {
        if (!dateStr) return '';
        return `${dateStr}T00:00:00.000Z`;
    };

    return (
        <div className="w-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-grayscale-100">
                    <svg className="w-5 h-5 text-grayscale-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h4 className="text-lg text-grayscale-900 font-notoSans font-semibold truncate">
                    {name || 'Edit Credential'}
                </h4>
            </div>

            {/* Form */}
            <div className="w-full bg-white shadow-button-bottom px-6 pt-4 pb-6 rounded-[15px] space-y-4">
                {/* Credential Name */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Credential Name
                    </label>
                    <input
                        type="text"
                        value={getField(vc, 'credentialSubject.achievement.name')}
                        onChange={e => updateField('credentialSubject.achievement.name', e.target.value)}
                        placeholder="e.g. Software Engineer at Acme Corp"
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Description
                    </label>
                    <textarea
                        rows={3}
                        value={getField(vc, 'credentialSubject.achievement.description')}
                        onChange={e => updateField('credentialSubject.achievement.description', e.target.value)}
                        placeholder="Add a description..."
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400 resize-y"
                    />
                </div>

                {/* Achievement Type */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Achievement Type
                    </label>
                    <select
                        value={getField(vc, 'credentialSubject.achievement.achievementType')}
                        onChange={e => updateField('credentialSubject.achievement.achievementType', e.target.value)}
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400 bg-white"
                    >
                        <option value="">Select type...</option>
                        {OBV3_ACHIEVEMENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Role
                    </label>
                    <input
                        type="text"
                        value={getField(vc, 'credentialSubject.role')}
                        onChange={e => updateField('credentialSubject.role', e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>

                {/* Dates */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityStartDate'))}
                            onChange={e => updateField('credentialSubject.activityStartDate', fromDateInputValue(e.target.value))}
                            className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityEndDate'))}
                            onChange={e => updateField('credentialSubject.activityEndDate', fromDateInputValue(e.target.value))}
                            className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400"
                        />
                    </div>
                </div>

                {/* Skills / Tags */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Skills / Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag: string, i: number) => (
                            <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${primaryColor}/10 text-${primaryColor}`}
                            >
                                {tag}
                                <button
                                    onClick={() => removeTag(i)}
                                    className="ml-0.5 hover:opacity-70"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a skill and press Enter..."
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>
            </div>

            {/* Footer */}
            <button
                onClick={() => onSave(vc)}
                className={`w-full mt-4 py-3 rounded-[30px] font-semibold text-white bg-${primaryColor}`}
            >
                Save Changes
            </button>
        </div>
    );
};

export default CredentialEditView;
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/learn-card-app && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to `CredentialEditView.tsx` (other pre-existing errors are fine)

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CredentialEditView.tsx
git commit -m "feat(LC-1656): create CredentialEditView component"
```

---

## Task 2: Add Edit Navigation to CheckListCredentialReviewStep

**Files:**
- Modify: `checklist-steps/CheckListCredentialReviewStep.tsx`

The current component is a flat list with checkboxes. We need to add:
1. An `onEditCredential` prop
2. `editingIndex` state
3. An edit icon/chevron on each row
4. Conditional rendering of `CredentialEditView` when editing

- [ ] **Step 1: Update the component**

Export the `ParsedCredential` type (line 5) so `CredentialEditView` can import it:
```tsx
export type ParsedCredential = { vc: any; metadata?: { name?: string; category?: string } };
```

Add to the existing imports at line 3:
```tsx
import CredentialEditView from './CredentialEditView';
```

Update the `Props` type (line 7-13) to add `onEditCredential`:
```tsx
type Props = {
    credentials: ParsedCredential[];
    fileType: UploadTypesEnum;
    onConfirm: (selectedVcs: any[]) => void;
    onBack: () => void;
    isLoading?: boolean;
    onEditCredential?: (index: number, editedVc: any) => void;
};
```

Destructure the new prop (line 29):
```tsx
}) => {
```
becomes:
```tsx
    onEditCredential,
}) => {
```

Add `editingIndex` state after the existing `selected` state (after line 37):
```tsx
const [editingIndex, setEditingIndex] = useState<number | null>(null);
```

Add an edit handler after the `handleConfirm` function (after line 62):
```tsx
const handleEditSave = (editedVc: any) => {
    if (editingIndex !== null && onEditCredential) {
        onEditCredential(editingIndex, editedVc);
    }
    setEditingIndex(null);
};
```

Wrap the return in a conditional — if `editingIndex !== null`, render the edit view instead. Replace the existing `return (` block (line 66 to end) with:

```tsx
if (editingIndex !== null) {
    return (
        <CredentialEditView
            credential={credentials[editingIndex]}
            onSave={handleEditSave}
            onBack={() => setEditingIndex(null)}
        />
    );
}

return (
    <div className="w-full flex flex-col">
        <div className="w-full bg-white shadow-button-bottom px-6 pt-4 pb-4 mt-4 rounded-[15px]">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg text-grayscale-900 font-notoSans font-semibold">
                    Review Extracted Credentials
                </h4>
                <button
                    onClick={toggleAll}
                    className={`text-sm font-semibold text-${primaryColor}`}
                >
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>
            </div>
            <p className="text-sm text-grayscale-600 font-notoSans mb-4">
                {credentials.length === 0
                    ? 'No credentials were extracted from this file.'
                    : `Select the credentials you'd like to add to your LearnCard.`}
            </p>

            <ul className="w-full flex flex-col gap-2">
            {credentials.map((cred, i) => {
                const isSelected = selected.has(i);
                const name = getCredentialDisplayName(cred);
                const category = getCredentialCategory(cred);

                return (
                    <li
                        key={i}
                        className={`flex items-center justify-between px-4 py-3 rounded-[12px] cursor-pointer border transition-colors ${
                            isSelected
                                ? `border-${primaryColor} bg-${primaryColor}/5`
                                : 'border-grayscale-200 bg-grayscale-50'
                        }`}
                    >
                        {/* Left side: checkbox toggle */}
                        <div
                            className="flex items-center gap-3 flex-1 min-w-0"
                            onClick={() => toggle(i)}
                        >
                            <div
                                className={`min-w-[22px] min-h-[22px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                        ? `bg-${primaryColor} border-${primaryColor}`
                                        : 'bg-white border-grayscale-300'
                                }`}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 pr-3">
                                <p className="text-sm font-semibold text-grayscale-900 truncate">{name}</p>
                                {category && <p className="text-xs text-grayscale-500 mt-0.5">{category}</p>}
                            </div>
                        </div>

                        {/* Right side: edit button */}
                        {onEditCredential && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }}
                                className="ml-2 p-1.5 rounded-full hover:bg-grayscale-100 transition-colors"
                                title="Edit credential"
                            >
                                <svg className="w-4 h-4 text-grayscale-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </li>
                );
            })}
            </ul>
        </div>

        <div className="flex gap-3 mt-4">
            <button
                onClick={onBack}
                className="flex-1 py-3 rounded-[30px] font-semibold text-grayscale-900 bg-grayscale-200"
            >
                Back
            </button>
            <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-[30px] font-semibold text-white bg-${primaryColor} disabled:opacity-50`}
            >
                {isLoading ? 'Saving...' : `Save${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </button>
        </div>
    </div>
);
```

Key changes to the row layout:
- Move the checkbox circle to the left side, tap area covers the text+checkbox
- Add a pencil icon button on the right side (only when `onEditCredential` is provided)
- `e.stopPropagation()` on the edit button so it doesn't toggle the checkbox

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/learn-card-app && npx tsc --noEmit --pretty 2>&1 | grep -i "CredentialReviewStep\|CredentialEditView" | head -10`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListCredentialReviewStep.tsx
git commit -m "feat(LC-1656): add edit navigation to CheckListCredentialReviewStep"
```

---

## Task 3: Wire Up CheckListUploadResume

**Files:**
- Modify: `checklist-steps/CheckListUploadResume.tsx`

- [ ] **Step 1: Add the onEditCredential handler**

After the existing `handleReviewBack` function (line 146-149), add:

```tsx
const handleEditCredential = (index: number, editedVc: any) => {
    setParsedCredentials(prev =>
        prev.map((cred, i) => (i === index ? { ...cred, vc: editedVc } : cred))
    );
};
```

Note: `setParsedCredentials` is already destructured from `useUploadFile` at line 35.

- [ ] **Step 2: Pass the handler to CheckListCredentialReviewStep**

In the JSX where `CheckListCredentialReviewStep` is rendered (line 162-168), add the prop:

```tsx
<CheckListCredentialReviewStep
    credentials={parsedCredentials}
    fileType={UploadTypesEnum.Resume}
    onConfirm={handleReviewConfirm}
    onBack={handleReviewBack}
    isLoading={isSavingSelected}
    onEditCredential={handleEditCredential}
/>
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/learn-card-app && npx tsc --noEmit --pretty 2>&1 | grep -i "UploadResume" | head -10`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListUploadResume.tsx
git commit -m "feat(LC-1656): wire up credential editing in CheckListUploadResume"
```

---

## Task 4: Wire Up CheckListTranscripts

**Files:**
- Modify: `checklist-steps/CheckListTranscripts.tsx`

Same pattern as Task 3.

- [ ] **Step 1: Add the onEditCredential handler**

After the existing `handleReviewBack` function (line 153-156), add:

```tsx
const handleEditCredential = (index: number, editedVc: any) => {
    setParsedCredentials(prev =>
        prev.map((cred, i) => (i === index ? { ...cred, vc: editedVc } : cred))
    );
};
```

Note: `setParsedCredentials` is already destructured from `useUploadFile` at line 34.

- [ ] **Step 2: Pass the handler to CheckListCredentialReviewStep**

In the JSX where `CheckListCredentialReviewStep` is rendered (line 165-171), add the prop:

```tsx
<CheckListCredentialReviewStep
    credentials={parsedCredentials}
    fileType={UploadTypesEnum.Transcript}
    onConfirm={handleReviewConfirm}
    onBack={handleReviewBack}
    isLoading={isSavingSelected}
    onEditCredential={handleEditCredential}
/>
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/learn-card-app && npx tsc --noEmit --pretty 2>&1 | grep -i "Transcripts" | head -10`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/learn-card-app/src/components/learncard/checklist/checklist-steps/CheckListTranscripts.tsx
git commit -m "feat(LC-1656): wire up credential editing in CheckListTranscripts"
```

---

## Task 5: Manual Testing

No automated tests exist for checklist components (E2E only, manual testing per codebase convention).

- [ ] **Step 1: Test resume upload edit flow**

1. Navigate to Build My LearnCard > Add Resume
2. Upload a PDF resume
3. Wait for parsing (loader should appear)
4. Review step should show extracted credentials with pencil icons
5. Tap a credential's pencil icon → should drill into edit view
6. Edit the name and add a tag
7. Tap "Save Changes" → should return to list with updated name
8. Tap back arrow without saving on another credential → should discard changes
9. Tap "Save" on the review list → credentials should be issued
10. Verify the checklist step shows as completed

- [ ] **Step 2: Test transcript upload edit flow**

Same flow but via Add Transcript with multiple files.

- [ ] **Step 3: Test checkbox + edit interaction**

1. Deselect a credential via checkbox
2. Tap edit on the same credential → should work
3. Save edits, verify it stays deselected
4. Confirm only selected credentials are issued

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(LC-1656): address manual testing feedback"
```
