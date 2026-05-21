# ADR-001: i18n library choice

Date: 2026-05-21
Status: Accepted

## Outcome

**Library: react-i18next** (i18next + react-i18next + i18next-http-backend + i18next-browser-languagedetector)

## Spike results

| # | Check | Result | Notes |
|---|---|---|---|
| 1. Dev server + HMR | NOT TESTED | Pre-existing workspace package build failures (`@learncard/render-method-plugin`, `@learncard/sss-key-manager` entry resolution) prevented Vite dependency scan from completing. Not caused by Lingui — baseline build on this worktree also fails. |
| 2. Production build | NOT TESTED | Same as above. |
| 3. Safety-by-default | **FAIL** | `@lingui/macro` (the package that provides compile-time `<Trans>` inlining — the structural flash-of-key prevention) has no v6 release. `npm view @lingui/macro@6` returns 404. Lingui v6 removed compile-time macros entirely. The v6 runtime `Trans` component renders children as fallback, which is better than raw keys but does not structurally prevent flash-of-key — it still depends on the React tree being mounted and a catalog being loaded. |
| 4. Capacitor iOS build | NOT TESTED | Could not build the app at all (see #1/#2). |

## Decision rationale

LinguiJS v6 does not provide the compile-time message-inlining guarantee that makes flash-of-key structurally impossible. That guarantee only existed in v5 (via `@lingui/macro` + `@lingui/babel-plugin-lingui-macro`), which is incompatible with the v6 ecosystem (`@lingui/swc-plugin`, `@lingui/core`, `@lingui/cli`). Since the entire reason to prefer Lingui was its anti-flash-of-key design, and that design no longer exists in the current version, react-i18next is the better choice.

**react-i18next will be used with three mandatory flash-of-key mitigations:**

1. **Synchronous bundled EN resources** — `resources: { en: { translation: enResource } }` + `partialBundledLanguages: true` so the default locale never has an async loading window
2. **Mandatory default-arg `t()` values** — every `t(key, defaultValue, options)` call passes the English string as the second argument; enforced by `i18next-parser` config with `failOnUpdate: true` and a `defaultValue` function that surfaces missing defaults
3. **`Suspense` at route boundaries** — `react: { useSuspense: true }` + `<Suspense fallback={...}>` wrapping in `AppRouter.tsx` so non-EN locale catalogs suspend rather than render keys during async load

## References

- `@lingui/macro` npm registry: v5.9.5 is the latest (no v6 exists)
- `@lingui/swc-plugin` npm registry: v6.1.0, WASM-based, peer-depends on `@lingui/core` v5 or v6
- Lingui v6 release notes: macros removed; runtime `Trans` from `@lingui/react` replaces compile-time approach
- Recommendation doc: `Claude Notes/LearnCard/2026-05-20-lc-1831-i18n-recommendation.md`
