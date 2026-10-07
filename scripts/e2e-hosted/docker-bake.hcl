# Export only the dependency stage. Exporting the source image with mode=max
# also uploads source-bearing intermediate layers that change on every commit.
# This cache-only target is shared by browser and service jobs.
target "dependency-cache" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "dependencies"
  output     = ["type=cacheonly"]
  cache-from = ["type=gha,scope=e2e-monorepo-dependencies"]
  cache-to   = ["type=gha,scope=e2e-monorepo-dependencies,mode=min"]
}

target "browser-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  tags       = ["learncard-monorepo-local"]
  cache-from = ["type=gha,scope=e2e-monorepo-dependencies"]
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
    "dependency-cache",
    "browser-base",
    "browser-app",
    "browser-delete",
  ]
}

target "service-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  tags       = ["learncard-monorepo-local", "lca-api-service"]
  cache-from = ["type=gha,scope=e2e-monorepo-dependencies"]
}

group "service" {
  targets = ["dependency-cache", "service-base"]
}
