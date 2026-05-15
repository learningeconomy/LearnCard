# `@workspace/opencred-interop-e2e-tests`

Cross-vendor interop tests proving that **LearnCard can present
credentials to [OpenCred](https://github.com/stateofca/opencred)** —
California DMV's open-source W3C VC verifier platform.

Where `tests/openid4vc-interop-e2e/` drives the openid4vc plugin
against walt.id, Sphereon, and EUDI, this suite drives the **full
LearnCard wallet** (`@learncard/init`, real `issueCredential` +
`issuePresentation`, real didkit signing) against OpenCred's native
OID4VP workflows.

The two suites complement each other: openid4vc-interop-e2e proves the
plugin alone, this suite proves the wallet end-to-end. Either failing
catches a different class of regression.

## What's covered

| Spec | What it proves | OpenCred profile |
|---|---|---|
| [`oid4vp-draft18-roundtrip.spec.ts`](tests/oid4vp-draft18-roundtrip.spec.ts) | Ground-truth: LearnCard-issued LD-VC accepted by OpenCred draft18 verifier (PEX, jwt_vp_json, did:web Request Object). | `OID4VP-draft18` |
| [`oid4vp-1.0-dcql-roundtrip.spec.ts`](tests/oid4vp-1.0-dcql-roundtrip.spec.ts) | Same roundtrip via OID4VP 1.0 + DCQL — keyed-object `vp_token`, no `presentation_submission`. | `OID4VP-1.0` |
| [`ldp-vc-cryptosuites.spec.ts`](tests/ldp-vc-cryptosuites.spec.ts) | OpenCred accepts both `Ed25519Signature2020` and `DataIntegrityProof(eddsa-rdfc-2022)` envelopes from LearnCard. | `OID4VP-draft18` |
| [`multi-credential.spec.ts`](tests/multi-credential.spec.ts) | PEX with two `input_descriptors` — selector binds the right VC to the right descriptor. | `OID4VP-draft18` |
| [`multi-did-method.spec.ts`](tests/multi-did-method.spec.ts) | Default did:key holder identity round-trips. did:web holder is `it.skip`-gated on a follow-up. | `OID4VP-draft18` |
| [`negative.spec.ts`](tests/negative.spec.ts) | OpenCred rejects tampered signatures, missing `issuer`, and past `expirationDate`. | `OID4VP-draft18` |

## What's NOT covered (and why)

| Out of scope | Why |
|---|---|
| mDoc / DC API (`mso_mdoc`, ISO 18013-7) | LearnCard does not yet emit mDoc credentials. Adding it is a separate workstream — see `apps/learn-card-app` for the current credential format support. |
| `jwt_vc_json` issuance roundtrip | LearnCard's `wallet.invoke.issueCredential` produces LD-proof VCs only today. Presenting a manually-crafted JWT-VC works in principle but the issuance plumbing is the meaningful test once it lands. |
| SD-JWT VC | Neither OpenCred (audited) nor LearnCard's openid4vc plugin currently supports SD-JWT VC presentation. |
| Microsoft Entra Verified ID workflow | OpenCred supports it; LearnCard talking to Entra is a separate epic. |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) daemon running
- [`docker compose`](https://docs.docker.com/compose/) v2
- Free host ports: `22080` (OpenCred), `27018` (Mongo)
- Internet access on first run (compose builds OpenCred from a pinned upstream commit)

## Running locally

```bash
pnpm --filter @workspace/opencred-interop-e2e-tests test:interop:e2e
```

That command brings up the stack, runs every spec, and tears down on
exit. **First run** has a ~5–10 minute cold-start cost while compose
builds the OpenCred image; subsequent runs reuse the cached image
(~30s).

### Iterating without cold-starting Docker each run

```bash
docker compose up -d --build              # one time
pnpm test:interop:no-docker               # repeat as needed
docker compose down -v                    # when finished
```

### Tailing OpenCred logs

```bash
pnpm logs
```

## How it works

```
┌──────────────────────────────────────────────────────────────┐
│  test process (vitest)                                       │
│                                                              │
│  initLearnCard({seed, didkit})    →   real wallet            │
│  wallet.invoke.issueCredential()  →   LD-VC                  │
│  wallet.invoke.presentCredentials()                          │
│       │                                                      │
│       ▼                                                      │
│  POST http://localhost:22080/workflows/.../authorization/   │
│       response   (vp_token + presentation_submission)        │
└──────────────────────────────────────────────────────────────┘
                    │                            ▲
                    │ HTTPS (self-signed,        │ poll
                    │  TLS verify off)           │
                    ▼                            │
┌──────────────────────────────────────────────────────────────┐
│  Docker: opencred container (port 22080 → 22080)             │
│   ├─ verifies VP signature (Ed25519 / DataIntegrityProof)    │
│   ├─ verifies inner VC issuer signature                      │
│   ├─ matches VC against workflow.query                       │
│   └─ persists exchange state in Mongo (port 27018 → 27017)   │
└──────────────────────────────────────────────────────────────┘
```

Each spec:

1. POSTs to `/workflows/<id>/exchanges` (HTTP Basic auth) to mint an exchange.
2. Receives the `openid4vp://` URI in the response.
3. Hands the URI to `wallet.invoke.resolveAuthorizationRequest()` —
   LearnCard fetches OpenCred's published `did:web:localhost%3A22080`
   document at `/.well-known/did.json` to verify the signed Request
   Object.
4. Calls `wallet.invoke.presentCredentials()` which signs and POSTs
   the VP.
5. Polls `GET /workflows/<id>/exchanges/<id>` (Bearer auth) until
   state is `complete` or `invalid`.

## OpenCred configuration

The test config lives at [`configs/opencred.yaml`](configs/opencred.yaml).
It defines five workflows (one per scenario), enables `didWeb.mainEnabled`
so OpenCred publishes its DID document, and embeds a pre-generated
ES256 signing key — clearly marked as a test fixture, not a deployment
secret.

The `signingKeys` PEM blocks are real, valid keys generated specifically
for this suite. Rotating them is a no-op for tests — generate a new pair
with `openssl ecparam -name prime256v1 -genkey -noout` (or `Node
crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })`) and replace
both `privateKeyPem` and `publicKeyPem`; the `id` field is derived from
`sha256(publicKey)` per OpenCred's `scripts/generateConfig.js`.

## Bumping the OpenCred version

The compose file pins OpenCred to a specific commit SHA via the
`build.context` git fragment:

```yaml
build:
  context: https://github.com/stateofca/opencred.git#<sha>
```

Bumping it means:

1. Pick a new commit from https://github.com/stateofca/opencred
2. Update the SHA in [`compose.yaml`](compose.yaml)
3. Re-run the suite — any wire-shape changes will surface as failing
   specs at the assertion they cover
4. If a spec needs to adapt to OpenCred's new behaviour, that's the
   moment to discuss it before merging the bump

## Configuration knobs

| Env var | Default | What it does |
|---|---|---|
| `E2E_MANAGE_DOCKER` | `true` | When `false`, skip `docker compose up/down`; expects the stack already running. |
| `OPENCRED_BASE_URL` | `http://localhost:22080` | Point specs at a different OpenCred instance (e.g. a hosted sandbox). |

## Troubleshooting

### `wget: bad SSL_CTX` during health check

OpenCred is up but the wget inside the container can't find ca-certs.
The healthcheck uses `--no-check-certificate` for exactly this reason
— if you see this error, you're probably running an older alpine
image. Rebuild: `docker compose build --no-cache opencred`.

### `OpenCred POST /workflows/<id>/exchanges failed 401`

The clientSecret in the test (`lc-interop-secret`) doesn't match what
OpenCred has loaded. Verify with:

```bash
docker compose exec opencred cat /etc/app-config/opencred.yaml | grep -A1 clientSecret
```

### Resolve Authorization Request fails with `request_signer_untrusted`

LearnCard's did:web resolver can't fetch OpenCred's DID doc. Check:

```bash
curl --insecure http://localhost:22080/.well-known/did.json
```

If this returns 404, `didWeb.mainEnabled` is misconfigured in
`opencred.yaml`. If it returns the DID document but the test still
fails, the wallet's fetch is being blocked — most likely because
NODE_TLS_REJECT_UNAUTHORIZED isn't set (it's set in
`vitest.config.ts`).

### Spec hangs on `waitForExchangeComplete`

The wallet's POST succeeded but OpenCred never resolved the exchange.
Tail logs: `pnpm logs`. Common causes:

- VC type doesn't match workflow's `query[].type` (selector picked
  the wrong VC, or wrong workflow ID)
- VC signature couldn't verify (issuer DID unresolvable from
  OpenCred's container — see follow-up note about did:web holders)

## License

MIT © Learning Economy Foundation
