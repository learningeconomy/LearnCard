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
[[ "$(grep -Ec '^[[:space:]]*E2E_EXTERNAL_STACK=true[[:space:]]+bunx playwright test' "$BROWSER_SCRIPT")" -eq 1 ]] \
    || { echo 'browser runner must invoke Playwright exactly once' >&2; exit 1; }
perl -0ne 'exit !/run_playwright\(\).*?read -r -a test_files <<< "\$E2E_TEST_FILES".*?bunx playwright test "\$\{test_files\[@\]\}"/s' "$BROWSER_SCRIPT" \
    || { echo 'Playwright must run only the selected browser specs' >&2; exit 1; }
perl -0ne 'exit !/run_accessibility\(\).*?bun run test:a11y/s' "$BROWSER_SCRIPT" \
    || { echo 'accessibility suite invocation missing' >&2; exit 1; }
grep -Fq 'docker compose down --remove-orphans -v' "$BROWSER_SCRIPT"

SERVICE_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-service.sh"
grep -Fq 'docker buildx bake --file "$BAKE_FILE" service --load --progress=plain' "$SERVICE_SCRIPT"
grep -Fq 'docker compose up -d --no-build' "$SERVICE_SCRIPT"
! grep -Eq 'docker compose up .*--build' "$SERVICE_SCRIPT" \
    || { echo 'service runner must not bypass the GHA-backed Bake build' >&2; exit 1; }
grep -Fq 'E2E_MANAGE_DOCKER=false' "$SERVICE_SCRIPT"
grep -Fq 'nx run e2e:test:e2e' "$SERVICE_SCRIPT"
grep -Fq 'docker compose down --remove-orphans -v' "$SERVICE_SCRIPT"

BAKE_JSON="$(docker buildx bake --file "$BAKE_FILE" --print browser service)"
ruby -rjson -e '
  bake = JSON.parse(STDIN.read)
  required = %w[browser-base browser-app browser-brain browser-cloud browser-api browser-delete service-base]
  abort "Bake targets missing" unless (required - bake.fetch("target").keys).empty?
  required.each do |name|
    target = bake.fetch("target").fetch(name)
    abort "#{name} missing GHA cache import" unless target.fetch("cache-from").any? { |cache| cache["type"] == "gha" }
    abort "#{name} missing GHA cache export" unless target.fetch("cache-to").any? { |cache| cache["type"] == "gha" && cache["mode"] == "max" }
  end
  browser_scope = bake.fetch("target").fetch("browser-base").fetch("cache-to").fetch(0).fetch("scope")
  service_scope = bake.fetch("target").fetch("service-base").fetch("cache-to").fetch(0).fetch("scope")
  abort "identical monorepo bases must share one cache scope" unless browser_scope == service_scope
' <<< "$BAKE_JSON"

ruby -ryaml -e '
  compose = YAML.load_file(ARGV.fetch(0), aliases: true).fetch("services")
  abort "app image name must be explicit" unless compose.dig("app", "image") == "learn-card-e2e-app"
  abort "delete-service image name must be explicit" unless compose.dig("delete-service", "image") == "learn-card-e2e-delete-service"
' "$REPO_ROOT/apps/learn-card-app/compose.yaml"
grep -Fq '"learn-card-e2e-app"' "$BAKE_FILE" || { echo 'Bake app tag must match Compose' >&2; exit 1; }
grep -Fq '"learn-card-e2e-delete-service"' "$BAKE_FILE" || { echo 'Bake delete tag must match Compose' >&2; exit 1; }

echo 'Hosted E2E script contracts passed'
