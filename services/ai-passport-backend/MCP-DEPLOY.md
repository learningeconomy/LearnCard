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

1. Create Environment `ai-passport-mcp-production` with the values above. Add required reviewers
   if production deploys should wait for approval.
2. Retire or freeze the current deployer of `mcp-learncard` so two pipelines don't compete.
3. Run Deploy manually: target `production`, only `deploy-ai-passport-mcp` checked. Confirm every
   smoke step passes and an MCP client (Claude, ChatGPT) can sign in and list tools.
4. Optional staging: create a staging Fly app and `ai-passport-mcp-staging` Environment.
   Until then, keep `MCP_DEPLOY_ENABLED` off, because pushes to main would select a staging leg
   that fails on missing config.
5. Set repo var `MCP_DEPLOY_ENABLED=true` to turn on automatic legs.

## Rollback

- Stop automatic deploys: unset `MCP_DEPLOY_ENABLED` (manual dispatch still works).
- Roll back the app to the previous image: `fly releases -a mcp-learncard --image` to find it,
  then `fly deploy -a mcp-learncard --config services/ai-passport-backend/fly.mcp.toml --image <previous image>`.
- Or re-run Deploy manually from the last good commit.
- If the URLs were wrong, fix the Environment vars and redeploy; the smoke step reports what the
  server actually served.
