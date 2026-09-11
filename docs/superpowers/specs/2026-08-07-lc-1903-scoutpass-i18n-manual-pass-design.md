# LC-1903 — ScoutPass i18n Manual-Pass Remediation — Design

-   **Pull request:** [#1417](https://github.com/learningeconomy/LearnCard/pull/1417)
-   **Branch:** `feat/lc-1903-scouts-i18n`
-   **App:** `apps/scouts`
-   **Date:** 2026-08-07

## Overview

The first manual French-language pass of ScoutPass found untranslated copy in four high-traffic
surfaces: the side menu and navigation actions, the wallet category cards, category information
modals, and profile/share actions. The side-menu language selector also looks narrower and more
elevated than the adjacent menu sections.

This follow-up will localize those surfaces for all four supported locales (`en`, `es`, `fr`, and
`ar`) and align the selector with the surrounding menu cards. It is intentionally bounded to the
manual-pass findings and directly related labels rather than attempting to eliminate the app's
entire legacy untranslated-string baseline.

## Goals

-   Translate every visible side-menu label, directly related navigation action, and affected
    profile/share button.
-   Translate wallet category titles and descriptions.
-   Translate category information modal titles, descriptions, and its dismiss action.
-   Keep locale switching live: translated values must be resolved during render, not at module
    initialization.
-   Make the side-menu language selector the same usable width and visual elevation as adjacent
    menu sections.
-   Add focused regression coverage for these config-driven surfaces, which the current static scan
    baselines rather than enforcing.

## Non-goals

-   Clearing all 1,073 entries in the existing ScoutPass AST baseline.
-   Translating developer-only diagnostics, logs, test fixtures, or unrelated screens.
-   Redesigning the language-selection modal or compact logged-out selector.
-   Changing navigation routes, category behavior, or product terminology outside the locale
    catalogs.

## Current architecture and root causes

### Side menu and navigation

ScoutPass reads its menu link arrays from
`packages/learn-card-base/src/components/sidemenu/sidemenuHelpers.ts`. Those arrays contain stable
paths and icons but also raw English `name` values. The ScoutPass components render `link.name`
directly. LearnCard App already resolves equivalent labels through Paraglide at render time, but
its helper assumes a different link identifier shape and cannot safely be dropped onto the legacy
numeric ScoutPass entries without an adapter.

The launch-pad action array and Boost button also contain English display strings even though the
catalog already has nearby `launchPad.*` messages.

### Wallet categories

`WalletPage.tsx` declares `walletPageData` at module scope with English titles and descriptions.
Putting translated values into that module-scope array would freeze the initially selected locale,
so the display data must instead be built during render.

### Category descriptor modal

`category-descriptions.ts` stores English paragraphs at module scope. The modal then infers a
category by comparing its `title` prop to English strings. Localizing that title would break the
switch. The modal must receive a stable category enum and derive its icon, localized title, and
localized description from that enum.

### Language selector

The side-menu container already supplies horizontal padding. `LanguagePicker` adds another
`px-4`, making its trigger narrower than the adjacent section. Its `shadow-soft-bottom` also gives
it an elevation not used by the surrounding flat menu cards.

## Target design

### 1. Render-time menu and navigation labels

-   Add an app-local ScoutPass menu-label resolver keyed by stable route or category identity.
-   Resolve labels inside `SideMenuRootLinks` and `SideMenuSecondaryLinks` during render.
-   Never compare or branch on localized display text; admin/visibility checks continue to use
    stable path, flag, or category values.
-   Replace the ScoutPass menu's raw `Boost` label and the launch-pad action labels with existing or
    new Paraglide messages.
-   Add `sidemenu.links.*` catalog entries for every ScoutPass root and secondary link in all four
    locales.

An app-local adapter is preferred over changing the shared LearnCard menu contract in this PR. It
keeps the change bounded while following the same render-time pattern proven in LearnCard App.

### 2. Render-time wallet metadata

-   Replace the module-scope English `walletPageData` with a render-time builder or component-local
    array.
-   Keep stable category subtype, route behavior, icons, and styling unchanged.
-   Add explicit catalog messages for each category title and description:
    -   Social Boosts — social milestones
    -   Merit Badges — scouting achievements
    -   Troops — troop affiliations
-   Pass the localized values to `WalletSquare` exactly as it receives the current English values.

### 3. Stable category descriptor model

-   Change `CategoryDescriptorModal` to consume a stable `BoostCategoryOptionsEnum` value rather
    than infer category from an English title.
-   Resolve the icon, display title, and paragraph from the stable category during render.
-   Move the four category descriptions into all locale catalogs.
-   Reuse `common.gotIt` for the dismiss button.
-   Update the presenting subheader to pass the category enum it already knows.

This removes the existing localization hazard where translating `Social Boosts`, `Troops`, or
`Merit Badges` would cause the modal's English-string switch to fail.

### 4. Profile and related buttons

-   Add and use a message for `Complete Profile` in `MyScoutsModal`.
-   Translate directly related manual-pass actions found in the same shared surfaces, including the
    ScoutPass Boost action and launch-pad navigation labels/accessibility name.
-   Reuse existing common messages where suitable instead of creating duplicates.

### 5. Language selector styling

-   Remove the selector wrapper's extra horizontal padding so its trigger uses the same available
    width as the adjacent menu section.
-   Keep `w-full`, the existing content padding, and current label/caret layout.
-   Use `rounded-[20px]` to match the neighboring menu card.
-   Remove `shadow-soft-bottom`; retain a flat white background with a subtle hover color transition.
-   Preserve current hiding, locale switching, modal opening, and accessibility behavior.

## Catalog strategy

-   English remains the source catalog.
-   Add every new key to `en`, `es`, `fr`, and `ar` together.
-   Reuse established terms already present in each ScoutPass catalog where possible, such as the
    existing singular/plural category labels.
-   Keep product names and stable machine values unchanged; translate descriptive and action copy.
-   Generate Paraglide output through the existing script and never commit `src/paraglide`.

## Testing strategy

Follow test-driven development for each behavior group:

1. Add a failing menu test proving every ScoutPass menu route resolves to a non-empty label in all
   four catalogs and the components no longer render raw `link.name`.
2. Add failing wallet/category tests proving titles and descriptions come from the active message
   functions and category descriptors are selected by stable enum rather than English title.
3. Add a failing integration assertion for `Complete Profile`, `Got it`, and directly related
   launch-pad/Boost labels.
4. Add a focused selector regression test that verifies full-width menu alignment and rejects the
   removed shadow class.
5. Run focused Vitest tests, every ScoutPass i18n guard, TypeScript checking where available, and
   the ScoutPass production build.

Manual verification should switch among French, Spanish, Arabic, and English without reloading and
confirm the menu, wallet, modal, and profile/share surfaces update immediately. Arabic should retain
the existing RTL layout behavior.

## Key files

| Path                                                             | Responsibility                        |
| ---------------------------------------------------------------- | ------------------------------------- |
| `apps/scouts/src/components/sidemenu/SideMenuRootLinks.tsx`      | Localized root menu labels            |
| `apps/scouts/src/components/sidemenu/SideMenuSecondaryLinks.tsx` | Localized wallet/category menu labels |
| `apps/scouts/src/components/sidemenu/SideMenu.tsx`               | Localized Boost action                |
| `apps/scouts/src/components/sidemenu/LanguagePicker.tsx`         | Full-width, flat selector treatment   |
| `apps/scouts/src/pages/launchPad/LaunchPad.tsx`                  | Localized navigation/action labels    |
| `apps/scouts/src/pages/wallet/WalletPage.tsx`                    | Render-time localized wallet metadata |
| `apps/scouts/src/components/category-descriptor/*`               | Stable category descriptor model      |
| `apps/scouts/src/components/main-subheader/MainSubHeader.tsx`    | Pass stable category identity         |
| `apps/scouts/src/components/scouts/MyScoutsModal.tsx`            | Localized profile completion action   |
| `apps/scouts/public/locales/*/translation.json`                  | Four-locale source messages           |
| `apps/scouts/src/i18n/*.test.*`                                  | Focused regression coverage           |

## Risks and mitigations

-   **Locale freeze:** Message functions called at module scope would not update reliably. Build all
    translated display metadata during render.
-   **Translated-string control flow:** Switching on translated titles would break non-English
    locales. Use paths and enums for all branching.
-   **Dynamic-key blind spots:** Static guards cannot see constructed message keys. Add explicit
    catalog-completeness tests for every menu/category entry.
-   **Scope creep:** The scanner's legacy baseline is large. Remove only baseline entries touched by
    this work and leave unrelated debt for follow-up.
-   **Long translated labels:** Keep menu/button heights content-driven and verify French and Arabic
    layouts during the manual pass.
