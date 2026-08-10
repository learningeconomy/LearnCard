# LC-2073 Phase 2B Cache Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a controlled cold/warm/invalidation experiment that determines whether native Docker BuildKit and host Nx caching can bring the current seven-test E2E suite below 12 minutes without stale state or unsafe disk growth.

**Architecture:** Implement the experiment in `WeLibraryOS/learncard-e2e-runner` behind an explicit `E2E_CACHE_MODE`. A focused cache-policy shell module owns validation, cache preparation, snapshots, disk-pressure classification, and emergency pruning; existing runner scripts consume that interface. Use the LearnCard planning branch as the fixed baseline revision and a disposable `@learncard/types` probe branch for invalidation.

**Tech Stack:** Bash, GitHub Actions YAML, Docker BuildKit and Compose, Nx local cache, Bun/Node-hosted Nx and Playwright, `gh`, Jira through Atlassian Rovo.

## Global Constraints

-   Warm-run target: 12 minutes or less for the current seven Firefox tests.
-   Fixed non-Playwright overhead target: 6 minutes or less, measured as workflow wall-clock time minus the Playwright stage.
-   Playwright remains at one worker; test selection remains `consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts`.
-   Every experiment leg must invoke the Docker base build, Docker Compose build, and host Nx build; whole-build commit-marker skips are forbidden.
-   Containers, networks, and Compose volumes are removed after every run; MongoDB, Neo4j, Redis, ElasticMQ, and application data are never retained as cache.
-   Docker images, BuildKit layers, and `.nx-cache` are retained only according to the selected cache policy.
-   Comparable warm runs require at least 25 GB free and no emergency prune.
-   Cold preflight clears native caches, but post-run cleanup retains the newly generated caches so they seed warm run 1.
-   Local tests must use fakes and must never invoke a real Docker prune.
-   Manual runner-repository experiments run only while the LearnCard release E2E workflow is idle.
-   Preserve the original build/test exit status when cleanup or artifact collection encounters an error.

## Execution Prerequisites

-   Use the `superpowers:using-git-worktrees` workflow before Task 1 to create an
    isolated runner worktree on `codex/lc-2073-phase-2b-runner`.
-   The existing local runner checkout is stale at `37f1d37`; fetch remote `main` and
    verify the implementation worktree starts at or after merged runner commit
    `ba0370e585482369466ec2b505f505c1fe47abf2`.
-   Preserve the runner checkout's unrelated untracked `.DS_Store`; do not stage,
    modify, or delete it.
-   Continue using the existing isolated LearnCard worktree at
    `/Users/donny/Work/LearnCard/.worktrees/lc-2073-phase-2b` for planning, the fixed
    LearnCard baseline, and the final results document.

## Repository and File Map

### `WeLibraryOS/learncard-e2e-runner`

-   Create `scripts/cache-policy.sh`: validation, safe Nx-cache removal, Docker pruning, cache snapshots, comparability result, and disk guard.
-   Create `tests/cache-policy.test.sh`: behavioral tests using function overrides and temporary directories.
-   Create `tests/cache-integration.test.sh`: runner-script contracts for sync, build, cleanup, and workflow wiring.
-   Modify `scripts/common.sh`: source the cache-policy module and retire the old implicit low-space pruner.
-   Modify `scripts/sync-repo.sh`: validate mode, run cache preflight, and preserve `.nx-cache` only in warm mode.
-   Modify `scripts/run-tests.sh`: always invoke builds, remove marker skips, and retain plain build logs.
-   Modify `scripts/cleanup.sh`: remove mutable Compose state, evaluate disk safety, and retain build caches unless recovery is required.
-   Modify `scripts/artifacts.sh`: record cache mode in metadata and preserve new cache evidence.
-   Modify `scripts/metrics.sh`: include cache comparability at the top of the job summary.
-   Modify `tests/artifacts.test.sh`: verify cache metadata and manifest contents.
-   Modify `tests/metrics.test.sh`: verify cache summary rendering.
-   Modify `tests/scripts-syntax.test.sh`: automatically covers the new shell files through its existing globs.
-   Modify `.github/workflows/run-e2e-tests.yml`: explicit cache-mode input, runner-repository serialization, and SSH propagation.
-   Modify `README.md`: document cold/warm semantics, dispatch commands, artifacts, and disk behavior.

### `learningeconomy/LearnCard`

-   Existing `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-design.md`: approved design source.
-   Existing `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-implementation.md`: this execution plan.
-   Temporarily modify `packages/learn-card-types/src/index.ts` only on the disposable invalidation branch.
-   Create `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md`: measured results, decision, ranked fixes, and acceptance-test script.

---

### Task 1: Implement Cache-Mode Validation and Safe Nx-Cache Handling

**Files:**

-   Create: `scripts/cache-policy.sh`
-   Create: `tests/cache-policy.test.sh`

**Interfaces:**

-   Consumes: `WORKSPACE_DIR`, `APP_DIR`, `E2E_ARTIFACT_DIR`, and `E2E_CACHE_MODE`
    exported by runner scripts, plus `force_remove_known_containers()` from
    `scripts/common.sh` when executing on the runner.
-   Produces: `cache_validate_mode()`, `cache_should_preserve_nx()`, `cache_nx_dir()`, and `cache_remove_nx()`.

-   [ ] **Step 1: Write the failing cache-mode tests**

Create `tests/cache-policy.test.sh` with the test harness and validation cases:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_TMP="$(mktemp -d)"
trap 'status=$?; rm -rf "$TEST_TMP"; exit "$status"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }

export WORKSPACE_DIR="$TEST_TMP/workspace/LearnCard"
export E2E_ARTIFACT_DIR="$TEST_TMP/artifacts"
mkdir -p "$WORKSPACE_DIR/.nx-cache" "$E2E_ARTIFACT_DIR"
printf 'sentinel\n' > "$WORKSPACE_DIR/.nx-cache/sentinel"

source "$REPO_ROOT/scripts/cache-policy.sh"

E2E_CACHE_MODE=cold cache_validate_mode
E2E_CACHE_MODE=warm cache_validate_mode
set +e
E2E_CACHE_MODE=invalid cache_validate_mode >/dev/null 2>&1
INVALID_STATUS=$?
E2E_CACHE_MODE= cache_validate_mode >/dev/null 2>&1
MISSING_STATUS=$?
set -e
[[ "$INVALID_STATUS" -ne 0 ]] || fail "invalid mode was accepted"
[[ "$MISSING_STATUS" -ne 0 ]] || fail "missing mode was accepted"

E2E_CACHE_MODE=warm
cache_should_preserve_nx || fail "warm mode did not preserve Nx"
E2E_CACHE_MODE=cold
! cache_should_preserve_nx || fail "cold mode preserved Nx"

cache_remove_nx
[[ ! -e "$WORKSPACE_DIR/.nx-cache" ]] || fail "cold Nx cache was not removed"

UNSAFE_WORKSPACE=/
WORKSPACE_DIR="$UNSAFE_WORKSPACE"
set +e
cache_remove_nx >/dev/null 2>&1
UNSAFE_STATUS=$?
set -e
[[ "$UNSAFE_STATUS" -ne 0 ]] || fail "unsafe Nx path was accepted"

export WORKSPACE_DIR="$TEST_TMP/workspace/LearnCard"

echo "cache policy tests passed"
```

-   [ ] **Step 2: Run the new test and verify it fails**

Run: `bash tests/cache-policy.test.sh`

Expected: FAIL because `scripts/cache-policy.sh` does not exist.

-   [ ] **Step 3: Implement the minimal safe cache-mode API**

Create `scripts/cache-policy.sh` with these functions:

```bash
#!/usr/bin/env bash

cache_validate_mode() {
    case "${E2E_CACHE_MODE:-}" in
        cold | warm) return 0 ;;
        *)
            echo "ERROR: E2E_CACHE_MODE must be 'cold' or 'warm'" >&2
            return 2
            ;;
    esac
}

cache_should_preserve_nx() {
    [[ "${E2E_CACHE_MODE:-}" == "warm" ]]
}

cache_nx_dir() {
    printf '%s/.nx-cache\n' "$WORKSPACE_DIR"
}

cache_remove_nx() {
    local nx_dir
    nx_dir="$(cache_nx_dir)"
    [[ -n "${WORKSPACE_DIR:-}" && "$WORKSPACE_DIR" != "/" ]] || {
        echo "ERROR: unsafe WORKSPACE_DIR '$WORKSPACE_DIR'" >&2
        return 2
    }
    [[ "$nx_dir" == "$WORKSPACE_DIR/.nx-cache" ]] || {
        echo "ERROR: unsafe Nx cache path '$nx_dir'" >&2
        return 2
    }
    rm -rf "$nx_dir"
}
```

-   [ ] **Step 4: Run the focused tests**

Run: `bash tests/cache-policy.test.sh`

Expected: `cache policy tests passed`.

-   [ ] **Step 5: Run syntax verification**

Run: `bash tests/scripts-syntax.test.sh`

Expected: `script syntax tests passed`.

-   [ ] **Step 6: Commit Task 1**

```bash
git add scripts/cache-policy.sh tests/cache-policy.test.sh
git commit -m "test(e2e): define safe cache modes"
```

---

### Task 2: Add Docker Cache Lifecycle, Snapshots, and Disk Classification

**Files:**

-   Modify: `scripts/cache-policy.sh`
-   Modify: `tests/cache-policy.test.sh`

**Interfaces:**

-   Consumes: Task 1 cache validation and Nx helpers.
-   Produces: `cache_prepare()`, `cache_finalize()`, `cache_capture_snapshot()`, `cache_full_docker_prune()`, `cache_free_disk_gb()`, and `cache_write_result()`.

-   [ ] **Step 1: Add failing lifecycle cases to the cache-policy test**

Insert these cases before the final success message so every assertion runs before
`cache policy tests passed`:

```bash
CALLS_FILE="$TEST_TMP/calls.log"
: > "$CALLS_FILE"
cache_full_docker_prune() { printf 'docker-prune\n' >> "$CALLS_FILE"; }
cache_capture_snapshot() { printf 'snapshot:%s\n' "$1" >> "$CALLS_FILE"; }

mkdir -p "$WORKSPACE_DIR/.nx-cache"
printf 'sentinel\n' > "$WORKSPACE_DIR/.nx-cache/sentinel"
E2E_CACHE_MODE=cold cache_prepare
[[ ! -e "$WORKSPACE_DIR/.nx-cache" ]] || fail "cold preflight retained Nx"
[[ "$(grep -c '^docker-prune$' "$CALLS_FILE")" -eq 1 ]] || fail "cold preflight did not prune once"

: > "$CALLS_FILE"
mkdir -p "$WORKSPACE_DIR/.nx-cache"
printf 'sentinel\n' > "$WORKSPACE_DIR/.nx-cache/sentinel"
E2E_CACHE_MODE=warm cache_prepare
[[ -f "$WORKSPACE_DIR/.nx-cache/sentinel" ]] || fail "warm preflight removed Nx"
[[ ! -s "$CALLS_FILE" || "$(grep -c '^docker-prune$' "$CALLS_FILE" || true)" -eq 0 ]] || fail "warm preflight pruned"

: > "$CALLS_FILE"
cache_capture_snapshot() { :; }
cache_free_disk_gb() { echo 40; }
E2E_CACHE_MODE=warm cache_finalize
grep -q '^comparable=true$' "$E2E_ARTIFACT_DIR/cache-result.env" || fail "safe warm run was not comparable"

cache_free_disk_gb() { echo 10; }
E2E_CACHE_MODE=warm cache_finalize
grep -q '^comparable=false$' "$E2E_ARTIFACT_DIR/cache-result.env" || fail "low-disk run remained comparable"
grep -q '^reason=cache-invalidated-by-disk-pressure$' "$E2E_ARTIFACT_DIR/cache-result.env" || fail "low-disk reason missing"
[[ "$(grep -c '^docker-prune$' "$CALLS_FILE")" -eq 1 ]] || fail "emergency prune did not run"
```

-   [ ] **Step 2: Run the test and verify the new cases fail**

Run: `bash tests/cache-policy.test.sh`

Expected: FAIL because lifecycle functions are undefined.

-   [ ] **Step 3: Implement cache snapshots and lifecycle functions**

Add the following behavior to `scripts/cache-policy.sh`:

```bash
E2E_MIN_FREE_DISK_GB="${E2E_MIN_FREE_DISK_GB:-25}"

cache_free_disk_gb() {
    df -Pk / | awk 'NR == 2 {print int($4 / 1024 / 1024)}'
}

cache_full_docker_prune() {
    cache_stop_mutable_runtime
    docker system prune -a --volumes -f
    docker builder prune -a -f
}

cache_stop_mutable_runtime() {
    if [[ -f "${APP_DIR:-}/compose.yaml" ]]; then
        (cd "$APP_DIR" && docker compose down --remove-orphans -v 2>/dev/null) || true
    fi
    if declare -F force_remove_known_containers >/dev/null 2>&1; then
        force_remove_known_containers
    fi
}

cache_capture_snapshot() {
    local phase="$1" nx_kib=0
    mkdir -p "$E2E_ARTIFACT_DIR"
    [[ ! -d "$(cache_nx_dir)" ]] || nx_kib="$(du -sk "$(cache_nx_dir)" | awk '{print $1}')"
    {
        printf 'phase=%s\n' "$phase"
        printf 'cache_mode=%s\n' "$E2E_CACHE_MODE"
        printf 'free_disk_gb=%s\n' "$(cache_free_disk_gb)"
        printf 'nx_cache_kib=%s\n' "$nx_kib"
        echo 'docker_system_df:'
        docker system df 2>&1 || true
        echo 'docker_buildx_du:'
        docker buildx du 2>&1 || true
    } > "$E2E_ARTIFACT_DIR/cache-$phase.txt"
}

cache_write_result() {
    local comparable="$1" reason="$2"
    mkdir -p "$E2E_ARTIFACT_DIR"
    {
        printf 'cache_mode=%s\n' "$E2E_CACHE_MODE"
        printf 'comparable=%s\n' "$comparable"
        printf 'reason=%s\n' "$reason"
    } > "$E2E_ARTIFACT_DIR/cache-result.env"
    {
        echo '## Cache experiment'
        echo
        printf -- '- Mode: `%s`\n' "$E2E_CACHE_MODE"
        printf -- '- Comparable: `%s`\n' "$comparable"
        printf -- '- Reason: `%s`\n' "$reason"
    } > "$E2E_ARTIFACT_DIR/cache-summary.md"
}

cache_prepare() {
    cache_validate_mode
    cache_capture_snapshot preflight-before
    if [[ "$E2E_CACHE_MODE" == "cold" ]]; then
        cache_remove_nx
        cache_full_docker_prune
    fi
    cache_capture_snapshot preflight-after
}

cache_finalize() {
    local free_disk_gb
    cache_validate_mode
    cache_capture_snapshot post-run-before-recovery
    free_disk_gb="$(cache_free_disk_gb)"
    if (( free_disk_gb < E2E_MIN_FREE_DISK_GB )); then
        cache_write_result false cache-invalidated-by-disk-pressure
        cache_full_docker_prune
        cache_capture_snapshot post-recovery
    else
        cache_write_result true retained-within-disk-boundary
    fi
}
```

-   [ ] **Step 4: Run cache-policy and syntax tests**

Run:

```bash
bash tests/cache-policy.test.sh
bash tests/scripts-syntax.test.sh
```

Expected: both commands pass; the fake prune log proves local tests did not call Docker.

-   [ ] **Step 5: Commit Task 2**

```bash
git add scripts/cache-policy.sh tests/cache-policy.test.sh
git commit -m "feat(e2e): classify retained cache safety"
```

---

### Task 3: Integrate Cache Policy into Sync and Cleanup

**Files:**

-   Modify: `scripts/common.sh`
-   Modify: `scripts/sync-repo.sh`
-   Modify: `scripts/run-tests.sh`
-   Modify: `scripts/cleanup.sh`
-   Create: `tests/cache-integration.test.sh`

**Interfaces:**

-   Consumes: `cache_validate_mode()`, `cache_should_preserve_nx()`, `cache_prepare()`, and `cache_finalize()` from Tasks 1–2.
-   Produces: a runner lifecycle in which preflight happens before sync, warm sync preserves `.nx-cache`, and cleanup never prunes a comparable cache.

-   [ ] **Step 1: Write failing runner-contract tests**

Create `tests/cache-integration.test.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail() { echo "FAIL: $*" >&2; exit 1; }

grep -q 'source "$SCRIPT_DIR/scripts/cache-policy.sh"' "$REPO_ROOT/scripts/common.sh" || fail "common does not source cache policy"
grep -q 'run_timed cache_prepare cache_prepare' "$REPO_ROOT/scripts/sync-repo.sh" || fail "sync lacks timed cache preflight"
grep -q 'cache_should_preserve_nx' "$REPO_ROOT/scripts/sync-repo.sh" || fail "sync lacks warm Nx preservation"
grep -q 'run_timed cache_finalize cache_finalize' "$REPO_ROOT/scripts/cleanup.sh" || fail "cleanup lacks cache finalization"
! grep -q 'run_timed docker_prune prune_docker' "$REPO_ROOT/scripts/cleanup.sh" || fail "cleanup still prunes every run"
! grep -q 'rm -rf "$WORKSPACE_DIR/.nx"' "$REPO_ROOT/scripts/run-tests.sh" || fail "run-tests still deletes Nx state"
! grep -q '^prune_if_low_space$' "$REPO_ROOT/scripts/run-tests.sh" || fail "run-tests can silently prune warm cache"

echo "cache integration tests passed"
```

-   [ ] **Step 2: Run the contract test and verify failure**

Run: `bash tests/cache-integration.test.sh`

Expected: FAIL on the first missing integration.

-   [ ] **Step 3: Source the policy and remove the legacy implicit pruner**

In `scripts/common.sh`, source the new module after artifacts/metrics:

```bash
source "$SCRIPT_DIR/scripts/metrics.sh"
source "$SCRIPT_DIR/scripts/artifacts.sh"
source "$SCRIPT_DIR/scripts/cache-policy.sh"
```

Delete `prune_if_low_space()`. All pruning decisions now flow through the explicit policy and create evidence.

-   [ ] **Step 4: Add preflight and policy-aware `git clean` to sync**

After `metrics_init` and the initial metadata capture in `scripts/sync-repo.sh`, add:

```bash
cache_validate_mode
run_timed cache_prepare cache_prepare
```

Replace the fixed `git clean` invocation with:

```bash
local -a clean_args=(-fdx -e node_modules -e .last-bun-lockfile-hash)
if cache_should_preserve_nx; then
    clean_args+=(-e .nx-cache)
fi
git clean "${clean_args[@]}"
```

Do not preserve `.last-docker-build`; Task 4 removes whole-build marker logic.

-   [ ] **Step 5: Remove unconditional cache deletion and pruning from run/cleanup**

Delete the `.nx`, `.nx-cache`, and `node_modules/.cache/nx` removal block and the `prune_if_low_space` call from `scripts/run-tests.sh`.

Replace `prune_docker()` and its timed invocation in `scripts/cleanup.sh` with:

```bash
run_timed compose_cleanup cleanup_compose
run_timed cache_finalize cache_finalize
collect_run_artifacts "$APP_DIR"
```

Keep `docker compose down --remove-orphans -v`, fixed-name container removal, and network cleanup so mutable state is still destroyed.

-   [ ] **Step 6: Run integration and regression tests**

Run:

```bash
bash tests/cache-integration.test.sh
bash tests/cache-policy.test.sh
bash tests/artifacts.test.sh
bash tests/metrics.test.sh
bash tests/run-tests-finalizer.test.sh
bash tests/scripts-syntax.test.sh
```

Expected: all six scripts pass.

-   [ ] **Step 7: Commit Task 3**

```bash
git add scripts/common.sh scripts/sync-repo.sh scripts/run-tests.sh scripts/cleanup.sh tests/cache-integration.test.sh
git commit -m "feat(e2e): apply explicit cache lifecycle"
```

---

### Task 4: Always Execute Builds and Preserve Auditable Build Logs

**Files:**

-   Modify: `scripts/run-tests.sh`
-   Modify: `tests/cache-integration.test.sh`

**Interfaces:**

-   Consumes: `E2E_ARTIFACT_DIR` initialized during sync and retained across the run.
-   Produces: `docker-base-build.log`, `docker-compose-build.log`, and `host-nx-build.log`, with pipeline failures propagated through `tee`.

-   [ ] **Step 1: Add failing always-build/log contracts**

Insert these assertions before the final success message in
`tests/cache-integration.test.sh`:

```bash
grep -q '^set -eo pipefail$' "$REPO_ROOT/scripts/run-tests.sh" || fail "run-tests lacks pipefail"
! grep -q 'LAST_BUILD_FILE' "$REPO_ROOT/scripts/run-tests.sh" || fail "commit marker still controls builds"
! grep -q 'SKIP_BUILD' "$REPO_ROOT/scripts/run-tests.sh" || fail "build skip remains enabled"
! grep -q 'FORCE_BUILD' "$REPO_ROOT/scripts/run-tests.sh" || fail "force-build branch remains"
grep -q 'run_timed docker_base_build build_monorepo_image' "$REPO_ROOT/scripts/run-tests.sh" || fail "base build is not always invoked"
grep -q 'run_timed docker_compose_build docker_compose_build' "$REPO_ROOT/scripts/run-tests.sh" || fail "Compose build is not always invoked"
grep -q 'docker-base-build.log' "$REPO_ROOT/scripts/run-tests.sh" || fail "base build log missing"
grep -q 'docker-compose-build.log' "$REPO_ROOT/scripts/run-tests.sh" || fail "Compose build log missing"
grep -q 'host-nx-build.log' "$REPO_ROOT/scripts/run-tests.sh" || fail "host Nx log missing"
```

-   [ ] **Step 2: Run the contract test and verify failure**

Run: `bash tests/cache-integration.test.sh`

Expected: FAIL because commit-marker branches and missing logs remain.

-   [ ] **Step 3: Replace conditional builds with native-cache builds**

Change the script header to `set -eo pipefail`. Remove `SKIP_BUILD`, `FORCE_BUILD`, `CURRENT_COMMIT`, `LAST_BUILD_FILE`, `images_exist()`, and their conditional block.

Use these build functions and unconditional timed calls:

```bash
build_monorepo_image() {
    echo "Building shared monorepo base image..."
    docker build --progress=plain -t learncard-monorepo-local -f ../../Dockerfile.monorepo ../.. 2>&1 \
        | tee "$E2E_ARTIFACT_DIR/docker-base-build.log"
}

docker_compose_build() {
    BUILDKIT_PROGRESS=plain docker compose build --parallel 2>&1 \
        | tee "$E2E_ARTIFACT_DIR/docker-compose-build.log"
}

run_timed docker_base_build build_monorepo_image
run_timed docker_compose_build docker_compose_build
```

-   [ ] **Step 4: Capture the host Nx build log without hiding failures**

Replace the host Nx invocation with:

```bash
"$WORKSPACE_DIR/node_modules/.bin/nx" run-many -t build -p types,init,lca-api-plugin --verbose 2>&1 \
    | tee "$E2E_ARTIFACT_DIR/host-nx-build.log"
```

`set -o pipefail` ensures a failing Docker/Nx command remains a failing timed stage.

-   [ ] **Step 5: Run integration, finalizer, and syntax tests**

Run:

```bash
bash tests/cache-integration.test.sh
bash tests/run-tests-finalizer.test.sh
bash tests/scripts-syntax.test.sh
```

Expected: all pass.

-   [ ] **Step 6: Commit Task 4**

```bash
git add scripts/run-tests.sh tests/cache-integration.test.sh
git commit -m "feat(e2e): measure native build cache hits"
```

---

### Task 5: Add Cache Evidence to Metadata, Manifest, and Summary

**Files:**

-   Modify: `scripts/artifacts.sh`
-   Modify: `scripts/metrics.sh`
-   Modify: `tests/artifacts.test.sh`
-   Modify: `tests/metrics.test.sh`

**Interfaces:**

-   Consumes: `E2E_CACHE_MODE`, `cache-summary.md`, `cache-result.env`, cache snapshots, and build logs created by earlier tasks.
-   Produces: cache mode in `metadata.txt`, cache result at the top of `summary.md`, and a manifest containing every cache evidence file.

-   [ ] **Step 1: Write failing artifact and summary assertions**

In `tests/artifacts.test.sh`, set `E2E_CACHE_MODE=warm` before metadata capture and
insert these assertions before the final success message:

```bash
grep -q '^cache_mode=warm$' "$E2E_ARTIFACT_DIR/metadata.txt" || fail "cache mode missing"
printf 'cache_mode=warm\ncomparable=true\nreason=retained-within-disk-boundary\n' > "$E2E_ARTIFACT_DIR/cache-result.env"
printf 'base cache log\n' > "$E2E_ARTIFACT_DIR/docker-base-build.log"
collect_run_artifacts "$APP_FIXTURE"
grep -q './cache-result.env' "$E2E_ARTIFACT_DIR/manifest.txt" || fail "cache result missing from manifest"
grep -q './docker-base-build.log' "$E2E_ARTIFACT_DIR/manifest.txt" || fail "build log missing from manifest"
```

In `tests/metrics.test.sh`, before the final success message, add:

```bash
printf '## Cache experiment\n\n- Mode: `warm`\n- Comparable: `true`\n' > "$E2E_ARTIFACT_DIR/cache-summary.md"
render_metrics_summary
grep -q '^## Cache experiment$' "$E2E_ARTIFACT_DIR/summary.md" || fail "cache summary missing"
grep -q '^# E2E stage timings$' "$E2E_ARTIFACT_DIR/summary.md" || fail "timing summary missing"
```

-   [ ] **Step 2: Run both tests and verify failure**

Run:

```bash
bash tests/artifacts.test.sh
bash tests/metrics.test.sh
```

Expected: metadata and summary assertions fail.

-   [ ] **Step 3: Record cache mode in host metadata**

Add this line to `capture_host_metadata()` in `scripts/artifacts.sh`:

```bash
printf 'cache_mode=%s\n' "${E2E_CACHE_MODE:-unavailable}"
```

-   [ ] **Step 4: Render cache classification before timing rows**

At the start of `render_metrics_summary()` output in `scripts/metrics.sh`, add:

```bash
if [[ -f "$E2E_ARTIFACT_DIR/cache-summary.md" ]]; then
    cat "$E2E_ARTIFACT_DIR/cache-summary.md"
    echo
fi
```

At the end of `cache_finalize()`, call `render_metrics_summary` after writing the cache result so the downloaded job summary includes the final classification.

-   [ ] **Step 5: Run artifact, metrics, cache, and syntax tests**

Run:

```bash
bash tests/artifacts.test.sh
bash tests/metrics.test.sh
bash tests/cache-policy.test.sh
bash tests/scripts-syntax.test.sh
```

Expected: all pass.

-   [ ] **Step 6: Commit Task 5**

```bash
git add scripts/artifacts.sh scripts/metrics.sh scripts/cache-policy.sh tests/artifacts.test.sh tests/metrics.test.sh
git commit -m "test(e2e): publish cache evidence"
```

---

### Task 6: Wire Cache Mode Through GitHub Actions and Document Operation

**Files:**

-   Modify: `.github/workflows/run-e2e-tests.yml`
-   Modify: `README.md`
-   Modify: `tests/cache-integration.test.sh`

**Interfaces:**

-   Consumes: the runner's `E2E_CACHE_MODE` contract.
-   Produces: required manual `cache_mode`, serialized runner-repository experiments, and `E2E_CACHE_MODE` in both run and cleanup SSH sessions.

-   [ ] **Step 1: Add failing workflow contracts**

Insert these assertions before the final success message in
`tests/cache-integration.test.sh`:

```bash
WORKFLOW="$REPO_ROOT/.github/workflows/run-e2e-tests.yml"
grep -q '^      cache_mode:$' "$WORKFLOW" || fail "cache_mode input missing"
grep -q '^  E2E_CACHE_MODE:' "$WORKFLOW" || fail "cache mode env missing"
[[ "$(grep -c 'envs:.*E2E_CACHE_MODE' "$WORKFLOW")" -eq 2 ]] || fail "cache mode not passed to both SSH steps"
grep -q '^    concurrency:$' "$WORKFLOW" || fail "runner job is not serialized"
grep -q 'group: learncard-e2e-ec2' "$WORKFLOW" || fail "shared EC2 group missing"
```

-   [ ] **Step 2: Run the contract test and verify failure**

Run: `bash tests/cache-integration.test.sh`

Expected: FAIL because workflow wiring is absent.

-   [ ] **Step 3: Add explicit workflow input, environment, and serialization**

Add this `workflow_dispatch` input:

```yaml
cache_mode:
    description: 'Cache mode for the controlled experiment'
    required: true
    type: choice
    options:
        - cold
        - warm
```

Add the environment mapping without a fallback on the experimental branch:

```yaml
E2E_CACHE_MODE: ${{ github.event.client_payload.cache_mode || github.event.inputs.cache_mode || '' }}
```

Add job-level serialization:

```yaml
concurrency:
    group: learncard-e2e-ec2
    cancel-in-progress: false
```

Extend the run SSH action to `envs: BRANCH,TEST_FILES,RUNNER_REF,E2E_CACHE_MODE`. Add `envs: E2E_CACHE_MODE` to the cleanup SSH action.

-   [ ] **Step 4: Update README operational commands and semantics**

Document these exact manual commands:

```bash
gh workflow run run-e2e-tests.yml --repo WeLibraryOS/learncard-e2e-runner \
  --ref codex/lc-2073-phase-2b-runner \
  -f runner_ref=codex/lc-2073-phase-2b-runner \
  -f branch=codex/lc-2073-phase-2b \
  -f cache_mode=cold \
  -f test_files='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'
```

Explain that warm mode retains build caches but deletes Compose volumes, and that a low-disk emergency prune makes the result non-comparable.

-   [ ] **Step 5: Verify workflow, docs, and scripts**

Run:

```bash
bash tests/cache-integration.test.sh
bash tests/scripts-syntax.test.sh
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/run-e2e-tests.yml')"
bunx prettier --check .github/workflows/run-e2e-tests.yml README.md
```

Expected: all commands exit 0.

-   [ ] **Step 6: Commit Task 6**

```bash
git add .github/workflows/run-e2e-tests.yml README.md tests/cache-integration.test.sh
git commit -m "ci(e2e): expose controlled cache modes"
```

---

### Task 7: Run the Full Local Gate and Open the Runner Draft PR

**Files:**

-   Verify all runner changes from Tasks 1–6.

**Interfaces:**

-   Consumes: complete runner implementation.
-   Produces: a pushed runner branch and draft PR that can be selected with `runner_ref`.

-   [ ] **Step 1: Run every runner behavior test**

Run:

```bash
bash tests/cache-policy.test.sh
bash tests/cache-integration.test.sh
bash tests/metrics.test.sh
bash tests/artifacts.test.sh
bash tests/run-tests-finalizer.test.sh
bash tests/scripts-syntax.test.sh
```

Expected: six passing test scripts and zero failures.

-   [ ] **Step 2: Run formatting, YAML, and whitespace verification**

Run:

```bash
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/run-e2e-tests.yml')"
bunx prettier --check .github/workflows/run-e2e-tests.yml README.md
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: YAML parses, Prettier passes, no whitespace errors, and only intentional branch commits differ from `origin/main`.

-   [ ] **Step 3: Review the branch against the approved constraints**

Confirm with exact searches:

```bash
rg -n 'SKIP_BUILD|FORCE_BUILD|LAST_BUILD_FILE|run_timed docker_prune' scripts README.md
rg -n 'docker compose down.*-v|cache_prepare|cache_finalize|E2E_CACHE_MODE' scripts .github/workflows/run-e2e-tests.yml
```

Expected: the first search returns no active implementation; the second shows mutable-state cleanup, explicit preflight/finalization, and workflow propagation.

-   [ ] **Step 4: Push and open the draft runner PR**

Use the `github:yeet` workflow to push `codex/lc-2073-phase-2b-runner` and open a draft PR titled:

```text
ci(e2e): [LC-2073 Phase 2B] measure retained native caches
```

The PR body must state that the branch is experimental, list the cold/warm/invalidation sequence, link the approved design, and avoid recommending a production default before live evidence exists.

---

### Task 8: Push the Fixed LearnCard Baseline and Run Cold/Warm/Warm

**Files:**

-   No new code changes before dispatch.
-   Record run identifiers for the results document.

**Interfaces:**

-   Consumes: runner draft branch, LearnCard `codex/lc-2073-phase-2b`, and both workflows' idle state.
-   Produces: three diagnostic bundles using identical runner and LearnCard revisions.

-   [ ] **Step 1: Verify no shared-EC2 workflow is active**

Run:

```bash
gh run list --repo learningeconomy/LearnCard --workflow test.yml --status in_progress --json databaseId,headBranch,status,url
gh run list --repo WeLibraryOS/learncard-e2e-runner --workflow run-e2e-tests.yml --status in_progress --json databaseId,headBranch,status,url
```

Expected: both commands return `[]`. If either lists a run, wait for it to finish before dispatching.

-   [ ] **Step 2: Push the fixed LearnCard planning branch**

Push `codex/lc-2073-phase-2b` without rebasing after the first experiment leg. Record its commit with:

```bash
git rev-parse HEAD
```

Use that exact LearnCard revision for all three comparable runs.

-   [ ] **Step 3: Dispatch and watch the cold run**

Run the documented workflow command with `cache_mode=cold`, then obtain and watch the newest branch run:

```bash
gh run list --repo WeLibraryOS/learncard-e2e-runner --workflow run-e2e-tests.yml --branch codex/lc-2073-phase-2b-runner --limit 1 --json databaseId,url,status,conclusion
gh run watch --repo WeLibraryOS/learncard-e2e-runner "$COLD_RUN_ID" --exit-status
```

Set `COLD_RUN_ID` to the returned database ID. Expected: the run passes and uploads `e2e-diagnostics-$COLD_RUN_ID`.

-   [ ] **Step 4: Download and verify the cold artifact**

Run:

```bash
mkdir -p /tmp/lc-2073-phase-2b/cold
gh run download --repo WeLibraryOS/learncard-e2e-runner "$COLD_RUN_ID" -n "e2e-diagnostics-$COLD_RUN_ID" -D /tmp/lc-2073-phase-2b/cold
grep -E '^(runner_revision|learncard_revision|cache_mode)=' /tmp/lc-2073-phase-2b/cold/metadata.txt
grep -E '^(cache_mode|comparable|reason)=' /tmp/lc-2073-phase-2b/cold/cache-result.env
```

Expected: revisions match the pinned commits, mode is cold, and the artifact contains timings, cache snapshots, build logs, Playwright JSON/HTML, and disk evidence.

-   [ ] **Step 5: Dispatch, watch, and download warm run 1**

Repeat Steps 3–4 with `cache_mode=warm`, set `WARM1_RUN_ID`, and download to `/tmp/lc-2073-phase-2b/warm1`.

Expected: seven tests pass, `comparable=true`, and build logs show native cache reuse without skipping the build commands.

-   [ ] **Step 6: Dispatch, watch, and download warm run 2**

Repeat Steps 3–4 with `cache_mode=warm`, set `WARM2_RUN_ID`, and download to `/tmp/lc-2073-phase-2b/warm2`.

Expected: seven tests pass, `comparable=true`, and the job completes in 12 minutes or less with fixed overhead at 6 minutes or less.

-   [ ] **Step 7: Compare the three runs before invalidation**

Run:

```bash
for leg in cold warm1 warm2; do
    echo "$leg"
    sed -n '1,30p' "/tmp/lc-2073-phase-2b/$leg/summary.md"
    grep -E '^(free_disk_gb|nx_cache_kib)=' "/tmp/lc-2073-phase-2b/$leg/cache-post-run-before-recovery.txt"
done
```

Expected: warm runs remain comparable, disk stays within the boundary, and timings are ready for the results table.

---

### Task 9: Prove Invalidation with a Disposable `@learncard/types` Change

**Files:**

-   Temporarily modify on disposable branch: `packages/learn-card-types/src/index.ts`

**Interfaces:**

-   Consumes: cache state from warm run 2 and the pinned LearnCard baseline.
-   Produces: one green invalidation artifact showing Nx and Docker re-execution from a representative workspace dependency change.

-   [ ] **Step 1: Create the disposable invalidation branch from the pinned baseline**

Create `codex/lc-2073-phase-2b-invalidation` from the exact commit used in Task 8. Confirm the parent with:

```bash
git merge-base --is-ancestor codex/lc-2073-phase-2b HEAD
```

Expected: exit 0.

-   [ ] **Step 2: Add the deterministic invalidation probe**

Add this documented temporary export to `packages/learn-card-types/src/index.ts`:

```typescript
/** Temporary LC-2073 cache-invalidation probe; this branch is never merged. */
export const LC2073_CACHE_INVALIDATION_PROBE = 'phase-2b-2026-08-10';
```

-   [ ] **Step 3: Verify the probe builds before pushing**

Run:

```bash
bunx nx build types
git diff --check
```

Expected: the `types` build passes and only the probe change is present.

-   [ ] **Step 4: Commit and push the disposable branch**

```bash
git add packages/learn-card-types/src/index.ts
git commit -m "test(ci): add LC-2073 cache invalidation probe"
git push -u origin codex/lc-2073-phase-2b-invalidation
```

-   [ ] **Step 5: Dispatch the invalidation run in warm mode**

Use the runner workflow with:

```text
runner_ref=codex/lc-2073-phase-2b-runner
branch=codex/lc-2073-phase-2b-invalidation
cache_mode=warm
test_files=consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts
```

Set `INVALIDATION_RUN_ID`, watch it to completion, and download the artifact to `/tmp/lc-2073-phase-2b/invalidation`.

Expected: seven tests pass and the run remains within the disk boundary.

-   [ ] **Step 6: Verify cache invalidation from logs**

Inspect:

```bash
rg -n 'types|cache|cached|CACHED' /tmp/lc-2073-phase-2b/invalidation/host-nx-build.log /tmp/lc-2073-phase-2b/invalidation/docker-base-build.log /tmp/lc-2073-phase-2b/invalidation/docker-compose-build.log
```

Expected: the `types` task and Docker work affected by the whole-repository context re-execute; cache use by unaffected layers is recorded where present. A coarse Docker rebuild is a performance finding, not a correctness failure.

---

### Task 10: Apply the Evidence-Based Default and Run Final Acceptance

**Files:**

-   Modify conditionally: `.github/workflows/run-e2e-tests.yml`
-   Modify conditionally: `scripts/cache-policy.sh`
-   Modify conditionally: `tests/cache-policy.test.sh`
-   Modify conditionally: `tests/cache-integration.test.sh`
-   Modify: `README.md`

**Interfaces:**

-   Consumes: all four live artifacts and the design's decision rules.
-   Produces: the final runner PR state and one acceptance run of the selected default.

-   [ ] **Step 1: Calculate the gates from evidence**

For each run, record GitHub job wall-clock duration, Playwright seconds from `timings.tsv`, fixed overhead as their difference, cache comparability, test counts, free disk, and Nx/Docker cache sizes.

Classify the outcome exactly:

```text
PASS_FAST: correctness passes, warm 2 <= 12m, fixed overhead <= 6m, disk safe
PASS_SLOW: correctness and disk pass, but either time target is missed
FAIL_CACHE: invalidation is incorrect, tests fail from stale state, or disk is unsafe
```

-   [ ] **Step 2: Write a failing test for the selected default**

For `PASS_FAST` or `PASS_SLOW`, update tests to require missing runtime input to resolve to warm only after final adoption:

```bash
unset E2E_CACHE_MODE
cache_apply_default
[[ "$E2E_CACHE_MODE" == "warm" ]] || fail "adopted runner default is not warm"
```

For `FAIL_CACHE`, require the workflow default to remain cold:

```bash
grep -q "default: 'cold'" "$WORKFLOW" || fail "failed cache policy did not retain cold default"
```

Run the focused test and confirm failure before implementation.

-   [ ] **Step 3: Apply the exact outcome patch**

-   `PASS_FAST` or `PASS_SLOW`: add `cache_apply_default() { E2E_CACHE_MODE="${E2E_CACHE_MODE:-warm}"; export E2E_CACHE_MODE; }`, call it before validation, and set the workflow input default to `warm`. Keep `cold` in the choice list and README escape-hatch instructions.
-   `FAIL_CACHE`: keep explicit cold mode as the production default and document why retained cache is not adopted. Do not silently fall back to warm.

-   [ ] **Step 4: Run the complete local gate again**

Run all six shell tests, YAML parsing, Prettier, and `git diff --check` using the commands from Task 7.

Expected: all pass for the selected outcome.

-   [ ] **Step 5: Commit and push the evidence-based decision**

Use one of these exact commit subjects:

```text
ci(e2e): retain validated native caches
ci(e2e): keep cold cleanup after cache experiment
```

-   [ ] **Step 6: Run one final acceptance dispatch**

Dispatch without overriding the adopted default after the runner branch contains the final patch. If the workflow UI still requires a choice on the branch, select the adopted value explicitly and note that in the evidence.

Expected: seven tests pass, artifacts transfer successfully, cleanup completes, and the selected cache classification appears in the job summary.

---

### Task 11: Publish Results, Jira Decision, and Follow-Up Tickets

**Files:**

-   Create: `docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md`
-   Modify: Jira issue `LC-2073` through Atlassian Rovo.
-   Create: one to three Jira follow-up issues under project `LC`.

**Interfaces:**

-   Consumes: cold, warm 1, warm 2, invalidation, and final acceptance run evidence.
-   Produces: durable results, final recommendation, acceptance-test script, updated LC-2073, and actionable follow-up tickets.

-   [ ] **Step 1: Write the measured results document**

Return to the original LearnCard `codex/lc-2073-phase-2b` worktree before writing;
do not add results to the disposable invalidation branch.

Include these exact sections with actual values and links from the artifacts:

```markdown
# LC-2073 Phase 2B Cache Experiment Results

## Decision

## Run and Revision Matrix

## Stage Timing Comparison

## Fixed Overhead and Suite-Growth Interpretation

## Docker BuildKit Findings

## Host Nx Cache Findings

## Invalidation Findings

## Disk Growth and Safety

## Keep EC2 or Move Off It

## Ranked Fixes: Do Now

## Ranked Fixes: Do Later

## Risks and Open Questions

## Loom Acceptance-Test Script

## Run, Artifact, PR, and Jira Links
```

The decision section must explicitly state what will be done, what will not be done, and one to three reasons.

-   [ ] **Step 2: Verify and commit the results document**

Run:

```bash
bunx prettier --check docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md
git diff --check
```

Expected: both pass.

Commit with:

```bash
git add -f docs/plans/2026-08-10-lc-2073-phase-2b-cache-experiment-results.md
git commit -m "docs(ci): record LC-2073 Phase 2B results"
```

-   [ ] **Step 3: Add the final evidence comment to LC-2073**

Use Atlassian Rovo to comment with:

-   runner and LearnCard PR links;
-   all four experiment runs plus final acceptance;
-   the timing table and target outcome;
-   invalidation and disk-safety result;
-   keep-EC2/move-off-EC2 recommendation;
-   selected production default;
-   links to each follow-up ticket.

-   [ ] **Step 4: Create outcome-driven follow-up tickets**

Create two tickets in every outcome:

1. `Evaluate safe Playwright worker scaling for the real-backend E2E suite` — isolate shared database state, `/delete-all` cleanup, retries, and per-spec timing; do not combine this with caching.
2. `Centralize LearnCard shared E2E runner ownership and trigger policy` — resolve cross-repository locking, EC2 versus managed compute, and release-only versus broader triggers.

If invalidation was coarse or disk growth was unsafe, create a third ticket:

3. `Refine LearnCard monorepo Docker layer boundaries for E2E caching` — separate dependency manifests from source COPY layers, measure targeted invalidation, and enforce a bounded cache budget.

-   [ ] **Step 5: Update DualMem continuity**

Save an investigation memory with the measured findings and associated runner/LearnCard files, then mark the LC-2073 Phase 2B checkpoint complete only after the runner decision, final acceptance, Jira update, and follow-up tickets are all finished.

-   [ ] **Step 6: Final verification and handoff**

Verify both repository worktrees are clean or contain only explicitly reported uncommitted artifacts. Report commit SHAs, branch names, PR URLs, run URLs, Jira links, timing outcome, and whether the 12-minute target passed.
