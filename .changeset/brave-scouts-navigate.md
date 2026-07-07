---
'scoutpass-app': patch
---

Add tenant/stage environment support to the ScoutPass lc CLI (LC-1943)

- New `environments/scoutpass/` config with a base (production) config and a `local` stage overlay, mirroring learn-card-app's environments schema
- `bun run lc dev|start|docker-start` accept an optional stage arg and inject the resolved env (LCN_URL, LCN_API_URL, CLOUD_URL, LEARN_CLOUD_XAPI_URL, API_URL, SENTRY_ENV); dev commands default to the `local` stage
- New `bun run lc resolve [stage]` prints the merged config and the env vars that would be injected
- compose.yaml / compose-local.yaml env now uses `${VAR:-default}` substitution so lc-injected env flows through while bare `docker compose up` keeps today's defaults
