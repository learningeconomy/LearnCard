# LC-1644 Bench — Followups

**Parent ticket:** [LC-1644](https://welibrary.atlassian.net/browse/LC-1644)
**Parent PR:** [learningeconomy/LearnCard#1189](https://github.com/learningeconomy/LearnCard/pull/1189)
**Date noted:** 2026-04-28

Two pieces of polish deferred during the bench panel rollout. Independent — pick whichever has higher ROI when you revisit.

---

## 1. GitHub Action — `workflow_dispatch` to trigger a staging bench

**Goal:** Run the bench from the GitHub Actions tab without opening the LearnCard app. Inputs for `iterations` / `listing_id` / `recipient_profile_id`. Output renders to the job summary as a markdown perf table; raw JSON saved as a workflow artifact.

### Sketch

```yaml
# .github/workflows/lc-1644-bench-staging.yml
name: LC-1644 Bench (Staging)

on:
  workflow_dispatch:
    inputs:
      listing_id:
        description: Listing ID (staging)
        required: true
      recipient_profile_id:
        description: Recipient profile ID
        required: true
        default: bench-perf-staging
      template_alias:
        description: Boost template alias
        required: true
      iterations:
        description: Number of measured iterations
        default: '20'
      warmup:
        description: Number of warmup iterations
        default: '2'
      run_label:
        description: Run label (free-form annotation)
        default: ''

jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run bench against staging
        id: bench
        env:
          BENCH_TOKEN: ${{ secrets.BENCH_PERF_STAGING_TOKEN }}
        run: |
          run_label="${{ inputs.run_label }}"
          if [ -z "$run_label" ]; then
            run_label="ci-${GITHUB_RUN_NUMBER}-$(date -u +%Y%m%dT%H%M%SZ)"
          fi

          response=$(curl -sS -X POST \
            https://network.learncard.com/api/trpc/appStore.benchAppEvent \
            -H "Authorization: Bearer $BENCH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
              \"listingId\":\"${{ inputs.listing_id }}\",
              \"recipientProfileId\":\"${{ inputs.recipient_profile_id }}\",
              \"templateAlias\":\"${{ inputs.template_alias }}\",
              \"iterations\":${{ inputs.iterations }},
              \"warmup\":${{ inputs.warmup }},
              \"runLabel\":\"$run_label\"
            }")

          echo "$response" > bench-result.json
          run_id=$(jq -r '.result.data.runId' bench-result.json)
          echo "run_id=$run_id" >> "$GITHUB_OUTPUT"

          # Pretty job summary
          {
            echo "# Bench run: \`$run_label\`"
            echo ""
            echo "**run_id:** \`$run_id\`"
            echo ""
            jq -r '
              .result.data.summary as $s |
              "| Phase | p50 | p95 | p99 |",
              "|---|---:|---:|---:|",
              ("| total | \($s.total.p50) | \($s.total.p95) | \($s.total.p99) |"),
              ("| sa_issue | \($s.sa_issue.p50) | \($s.sa_issue.p95) | \($s.sa_issue.p99) |"),
              ("| sa_http | \($s.sa_http.p50) | \($s.sa_http.p95) | \($s.sa_http.p99) |"),
              ("| parallel_reads | \($s.parallel_reads.p50) | \($s.parallel_reads.p95) | \($s.parallel_reads.p99) |"),
              ("| owner_and_sa_reads | \($s.owner_and_sa_reads.p50) | \($s.owner_and_sa_reads.p95) | \($s.owner_and_sa_reads.p99) |"),
              ("| log_activity_and_send_boost | \($s.log_activity_and_send_boost.p50) | \($s.log_activity_and_send_boost.p95) | \($s.log_activity_and_send_boost.p99) |"),
              "",
              "**Errors:** \($s.errors) / \($s.iteration_count)"
            ' bench-result.json
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Upload raw JSON
        uses: actions/upload-artifact@v4
        with:
          name: bench-result-${{ steps.bench.outputs.run_id }}
          path: bench-result.json
```

### Setup checklist

- [ ] Sign in to staging app as a dedicated `bench-perf-staging` profile.
- [ ] Admin Tools → API Tokens → create token with `app-store:write` scope. Copy the JWT.
- [ ] Add as repo secret `BENCH_PERF_STAGING_TOKEN`.
- [ ] Land this workflow file. First run via Actions → "LC-1644 Bench (Staging)" → "Run workflow".
- [ ] Confirm job summary table populates and PostHog receives the events tagged with the workflow's `runLabel`.

### Future expansions

- **Nightly schedule** — add `schedule: - cron: '0 6 * * *'` (6 UTC = 1am ET) for continuous baseline. Requires deciding whether to keep cleaning up or let staging accumulate bench data.
- **Threshold check** — after the curl, parse `summary.total.p95`; fail the job with `exit 1` if it exceeds e.g. 1500ms. Turns this into a perf gate.
- **Diff vs. prior run** — pull the last run's PostHog summary event, render Δ in the job summary. PostHog has a query API that can return the most recent `bench.appevent.run` event.

### Tradeoffs / open questions

- **Token rotation.** The bench token lives indefinitely until revoked. Annual rotation reminder via Linear/Jira is sufficient — bench profile has no real data so blast radius is small.
- **Self-hosted runner alternative.** If long-lived secrets in repo are off-limits, a self-hosted runner with staging creds in the runner env avoids the secret altogether.
- **OIDC alternative.** GitHub OIDC → backend exchange route → short-lived bench JWT. Cleanest auth story but requires a new tRPC route for the OIDC exchange. Overkill until we have multiple CI integrations needing the same pattern.

---

## 2. PostHog dashboard recipe

**Problem:** the default Activity feed is useless for perf data — just a stream of events. Need saved Insights for time-series and per-run views. PostHog supports this but it has to be configured manually in the UI (not generated from code).

### Insights to create

**(a) "Total time over runs" — line chart**

- Type: **Trends**
- Event: `bench.appevent.run`
- Series:
  - `total_p50` — Property avg
  - `total_p95` — Property avg
  - `total_p99` — Property avg
- X axis: time (auto)
- Filter: `env = 'staging'` (and/or `env = 'production'`)
- Use case: "did Task 7's change regress p95?"

**(b) "Phase breakdown — most recent run" — bar chart**

- Type: **Trends**
- Event: `bench.appevent.run`
- Series, all `Property avg` of:
  - `sa_issue_p50`
  - `sa_http_p50`
  - `parallel_reads_p50`
  - `owner_and_sa_reads_p50`
  - `log_activity_and_send_boost_p50`
- Date range: last 1 day (or filter to specific `run_id`)
- Display: **Bar chart** (not line)
- Use case: "where is the time going on this run?"

**(c) "Per-iteration scatter" — table or HogQL query**

- Type: **SQL Insight** (HogQL)
- Query:
  ```sql
  SELECT
    properties.run_id AS run_id,
    properties.iteration AS iteration,
    properties.was_first_iteration AS first_iter,
    properties.total_ms AS total_ms,
    properties.sa_http_ms AS sa_http_ms,
    timestamp
  FROM events
  WHERE event = 'bench.appevent.iteration'
    AND properties.run_id = '<paste-run-id>'
  ORDER BY iteration ASC
  ```
- Use case: "spot the cold-start outlier on iteration 0 — is it dragging p95?"

**(d) "Cold-start tail" — bar chart, p95 grouped by `was_first_iteration`**

- Type: **Trends**
- Event: `bench.appevent.iteration`
- Series:
  - `total_ms` — `Property median` (p50)
  - `total_ms` — `Property 95th percentile`
- Breakdown: `was_first_iteration` (true/false)
- Use case: confirm the first-iteration tail vs. warm-iteration baseline

### Dashboard

Bundle (a)–(d) into a single PostHog Dashboard called **"LC-1644 Bench"**. Pin to your home page once it's built — that's the "click and see what perf looks like today" view.

### `posthogDashboardUrl` improvement

The current backend returns `${POSTHOG_HOST}/events?eventFilter=bench.appevent&runId=<id>` which doesn't actually filter the PostHog UI. Once the dashboard above exists, switch the helper to return its dashboard URL with the `run_id` as a filter param, e.g. `https://us.i.posthog.com/dashboard/<id>?filters=...`. Small follow-up; not worth doing until the dashboard exists.

---

## Tracking

- Both items captured here. Convert to JIRA subtasks under LC-1644 (or LC-1644-followup) once we decide we're ready to do them.
- The first one (GH action) probably gets the next slot — it's higher leverage than dashboarding because every push needs a perf check anyway. Dashboarding can wait until you have ~10+ bench runs to look at and the "what does this look like over time" question becomes real.
