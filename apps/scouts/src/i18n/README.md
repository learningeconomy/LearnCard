# i18n — Internationalization

The LearnCard app uses **Paraglide JS** (`@inlang/paraglide-js`) with the i18next
JSON plugin. Messages are compiled at build time from
`public/locales/{en,es,fr,ar}/translation.json` into `src/paraglide/`
(gitignored) as typed message functions.

> **Working on i18n? Read [`AGENTS.md`](./AGENTS.md)** — it has the conventions,
> the gotchas (translated-string comparisons, plurals, RTL, duplicate imports),
> the shared-package (`useT`) story, and the LaunchDarkly language-selector flag.

## Supported languages

| Code | Name     | RTL     |
| ---- | -------- | ------- |
| `en` | English  | No      |
| `es` | Español  | No      |
| `fr` | Français | No      |
| `ar` | العربية  | **Yes** |

## Adding a translation key

1. Add the key to all four `public/locales/<code>/translation.json` files (`en` is the source of truth).
2. The Paraglide Vite plugin regenerates `src/paraglide/` on save.
3. Use it in code:

```tsx
import * as m from '<rel>/paraglide/messages.js';

m['namespace.key'](); // simple
m['namespace.key']({ brand: name }); // with {{brand}}
```

For strings with inline markup (`<0>…</0>`), use the `TransP` component instead
of string concatenation — see [`AGENTS.md`](./AGENTS.md).

## No flash-of-key

Paraglide is a **compile-time** library: all locale strings are inlined into the
generated message functions, so there is no async chunk load. `setLocale()` flips
a global and every message function returns the new locale immediately — no raw
keys can flash on screen.

## Layout

```
src/i18n/
├── index.tsx          — LocaleProvider, useLocale, useChangeLocale, SUPPORTED_LANGUAGES, RTL_LANGUAGES
├── TransP.tsx         — <Trans>-shaped wrapper over Paraglide .parts() for inline markup
├── languageSelectorConfig.ts (+ .test.ts) — hideLanguageSelector LD flag resolver
├── useLanguageSelectorConfig.ts — flag hook + locale-fallback effect
├── AGENTS.md          — conventions + gotchas (read this)
└── README.md          — this file

project.inlang/settings.json — inlang config (locales + i18next plugin)
src/paraglide/                — generated output (gitignored)
public/locales/{en,es,fr,ar}/translation.json — catalogs
```
