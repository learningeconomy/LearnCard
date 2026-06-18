# i18n — Internationalization

This directory contains the i18n infrastructure for the LearnCard app using
**Paraglide JS** (`@inlang/paraglide-js`) with the i18next JSON plugin.

## Quick start

### Supported languages

| Code | Name    | RTL     |
| ---- | ------- | ------- |
| `en` | English | No      |
| `es` | Español | No      |
| `de` | Deutsch | No      |
| `ar` | العربية | **Yes** |

### Adding a translation key

1. Add the key to `public/locales/en/translation.json` (source of truth)
2. The Paraglide Vite plugin auto-regenerates `./paraglide/messages.js` on save
3. Use it in code:

```tsx
import * as m from '<relative-path>/paraglide/messages.js';

// Simple message:
{
    m.some_key();
}

// With parameters:
{
    m.some_key({ param: value });
}

// With inline markup (replaces <Trans>):
import { renderParts } from '<relative-path>/i18n';
{
    renderParts(m.some_key.parts(), { '0': <span className="bold" /> });
}
```

### Adding a new language

1. Create `public/locales/<code>/translation.json` with all keys translated
2. Add the code to `locales` array in `project.inlang/settings.json`
3. Add the code to `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`
4. If the language is RTL, add it to the `RTL_LANGUAGES` set
5. Add the code to `i18n.supportedLanguages` in the tenant config
6. Restart the dev server to regenerate messages

### Compiling messages

The Vite plugin auto-compiles on file changes. For CI:

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

## No flash-of-key risk

Paraglide is a **compile-time** i18n library. All locale strings are
inlined into the generated message functions at build time. There is no
async chunk loading — `setLocale()` flips a global variable and all
message functions return the new locale's strings immediately.

The three react-i18next mitigations (bundled EN, mandatory defaults,
Suspense boundaries) are **not needed** with Paraglide. The structural
guarantee is stronger: no asynchronous pathway in the message pipeline,
so no raw keys can appear on screen.

## RTL support

Arabic (`ar`) is RTL. The `LocaleProvider` (in `./index.ts`) sets
`document.documentElement.dir = 'rtl'` for `ar` via a React effect.

**CSS conventions:**

-   Use Tailwind's `rtl:` variant for directional overrides
-   Use CSS logical properties (`margin-inline-start`, `padding-inline-end`,
    `inset-inline`, etc.) in SCSS instead of `margin-left/right`
-   Use `DirectionalIcon` wrapper for icons that need to flip in RTL
    (the `useLocale()` hook provides the current locale)

## Architecture

```
src/i18n/
├── index.ts                    — LocaleProvider, useLocale, renderParts helper
├── I18nProvider.tsx             — Re-exports LocaleProvider (backward compat)
├── ADR-001-library-spike.md     — Library decision record (why react-i18next)
├── ADR-002-paraglide-comparison.md — Paraglide comparison results
└── README.md                   — This file

project.inlang/
└── settings.json               — inlang project config (locales, i18next plugin)

src/paraglide/                  — Generated output (committed for this spike)
├── messages/                   — One module per message
├── messages.js                 — Re-exports all as `m`
├── runtime.js                  — getLocale(), setLocale(), strategy
└── ...

public/locales/
├── en/translation.json         — Source of truth
├── es/translation.json
├── de/translation.json
└── ar/translation.json

src/components/
├── i18n/DirectionalIcon.tsx    — RTL-aware icon flip wrapper
└── sidemenu/LanguagePicker.tsx — UI language switcher
```
