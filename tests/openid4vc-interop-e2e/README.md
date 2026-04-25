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

| File | Flow under test |
|---|---|
| `tests/issue.spec.ts` | Plugin ingests a walt.id-minted pre-auth offer, exchanges the code, presents a proof JWT, and receives a walt.id-signed JWT-VC. Plus a negative test: tampered pre-auth code ⇒ `invalid_grant`. |
| `tests/present.spec.ts` | Plugin resolves a walt.id-generated Authorization Request URI into its spec-shaped components (`response_type`, `nonce`, `state`, `response_uri`, `presentation_definition`). |
| `tests/roundtrip.spec.ts` | **The interop ground-truth test.** Full loop: issue from walt.id → plugin holds → plugin presents back → walt.id verifier returns `verificationResult: true`. |

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

walt.id requires the issuer-api to be able to write to its config
directory. If you've previously mounted a stale config dir via the
commented-out `volumes:` block in `compose.yaml`, wipe it with:

```bash
rm -rf config/issuer config/verifier
```

### The credential-request phase 400s with `invalid_proof`

Usually means the plugin's proof JWT is binding the credential to a
`kid` walt.id can't resolve. Our mock LearnCard uses `did:jwk:...` —
if walt.id's DID resolver panel has been disabled, bring the stack
back up with defaults.

### Tests time out waiting for walt.id readiness

Cold-pulling both images on a fresh machine can take 60–90 seconds
on a good connection. Increase `globalSetup`'s `waitFor` timeout in
`setup/global-setup.ts` if your CI image cache is slow.
