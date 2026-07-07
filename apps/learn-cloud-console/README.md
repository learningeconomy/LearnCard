# @learncard/learn-cloud-console

Operator-facing dashboard for EducationOS / LearnCloud Console (ADR-001).

**Current status: Milestone A — auth smoke test.** This is the end-to-end skeleton:
it drives the `console-bff` login flow from a real browser (login → session →
logout) so all the pieces run together. Feature pages (ecosystems, groups, members)
grow from here, each as a `console-bff` procedure + a page.

## Run it (two terminals)

### 1. Start console-bff (Tier 1 — brain-service stubbed)

```bash
cd services/learn-card-network/console-bff
bun run dev:services   # Redis :6379 + Mongo :27017 (skip if already running)
bun run dev            # http://localhost:3200 ; sets CONSOLE_BFF_DEV_INSECURE_AUTH=true
```

### 2. Start this app

```bash
cd apps/learn-cloud-console
bun install            # first run only
bun run dev            # http://localhost:5173
```

Open http://localhost:5173 and click **Sign in (dev)**. You should see an
authenticated session with `profileId`, `managedDid`, and an `effectiveAccess`
grant of `eco_dev_root → MEMBER`.

## How it works

The Vite dev server proxies `/auth`, `/health`, and `/p` to `console-bff`
(`BFF_URL`, default `http://localhost:3200`). Sharing one origin keeps the
`console-bff` httpOnly session cookie first-party — no CORS, no `SameSite=None`.

`Sign in (dev)` mirrors the README curl flow: it calls `/auth/login`, extracts the
CSRF `state`, crafts a **dev-only** presentation (the BFF's decode-only verifier
reads `vp.holder` without checking the signature — never do this in production),
and posts `/auth/callback`.

Each sign-in uses a fresh holder DID because local KMS is in-memory (see the
console-bff dev caveats).

## Configuration

| Var       | Default                 | Notes                                  |
| --------- | ----------------------- | -------------------------------------- |
| `BFF_URL` | `http://localhost:3200` | console-bff origin the dev proxy hits. |
