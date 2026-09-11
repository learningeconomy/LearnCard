# ScoutPass i18n Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update PR #1417 to current `main`, resolve every merge conflict, and address all 22 unresolved i18n review threads with regression coverage.

**Architecture:** Preserve the existing per-app ScoutPass Paraglide runtime and four locale catalogs. Merge `origin/main` into the PR branch, retain current ScoutPass behavior in conflicts, and fix review findings at their source: locale selection, message compilation/rendering, locale-aware copy/formatting, and CI guardrails.

**Tech Stack:** React, TypeScript, Paraglide JS, Vitest, Testing Library, ESLint, Bun, Vite, GitHub Actions.

## Global Constraints

-   Preserve current `main` behavior when resolving conflicts; localize the resulting UI rather than restoring removed behavior.
-   Support exactly `en`, `es`, `fr`, and `ar`; Arabic uses `dir="rtl"` and physical directional icons must mirror.
-   Do not edit or commit generated `apps/scouts/src/paraglide` output.
-   Use `{{name}}` for Paraglide interpolation and `<0>...</0>` / `<0/>` for component markup.
-   Resolve translated values during render or invocation, never at module scope or behind a memo that lacks `locale`.
-   Do not post GitHub replies, resolve review threads, push, or merge the PR before the user's manual pass.

---

### Task 1: Merge current main and resolve conflicts

**Files:**

-   Resolve: `.github/workflows/lint.yml`
-   Resolve: `apps/scouts/src/FullApp.tsx`
-   Resolve: the nine conflicted ScoutPass component/page files reported by `git diff --name-only --diff-filter=U`
-   Resolve: `bun.lock`

**Interfaces:**

-   Consumes: local PR branch at `fb40017af` and `origin/main` at `4c9acad74`
-   Produces: a merge commit with no unmerged paths and current-main behavior plus ScoutPass translations

-   [ ] **Step 1: Merge without committing**

Run: `git merge --no-commit --no-ff origin/main`

Expected: Git stops at the known 11-file conflict set.

-   [ ] **Step 2: Resolve each conflict against all three stages**

For each conflict, compare `:1:path`, `:2:path`, and `:3:path`. Keep current-main component behavior and reapply `m['key']()` or `TransP` only around user-facing copy. Regenerate `bun.lock` from the merged manifests instead of hand-combining lock entries.

-   [ ] **Step 3: Verify the merge result**

Run: `git diff --check && test -z "$(git diff --name-only --diff-filter=U)"`

Expected: exit 0 with no conflict markers, whitespace errors, or unmerged paths.

-   [ ] **Step 4: Commit the merge**

Run: `git commit -m "merge: update ScoutPass i18n branch from main"`

Expected: a two-parent merge commit whose second parent is `origin/main`.

### Task 2: Make locale initialization deterministic and storage-safe

**Files:**

-   Modify: `apps/scouts/src/i18n/detectLocale.test.ts`
-   Modify: `apps/scouts/src/i18n/detectLocale.ts`
-   Create: `apps/scouts/src/i18n/localeProvider.test.tsx`
-   Modify: `apps/scouts/src/i18n/index.tsx`
-   Modify: `apps/scouts/src/AppRouter.tsx`
-   Modify: `apps/scouts/src/components/sidemenu/LanguagePicker.tsx`
-   Modify: the tenant config source actually consumed by `bootstrapTenantConfig()`

**Interfaces:**

-   Produces: `readAvailableStorage(): Storage | undefined`
-   Produces: locale detection that examines the complete `navigator.languages` preference list
-   Produces: a one-shot native detection request that cannot overwrite a later manual selection

-   [ ] **Step 1: Add failing tests**

Cover: a throwing `window.localStorage` getter; persisted English winning over a stale Paraglide runtime locale; `['de-DE', 'es-ES']` selecting Spanish; a manual selection made while native detection is pending; and memoized `AppRouter` labels rerendering after locale change.

-   [ ] **Step 2: Verify RED**

Run: `bunx vitest run src/i18n/detectLocale.test.ts src/i18n/localeProvider.test.tsx`

Expected: failures reproduce each review report before production edits.

-   [ ] **Step 3: Implement the minimal runtime changes**

Guard retrieval and use of storage, remove the `getLocale()` override of a valid detected locale, pass all browser preference candidates to `pickSupported`, and invalidate pending auto-detection when a manual change occurs. Consume `useLocale()` at memo boundaries. Enable all four locales in the static ScoutPass tenant configuration and mount the compact picker on the logged-out login surface.

-   [ ] **Step 4: Verify GREEN**

Run the same focused Vitest command and confirm all cases pass.

### Task 3: Correct Paraglide interpolation and component markup

**Files:**

-   Create: `apps/scouts/src/i18n/renderParts.test.tsx`
-   Modify: `apps/scouts/src/i18n/index.tsx`
-   Modify: `apps/scouts/src/i18n/TransP.tsx`
-   Modify: `apps/scouts/scripts/check-i18n-markers.mjs`
-   Modify: all four `apps/scouts/public/locales/*/translation.json` catalogs
-   Modify: address-book `TransP` callsites using standalone markup

**Interfaces:**

-   Produces: `renderParts()` support for `markup-standalone`
-   Produces: a marker guard that rejects single-brace interpolation and validates standalone markup indices

-   [ ] **Step 1: Add failing renderer and marker tests**

Assert `<0/>` renders `components[0]` with surrounding whitespace intact. Add a compiler-level catalog case proving `{{type}}` interpolates and `{type}` is rejected by the guard.

-   [ ] **Step 2: Verify RED**

Run: `bunx vitest run src/i18n/renderParts.test.tsx` and `bun run i18n:check-markers -- --strict`.

-   [ ] **Step 3: Implement renderer and catalog corrections**

Clone standalone elements directly into the active stack/result, align catalog indices with zero-based component arrays, and convert every single-brace interpolation marker in all locales to valid double-brace syntax.

-   [ ] **Step 4: Verify GREEN**

Run the renderer test, marker guard, locale parity guard, and a generated-message interpolation assertion.

### Task 4: Replace English-only plurals and fixed date formats

**Files:**

-   Modify: `apps/scouts/src/components/boost/boost-search/BoostSearch.tsx`
-   Modify: `apps/scouts/src/pages/SkillFrameworks/ConfirmAlignmentDeletionModal.tsx`
-   Modify: `apps/scouts/src/components/boost/boost-options-menu/ShareBoostLink.tsx`
-   Modify: remaining production `pluralize` / `conditionalPluralize` and fixed display-date callsites
-   Modify: all four locale catalogs
-   Modify: `apps/scouts/src/i18n/formatters.test.ts`

**Interfaces:**

-   Consumes: `formatLocaleDate()` and compiled `_one` / `_other` catalog functions
-   Produces: locale-selected singular/plural messages and locale-formatted user-visible dates

-   [ ] **Step 1: Add failing behavior tests**

Cover singular/plural count selection in the alignment-deletion message and locale-formatted dates for French and Arabic.

-   [ ] **Step 2: Verify RED**

Run the focused component/formatter tests and confirm the existing English suffix/fixed-format behavior fails expectations.

-   [ ] **Step 3: Replace production callsites**

Select complete catalog messages by count, pass each count exactly once, use `competency/competencies` in Skill Framework copy, and replace user-visible Moment `MM/D/YYYY` patterns with `formatLocaleDate`. Preserve machine-value ISO date formats.

-   [ ] **Step 4: Verify GREEN and search for leftovers**

Run focused tests, then use `rg` to confirm no production translated noun is passed to `pluralize` and no reviewed fixed display-date pattern remains.

### Task 5: Complete RTL, accessibility, and catalog-language review fixes

**Files:**

-   Modify: `apps/scouts/src/pages/login/LoginPage.tsx` and social-login controls
-   Modify: production files containing physical left/right arrows or carets
-   Modify: `apps/scouts/src/components/i18n/DirectionalIcon.tsx` and tests as needed
-   Modify: Arabic deletion warning, Spanish recovery copy, French upload terminology, proof-verification copy, and competency definitions in all catalogs

**Interfaces:**

-   Produces: localized accessible names for login controls
-   Produces: directional icons that mirror from document locale while non-directional icons remain unchanged

-   [ ] **Step 1: Add failing accessibility and RTL tests**

Render login under Arabic and assert localized accessible names. Render representative back/forward controls under `dir="rtl"` and assert the directional transform/wrapper is applied.

-   [ ] **Step 2: Verify RED**

Run the focused Testing Library tests and confirm the existing English names/non-mirrored icons fail.

-   [ ] **Step 3: Implement UI and catalog corrections**

Move `alt`, `aria-label`, and button labels into the catalog. Apply `DirectionalIcon` or logical-direction CSS across the reviewed production set. Restore the full Arabic destructive warning, the full Spanish recovery explanation, consistent French `Téléverser` upload terminology, and corrected credential-proof/competency source meanings with corresponding translations.

-   [ ] **Step 4: Verify GREEN**

Run focused tests plus catalog parity, marker, and untranslated-value checks.

### Task 6: Make completeness checks strict and clean-checkout-safe

**Files:**

-   Modify: `apps/scouts/.eslintrc-i18n.cjs`
-   Modify: `apps/scouts/package.json`
-   Modify: `.github/workflows/lint.yml`
-   Modify: reviewed production literal callsites and explicit allowlists

**Interfaces:**

-   Produces: `i18n:generate`
-   Produces: focused i18n tests that generate Paraglide before Vitest imports generated modules
-   Produces: a CI literal scan that exits nonzero for unallowlisted user-facing text, attributes, expressions, toast arguments, and config labels

-   [ ] **Step 1: Reproduce clean-checkout and scan failures**

With `src/paraglide` absent, run the documented focused i18n test command and capture the module-resolution failure. Run the broadened scan configuration and capture current violations.

-   [ ] **Step 2: Add generation prerequisite**

Add an explicit Paraglide generation script using the app's `project.inlang/settings.json`, and make focused i18n test/CI commands invoke it before Vitest.

-   [ ] **Step 3: Broaden and enforce literal detection**

Scan JSX text, string-valued visible attributes, JSX expressions, user-facing notification/toast calls, and production display config. Translate genuine UI copy and allowlist only audited brands, symbols, machine values, and developer-only diagnostics.

-   [ ] **Step 4: Verify strict checks**

Run every i18n guard and confirm each exits 0 without warning-only completeness gaps.

### Task 7: Final verification and local handoff

**Files:**

-   Inspect: all files changed relative to `origin/main`

**Interfaces:**

-   Produces: a locally committed branch ready for the user's manual browser/device pass

-   [ ] **Step 1: Run focused i18n tests from generated-output-clean state**

Run the documented package script after removing only generated `src/paraglide`; expect generation plus all focused tests to pass.

-   [ ] **Step 2: Run all ScoutPass i18n guards**

Run keys, imports, parity, markers, untranslated values, frozen translations, and strict literal scanning; expect exit 0 for each.

-   [ ] **Step 3: Run ScoutPass production build**

Run: `bun run build` from `apps/scouts`; expect Vite exit 0.

-   [ ] **Step 4: Inspect diff hygiene**

Run `git diff --check origin/main...HEAD`, verify no unmerged paths or generated Paraglide files, and review the final diff for unrelated changes.

-   [ ] **Step 5: Commit fixes locally**

Create focused local commits without pushing. Report the worktree path, commit SHAs, verification evidence, and the remaining native-speaker/device checks for the user's manual pass.
