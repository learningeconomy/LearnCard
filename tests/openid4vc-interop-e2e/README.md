# `@workspace/openid4vc-interop-e2e-tests`

Real-vendor interop tests for the `@learncard/openid4vc-plugin`. Drives
the plugin end-to-end against:

- **Tier 1**: a locally-hosted [walt.id Community Stack](https://github.com/walt-id/waltid-identity) issuer + verifier in Docker (lenient real vendor, real-network, **PEX**).
- **Tier 2**: an in-process strict verifier built on two reference TypeScript libraries from independent teams — [`@sphereon/pex`](https://github.com/Sphereon-Opensource/PEX) for **PEX** evaluation and [`dcql`](https://github.com/openwallet-foundation-labs/dcql-ts) (OWF Labs, by the spec's author) for **DCQL** matching, plus `jose` for shared JWT/nonce/audience checks.
- **Tier 2.C**: the [EU Digital Identity Wallet reference verifier](https://github.com/eu-digital-identity-wallet/eudi-srv-verifier-endpoint) (OID4VP 1.0, **DCQL**, mso_mdoc / dc+sd-jwt only) running in Docker. Now runs three active parsing-side interop tests plus one documented-skip full-roundtrip test gated on plugin SD-JWT-VC presentation support.

The three tiers complement each other: walt.id catches real-vendor
wire-level spec drift, Sphereon catches the spec-compliance gaps
walt.id is too lax to reveal AND validates the plugin's DCQL output
(OID4VP 1.0 §6), and EUDI provides the authoritative EU government
reference impl for OID4VP 1.0 — surfacing plugin gaps (SD-JWT-VC
presentation, OID4VP 1.0 client-id-prefix semantics) the in-process
tiers can't see.

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
- Ports `7002`, `7003`, and `7004` free on the host

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

### Tier 1 — walt.id (real vendor, real wire)

| File | Tests | Flow under test |
|---|---|---|
| `tests/issue.spec.ts` | 1 | Pre-auth OID4VCI: walt.id mints offer → plugin accepts → walt.id-signed JWT-VC bound to holder DID. |
| `tests/present.spec.ts` | 1 | OID4VP request resolution: plugin parses walt.id-generated `openid4vp://authorize?...` into spec-shaped fields (`response_type`, `nonce`, `state`, `response_uri`, `presentation_definition`). |
| `tests/roundtrip.spec.ts` | 1 | **Interop ground-truth.** Full loop: walt.id issues → plugin holds → plugin presents back → walt.id verifier returns `verificationResult: true`. |
| `tests/multi-credential.spec.ts` | 1 | Multi-input-descriptor PD. Two distinct VC types (`UniversityDegree` + `OpenBadgeCredential`) issued separately, then presented together in a single VP that satisfies both descriptors. Exercises the plugin's selector + descriptor-map emission. |
| `tests/auth-code.spec.ts` | 1 | OID4VCI **Slice 4** (authorization_code + PKCE). walt.id mints an offer with `authorization_code` grant, plugin builds the authorization URL with PKCE S256, the harness simulates the user-agent redirect to capture the `code`, plugin exchanges code → token → credential. |
| `tests/sd-jwt.spec.ts` | 1 | SD-JWT VC issuance. Dynamically discovers any `vc+sd-jwt` / `dc+sd-jwt` / `sd-jwt-vc` config from walt.id's running metadata (no hard-coded type id), then validates the plugin can run the credential request and surface the format. SD-JWT *presentation* (key binding + selective disclosure) is intentionally out of scope here. |
| `tests/negative.spec.ts` | 0 + 2 skipped | Both negative tests against walt.id are `it.skip`d — see *Walt.id quirks* below. The strict versions live in Tier 2 against Sphereon. |

### Tier 2 — Sphereon (strict spec compliance, in-process)

In-process strict verifier built on **two** reference TypeScript
libraries from independent teams:

- **PEX path**: [`@sphereon/pex`](https://github.com/Sphereon-Opensource/PEX)
  by Sphereon for DIF Presentation Exchange v2 evaluation.
- **DCQL path**: [`dcql`](https://github.com/openwallet-foundation-labs/dcql-ts)
  (OWF Labs) by Martin Auer (DCQL spec author, SPRIN-D-funded) for
  OID4VP 1.0 §6 Digital Credentials Query Language matching.

The harness branches on `session.kind` (`pex` | `dcql`) and routes
each submission through the corresponding strict matcher.

| File | Tests | Flow under test |
|---|---|---|
| `tests/sphereon-roundtrip.spec.ts` | 1 | **PEX cross-vendor roundtrip.** walt.id issues a credential → our plugin holds it → Sphereon's strict PEX evaluator (`@sphereon/pex`) accepts the VP. Proves a credential from one vendor passes a different vendor's verifier — the canonical interop signal. |
| `tests/sphereon-dcql-roundtrip.spec.ts` | 1 | **DCQL cross-vendor roundtrip.** Same flow, DCQL routing: walt.id issues → plugin holds → plugin auto-routes to its DCQL pipeline (per `request.dcql_query`) → Sphereon's `dcql.DcqlPresentationResult` matcher accepts. Pins the OID4VP 1.0 §6.4 wire shape (object-form `vp_token` keyed by `credential_query_id`, no `presentation_submission`) end-to-end. |
| `tests/sphereon-strict-binding.spec.ts` | 4 | Strict checks walt.id can't enforce: **(a)** nonce binding — a VP signed for session A's nonce, replayed to session B with `state` rewritten, is rejected with `nonce mismatch`. **(b)** Audience binding — a VP with the wrong `aud` claim is rejected with `audience mismatch`. **(c)** Inner-VC tamper detection — a single bit flipped in a JWT-VC signature causes deterministic rejection at `jose.jwtVerify`. **(d)** Clean positive — the foil that proves the strict checks gate on real failures, not always-reject. |

The Sphereon harness lives in `setup/sphereon-verifier.ts` — a tiny
Node `http.createServer` listener on a dynamic port that mimics OID4VP
§8's `direct_post` semantics. See its module docstring for the full
rejection pipeline (signature → nonce → audience → [PEX evaluator OR
DCQL matcher] → inner VC).

Spec-misshapen submissions are rejected at the door: a PEX session
that receives a body without `presentation_submission` 400s, and a
DCQL session that receives one *with* `presentation_submission` 400s
(OID4VP 1.0 §6.4 mandates the field be absent for DCQL responses).

### Tier 2.C — EUDI reference verifier (Docker, OID4VP 1.0 / DCQL)

The [EU Digital Identity Wallet reference verifier](https://github.com/eu-digital-identity-wallet/eudi-srv-verifier-endpoint)
is the EU Commission's authoritative OID4VP 1.0 implementation.
Used primarily for what *can't* yet be tested end-to-end against it,
so plugin gaps that block production wallet integration surface
locally instead of in EU pilots.

| File | Tests | What it covers |
|---|---|---|
| `tests/eudi-parsing.spec.ts` | 3 active + 1 skipped | **Active**: (1) EUDI is reachable, accepts a DCQL session creation, and emits an OID4VP 1.0 spec-shape response (signed Request Object inlined as `request`, parsed-back DCQL query round-trips). (2) The plugin resolves EUDI's signed Request Object end-to-end — prefix derivation, JWS decoding, claim binding all clean. (3) The selector reports `canSatisfy=false` with a structured format-gap reason when EUDI requests `dc+sd-jwt` and we hold only `jwt_vc_json`, so UIs can render "no matching credential" without crashing. **Skipped**: full credential roundtrip (blocked by plugin SD-JWT-VC presentation support). |

**Documented gaps surfaced by EUDI integration** (the plugin's
prioritized backlog):

1. **✅ Closed: OID4VP 1.0 client-id-prefix support.** The plugin now
   derives the client-id prefix from `client_id` per OID4VP 1.0
   §5.10 (both legacy `client_id_scheme` and inline
   `<prefix>:<value>` / DID URI / https URL forms), routing
   verification through `pre-registered`, `did`, `x509_san_dns`,
   or rejecting with a typed code for unsupported prefixes. See
   `vp/client-id-prefix.ts` for the parser and 22 unit tests in
   `vp/client-id-prefix.test.ts` covering every wire form.
2. **Plugin emits `jwt_vc_json`; EUDI accepts only `mso_mdoc` /
   `dc+sd-jwt`.** EUDI returns `{"error":"UnsupportedFormat"}` at
   the submission boundary. Unblocked by adding SD-JWT-VC
   presentation (KB-JWT signing, selective-disclosure handling)
   to the plugin.
3. **Verifier signing-key resolution gap.** EUDI in `pre-registered`
   mode signs Request Objects with a `kid` referencing a keystore
   *inside* the verifier container, with no JWKS endpoint, no
   `x5c` header, no JWKS URI in client_metadata. Production
   wallets need an out-of-band registry binding `client_id` →
   public key. The plugin currently exposes a clearly-named
   `unsafeSkipRequestObjectSignatureVerification` opt-in for
   interop testing against verifiers in this state; production
   integration with EUDI requires either the registry layer or a
   future EUDI build that publishes its key in-band.

The EUDI Docker image is `linux/amd64`-only; on Apple Silicon hosts
Docker emulates and cold-start is ~30s vs. ~5s for native amd64.
The global-setup probe gives EUDI a 180s timeout to accommodate
emulated boots.

### Cross-vendor enforcement matrix

| Spec property | walt.id `1.0.0-SNAPSHOT` | Sphereon (strict, PEX) | Sphereon (strict, DCQL) | EUDI reference (DCQL) |
|---|---|---|---|---|
| Outer VP JWT signature | ✅ enforced | ✅ enforced | ✅ enforced (per-query VP) | ✅ enforced (gated⁰) |
| Inner VC JWT signature | ⚠️ non-deterministic | ✅ enforced | ✅ enforced | ✅ enforced (gated⁰) |
| Nonce binding (`nonce` claim = session nonce) | ❌ not enforced | ✅ enforced | ✅ enforced (per-query) | ✅ enforced (gated⁰) |
| Audience binding (`aud` claim = `client_id`) | ✅ enforced | ✅ enforced | ✅ enforced | ✅ enforced (gated⁰) |
| Request Object signature verification | n/a | n/a | n/a | ⚠️ bypassed in interop (no in-band JWKS; plugin opts in via `unsafeSkipRequestObjectSignatureVerification`) |
| PEX descriptor-map evaluation | ✅ (lenient) | ✅ (strict, by `@sphereon/pex`) | n/a | n/a |
| DCQL `credential_matches` evaluation | n/a | n/a | ✅ (strict, by `dcql`) | ✅ (strict, native EUDI Kotlin impl) |
| `presentation_submission` field presence | required | required | **forbidden** (must be absent) | **forbidden** (must be absent) |
| `vp_token` shape | string OR object | string OR object | object keyed by `credential_query_id` | object keyed by `credential_query_id` |
| Accepted credential formats | `jwt_vc_json`, `ldp_vc`, SD-JWT issuance | `jwt_vc_json`, `ldp_vc` | `jwt_vc_json`, `ldp_vc` | **`mso_mdoc` + `dc+sd-jwt` only** |
| OID4VP version | Draft 22 (`presentation_definition`) | Draft 22 (PEX) / 1.0 (DCQL) | Draft 22 (PEX) / 1.0 (DCQL) | 1.0 |
| `client_id` style | bare string + `client_id_scheme` | bare string + `client_id_scheme` | bare string + `client_id_scheme` | OID4VP 1.0 client-id-prefix |
| Pre-auth code validation (issuer side) | ❌ accepts any | n/a (Sphereon is verify-only) | n/a | n/a |

⁰ Gated tests: `it.skip` until plugin SD-JWT-VC presentation
support ships. The plugin's parsing-side interop with EUDI is
live in this release; the full roundtrip (presenting a credential
back to EUDI for verification) is gated on the plugin emitting
`dc+sd-jwt` envelopes.

The empty cells in walt.id's column are the reason Tier 2 (Sphereon)
exists — a green Tier 1 alone says nothing about whether our plugin's
VP is actually nonce-bound, whether tampered credentials would be
caught downstream, or whether DCQL responses match the wire shape
spec-strict verifiers expect.

The format / version rows of the table are why **EUDI integration
is currently parsing-side only** — the plugin doesn't yet emit
credentials EUDI can accept (`dc+sd-jwt`). The OID4VP 1.0
client-id-prefix gap closed in this release: the plugin now
parses bare `client_id`s, DID URIs, and explicit
`<prefix>:<value>` forms with a normalized prefix surfaced on
the resolved Authorization Request. The remaining
`it.skip` (full SD-JWT-VC roundtrip) becomes active when the
plugin gains `dc+sd-jwt` presentation support.

## Plugin DCQL pipeline

The `@learncard/openid4vc-plugin` supports BOTH OID4VP query
languages with a single API surface (`presentCredentials`,
`prepareVerifiablePresentation`). Routing is driven entirely by
the verifier's Authorization Request:

- `presentation_definition` set → PEX route (legacy, OID4VP draft 22
  and earlier, every walt.id-class vendor today).
- `dcql_query` set → DCQL route (OID4VP 1.0+, EUDI reference
  verifier, the future).

Mutual exclusion is enforced at parse time per OID4VP 1.0 §5.3
(`VpError('both_pex_and_dcql', ...)`).

DCQL implementation is split into focused modules under
`packages/plugins/openid4vc/src/dcql/`:

| Module | Responsibility |
|---|---|
| `parse.ts` | Wraps `dcql.DcqlQuery.parse` + `validate` behind the plugin's stable `VpError` taxonomy. |
| `adapt.ts` | Held credential (JWT-VC string / LD-VC object) → `DcqlW3cVcCredential`. Drops sd-jwt-vc / mso_mdoc cleanly. |
| `select.ts` | Holder selector via `DcqlQuery.query`. Returns `DcqlSelectionResult` mirroring the PEX `SelectionResult` shape (different keying, same intent). |
| `build.ts` | One unsigned VP per `credential_query_id` in chosen[]. Pure / synchronous. |
| `respond.ts` | Sign each unsigned VP, assemble the OID4VP §6.4 `vp_token` object. |
| `compose.ts` | Verifier-side: `requestW3cVc(spec)` builds spec-correct DCQL queries from domain-shaped intent. |

The plugin's `dcql` library bind uses a namespace import
(`import * as dcql from 'dcql'`) so live-binding works through the
ESM ↔ CJS hop in Jest's transform pipeline. Jest config also maps
the ESM-only `dcql` package to its `.mjs` and runs it through
esbuild-jest's `js` loader — see
`packages/plugins/openid4vc/jest.config.js` for the rationale.

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
but `it.skip`-ed; the strict version is **active in Tier 2 against
Sphereon** (`tests/sphereon-strict-binding.spec.ts`) where every
run confirms the plugin emits the correct per-session nonce.

### 6. HTTPS-only by-reference URIs

The plugin requires `https://` on `credential_offer_uri` and
`presentation_definition_uri` for security (a leaked pre-auth code
or PD-by-reference URI is a credential theft vector). Walt.id
running on `http://localhost` can't satisfy that, so our test
harness rewrites by-reference URIs to by-value before handing them
to the plugin (`resolveOfferToByValue` /
`resolveAuthorizationRequestToByValue`). This is a test-only shim;
the plugin's HTTPS guard is unmodified.

### 7. Non-deterministic inner-VC signature validation (verifier)

Walt.id's verifier sometimes catches a tampered inner VC signature
and sometimes doesn't, on the same input. Observed sequence across
consecutive runs of the same code: reject → accept → reject →
accept. The flake appears to be inside walt.id's verification
pipeline, not our plugin (the plugin packages whatever VC it's
handed — wallets don't pre-verify their own credentials).

The tampered-VC test in `tests/negative.spec.ts` is `it.skip`d
for this reason; the deterministic version lives in
`tests/sphereon-strict-binding.spec.ts` and runs `jose.jwtVerify`
on every inner JWT-VC against its `did:jwk` issuer key — 100%
repeatable rejection on a single bit-flip.

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
