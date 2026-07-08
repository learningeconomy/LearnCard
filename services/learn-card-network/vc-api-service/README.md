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

```bash
bun run serverless-deploy                 # dev  → staging.vc-api.learncard.com
bunx nx serverless-deploy vc-api-service --stage=production   # → vc-api.learncard.com
```

Domain/hosted-zone can be overridden via `SERVERLESS_DOMAIN_NAME` /
`SERVERLESS_HOSTED_ZONE_NAMES`.

## DIDKit engine

DIDKit runs via WASM. The WASM binary is marked `external` and copied next to the
handler at build time by `esbuildPlugins.cjs`, then loaded relative to `__dirname`
in `src/learn-card.ts`.
