# Only the shared base exports a build cache: its `bun install` layer is stable
# across commits. Leaf targets rebuild from freshly copied source every run, so
# exporting their layers (mode=max) costs minutes of upload and never hits.
target "browser-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  tags       = ["learncard-monorepo-local"]
  cache-from = ["type=gha,scope=e2e-monorepo-base"]
  cache-to   = ["type=gha,scope=e2e-monorepo-base,mode=max"]
}

target "browser-app" {
  context    = "."
  dockerfile = "apps/learn-card-app/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["learn-card-e2e-app"]
}

# The three backend containers run directly from browser-base with Compose
# command overrides. Their Dockerfiles only change WORKDIR/CMD, so building and
# exporting three additional copies of the monorepo image wastes several minutes.
target "browser-delete" {
  context    = "services/playwright-delete-service"
  dockerfile = "Dockerfile"
  tags       = ["learn-card-e2e-delete-service"]
  cache-from = ["type=gha,scope=e2e-browser-delete"]
  cache-to   = ["type=gha,scope=e2e-browser-delete,mode=max"]
}

group "browser" {
  targets = [
    "browser-base",
    "browser-app",
    "browser-delete",
  ]
}

target "service-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  tags       = ["learncard-monorepo-local", "lca-api-service"]
  cache-from = ["type=gha,scope=e2e-monorepo-base"]
  cache-to   = ["type=gha,scope=e2e-monorepo-base,mode=max"]
}

group "service" {
  targets = ["service-base"]
}
