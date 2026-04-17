# LC-1644 Stretch — Additional Backend Optimizations (Deferred)

**Parent ticket:** LC-1644 (Optimize send_credential APP_EVENT)
**Context:** PR #TBD lands Tasks 2–4 + SA retry/error-context + in-memory cache + fire-and-forget notification. The items below were evaluated mid-implementation on 2026-04-17 but deferred as stretch work — low enough ROI / high enough engineering cost that they're better as a separate followup after we have production metrics from the first PR.

## Items

### 1. Consolidate Neo4j reads into fewer Cypher queries

**Status:** Deferred

**What:** `handleSendCredentialEvent` currently issues up to 7 Neo4j queries (Batch 1 of 4 + Batch 2 of 3 + optional Batch 3). Even parallelized these become N round-trips to the remote Neo4j. A single Cypher statement could return `{boost, listing, integration, profile, listingSa, integrationSa, owner}` via chained `MATCH` / `OPTIONAL MATCH`.

**Estimated win:** 20-80ms in production (eliminates N-1 network round-trips when Neo4j is remote-managed). Localhost bench will show ~0ms because our Neo4j is same-host.

**Cost:**
- Cypher statement becomes much harder to read and test
- Neogma ORM isn't great at composing multi-entity reads; likely would drop to raw Cypher + manual row mapping
- Breaks the clean batch/retry boundaries we just put in
- Requires new tests for the consolidated query
- Probably ~4-6 hours of work + review cycles

**When to reconsider:** If production metrics (post the first PR) show Neo4j aggregate latency > 100ms per appEvent. The LRU cache we shipped will hide most of that cost for steady traffic, so we may never need this.

**Implementation sketch:**

```cypher
MATCH (l:AppStoreListing {listing_id: $listingId})
OPTIONAL MATCH (l)<-[:OWNS_LISTING]-(i:Integration)
OPTIONAL MATCH (i)<-[:OWNS_INTEGRATION]-(owner:Profile)
OPTIONAL MATCH (l)-[:USES_SIGNING_AUTHORITY]->(listingSa:SigningAuthority)
OPTIONAL MATCH (i)-[:USES_SIGNING_AUTHORITY]->(integrationSa:SigningAuthority)
OPTIONAL MATCH (owner)-[:USES_SIGNING_AUTHORITY]->(ownerSa:SigningAuthority)
MATCH (target:Profile {profileId: $targetProfileId})
MATCH (b:Boost)<-[:LISTING_FOR_BOOST]-(l)   // or however boost→listing is modeled
WHERE b.templateAlias = $templateAlias
RETURN b, l, i, owner, listingSa, integrationSa, ownerSa, target
```

Return nullable columns for optional matches; caller does existence checks. Emits one query regardless of SA hierarchy depth.

---

### 2. Pre-warm SA (lca-api) lambda via scheduled ping

**Status:** Deferred (ops-layer, not code)

**What:** AWS EventBridge rule that pings `https://staging.api.learncard.app/api/health` (or similar) every 4 minutes to keep the lca-api lambda warm.

**Estimated win:** Eliminates cold-start SA invocations. Our staging bench showed cold warmup 1.5-2s on first call after idle; steady state is ~220ms warm. A kept-warm lambda stays in the 220ms bucket. This is the last meaningful source of 1-2s tail latency after the in-memory cache lands.

**Cost:**
- ~$1-2/month in lambda invocation + EventBridge cost
- AWS infrastructure change (separate PR, different workflow)
- Need to decide: health endpoint or a lightweight dummy route
- Needs to be per-environment (staging, production)

**When to reconsider:** When we have real production p99 data and can quantify how often users hit cold SA lambdas. If the HTTP/2 keepAlive we shipped already keeps enough connections warm, this may be unnecessary.

**Implementation sketch:**

```yaml
# serverless.yml / cdk for lca-api
events:
  - schedule:
      rate: rate(4 minutes)
      input: '{"warming": true}'
      enabled: true
```

Handler should early-return on `{"warming": true}` to skip DB work.

---

## Why these are safe to defer

Both items are **pure optimizations** — they don't fix correctness, UX, or security issues. The first PR already lands the JIRA's primary goal (perceived latency < 4s for the sendCredential flow) via:

- HTTP/2 + keepAlive (-92% p95)
- Parallel Neo4j + activity writes (-67% cumulative p95)
- LRU cache for hot entities (scales best under load)
- SA timeout shortening + single retry (kills the 21s stall case)
- Fire-and-forget notification (-5-30ms per call)

If post-deploy metrics still show a long tail, these stretch items become the obvious next targets. Until then, shipping the first PR and collecting real data is more valuable than squeezing additional local-bench-invisible improvements.

## Tracking

- Create JIRA subtasks under LC-1644 (or a new umbrella like LC-1644-followup) after the main PR lands
- Link back to this doc from the subtask descriptions
- Revisit after 2 weeks of production metrics
