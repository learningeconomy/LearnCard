# LC-2098 `.nx-cache` Context Retest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exclude LearnCard's retained `.nx-cache` from Docker build contexts and run a controlled cold/warm/warm sequence to determine whether that boundary materially reduces E2E wall time.

**Architecture:** Merge the current post-PR-1453 `main` into the existing Phase 2B experiment branch, add one Docker-ignore rule with a behavior-level contract, and use the already-merged runner cache lifecycle without changing runner behavior. Freeze the pushed LearnCard experiment branch during the sequence, pin the runner by full SHA, and accept results only when all artifacts resolve to identical full revisions.

**Tech Stack:** Git, Bash, Bun, `@balena/dockerignore`, Docker BuildKit, Nx, Playwright, GitHub Actions, Markdown

**Spec:** `docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md`

## Global Constraints

-   Change only the Docker context boundary plus its focused contract; do not reorder Dockerfiles or change package management, Nx configuration, Playwright concurrency, the test suite, runner cache policy, or workflow triggers.
-   Runner revision is `56466ae3de804ad746f636753b52d5e232d6a375` for every leg.
-   LearnCard input is `codex/lc-2073-phase-2b`, frozen with no pushes during the cold/warm/warm sequence; every artifact must report one identical full LearnCard SHA.
-   Execute the same seven Firefox tests: `consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts`.
-   Use explicit cache modes in this order: `cold`, `warm`, `warm`.
-   Do not overlap release or manual E2E execution on the shared EC2 instance.
-   A run is comparable only when artifacts transfer, revisions match, no emergency prune occurs, all seven tests pass with zero unexpected/flaky/skipped/errors, and free disk remains at least 25 GB.
-   Targets remain warm 2 wall-clock at most 12 minutes and fixed non-Playwright overhead at most 6 minutes.
-   Keep production cache mode defaulting to cold regardless of the retest outcome; adoption requires a separate decision.
-   Distinguish direct cache-marker observations from timing inferences, especially because PR #1453 changed the workspace baseline.

---

## File Structure

-   `.dockerignore` — production Docker context policy; add the root `.nx-cache` exclusion beside existing build-output rules.
-   `.github/tests/test-dockerignore-contract.test.sh` — executable behavior contract using the repository's installed Docker-compatible matcher; prove `.nx-cache` is ignored while `bun.lock` and representative source remain included.
-   `docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md` — approved experiment design; retain the branch-freeze clarification discovered during planning.
-   `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-implementation.md` — this executable plan and command record.
-   `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md` — create only after all three live legs; record revisions, runs, timings, cache markers, disk, decision, and limitations.
-   `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/` — local, uncommitted artifact extractions used for analysis.
-   `/Users/donny/Documents/obsidiandocs/my life and learnings/Codex Notes/LearnCard/2026-08-10-lc-2073-phase-2b-cache-experiment.md` — append the human-readable retest outcome after analysis; never overwrite prior findings.

## Task 1: Integrate Current Main Without Losing Experiment Records

**Files:**

-   Preserve: `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-design.md`
-   Preserve: `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-implementation.md`
-   Preserve: `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md`
-   Preserve: `docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md`
-   Preserve: `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-implementation.md`

**Interfaces:**

-   Consumes: current experiment branch `codex/lc-2073-phase-2b` and fetched `origin/main` at or beyond `6d5e80da7e9e4dfccebeae7ea9df2ed74a47e672`.
-   Produces: one merge commit containing current main plus all experiment records, with a clean worktree before behavior changes.

-   [ ] **Step 1: Verify the integration inputs**

    Run:

    ```bash
    git status --short --branch
    git fetch --no-tags origin main
    git rev-parse HEAD
    git rev-parse origin/main
    git merge-base --is-ancestor 6d5e80da7e9e4dfccebeae7ea9df2ed74a47e672 origin/main
    git merge-tree "$(git merge-base HEAD origin/main)" HEAD origin/main \
      | rg '^(changed in both|<<<<<<<|=======|>>>>>>>)' || true
    ```

    Expected: worktree clean, the ancestor check exits 0, and the preview shows no unresolved content conflicts. The large project-deletion diff is expected.

-   [ ] **Step 2: Merge current main**

    Run:

    ```bash
    git merge --no-ff origin/main -m "merge: update LC-2098 retest to latest main"
    ```

    Expected: merge completes. If Git reports conflicts, resolve only the named files by preserving current-main production changes and the experiment branch's `docs/plans/` records; never use a broad checkout/reset command.

-   [ ] **Step 3: Verify merged project retirement and records**

    Run:

    ```bash
    test ! -e examples/chapi-example/package.json
    test ! -e examples/snap-chapi-example/package.json
    test ! -e services/simple-signing-service/package.json
    test -f docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md
    test -f docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md
    test -f docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-implementation.md
    bash .github/tests/test-workflow-contract.test.sh
    ruby -e "require 'yaml'; YAML.load_file('.github/workflows/test.yml', aliases: true)"
    git diff --check HEAD^ HEAD
    git status --short --branch
    ```

    Expected: retired projects absent, plan records present, workflow contract and YAML parsing pass, merge diff clean, and no unresolved paths remain.

## Task 2: Add a Failing Docker-Context Contract

**Files:**

-   Create: `.github/tests/test-dockerignore-contract.test.sh`
-   Test: `.github/tests/test-dockerignore-contract.test.sh`

**Interfaces:**

-   Consumes: root `.dockerignore` and the already-installed `@balena/dockerignore` matcher resolved by Bun.
-   Produces: an executable contract whose only initial failure is `.nx-cache/state.bin` remaining in the Docker context.

-   [ ] **Step 1: Create the exact failing contract**

        Add `.github/tests/test-dockerignore-contract.test.sh`:

        ```bash
        #!/usr/bin/env bash
        set -euo pipefail

        REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

        cd "$REPO_ROOT"

        bun - <<'BUN'
        import dockerignore from '@balena/dockerignore';
        import { readFileSync } from 'node:fs';

        const matcher = dockerignore({ ignorecase: false }).add(
            readFileSync('.dockerignore', 'utf8')
        );

        const assertIgnored = (path: string): void => {
            if (!matcher.ignores(path)) {
                throw new Error(`${path} must be excluded from the Docker context`);
            }
        };

        const assertIncluded = (path: string): void => {
            if (matcher.ignores(path)) {
                throw new Error(`${path} must remain in the Docker context`);
            }
        };

        // Break caught: the retained native Nx cache changed whole-repository COPY keys.
        assertIgnored('.nx-cache/state.bin');
        assertIgnored('.nx-cache/nested/output.json');

        // Guard against an accidentally broad rule that strips build inputs.
        assertIncluded('bun.lock');
        assertIncluded('packages/learn-card-types/src/index.ts');

    BUN

        echo 'Docker ignore contract passed'
        ```

-   [ ] **Step 2: Make the contract executable and prove RED**

    Run:

    ```bash
    chmod +x .github/tests/test-dockerignore-contract.test.sh
    bash .github/tests/test-dockerignore-contract.test.sh
    ```

    Expected: nonzero with `.nx-cache/state.bin must be excluded from the Docker context`. If a different assertion fails, stop and investigate rather than editing production policy.

## Task 3: Exclude the Native Nx Cache Minimally

**Files:**

-   Modify: `.dockerignore:56-62`
-   Test: `.github/tests/test-dockerignore-contract.test.sh`

**Interfaces:**

-   Consumes: the RED contract from Task 2.
-   Produces: Docker-compatible matching where root `.nx-cache` descendants are excluded and representative lock/source inputs remain included.

-   [ ] **Step 1: Add the minimal production rule**

    Update the build-output block to exactly:

    ```dockerignore
    # Build outputs and native task cache
    **/dist
    **/build
    **/.next
    **/.turbo
    **/.nx
    .nx-cache
    ```

    Do not add `**/.nx-cache`; the experiment hypothesis concerns the root cache retained by the runner, and a broader rule is not required.

-   [ ] **Step 2: Prove GREEN and retain adjacent contracts**

    Run:

    ```bash
    bash .github/tests/test-dockerignore-contract.test.sh
    bash -n .github/tests/test-dockerignore-contract.test.sh
    bash -n .github/tests/test-workflow-contract.test.sh
    bash .github/tests/test-workflow-contract.test.sh
    ruby -e "require 'yaml'; YAML.load_file('.github/workflows/test.yml', aliases: true)"
    bunx prettier --check docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md \
      docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-implementation.md
    git diff --check
    ```

    Expected: both contracts pass, YAML parses, Prettier reports all matched files formatted, and the diff check is clean.

-   [ ] **Step 3: Commit the behavior change**

    Run:

    ```bash
    git add .dockerignore .github/tests/test-dockerignore-contract.test.sh
    git commit -m "perf(ci): exclude Nx cache from Docker context"
    ```

    Expected: pre-commit hooks pass and the commit contains only the production rule and focused contract. The design/plan approval and main merge remain their own earlier commits.

## Task 4: Freeze and Publish the Experiment Revision

**Files:**

-   Verify: `.dockerignore`
-   Verify: `.github/tests/test-dockerignore-contract.test.sh`
-   Verify: `.github/workflows/test.yml`

**Interfaces:**

-   Consumes: clean local implementation and runner main SHA `56466ae3de804ad746f636753b52d5e232d6a375`.
-   Produces: one pushed LearnCard SHA used unchanged for all three live legs and updated draft PR #1469.

-   [ ] **Step 1: Run the final local gate**

    Run:

    ```bash
    bash .github/tests/test-dockerignore-contract.test.sh
    bash -n .github/tests/test-dockerignore-contract.test.sh
    bash -n .github/tests/test-workflow-contract.test.sh
    bash .github/tests/test-workflow-contract.test.sh
    ruby -e "require 'yaml'; YAML.load_file('.github/workflows/test.yml', aliases: true)"
    bunx prettier --check docs/plans/2026-08-11-lc-2098-nx-cache-context-retest-design.md \
      docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-implementation.md
    git diff --check origin/main...HEAD
    git status --short --branch
    git log --oneline --decorate -5
    ```

    Expected: all checks pass and the worktree is clean.

-   [ ] **Step 2: Capture immutable inputs before pushing**

    Run:

    ```bash
    LEARNCARD_SHA="$(git rev-parse HEAD)"
    RUNNER_SHA="$(git -C ../lc-2073-phase-2b-runner rev-parse origin/main)"
    test "$RUNNER_SHA" = 56466ae3de804ad746f636753b52d5e232d6a375
    printf 'LearnCard=%s\nRunner=%s\n' "$LEARNCARD_SHA" "$RUNNER_SHA"
    ```

    Expected: one full LearnCard SHA is printed and runner SHA matches exactly. Record both in the execution report; do not dispatch if the runner comparison fails.

-   [ ] **Step 3: Push once, then freeze the branch**

    Run:

    ```bash
    git push origin codex/lc-2073-phase-2b
    git ls-remote origin refs/heads/codex/lc-2073-phase-2b
    ```

    Expected: remote branch resolves to `LEARNCARD_SHA`. Do not push any additional commit until cold, warm 1, and warm 2 artifacts have been collected.

-   [ ] **Step 4: Update draft PR #1469 before live mutation**

    Set the PR title to `perf(ci): [LC-2098] test Nx cache Docker boundary` and update its body to describe the single `.dockerignore` hypothesis, post-PR-1453 baseline, explicit cold/warm/warm protocol, and links to the design/plan. Keep the PR draft until results are recorded.

    Expected: PR #1469 points to the frozen `LEARNCARD_SHA`; no workflow or runner production default is changed.

## Task 5: Dispatch the Controlled Cold/Warm/Warm Sequence

**Files:**

-   No repository edits during this task.
-   Create locally after download: `/tmp/lc-2098-nx-cache-retest/cold/`
-   Create locally after download: `/tmp/lc-2098-nx-cache-retest/warm1/`
-   Create locally after download: `/tmp/lc-2098-nx-cache-retest/warm2/`

**Interfaces:**

-   Consumes: frozen LearnCard branch, runner SHA, idle shared EC2 runner, GitHub Actions write access.
-   Produces: three completed workflow run IDs and three extracted diagnostic bundles with identical revisions.

-   [ ] **Step 1: Confirm no shared-runner overlap**

    Run:

    ```bash
    gh auth status
    gh run list --repo learningeconomy/LearnCard --workflow test.yml --limit 20 \
      --json databaseId,status,headBranch,url \
      --jq '.[] | select(.status != "completed")'
    gh run list --repo WeLibraryOS/learncard-e2e-runner \
      --workflow run-e2e-tests.yml --limit 20 \
      --json databaseId,status,headBranch,url \
      --jq '.[] | select(.status != "completed")'
    ```

    If `gh` is unauthenticated, stop and ask the owner to complete `gh auth login` with repository and Actions permissions before dispatch. Do not dispatch while either command reports a release/manual E2E job starting EC2, waiting for EC2, running over SSH, cleaning up, downloading artifacts, or stopping EC2.

    Expected: no active E2E owner. If another run is active, wait for its stop step to finish before dispatch.

-   [ ] **Step 2: Dispatch cold**

    Run:

    ```bash
    DISPATCHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    gh workflow run run-e2e-tests.yml \
      --repo WeLibraryOS/learncard-e2e-runner \
      --ref main \
      -f runner_ref=56466ae3de804ad746f636753b52d5e232d6a375 \
      -f branch=codex/lc-2073-phase-2b \
      -f cache_mode=cold \
      -f test_files='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'

    COLD_RUN_ID=''
    for attempt in {1..12}; do
      COLD_RUN_ID="$(gh run list --repo WeLibraryOS/learncard-e2e-runner \
        --workflow run-e2e-tests.yml --event workflow_dispatch --branch main --limit 10 \
        --json databaseId,createdAt \
        --jq "[.[] | select(.createdAt >= \"$DISPATCHED_AT\")][0].databaseId // empty")"
      if [ -n "$COLD_RUN_ID" ]; then
        break
      fi
      sleep 5
    done
    test -n "$COLD_RUN_ID"
    gh run watch "$COLD_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner --exit-status
    ```

    Record the created run ID immediately. Wait for completion and require success before warm 1.

-   [ ] **Step 3: Download and validate cold artifacts**

    Fetch the run's artifact and extract it:

    Run:

    ```bash
    COLD_RUN_ID="$(gh run list --repo WeLibraryOS/learncard-e2e-runner \
      --workflow run-e2e-tests.yml --event workflow_dispatch --branch main --limit 1 \
      --json databaseId --jq '.[0].databaseId')"
    test -n "$COLD_RUN_ID"
    test ! -e /tmp/lc-2098-nx-cache-retest/cold
    mkdir -p /tmp/lc-2098-nx-cache-retest/cold
    gh run download "$COLD_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner \
      --name "e2e-diagnostics-$COLD_RUN_ID" \
      --dir /tmp/lc-2098-nx-cache-retest/cold

    EXPECTED_LEARNCARD_SHA="$(git rev-parse HEAD)"
    test "$(awk -F= '$1 == "runner_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/cold/metadata.txt)" \
      = 56466ae3de804ad746f636753b52d5e232d6a375
    test "$(awk -F= '$1 == "learncard_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/cold/metadata.txt)" \
      = "$EXPECTED_LEARNCARD_SHA"
    test "$(awk -F= '$1 == "cache_mode" { print $2 }' /tmp/lc-2098-nx-cache-retest/cold/metadata.txt)" \
      = cold
    test "$(awk -F= '$1 == "comparable" { print $2 }' /tmp/lc-2098-nx-cache-retest/cold/cache-result.env)" \
      = true
    test "$(awk -F= '$1 == "reason" { print $2 }' /tmp/lc-2098-nx-cache-retest/cold/cache-result.env)" \
      = retained-within-disk-boundary
    ```

    Expected: exact revisions/mode match and the run is comparable. If not, stop; do not seed warm evidence from a rejected cold leg.

-   [ ] **Step 4: Dispatch warm 1 and validate immediately**

    Run:

    ```bash
    DISPATCHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    gh workflow run run-e2e-tests.yml \
      --repo WeLibraryOS/learncard-e2e-runner \
      --ref main \
      -f runner_ref=56466ae3de804ad746f636753b52d5e232d6a375 \
      -f branch=codex/lc-2073-phase-2b \
      -f cache_mode=warm \
      -f test_files='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'

    WARM1_RUN_ID=''
    for attempt in {1..12}; do
      WARM1_RUN_ID="$(gh run list --repo WeLibraryOS/learncard-e2e-runner \
        --workflow run-e2e-tests.yml --event workflow_dispatch --branch main --limit 10 \
        --json databaseId,createdAt \
        --jq "[.[] | select(.createdAt >= \"$DISPATCHED_AT\")][0].databaseId // empty")"
      if [ -n "$WARM1_RUN_ID" ]; then
        break
      fi
      sleep 5
    done
    test -n "$WARM1_RUN_ID"
    gh run watch "$WARM1_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner --exit-status

    test ! -e /tmp/lc-2098-nx-cache-retest/warm1
    mkdir -p /tmp/lc-2098-nx-cache-retest/warm1
    gh run download "$WARM1_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner \
      --name "e2e-diagnostics-$WARM1_RUN_ID" \
      --dir /tmp/lc-2098-nx-cache-retest/warm1

    EXPECTED_LEARNCARD_SHA="$(git rev-parse HEAD)"
    test "$(awk -F= '$1 == "runner_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm1/metadata.txt)" \
      = 56466ae3de804ad746f636753b52d5e232d6a375
    test "$(awk -F= '$1 == "learncard_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm1/metadata.txt)" \
      = "$EXPECTED_LEARNCARD_SHA"
    test "$(awk -F= '$1 == "cache_mode" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm1/metadata.txt)" \
      = warm
    test "$(awk -F= '$1 == "comparable" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm1/cache-result.env)" \
      = true
    test "$(awk -F= '$1 == "reason" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm1/cache-result.env)" \
      = retained-within-disk-boundary
    ```

    Expected: identical runner/LearnCard SHAs and comparable warm result. If emergency pruning or disk below 25 GB occurs, restart from a new cold leg.

-   [ ] **Step 5: Dispatch warm 2 and validate immediately**

    Run:

    ```bash
    DISPATCHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    gh workflow run run-e2e-tests.yml \
      --repo WeLibraryOS/learncard-e2e-runner \
      --ref main \
      -f runner_ref=56466ae3de804ad746f636753b52d5e232d6a375 \
      -f branch=codex/lc-2073-phase-2b \
      -f cache_mode=warm \
      -f test_files='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'

    WARM2_RUN_ID=''
    for attempt in {1..12}; do
      WARM2_RUN_ID="$(gh run list --repo WeLibraryOS/learncard-e2e-runner \
        --workflow run-e2e-tests.yml --event workflow_dispatch --branch main --limit 10 \
        --json databaseId,createdAt \
        --jq "[.[] | select(.createdAt >= \"$DISPATCHED_AT\")][0].databaseId // empty")"
      if [ -n "$WARM2_RUN_ID" ]; then
        break
      fi
      sleep 5
    done
    test -n "$WARM2_RUN_ID"
    gh run watch "$WARM2_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner --exit-status

    test ! -e /tmp/lc-2098-nx-cache-retest/warm2
    mkdir -p /tmp/lc-2098-nx-cache-retest/warm2
    gh run download "$WARM2_RUN_ID" --repo WeLibraryOS/learncard-e2e-runner \
      --name "e2e-diagnostics-$WARM2_RUN_ID" \
      --dir /tmp/lc-2098-nx-cache-retest/warm2

    EXPECTED_LEARNCARD_SHA="$(git rev-parse HEAD)"
    test "$(awk -F= '$1 == "runner_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm2/metadata.txt)" \
      = 56466ae3de804ad746f636753b52d5e232d6a375
    test "$(awk -F= '$1 == "learncard_revision" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm2/metadata.txt)" \
      = "$EXPECTED_LEARNCARD_SHA"
    test "$(awk -F= '$1 == "cache_mode" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm2/metadata.txt)" \
      = warm
    test "$(awk -F= '$1 == "comparable" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm2/cache-result.env)" \
      = true
    test "$(awk -F= '$1 == "reason" { print $2 }' /tmp/lc-2098-nx-cache-retest/warm2/cache-result.env)" \
      = retained-within-disk-boundary
    ```

    Expected: three accepted artifacts with one LearnCard SHA, one runner SHA, and modes `cold`, `warm`, `warm`.

## Task 6: Analyze Timing, Correctness, Cache Markers, and Disk

**Files:**

-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/metadata.txt`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/timings.tsv`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/test-results/results.json`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/docker-base-build.log`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/docker-compose-build.log`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/host-nx-build.log`
-   Read: `/tmp/lc-2098-nx-cache-retest/{cold,warm1,warm2}/cache-*.txt`
-   Create: `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md`

**Interfaces:**

-   Consumes: three accepted artifacts and their GitHub job wall times/run URLs.
-   Produces: one evidence-backed result classification that separates direct observations from inference.

-   [ ] **Step 1: Verify test correctness from JSON**

    Run:

    ```bash
    for leg in cold warm1 warm2; do
      results="/tmp/lc-2098-nx-cache-retest/$leg/test-results/results.json"
      jq -e '
        .stats.expected == 7 and
        .stats.unexpected == 0 and
        .stats.flaky == 0 and
        .stats.skipped == 0 and
        (.errors | length) == 0
      ' "$results"
      jq '{stats, error_count: (.errors | length)}' "$results"
    done
    ```

    Expected: 7/7 for every leg. Do not infer correctness from workflow success alone.

-   [ ] **Step 2: Build the stage and wall-clock matrix**

    Extract the GitHub timestamps and artifact timings:

    ```bash
    RUN_IDS=($(gh run list --repo WeLibraryOS/learncard-e2e-runner \
      --workflow run-e2e-tests.yml --event workflow_dispatch --branch main --limit 3 \
      --json databaseId,createdAt --jq 'sort_by(.createdAt)[] | .databaseId'))
    test "${#RUN_IDS[@]}" -eq 3
    COLD_RUN_ID="${RUN_IDS[0]}"
    WARM1_RUN_ID="${RUN_IDS[1]}"
    WARM2_RUN_ID="${RUN_IDS[2]}"

    for assignment in \
      "cold:$COLD_RUN_ID" \
      "warm1:$WARM1_RUN_ID" \
      "warm2:$WARM2_RUN_ID"; do
      leg="${assignment%%:*}"
      run_id="${assignment##*:}"
      gh run view "$run_id" --repo WeLibraryOS/learncard-e2e-runner \
        --json url,status,conclusion,jobs \
        --jq '{url, status, conclusion, job: (.jobs[] | select(.name == "e2e-test") | {startedAt, completedAt})}'
      awk -F '\t' 'NR == 1 || $1 == "playwright" || $1 == "docker_base_build" || \
        $1 == "docker_compose_build" || $1 == "host_test_dependencies"' \
        "/tmp/lc-2098-nx-cache-retest/$leg/timings.tsv"
    done
    ```

    Convert each run's authoritative GitHub job start/completion timestamps to seconds and compute:

    ```text
    job_wall_seconds = completed_at - started_at
    fixed_overhead_seconds = job_wall_seconds - playwright_seconds
    ```

    Record cold, warm 1, warm 2, and deltas. Compare warm 2 against 720-second wall and 360-second fixed-overhead gates.

-   [ ] **Step 3: Inspect the hypothesis-bearing Docker markers**

    In both warm logs, find the exact BuildKit step numbers and statuses for:

    -   shared-base `COPY . .`;
    -   shared-base `RUN bun install`;
    -   application-image Nx build;
    -   unaffected service layers.

    Use exact snippets and name a layer `CACHED` only when the log explicitly does. If a step is merely fast or `DONE`, describe it that way.

-   [ ] **Step 4: Inspect host Nx and disk behavior**

    Record host Nx duration and any explicit local-cache hit marker. From cache snapshots, record free disk, Docker image size, BuildKit total/reclaimable size, and `.nx-cache` KiB before/after each leg. Confirm no emergency-prune reason and post-run free disk at least 25 GB.

-   [ ] **Step 5: Write the result document**

    Create `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md` with these exact sections:

    ```markdown
    # LC-2098 `.nx-cache` Context Retest Results

    ## Decision

    ## Run and Revision Matrix

    ## Correctness and Comparability

    ## Stage Timing and Wall-Clock Comparison

    ## Docker BuildKit Cache Evidence

    ## Host Nx Evidence

    ## Disk Growth and Safety

    ## Comparison With Original Phase 2B

    ## Observations Versus Inferences

    ## Next Recommendation

    ## Run, Artifact, PR, and Jira Links
    ```

    The decision must follow the design outcomes: cache hits plus targets pass; cache hits improve but targets fail; context/dependency layers still miss; or correctness/comparability/safety fails. Do not attribute all post-PR-1453 timing change solely to `.nx-cache` exclusion.

-   [ ] **Step 6: Review the evidence language and formatting**

    Run:

    ```bash
    if rg -n 'TO''DO|TB''D|PLACE''HOLDER|<[^>]+>' \
      docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md; then
        exit 1
    fi
    bunx prettier --check docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md
    git diff --check
    ```

    Then manually cross-check every timing, SHA, run ID, cache marker, and disk value against the artifact or GitHub run that supports it.

## Task 7: Record the Retest for Manual Review and Publish Results

**Files:**

-   Modify: `docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md`
-   Append: `/Users/donny/Documents/obsidiandocs/my life and learnings/Codex Notes/LearnCard/2026-08-10-lc-2073-phase-2b-cache-experiment.md`

**Interfaces:**

-   Consumes: reviewed results document and all three run/artifact links.
-   Produces: committed repository evidence, updated draft PR #1469, and a non-destructive Obsidian manual-review record.

-   [ ] **Step 1: Read the existing Obsidian note before editing**

    Run:

    ```bash
    sed -n '1,320p' "/Users/donny/Documents/obsidiandocs/my life and learnings/Codex Notes/LearnCard/2026-08-10-lc-2073-phase-2b-cache-experiment.md"
    ```

    Expected: existing YAML frontmatter and Phase 2B content remain the base record.

-   [ ] **Step 2: Append the dated retest section**

    Append, without replacing existing content, `## Update 2026-08-12 — LC-2098 \`.nx-cache\` context retest`. Under it, copy the completed repository result's exact decision sentence; cold/warm1/warm2 table with links, identical SHAs, wall, Playwright, fixed overhead, and 7/7 status; exact cached/rerun layer observations; free-disk and Docker/BuildKit growth; and safety classification. End with an unchecked manual-review list covering revision equality, named Docker cache markers, test counts, both timing gates, and approval before changing the cold default. Every value must come from the completed result document or its cited artifact.

-   [ ] **Step 3: Commit the repository result after the run sequence**

    The branch freeze ends only after all artifacts are downloaded and validated. Then run:

    ```bash
    git add -f docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md
    git commit -m "docs(ci): record LC-2098 cache boundary results"
    git push origin codex/lc-2073-phase-2b
    ```

    Expected: only the repository results document is committed in this final result commit. Obsidian remains outside Git.

-   [ ] **Step 4: Update PR #1469 and final status**

    Add the three run links, timing table, cache-marker conclusion, disk classification, and result-document link to PR #1469. Keep it draft if the outcome recommends more investigation; mark ready only if the owner separately approves the proposed production action.

-   [ ] **Step 5: Persist the project checkpoint**

    Run:

    ```bash
    ~/.config/dualmem/bin/dualmem-run checkpoint \
      --task "LC-2098 Nx cache Docker context retest" \
      --status done \
      --files ".dockerignore,.github/tests/test-dockerignore-contract.test.sh,docs/plans/2026-08-12-lc-2098-nx-cache-context-retest-results.md" \
      --done "Merged latest main, excluded root .nx-cache, ran controlled cold/warm/warm, analyzed timing/cache/disk, recorded repo and Obsidian results" \
      --remaining "Owner manual review and any separately approved production-policy follow-up"
    ```

    Expected: checkpoint stored in the shared LearnCard namespace.
