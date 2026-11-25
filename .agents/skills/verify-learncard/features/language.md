# Language switching

Visitors and signed-in learners switch the UI between English and Spanish from the language selector. The choice persists across reloads (`<html lang>` and `localStorage['i18n.language']`).

## Sub-features

- `locale-login-switch`: the public `/login` selector switches to **Español**; the form reads `Correo electrónico` and `Iniciar sesión con correo`.
- `locale-login-persistence`: Spanish survives reload; switching back to English also persists.
- `locale-sidebar-switch`: the signed-in sidebar selector switches to Spanish, persists across reload, shows the `Seleccionar idioma` sheet, and restores English.

## How to get to it (user POV)

- Signed out: on `/login`, choose the **English** button at the top, then **Español**.
- Signed in: in the left sidebar, choose **English** (above "Build My LearnCard"), then **Español**.

## Driving it with lc verify

Preconditions:

- Doctor ok. The `hideLanguageSelector` LaunchDarkly flag is not set (LaunchDarkly is disabled locally).

- **Run.** `$LCV run language --dir /tmp/lcv` → `language: passed`.
- **Open selector.** `getByRole('button', { name: 'English', exact: true })`; the pressed option `getByRole('button', { name: /^English/, pressed: true })` is visible.
- **Pick Spanish.** `getByRole('button', { name: 'Español', exact: true, pressed: false })`. Then `html[lang="es"]`, `localStorage['i18n.language'] === 'es'`, and the textbox `Correo electrónico`.
- **Persistence.** Reload; Spanish holds. Switch back and reload; English holds.
- **Signed in.** Sign in, switch, reload on `/wallet`. Spanish holds and the sheet heading reads `Seleccionar idioma`. Restore English and confirm the profile menu still shows the handle.

## Gotchas

- Translations are Paraglide catalogs in `apps/learn-card-app/public/locales/{en,es,fr,ar}`. If copy changes, update the asserted strings here and in `journeys/language.ts`.
- Never compare against translated strings in product code; the journey compares visible text on purpose.
- Arabic (RTL) and French are not asserted.
