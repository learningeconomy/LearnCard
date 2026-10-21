#!/usr/bin/env bash
# Export the checked-out source and regenerate without contacting any service.
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
CLIENT_ROOT="$ROOT/packages/open-api-lcn-clients"
OUTPUT="${1:-$CLIENT_ROOT/python-client}"
OUTPUT="$(realpath -ms "$OUTPUT")"
GENERATOR_IMAGE='openapitools/openapi-generator-cli@sha256:2ab0a9680222de65dc9d3baf861aa02b99e1b80c211d8221ebf3ae8f8a102524'
BUN_IMAGE='oven/bun@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4'

validate_output() {
    if [[ "$OUTPUT" != "$(realpath -m "$OUTPUT")" || -L "$OUTPUT" ]]; then
        echo 'Refusing a symlink output or symlinked parent' >&2
        exit 1
    fi
    if [[ "$OUTPUT" == / || "$ROOT/" == "$OUTPUT/"* || "$CLIENT_ROOT/" == "$OUTPUT/"* ]]; then
        echo 'Refusing to replace a repository root or its ancestor' >&2
        exit 1
    fi
    if [[ "$OUTPUT" != "$CLIENT_ROOT/"* ]]; then
        echo 'Output must be inside packages/open-api-lcn-clients' >&2
        exit 1
    fi
    if [[ "$OUTPUT" != "$CLIENT_ROOT/python-client" && -e "$OUTPUT" ]]; then
        echo 'Custom output must be a new temporary directory, not an existing target' >&2
        exit 1
    fi
    if [[ -e "$OUTPUT" && ! -d "$OUTPUT" ]]; then
        echo 'Refusing a non-directory output' >&2
        exit 1
    fi
}
validate_output

mkdir -p "$(dirname "$OUTPUT")"
STAGING="$(mktemp -d "$(dirname "$OUTPUT")/.python-client.XXXXXX")"
SCHEMA_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGING" "$SCHEMA_DIR"' EXIT

# Registry pulls are tool installation only. Both actual generation processes
# have no network, no host environment, and only read-only source/template mounts.
for image in "$BUN_IMAGE" "$GENERATOR_IMAGE"; do
    docker image inspect "$image" >/dev/null 2>&1 || docker pull "$image"
done

docker run --rm --network none --user "$(id -u):$(id -g)" \
    -v "$ROOT:/workspace:ro" -v "$SCHEMA_DIR:/schema" \
    -w /workspace/services/learn-card-network/brain-service "$BUN_IMAGE" \
    bun --conditions=development scripts/export-openapi.ts /schema/openapi.json

VERSION="$(docker run --rm --network none "$GENERATOR_IMAGE" version)"
[[ "$VERSION" == '7.25.0' ]] || { echo "Unexpected generator version: $VERSION" >&2; exit 1; }

docker run --rm --network none --user "$(id -u):$(id -g)" \
    -v "$SCHEMA_DIR/openapi.json:/schema/openapi.json:ro" \
    -v "$CLIENT_ROOT/templates/python:/templates:ro" -v "$STAGING:/output" \
    "$GENERATOR_IMAGE" generate -g python -i /schema/openapi.json \
    -t /templates -o /output --skip-validate-spec

# Keep these operations ordered: dependency post-processing must see all the
# generated metadata, and only then may nested GitHub metadata be discarded.
bash "$CLIENT_ROOT/apply-security-floors.sh" "$STAGING"
rm -rf "$STAGING/.github"

# Preserve the repository's formatting contract in generated inputs, not by
# hand-formatting output after every regeneration. bun.lock pins Prettier.
docker run --rm --network none --user "$(id -u):$(id -g)" \
    -v "$ROOT:/workspace:ro" -v "$STAGING:/output" -w /workspace "$BUN_IMAGE" \
    bun /workspace/node_modules/prettier/bin/prettier.cjs \
    --config /workspace/.prettierrc.json --ignore-path /workspace/.prettierignore \
    --write '/output/**/*.{md,json,yml,yaml}' /output/.travis.yml /output/.gitlab-ci.yml

# Tests and template sources live outside this generated output directory.
validate_output
rm -rf "$OUTPUT"
mv "$STAGING" "$OUTPUT"
echo "Generated Python client with OpenAPI Generator $VERSION from checked-out local source"
