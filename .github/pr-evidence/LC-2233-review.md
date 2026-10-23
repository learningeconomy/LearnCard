# Reviewing LC-2233

Start with the reproducible checks, then review the cache boundaries. The live staging
comparison supports fewer repeated reads with identical returned credential data;
it does not establish a controlled mobile-speed or server-CPU improvement.

## One reviewer command

Check out this PR. Use the repository's Node version (`.nvmrc`: Node 24.12–24.x)
and pinned Bun version (`package.json#packageManager`). From the repository root:

```sh
bun install --frozen-lockfile
node scripts/review-lc2233.mjs
```

If dependencies are already installed, only the second command is needed. It can
also be called from another directory using the script's absolute path. It runs
existing fixture/unit tests without a staging login or a running backend. It does
not install dependencies, build packages, deploy, or modify application data.

The command prints the controlled comparison:

| Requests                | Existing client pattern | Shared cache |
| ----------------------- | ----------------------: | -----------: |
| Shared documents        |                     144 |            9 |
| Issuer-specific lookups |                      16 |           16 |
| Total                   |                     160 |           25 |

The test compares all issuer metadata and asserts zero additional requests on a
fresh repeat. Both paths use identical fixture responses for 16 distinct issuers;
the baseline exercises the installed registry client, not a second deployed app.

The focused suite currently runs **48 passing tests** covering shared credential
reads, account isolation, invalidation, failure recovery, consent writes and partial
failures, real DIDKit signature preservation, registry freshness, and overlapping
profile reads. It also checks missing/unreadable records in every list variant,
URI-position preservation, missing-data retry suppression and later recovery,
configured transport retries, unsupported registry types, and reader re-initialization. The profile group selects only its two relevant cases; other cases
in that file are intentionally unselected. This is not a whole-package test run or
a typecheck. A nonzero exit means the reviewer check failed; missing dependencies,
test failures, missing reports and unexpectedly empty selections are not successes.

Reports go to a fresh temporary directory printed by the command:

- `summary.json`: tested Git head, whether the working tree was clean, runtime,
  selected groups, passed/unselected counts, and the fixture comparison.
- `registry-requests.json`: deterministic before/after request counts.
- Per-group Vitest JSON reports: individual assertion results.

Optionally choose a new directory. Existing directories are refused to prevent
accidentally reading old results:

```sh
node scripts/review-lc2233.mjs --output-dir /tmp/lc2233-review-example
node scripts/review-lc2233.mjs --help
```

## Suggested code-reading order

| Review question                                   | Start here                                                                                                                                                                                                                                                      | Guardrail to inspect                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Are credentials shared without crossing accounts? | [`credentialResolution.ts`](../../packages/learn-card-base/src/react-query/queries/credentialResolution.ts), then [`vcQueries.ts`](../../packages/learn-card-base/src/react-query/queries/vcQueries.ts)                                                         | URI + account key, active reader gating, existing invalidation prefixes, failed reads remaining retryable    |
| Can consent become stale after a write?           | [`consentedContracts.ts`](../../packages/learn-card-base/src/react-query/queries/consentedContracts.ts), then the consent mutation performance tests                                                                                                            | Account/switched-profile scoping, 30-second freshness, active/inactive invalidation, partial-failure cleanup |
| Does registry caching preserve lookup behavior?   | [`issuerRegistry.ts`](../../packages/learn-card-base/src/react-query/queries/issuerRegistry.ts) and its unit/performance tests                                                                                                                                  | Shared-document freshness, trust precedence, incomplete results, negative 404 handling and failure recovery  |
| Are profile updates still visible?                | [`plugin.ts`](../../packages/plugins/learn-card-network/src/plugin.ts), search `getOtherProfile`                                                                                                                                                                | Deduplicate only pending calls; clear on success and failure; later reads fetch again                        |
| Do IDs keep valid signatures?                     | [`idCredentials.ts`](../../packages/learn-card-base/src/react-query/queries/idCredentials.ts) and its test                                                                                                                                                      | Storage URI metadata stays outside the signed credential; real DIDKit verifies the result                    |
| What changed about AI loading?                    | [`LazyNewAiSessionContainer.tsx`](../../apps/learn-card-app/src/components/new-ai-session/LazyNewAiSessionContainer.tsx) and [`LazyMarkdownRenderer.tsx`](../../apps/learn-card-app/src/components/ai-assessment/AiAssessment/helpers/LazyMarkdownRenderer.tsx) | Deferred boundaries and loading feedback; live AI inference is outside this CLI                              |

## Optional visual check

On the deployed candidate, use an account with credentials from several issuers.
Reload Dashboard, open Passport → Badges, wait for the cards, open a credential,
then return and revisit. Check that the same data appears, and inspect reuse of
identical logical RPC inputs. Several operations can share one HTTP request;
count OPTIONS separately. Change a credential or consent through the normal UI
and confirm the result refreshes after the write.

The [staging comparison](https://github.com/learningeconomy/LearnCard/pull/1633#issuecomment-6369088089)
contains the live observations, retry timings and limitations. Raw HARs contain
private account/request data and are not committed. The earlier audit is in
[`LC-2233.md`](LC-2233.md); its October 21 full-suite/build evidence belongs to
the older head named there, not automatically to a later commit.

## What this command does not replace

The full Linux owned-stack catalog, current-head CI, browser/AI coverage, and
controlled cold/warm device measurements remain separate. Follow the repository's
[`verify-learncard` workflow](../../.agents/skills/verify-learncard/SKILL.md) for
that gate. The quick command is intended to make the PR's cache/correctness claims
easy to inspect and reproduce before undertaking broader verification.
