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

Front-end production deploys run from CI (`.github/workflows/deploy.yml`, `deploy-frontend` job)
via the Netlify CLI (`netlify deploy --prod --no-build`) instead of force-pushing a deploy branch.
Each front-end GitHub Environment must provide:

| Key                  | Type   | Purpose                                                          |
| -------------------- | ------ | ---------------------------------------------------------------- |
| `NETLIFY_SITE_ID`    | var    | Target Netlify site ID for that environment                      |
| `NETLIFY_AUTH_TOKEN` | secret | Netlify personal/team token with deploy rights (may be org-wide) |

Set `NETLIFY_SITE_ID` per environment (`learn-card-app-staging`, `learn-card-app-production`,
`scout-app-production`). The obsolete `NETLIFY_BRANCH` and `DEPLOY_FORCE_PUSH` vars are no longer
used and can be removed. On the Netlify side, disable auto-publishing from the deploy branch so
CI is the only publisher; Deploy Previews may still be built by Netlify's git integration.

## Environment Variables

For the shared Infisical workflow and generated `.env` files, see [environment-variables.md](./environment-variables.md).
