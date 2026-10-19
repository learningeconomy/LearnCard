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

The GitHub Actions workflow **Tailwind visual regression** is manual-only. Use
**Run workflow** and select the branch to check; pull requests do not trigger it.
The workflow uploads screenshots and traces for review.

### Why this stays manual

This suite checks that the Tailwind upgrade preserves a fixed set of pre-upgrade
screens. It is migration evidence, not a permanent product-wide visual gate.
The app's layouts and styles change frequently; those intentional changes would
otherwise fail the snapshots and require routine reference updates. That review
and maintenance cost limits the value of running this suite on every PR.

The 36 comparisons cover only the fixtures listed below. Their JSON checks sample
computed styles; they do not compare every CSS property or every component. PNG
comparisons are an optional local check, while the manual workflow uploads images
for inspection. A passing run does not prove that every codemod change is correct.

For ongoing automation, prefer specific stable behavior contracts: a category
tint keeps its alpha despite important theme classes, card colors do not inherit
host palette tokens, and keyboard focus remains visible. Those checks can stay
useful across layout changes. "Shared components" alone is not a useful coverage
boundary; each test needs an explicit behavior and owner. The additional tint and
Ionic-border browser checks assert such behavior without new layout snapshots.
The gutter check also preserves Ionic grid padding, 10px credential row/column
gaps, custom-property overrides, and explicit zero-padding utilities. The full
signed-in WebKit capture uses an iPhone user agent so Ionic renders its iOS mode.

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
empty, shared-card/form, credential preview/details, credential issuance form/JSON,
the current My Apps landing (page content and full signed-in chrome), and populated Apps browse/listing-detail states
(36 comparisons). Every run compares computed CSS against the Tailwind 3 JSON references and attaches full-page screenshots to the HTML report.
Locally bundled fonts, fixed dates, and deterministic external images keep the
captures independent of Google Fonts and image CDNs.
Expanded cases also bundle Jacques Francois, Sacramento, Mouse Memoirs, and
Montserrat for the shared credential designs, and assert computed font families.

The additional pages use the production `BoostPreview`, `BoostDetailsSideMenu`,
`IssueCredentialView`, `MyAppsLanding`, `LaunchPad`, and `AppStoreDetailModal`
components. Issuance uses the same template/state composition as its Storybook story, with a fixed
validity result and no signing action. App-store queries are primed with local
listings. This exercises real UI rendering and the JSON toggle without changing
an account or depending on a live backend.

The full signed-in launchpad fixture renders the real SideMenu, MobileNavBar,
MainHeader and profile/alerts controls around MyAppsLanding. Identity, installed
apps and notification queries are fixed local data. Its read-only wallet has no
signing methods. Fixture-only module boundaries disable logout, avoid unrelated
authenticated routes and hide development-only menu entries; production code is
unchanged. It does not verify real sign-in or profile actions.

The `apps` fixture renders `LaunchPad`, the catalogue at `/launchpad/browse`.
It is not the current `/launchpad` My Apps landing page (`MyAppsLanding`), which
has no category tabs. The browse UI is no longer used in LearnCard, so its
comparison is omitted from the review gallery and PR screenshots. Its existing
fixtures and references remain as migration evidence. Removing the obsolete browse
components and checking their remaining routes/imports is a separate cleanup PR.

The `my-apps` fixture renders the current `/launchpad` page (`MyAppsLanding`),
with its eight LearnCard shortcut tiles and three fixed installed-app listings.
The Journeys rollout flag remains off, matching the eight-tile layout. It captures
page content, including the mobile header, without the signed-in app sidebar or
profile/alerts controls. Those shell elements still need signed-in manual QA.
Its three additional Tailwind 3 references were captured from the same original
`1955fd40e` application source and styles, using the new fixture and pinned fonts.

The first twelve references were committed before migration in `1955fd40e`.
The eighteen expanded references were captured in a temporary checkout of that
same Tailwind 3 commit, using the additional fixture source and the original
application styles/dependencies. Existing reference files were not regenerated.

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

## Compatibility decisions

The palettes, safelists, fonts, animations, and breakpoints live in the apps'
`src/tailwind.css` files. Shared cards use
`packages/react-learn-card/src/assets/styles/theme.css`. Runtime theme colors are
static CSS variables so dynamically selected tenant colors remain available.

The utility and preflight imports intentionally remain unlayered to preserve
their existing cascade with Ionic and Sass. The shared card stylesheet includes
tokens and utilities; its optional `base.css` export owns the reset. The common
`tailwind-v3-theme.css` and `tailwind-v3-compat.css` preserve the existing palette,
heading margins, button border behavior, and font-size/line-height precedence.
The explicit named variants preserve the original mixed breakpoint order.
`tailwind-ionic-compat.css` restores Ionic grid/column host padding and margins
that Tailwind 4's new universal reset otherwise removes. Its zero-specificity
selectors allow explicit utilities and app styles to win; Ionic still owns its
responsive custom-property defaults. This preserves mobile header height and
credential gutters without patching each screen.
The Ionic-only button border reset lives in the two apps' stylesheets, so it
does not change the standalone package reset or the non-Ionic examples.
Keep these named variants out of `--breakpoint-*` variables: those variables
preregister the standard screens and change the resulting order. Autoprefixer
continues to cover legacy Sass; Tailwind itself runs through the Vite plugin.
Shared card font utilities use `@theme inline` so host app variables with the same
names cannot retroactively replace the package's original font families.

Existing sibling spacing uses `space-x-v3-*` / `space-y-v3-*` because Tailwind 4
changes the selector and switches the margin to the preceding child. The class
merger recognizes these compatibility utilities so consumer overrides still win.
Prefer flex/grid `gap` for new layouts. Existing gradients specify `/srgb` to
retain their original interpolation. Keep explicit pixel sizes where replacing
them with rem utilities would introduce an unrelated sizing change.

Computed-style comparisons normalize equivalent color serialization and fully
rounded pill radii. The original reference values and screenshots remain fixed.

Native builds now require iOS 16.4. When releasing, bound OTA updates to compatible
native clients; older installed iOS clients must not receive the Tailwind 4 bundle.
The default OTA channels advance to `1.0.13` for LearnCard and `1.0.8` for ScoutPass
so this bundle is isolated from existing native clients. Release the matching
native builds before promoting bundles to those channels.

### Native release checks

- Sync and prepare both native apps with Android WebView minimum 111 and
  `server.errorPath` pointing to the bundled `unsupported-browser.html`. LearnCard
  tenant preparation reapplies these settings after copying tenant config.
- Verify an older Android WebView opens the standalone update/retry notice and
  a supported WebView opens the app. The fallback has no React, Tailwind, or remote
  assets and includes English, Spanish, French, and Arabic text.
- Check the actual browser engine on OEM/Huawei devices; Android API level and
  vendor WebView version numbers alone do not establish Chromium compatibility.
- Verify iOS 16.4+ and the new Capgo channels before native/OTA promotion. These
  config and asset checks do not replace a native device test.
