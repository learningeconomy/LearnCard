# Live queue artifact-cache pilot

This opt-in pilot lets the required `Test` job consume native Nx build payloads
from a successful main workflow. Only `core:build`, `helpers:build` and
`types:build` can be restored. Test success is never cached. Existing E2E SDK
snapshot transport and Deploy test-proof reuse are separate.

## Operate the pilot

1. Merge the pilot wiring through normal review and queue protections.
2. Dispatch `nx-artifact-producer.yml` on `main`. Other branches cannot publish.
   Wait for its complete run to succeed. This is manual; there is no recurring
   producer workload or external cache service.
3. Set repository variable `LC_NX_ARTIFACT_PILOT` to `true` for the observation
   window. It is off when absent or any other value. No secret is needed.
4. Put a normally approved PR through the queue. Its real affected test graph
   must include an eligible build to demonstrate consumption; an empty graph
   or a cache miss is not evidence of a hit. No additional test selection is
   injected merely to produce a favorable result.
5. Inspect `nx-pilot-queue-evidence` and the Test step summary. Confirm a genuine
   `merge_group` event, the actual queue SHA/base, the producer run/attempt and
   artifact ID, matching task hashes, HTTP hit events, and fresh successful test
   targets. `liveConsumed: true` requires those conditions and successful Nx
   execution. Also inspect retry reports and the complete required workflow.
6. Restore/remove the repository variable after the observation. Retire this
   integration after the pilot decision; artifacts expire after seven days.

Only the real merge-group Test job uses the switch. Ordinary PR/manual Test
runs keep their existing command. Producer selection considers successful,
same-repository manual runs of this specific workflow on main, younger than
seven days, whose source is an ancestor of the queue base. API lookup is bounded
to 20 seconds, with five-second request timeouts and no retries. Artifact
download and diagnostic upload have one-minute step limits.

## Correctness and evidence

The downloaded manifest must match the separately selected run ID, attempt and
source SHA, runtime/platform/architecture, lockfile, relevant environment and
pilot implementation. It must contain exactly the three audited task archives
with matching byte counts and SHA-256 digests. Only these native archives are
transferred: no local Nx database, cached test verdict, logs or credentials.

Nx accesses them through an authenticated, runner-local HTTP adapter. Consumer
writes are accepted and discarded; they cannot update the shared artifact.
Missing, expired or incompatible artifacts, API/download failures and adapter
startup failure fall back to uncached execution. Failed tests remain failures.
Evidence upload is advisory; a missing evidence artifact is an unverified
observation, even if Test passed.

Both producer and consumer install the same temporary observation hook at a
stable relative path. This changes hashed `nx.json` identically without changing
production target/input definitions. These are instrumented hashes, not a claim
of compatibility with old uninstrumented payloads. Both native cache files and
the Nx workspace database use fresh directories; local metadata cannot masquerade
as a remote hit. The original configuration is restored afterward.

The pilot freezes affected selection to the merge event's base/head. If the
caller supplies an already frozen `NX_BASE`/`NX_HEAD` (such as a queue test-proof
publisher), that exact range is honored; the head must equal the checked-out
queue SHA. Evidence records the effective base and queue base separately.

Record complete producer and consumer job time, lookup/download/graph/command
cost, actual runner CPU/image, fresh-test counts, and enqueue-to-merge latency.
One successful live hit demonstrates consumption, not a dependable speedup.
Compare repeated complete jobs before claiming savings, and keep producer cost
and the independent E2E critical path visible.

## Local checks

```sh
node --test scripts/nx-artifact-cache/pilot.test.mjs
node --test scripts/nx-artifact-cache/native.test.mjs
```

The native fixture invokes the real producer/consumer wrapper and Nx against
tiny build commands, including affected-test cache hits, fresh fallback, source
invalidation, output restoration and a deliberately failing test. Its simulated
GitHub environment is a local protocol check, not live queue evidence.
