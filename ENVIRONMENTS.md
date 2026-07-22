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

| Environment                                                                                                 | Purpose            |
| ----------------------------------------------------------------------------------------------------------- | ------------------ |
| [ci-tests](https://github.com/learningeconomy/LearnCard/settings/environments/7846436359/edit)              | CI test runner     |
| [learn-card-discord-bot](https://github.com/learningeconomy/LearnCard/settings/environments/686767981/edit) | Discord bot deploy |

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

Build-time configuration that previously lived in `netlify.toml` build contexts must now be set
as GitHub Environment vars, since CI runs the build. In particular `scout-app-staging` needs the
full set the old `[context.main]` supplied:

| Key                    | Value (scout-app-staging)                     |
| ---------------------- | --------------------------------------------- |
| `NODE_ENV`             | `production`                                  |
| `VITE_NODE_ENV`        | `staging-scoutpass`                           |
| `SENTRY_ENV`           | `scouts-staging`                              |
| `SENTRY_DSN`           | (Scouts Sentry DSN)                           |
| `LCN_URL`              | `https://staging.scoutnetwork.org/trpc`       |
| `LCN_API_URL`          | `https://staging.scoutnetwork.org/api`        |
| `CLOUD_URL`            | `https://staging.cloud.scoutnetwork.org/trpc` |
| `LEARN_CLOUD_XAPI_URL` | `https://staging.cloud.scoutnetwork.org/xapi` |
| `API_URL`              | `https://staging.api.scoutnetwork.org/trpc`   |

The five URL vars are Scouts Vite build defines (`apps/scouts/vite.config.ts`). **If left unset,
the build silently falls back to production ScoutPass endpoints** (`Networks.ts`), so a staging
site would read/write production data. Production environments leave them unset on purpose.

Set `NETLIFY_SITE_ID` per environment (`learn-card-app-staging`, `learn-card-app-production`,
`scout-app-staging`, `scout-app-production`). The obsolete `NETLIFY_BRANCH` and
`DEPLOY_FORCE_PUSH` vars are no longer used and can be removed. On the Netlify side, disable
auto-publishing from git branches (`main`, `production`, `production-scouts`) so CI is the only
publisher; Deploy Previews may still be built by Netlify's git integration.

## Environment Variables

For the shared Infisical workflow and generated `.env` files, see [environment-variables.md](./environment-variables.md).
