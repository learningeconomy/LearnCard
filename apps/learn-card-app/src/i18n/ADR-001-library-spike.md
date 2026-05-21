# ADR-001: i18n library choice

Date: 2026-05-21
Status: Accepted
Last updated: 2026-05-21 (post-spike correction)

## Outcome

**Library: react-i18next** (i18next + react-i18next + i18next-http-backend + i18next-browser-languagedetector)

Lingui rejected for **our Vite + SWC stack specifically** — not categorically. See "Decision rationale" below for the precise reason; the original "Lingui v6 removed compile-time macros entirely" framing was overstated and is corrected below.

## Spike results

| # | Check | Result | Notes |
|---|---|---|---|
| 1. Dev server + HMR | NOT TESTED | Pre-existing workspace package build failures (`@learncard/render-method-plugin`, `@learncard/sss-key-manager` entry resolution) prevented Vite dependency scan from completing. Not caused by Lingui — baseline build on this worktree also fails. |
| 2. Production build | NOT TESTED | Same as above. |
| 3. Safety-by-default | **FAIL (corrected reasoning — see below)** | The original spike conclusion conflated "package renamed" with "feature removed." See corrected reasoning. |
| 4. Capacitor iOS build | NOT TESTED | Could not build the app at all (see #1/#2). |

## Decision rationale (corrected 2026-05-21)

### Original (overstated) claim

> "Lingui v6 removed compile-time macros entirely. `@lingui/macro@6` returns 404."

This is misleading. The macros didn't disappear — they were **renamed and split**.

### Corrected understanding

In Lingui v5, the unified `@lingui/macro` package was deprecated. In v6 it was removed. **The macros themselves were split into two new entry points and still exist:**

- `@lingui/core/macro` — vanilla-JS macros (framework-agnostic)
- `@lingui/react/macro` — React/JSX macros (`<Trans>`, `t\`\``)

These are still **compile-time** macros, still inline English source into the bundle, still provide structural flash-of-key prevention. The Lingui compile-time guarantee exists in v6.

### Why Lingui split / removed the unified macro package

1. **`babel-plugin-macros` is unmaintained.** Its author publicly stated the package is frozen. Lingui's original macro depended on it.
2. **The old macro leaked React into vanilla-JS / Vue / Solid users' code.** Splitting into `@lingui/core/macro` + `@lingui/react/macro` is the v5 fix.
3. **Four-way maintenance overhead** across babel-plugin-macros + standalone babel-plugin-lingui-macro + SWC plugin + ESLint plugin.

This is healthy library evolution.

### Why Lingui still doesn't fit *our* stack

We use `@vitejs/plugin-react-swc`. To get Lingui's compile-time macros under SWC we'd need `@lingui/swc-plugin`. That plugin has known problems for us today:

- Lingui's own docs label it **"still experimental"**
- It's a **WASM binary that doesn't honor semver against `@swc/core`** — `@lingui/swc-plugin` and `@swc/core` must be version-pinned together; a routine `pnpm update` can break the build
- Known bug: [macros not processed inside `.js`/`.mjs` files](https://github.com/lingui/swc-plugin/issues/77)
- Documented [local-vs-CI build inconsistency on Vite + SWC](https://github.com/lingui/js-lingui/discussions/1758)
- The fallback (adding `babel-plugin-lingui-macro` alongside SWC) means two transpilers in one Vite pipeline — a maintenance burden we don't want

**If our app ran on Babel, Lingui would be a perfectly valid choice today.** It's the SWC integration that's the blocker, not the library.

### Why react-i18next instead

react-i18next is the safe choice for our stack: stable, runtime-only, no build-tool gymnastics, largest community for Capacitor/Ionic. The flash-of-key risk is real but preventable with three structural commitments baked in from the first commit (not optional discipline).

**react-i18next + three mandatory flash-of-key mitigations:**

1. **Synchronous bundled EN resources** — `resources: { en: { translation: enResource } }` + `partialBundledLanguages: true`. The default locale never has an async window.
2. **Mandatory default-arg `t()` values** — every `t(key, defaultValue, options)` call passes the English string as the second argument; enforced by `i18next-parser` config with `failOnUpdate: true`.
3. **`Suspense` at route boundaries** — `react: { useSuspense: true }` + `<Suspense fallback={...}>` wrapping in `AppRouter.tsx`. Non-EN locales suspend rather than flash keys during async load.

### Reconsider when

- `@lingui/swc-plugin` exits experimental status AND pins itself to stable `@swc/core` semver — re-evaluate in 6–12 months
- Arabic pluralization complexity emerges during rollout sweep — FormatJS becomes worth considering (Arabic has 6 CLDR plural forms + gendered agreement; ICU MessageFormat handles this inline more cleanly than i18next-icu plugin)
- The org standardizes on Intl/ICU across multiple products — FormatJS is the standards-aligned pick

## References

- `@lingui/macro` npm registry: v5.9.5 was the final version (deprecated); v6 split into `@lingui/core/macro` + `@lingui/react/macro` (still compile-time)
- `@lingui/swc-plugin` npm registry: v6.1.0, WASM-based, peer-depends on `@lingui/core` v5 or v6, **labeled experimental by upstream**
- [Lingui V5 Migration Guide](https://lingui.dev/releases/migration-5) — macro split rationale
- [Lingui V6 Roadmap (issue #2363)](https://github.com/lingui/js-lingui/issues/2363) — ESM-only + unified macro package removal
- [SWC plugin .js/.mjs processing bug #77](https://github.com/lingui/swc-plugin/issues/77)
- [Vite-SWC local-vs-CI Lingui discussion #1758](https://github.com/lingui/js-lingui/discussions/1758)
- Recommendation doc: `Claude Notes/LearnCard/2026-05-20-lc-1831-i18n-recommendation.md`
