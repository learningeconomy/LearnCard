# Tailwind upgrade regression coverage (LC-2006)

These fixtures render the actual `DashboardView`, populated Activity credentials,
and `@learncard/react` card with the stylesheet order from `App.tsx`. The fixture
uses the existing dashboard personas and primes the credential query cache; it
does not need a backend or a signed-in account. Build and login smoke tests missed
the earlier Tailwind 4 dashboard regressions, so neither is the acceptance test here.

The reference styles and images must be captured on **Tailwind 3 before upgrading**.
Keep that baseline commit separate from the upgrade. Do not update the reference
files to make a failing migration pass: repair the CSS or explain and review each
intentional difference first.

## Run

From the repository root, use the Bun version in `package.json`:

```sh
bun install --frozen-lockfile
bunx nx build helpers
cd apps/learn-card-app
bunx playwright test --config playwright.visual.config.ts
```

The config compiles translations and builds a fixture bundle through the actual
Vite config, then serves that bundle. This avoids loading the entire workspace as
thousands of individual development modules. The fixture build resolves workspace
source so rebuilding every SDK package is unnecessary. The Paraglide Vite plugin
is skipped here because the command has already compiled the catalog.

Chromium desktop, Chromium mobile, and WebKit mobile cover populated, pending,
empty, and shared-card/form states. Every run compares computed CSS against the
Tailwind 3 JSON references and attaches full-page screenshots to the HTML report.
Locally bundled fonts, fixed dates, and deterministic external images keep the
captures independent of Google Fonts and image CDNs.

Optional pixel comparisons are scoped to the host OS (font rasterization differs):

```sh
VISUAL_SCREENSHOTS=true bunx playwright test --config playwright.visual.config.ts
```

Only when creating the original Tailwind 3 baseline, or reviewing an intentional
design change:

```sh
VISUAL_SCREENSHOTS=true bunx playwright test --config playwright.visual.config.ts --update-snapshots
```

For repeated local runs, start the already-built fixture with
`bunx vite preview --config tests/visual/vite.config.mts`, then set
`VISUAL_EXTERNAL_SERVER=true` on the test command. Rebuild the fixture after source
or style changes. Never compare against a stale build.

## Manual review

Compare the same account/content before and after at phone and desktop widths:

- Populated dashboard: Activity row size, credential density, column widths, gaps.
- Shared credential cards: images, titles, clipping, focus rings, list/detail views.
- Navigation and modals: tab bars, scrolling, footer/close controls, device insets.
- Forms: input text/placeholders, borders, validation, loading, disabled controls.
- Tenant themes and Arabic: colors, responsive breakpoints, text direction.
- ScoutPass: membership/troop screens, credential cards, issuance, consent screens.

The fixtures cover rendering, not real issuance, authentication, or native device
integration. Keep the existing application E2E checks and a device/browser pass.
