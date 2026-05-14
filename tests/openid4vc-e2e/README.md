# OpenID4VC E2E Tests

End-to-end tests for the `@learncard/openid4vc-plugin` that drive the plugin's **real HTTP transport** against an **in-process** OID4VCI issuer + OID4VP verifier. No docker, no external services, no mocked `fetch` — just the plugin's public API talking to a real Node HTTP server over `localhost`.

## Why?

The plugin already has extensive coverage:

-   **Unit tests** per module (286+ tests in `packages/plugins/openid4vc/src/**/*.test.ts`).
-   **In-memory plugin integration tests** (`src/plugin.test.ts`) that drive the public API against a `fetch` stub playing verifier.
-   **Live smoke via `try-offer` + `try-verify` CLI harnesses** against walt.id.

What the stack was missing — and what this package adds — is **actual HTTP transport coverage**. `fetch` stubs don't exercise:

-   Form-encoded `direct_post` bodies hitting a real TCP socket.
-   `application/json` vs `application/x-www-form-urlencoded` negotiation.
-   Header case-sensitivity.
-   Real chunked reads, trailing whitespace in JWS bodies, etc.

It also gives us CI-grade regression coverage that doesn't depend on walt.id's demo infrastructure being up.

## Architecture

```
┌───────────────────┐           ┌──────────────────────────────┐
│  vitest test      │           │  node:http server (127.0.0.1)│
│                   │           │                              │
│  plugin           │─ fetch ──▶│  / .well-known/*    (issuer) │
│  .acceptOffer()   │           │  /token             (issuer) │
│  .presentCreds()  │           │  /credential        (issuer) │
│                   │           │  /authorize         (issuer) │
│                   │           │  /vp/pd/:id         (verif.) │
│                   │           │  /vp/verify/:id     (verif.) │
└───────────────────┘           └──────────────────────────────┘
```

Each `describe` block spins up a fresh server on an ephemeral port via `startE2EServer()` — no port conflicts, no shared state between suites. The server has:

-   A **mini OID4VCI issuer** (`server/issuer.ts`) that signs real Ed25519 JWT-VCs. Supports `pre-authorized_code` + `authorization_code` grants with PKCE S256. Respects `tx_code`, `c_nonce`, proof-of-possession `jwt` proofs.
-   A **mini OID4VP verifier** (`server/verifier.ts`) that actually verifies inbound JWT-VPs (imports the holder's `did:jwk` public key, checks audience + nonce). Handles SIOPv2 combined (`vp_token id_token`) responses too.

## Prerequisites

Just Node 18+ and pnpm — no docker, no JVM, nothing external.

```bash
# From the monorepo root:
pnpm install
```

## Running

```bash
# From tests/openid4vc-e2e/:
pnpm test          # single run
pnpm test:watch    # watch mode
```

Or from the monorepo root:

```bash
pnpm --filter @workspace/openid4vc-e2e-tests test
```

## Test coverage

| File | Exercises |
|---|---|
| `tests/roundtrip.spec.ts` | Pre-auth offer → `acceptCredentialOffer` → `presentCredentials` → verifier 200 round trip. Plus `tx_code` validation and verifier rejection surfacing as `VpSubmitError{code: server_error, status: 400}`. |
| `tests/auth-code.spec.ts` | Slice 4 — Auth-code flow w/ PKCE. Wallet follows the `/authorize` redirect, extracts `code`, POSTs to `/token` with the PKCE verifier. |
| `tests/siop.spec.ts` | Slice 8 — Combined `vp_token id_token` flow. Verifier asserts both the JWT-VP and the SIOPv2 ID token verify against the holder's `did:jwk`. |

## Adding a new test

1. Write the test against `server.issuer` / `server.verifier` — call `createPreAuthOffer()` / `createSession()` from the admin helpers.
2. Drive the plugin via the `getPlugin(mock)` helper (see existing specs).
3. Inspect `session.submissions` to assert on whatever the verifier saw.

## Design notes

-   **Zero runtime deps** beyond `jose` (which every other test already pulls in transitively). The server uses `node:http` directly.
-   **In-process only** — no subprocess forking, no docker, no external ports fixed. Every test spins its own ephemeral port so `vitest` can still run files in parallel without clashes.
-   **Signatures are real.** The issuer signs VCs with a real Ed25519 key. The verifier verifies VPs + ID tokens against the holder's real `did:jwk`-encoded public key. This catches transport corruption (escaped chars in form encoding, etc.) that stubbed-fetch tests can't.
-   **Not spec-exhaustive.** The server implements just enough to exercise each plugin code path. If your test needs a new edge case (e.g. `direct_post.jwt`, `client_id_scheme=did`, deferred issuance), extend the server.

## Interop gap

This suite does **not** prove interop against third-party implementations (walt.id, Sphereon, EUDI, Animo). For that we lean on the CLI harnesses (`pnpm try-offer` / `pnpm try-verify`) — see `packages/plugins/openid4vc/README.md`. Adding a dockerized interop target to this package is a separate follow-up.
