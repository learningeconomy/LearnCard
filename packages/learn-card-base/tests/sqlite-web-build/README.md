# Production SQLite bundle regression

From the repository root, with the repo `.nvmrc` Node, pinned Bun dependencies and Playwright Chromium installed:

```sh
node scripts/verify-web-sqlite-build.mjs --output /absolute/new/private/evidence-directory
```

This makes a minified Vite production build of the real `useSQLiteInitWeb` hook and Capacitor web
driver. A task-owned static server returns the SPA HTML with status 200 for unknown assets, matching
the deployment behavior that exposed the missing `jeep-sqlite.entry.js`. Chromium blocks all external
requests, writes a synthetic row using the actual WASM-backed SQLite engine, reloads and reads it
from IndexedDB. It then runs the actual two deployed-smoke console/asset assertions against that
production fixture with retries disabled. The script fails on browser errors, bad asset responses or external requests, and
always closes its browser and server. Use a new output directory; logs and JSON remain private.

The smoke subprocess has a three-minute timeout. Set `SQLITE_BUILD_SMOKE_TIMEOUT_MS` to a positive
integer to override it; failures distinguish exit codes from termination signals. Run the fixture
server and child-process regressions with `node --test scripts/verify-web-sqlite-build.test.mjs`.
Malformed paths are rejected without crashing the server; missing modules still receive HTTP 200 HTML.

The former `jeep-sqlite/loader` import fails this check with the same missing-entry/MIME error as
staging. The custom-element entry remains dynamically imported on web and gives Vite a complete
module graph. Native initialization does not import this component.

The Linux verification workflow runs this before the owned-stack catalog. It is a focused production
bundle check, not a full tenant application build, authenticated journey or native runtime test.
The deployed browser smoketests separately require the real app's bundled SQLite store to initialize
and reject JavaScript/CSS/WASM URLs returning HTML even with HTTP 200.

The [native startup findings](native-startup-findings.md) record a separate, completed development
experiment. Its one-off proxy, APK tooling and Android probe are not part of the maintained suite.
