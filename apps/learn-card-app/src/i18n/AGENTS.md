# i18n (LearnCard App) — Agent & Dev Guide

Internationalization for `learn-card-app` runs on **Paraglide JS**
(`@inlang/paraglide-js`) with the **i18next JSON plugin**. Messages are compiled
at build time from `public/locales/{en,es,fr,ar}/translation.json` into
`src/paraglide/` (gitignored) as typed message functions.

## Quick reference

```tsx
import * as m from '<rel>/paraglide/messages.js';

m['namespace.key'](); // simple string
m['namespace.key']({ brand: name }); // {{brand}} interpolation
```

Inline markup (bold / link inside a translated string) — use `TransP`, never
string concatenation. The source string uses `<0>…</0>` index markers:

```tsx
import TransP from '<rel>/i18n/TransP';

// en: "Have your own <0>seed phrase</0>?"
<TransP m={m['login.footer.haveSeedPhrase']} components={[<button onClick={…} />]} />
<TransP m={m['x.body']} values={{ name }} components={[<strong />]} />
```

Locale switching: `useLocale()` / `useChangeLocale()` from `../i18n`.
`SUPPORTED_LANGUAGES` and `RTL_LANGUAGES` live in `src/i18n/index.tsx`.

## Adding a translation key

1. Add the key to **all four** locale files (`public/locales/{en,es,fr,ar}/translation.json`); `en` is the source of truth.
2. The Paraglide Vite plugin regenerates `src/paraglide/` on save.
3. Use `m['your.key']()` in the component.

## Gotchas (hard-won — read before editing)

1. **Never compare against a translated string at runtime.** `if (title === 'Studies')`
   breaks the moment `title` is localized. Switch on a stable id/enum
   (`CredentialCategoryEnum`, `link.id`), not the display label. (Bit us in
   `CategoryDescriptorModal` and `SideMenuRootLinks`.)
2. **Plurals compile to _separate_ functions.** The inlang i18next plugin emits
   `key_one` / `key_other` as distinct message fns — there is no runtime plural
   selector. Use a ternary with two keys
   (`count === 1 ? m['x.matchingSkill']() : m['x.matchingSkills']()`) or a
   single `{{count}}` string.
3. **`TransP` / `<Trans>`** — don't mix a `defaults` prop with children. The
   `components` array is indexed by the `<0>`, `<1>`… markers in the source string.
4. **No fixed `h-[N]` + `max-h-[N]` on buttons holding translated text** — longer
   translations (de/fr/ar) overflow. Let height be content-driven.
5. **`src/paraglide/` is gitignored and generated** — never edit or commit it.
6. **Import `m` once per file.** Both `import * as m` and `import { m }` work
   (paraglide emits `export * as m`), but importing it twice trips the Vite
   plugin's duplicate-import guard and fails the build. Prefer `import * as m`.
7. **`vite build` does NOT typecheck** (esbuild strips types). Undefined-identifier
   and type bugs surface only at runtime — run `tsc` separately.

## Shared packages (`learn-card-base`, `@learncard/react`)

These do **not** use Paraglide. Components call `useT()` (from
`learn-card-base/i18n`), which resolves through a host resolver the app mounts in
`SharedI18nProvider`, namespaced `base.*` / `sdk.*`. Each package ships English
defaults (`EN_DEFAULTS`) so it still renders standalone / in tests / Storybook.

To localize a base component: use `useT()` + a key (e.g. `verification.selfIssued`)
and add the namespaced version (`base.verification.selfIssued`) to the app's
locale JSONs. See `2026-06-17-localizing-shared-packages` in the Obsidian vault.

## Language-selector gating (LaunchDarkly)

`hideLanguageSelector` is a **JSON flag** = array of language codes to hide:
`[]` show all · `["fr","ar"]` hide those · `["*"]` hide the whole selector. If
≤1 language remains visible, the selector auto-hides. The **off** variation must
serve `[]`.

-   Resolver (pure, unit-tested): `src/i18n/languageSelectorConfig.ts`
-   Hooks: `useLanguageSelectorConfig()` + `useEnforceVisibleLocale()` (mounted in `App`)
-   Both pickers (`LanguagePicker`, `LanguagePickerCompact`) self-gate; the modal
    lists only `visibleLanguages`. Falls a user off a now-hidden active locale.

## Known untranslated surfaces (follow-up)

-   **App Store admin + developer guides** (`src/pages/appStoreDeveloper/`,
    ~127 files / ~56k LOC) — effectively a standalone app; tracked separately.
-   Keep this list current as surfaces are swept.

### Swept

-   **Dashboard Home Screen** (`src/pages/dashboard/`, LC-1831) — fully localized
    under the `dashboard.*` namespace (~130 keys). Notes for future edits there:
    -   `helpers/greeting.ts` is intentionally id-based: `getTimeOfDay()` returns
        `'morning' | 'afternoon' | 'evening'` and `getFirstName()` returns `''`
        when there's no name, so `DashboardHeaderCard` maps to a localized greeting
        (named vs. `…NoName` variant). Don't bake copy back into the helper.
    -   `quickActions/registry.ts` builds `label`/`caption` via
        `m['dashboard.quickActions.*']` inside `build()` — these run during render,
        so calling `m` there is fine.
    -   Notification titles, skill tiers, and goal CTAs switch on stable ids/enums
        (`n.type`, `skill.strengthTier`, `pathwaysEnabled`/`nextNode`), never on the
        translated label.
    -   `DashboardView.stories.tsx` + `dashboard.personas.ts` are Storybook-only
        fixtures (not imported by production) — left untranslated as test data.

## Adding a new language

1. Create `public/locales/<code>/translation.json` (all keys translated)
2. Add `<code>` to `locales` in `project.inlang/settings.json`
3. Add `<code>` to `SUPPORTED_LANGUAGES` in `src/i18n/index.tsx` (+ `RTL_LANGUAGES` if RTL)
4. Add `<code>` to `i18n.supportedLanguages` in the tenant config
5. Restart the dev server to regenerate messages

## RTL

Arabic (`ar`) is RTL: `LocaleProvider` sets `document.documentElement.dir = 'rtl'`.
Use Tailwind's `rtl:` variant, CSS logical properties
(`margin-inline-start`, `inset-inline`, …), and the `DirectionalIcon` wrapper for
icons that must flip.
