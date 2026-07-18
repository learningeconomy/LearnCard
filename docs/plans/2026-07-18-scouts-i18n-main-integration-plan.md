# ScoutPass i18n Main Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge current `main` into PR #1417 and make ScoutPass locale switching complete, tenant-aware, storage-safe, and guarded against frozen translations.

**Architecture:** Keep the existing per-app Paraglide catalog and React `LocaleProvider`. Port the finalized LearnCard runtime and ESLint patterns into ScoutPass, resolve merge conflicts by preserving `main` behavior, and enforce the Scout catalog and runtime rules in CI.

**Tech Stack:** TypeScript, React, Paraglide JS, Vitest, ESLint, GitHub Actions, Bun/Nx.

## Global Constraints

-   Preserve current `main` behavior in every merge conflict; add ScoutPass translations around that behavior.
-   Do not commit generated `apps/scouts/src/paraglide` output.
-   Support exactly `en`, `es`, `fr`, and `ar`; Arabic sets document direction to `rtl`.
-   Resolve message functions at render or invocation time, never at module import time.
-   Every translated `useMemo` must depend on the active locale.

---

### Task 1: Merge current main and preserve post-branch behavior

**Files:**

-   Resolve: the files reported by `git diff --name-only --diff-filter=U`
-   Verify: `apps/scouts/src/FullApp.tsx`
-   Verify: `apps/scouts/src/pages/login/LoginPage.tsx`
-   Verify: `apps/scouts/src/pages/login/LoginFooter.tsx`
-   Verify: Scout image-upload, troop, and profile-setup conflict files

**Interfaces:**

-   Consumes: `origin/main` at `ac735c05c` or newer
-   Produces: a merge result with no unmerged paths and all Scout message calls intact

-   [ ] **Step 1: Merge without committing**

Run: `git merge --no-commit --no-ff origin/main`
Expected: merge pauses with the known conflict set.

-   [ ] **Step 2: Resolve each conflict**

For each file from `git diff --name-only --diff-filter=U`, retain current-main component behavior and reapply `m['key']()` calls to user-facing copy. In `FullApp.tsx`, keep both `SharedI18nProvider` and `UserProfileSetupListener`. In login, keep `getConfigCapabilities().deviceLinking`, current profile-image fallback, configurable `LoginFooter` props, and translated labels.

-   [ ] **Step 3: Verify the index is conflict-free**

Run: `git diff --check && test -z "$(git diff --name-only --diff-filter=U)"`
Expected: exit 0 with no conflict markers or whitespace errors.

-   [ ] **Step 4: Create the merge commit**

Run: `git commit`
Expected: one merge commit with `origin/main` as the second parent.

### Task 2: Add tenant-aware, storage-safe locale tests

**Files:**

-   Create: `apps/scouts/src/i18n/detectLocale.test.ts`
-   Create: `apps/scouts/src/i18n/localeChange.test.ts`
-   Modify: `apps/scouts/src/i18n/detectLocale.ts`
-   Create: `apps/scouts/src/i18n/localeChange.ts`
-   Modify: `apps/scouts/src/i18n/index.tsx`
-   Modify: `apps/scouts/src/i18n/useLanguageSelectorConfig.ts`
-   Modify: `apps/scouts/src/index.tsx`
-   Modify: `apps/scouts/environments/scoutpass/config.json`
-   Modify: `apps/scouts/environments/scoutpass/config.local.json`

**Interfaces:**

-   Produces: `setTenantSupportedLanguagesCache(langs): void`
-   Produces: `getEffectiveSupportedLanguages<T extends string>(compiled): T[]`
-   Produces: `applyLocaleChange(lang, setRuntimeLocale, setReactLocale, storage): void`

-   [ ] **Step 1: Write failing tenant-scope tests**

Test that `['en','es','fr','ar']` intersected with `['en','fr']` returns `['en','fr']`, and that an unset or empty tenant cache returns all compiled languages.

-   [ ] **Step 2: Run the tenant tests and verify RED**

Run: `bunx vitest run src/i18n/detectLocale.test.ts`
Expected: FAIL because the supported-language cache exports do not exist.

-   [ ] **Step 3: Write the failing storage test**

Use a storage object whose `setItem` throws, invoke `applyLocaleChange('fr', runtimeSpy, stateSpy, storage)`, and assert both spies still receive `fr`.

-   [ ] **Step 4: Run the storage test and verify RED**

Run: `bunx vitest run src/i18n/localeChange.test.ts`
Expected: FAIL because `applyLocaleChange` does not exist.

-   [ ] **Step 5: Implement the minimal runtime behavior**

Port `getEffectiveSupportedLanguages` and cache bootstrapping from the LearnCard app. Implement `applyLocaleChange` so runtime and React state change before a guarded persistence attempt. Use the effective language set for detection and selector visibility. Explicitly configure ScoutPass for all four locales.

-   [ ] **Step 6: Run both tests and verify GREEN**

Run: `bunx vitest run src/i18n/detectLocale.test.ts src/i18n/localeChange.test.ts`
Expected: all tests pass.

### Task 3: Port and satisfy frozen-translation guards

**Files:**

-   Create: `apps/scouts/.eslintrc-i18n-memo.cjs`
-   Create: `apps/scouts/eslint-rules/no-frozen-i18n-memo.js`
-   Create: `apps/scouts/eslint-rules/no-module-scope-i18n.js`
-   Modify: `apps/scouts/package.json`
-   Modify: `apps/scouts/src/components/auth/ReAuthOverlay.tsx`
-   Modify: `apps/scouts/src/components/network-settings/networkSettings.helpers.ts`
-   Modify: `apps/scouts/src/components/recovery/RecoveryFlowModal.tsx`
-   Modify: `apps/scouts/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers.ts`
-   Modify: `apps/scouts/src/pages/meritbadges/MeritBadgesPage.tsx`

**Interfaces:**

-   Produces: `bun run i18n:check-memos`

-   [ ] **Step 1: Copy the finalized LearnCard guards into ScoutPass**

Copy the two rule implementations and standalone config without changing rule semantics; add `i18n:check-memos` using `--rulesdir eslint-rules`.

-   [ ] **Step 2: Run the guard and verify RED**

Run: `bun run i18n:check-memos`
Expected: failures for module-scope calls and translated `useMemo` values.

-   [ ] **Step 3: Defer module-scope translation resolution**

Convert translated constant objects to getter functions or store message keys and resolve them at render/invocation time. Keep non-translated identifiers and enum values stable.

-   [ ] **Step 4: Make translated memos locale-aware**

Call `useLocale()` in `MeritBadgesPage` and add `locale` to dependency arrays containing message resolution.

-   [ ] **Step 5: Run the guard and verify GREEN**

Run: `bun run i18n:check-memos`
Expected: 0 errors.

### Task 4: Close visible-copy, date, and RTL gaps

**Files:**

-   Create: `apps/scouts/src/i18n/formatters.ts`
-   Create: `apps/scouts/src/i18n/formatters.test.ts`
-   Modify: core files reported by `bun run i18n:check-ast`
-   Modify: files formatting user-facing dates with localized month/day names
-   Modify: `apps/scouts/src/components/recovery/RecoveryFlowModal.tsx`

**Interfaces:**

-   Produces: `formatLocaleDate`, `formatLocaleTime`, and `formatLocaleNumber`

-   [ ] **Step 1: Write failing formatter tests**

Mock Paraglide `getLocale()` as `fr` and assert a fixed date formats with a French month; mock `ar` and assert number output differs from English digits where supported.

-   [ ] **Step 2: Run formatter tests and verify RED**

Run: `bunx vitest run src/i18n/formatters.test.ts`
Expected: FAIL because the helpers do not exist.

-   [ ] **Step 3: Port the LearnCard Intl helpers**

Use Paraglide `getLocale()` for `Intl.DateTimeFormat` and `Intl.NumberFormat`; replace Moment formats that render month/day words while leaving machine-value `YYYY-MM-DD` formats unchanged.

-   [ ] **Step 4: Wrap the recovery back icon**

Render `chevronBackOutline` inside `DirectionalIcon` so it mirrors when `dir=rtl`.

-   [ ] **Step 5: Translate core literal warnings**

Wrap the AppRouter tab labels, generic error-boundary copy, and upload failure copy. Leave brands, punctuation, debug-only UI, and machine formats explicitly allowlisted.

-   [ ] **Step 6: Verify formatters and literal scan**

Run: `bunx vitest run src/i18n/formatters.test.ts && bun run i18n:check-ast`
Expected: formatter tests pass and no unallowlisted core literal errors remain.

### Task 5: Enforce ScoutPass i18n in CI

**Files:**

-   Modify: `.github/workflows/lint.yml`
-   Create: `apps/scouts/scripts/check-i18n-markers.mjs`
-   Create: `apps/scouts/scripts/check-i18n-untranslated.mjs`
-   Create: `apps/scouts/scripts/i18n-marker-allowlist.json`
-   Create: `apps/scouts/scripts/i18n-untranslated-allowlist.json`
-   Modify: `apps/scouts/package.json`

**Interfaces:**

-   Produces: CI coverage for keys, imports, parity, markers, untranslated values, literal strings, and frozen translations

-   [ ] **Step 1: Port catalog-integrity scripts**

Copy the finalized LearnCard marker and untranslated-value checks, retaining their strict-mode behavior and changing only the app-local allowlists.

-   [ ] **Step 2: Run strict checks and establish reviewed allowlists**

Run both scripts with `--strict`; inspect every exception and allowlist only brands, codes, cognates, symbols, and intentionally language-neutral values.

-   [ ] **Step 3: Wire Scout checks into GitHub Actions**

Run pure-Node Scout checks in `I18nKeys`; run `bun run i18n:check-memos` and `bun run i18n:check-ast` from `apps/scouts` in the installed-dependency job.

-   [ ] **Step 4: Run all Scout i18n scripts locally**

Run: `bun run i18n:check-keys && bun run check:i18n-imports && bun run i18n:check-parity && bun run i18n:check-markers -- --strict && bun run i18n:check-untranslated -- --strict && bun run i18n:check-memos && bun run i18n:check-ast`
Expected: every command exits 0.

### Task 6: Final verification

**Files:**

-   Inspect: all files changed relative to `origin/main`

**Interfaces:**

-   Produces: a merge-ready local branch with evidence-backed verification

-   [ ] **Step 1: Run focused tests**

Run: `bunx vitest run src/i18n/*.test.ts`
Expected: all i18n tests pass.

-   [ ] **Step 2: Build ScoutPass**

Run from repository root: `bunx nx build scouts`
Expected: exit 0.

-   [ ] **Step 3: Verify diff hygiene**

Run: `git diff --check origin/main...HEAD` and `git status --short`
Expected: no whitespace errors or uncommitted generated Paraglide output.

-   [ ] **Step 4: Review final scope**

Run: `git diff --stat origin/main...HEAD -- apps/scouts .github/workflows/lint.yml packages/learn-card-base packages/react-learn-card`
Expected: ScoutPass i18n and intentional shared-provider changes only.
