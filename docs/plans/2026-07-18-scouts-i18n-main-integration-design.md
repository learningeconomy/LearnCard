# ScoutPass i18n Main Integration Design

## Goal

Merge current `origin/main` into PR #1417 without rewriting its history, preserve the recent ScoutPass and image-provider fixes, and close the Paraglide runtime-localization gaps found during review.

## Integration strategy

-   Create a normal merge commit from `origin/main` into `feat/lc-1903-scouts-i18n`.
-   Resolve conflicts by retaining current `main` behavior and applying ScoutPass message wrapping to the resulting UI.
-   Pay particular attention to `FullApp`, login, image uploads, troop components, and profile setup because those files contain behavior added after the i18n branch diverged.
-   Do not regenerate or commit `src/paraglide`; it remains build-generated and ignored.

## Locale correctness

-   Port tenant-supported-language scoping from the merged LearnCard implementation.
-   Configure the ScoutPass tenant to explicitly enable `en`, `es`, `fr`, and `ar`.
-   Change locale in memory before attempting best-effort persistence so restricted storage cannot abort switching.
-   Replace module-scope message evaluation with deferred getters or message keys.
-   Add active-locale dependencies to memoized translated values.
-   Use locale-aware date/time formatting for user-facing month and day names.
-   Wrap directional navigation icons that must mirror in right-to-left layouts.

## Guardrails

-   Add the LearnCard `no-module-scope-i18n` and `no-frozen-i18n-memo` rules to ScoutPass.
-   Add focused tests for tenant language scoping and storage-safe locale changes.
-   Wire ScoutPass key, import, parity, marker, untranslated-value, literal-string, and frozen-message checks into GitHub Actions.
-   Keep intentional brand names, symbols, and technical values in explicit allowlists rather than leaving core UI literals untracked.

## Verification

-   Run the locale configuration unit tests.
-   Run all ScoutPass i18n guards.
-   Run the ScoutPass build.
-   Inspect the final diff against `origin/main` to ensure unrelated stacked LearnCard changes no longer appear in the PR.
