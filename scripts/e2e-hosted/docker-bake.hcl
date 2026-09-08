target "browser-base" {
  context    = "."
  dockerfile = "Dockerfile.monorepo"
  cache-from = ["type=gha,scope=e2e-browser-base"]
  cache-to   = ["type=gha,scope=e2e-browser-base,mode=max"]
}

target "browser-app" {
  context    = "."
  dockerfile = "apps/learn-card-app/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["learn-card-app-app"]
  cache-from = ["type=gha,scope=e2e-browser-app"]
  cache-to   = ["type=gha,scope=e2e-browser-app,mode=max"]
}

target "browser-brain" {
  context    = "."
  dockerfile = "services/learn-card-network/brain-service/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["welibrary/lcn-brain-service"]
  cache-from = ["type=gha,scope=e2e-browser-brain"]
  cache-to   = ["type=gha,scope=e2e-browser-brain,mode=max"]
}

target "browser-cloud" {
  context    = "."
  dockerfile = "services/learn-card-network/learn-cloud-service/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["welibrary/lcn-cloud-service"]
  cache-from = ["type=gha,scope=e2e-browser-cloud"]
  cache-to   = ["type=gha,scope=e2e-browser-cloud,mode=max"]
}

target "browser-api" {
  context    = "."
  dockerfile = "services/learn-card-network/lca-api/Dockerfile"
  contexts = {
    learncard-monorepo-local = "target:browser-base"
  }
  tags       = ["lca-api-service"]
  cache-from = ["type=gha,scope=e2e-browser-api"]
  cache-to   = ["type=gha,scope=e2e-browser-api,mode=max"]
}

target "browser-delete" {
  context    = "services/playwright-delete-service"
  dockerfile = "Dockerfile"
  tags       = ["learn-card-app-delete-service"]
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
  cache-from = ["type=gha,scope=e2e-service-base"]
  cache-to   = ["type=gha,scope=e2e-service-base,mode=max"]
}

group "service" {
  targets = ["service-base"]
}
