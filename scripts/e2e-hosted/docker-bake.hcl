# Only the shared base exports a build cache: its `bun install` layer is stable
# across commits. Leaf targets rebuild from freshly copied source every run, so
# exporting their layers (mode=max) costs minutes of upload and never hits.
target "browser-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
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

target "browser-brain" {
  context    = "."
  dockerfile = "services/learn-card-network/brain-service/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["welibrary/lcn-brain-service"]
}

target "browser-cloud" {
  context    = "."
  dockerfile = "services/learn-card-network/learn-cloud-service/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["welibrary/lcn-cloud-service"]
}

target "browser-api" {
  context    = "."
  dockerfile = "services/learn-card-network/lca-api/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["lca-api-service"]
}

target "browser-delete" {
  context    = "services/playwright-delete-service"
  dockerfile = "Dockerfile"
  tags       = ["learn-card-e2e-delete-service"]
  cache-from = ["type=gha,scope=e2e-browser-delete"]
  cache-to   = ["type=gha,scope=e2e-browser-delete,mode=max"]
}

group "browser" {
  targets = [
    "browser-app",
    "browser-brain",
    "browser-cloud",
    "browser-api",
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
