# `@workspace/openid4vc-interop-e2e-tests`

Real-vendor interop tests for the `@learncard/openid4vc-plugin`. Drives
the plugin end-to-end against a locally-hosted [walt.id Community
Stack](https://github.com/walt-id/waltid-identity) issuer + verifier
running in Docker.

## Why this exists

The in-process suite in `tests/openid4vc-e2e/` validates that the
plugin is internally consistent with our reading of the spec. This
suite proves the plugin interoperates with a **third-party
implementation I didn't write** — catching spec drift at the wire
level (exact error codes, header casing, timing windows, nonce
semantics, etc.) that a self-rolled harness cannot see.

| Suite | What it catches | Speed |
|---|---|---|
| `tests/openid4vc-e2e/` (in-process) | Plugin code paths, refactor regressions | ~600ms |
| `tests/openid4vc-interop-e2e/` (this one) | Wire-level spec drift vs. a real vendor | 30–120s cold, ~5s warm |

Run the in-process suite on every PR. Run this one on merge-to-main
or on-demand before a release.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) daemon running
- [`docker compose`](https://docs.docker.com/compose/) v2
- Ports `7002` and `7003` free on the host

## Running

```bash
# From the monorepo root — brings up walt.id, runs all specs, tears down
pnpm --filter @workspace/openid4vc-interop-e2e-tests test:interop:e2e

# Or from this folder
pnpm test:interop:e2e
```

### Iterating without cold-starting docker each time

If you already have the stack up (e.g. you're debugging a single spec
and don't want to wait for `docker compose up` between runs), start
it once yourself and then run:

```bash
docker compose up -d                              # one time
pnpm test:interop:no-docker                       # as many times as you want
docker compose down -v                            # when finished
```

### Tailing vendor logs

```bash
pnpm logs
```

## What the specs cover

| File | Tests | Flow under test |
|---|---|---|
| `tests/issue.spec.ts` | 1 | Pre-auth OID4VCI: walt.id mints offer → plugin accepts → walt.id-signed JWT-VC bound to holder DID. |
| `tests/present.spec.ts` | 1 | OID4VP request resolution: plugin parses walt.id-generated `openid4vp://authorize?...` into spec-shaped fields (`response_type`, `nonce`, `state`, `response_uri`, `presentation_definition`). |
| `tests/roundtrip.spec.ts` | 1 | **Interop ground-truth.** Full loop: walt.id issues → plugin holds → plugin presents back → walt.id verifier returns `verificationResult: true`. |
| `tests/multi-credential.spec.ts` | 1 | Multi-input-descriptor PD. Two distinct VC types (`UniversityDegree` + `OpenBadgeCredential`) issued separately, then presented together in a single VP that satisfies both descriptors. Exercises the plugin's selector + descriptor-map emission. |
| `tests/auth-code.spec.ts` | 1 | OID4VCI **Slice 4** (authorization_code + PKCE). walt.id mints an offer with `authorization_code` grant, plugin builds the authorization URL with PKCE S256, the harness simulates the user-agent redirect to capture the `code`, plugin exchanges code → token → credential. |
| `tests/sd-jwt.spec.ts` | 1 | SD-JWT VC issuance. Dynamically discovers any `vc+sd-jwt` / `dc+sd-jwt` / `sd-jwt-vc` config from walt.id's running metadata (no hard-coded type id), then validates the plugin can run the credential request and surface the format. SD-JWT *presentation* (key binding + selective disclosure) is intentionally out of scope here. |
| `tests/negative.spec.ts` | 1 + 1 skipped | **Tampered VC** (active) — flip a byte in the JWT signature, walt.id rejects. Proves walt.id validates the inner VC signature, not just the outer envelope. **Replay nonce** (skipped — see *Walt.id quirks* below). |

## Walt.id quirks discovered while building this suite

Walt.id's `1.0.0-SNAPSHOT` deviates from the OID4VC specs in several
ways. Documenting these here so the next maintainer doesn't re-hit
them and so we know which kind of overfitting to watch for when
adding new walt.id-only tests.

### 1. Internal listen port is `3000`, not `7002`/`7003`

The `baseUrl` config field controls the *advertised* origin
(embedded in metadata, `response_uri`, etc.) but is decoupled from
the actual listen port — walt.id always binds to container `:3000`.
The compose file maps `7002:3000` and `7003:3000` accordingly.

### 2. Metadata routes are draft-prefixed

The spec mandates `/.well-known/openid-credential-issuer`. Walt.id
serves it at `/{standardVersion}/.well-known/openid-credential-issuer`
(e.g. `/draft13/...`). Our plugin is unaffected — it follows the
offer's `credential_issuer` field, which walt.id sets correctly.
Only the global-setup probe needed updating.

### 3. Required HOCON config files for boot

Both services refuse to start without a mounted `config/` dir
carrying at minimum `*-service.conf` with a `baseUrl`. The compose
file mounts `config/{issuer,verifier}/` from the repo. See
`config/issuer/issuer-service.conf` and `config/verifier/verifier-service.conf`.

### 4. Lax pre-auth code validation (issuer)

Walt.id's issuer accepts **any** pre-authorized code at the `/token`
endpoint, including codes that don't match the offer it minted. We
originally had a "tampered pre-auth code rejected" test in
`issue.spec.ts` and removed it after empirically confirming this.
Not a plugin issue — our plugin correctly exchanges whatever code
is given to it.

### 5. Lax nonce binding (verifier)

Walt.id's verifier does **not** check that the `nonce` claim inside
a submitted JWT-VP matches the `nonce` it issued for the session.
A VP signed with `nonce_A` (from session A) submitted to session
B's `response_uri` is accepted and `verificationResult` flips to
`true`. The replay-nonce spec in `negative.spec.ts` is preserved
but `it.skip`-ed; the strict version belongs in Tier 2 against a
vendor that enforces nonce binding (Sphereon, EUDI reference).

### 6. HTTPS-only by-reference URIs

The plugin requires `https://` on `credential_offer_uri` and
`presentation_definition_uri` for security (a leaked pre-auth code
or PD-by-reference URI is a credential theft vector). Walt.id
running on `http://localhost` can't satisfy that, so our test
harness rewrites by-reference URIs to by-value before handing them
to the plugin (`resolveOfferToByValue` /
`resolveAuthorizationRequestToByValue`). This is a test-only shim;
the plugin's HTTPS guard is unmodified.

## Architecture notes

### By-value URL rewriting

The plugin's parser mandates `https://` on `credential_offer_uri` and
`presentation_definition_uri` — a legitimate security check, since
both carry sensitive artifacts (a pre-auth code / PD URI leakage is a
credential theft vector). walt.id, running on `http://localhost:7002`
for local testing, can't satisfy that.

Rather than patch the plugin with a "dev-mode bypass" that risks
shipping to production, `setup/walt-id-client.ts` exposes two
rewriters:

- `resolveOfferToByValue(uri)` — fetches the referenced offer JSON and
  repackages it as `openid-credential-offer://?credential_offer=<json>`
- `resolveAuthorizationRequestToByValue(uri)` — fetches the referenced
  PD and inlines it as `presentation_definition=<json>`

The rewritten URL exercises the same downstream plugin code paths
(token exchange, credential request, VP build + submit) against real
walt.id endpoints. Only the parse-side HTTPS guard is sidestepped,
explicitly and only inside test code.

A future variant of this suite could add a Caddy reverse proxy with
`tls internal` to terminate HTTPS locally and exercise the
by-reference path too — useful but not the primary value add, so
deferred.

### Why a fresh issuer key per run

walt.id's issuer-api is deliberately stateless for signing material:
every `/openid4vc/jwt/issue` POST must carry the issuer's JWK + DID.
The `createIssuerKey()` helper in `walt-id-client.ts` mints a fresh
Ed25519 keypair per spec run so:

1. Tests can't bleed credentials across each other.
2. Each JWT-VC is verifiably signed by a `did:jwk` we just generated,
   preventing any "did it verify against a cached key?" false positive.
3. The assertion `expect(vcPayload.iss).toBe(issuerKey.did)` actually
   proves the plugin sent the right proof and got the right thing
   back.

### Rotating the walt.id image

The compose file pins `waltid/issuer-api:latest` +
`waltid/verifier-api:latest`. For reproducible interop testing you
should pin to a specific version tag (e.g. `waltid/issuer-api:1.2.3`)
once you've settled on a known-good release. The default here favors
"catch drift early" over "never flake", which is right for an
interop harness but wrong for release blockers.

## Troubleshooting

### The issuer container fails to come up

First check `docker logs oid4vc-interop-issuer --tail 80`. Common
failure modes and fixes:

- **`'baseUrl': Missing String from config`** — the config volume
  isn't being mounted, or the file inside is empty. Verify with
  `docker exec oid4vc-interop-issuer ls -la /waltid-issuer-api/config/`.
- **Container shows `(health: starting)` forever** — the JVM is
  alive but the app failed to load a feature. Logs will show
  which.
- **Port 7002 / 7003 in use** — `lsof -i :7002` to find the holder.

### Curl returns 000 / connection refused

The app is bound to *container* port 3000 — host port 7002/7003
only works if the compose file maps `7002:3000` (which it does,
but a stale `7002:7002` mapping from an older checkout will silently
fail). Verify with `docker port oid4vc-interop-issuer`.

### The credential-request phase 400s with `invalid_proof`

Usually means the plugin's proof JWT is binding the credential to a
`kid` walt.id can't resolve. Our mock LearnCard uses `did:jwk:...` —
if walt.id's DID resolver panel has been disabled, bring the stack
back up with defaults.

### Tests time out waiting for walt.id readiness

Cold-pulling both images on a fresh machine can take 60–90 seconds
on a good connection. Increase `globalSetup`'s `waitFor` timeout in
`setup/global-setup.ts` if your CI image cache is slow.
