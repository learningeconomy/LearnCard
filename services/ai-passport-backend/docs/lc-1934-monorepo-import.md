# LC-1934: AI Passport in the LearnCard monorepo

AI Passport moved out of `WeLibraryOS/AI-Passport` and into LearnCard as a file snapshot. No private Git history came across.

## Source

- AI-Passport revision: `c2c1e5718042efa097e8e5f43c29150f1e07ccae` (`main`, which contains #113 `c2c1e57` and #103 `a1d10c5`)
- Tooling: `tools/migration_snapshot.py` from the AIP branch `codex/lc1934-private-snapshot`, run against the revision above
- Manifest sha256: `2fabbf151c5428d76b57580484139fc93fdd08a9beee27fc2b6e76dcefc74217`
- Inventory: 438 files exported, 46 excluded (28 outside the allowlist, 16 generated, 2 `REQUIRES_REWRITE`: the OAuth doc and the `MCP-OAuth.png` diagram, both omitted), 0 pattern findings. `publication_cleared` stays false.
- Extra scans on the exported bytes: gitleaks matched 11 test fixtures and trufflehog matched 1 unverified example. None were real secrets.

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
- The workspace-linked LearnCard libraries need a build first: `bunx nx run-many -t build --projects=core,didkit-plugin,helpers,types,vc-plugin`. Another option is to run with `--conditions=development`, which the `start*` scripts and the bundle already do.
- `bunfig.toml` preloads `test/react-resolution.ts` so the root-hoisted `react-test-renderer` resolves this package's React 19.
- App: `bun test src`, `bun run build` (Node >= 22.12 for Astro 7), and `bun run test:e2e`. The e2e run needs the backend and workers running.

## Leftovers for Taylor

- **Qdrant key rotation.** A Qdrant key lives in AIP's Git history. None of that history was imported, but rotating the key is still an ops item.
- **npm `@learncard/init` pin.** The backend pins npm `@learncard/init@2.4.16`. Bun links its `core`/`helpers`/`types`/`vc-plugin`/`didkit-plugin` dependencies to the workspace packages whenever the versions match, so the pin doesn't fully freeze verifier provenance.
- **ChatGPT-flavored copy.** Some UI copy in `apps/ai-passport` still says ChatGPT, because that was the default branding. Renaming it is a product call.
- **Cookie CSRF/Origin hardening.** This Phase A item is still open.
- **Fly cutover.** The Dockerfiles now use Bun `1.4.2` and the full-workspace install, but the Fly apps still build from the AIP repo. Moving deploys here is a follow-up and nothing in this PR deploys.
- **Binary review.** The snapshot tool flagged 7 images for manual review.
