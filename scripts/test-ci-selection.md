# Integration test selection

`Test Runner` repurposes the former recovery-tools runner as `Select integration tests`
to select integration jobs before allocating their runners. Recovery-tool regressions
move into the existing required `Test` job and run alongside the integration jobs.
The total runner count does not increase. AI Agent CI keeps its existing behavior.

| Output      | Jobs                                                                  | Inputs                                                                      |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `brain`     | share-link-security, profile-search, inbox-security, boost-recipients | Brain service, its Nx dependency closure and integration task prerequisites |
| `campaigns` | campaigns                                                             | Brain inputs plus LCA API, including its notification integration tests     |
| `escrow`    | Escrow integration (lca-api)                                          | LCA API and dependencies, plus the existing explicit SSS and enclave inputs |

PR selection compares the frozen base and head using their merge base. Queue
selection compares the event's exact base/head, including changes from preceding
queue entries. The checkout must match that head. Manual dispatch always runs all
integration suites.

Known prose and three reviewed files belonging only to full E2E can skip without
graph setup. Other project changes use the same isolated, locked Nx/TypeScript
preflight as Mock E2E. The graph includes transitive, implicit and dynamic project
dependencies, task prerequisites, and explicit workspace inputs. It plans tasks;
it does not build projects or install the Bun workspace.

Dependency metadata, lockfiles, shared configuration, source deletions, unknown
paths, unavailable Git comparisons and incomplete graphs request all suites.
Missing selector outputs or a failed selector job also request execution. Only an
explicit `false` decision from a successful job skips an integration runner. The
job summary labels these decisions as “not applicable,” not test passes.

Each selected job retains its suite commands, timeout and isolated environment.
There are no required-check setting changes. On a relevant change, integration
jobs wait only for checkout and selection, not the recovery regressions. Measure
that preflight overhead alongside runners avoided when evaluating the rollout.

## Validate

```sh
node --test .github/tests/test-integration-selection.test.cjs scripts/mock-e2e-ci.test.cjs
```

Inspect the workflow's `Select integration tests` job for each decision and reason. Shared dependency changes should run affected
suites; unrelated project changes should skip them. If the graph cannot be built,
`graph-unavailable` intentionally runs all suites. A skip is never inferred from
an empty or missing output.
