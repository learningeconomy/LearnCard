# LC-1934: AI Passport in the LearnCard monorepo

AI Passport moved out of `WeLibraryOS/AI-Passport` and into LearnCard as a file snapshot. No private Git history came across.

## Source

- AI-Passport revision: `4c69bf5521d39e060824cd7189f0549882f24dad` (`main`, which contains #117 `3ee1e5b` and #118 `4c69bf5`). The first import was pinned to `c2c1e5718042efa097e8e5f43c29150f1e07ccae` (#113 `c2c1e57`, #103 `a1d10c5`).
- Tooling: `tools/migration_snapshot.py` from the AIP branch `codex/lc1934-private-snapshot`, run against the revision above
- Manifest sha256: `cea23b61fec8923b863e1c62c27cfc4c3f4583e4cd950da20c56ec9f0cdee64b`
- Inventory: 444 files exported, 47 excluded (29 outside the allowlist, 16 generated, 2 `REQUIRES_REWRITE`: the OAuth doc and the `MCP-OAuth.png` diagram, both omitted), 0 pattern findings. `publication_cleared` stays false.
- Extra scans on the exported bytes: on the first import, gitleaks matched 11 test fixtures and trufflehog matched 1 unverified example. None were real secrets. On the files changed between the two pins, gitleaks and trufflehog found nothing.

### Syncing a newer AIP revision

The branch carries monorepo fixes on top of the snapshot (Prettier formatting, `workspace:*` deps, Dockerfiles, Bedrock defaults, `QDRANT_HTTPS`, the finish-assessment ownership fix and others), so a newer export isn't copied over the tree. Instead:

1. Export the old pin and the new pin with `migration_snapshot.py` into private directories.
2. Format both exports with the repo's `.prettierrc.json`.
3. Three-way merge each changed file (`git merge-file <monorepo file> <old export> <new export>`) and copy files that are new in the export.

The `c2c1e57` → `4c69bf5` sync brought in:

- **#117, assessment diagnostics.** `src/diagnostics/assessment.ts` and stage-level `ai_assessment_*` log events in `services/assessment.ts` and `logging.ts`, plus LearnCard-timeout classification. AIP's `docs/assessment-diagnostics.md` runbook sits outside the import allowlist and wasn't copied.
- **#118, legacy assessment recovery.** `services/assessmentSummary.ts` verifies the summary VC and, when an older summary no longer verifies, re-issues it from the issuer's retained, owner-bound history. `credentials/sessionSummary.ts` holds the summary VC builder that used to live in `awarding.ts`. `db.getOwnedThreadSummary()` is new.
- **`/finish-assessment` merge.** AIP's route accepts an optional `summaryCredentialUri` and proves ownership with `verifyAssessmentSummary()`. In the monorepo, `authorizeFinishAssessment()` passes that URI through and leaves the check to `verifyAssessmentSummary()`. Without it, the request still goes through the monorepo's `ownsSummaryBoost()` lookup.

## Layout

| AIP path                                               | LearnCard path                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `apps/ai-passport`                                     | `apps/ai-passport`                                                              |
| `services/ai-passport-backend` (API, WS, workers, MCP) | `services/ai-passport-backend`                                                  |
| `packages/learn-card-types/src/ai-passport/index.ts`   | `packages/learn-card-types/src/aiPassport.ts` (exported from the package index) |

## Retired with the move

- The Claude and ChatGPT whitelabels. Their LearnCard app catalog entries are gone, and the `claude-ai-passport` Fly app isn't carried over: AIP's `deploy-fly.yml` wasn't imported.
- The frontend's `BRANDING` switch and the Claude assets.

## Kept on purpose

- The AI Passport DID and the `LEARNCARD_AI_PASSPORT_CONTRACT_URI` code defaults.
- The production JWT signing policy from #103.
- The SSRF, `allowRemoteContexts`, and erasure behavior, which are unchanged.

## Running it

- Unit tests: `bun run test:unit` in `services/ai-passport-backend`. They need Mongo (replica set), Redis, Qdrant, and the privacy runtime. `.github/workflows/ai-passport.yml` shows the CI setup.
- The `dev*`, `start*` and test scripts, plus the bundle, run with `--conditions=development`, so workspace `@learncard/*` packages resolve from source. CI still builds `core,didkit-plugin,helpers,types,vc-plugin` first (`bunx nx run-many -t build --projects=…`) for anything that uses default resolution.
- Local services: `docker-compose up -d` publishes Redis on 6384 and Mongo on 27018 (use `directConnection=true`). `scripts/test.ts` already points non-CI runs at those ports.
- `bunfig.toml` preloads `test/react-resolution.ts` so the root-hoisted `react-test-renderer` resolves this package's React 19.
- App: `bun test src`, `bun run build` (Node >= 22.12 for Astro 7), and `bun run test:e2e`. The e2e run needs the backend and workers running.

## Follow-ups

- **Qdrant key rotation.** A Qdrant key lives in AIP's Git history. None of that history was imported, but rotating the key is still an ops item.
- **`@learncard/init` / `didkit-plugin` now come from the workspace.** AIP pinned npm `@learncard/init@2.4.16` and `@learncard/didkit-plugin@1.10.0`. In the monorepo, Bun linked that npm tree's inner `@learncard/*` deps to the workspace packages anyway, and a clean `bun install --frozen-lockfile` failed with `EEXIST` on those links. So the backend uses `workspace:*` like the other LearnCard services, and verifier provenance now records the workspace versions (`@learncard/init-2.5.5;@learncard/didkit-plugin-1.10.5` today, instead of `2.4.16;1.10.0`). Stored records keep their old provenance string, and the real signing/verification tests pass on the workspace build.
- **ChatGPT-flavored copy.** Some UI copy in `apps/ai-passport` still says ChatGPT, because that was the default branding. Renaming it is a product call.
- **Cookie CSRF/Origin hardening.** This Phase A item is still open.
- **Fly cutover.** The Dockerfiles now use Bun `1.4.2` and install against the shared monorepo `bun.lock`; `Dockerfile.api` filters the install to `ai-passport-backend` so the image fits Fly's 8 GiB unpack limit. The stacked deploy PR adds the `deploy.yml` legs (staging on Nx change, production on release, both behind `AIP_DEPLOY_ENABLED`); the GitHub Environments, staging Fly app and staging overrides are documented in [ENVIRONMENTS.md](../../../ENVIRONMENTS.md#ai-passport-fly--netlify-deploys). Nothing deploys until ops creates those and flips the variable.
- **Binary review.** The snapshot tool flagged 7 images for manual review.
- **Live AI E2E.** AIP's `ci.yml` `live` job (Bedrock Guardrail smoke + Playwright against a running backend) wasn't carried over. It needs `OPENAI_API_KEY`, `SEED`, the Guardrail variables, and an AWS CI role whose OIDC trust allows `learningeconomy/LearnCard`.
- **Netlify.** `apps/ai-passport/netlify.toml` now covers deploy previews (site base directory `apps/ai-passport`); staging and production publish from CI. Relinking the Netlify site to this repo is an ops step in the cutover order.
