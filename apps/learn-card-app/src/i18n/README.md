# i18n — Internationalization

This directory contains the i18n infrastructure for the LearnCard app using
**react-i18next** (i18next + react-i18next + i18next-http-backend + i18next-browser-languagedetector).

## Quick start

### Supported languages

| Code | Name | RTL |
|------|------|-----|
| `en` | English | No |
| `es` | Español | No |
| `fr` | Français | No |
| `ar` | العربية | **Yes** |

### Adding a translation key

1. Add the key to `public/locales/en/translation.json` (source of truth)
2. Use it in code:

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
t('key.path', 'English fallback text', { variable: 'value' });
```

### Adding a new language

1. Create `public/locales/<code>/translation.json` with all keys translated
2. Add the code to `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`
3. If the language is RTL, add it to `RTL_LANGUAGES` set in the same file
4. Add the code to `tenants i18n.supportedLanguages` in the tenant config
5. Add a label entry in `public/locales/<code>/translation.json` under `language.<code>`

### Extracting translations

```bash
pnpm i18n:extract
```

This scans all `src/**/*.{ts,tsx}` for `t()` and `<Trans>` calls and
updates the EN resource file. **Do not edit EN translations by hand after
running extract** — the parser rewrites the file.

## Flash-of-key mitigations

We use three structural safeguards to prevent raw translation keys
from appearing on screen during async catalog loads:

1. **Synchronous bundled EN resources** — the default locale's translations
   are imported synchronously and injected at init time. No async window.
2. **Mandatory default-arg `t()` values** — every `t(key, defaultValue, options)`
   call passes the English string as the second argument. The i18next-parser
   config has `failOnUpdate: true` which blocks merges with missing defaults.
3. **Suspense at route boundaries** — `react: { useSuspense: true }` + a
   `<Suspense>` boundary in `AppRouter.tsx` suspends non-EN locales until
   their catalogs load, rather than rendering keys.

## RTL support

Arabic (`ar`) is RTL. The `I18nProvider` (in `I18nProvider.tsx`) sets
`document.documentElement.dir = 'rtl'` for `ar` via the `useTranslation()`
hook's `i18n.language` change listener.

**CSS conventions:**
- Use Tailwind's `rtl:` variant for directional overrides
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`,
  `inset-inline`, etc.) in SCSS instead of `margin-left/right`
- Use `DirectionalIcon` wrapper for icons that need to flip in RTL

## Architecture

```
src/i18n/
├── index.ts           — i18next init (bundled EN, async ES/FR/AR)
├── I18nProvider.tsx    — <html dir lang> setter component
├── ADR-001-library-spike.md — Library decision record (why react-i18next)
└── README.md          — This file

public/locales/
├── en/translation.json — Source of truth (hand-written + extracted)
├── es/translation.json — AI-translated (POC)
├── fr/translation.json — AI-translated (POC)
└── ar/translation.json — AI-translated (POC)

src/components/
├── i18n/DirectionalIcon.tsx — RTL-aware icon flip wrapper
└── sidemenu/LanguagePicker.tsx — UI language switcher
```
