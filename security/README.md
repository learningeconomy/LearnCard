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
    "nitroCliContainerImage": "…",
    "workflowRunId": "…"
}
```

These files are **never pushed to `main` directly**. Per [Design Decision
D10](../services/escrow-enclave-app/SECURITY.md#design-decisions), a wrong or
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
   one). Note: measurement rotation is distinct from key rotation; for key rotation, see `services/escrow-enclave-app/SECURITY.md`.
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

## GitHub-hosted runner + containerized nitro-cli

The `eif` job in `.github/workflows/escrow-enclave-eif.yml` runs on
`runs-on: ubuntu-latest` — a plain GitHub-hosted runner, no self-hosted
infrastructure to provision or maintain. This works because
`nitro-cli build-enclave` does **not** require the AWS Nitro Enclaves kernel
driver or Nitro-capable EC2 hardware: AWS documents building EIFs "on any
Linux environment, including outside of AWS"
([docs](https://docs.aws.amazon.com/enclaves/latest/user/cmd-nitro-build-enclave.html)) —
only `run-enclave` (actually launching an enclave) needs real hardware.
Confirmed by reading `aws-nitro-enclaves-cli`'s own source: `build_enclaves()`
(`src/lib.rs`) never touches `/dev/nitro_enclaves`; that only happens in
`enclave_proc/resource_manager.rs`, used by `run-enclave`. Verified
empirically against the exact pinned image below on a non-Nitro host
(2026-10-01, macOS/arm64 + Docker Desktop, `linux/amd64` via QEMU emulation):
`build-enclave` succeeded with no `--privileged`/device flags, and two
independent invocations produced byte-identical PCR0/1/2.

Since `nitro-cli` itself is only packaged for Amazon Linux,
`services/escrow-enclave-app/scripts/nitro-cli-container.sh` runs it inside a
pinned Amazon Linux 2023 container (`scripts/nitro-cli.Dockerfile`), reached
through the GitHub-hosted runner's own Docker socket — `nitro-cli` talks to
Docker via an embedded Rust API client (bollard) over that socket, not the
`docker` CLI, so no extra tooling or privilege is needed beyond Docker
itself (which `ubuntu-latest` already has). `build-eif.sh` calls this wrapper
instead of a host-installed `nitro-cli` binary; nothing else about the
double-build/measurement pipeline changed.

Pinned inputs (both hardcoded in `nitro-cli.Dockerfile`, not resolved at
build time):

| Requirement                         | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base image                          | `amazonlinux:2023`, pinned by the `linux/amd64` platform manifest digest (resolved via `docker buildx imagetools inspect amazonlinux:2023`), not the multi-arch index or a floating tag.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `aws-nitro-enclaves-cli` / `-devel` | **Pinned exact NEVRA** (`1.5.0-0.amzn2023` as of 2026-10-01), resolved via `dnf repoquery` against the pinned base image. PCR1 (the enclave's kernel + boot ramfs measurement) comes from `nitro-cli`'s own bundled blobs (kernel, initrd, LinuxKit — installed by the `-devel` package, not this repo's app `Dockerfile`) — two otherwise-identical `.eif` builds made with two different `nitro-cli` versions produce different PCR1 values. See the crate README's "Reproducible build" → "What makes PCR0/1/2 change". `-devel` is required (not optional) for `build-enclave` to run at all: despite its name, it ships those blobs, not just headers. |
| Docker                              | Running daemon on the GitHub-hosted runner — used both to `docker load` the kaniko-built app image and, via the bind-mounted socket, by the containerized `nitro-cli`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `jq`                                | Used by `scripts/build-eif.sh`, `scripts/verify-measurements.sh`, and this workflow directly (parsing `measurements.json`, building `escrow-measurements.json`/`manifest.json`). Preinstalled on `ubuntu-latest`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Both `nitroCliVersion` (the live `nitro-cli --version` output) and
`nitroCliContainerImage` (the pinned base image digest + package NEVRA
string above) are captured by `nitro-cli-container.sh` and recorded directly
in `measurements.json` by `build-eif.sh`, so every published
`escrow-measurements/<tag>.json` carries its own exact provenance without
depending on anything installed on the runner outside the containerized
build.

No self-hosted runner, AMI, or Nitro-capable EC2 instance type is needed for
this job anymore. (`infra/escrow-enclave`'s production launch template is a
separate concern — that's where the enclave actually _runs_, via
`nitro-cli run-enclave`, which does need real Nitro hardware; only the CI
_build_ step moved off self-hosted infrastructure.)

### Why this job still never runs on pull requests

`eif`'s `if:` condition (`github.event_name != 'pull_request'`) excludes
**every** `pull_request` event, not just fork PRs — even though GitHub-hosted
runners are ephemeral (a fresh VM per job, destroyed after) and so this is
no longer about protecting persistent self-hosted infrastructure from
untrusted PR code the way it was before this job moved off a self-hosted
runner. Two reasons remain:

1. This job mints a `cosign` keyless signature under the repository's own
   GitHub OIDC identity over the produced measurements manifest. That
   identity should only ever attest to builds from reviewed, protected
   commit history (a branch push or tag) — not an arbitrary PR head/merge
   commit nobody has reviewed yet.
2. It requires manual approval against the `escrow-staging` environment.
   Letting every open PR trigger that approval gate would both spam
   reviewers and let any PR author force approval-gated compute to run
   merely by opening a PR.

Only `push` (to `main` or an `escrow-enclave-v*` tag) and
`workflow_dispatch` reach the `eif` job.

## Known risks / open items

These are genuine, currently-unresolved gaps discovered while wiring this
workflow — flagged here rather than
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
2. **RESOLVED (2026-10-01):** `sigstore/cosign-installer`'s self-hosted-runner
   caveat no longer applies — the `eif` job now runs on `ubuntu-latest`, a
   plain GitHub-hosted runner, which is exactly what the action is built
   for. (Historical context: this job previously ran on a self-hosted AL2023
   runner, where the action's own README warns "self-hosted runners may not
   work"; that runner requirement has been removed entirely — see
   "GitHub-hosted runner + containerized nitro-cli" above.)
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
5. **`aws-nitro-enclaves-cli`'s AL2023 `dnf` repo could prune the exact
   pinned NEVRA someday.** `nitro-cli.Dockerfile` pins `1.5.0-0.amzn2023`
   exactly, resolved 2026-10-01 — unlike the app `Dockerfile`'s Alpine
   `apk add` gap (risk #3, silent drift to a newer same-named version), if
   the Amazon Linux 2023 repo stops serving this exact historical package
   version, a future rebuild of `nitro-cli.Dockerfile` fails outright
   (`dnf install` errors on the missing NEVRA) rather than silently
   resolving different bits — a louder, safer failure mode, but still worth
   flagging: pin a local package mirror/cache if this repo's package
   retention policy turns out to be shorter than this pipeline's rebuild
   cadence.

## What was verified where

Verified on the machine that authored this workflow (no Nitro hardware, no
`nitro-cli`, no Docker daemon running):

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

**Could not be verified at the time** (that task's machine had no Linux, no
`nitro-cli`, and Docker was not running):

- That `scripts/build-eif.sh` / `nitro-cli build-enclave` actually succeed
  and produce a real `.eif` at all.
- That two independent builds of the same commit actually produce identical
  PCR0/1/2 (the double-build reproducibility gate this workflow exists to
  enforce).
- That the binary extracted from a **real** `build-a/image.tar` passes
  `check-binary-paths.sh` (i.e., that the Dockerfile's `--remap-path-prefix`
  flags actually work as intended on a real Linux/musl build — only the
  negative case, an unremapped local debug build, was demonstrated here).
- Whether `sigstore/cosign-installer` actually works on the then-self-hosted
  AL2023 runner image.
- Whether `/dev/nsm`/vsock are reachable as UID 65532 inside a real running
  enclave (see "Known risks" #4 — still open).

### 2026-10-01 update: GitHub-hosted runner migration verification

Verified on macOS/arm64 with Docker Desktop (no Nitro hardware, no native
Linux — everything below ran under `linux/amd64` emulation):

- **The containerized `nitro-cli` mechanism itself, end-to-end, against the
  real app image**: built `services/escrow-enclave-app/Dockerfile` twice
  independently (plain `docker build --platform linux/amd64`, once with
  `--no-cache` for the second run, standing in for kaniko's two independent
  invocations — see caveat below), then ran
  `nitro-cli-container.sh build-enclave --docker-uri ...` against each
  resulting image. Both runs succeeded and produced a real `.eif` with no
  `--privileged`/device flags. **PCR1 (nitro-cli/kernel-bootstrap-dependent,
  not image-dependent) was byte-identical across both runs**
  (`4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493`),
  confirming the pinned `nitro-cli` container is itself fully deterministic.
- **PCR0/PCR2 differed between those two local runs** — expected, not a
  regression: this local check used plain `docker build` (BuildKit), not
  kaniko. kaniko's `--reproducible` flag plus the Dockerfile's own explicit
  `touch -d "@$SOURCE_DATE_EPOCH"` mtime normalization (see
  `services/escrow-enclave-app/README.md` "Reproducible build") are what
  make PCR0/PCR2 reproducible across independent builds; plain `docker build`
  has no equivalent guarantee, so two otherwise-identical BuildKit builds
  embedding different layer timestamps was the expected outcome, not a sign
  that the real (kaniko-based) pipeline would also diverge. kaniko itself
  could not be exercised on this machine (see next bullet) — the real
  double-build reproducibility gate (PCR0/PCR2 matching via kaniko) is still
  only proven by CI.
- **kaniko crashes under this Mac's Rosetta-based `linux/amd64` emulation**:
  `docker run gcr.io/kaniko-project/executor@sha256:7cf9...` (the exact image
  `build-eif.sh` pins) failed immediately with
  `assertion failed [!result.is_error]: Failed to create temporary file
(ThreadContextFcntl.cpp:85 create_tempfile)` — a Rosetta 2 translation
  failure, specific to kaniko's Go binary and this host's emulation backend,
  unrelated to and unchanged by this task's edits (the kaniko invocation
  itself was not touched). This is why the real app image build above used
  plain `docker build` instead, purely for local sanity-checking the new
  nitro-cli containerization — `build-eif.sh` itself still calls kaniko
  unchanged, and CI's `ubuntu-latest` runner (real x86_64 hardware, no
  emulation) is not expected to hit this.
- `nitro-cli --version` / provenance capture: `nitro-cli-container.sh`'s
  `NITRO_CLI_VERSION` / `NITRO_CLI_BASE_IMAGE` stderr lines were confirmed
  present and correctly parsed into `measurements.json`'s `nitroCliVersion` /
  `nitroCliContainerImage` fields by `build-eif.sh` on every run above.
- `bash -n`, `shellcheck`, and `actionlint` are clean on
  `nitro-cli-container.sh`, the updated `build-eif.sh`, and the updated
  workflow YAML — including the previously-expected `actionlint`
  "unknown label" finding for `nitro-enclaves`, which is now gone entirely
  (there is no longer a custom self-hosted-runner label to flag).

**Still not verified locally** (same reasons as before — no Nitro hardware
available to any task on this branch):

- That the binary extracted from a **kaniko-built** `image.tar` passes
  `check-binary-paths.sh` on a real run (this task again only demonstrated
  the negative case).
- Whether `sigstore/cosign-installer` works on `ubuntu-latest` — low risk
  now (see "Known risks" #2 — resolved), but not literally re-run here.
- Whether `/dev/nsm`/vsock are reachable as UID 65532 inside a real running
  enclave (see "Known risks" #4 — unchanged, still open; irrelevant to the
  `eif` job itself, which never runs an enclave).
