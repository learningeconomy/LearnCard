---
name: verify-learncard
description: Prove LearnCard changes work end to end with `lc verify`, from the web app (Ionic/React) through the SDK (@learncard/init and plugins), the `learncard` CLI, the network services (brain, LearnCloud, LCA API), ConsentFlow, Partner Connect apps, and docs snippets. It starts an owned local stack, drives real user journeys or ad-hoc scripts, and keeps screenshots, traces, CLI transcripts, and DB corroboration. Use it after touching any of those areas, before claiming a fix or feature works, or when asked to verify, QA, smoke-test, or "see it working".
---

# Verify LearnCard with `lc verify`

`lc verify` is a subcommand of the app's developer CLI (`apps/learn-card-app/scripts/lc.ts`). It starts a **disposable stack it owns**: Neo4j, MongoDB, Redis, ElasticMQ, brain-service, learn-cloud-service and lca-api in Docker, all built from _this checkout_, plus the real Vite dev server. It then drives that stack the way users and developers do. Code lives in `apps/learn-card-app/scripts/verification/`. The coverage map lives in [features/README.md](features/README.md). Read it before choosing what to run.

Every command below runs from the repo root:

```bash
LCV="bun run --cwd apps/learn-card-app lc verify"   # or: cd apps/learn-card-app && bun run lc verify
```

## Pick the right tool

| You changed…                                                  | Run this                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| App UI, routing, i18n, wallet, sharing, contacts, app store   | the matching web feature (`account`, `language`, `credentials`, `sharing`, `contacts`, `app-store`), then `script` for anything unscripted |
| SDK, a plugin, `@learncard/types`, or a brain/cloud/LCA route | `run sdk` (plus `sdk-to-app` if users see the result), then a `script` that calls your new method                                          |
| `packages/learn-card-cli`                                     | `run cli`, then `learncard -- <your subcommand>`                                                                                           |
| ConsentFlow (contracts, consent UI, data sharing)             | `run consent-flow`                                                                                                                         |
| `docs/` code or snippets                                      | `run docs` (it also runs `scripts/check-docs-snippets.mjs`)                                                                                |
| Partner Connect SDK or `examples/app-store-apps`              | `run app-store`                                                                                                                            |
| Anything not in the catalog                                   | `script` (below). Never stretch a nearby journey to stand in for it.                                                                       |

`run all` runs every catalog feature: about 15 minutes on a warm machine, plus 3 to 6 minutes for a cold Docker build.

## Launch

Prerequisites: Linux (`/proc`), Docker Engine with Compose v2 on a **local** Unix socket, `bun install --frozen-lockfile` done, Playwright Chromium (`bunx playwright install chromium`), and the ports below free. The `app-store` journey also needs **Node ≥ 22.12** for Astro (the repo pins 24.12 in `.nvmrc`). If an older system `node` comes first on PATH, set `LC_VERIFY_NODE=/path/to/node24`.

```bash
$LCV up --dir /tmp/lcv              # build + start the owned stack; sign in reusable learner/recipient identities
$LCV doctor --dir /tmp/lcv          # must print "ok": true and "authenticated": true
```

`up` is ready when it prints the doctor JSON and `Ready.`. Ready means usable, not just listening: every container is healthy, each service serves its own `did:web` document, the containers resolve each other's DIDs and the notification queue, the frontend answers with this stack's ownership token, and both reusable actors completed real browser sign-in. Doctor then authenticates a fresh protected network request using the saved learner's seed. From empty databases this takes 3 to 6 minutes, mostly the backend image build, which is cached after that.

Fixed ports (local `did:web` identities embed them): **3000** app, **4000** brain, **4100** LearnCloud, **5100** LCA API, **7687** Neo4j, **27017** MongoDB. The `app-store` journey adds **4321**. Startup refuses if any are taken, or if another owned stack holds the lock. It never adopts someone else's dev stack. Stop your `bun run lc dev` / `docker compose up` first, or use another machine.

`run` without `--dir` starts a fresh stack in `/tmp/learncard-verification/<id>` and tears it down when it finishes. Use `up` plus `--dir` whenever you'll drive more than once.

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

Each feature passes only if its journey exercised and asserted **every** entry ID listed in `catalog.ts`. Every run mints fresh actors (random seeds, unique `v-…` profile handles), so reruns on one stack never collide. Add `--headed` to watch.

### Ad-hoc scripts (anything else)

Write a file that default-exports an async function. It receives `v`, the full harness, and needs no imports:

```ts
// /tmp/my-check.ts
export default async (v: any) => {
    const page = await v.newPage('learner', { signInAs: v.actors.learner }); // real seed sign-in, on /wallet
    const lc = await v.sdk(v.actors.issuer); // network LearnCard from checkout source, profile created
    await v.step(page, 'open-skills', async () => {
        // before/after screenshots + aria snapshots
        await page.getByRole('link', { name: 'Passport' }).click();
        await v.expect(page.getByRole('heading', { name: 'Passport' })).toBeVisible();
    });
    const sent = await v.cli(['send', v.actors.recipient.profileId, '--yes', '--json']); // learncard CLI
    const graph = await v.db.neo4j('MATCH (p:Profile) RETURN count(p)'); // read-only
    return { did: lc.id.did(), cliExit: sent.exitCode, graph }; // saved to report.json
};
```

```bash
$LCV script /tmp/my-check.ts --dir /tmp/lcv [--headed] [--video]
$LCV script -e 'const lc = await v.sdk(v.actors.issuer); return lc.id.did();' --dir /tmp/lcv
```

A runnable reference lives at [scripts/example.ts](scripts/example.ts) (`$LCV script .agents/skills/verify-learncard/scripts/example.ts --dir /tmp/lcv`). The `v` API is `VerificationContext` in `scripts/verification/types.ts` plus `expect`, `stack` (URLs), `cli(args, workdir?)` and `db`. Tips:

- `v.actors.{learner,recipient,issuer}` are fresh per run. `v.newActor('role')` mints more.
- `v.newPage(label, { signInAs, createProfile: false })` leaves the account profile-less, so you can drive onboarding at `/login`.
- `v.sdk(actor)` uses the same seed as that actor's browser session, so UI and SDK act as the same person.
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

- `learncard` pins Brain, LearnCloud, and LCA API to the owned stack, overriding shell and workdir service URLs. A provided `--network` must exactly match `http://localhost:4000/trpc`; duplicate overrides are rejected. `open` also pins the app URL. It runs `packages/learn-card-cli/src` under the `development` condition. Each `--workdir` keeps its own CLI identity in `.env`.
- The production-bound `repl`, cross-network `promote`, webhook receivers/callbacks, and custom signing endpoints are unsupported here. `org apply FILE …` accepts the local hosted signer, not self-hosted signers or webhooks. Use `script` for additional local journeys; don't redirect a missing dependency to production. CLI timeouts return `timedOut: true` and exit 124, never success.
- `db` is enforced read-only: Neo4j runs in `--access-mode read`, and Mongo exposes only list and bounded `find`. Use it to corroborate side effects, never to set state.
- `browser` is for interactive exploration through another tool's CDP client (`chromium.connectOverCDP('http://127.0.0.1:9223')`, then pick the `/wallet` page). It reauthenticates the saved actor through the real developer sign-in UI in a fresh context. Stop it with Ctrl-C, or `kill -INT <pid you started>` when backgrounded; either one saves `manual/<id>/{trace.zip,session.json,network.json}`. Closing Chromium yourself loses the trace. For reproducible proof, prefer `script`.
    - `--session runs/<run>/<feature>/<context>-session.json` reuses that artifact's `verificationActor`, not its browser storage. Contexts signed in with `v.signIn` or `v.newPage({ signInAs })` record this private seed metadata. Anonymous or manually authenticated snapshots without metadata are evidence only.
    - Never restore these files with Playwright `storageState`: the app stores a non-exportable `CryptoKey` in IndexedDB, which JSON cannot preserve. A restored profile shell can look signed in while every protected operation fails. `up` regenerates reusable identities for legacy snapshots that lack metadata.
- Interrupting `run` or `script` (Ctrl-C or `kill -INT`) records `status: interrupted`, captures open pages and traces, reaps verifier-owned CLI children, and exits nonzero. Only a stack created by that `run` is torn down; a caller-owned `--dir` remains running. `up` also cleans up its own interrupted startup. Startup waits for an in-flight Docker operation to settle before teardown.

## Evidence

Everything lands under `--dir`:

- `runs/<run-id>/report.json`: selected, passed and failed features, required entries, observations (profile IDs, URIs, CLI JSON, verification checks), `notRun` and `notSelected`.
- `runs/<run-id>/<feature>/`: `NNN-<step>-before|after|failure.png` plus `.aria.txt`, `actions.json`, `*-trace.zip` (`bunx playwright show-trace <path>`), `*-network.json` (cross-origin requests, allowed or blocked), `*-errors.json` (page errors), `*-session.json`, `*-video/` with `--video`, and per-feature extras (`cli-*.json` transcripts, `*graph*.json`, `app-store-*.log`).
- `scripts/<run-id>-<name>/`: the same evidence for ad-hoc scripts, plus `report.json` with the returned value.
- Stack level: `state.json`, `doctor.json`, `build.log`, `compose.log`, `frontend.log`, service logs written at `down`, `last-error.json`.

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

`down` validates ownership, saves container logs into the directory, removes only the token-labelled containers, volumes, network and image, stops only the recorded frontend PID, and releases the lock. Evidence stays. Fresh `run`s clean up after themselves, even on failure (`--keep` retains a successful one). The `app-store` journey stops its own Astro server. After cleanup, confirm `runs/` and `scripts/` still exist. Never kill by process name or `docker compose down -v` someone else's project. If a run was SIGKILLed, use `down`. Don't guess PIDs. `/tmp` evidence won't survive a reboot, so pass a durable `--dir` if you need it longer.

If execution and teardown both fail, the command fails with both errors preserved in an `AggregateError`; `cleanup.json` records teardown errors separately. Do not treat failed cleanup as a passing run or discard the original execution failure.

## Helpers

- `lc verify help`: the full command surface.
- [scripts/example.ts](scripts/example.ts): a runnable ad-hoc script exercising every `v` capability.
- Implementation: `apps/learn-card-app/scripts/verification/` (`catalog.ts` is the coverage contract; `journeys/` holds the recipes as code). Typecheck with `bunx tsc -p apps/learn-card-app/scripts/verification/tsconfig.json`.
- The typecheck follows imported workspace source and service declarations. If stale `dist` declarations cause missing routes or incompatible types, rebuild the affected workspace packages; report remaining upstream diagnostics. Do not narrow the project or suppress diagnostics to call it green.

Keep the map honest with `/maintain-verification-skill` when routes, copy, auth, or seeding change.
