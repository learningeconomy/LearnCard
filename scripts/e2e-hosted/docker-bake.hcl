# Export only the dependency stage. Exporting the source image with mode=max
# also uploads source-bearing intermediate layers that change on every commit.
# This cache-only target supplies the browser app build.
target "dependency-cache" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "dependencies"
  output     = ["type=cacheonly"]
  cache-from = ["type=gha,scope=e2e-monorepo-dependencies"]
  cache-to   = ["type=gha,scope=e2e-monorepo-dependencies,mode=min"]
}

# The app still needs the complete build environment, but it is never loaded.
target "browser-build-source" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "source"
  cache-from = ["type=gha,scope=e2e-monorepo-dependencies"]
}

# Cache only backend dependencies, never changing TypeScript source layers.
target "backend-dependency-cache" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "backend-dependencies"
  output     = ["type=cacheonly"]
  cache-from = ["type=gha,scope=e2e-backend-dependencies"]
  cache-to   = ["type=gha,scope=e2e-backend-dependencies,mode=min"]
}

target "browser-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "backend"
  tags       = ["learncard-monorepo-local"]
  cache-from = ["type=gha,scope=e2e-backend-dependencies"]
}

target "browser-app" {
  context    = "."
  dockerfile = "apps/learn-card-app/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-build-source"
  }
  tags       = ["learn-card-e2e-app"]
}

# The three backend containers run directly from the slim browser-base with Compose
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
    "backend-dependency-cache",
    "browser-base",
    "browser-app",
    "browser-delete",
  ]
}

target "service-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  target     = "backend"
  tags       = ["learncard-monorepo-local", "lca-api-service"]
  cache-from = ["type=gha,scope=e2e-backend-dependencies"]
}

group "service" {
  targets = ["backend-dependency-cache", "service-base"]
}

# Experiment: compile the SPA and SDK once on the host, then load only runtimes.
variable "E2E_BROWSER_RUNTIME_CONTEXT" {
  default = "/tmp/learncard-browser-runtime"
}

target "hosted-browser-app" {
  context    = E2E_BROWSER_RUNTIME_CONTEXT
  dockerfile = "Dockerfile"
  tags       = ["learn-card-e2e-app"]
}

group "hosted-browser-backend" {
  targets = ["backend-dependency-cache", "browser-base", "browser-delete"]
}
