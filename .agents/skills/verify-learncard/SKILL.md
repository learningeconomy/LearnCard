---
name: verify-learncard
description: Verify near-ready LearnCard changes across the web app, SDK, CLI, services, ConsentFlow, Partner Connect, and docs using lc verify. Use focused scripts or a reusable browser during development, matching journeys near PR readiness, and the full catalog before marking cross-surface or network-touching work ready. Linux ownership is required; macOS/Windows developers can use the secret-free hosted Linux workflow.
---

# Verify LearnCard with `lc verify`

`lc verify` is a subcommand of the app's developer CLI (`apps/learn-card-app/scripts/lc.ts`). It starts a **disposable stack it owns**: Neo4j, MongoDB, Redis, ElasticMQ, brain-service, learn-cloud-service and lca-api in Docker, all built from _this checkout_, plus the real Vite dev server. It then drives that stack the way users and developers do. Code lives in `apps/learn-card-app/scripts/verification/`. The coverage map lives in [features/README.md](features/README.md). Read it before choosing what to run.

Every command below runs from the repo root:

```bash
LCV="bun run --cwd apps/learn-card-app lc verify"   # or: cd apps/learn-card-app && bun run lc verify
```

## Pick the right tool

Use focused unit/mock tests in the edit loop. When you need real-stack feedback, retain one owned stack and run a small `script`, or attach your Playwright/CDP client to `browser` and reuse the signed-in page. There is no attach-action CLI or speed flag: use the existing browser client. Run the matching catalog journey when a PR is close; run `all` before marking cross-surface or network-touching work ready. Report exactly what ran, not hypothetical coverage.

| You changed…                                                  | Run this                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| App UI, routing, i18n, wallet, sharing, contacts, app store   | the matching web feature (`account`, `language`, `credentials`, `sharing`, `contacts`, `app-store`), then `script` for anything unscripted |
| SDK, a plugin, `@learncard/types`, or a brain/cloud/LCA route | `run sdk` (plus `sdk-to-app` if users see the result), then a `script` that calls your new method                                          |
| `packages/learn-card-cli`                                     | `run cli`, then `learncard -- <your subcommand>`                                                                                           |
| ConsentFlow (contracts, consent UI, data sharing)             | `run consent-flow`                                                                                                                         |
| `docs/` code or snippets                                      | `run docs` (it also runs `scripts/check-docs-snippets.mjs`)                                                                                |
| Partner Connect SDK or `examples/app-store-apps`              | `run app-store`                                                                                                                            |
| Anything not in the catalog                                   | `script` (below). Never stretch a nearby journey to stand in for it.                                                                       |

`run all` runs catalog features **serially**: previous runs took about 13–15 minutes, plus several minutes for a cold Docker build. These are observations, not a timing guarantee. Do not parallelize stateful journeys within one harness or add a fictional `--serial` switch.

## Launch

Prerequisites: **Linux** with `/proc` and util-linux `flock` (crash-safe per-directory teardown locking), the repo-pinned Bun (`package.json#packageManager`) and Node (`.nvmrc`, Node 24.12–24.x), `bun install --frozen-lockfile`, Docker Engine with Compose v2, and Playwright Chromium. Install Chromium with `bunx playwright install chromium`; on a Linux sandbox missing OS libraries, an administrator can run `bunx playwright install --with-deps chromium`. Preflight checks that Chromium can launch its version command and reports missing shared libraries; the verifier never installs privileged OS packages itself. If another Node comes first on PATH, set `LC_VERIFY_NODE=/path/to/node24`.

Docker must use the default context and `/var/run/docker.sock` (which may resolve to `/run/docker.sock`). Inspect the daemon configuration and trust its administrator, then set `LC_VERIFY_TRUST_LOCAL_DOCKER=1`. A Unix socket alone does **not** prove that its daemon is local. Remote/custom contexts, Docker endpoint/TLS/config environment overrides, proxy environment overrides, and daemon-reported HTTP(S) proxies are rejected, not silently treated as local.

Recommend **16 GiB RAM**; the reviewer's 8 GiB Ubuntu sandbox used roughly 4–5 GiB of swap during `all`. This is an observation, not a proven minimum. Preflight requires at least 10 GiB free disk; Docker images, workspace dependencies and retained evidence need additional headroom. Use one serial run on smaller hosts rather than multiplying workers.

```bash
export LC_VERIFY_TRUST_LOCAL_DOCKER=1 # only after inspecting/trusting the local daemon
$LCV doctor --preflight            # actionable toolchain, Docker, browser, memory/disk checks
$LCV prepare --dir /tmp/lcv        # generate snippets/private HTML; up also prepares
$LCV up --dir /tmp/lcv --json      # blocks until ready or failed; machine-readable progress/result
$LCV doctor --dir /tmp/lcv         # must report "ok": true and "authenticated": true
```

`up` blocks until readiness or failure; no `--wait` flag is needed. Ready means usable, not just listening: containers and services are healthy, owned `did:web` documents resolve across services, the frontend answers with this stack's ownership token, and both reusable actors completed real browser sign-in. Doctor then authenticates a fresh protected network request using the saved learner's seed. Startup prepares generated artifacts rather than relying on an earlier `lc dev`.

Each stack directory owns its **allocated ports**, endpoint configuration, and lock. The app, Brain, LearnCloud, LCA API, Neo4j, MongoDB and partner app ports are stored in `state.json`; use doctor output or `v.stack` rather than assuming 3000/4000/4321. Local `did:web` identities embed the allocated Brain port. Distinct directories can coexist with each other and `lc dev`; verification does not overwrite the dev server's tenant/index configuration or adopt an existing listener. This isolates ports, not RAM or shared checkout edits.

The verifier serves `/branding/*` images directly from the tracked `environments/learncard/assets/branding/` directory. A clean checkout needs no generated `public/branding/` files or `lc dev` preparation; another tenant's generated public branding cannot override the verifier's LearnCard assets.

Ports also have user-private, per-port ownership claims under `/tmp/learncard-verification-<uid>-ports/`, held until `down`; this is not a global stack lock. Claims prevent another verifier from allocating a temporarily unbound port, including the partner port before its journey starts. Stale claims are retained conservatively: recover them with ownership-checked teardown of their stack directory, never by deleting claims or adopting listeners. An unrelated process can still steal a released socket during startup handoff; startup must fail rather than adopt it.

`run` without `--dir` creates a fresh stack and tears it down when finished. For a one-shot gate use `$LCV run all --fresh --json --dir /absolute/new/evidence-directory`: `--fresh` refuses reuse, prepares, starts, runs and tears down. `--json` emits machine-readable progress/results; failure exits nonzero. Use `up` plus `--dir` when driving more than once.

For repeated full runs, prefer an absolute `--dir` on persistent storage, such as `"$HOME/.local/share/learncard-verification/review"`. Leave several GiB available for retained traces, logs, and caches; the system temporary filesystem also needs headroom. `/tmp` can hit a per-user quota even when `df` shows free space. `EDQUOT` is a storage failure, not a feature regression: stop the owned stack, preserve or relocate its evidence, and rerun in a fresh directory with capacity. Never delete proof to make a failed run look clean.

### macOS, Windows and hosted Linux

Native macOS/Windows process ownership is **not supported**. Use a disposable Linux VM/sandbox with its own trusted local Docker daemon, or the secret-free [LearnCard Verification workflow](../../../.github/workflows/verification.yml). From GitHub Actions choose **LearnCard Verification → Run workflow** and select the branch containing your changes; no production credentials are required. From a checkout with GitHub CLI:

```bash
gh workflow run verification.yml --ref <branch>
gh run list --workflow verification.yml
```

The workflow also runs for non-draft PRs touching the covered surfaces, on an ephemeral GitHub-hosted Ubuntu runner, never `pull_request_target` or a privileged self-hosted runner. It installs the pinned toolchain/dependencies/Chromium, runs the in-app message unit, lint and typecheck steps, prepares and preflights, brings up one owned stack (`up --dir`), drives the in-app message navigation script (`script …/in-app-messages/examples/verify-navigation.mjs --dir … --video`), runs `run all --dir` on that stack, and always attempts ownership-checked teardown. It uploads two artifacts with 14-day retention: screenshot-only proof media from the newest run (`bun scripts/proof.ts stage --images-only`, `lc-proof-media-<run id>`) and an allowlisted status/count/duration summary. Raw reports, logs, sessions, traces, seeds and videos stay off artifacts. Hosted execution is unobserved until a workflow run actually completes; local results are not a hosted-CI pass.

### Build caching and timings

Normal PR verification and manual runs use the standard Docker build with timing reports.
Docker caching is an opt-in manual experiment: select `use_docker_cache` in the dispatch UI,
or run `gh workflow run verification.yml --ref <branch> -f use_docker_cache=true`.
Current samples do not demonstrate a net speedup, so normal PRs skip cache warming,
export and dedicated-builder cleanup. The related hosted E2E/build-cache investigation is
[PR #1681](https://github.com/learningeconomy/LearnCard/pull/1681).

When opted in, the hosted workflow warms a dedicated local Buildx builder's `backend-dependencies`
stage from GitHub's layer cache, also accepting the E2E workflow's cache for that same stage.
Only dependency layers are exported (`mode=min`), never changing source layers, database
volumes, browser sessions or runtime evidence. Cache export failures are non-fatal; a miss
uses the same cold dependency build. GitHub scopes PR caches to that PR; a manually dispatched
run on `main` can seed the default-branch cache that other PRs can restore. The source image
is still built from the tested checkout, with the stack's unique ownership label and tag.

Local builds keep using `docker build` by default. To use a prewarmed builder, supply
`--docker-builder NAME` to `up` or a fresh `run`. Use a dedicated `docker-container` Buildx
builder whose only node explicitly uses `unix:///var/run/docker.sock`; context names and
remote builders are rejected. Stack teardown does not own the external builder or its cache.
The hosted setup action owns builder cleanup. Cache runtime tokens stay inside the cache
warming action; verifier child environments remain unchanged.

`startup-timings.json` records preflight, checkout Docker build,
preparation, Compose startup and readiness. Each run's `timings.json` records total startup,
catalog and teardown; `report.json` records each journey's `durationMs`, including evidence
capture and closure. Durations use a monotonic clock. Startup timing files are created only
after ownership is claimed, so a failed preflight can be retried in the same directory.
Timing writes are best-effort diagnostics: a storage failure cannot prevent work or mask its
original error. Completed/failed phases are saved at each boundary when storage is available; a killed process can leave a phase marked running without a final duration.
The hosted Markdown/JSON summaries retain only allowlisted phase/feature names, statuses,
coverage counts and validated numeric durations. Raw timestamps and error text are excluded.

### Sharing a live stack between agents

One coordinator can run `up --dir /tmp/lcv`, wait for readiness, and lend that exact directory to workers on the **same checkout and backend build**. Default to **serial workers**; borrowing a live stack avoids repeated startup without introducing concurrency:

```bash
$LCV doctor --dir /tmp/lcv
$LCV run language --dir /tmp/lcv
$LCV run sdk --dir /tmp/lcv
```

Each `run` and `script` gets fresh actors, browser contexts, and a unique evidence directory. Borrowed-stack runs—including interrupted ones—do not stop the stack. Only the coordinator calls `down`, **after every worker has finished**; `down` does not maintain worker leases or wait for active runs. A lock error is not permission to adopt an unrelated developer's stack.

Coordinate the remaining shared resources:

- Serialize `app-store` runs on the same directory: they share that stack's allocated partner port. Separate stack directories have different partner ports.
- Give standalone `learncard` workers distinct `--workdir` names; a workdir contains a mutable CLI identity. Snippet generation now uses deterministic content and atomic replacement, so it no longer requires its own serialization, but changing shared source during a proof remains unsafe.
- Interactive `browser` workers need distinct `--cdp-port` values and actor session files. The default saved learner is a shared identity, unlike the fresh actors in `run` / `script`.
- Keep the checkout unchanged during a proof. Vite serves shared frontend source, while backend containers contain the build from `up`; backend edits require coordinated teardown and a fresh directory/build.
- Finish Docker stack creation/removal before driving browser workers. Linux interface changes can abort Chromium's in-flight module requests with `ERR_NETWORK_CHANGED`; use separate VMs when lifecycle operations must overlap browser proofs. Already-running stacks still have independent ports and data. Complete workspace builds before driving, too.
- Use each worker's own report, not stack-level `doctor.json` or `last-error.json`, which may be replaced by another command.

## Doctor

```bash
$LCV doctor --dir /tmp/lcv
```

Read-only inspection. It checks process birth identity, container labels and ports, image ownership, DB health, `did:web` documents, cross-service resolution, and the frontend token. After `up`, it also requires the saved learner seed to match its network profile and authenticate a fresh protected API request—not merely display a cached signed-in shell. Run it before the first drive, after any failed drive, and whenever something looks off. `"authenticated": false` on a stack started by `run` is expected, because journeys sign in their own actors. After `down`, doctor must reject the directory.

## Drive

### Catalog journeys

```bash
$LCV list                                         # features, surfaces, required entry IDs
$LCV run credentials sharing --dir /tmp/lcv       # selected features on the live stack
$LCV run all --dir /tmp/lcv --video               # every feature, with WebM video per browser context
```

Each feature passes only if successful `context.step` executions cover **every** entry ID listed in the catalog. A literal returned entry list is not evidence; failed or interrupted steps do not count. Every run mints fresh actors (random seeds, unique `v-…` profile handles). Add `--headed` to watch. Independent worker processes require explicit coordination of the shared resources above; catalog journeys themselves remain serial.

### Ad-hoc scripts (anything else)

Write a file that default-exports an async function. It receives `v`, the full harness, and needs no imports:

```js
// /tmp/my-check.mjs
export default async v => {
    const page = await v.newPage('learner', { signInAs: v.actors.learner });
    await v.step(page, 'open-passport', async () => {
        await page.getByRole('link', { name: 'Passport', exact: true }).click();
        await v.expect(page).toHaveURL(/\/passport/);
    });
    const lc = await v.sdk(v.actors.learner);
    const profile = await lc.invoke.getProfile();
    v.expect(profile?.profileId).toBe(v.actors.learner.profileId);
    return { profileId: profile.profileId, route: new URL(page.url()).pathname };
};
```

```bash
$LCV script /tmp/my-check.mjs --dir /tmp/lcv [--headed] [--video]
$LCV script -e 'const lc = await v.sdk(v.actors.issuer); return lc.id.did();' --dir /tmp/lcv
```

A runnable reference lives at [scripts/example.ts](scripts/example.ts) (`$LCV script .agents/skills/verify-learncard/scripts/example.ts --dir /tmp/lcv`). The `v` API is `VerificationContext` in `scripts/verification/types.ts` plus `expect`, `stack` (URLs), `cli(args, workdir?)` and `db`. Tips:

- `v.actors.{learner,recipient,issuer}` are fresh per run. `v.newActor('role')` mints more.
- `v.newPage(label, { signInAs, createProfile: false })` leaves the account profile-less, so you can drive onboarding at `/login`.
- `v.sdk(actor)` uses the same seed as that actor's browser session, so UI and SDK act as the same person.
- `v.stack` contains this directory's allocated URLs and ports; never hardcode a localhost port. `v.step(null, 'label', async () => { … })` records SDK/CLI-only assertions without a browser page.
- On failure, every open page is captured automatically (`NNN-failure-state-*.png`).
- Return JSON-serializable evidence. Missing modules, invalid exports, non-JSON results, and even `throw null` produce a failed report and nonzero exit status.
- To promote a script into the catalog, see "Extending" in the feature map.

### Other drivers

```bash
$LCV learncard --dir /tmp/lcv --workdir acme -- send <profileId> --yes --json   # CLI from source
$LCV db --dir /tmp/lcv neo4j "MATCH (p:Profile {profileId:'x'})-[r]->() RETURN type(r), count(*)"
$LCV db --dir /tmp/lcv mongo learn-cloud                  # list collections
$LCV db --dir /tmp/lcv mongo lca-api preferences '{}' --limit 5
$LCV logs --dir /tmp/lcv brain --tail 300                 # frontend | brain | cloud | api | neo4j | mongodb | redis* | elasticmq
$LCV browser --dir /tmp/lcv --headed                      # signed-in Chromium + CDP on 127.0.0.1:9223
```

- `learncard` pins Brain, LearnCloud, and LCA API to the owned stack, overriding shell and workdir service URLs. A provided `--network` must exactly match this directory's Brain endpoint; duplicate overrides are rejected. `open` also pins the allocated app URL. It runs `packages/learn-card-cli/src` under the `development` condition. Each `--workdir` keeps its own CLI identity in `.env`.
- `verify` is supported through a verify-only child preload that restricts the known DIDKit WASM/dynamic-loader fetch path to the owned HTTP service origins and refuses redirects. A policy violation forces failure even if the CLI catches it. This is **confined verification, not networkless verification or a general OS network sandbox**; ordinary CLI behavior outside this wrapper is unchanged.
- The production-bound `repl`, `demo` (its SDK initialization cannot be fully pinned), cross-network `promote`, webhook receivers/callbacks, and custom signing endpoints are unsupported here. `org apply FILE …` accepts the local hosted signer, not self-hosted signers or webhooks. Use `script` for additional local journeys; don't redirect a missing dependency to production. CLI timeouts return `timedOut: true` and exit 124, never success.
- `db` is enforced read-only: Neo4j runs in `--access-mode read`, and Mongo exposes only list and bounded `find`. Use it to corroborate side effects, never to set state.
- `browser` is for interactive exploration through another tool's CDP client (`chromium.connectOverCDP('http://127.0.0.1:9223')`, then pick the `/wallet` page). It reauthenticates the saved actor through the real developer sign-in UI in a fresh context. Stop it with Ctrl-C, or `kill -INT <pid you started>` when backgrounded; either one saves `manual/<id>/{trace.zip,session.json,network.json}`. Closing Chromium yourself loses the trace. For reproducible proof, prefer `script`.
    - `--session runs/<run>/<feature>/<context>-session.json` reuses that artifact's `verificationActor`, not its browser storage. Contexts signed in with `v.signIn` or `v.newPage({ signInAs })` record this private seed metadata. Anonymous or manually authenticated snapshots without metadata are evidence only.
    - Never restore these files with Playwright `storageState`: the app stores a non-exportable `CryptoKey` in IndexedDB, which JSON cannot preserve. A restored profile shell can look signed in while every protected operation fails. `up` regenerates reusable identities for legacy snapshots that lack metadata.
- Interrupting `run` or `script` (Ctrl-C or `kill -INT`) records `status: interrupted`, captures open pages and traces, reaps verifier-owned CLI children, and exits nonzero. Only a stack created by that `run` is torn down; a caller-owned `--dir` remains running. `up` also cleans up its own interrupted startup. Startup waits for an in-flight Docker operation to settle before teardown.
- Catalog interruption joins screenshot/trace capture before closing resources or tearing down services. The in-flight feature is recorded as `interrupted`, and the runner lets its `finally` blocks finish reaping auxiliary processes; it may wait for an already-started local SDK operation to unwind.

## Evidence

Everything lands under `--dir`:

- `runs/<run-id>/report.json`: selected, passed and failed features, required entries, observations (profile IDs, URIs, CLI JSON, verification checks), `notRun` and `notSelected`.
- `runs/<run-id>/<feature>/`: `NNN-<step>-before|after|failure.png` plus `.aria.txt`, `actions.json`, `*-trace.zip` (`bunx playwright show-trace <path>`), `*-network.json` (cross-origin requests, allowed or blocked), `*-errors.json` (page errors), `*-session.json`, `*-video/` with `--video`, and per-feature extras (`cli-*.json` transcripts, `*graph*.json`, `app-store-*.log`).
- `scripts/<run-id>-<name>/`: the same evidence for ad-hoc scripts, plus `report.json` with the returned value.
- Stack level: `state.json`, `doctor.json`, `build.log`, `compose.log`, `frontend.log`, service logs written at `down`, `last-error.json`.

For a blank page, inspect the trace's **Console** and **Network** tabs even when `*-errors.json` is empty: failed JavaScript module requests are console/network errors, not necessarily page exceptions. A captured `net::ERR_NETWORK_CHANGED` on localhost is different from an untranslated selector or a backend rejection. Preserve the failed run and diagnose browser/host networking before rerunning; do not add blind retries or weaken the journey.

Proof standards:

- Drive the real user path: UI controls by role and accessible name, the real SDK and CLI. No injected state, stubbed responses, or test-only endpoints. Seeding _inputs_ through the SDK is fine. Performing the _verified action_ through a shortcut is not.
- Capture the action **and** the resulting state, then prove persistence from a second view: reload, another actor's session, the SDK, or a read-only DB query.
- The **browser** network policy allows real owned services plus read-only static hosts; other browser requests are blocked and recorded. SDK/CLI service endpoints are pinned locally, but arbitrary scripts are trusted code, not an OS/network sandbox. A script that imports `fetch` or starts extra processes must keep them local and clean up its own resources. Never widen boundaries to production to make something pass.
- A missing precondition is a **failure with evidence**, not a skip. Never weaken a journey to go green. Fix the journey if the product changed, or report the product bug.
- Evidence is private: traces, sessions, share links, and CLI `.env` files hold disposable seeds and bearer tokens. Attach reviewed screenshots or video to PRs, never raw traces or sessions.

## Cleanup

```bash
$LCV down --dir /tmp/lcv
```

`down` validates ownership, saves container logs into the directory, removes only token-owned Docker resources, and stops only the recorded frontend and registered auxiliary process identities. Evidence stays. Fresh `run`s clean up after themselves, even on failure (`--keep` retains a successful non-fresh run). The `app-store` journey normally stops its own Astro server; registered ownership lets teardown recover it after a crash. Never kill by process name or run `docker compose down -v` on someone else's project. After a crash use `down --dir /tmp/lcv`; for a hung startup use `down --force --dir /tmp/lcv`. **Force does not bypass ownership checks** or authorize stopping active workers; coordinate first. `/tmp` evidence will not survive a reboot.

Teardown signals a verified detached session's process group atomically, not just a previously captured PID list. This includes Docker/buildx children forked during shutdown; mismatched process birth identities are never signaled.

If execution and teardown both fail, the command fails with both errors preserved in an `AggregateError`; `cleanup.json` records teardown errors separately. Do not treat failed cleanup as a passing run or discard the original execution failure.

## Helpers

- `lc verify help`: the full command surface.
- [scripts/example.ts](scripts/example.ts): a runnable ad-hoc script exercising every `v` capability.
- Implementation: `apps/learn-card-app/scripts/verification/` (`catalog.ts` is the coverage contract; `journeys/` holds the recipes as code). Typecheck with `bunx tsc -p apps/learn-card-app/scripts/verification/tsconfig.json`.
- The typecheck follows imported workspace source and service declarations. `prepare` creates snippets/private HTML, **not** service `dist` declarations. On a clean checkout, build the required service declarations and their Nx dependency graph before typechecking:

```bash
bunx nx run-many -t build --projects=network-brain-service,learn-cloud-service,lca-api-service --parallel=1 --skip-nx-cache
bunx tsc -p apps/learn-card-app/scripts/verification/tsconfig.json
```

Report any remaining upstream diagnostics; do not narrow the project or suppress them to call it green. These typecheck prerequisite builds are separate from the runtime catalog, which uses checkout source and builds its Docker services during startup.

Keep the map honest with `bun scripts/check-verification-map.ts` from the repo root. It checks catalog feature IDs, exact entry sets, recipe headings and the overview table without starting Docker. When routes, copy, auth or seeding change, update the journey and corresponding recipe together, run the checker, then exercise the affected journey. See the feature map for coverage roles and extension rules.
