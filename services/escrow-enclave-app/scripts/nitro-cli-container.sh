#!/usr/bin/env bash
# nitro-cli-container.sh — runs `nitro-cli <args...>` inside the pinned
# Amazon Linux 2023 container (nitro-cli.Dockerfile), talking to the HOST's
# Docker daemon over its bind-mounted socket. This is what lets
# build-eif.sh (and therefore .github/workflows/escrow-enclave-eif.yml's
# `eif` job) run on a plain GitHub-hosted `ubuntu-latest` runner instead of
# a self-hosted Nitro-capable EC2 instance: `nitro-cli` itself is only
# packaged for Amazon Linux, but `build-enclave` needs no Nitro hardware or
# kernel driver to run — see nitro-cli.Dockerfile's header comment for the
# full citation/verification trail.
#
# Usage:
#   nitro-cli-container.sh <nitro-cli args...>
#
#   nitro-cli-container.sh build-enclave --docker-uri foo:bar --output-file /x/y.eif
#   nitro-cli-container.sh --version
#
# Any argument that is itself a filesystem path nitro-cli reads or writes
# (currently just --output-file, the only one build-eif.sh passes) has its
# *directory* bind-mounted read-write at the identical absolute path inside
# the container, so no host/container path translation is needed.
#
# Writes two provenance lines to stderr (interleaved with nitro-cli's own
# stderr, never its stdout, so callers that parse nitro-cli's JSON stdout
# are unaffected):
#   NITRO_CLI_VERSION: Nitro CLI x.y.z
#   NITRO_CLI_BASE_IMAGE: <pinned amazonlinux digest> + <pinned package NEVRA>
#
# Requires: docker (running daemon) on the host. Does NOT require nitro-cli,
# Amazon Linux, or the Nitro Enclaves kernel driver on the host itself.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Must match nitro-cli.Dockerfile's own pinned FROM/dnf-install lines — that
# Dockerfile is the single reviewable source of truth for the actual pin;
# this string is only an informational echo of it into measurements.json
# (via build-eif.sh, which greps the NITRO_CLI_BASE_IMAGE line below).
NITRO_CLI_BASE_IMAGE_DESC="amazonlinux:2023@sha256:2851878b108218cccbe7af6ab7dfb87a5883a725623384e19e6256f4072027a3 + aws-nitro-enclaves-cli(-devel)-1.5.0-0.amzn2023"
NITRO_CLI_BUILDER_TAG="escrow-nitro-cli-builder:al2023-1.5.0-0.amzn2023"

if [ "$#" -eq 0 ]; then
    echo "usage: nitro-cli-container.sh <nitro-cli args...>" >&2
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "error: docker not found on PATH" >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "error: docker daemon is not reachable" >&2
    exit 1
fi

echo "==> Building pinned nitro-cli container (${NITRO_CLI_BUILDER_TAG})" >&2
# --platform linux/amd64 always, matching the EIF's own target arch
# (build-eif.sh's kaniko invocation sets the same --custom-platform) —
# explicit rather than relying on host-arch inference, since this pin is a
# linux/amd64-only manifest digest regardless of the build host's arch.
docker build --quiet --platform linux/amd64 --tag "${NITRO_CLI_BUILDER_TAG}" \
    -f "${SCRIPT_DIR}/nitro-cli.Dockerfile" "${SCRIPT_DIR}" >&2

# Bind-mount the directory of any path-shaped argument at its own identical
# absolute path, so nitro-cli (running inside the container) can read/write
# it without any path translation. Only --output-file / --docker-dir are
# handled: both are always local filesystem paths per
# `nitro-cli build-enclave --help`. (--private-key is deliberately NOT
# included here even though it takes a path in some cases — it also accepts
# a bare KMS key ARN, which this directory-mount logic would mishandle, and
# build-eif.sh never passes it anyway.)
MOUNT_ARGS=()
PREV_ARG=""
for arg in "$@"; do
    case "${PREV_ARG}" in
        --output-file | --docker-dir)
            dir="$(cd -- "$(dirname -- "${arg}")" >/dev/null 2>&1 && pwd)"
            MOUNT_ARGS+=(-v "${dir}:${dir}")
            ;;
    esac
    PREV_ARG="${arg}"
done

echo "NITRO_CLI_BASE_IMAGE: ${NITRO_CLI_BASE_IMAGE_DESC}" >&2
NITRO_CLI_VERSION_OUTPUT="$(docker run --rm --platform linux/amd64 "${NITRO_CLI_BUILDER_TAG}" nitro-cli --version)"
echo "NITRO_CLI_VERSION: ${NITRO_CLI_VERSION_OUTPUT}" >&2

exec docker run --rm --platform linux/amd64 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    "${MOUNT_ARGS[@]}" \
    "${NITRO_CLI_BUILDER_TAG}" \
    nitro-cli "$@"
