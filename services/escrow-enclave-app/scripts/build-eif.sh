#!/usr/bin/env bash
# build-eif.sh — reproducible Docker build (kaniko) -> nitro-cli build-enclave
# -> measurements.json, for services/escrow-enclave-app (plan task P2.1).
#
# Usage:
#   build-eif.sh --out <dir> [--source-date-epoch <unix-seconds>]
#
# --source-date-epoch defaults to the last commit's author time
# (`git log -1 --format=%ct`), per plan task P2.1.
#
# Builder choice (kaniko, not `docker buildx build --output
# type=docker,rewrite-timestamp=true`): nitro-cli build-enclave itself
# requires a Docker daemon on the build host regardless (it inspects an
# image already loaded into `docker`), so kaniko's usual "no daemon needed"
# benefit only applies to the compile step, not this whole pipeline — but
# that's still a real benefit: the Rust/C compilation (arbitrary
# dependency build scripts, cc invocations) happens inside kaniko's
# unprivileged, single-purpose container rather than directly against the
# host's Docker daemon. This matches notepad decisions.md D8's
# recommendation and the plan task's own primary phrasing
# ("build-eif.sh (kaniko --reproducible -> nitro-cli build-enclave)").
# kaniko's --reproducible has a documented gap
# (GoogleContainerTools/kaniko#2304); the Dockerfile independently
# normalizes the mtimes of the two files that end up in the final image as
# defense in depth, so this pipeline's reproducibility does not solely
# depend on --reproducible working perfectly.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SERVICE_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

# gcr.io/kaniko-project/executor:v1.24.0, linux/amd64, resolved 2026-09-25
# via `docker buildx imagetools inspect gcr.io/kaniko-project/executor:v1.24.0`.
KANIKO_IMAGE="gcr.io/kaniko-project/executor@sha256:7cf94e02d5648080da34bec09de3a73326acde033cb2ca4f6fcd9ebefd6c1a6d"

OUT_DIR=""
SOURCE_DATE_EPOCH=""
ESCROW_TENANT="${ESCROW_TENANT:-}"
ESCROW_KEY_ID="${ESCROW_KEY_ID:-}"
ESCROW_KMS_REGION="${ESCROW_KMS_REGION:-}"
ESCROW_KMS_KEY_ARN="${ESCROW_KMS_KEY_ARN:-}"
ESCROW_PREVIOUS_KEY_IDS="${ESCROW_PREVIOUS_KEY_IDS:-}"
ESCROW_ALLOW_FIRST_BOOT="${ESCROW_ALLOW_FIRST_BOOT:-false}"

usage() {
    cat <<'EOF'
Usage: build-eif.sh --out <dir> [--source-date-epoch <unix-seconds>]
  --tenant <id> --key-id <id> --kms-region <region> --kms-key-arn <arn>
  [--previous-key-ids <comma-separated-ids>] [--allow-first-boot true|false]

The corresponding ESCROW_TENANT, ESCROW_KEY_ID, ESCROW_KMS_REGION,
ESCROW_KMS_KEY_ARN, ESCROW_PREVIOUS_KEY_IDS and ESCROW_ALLOW_FIRST_BOOT
environment variables may be used instead. These values are measured image config.

Builds services/escrow-enclave-app's Dockerfile reproducibly with kaniko,
loads the resulting image into the local Docker daemon, converts it to a
Nitro Enclave Image File (.eif) with `nitro-cli build-enclave`, and writes:

  <out>/escrow-enclave.eif   the enclave image file
  <out>/measurements.json    {pcr0, pcr1, pcr2, imageTag, sourceDateEpoch,
                               gitCommit, eifSha256}
  <out>/image.tar            the kaniko-built image, for inspection/reuse
  <out>/nitro-cli-stdout.log \ raw nitro-cli output, kept for debugging
  <out>/nitro-cli-stderr.log /

Requires: docker (running daemon), nitro-cli, jq, git, sha256sum.
--source-date-epoch defaults to `git log -1 --format=%ct` (last commit).

This script MUST run on Amazon Linux with aws-nitro-enclaves-cli installed
(nitro-cli is Linux-only and requires the Nitro Enclaves kernel driver) —
run it in CI, not on a developer laptop.
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --tenant) ESCROW_TENANT="${2:?missing tenant}"; shift 2 ;;
        --key-id) ESCROW_KEY_ID="${2:?missing key ID}"; shift 2 ;;
        --kms-region) ESCROW_KMS_REGION="${2:?missing region}"; shift 2 ;;
        --kms-key-arn) ESCROW_KMS_KEY_ARN="${2:?missing key ARN}"; shift 2 ;;
        --previous-key-ids) ESCROW_PREVIOUS_KEY_IDS="${2-}"; shift 2 ;;
        --allow-first-boot) ESCROW_ALLOW_FIRST_BOOT="${2:?missing boolean}"; shift 2 ;;
        --out)
            OUT_DIR="$2"
            shift 2
            ;;
        --source-date-epoch)
            SOURCE_DATE_EPOCH="$2"
            shift 2
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            echo "error: unknown argument: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

valid_id() { [[ "$1" =~ ^[A-Za-z0-9._-]{1,128}$ ]]; }
if ! valid_id "$ESCROW_TENANT" || [ "${#ESCROW_TENANT}" -gt 112 ] ||
   ! valid_id "$ESCROW_KEY_ID" ||
   ! [[ "$ESCROW_KMS_REGION" =~ ^[a-z]{2}(-[a-z]+)+-[0-9]+$ ]] ||
   [ "${#ESCROW_KMS_REGION}" -gt 64 ] ||
   ! [[ "$ESCROW_KMS_KEY_ARN" =~ ^arn:aws:kms:${ESCROW_KMS_REGION}:[0-9]{12}:key/[A-Za-z0-9-]+$ ]] ||
   ! [[ "$ESCROW_ALLOW_FIRST_BOOT" =~ ^(true|false)$ ]]; then
    echo "error: invalid or missing measured enclave configuration" >&2
    exit 1
fi
if [ -n "$ESCROW_PREVIOUS_KEY_IDS" ]; then
    IFS=',' read -r -a previous <<< "$ESCROW_PREVIOUS_KEY_IDS"
    if [ "${#previous[@]}" -gt 3 ] || [[ "$ESCROW_PREVIOUS_KEY_IDS" == *, ]]; then
        echo "error: invalid previous key IDs" >&2; exit 1
    fi
    seen=",${ESCROW_KEY_ID},"
    for id in "${previous[@]}"; do
        if ! valid_id "$id" || [[ "$seen" == *",${id},"* ]]; then
            echo "error: invalid or duplicate previous key ID" >&2; exit 1
        fi
        seen+="${id},"
    done
fi

if [ -z "${OUT_DIR}" ]; then
    echo "error: --out <dir> is required" >&2
    usage >&2
    exit 1
fi

for tool in docker jq git sha256sum; do
    if ! command -v "${tool}" >/dev/null 2>&1; then
        echo "error: required tool '${tool}' not found on PATH" >&2
        exit 1
    fi
done

if ! command -v nitro-cli >/dev/null 2>&1; then
    echo "error: nitro-cli not found. This script requires Amazon Linux with" >&2
    echo "aws-nitro-enclaves-cli; run in CI." >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "error: docker daemon is not reachable (nitro-cli build-enclave" >&2
    echo "requires a running Docker daemon to load the built image)" >&2
    exit 1
fi

mkdir -p "${OUT_DIR}"
OUT_DIR="$(cd -- "${OUT_DIR}" >/dev/null 2>&1 && pwd)"

if [ -z "${SOURCE_DATE_EPOCH}" ]; then
    SOURCE_DATE_EPOCH="$(git -C "${SERVICE_DIR}" log -1 --format=%ct)"
fi
if ! [[ "${SOURCE_DATE_EPOCH}" =~ ^[0-9]+$ ]]; then
    echo "error: --source-date-epoch must be a non-negative integer, got: ${SOURCE_DATE_EPOCH}" >&2
    exit 1
fi

GIT_COMMIT="$(git -C "${SERVICE_DIR}" rev-parse HEAD)"
GIT_SHORT="$(git -C "${SERVICE_DIR}" rev-parse --short=12 HEAD)"
IMAGE_TAG="escrow-enclave:${GIT_SHORT}"

echo "==> Building ${IMAGE_TAG} with kaniko (SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH})" >&2

docker run --rm \
    -v "${SERVICE_DIR}:/workspace:ro" \
    -v "${OUT_DIR}:/output" \
    "${KANIKO_IMAGE}" \
    --dockerfile=/workspace/Dockerfile \
    --context=dir:///workspace/ \
    --destination="${IMAGE_TAG}" \
    --no-push \
    --tar-path=/output/image.tar \
    --reproducible \
    --custom-platform=linux/amd64 \
    --build-arg="SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}" \
    --build-arg="ESCROW_TENANT=${ESCROW_TENANT}" \
    --build-arg="ESCROW_KEY_ID=${ESCROW_KEY_ID}" \
    --build-arg="ESCROW_KMS_REGION=${ESCROW_KMS_REGION}" \
    --build-arg="ESCROW_KMS_KEY_ARN=${ESCROW_KMS_KEY_ARN}" \
    --build-arg="ESCROW_PREVIOUS_KEY_IDS=${ESCROW_PREVIOUS_KEY_IDS}" \
    --build-arg="ESCROW_ALLOW_FIRST_BOOT=${ESCROW_ALLOW_FIRST_BOOT}"

echo "==> Loading built image into the local Docker daemon" >&2
docker load --input "${OUT_DIR}/image.tar"

EIF_PATH="${OUT_DIR}/escrow-enclave.eif"
rm -f "${EIF_PATH}"

NITRO_STDOUT="${OUT_DIR}/nitro-cli-stdout.log"
NITRO_STDERR="${OUT_DIR}/nitro-cli-stderr.log"

echo "==> Running nitro-cli build-enclave" >&2
# nitro-cli writes progress text ("Start building...", "Enclave Image
# successfully created.") and its final JSON result both to stdout in some
# versions; capture stdout/stderr separately and fall back to extracting
# from the first '{' if a direct `jq` parse of the whole stdout fails.
if ! nitro-cli build-enclave \
    --docker-uri "${IMAGE_TAG}" \
    --output-file "${EIF_PATH}" \
    >"${NITRO_STDOUT}" 2>"${NITRO_STDERR}"; then
    echo "error: nitro-cli build-enclave failed; see ${NITRO_STDOUT} / ${NITRO_STDERR}" >&2
    exit 1
fi

if PCR_JSON="$(jq -c '.Measurements' "${NITRO_STDOUT}" 2>/dev/null)"; then
    :
else
    echo "==> Direct JSON parse of nitro-cli stdout failed; retrying from first '{'" >&2
    PCR_JSON="$(sed -n '/^{/,$p' "${NITRO_STDOUT}" | jq -c '.Measurements')"
fi

if [ -z "${PCR_JSON}" ] || [ "${PCR_JSON}" = "null" ]; then
    echo "error: could not extract .Measurements from nitro-cli output (${NITRO_STDOUT})" >&2
    exit 1
fi

PCR0="$(jq -r '.PCR0' <<<"${PCR_JSON}")"
PCR1="$(jq -r '.PCR1' <<<"${PCR_JSON}")"
PCR2="$(jq -r '.PCR2' <<<"${PCR_JSON}")"

for name_val in "pcr0:${PCR0}" "pcr1:${PCR1}" "pcr2:${PCR2}"; do
    val="${name_val#*:}"
    if ! [[ "${val}" =~ ^[0-9a-fA-F]{96}$ ]]; then
        echo "error: ${name_val%%:*} is not a 96-hex-char SHA384 digest: '${val}'" >&2
        exit 1
    fi
done

EIF_SHA256="$(sha256sum "${EIF_PATH}" | cut -d' ' -f1)"

jq -n \
    --arg pcr0 "${PCR0}" \
    --arg pcr1 "${PCR1}" \
    --arg pcr2 "${PCR2}" \
    --arg imageTag "${IMAGE_TAG}" \
    --argjson sourceDateEpoch "${SOURCE_DATE_EPOCH}" \
    --arg gitCommit "${GIT_COMMIT}" \
    --arg eifSha256 "${EIF_SHA256}" \
    --arg tenant "$ESCROW_TENANT" --arg keyId "$ESCROW_KEY_ID" \
    --arg kmsRegion "$ESCROW_KMS_REGION" --arg kmsKeyArn "$ESCROW_KMS_KEY_ARN" \
    --arg previousKeyIds "$ESCROW_PREVIOUS_KEY_IDS" --argjson allowFirstBoot "$ESCROW_ALLOW_FIRST_BOOT" \
    '{pcr0: $pcr0, pcr1: $pcr1, pcr2: $pcr2, imageTag: $imageTag, sourceDateEpoch: $sourceDateEpoch, gitCommit: $gitCommit, eifSha256: $eifSha256, config: {tenant: $tenant, keyId: $keyId, kmsRegion: $kmsRegion, kmsKeyArn: $kmsKeyArn, previousKeyIds: ($previousKeyIds | split(",") | map(select(length > 0))), allowFirstBoot: $allowFirstBoot}}' \
    >"${OUT_DIR}/measurements.json"

echo "==> Wrote ${OUT_DIR}/measurements.json and ${EIF_PATH}" >&2
cat "${OUT_DIR}/measurements.json" >&2
