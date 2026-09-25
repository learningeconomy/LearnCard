# `security/`

Checked-in security artifacts for LearnCard — starting with the Nitro Enclave
measurements produced by `.github/workflows/escrow-enclave-eif.yml`. Future
security artifacts (other enclaves, signed release manifests, etc.) can live
alongside `escrow-measurements/` here as they come online.

## Escrow enclave measurements (`escrow-measurements/`)

`escrow-measurements/<tag>.json` holds one file per `escrow-enclave-v*`
release tag of `services/escrow-enclave-app`, each recording that build's
PCR0/PCR1/PCR2 (SHA384, lowercase hex) plus provenance:

```json
{
    "pcr0": "…",
    "pcr1": "…",
    "pcr2": "…",
    "imageTag": "escrow-enclave:<git-short-sha>",
    "sourceDateEpoch": 1758000000,
    "gitCommit": "<full git sha>",
    "eifSha256": "…",
    "nitroCliVersion": "…",
    "workflowRunId": "…"
}
```

These files are **never pushed to `main` directly**. Per notepad decision D10
(`.sisyphus/notepads/nitro-escrow-enclave/decisions.md`), a wrong or
malicious PCR tuple would let an attacker's enclave image pass client-side
attestation pinning — the same two-person-review bar this repo already
applies to the Terraform KMS key policy (`infra/escrow-enclave/README.md`,
"Two-person key-policy change procedure") applies here. The
`publish-measurements` CI job only ever opens a PR
(`peter-evans/create-pull-request`); a human must review and merge it.

### How a PCR tuple flows into production

1. **CI produces it.** Tagging `services/escrow-enclave-app` with
   `escrow-enclave-vX.Y.Z` triggers `.github/workflows/escrow-enclave-eif.yml`.
   Its `eif` job builds the Docker image **twice** from the same commit with
   `scripts/build-eif.sh`, converts each to a `.eif` with `nitro-cli
build-enclave`, and diffs both `measurements.json` files with
   `scripts/verify-measurements.sh` — any PCR mismatch fails the job. Only a
   verified-reproducible build's measurements ever reach the next step.
2. **CI opens a PR.** `publish-measurements` copies the verified
   `escrow-measurements.json` to `security/escrow-measurements/<tag>.json`
   and opens a PR. A reviewer checks the PR (commit SHA, workflow run,
   diffed PCRs) and merges it.
3. **Terraform picks it up.** `infra/escrow-enclave`'s `enclave_measurements`
   variable takes `{label, pcr0, pcr1, pcr2}` tuples — copy the three PCR
   values from the merged JSON file in under a new `label` (e.g. the tag
   name), following the **N / N+1 measurement rotation** procedure in
   `infra/escrow-enclave/README.md` (never remove the currently-live
   measurement until every running enclave instance has moved to the new
   one).
4. **Tenant config picks it up.** The same three PCR values become one entry
   in each tenant's `escrowEnclaveMeasurements: {pcr0, pcr1, pcr2,
imageSha384?}[]` array (see decisions.md D6, `learn-card-base`'s tenant
   config schema). Clients pin against this allowlist when verifying a Nitro
   attestation document. **The Terraform key-policy update and the
   tenant-config/SDK release must roll out together**, both keeping the old
   measurement in place (N) alongside the new one (N+1) until every enclave
   instance and every client build has moved over — this is the same
   overlap window described in `infra/escrow-enclave/README.md`.

Full detail on what changes PCR0 vs PCR1 vs PCR2 is in
`services/escrow-enclave-app/README.md` ("Reproducible build" →
"What makes PCR0/1/2 change").

## Self-hosted Nitro runner requirements

The `eif` job in `.github/workflows/escrow-enclave-eif.yml` runs on
`runs-on: [self-hosted, linux, x64, nitro-enclaves]` — **GitHub-hosted
runners cannot do this job**: `nitro-cli build-enclave` requires the AWS
Nitro Enclaves kernel driver, which only exists on a Nitro-capable EC2
instance type with the enclave option enabled at launch, and GitHub-hosted
runners are neither. A self-hosted runner registered with (at least) the
`self-hosted, linux, x64, nitro-enclaves` labels must be provisioned before
this job can run for real; until then, `test` (native `cargo`, runs on
`ubuntu-latest`) is the only job that executes on every PR/push.

Runner requirements:

| Requirement              | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS                       | Amazon Linux 2023 (matches `infra/escrow-enclave`'s launch template AMI family, and is the platform `aws-nitro-enclaves-cli` officially packages for).                                                                                                                                                                                                                                                                                                                                                                           |
| Instance type            | A Nitro-capable EC2 type with `enclave_options.enabled = true` at launch (e.g. `m6i.xlarge` — the same minimum decisions.md D1 requires for the production enclave-host ASG: a 2-vCPU enclave needs ≥2 vCPUs left over for the parent).                                                                                                                                                                                                                                                                                          |
| `aws-nitro-enclaves-cli` | **Pinned exact package version**, not "latest." PCR1 (the enclave's kernel + boot ramfs measurement) comes from `nitro-cli` itself, not from this repo's Dockerfile — two otherwise-identical `.eif` builds made with two different `nitro-cli` versions produce different PCR1 values. See the crate README's "Reproducible build" → "What makes PCR0/1/2 change" for the full explanation. Record the exact pinned version in the runner's provisioning config (AMI build script / user-data), not just "install the package." |
| Docker                   | Running daemon — both `scripts/build-eif.sh` (loads the kaniko-built image) and this workflow's binary-extraction step (`docker create` / `docker cp`) need it.                                                                                                                                                                                                                                                                                                                                                                  |
| `jq`                     | Used by `scripts/build-eif.sh`, `scripts/verify-measurements.sh`, and this workflow directly (parsing `measurements.json`, building `escrow-measurements.json`/`manifest.json`).                                                                                                                                                                                                                                                                                                                                                 |
| Nitro Enclaves allocator | `/etc/nitro_enclaves/allocator.yaml` sized for at least the crate's enclave resource needs (see `infra/escrow-enclave`'s launch-template user-data for the production equivalent — this CI runner only needs enough to run `nitro-cli build-enclave`, not to keep an enclave running long-term).                                                                                                                                                                                                                                 |

### Why this job never runs on pull requests

`eif`'s `if:` condition (`github.event_name != 'pull_request'`) excludes
**every** `pull_request` event, not just fork PRs. This isn't about secrets
exposure (the job's only elevated permission is `id-token: write` for
keyless signing) — it's that self-hosted runners execute on infrastructure
this org controls, and GitHub's own hardening guidance is that self-hosted
runners must never execute PR-supplied code, full stop, because a
compromised build step gets arbitrary code execution on that machine
(network access, credential-harvesting, persistence), not just a bad CI
result. Only `push` (to `main` or an `escrow-enclave-v*` tag) and
`workflow_dispatch` reach the `eif` job.

## Known risks / open items

These are genuine, currently-unresolved gaps discovered while wiring this
workflow — flagged here (and in
`.sisyphus/notepads/nitro-escrow-enclave/{problems,issues}.md`) rather than
silently worked around, since fixing several of them is out of this task's
scope (no edits to `Cargo.toml`/`Cargo.lock`/`Dockerfile`/build scripts).

1. **`cargo audit` currently fails beyond the one sanctioned ignore.**
   Notepad decision D11 authorizes ignoring exactly `RUSTSEC-2023-0071` (the
   `rsa` crate's Marvin timing-sidechannel advisory). As of 2026-09-25,
   `cargo audit` against this crate's committed `Cargo.lock` **also**
   reports `RUSTSEC-2026-0258` (`h2` 0.3.27), `RUSTSEC-2026-0104` /
   `RUSTSEC-2026-0098` / `RUSTSEC-2026-0099` (`rustls-webpki` 0.101.7) — all
   transitively pulled in by `aws-nitro-enclaves-cose`/`aws-nitro-enclaves-nsm-api`'s
   older hyper/rustls dependency stack (the `nitro` feature) — plus an
   "unmaintained" **warning** for `serde_cbor` (same two crates' transitive
   dependency; warnings alone don't fail `cargo audit`'s exit code, so this
   one doesn't block the gate by itself). The 4 additional **vulnerabilities**
   do. This means **the `test` job's `cargo audit` step is expected to fail
   on the first real run** until either those two `aws-nitro-enclaves-*`
   crates are upgraded (blocked today: newer AWS SDK releases require Rust
   1.94.1, and `rust-toolchain.toml` pins 1.93.0 — see the crate README) or
   a security reviewer makes an explicit new decision to ignore the
   additional advisories (with the same kind of written rationale D11 gives
   for the `rsa` one). This task deliberately did **not** add more
   `--ignore` flags unilaterally: doing so for a security-critical enclave's
   CI gate is a decision that belongs in `decisions.md`, not a drive-by
   workflow edit.
2. **`sigstore/cosign-installer`'s own README states "self-hosted runners
   may not work."** The `eif` job's signing step runs on our self-hosted AL2023
   runner, not a GitHub-hosted one. Our runner is fully repo-controlled (not a
   generic third-party image), so it may work fine — but this has not been
   exercised end-to-end anywhere (no Nitro-capable hardware was available to
   this task). If `sigstore/cosign-installer` fails on the runner in
   practice, the fallback is to provision a pinned, checksum-verified
   `cosign` binary directly on the runner AMI/image (from
   `https://github.com/sigstore/cosign/releases`) and replace the
   `Install cosign` step with a no-op (`cosign` already on `PATH`), rather
   than dropping manifest signing.
3. **Reproducibility is same-day, not "forever."** `services/escrow-enclave-app/Dockerfile`
   pins its base image by digest, but its `apk add` packages still resolve
   against the _live_ Alpine `v3.22` package repository at build time. This
   workflow's double-build gate (`verify-measurements.sh`) only proves the
   two builds _in this run_ are identical — it does not prove a rebuild from
   the same tag a year later still reproduces the same PCRs, since a
   security backport within the `v3.22` branch could shift a resolved
   package version. See the crate README's "Reproducible build" section for
   the full explanation and the (not implemented) stronger fix (pinning
   exact `apk add pkg=version` strings).
4. **Non-root NSM/vsock access is unverified.** The Dockerfile's runtime
   stage runs as `USER 65532:65532` (non-root). Whether `/dev/nsm` and the
   enclave's vsock socket are actually accessible to a non-root UID inside a
   real running Nitro Enclave has not been confirmed (no Nitro hardware
   available to any task in this branch so far) — this can only be verified
   the first time an `.eif` produced by this pipeline is actually launched
   with `nitro-cli run-enclave` on real hardware.

## What was verified where

Verified on the machine that authored this workflow (no Nitro hardware, no
`nitro-cli`, no Docker daemon running — see
`.sisyphus/notepads/nitro-escrow-enclave/issues.md`, "P2.2 report", for full
command output):

- The workflow YAML parses (`js-yaml`) and is `actionlint`-clean except for
  one expected, non-actionable finding: `nitro-enclaves` is flagged as an
  "unknown label" because it's a custom self-hosted-runner label `actionlint`
  has no way to know about without a `runner-label` config this task's scope
  didn't include.
- `scripts/check-binary-paths.sh` is `shellcheck`-clean and was run against a
  locally built (`cargo build`, default features) **debug** binary — which,
  as expected, it correctly flags as containing host paths (macOS
  `/Users/<you>/.cargo/registry/...` strings), since a plain local `cargo
build` does none of the Dockerfile's `--remap-path-prefix` scrubbing. That
  failure is the proof the script works, not a bug — see the script's own
  header comment.
- Every `cargo` command the `test` job runs (`fmt --check`, both `clippy`
  invocations, `test`, `check --features nitro,kms`) was run directly
  against this crate and passes. `cargo audit` was also run directly; see
  "Known risks" #1 above for its result.

**Cannot be verified except on the real self-hosted Nitro runner** (or a
Nitro-capable EC2 instance provisioned equivalently):

- That `scripts/build-eif.sh` / `nitro-cli build-enclave` actually succeed
  and produce a real `.eif` at all (this task's machine has no Linux, no
  `nitro-cli`, and Docker was not running).
- That two independent builds of the same commit actually produce identical
  PCR0/1/2 (the double-build reproducibility gate this workflow exists to
  enforce).
- That the binary extracted from a **real** `build-a/image.tar` passes
  `check-binary-paths.sh` (i.e., that the Dockerfile's `--remap-path-prefix`
  flags actually work as intended on a real Linux/musl build — only the
  negative case, an unremapped local debug build, was demonstrated here).
- Whether `sigstore/cosign-installer` actually works on this specific
  self-hosted AL2023 runner image (see "Known risks" #2).
- Whether `/dev/nsm`/vsock are reachable as UID 65532 inside a real running
  enclave (see "Known risks" #4).
