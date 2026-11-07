# AI Passport MCP deploys

The `deploy-ai-passport-mcp` job in `.github/workflows/deploy.yml` ships `start:mcp`
(`Dockerfile.mcp`, `fly.mcp.toml`) to Fly. It is separate from the API legs, so the API and the
MCP host cut over independently.

## When it runs

| Trigger                                                                                                  | Leg                                                    | Gate                               |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| Push to `main` where Nx marks `ai-passport-backend` affected (MCP server, `@learncard/mcp`, shared core) | `ai-passport-mcp-staging`                              | repo var `MCP_DEPLOY_ENABLED=true` |
| Release where `ai-passport-backend`'s version changed                                                    | `ai-passport-mcp-production` (`mcp-learncard`, pinned) | repo var `MCP_DEPLOY_ENABLED=true` |
| Manual dispatch with `deploy-ai-passport-mcp`, target `staging` or `production`                          | same as above                                          | none (manual)                      |

With `MCP_DEPLOY_ENABLED` unset the job never runs on its own, so merging this doesn't race
whatever deploys `mcp-learncard` today.

## Per-Environment configuration

| Name              | Kind             | Purpose                                                                     |
| ----------------- | ---------------- | --------------------------------------------------------------------------- |
| `FLY_API_TOKEN`   | secret           | Deploy token scoped to the target app (`fly tokens create deploy -a <app>`) |
| `MCP_DOMAIN`      | var              | Passed as `DOMAIN`: the OAuth issuer (AI Passport API base URL)             |
| `MCP_SERVER_URL`  | var              | Passed as `MCP_SERVER_URL`: the protected-resource URL clients use          |
| `FLY_APP_NAME`    | var              | Staging only; production is pinned to `mcp-learncard`                       |
| `MCP_SMOKE_TOKEN` | secret, optional | Bearer token for a synthetic user; enables the authorized smoke checks      |

The job refuses to deploy without these, rejects non-https or localhost URLs, and refuses staging
legs that point at a production app or the production resource URL. It also checks the Fly app
holds the secrets `start:mcp` needs to boot (`MONGO_URI SEED JWT_SECRET REDIS_HOST REDIS_PORT
AI_PRIVACY_KEY`), by name only. Fly secrets override `--env`, so a `DOMAIN` or `MCP_SERVER_URL`
Fly secret shadows the Environment vars; the job warns, and the smoke step fails if the served
values differ.

## Post-deploy proof

Each deploy, in order:

1. Machines on the app all run image label `$GITHUB_SHA` (`flyctl machines list`).
2. `/.well-known/oauth-protected-resource`: `resource` equals `MCP_SERVER_URL` and the first
   `authorization_servers` entry equals `MCP_DOMAIN`.
3. `/.well-known/oauth-authorization-server`: `issuer` equals `MCP_DOMAIN`.
4. Unauthenticated `tools/list` returns 401.
5. With `MCP_SMOKE_TOKEN`: authorized `tools/list` includes `get_user_context`, and calling it
   (read-only) returns a result rather than its backend-failure fallback. Without the token, these
   checks are skipped with a warning.

Run the same checks by hand:

```sh
MCP_BASE_URL=https://mcp-learncard.fly.dev \
EXPECTED_ISSUER=<MCP_DOMAIN> EXPECTED_RESOURCE=<MCP_SERVER_URL> \
MCP_SMOKE_TOKEN=<optional> services/ai-passport-backend/scripts/smoke-mcp.sh
```

## Rollout

### Required to boot and cut over

1. Freeze or retire the current deployer of `mcp-learncard` so two pipelines don't compete.
2. Create GitHub Environment `ai-passport-mcp-production` with secret `FLY_API_TOKEN` (deploy
   token scoped to `mcp-learncard`) and vars `MCP_DOMAIN` and `MCP_SERVER_URL`.
3. Add the `AI_PRIVACY_KEY` Fly secret to `mcp-learncard`; the current server exits on boot
   without it, and the app doesn't have it today.
4. Resolve the `DOMAIN` and `MCP_SERVER_URL` Fly secrets on `mcp-learncard`: they override the
   deploy's `--env`, so remove them or keep them equal to the Environment vars.
5. Taylor confirms the production target: app `mcp-learncard`, issuer (live today
   `https://api.learncloud.ai/`) and resource URL (live today `https://mcp.learncard.ai/`).

Then run Deploy manually: target `production`, only `deploy-ai-passport-mcp` checked, and confirm
every smoke step passes and an MCP client can sign in and list tools.

### Optional

- Staging: a staging Fly app and `ai-passport-mcp-staging` Environment (`FLY_APP_NAME`,
  `FLY_API_TOKEN`, `MCP_DOMAIN`, `MCP_SERVER_URL`).
- The `mcp.learncloud.ai` alias: its Fly cert is "Not verified"; fix DNS or drop it.
- `MCP_SMOKE_TOKEN` secret to enable the authorized `tools/list` and `get_user_context` checks.
- Set repo var `MCP_DEPLOY_ENABLED=true` for automatic deploys after the first manual run passes.
  Without a staging Environment, pushes to main would then select a staging leg that fails on
  missing config.
- VM size: `fly.mcp.toml` asks for 2 shared CPUs; live machines run 1, so the first deploy resizes them.

## Rollback

- Stop automatic deploys: unset `MCP_DEPLOY_ENABLED` (manual dispatch still works).
- Roll back the app to the previous image: `fly releases -a mcp-learncard --image` to find it,
  then `fly deploy -a mcp-learncard --config services/ai-passport-backend/fly.mcp.toml --image <previous image>`.
- Or re-run Deploy manually from the last good commit.
- If the URLs were wrong, fix the Environment vars and redeploy; the smoke step reports what the
  server actually served.
