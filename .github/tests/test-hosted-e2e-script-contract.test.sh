#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAYWRIGHT_CONFIG="$REPO_ROOT/apps/learn-card-app/playwright.config.ts"

grep -Fq "process.env.E2E_EXTERNAL_STACK === 'true'" "$PLAYWRIGHT_CONFIG" \
    || { echo 'explicit Playwright external-stack flag missing' >&2; exit 1; }
perl -0ne 'exit !/(?m)^\s*webServer:\s*useExternalE2EStack\s*\?\s*undefined\s*:/s' "$PLAYWRIGHT_CONFIG" \
    || { echo 'Playwright must disable its webServer only for external-stack mode' >&2; exit 1; }

BROWSER_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-browser.sh"
BAKE_FILE="$REPO_ROOT/scripts/e2e-hosted/docker-bake.hcl"
[[ -f "$BROWSER_SCRIPT" ]] || { echo 'hosted browser runner missing' >&2; exit 1; }
[[ -f "$BAKE_FILE" ]] || { echo 'hosted Buildx Bake definition missing' >&2; exit 1; }
DEFAULT_BROWSER_SPECS='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'
grep -Fq "E2E_TEST_FILES=\"\${E2E_TEST_FILES:-$DEFAULT_BROWSER_SPECS}\"" "$BROWSER_SCRIPT" \
    || { echo 'hosted browser defaults changed from the EC2 runner set' >&2; exit 1; }
grep -Fq 'docker buildx bake --file "$BAKE_FILE" browser --load --progress=plain' "$BROWSER_SCRIPT"
! grep -Eq 'docker build |docker compose build' "$BROWSER_SCRIPT" \
    || { echo 'browser runner must not bypass the GHA-backed Bake build' >&2; exit 1; }
grep -Fq 'docker compose up -d --no-build' "$BROWSER_SCRIPT"
grep -Fq 'E2E_EXTERNAL_STACK=true' "$BROWSER_SCRIPT"
[[ "$(grep -Ec '^[[:space:]]*playwright_command test.*test_files' "$BROWSER_SCRIPT")" -eq 1 ]] \
    || { echo 'browser runner must invoke Playwright exactly once' >&2; exit 1; }
perl -0ne 'exit !/run_playwright\(\).*?read -r -a test_files <<< "\$E2E_TEST_FILES".*?playwright_command test "\$\{test_files\[@\]\}"/s' "$BROWSER_SCRIPT" \
    || { echo 'Playwright must run only the selected browser specs' >&2; exit 1; }
perl -0ne 'exit !/run_accessibility\(\).*?playwright_command test accessibility.spec.ts --config=playwright.a11y.config.ts/s' "$BROWSER_SCRIPT" \
    || { echo 'accessibility suite invocation missing' >&2; exit 1; }
grep -Fq 'docker compose down --remove-orphans -v' "$BROWSER_SCRIPT"

SERVICE_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-service.sh"
grep -Fq 'docker buildx bake --file "$BAKE_FILE" service --load --progress=plain' "$SERVICE_SCRIPT"
grep -Fq 'docker compose up -d --no-build' "$SERVICE_SCRIPT"
! grep -Eq 'docker compose up .*--build' "$SERVICE_SCRIPT" \
    || { echo 'service runner must not bypass the GHA-backed Bake build' >&2; exit 1; }
grep -Fq 'E2E_MANAGE_DOCKER=false' "$SERVICE_SCRIPT"
grep -Fq 'nx run e2e:test:e2e' "$SERVICE_SCRIPT"
grep -Fq 'E2E_VITEST_ARGS' "$SERVICE_SCRIPT"
perl -0ne 'exit !/--shard=\$\{E2E_SHARD\}\/\$\{E2E_SHARD_TOTAL\}/s' "$SERVICE_SCRIPT" \
    || { echo 'service runner must forward the vitest shard' >&2; exit 1; }
grep -Fq 'vitest run $E2E_VITEST_ARGS' "$REPO_ROOT/tests/e2e/package.json" \
    || { echo 'tests/e2e test:e2e script must accept injected vitest args' >&2; exit 1; }
grep -Fq 'docker compose down --remove-orphans -v' "$SERVICE_SCRIPT"

BAKE_JSON="$(docker buildx bake --file "$BAKE_FILE" --print browser service)"
ruby -rjson -e '
  bake = JSON.parse(STDIN.read)
  required = %w[dependency-cache backend-dependency-cache browser-build-source browser-base browser-app browser-delete service-base]
  abort "Bake targets missing" unless (required - bake.fetch("target").keys).empty?
  dependency_cache = bake.fetch("target").fetch("dependency-cache")
  abort "dependency cache must stop before source COPY" unless dependency_cache.fetch("target") == "dependencies"
  abort "dependency cache must not load another image" unless dependency_cache.fetch("output") == [{"type" => "cacheonly"}]
  abort "dependency cache must exclude intermediate source layers" unless dependency_cache.fetch("cache-to").all? { |cache| cache["type"] == "gha" && cache["mode"] == "min" }
  backend_cache = bake.fetch("target").fetch("backend-dependency-cache")
  abort "backend cache must stop before source" unless backend_cache.fetch("target") == "backend-dependencies"
  abort "backend cache must not load another image" unless backend_cache.fetch("output") == [{"type" => "cacheonly"}]
  abort "backend cache must exclude intermediate source layers" unless backend_cache.fetch("cache-to").all? { |cache| cache["type"] == "gha" && cache["mode"] == "min" }
  backend_scope = backend_cache.fetch("cache-to").fetch(0).fetch("scope")
  %w[browser-base service-base].each do |name|
    target = bake.fetch("target").fetch(name)
    abort "#{name} must build the slim backend" unless target.fetch("target") == "backend"
    abort "#{name} must import backend dependencies" unless target.fetch("cache-from").any? { |cache| cache["type"] == "gha" && cache["scope"] == backend_scope }
    abort "#{name} must not export source layers" if target.key?("cache-to")
  end
  build_source = bake.fetch("target").fetch("browser-build-source")
  abort "app requires full source" unless build_source.fetch("target") == "source"
  abort "full build image must not be tagged or exported" if build_source.key?("tags") || build_source.key?("cache-to")
  abort "app must use the full build environment" unless bake.dig("target", "browser-app", "contexts", "learncard-monorepo-local") == "target:browser-build-source"
  abort "app must not export source layers" if bake.fetch("target").fetch("browser-app").key?("cache-to")
  %w[browser service].each do |group|
    abort "#{group} must export backend dependency cache" unless bake.fetch("group").fetch(group).fetch("targets").include?("backend-dependency-cache")
  end
  abort "browser must export build dependencies" unless bake.dig("group", "browser", "targets").include?("dependency-cache")
  abort "services must skip app build dependencies" if bake.dig("group", "service", "targets").include?("dependency-cache")
  browser_base_tags = bake.fetch("target").fetch("browser-base").fetch("tags")
  abort "browser base tag must match Compose" unless browser_base_tags.include?("learncard-monorepo-local")
' <<< "$BAKE_JSON"

ruby -ryaml -e '
  compose = YAML.load_file(ARGV.fetch(0), aliases: true).fetch("services")
  abort "app image name must be explicit" unless compose.dig("app", "image") == "learn-card-e2e-app"
  abort "delete-service image name must be explicit" unless compose.dig("delete-service", "image") == "learn-card-e2e-delete-service"
  commands = {
    "brain" => "cd services/learn-card-network/brain-service && bun run start:docker",
    "cloud" => "cd services/learn-card-network/learn-cloud-service && bun run start:docker",
    "api" => "cd services/learn-card-network/lca-api && bun run start:docker",
  }
  commands.each do |service, expected_command|
    abort "#{service} must reuse the monorepo base image" unless compose.dig(service, "image") == "learncard-monorepo-local"
    abort "#{service} must not trigger a duplicate image build" if compose.fetch(service).key?("build")
    abort "#{service} start command changed" unless compose.dig(service, "command") == "sh -c \"#{expected_command}\""
  end
' "$REPO_ROOT/apps/learn-card-app/compose.yaml"
grep -Fq '"learn-card-e2e-app"' "$BAKE_FILE" || { echo 'Bake app tag must match Compose' >&2; exit 1; }
grep -Fq '"learn-card-e2e-delete-service"' "$BAKE_FILE" || { echo 'Bake delete tag must match Compose' >&2; exit 1; }

echo 'Hosted E2E script contracts passed'
