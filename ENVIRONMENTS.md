# GitHub Environment Configuration

Quick-reference lookup table for all [GitHub Environment](https://github.com/learningeconomy/LearnCard/settings/environments) configurations used across the LearnCard monorepo.

Each deployment environment provides secrets and variables for four service tiers:

| Tier          | Directory                                          |
| ------------- | -------------------------------------------------- |
| Front-End App | `apps/`                                            |
| App API       | `services/learn-card-network/lca-api/`             |
| Network API   | `services/learn-card-network/brain-service/`       |
| Storage API   | `services/learn-card-network/learn-cloud-service/` |

---

## LearnCloud — Staging

| Service     | Environment                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Front-End   | [learn-card-app-staging](https://github.com/learningeconomy/LearnCard/settings/environments/11080533014/edit)         |
| App API     | [learn-card-app-api-staging](https://github.com/learningeconomy/LearnCard/settings/environments/10188248557/edit)     |
| Network API | [learn-cloud-network-api-staging](https://github.com/learningeconomy/LearnCard/settings/environments/7848738405/edit) |
| Storage API | [learn-cloud-storage-api-staging](https://github.com/learningeconomy/LearnCard/settings/environments/7848745280/edit) |

## LearnCloud — Production

| Service     | Environment                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Front-End   | [learn-card-app-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787842819/edit)          |
| App API     | [learn-card-app-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787971929/edit)      |
| Network API | [learn-cloud-network-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787989029/edit) |
| Storage API | [learn-cloud-storage-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787950341/edit) |

## Scouts — Production

| Service     | Environment                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Front-End   | [scout-app-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787853061/edit)         |
| App API     | [scout-app-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787980857/edit)     |
| Network API | [scout-network-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787992685/edit) |
| Storage API | [scout-storage-api-production](https://github.com/learningeconomy/LearnCard/settings/environments/7787959784/edit) |

## Other

| Environment                                                                                    | Purpose        |
| ---------------------------------------------------------------------------------------------- | -------------- |
| [ci-tests](https://github.com/learningeconomy/LearnCard/settings/environments/7846436359/edit) | CI test runner |

## Front-End (Netlify) Deploys

Front-end deploys (staging and production) run from CI (`.github/workflows/deploy.yml`,
`deploy-frontend` job) via the Netlify CLI (`netlify deploy --prod --no-build`) instead of
Netlify branch builds. Normal pushes to `main` deploy LearnCard staging and ScoutPass staging
(when their Nx project is affected); release pushes deploy LearnCard production; ScoutPass
production deploys only via the manual `scouts` dispatch. Each front-end GitHub Environment
must provide:

| Key                  | Type   | Purpose                                                          |
| -------------------- | ------ | ---------------------------------------------------------------- |
| `NETLIFY_SITE_ID`    | var    | Target Netlify site ID for that environment                      |
| `NETLIFY_AUTH_TOKEN` | secret | Netlify personal/team token with deploy rights (may be org-wide) |

Build-time configuration that previously lived in `netlify.toml` build contexts is now supplied
by CI. Scouts backend URLs (`LCN_URL`, `LCN_API_URL`, `CLOUD_URL`, `LEARN_CLOUD_XAPI_URL`,
`API_URL`) and `SENTRY_ENV` are **not** GitHub Environment vars — the deploy job resolves them
from the checked-in stage configs (`apps/scouts/environments/scoutpass/config[.<stage>].json`)
via `bun scripts/lc.ts stage-env <stage>`, the same resolution local dev uses. The stage is
baked into the deploy matrix (staging legs → `staging`, production → base `config.json`), and
unknown stages fail the build. `scout-app-staging` therefore only needs:

| Key             | Value (scout-app-staging) |
| --------------- | ------------------------- |
| `NODE_ENV`      | `production`              |
| `VITE_NODE_ENV` | `staging-scoutpass`       |
| `SENTRY_DSN`    | (Scouts Sentry DSN)       |

To change Scouts backend URLs, edit the stage config files — not GitHub settings.

Set `NETLIFY_SITE_ID` per environment (`learn-card-app-staging`, `learn-card-app-production`,
`scout-app-staging`, `scout-app-production`). The obsolete `NETLIFY_BRANCH` and
`DEPLOY_FORCE_PUSH` vars are no longer used and can be removed. On the Netlify side, disable
auto-publishing from git branches (`main`, `production`, `production-scouts`) so CI is the only
publisher; Deploy Previews may still be built by Netlify's git integration.

## AI Passport (Fly + Netlify) Deploys

AI Passport deploys run from `.github/workflows/deploy.yml` (`deploy-ai-passport-backend` and
`deploy-ai-passport-app` jobs). Until the cutover below, the AI-Passport repo's
`deploy-fly.yml` is still the live deployer, so **automatic legs stay off** unless the repo
variable `AIP_DEPLOY_ENABLED` is `true`. Manual dispatch (`deploy-ai-passport-backend` /
`deploy-ai-passport-app`, environment `staging` or `production`) works regardless.

| Trigger                     | Backend (Fly)                                                  | App (Netlify)                                      |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Push to `main`              | staging, when Nx marks `ai-passport-backend` affected          | staging, when `ai-passport` affected               |
| Release (`chore(release):`) | production, when `services/ai-passport-backend` version bumped | production, when `apps/ai-passport` version bumped |
| Manual dispatch             | staging or production                                          | staging or production                              |

Production backend fans out to the two Fly apps AI-Passport deployed: `ai-passport` and
`lca-backend` (`claude-ai-passport` is retired and isn't deployed). The app job waits for the
backend job and skips if it failed.

| Environment                          | Deploys                           |
| ------------------------------------ | --------------------------------- |
| `ai-passport-api-staging`            | Fly app named by `FLY_APP_NAME`   |
| `ai-passport-api-production`         | Fly app `ai-passport` (pinned)    |
| `ai-passport-lca-backend-production` | Fly app `lca-backend` (pinned)    |
| `ai-passport-app-staging`            | Netlify site in `NETLIFY_SITE_ID` |
| `ai-passport-app-production`         | Netlify site in `NETLIFY_SITE_ID` |

None of these environments exist yet, and neither does the staging Fly app, Mongo, Redis,
Qdrant, Bedrock role or Guardrail. Creating them is ops work; CI only deploys into them.

### Backend environments

| Key             | Type   | Purpose                                                                                                                               |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `FLY_API_TOKEN` | secret | App-scoped Fly deploy token for that environment's app: `fly tokens create deploy -a <app>`. One per environment, never an org token. |
| `FLY_APP_NAME`  | var    | Required for staging. Optional for production; if set it must match the pinned app.                                                   |

Production deploys exactly what AI-Passport did: `fly.toml` plus the app's existing Fly
secrets, no overrides. Runtime secrets (`SEED`, `JWT_SECRET`, `AI_PRIVACY_KEY`, `MONGO_URI`,
`REDIS_*`, `QDRANT_*`, `OPENAI_API_KEY`, `SENTRY_DSN`, ...) stay as Fly secrets on each app
(`fly secrets set -a <app>`), not GitHub secrets.

**Staging** would otherwise inherit production values: `fly.toml` hardcodes the production
`AWS_ROLE_ARN`, and the backend defaults `LEARNCARD_DID_WEB` / `LEARNCARD_CONTRACT_URI` to the
production DID and consent contract. So `ai-passport-api-staging` must set these vars, which CI
passes as `flyctl deploy --env` overrides. The job fails if one is missing or equals the
production value, or if `FLY_APP_NAME` is a production app.

| Var                             | Overrides                   | Value                                                                                          |
| ------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `AIP_LEARNCARD_DID_WEB`         | `LEARNCARD_DID_WEB`         | `did:web:staging.network.learncard.com:users:learn-cloud` (must resolve to the staging `SEED`) |
| `AIP_LEARNCARD_CONTRACT_URI`    | `LEARNCARD_CONTRACT_URI`    | `lc:network:staging.network.learncard.com/trpc:contract:9eade6a7-7181-4509-b805-d26e30a8f7f1`  |
| `AIP_AWS_ROLE_ARN`              | `AWS_ROLE_ARN`              | `arn:aws:iam::<account>:role/<staging-privacy-runtime>` (placeholder)                          |
| `AIP_BEDROCK_GUARDRAIL_ID`      | `BEDROCK_GUARDRAIL_ID`      | Staging Guardrail ID (placeholder)                                                             |
| `AIP_BEDROCK_GUARDRAIL_VERSION` | `BEDROCK_GUARDRAIL_VERSION` | Published numeric version (not `DRAFT`) (placeholder)                                          |
| `AIP_DOMAIN`                    | `DOMAIN`                    | Staging app origin                                                                             |
| `AIP_CORS_ORIGINS`              | `CORS_ORIGINS`              | Staging app origin(s)                                                                          |
| `AIP_LEARNCARD_NETWORK_URL`     | `LEARNCARD_NETWORK_URL`     | Optional; staging LearnCard Network tRPC URL (`https://staging.network.learncard.com/trpc`)    |
| `AIP_LEARNCARD_CLOUD_URL`       | `LEARNCARD_CLOUD_URL`       | Optional; staging LearnCloud URL (`https://staging.cloud.learncard.com/trpc`)                  |
| `AIP_LCA_URL`                   | `LCA_URL`                   | Optional; staging LearnCard app URL                                                            |

The staging `SEED` is a Fly secret on the staging app (`fly secrets set SEED=... -a <app>`),
never the production seed; its `did:web` is what goes in `AIP_LEARNCARD_DID_WEB`. The staging
consent contract (`9eade6a7-…`) was created on the staging network by `learn-cloud`, so the
staging `SEED` must be the one behind `did:web:staging.network.learncard.com:users:learn-cloud`.
The LearnCard app picks the matching contract from its network URL
(`packages/learn-card-base/src/constants/aiPassport.ts`), so staging builds need no extra var. Don't also set the Guardrail or role values as Fly secrets on the
staging app: a Fly secret with the same name takes precedence over `--env`, so the guard here would check one value while the app
ran another. The staging role's trust policy must allow the staging Fly app's OIDC identity.

### App environments

| Key                   | Type   | Purpose                                                                                                                                                                         |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NETLIFY_SITE_ID`     | var    | Target Netlify site for that environment                                                                                                                                        |
| `NETLIFY_AUTH_TOKEN`  | secret | Netlify token with deploy rights                                                                                                                                                |
| `PUBLIC_BACKEND_URL`  | var    | Backend origin baked into the build (staging: the staging Fly app)                                                                                                              |
| `PUBLIC_DOMAIN`       | var    | This site's origin                                                                                                                                                              |
| `PUBLIC_LCA_URL`      | var    | LearnCard app URL. Required for staging                                                                                                                                         |
| `PUBLIC_CONTRACT_URI` | var    | Consent contract. Required for staging, must match `AIP_LEARNCARD_CONTRACT_URI` (`lc:network:staging.network.learncard.com/trpc:contract:9eade6a7-7181-4509-b805-d26e30a8f7f1`) |

The Netlify site's base directory is `apps/ai-passport` (`apps/ai-passport/netlify.toml`).
Disable branch auto-publishing so CI is the only publisher; deploy previews can stay on
Netlify's git integration.

### Cutover order

1. Create the staging Fly app and its data stores, Bedrock role and Guardrail (ops).
2. Create the five GitHub Environments above with their tokens and vars.
3. Dry run: dispatch `deploy-ai-passport-backend` + `deploy-ai-passport-app` to `staging`.
4. Disable AI-Passport's `deploy-fly.yml` and its Netlify site link (AIP is frozen at the
   monorepo import), then set `AIP_DEPLOY_ENABLED=true`.
5. The next release that bumps `ai-passport-backend` / `ai-passport` deploys production from here.

`fly.mcp.toml` (the MCP server) was never deployed by AI-Passport CI and isn't deployed here.

## Environment Variables

For the shared Infisical workflow and generated `.env` files, see [environment-variables.md](./environment-variables.md).
