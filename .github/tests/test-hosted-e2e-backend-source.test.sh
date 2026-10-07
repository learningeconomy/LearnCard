#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
mkdir -p "$TEST_ROOT/repo/packages" "$TEST_ROOT/output"
cd "$TEST_ROOT/repo"
cat > package.json <<'JSON'
{"workspaces":["packages/*"]}
JSON
for service in network-brain-service learn-cloud-service lca-api-service; do
    mkdir -p "packages/$service/src"
    printf '{"name":"@learncard/%s","dependencies":{"@fixture/shared":"workspace:*"},"devDependencies":{"@fixture/build-tool":"workspace:*"}}' "$service" > "packages/$service/package.json"
    echo 'service source' > "packages/$service/src/docker-entry.ts"
done
mkdir -p packages/shared/assets packages/shared/node_modules packages/build-tool/src packages/peer/src
cat > packages/shared/package.json <<'JSON'
{"name":"@fixture/shared","peerDependencies":{"@fixture/peer":"workspace:*"}}
JSON
printf '{"name":"@fixture/build-tool"}' > packages/build-tool/package.json
printf '{"name":"@fixture/peer"}' > packages/peer/package.json
echo 'required runtime asset' > packages/shared/assets/example.wasm
echo 'excluded installed dependency' > packages/shared/node_modules/sentinel
echo 'excluded secret' > packages/shared/.env.local
echo '{}' > tsconfig.node.json
bun "$REPO_ROOT/scripts/e2e-hosted/prepare-backend-source.mjs" "$TEST_ROOT/output"
for service in network-brain-service learn-cloud-service lca-api-service; do
    cmp "packages/$service/src/docker-entry.ts" "$TEST_ROOT/output/packages/$service/src/docker-entry.ts"
done
cmp packages/shared/assets/example.wasm "$TEST_ROOT/output/packages/shared/assets/example.wasm"
cmp tsconfig.node.json "$TEST_ROOT/output/tsconfig.node.json"
[[ -f "$TEST_ROOT/output/packages/peer/package.json" ]]
[[ ! -e "$TEST_ROOT/output/packages/build-tool" ]]
[[ ! -e "$TEST_ROOT/output/packages/shared/node_modules" ]]
[[ ! -e "$TEST_ROOT/output/packages/shared/.env.local" ]]
echo 'Hosted backend source selection passed'
