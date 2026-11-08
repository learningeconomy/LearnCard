# AI Passport MCP deploys

The `deploy-ai-passport-mcp` job in `.github/workflows/deploy.yml` ships `start:mcp`
(`Dockerfile.mcp`, `fly.mcp.toml`) to Fly. It is separate from the API legs, so the API and the
MCP host cut over independently.

## When it runs

| Trigger                                                                         | Leg                                                    | Gate                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| Every push to `main`                                                            | `ai-passport-mcp-staging`                              | repo var `MCP_DEPLOY_ENABLED=true` |
| Every release                                                                   | `ai-passport-mcp-production` (`mcp-learncard`, pinned) | repo var `MCP_DEPLOY_ENABLED=true` |
| Manual dispatch with `deploy-ai-passport-mcp`, target `staging` or `production` | same as above                                          | none (manual)                      |

With `MCP_DEPLOY_ENABLED` unset the job never runs on its own, so merging this doesn't race
whatever deploys `mcp-learncard` today.

MCP deliberately does not use the general Deploy run's affected/version baseline. Once explicitly
enabled, **every** main push deploys staging and every release deploys production. This conservative
catch-up policy trades extra deploys for correctness: successful flag-off runs cannot consume MCP
changes. No extra baseline state or force input is needed; after a disabled interval, the next
eligible event deploys the current snapshot (or use the existing manual input after approval).

## Per-Environment configuration

| Name              | Kind             | Purpose                                                                     |
| ----------------- | ---------------- | --------------------------------------------------------------------------- |
| `FLY_API_TOKEN`   | secret           | Deploy token scoped to the target app (`fly tokens create deploy -a <app>`) |
| `MCP_DOMAIN`      | var              | Passed as `DOMAIN`: the OAuth issuer (AI Passport API base URL)             |
| `MCP_SERVER_URL`  | var              | Passed as `MCP_SERVER_URL`: the protected-resource URL clients use          |
| `FLY_APP_NAME`    | var              | Staging only; production is pinned to `mcp-learncard`                       |
| `QDRANT_HOST`     | var, required    | Reachable Qdrant hostname only, no scheme/port/credentials; not localhost   |
| `QDRANT_PORT`     | var, required    | Explicit port 1..65535 (e.g. 6333, or 443 for hosted TLS)                   |
| `QDRANT_HTTPS`    | var, required    | Explicit `true` for TLS or `false` for private plaintext                    |
| `MCP_SMOKE_TOKEN` | secret, optional | Bearer token for a synthetic user; enables the authorized smoke checks      |

All non-optional configuration is required. The job rejects non-https/localhost OAuth URLs,
loopback or malformed Qdrant hosts, invalid Qdrant ports/TLS flags, and staging production targets.
It passes all Qdrant endpoint vars explicitly to Fly; the image contains no Qdrant service.

Preflight checks **names only**, never secret values, for boot configuration
`MONGO_URI SEED JWT_SECRET REDIS_HOST REDIS_PORT AI_PRIVACY_KEY`, plus
`AWS_ROLE_ARN AWS_WEB_IDENTITY_TOKEN_FILE` (Fly secrets or checked-in `[env]` names).
The latter must point to a real, maintained Fly web-identity token file with AWS trust for this app
and a role permitted to use the configured Bedrock models/guardrails. A role ARN by itself is not
credentials. The token-file secret stores the **path**, not a token. Provision/confirm the actual
file source and IAM OIDC trust separately before cutover; name presence cannot prove file existence,
STS trust, permissions, expiry, or Qdrant reachability. Do not substitute static keys or a Bedrock
API key: the deployed generation path uses web identity, and `AWS_BEARER_TOKEN_BEDROCK` is forbidden.

Fly secrets override `--env`. Any `DOMAIN`, `MCP_SERVER_URL`, `QDRANT_HOST`, `QDRANT_PORT`,
`QDRANT_HTTPS` secret blocks rollout, even if its value might match. Removal requires separate approval.
For authenticated Qdrant, provision `QDRANT_API_KEY` on Fly as required by that endpoint; never put it
in the hostname or GitHub vars. Name-only checks cannot determine whether a particular endpoint
requires authentication; confirm access separately before cutover.

## Post-deploy proof

Each deploy, in order (HTTP checks run against **both** the Fly hostname and client-facing `MCP_SERVER_URL`):

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

### Confirmed targets (Taylor)

- Fly app: existing `mcp-learncard`
- `MCP_SERVER_URL` (resource): `https://mcp.learncard.ai/`
- `MCP_DOMAIN` (issuer): `https://api.learncloud.ai/`

`MCP_DEPLOY_ENABLED` stays off. It is not a cutover step; cutover is the manual run below.

### Required to boot and cut over

1. Freeze or retire the current deployer of `mcp-learncard` so two pipelines don't compete.
2. Create GitHub Environment `ai-passport-mcp-production` with secret `FLY_API_TOKEN` (deploy
   token scoped to `mcp-learncard`) and vars `MCP_DOMAIN` and `MCP_SERVER_URL` set to the confirmed targets.
3. Add the `AI_PRIVACY_KEY` Fly secret to `mcp-learncard`; the current server exits on boot
   without it, and the app doesn't have it today.
4. Resolve the `DOMAIN` and `MCP_SERVER_URL` Fly secrets on `mcp-learncard`: they override the
   deploy's `--env`, so their presence must be removed under separate approval before rollout; matching values are not an exception.

5. Configure the required `QDRANT_HOST`, `QDRANT_PORT`, `QDRANT_HTTPS` Environment vars and
   confirm the app can reach that service; add Fly `QDRANT_API_KEY` if that service requires it.
   Remove any shadowing Qdrant endpoint secrets under separate approval.
6. Provision/confirm Fly web identity: a maintained token file, `AWS_WEB_IDENTITY_TOKEN_FILE`
   path configured on the app, `AWS_ROLE_ARN`, and matching AWS OIDC trust and Bedrock permissions.
   Role ARN alone is insufficient; name-only preflight is not an authentication proof.

**All live prerequisite changes, legacy-deployer freeze, and deployment remain held pending Taylor's
explicit approval. Target confirmation is preparation only, not cutover authorization.**

After that approval, run Deploy manually: target `production`, only `deploy-ai-passport-mcp` checked, and confirm
every smoke step passes and an MCP client can sign in and list tools.

### Optional

- Staging: a staging Fly app and `ai-passport-mcp-staging` Environment (`FLY_APP_NAME`,
  `FLY_API_TOKEN`, `MCP_DOMAIN`, `MCP_SERVER_URL`).
- The `mcp.learncloud.ai` alias: its Fly cert is "Not verified"; fix DNS or drop it.
- `MCP_SMOKE_TOKEN` secret to enable the authorized `tools/list` and `get_user_context` checks.
- Later, separately from cutover and only if Taylor decides: set repo var `MCP_DEPLOY_ENABLED=true`
  for automatic deploys after the first manual run passes. Without a staging Environment, pushes
  to main would then select a staging leg that fails on missing config.
- VM size: `fly.mcp.toml` asks for 2 shared CPUs; live machines run 1, so the first deploy resizes them.

## Rollback

- Stop automatic deploys: unset `MCP_DEPLOY_ENABLED` (manual dispatch still works).
- Roll back the app to the previous image: `fly releases -a mcp-learncard --image` to find it,
  then `fly deploy -a mcp-learncard --config services/ai-passport-backend/fly.mcp.toml --image <previous image>`.
- Or re-run Deploy manually from the last good commit.
- If the URLs were wrong, fix the Environment vars and redeploy; the smoke step reports what the
  server actually served.
