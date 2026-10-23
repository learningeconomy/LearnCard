# syntax=docker/dockerfile:1
#
# nitro-cli.Dockerfile — throwaway CI tooling container that runs
# `nitro-cli` (P2.2's GitHub-hosted-runner EIF pipeline; see
# nitro-cli-container.sh, which builds and runs this image, and
# ../../.github/workflows/escrow-enclave-eif.yml's `eif` job, which no
# longer needs a self-hosted Nitro-capable runner because of it).
#
# This image is NEVER the measured enclave image — that is
# ../Dockerfile, built reproducibly by build-eif.sh and converted to a
# `.eif` by the nitro-cli this container runs. This Dockerfile's own
# content (Amazon Linux base, installed packages) has no effect on
# PCR0/1/2: it is build tooling, not application image content.
#
# Why this is safe to run on a plain GitHub-hosted `ubuntu-latest` runner
# (no self-hosted Nitro-capable EC2 instance, no /dev/nitro_enclaves):
# `nitro-cli build-enclave` does not require the Nitro Enclaves kernel
# driver or Nitro-capable hardware at all — AWS documents building EIFs
# "on any Linux environment, including outside of AWS" (only
# `run-enclave`/`describe-enclaves`, i.e. actually launching an enclave,
# need real Nitro hardware):
#   https://docs.aws.amazon.com/enclaves/latest/user/cmd-nitro-build-enclave.html
# Confirmed by reading aws/aws-nitro-enclaves-cli's own source
# (`src/lib.rs`'s `build_enclaves()` never touches `/dev/nitro_enclaves`;
# that only happens in `enclave_proc/resource_manager.rs`, used by
# `run-enclave`) and verified empirically on 2026-10-01 against this exact
# pinned image on a non-Nitro host (macOS/arm64, Docker Desktop,
# linux/amd64 via QEMU emulation): `nitro-cli build-enclave` against a
# throwaway image succeeded with no `--privileged`/device flags, and two
# independent invocations produced byte-identical PCR0/1/2.
#
# nitro-cli talks to Docker through an embedded Rust API client (bollard)
# over the Docker socket, not the `docker` CLI binary — confirmed by
# reading aws/aws-nitro-enclaves-cli's `enclave_build/src/docker.rs`
# (default endpoint `unix:///var/run/docker.sock`, honors `DOCKER_HOST`).
# nitro-cli-container.sh therefore only bind-mounts the HOST's Docker
# socket into this container; the app image itself is never rebuilt or
# re-pulled here, only read from the daemon nitro-cli-container.sh's
# caller already `docker load`ed it into. (The `aws-nitro-enclaves-cli`
# RPM's spec still lists `Requires: docker`, so a Docker Engine package
# lands in this image regardless, as an unused side effect of the
# dependency chain — it is not relied upon.)
#
# Base pinned by digest — the linux/amd64 platform manifest (not the
# multi-arch index), resolved via
#   docker buildx imagetools inspect amazonlinux:2023
# on 2026-10-01:
#   amazonlinux:2023
#     multi-arch index digest:     sha256:5b29412077a463b4a3a8fbc99a8cdf4b929f38a3ecc8dac10328d8f36b0099b8
#     linux/amd64 manifest digest: sha256:2851878b108218cccbe7af6ab7dfb87a5883a725623384e19e6256f4072027a3  (pinned below)
FROM amazonlinux:2023@sha256:2851878b108218cccbe7af6ab7dfb87a5883a725623384e19e6256f4072027a3

# Exact NEVRA, resolved 2026-10-01 via:
#   dnf repoquery --qf '%{name}-%{version}-%{release}.%{arch}' \
#       aws-nitro-enclaves-cli aws-nitro-enclaves-cli-devel
# against the pinned base image above (latest version available in the
# AL2023 repo at that time: 1.5.0-0.amzn2023). PCR1 (the enclave's Linux
# kernel + bootstrap/init ramfs measurement) comes from nitro-cli's own
# bundled blobs (installed under /usr/share/nitro_enclaves/blobs by the
# `-devel` package below, not from this Dockerfile) — two otherwise
# byte-identical app images converted with two different nitro-cli
# versions produce different PCR1 values. Pinning this exact package
# version (not "latest") is required for PCR1 reproducibility across CI
# runs over time. See ../README.md "Reproducible build" -> "What makes
# PCR0/1/2 change".
#
# `-devel` is NOT optional here despite its name: for this package it
# ships the kernel/initrd/LinuxKit blobs `build-enclave` reads directly
# (confirmed via the aws-nitro-enclaves-cli RPM spec's `%files devel`
# section), not merely headers for linking against the NSM library.
RUN dnf install -y --setopt=install_weak_deps=False \
        aws-nitro-enclaves-cli-1.5.0-0.amzn2023 \
        aws-nitro-enclaves-cli-devel-1.5.0-0.amzn2023 \
    && dnf clean all
