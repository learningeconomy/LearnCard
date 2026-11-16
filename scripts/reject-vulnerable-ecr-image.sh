#!/usr/bin/env bash
# Start a basic ECR scan on the pushed linux/arm64 image digest, wait for it,
# and reject the image if it has CRITICAL or HIGH findings.
#
# Buildx tags an OCI index (image + attestation) even for a single platform.
# ECR basic scan-on-push cannot scan that index, so the child ARM64 digest
# often has no scan record unless we call start-image-scan ourselves.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  reject-vulnerable-ecr-image.sh --repository-url URL --image-tag TAG
  reject-vulnerable-ecr-image.sh --repository-name NAME --digest DIGEST
EOF
}

REPOSITORY_URL="${ECR_REPOSITORY_URL:-}"
REPOSITORY_NAME=""
IMAGE_TAG=""
IMAGE_DIGEST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repository-url)
      REPOSITORY_URL="${2:-}"
      shift 2
      ;;
    --repository-name)
      REPOSITORY_NAME="${2:-}"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="${2:-}"
      shift 2
      ;;
    --digest)
      IMAGE_DIGEST="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "::error::Unknown argument: $1"
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$REPOSITORY_NAME" ]]; then
  if [[ -z "$REPOSITORY_URL" ]]; then
    echo "::error::Pass --repository-name or --repository-url"
    exit 1
  fi
  REPOSITORY_NAME="${REPOSITORY_URL#*/}"
fi

if [[ -z "$IMAGE_DIGEST" ]]; then
  if [[ -z "$REPOSITORY_URL" || -z "$IMAGE_TAG" ]]; then
    echo "::error::Pass --digest, or both --repository-url and --image-tag"
    exit 1
  fi

  IMAGE_REF="${REPOSITORY_URL}:${IMAGE_TAG}"
  RAW="$(docker buildx imagetools inspect "$IMAGE_REF" --raw)"

  if jq -e 'type == "object" and (.manifests | type == "array")' >/dev/null <<<"$RAW"; then
    IMAGE_DIGEST="$(jq -r '
      .manifests[]
      | select(.platform.os == "linux" and .platform.architecture == "arm64")
      | .digest
    ' <<<"$RAW" | head -n 1)"
    if [[ -z "$IMAGE_DIGEST" || "$IMAGE_DIGEST" == "null" ]]; then
      echo "::error::Could not resolve the pushed ARM64 image digest from ${IMAGE_REF}"
      echo "::error::Basic ECR scanning cannot scan a manifest list or OCI index; the gate needs the linux/arm64 child digest."
      exit 1
    fi
  else
    IMAGE_DIGEST="$(docker buildx imagetools inspect "$IMAGE_REF" --format '{{.Digest}}')"
    if [[ -z "$IMAGE_DIGEST" ]]; then
      echo "::error::Could not resolve the image digest for ${IMAGE_REF}"
      exit 1
    fi
  fi
fi

echo "Using ECR repository ${REPOSITORY_NAME} image digest ${IMAGE_DIGEST}"

set +e
START_OUTPUT="$(aws ecr start-image-scan \
  --repository-name "$REPOSITORY_NAME" \
  --image-id "imageDigest=${IMAGE_DIGEST}" 2>&1)"
START_STATUS=$?
set -e

if [[ "$START_STATUS" -ne 0 ]]; then
  if grep -Eqi 'LimitExceededException|already been scanned|already in progress|ScanInProgress' <<<"$START_OUTPUT"; then
    echo "ECR reported an existing or in-progress scan; waiting for results."
  elif grep -Eqi 'enhanced scanning|UnsupportedCommandException' <<<"$START_OUTPUT"; then
    echo "start-image-scan is not supported here (likely Enhanced/Inspector scanning); waiting for scan findings."
  else
    echo "::error::Could not start an ECR image scan for ${IMAGE_DIGEST} in ${REPOSITORY_NAME}."
    printf '%s\n' "$START_OUTPUT"
    if grep -Eqi 'AccessDenied|UnauthorizedOperation' <<<"$START_OUTPUT"; then
      echo "::error::The deploy role needs ecr:StartImageScan on this repository. The service template grants it to learncard-ai-agent-github-deploy, but that policy only applies after a CloudFormation stack update."
    elif grep -Eqi 'UnsupportedImageTypeException|unsupported image' <<<"$START_OUTPUT"; then
      echo "::error::ECR cannot scan this digest. If it is a manifest list or OCI index, use the linux/arm64 image digest instead."
    fi
    exit 1
  fi
else
  echo "Started ECR image scan for ${IMAGE_DIGEST}"
fi

set +e
WAIT_OUTPUT="$(aws ecr wait image-scan-complete \
  --repository-name "$REPOSITORY_NAME" \
  --image-id "imageDigest=${IMAGE_DIGEST}" 2>&1)"
WAIT_STATUS=$?
set -e

if [[ "$WAIT_STATUS" -ne 0 ]]; then
  echo "::error::ECR image scan did not complete for ${IMAGE_DIGEST} in ${REPOSITORY_NAME}."
  printf '%s\n' "$WAIT_OUTPUT"
  if grep -Fq 'ScanNotFoundException' <<<"$WAIT_OUTPUT"; then
    echo "::error::No scan exists for this digest. The gate starts a basic scan on the linux/arm64 image digest because scan-on-push often attaches to the tagged OCI index, which basic scanning cannot scan."
  fi
  exit 1
fi

FINDINGS="$(aws ecr describe-image-scan-findings \
  --repository-name "$REPOSITORY_NAME" \
  --image-id "imageDigest=${IMAGE_DIGEST}" \
  --query imageScanFindings.findingSeverityCounts \
  --output json)"
CRITICAL_FINDINGS="$(jq -r '.CRITICAL // 0' <<<"${FINDINGS:-null}")"
HIGH_FINDINGS="$(jq -r '.HIGH // 0' <<<"${FINDINGS:-null}")"

if (( CRITICAL_FINDINGS > 0 || HIGH_FINDINGS > 0 )); then
  echo "::error::ARM64 runtime image has ${CRITICAL_FINDINGS} critical and ${HIGH_FINDINGS} high findings"
  exit 1
fi

echo "ARM64 runtime image has no critical or high findings"
