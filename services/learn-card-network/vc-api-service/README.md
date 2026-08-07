# VC-API Service

A **stateless** W3C [VC-API](https://w3c-ccg.github.io/vc-api/) issuer/verifier used by the
W3C and W3C-CCG Verifiable Credentials interoperability test suites (surfaced on
[canivc.com](https://canivc.com)).

It wraps the LearnCard SDK to expose the conformance endpoints the test suites call:

| Method | Path                    | Purpose                                                  |
| ------ | ----------------------- | -------------------------------------------------------- |
| `POST` | `/credentials/issue`    | Sign an unsigned VC                                      |
| `POST` | `/credentials/verify`   | Verify a signed VC                                       |
| `POST` | `/presentations/verify` | Verify a signed VP                                       |
| `GET`  | `/did`                  | The issuer DID (non-standard; used by the VC-API plugin) |

Additional VC-API paths (`/credentials/status`, `/credentials/derive`,
`/presentations/prove`, list/get/delete) return `501`.

## Why a separate service?

Issuing and verifying are **stateless cryptographic operations** with no dependency
on the network graph, so they do not belong in `brain-service` (which owns the
_stateful_ VC-API concerns — credential exchange/workflows and status lists). This
service replaces the legacy `@learncard/create-http-bridge` package that the test
suites previously pointed at (`bridge.learncard.com`).

-   **Status lists / revocation** are served by `brain-service` (`/status-lists/{id}`).
-   **This service** only signs and verifies. No DB, no VPC, no auth.

## Identity

The issuer identity is a single `did:key` derived from `SEED`. That DID must match
the `issuers[].id` declared in the W3C test-suite manifests
(`w3c/vc-test-suite-implementations` and `w3c-ccg/vc-test-suite-implementations`).

## Local development

```bash
cp .env.example .env   # set SEED
bun run dev            # watch mode on PORT (default 3000)
```

Smoke test:

```bash
curl localhost:3000/did
```

## Deployment

Domains default to `vc-api.network.learncard.com` (production) and
`staging.vc-api.network.learncard.com` (dev), both under the existing
`network.learncard.com.` Route53 hosted zone — no env overrides needed.

**First time only** — create the ACM certificate. The `serverless-certificate-creator`
plugin does _not_ run on deploy; `serverless-domain-manager` expects the cert to
already exist:

```bash
COREPACK_ENABLE_PROJECT_SPEC=0 bunx serverless create-cert --stage dev
```

Then deploy:

```bash
SEED=<same-seed-as-legacy-bridge> \
bunx nx serverless-deploy vc-api-service --stage=dev --region=us-east-1
```

Requirements / gotchas:

-   **`pnpm` must be installed.** serverless-esbuild uses it as the artifact packager
    (see `serverless.yml` — the npm packager crashes on this repo's pnpm override
    syntax, and Bun isn't supported as a packager).
-   The `serverless-deploy` script sets `COREPACK_ENABLE_PROJECT_SPEC=0` so a corepack
    `pnpm` shim isn't blocked by the repo's `packageManager: bun` field.
-   **Seed reuse is mandatory** — deploy with the same seed the legacy bridge used, or
    `/did` won't match the DID in the test-suite manifests.
-   The one-time `create-cert` requires the `network.learncard.com.` hosted zone to
    exist in the target AWS account (it does — brain-service uses it). Override target
    domain/zone via `SERVERLESS_DOMAIN_NAME` / `SERVERLESS_HOSTED_ZONE_NAMES`.

## Known conformance results (W3C suites, run against staging)

-   **VC-API Issuer (Data Integrity):** 13/13 pass. The endpoint defaults to
    `Ed25519Signature2020` proofs (see `src/app.ts`) — the SDK default regressed to
    `DataIntegrityProof`, which failed the Ed25519 suite.
-   **VC-API Verifier (Data Integrity):** 17/18 pass. The one failure ("MUST verify a
    valid VC") is a **DIDKit `ssi` (Rust) limitation**, not a wrapper bug: `vc.verify()`
    fails its proof-filtering step when a VC's `issuer` is a plain HTTPS URL (valid per
    W3C VCDM) rather than a DID, erroring with
    `Unable to filter proofs: Unable to resolve: invalidDid`. Proven by swapping the
    test vector's URL issuer for a DID — the error vanishes and verification proceeds to
    the signature check. Fixing it requires upgrading/patching the vendored `didkit`/`ssi`
    crate (repo-wide impact on all verification) and is tracked separately.

## DIDKit engine

DIDKit runs via WASM. The WASM binary is marked `external` and copied next to the
handler at build time by `esbuildPlugins.cjs`, then loaded relative to `__dirname`
in `src/learn-card.ts`.
