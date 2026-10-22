# Workload agent contract (phase 3)

## Execution semantics version 2

Plans bind `executionSemanticsVersion: 2` alongside full ordered command argv,
component lifecycle/init timeout, and endpoint protocol/path/structured query.
The approval hash preserves array order. Selected-profile dependencies must be
closed; package and agent validation reject cycles including init components.

Command overrides image CMD only, never entrypoint. Commands and init require an
explicit numeric non-root user. Init is a bounded one-shot job, with command required
and healthcheck/ports/volumes/endpoints forbidden (tmpfs is allowed). A service still
requires its healthcheck. Observation components may include `kind` and `completed`:
an approved init requires `kind: 'init', completed: true`; a service cannot substitute
completion for health. READY still requires every selected component and endpoint.

Internal MongoDB endpoints use a strict replica-set/direct-connection query, no
credentials/readiness/capability, and a database-only path. Brain validates observed
MongoDB protocol, path and exact query against the approved declaration. It never
dereferences the URL. Host/port/hostport environment mappings remain query-free.

Authenticated `queueWorkloadRecovery({deploymentId, revision})` locks the deployment
and only queues recovery after the current operation succeeded, with matching desired
and last-applied revisions and no pending operation. It moves the deployment back to
APPLYING; the agent claims a fresh UPGRADE operation before any recovery mutation.
Failed, retiring, retired and stale revisions cannot authorize a recovery replay.
Init-bearing claims use a finite plan-derived lease covering declared sequential
startup/init deadlines, per-component Docker overhead and cleanup; ordinary claims
retain the existing 60-second lease. Reclaimed abandoned operations fail closed.

Brain persists desired state and observations. It does not run Docker, fetch observed
URLs, or create an agent process. `QueuedAgentDeployer` publishes operation IDs on
Redis channel `workload-operations` as a best-effort wake-up hint. Neo4j operations,
not Redis messages, are authoritative. Reconciliation re-publishes up to 100 pending
operations per pass; agents must also poll discovery (including after reconnects).

## Authentication and routes

All procedures are under tRPC router `workloadAgent`. Send the header
`x-workload-agent-token` equal to `WORKLOAD_AGENT_TOKEN`. Missing, wrong, or an unset
server token returns `UNAUTHORIZED`. This is a privileged local-agent credential,
not an ecosystem/user token; never expose it to a browser. Use TLS outside a trusted
local transport. Brain reads configuration only through `src/config/environment.ts`.

| Procedure                       | Kind     | Input                                                                                                | Output                                                             |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `listPendingWorkloadOperations` | query    | `{ limit?: number }`, integer 1–100, default 50                                                      | `WorkloadOperation[]`, oldest `createdAt` first, then operation ID |
| `claimWorkloadOperation`        | mutation | `{ operationId: string }` (max 512)                                                                  | `WorkloadOperation` with fresh lease token/expiry                  |
| `reportWorkloadObservation`     | mutation | `{ operationId: string, leaseToken: UUID, observation: Observation }`                                | `true`                                                             |
| `completeWorkloadOperation`     | mutation | `{ operationId: string, leaseToken: UUID, status: 'SUCCEEDED' \| 'FAILED' }`                         | `true`                                                             |
| `reportDeploymentHealth`        | mutation | `{ deploymentId: string, observedRevision: number, components: Component[], endpoints: Endpoint[] }` | `true`                                                             |

`Component = { id: string, healthy: boolean }`.
`Endpoint = { id: string, url: string, healthy: boolean }`.
The endpoint's `id` is the approved declaration's endpoint ID.
`Observation = { observedRevision: nonnegative integer, components: Component[],
endpoints: Endpoint[], failed?: boolean }`; `failed` defaults to false.
Each array has at most 256 entries; URL strings have at most 2048 characters.
Component and endpoint objects reject unknown fields. Deployment health does not
accept `failed` (use operation completion to report execution failure).

`WorkloadOperation` contains `operationId`, `deploymentId`, `action`
(`APPLY|UPGRADE|RETIRE`), `specRevision`, `status`
(`QUEUED|CLAIMED|SUCCEEDED|FAILED`), optional `leaseToken` and `leaseExpiresAt`,
`attempts`, `createdAt`, `updatedAt`, and `approvedSpec` (JSON-encoded WorkloadPlan).
Times are ISO-8601 UTC strings. Discovery returns QUEUED and lease-expired CLAIMED
operations for the local-compose driver; discovery is not a claim or permission
to execute. Some discovered operations are blocked by earlier deployment work.

## Ordering, leases, and revisions

Operation identity is `${deploymentId}:${specRevision}:${action}`. Queue insertion
is idempotent; completed/failed operations are not automatically recreated.
All claims and observation/completion writes lock the deployment in Neo4j.
A claim lasts 60 seconds. Reclaiming an expired operation generates a new UUID
fencing token; expired/replaced/completed leases return `CONFLICT` on reports and
completion. Agents must not keep executing under an expired lease. There is no
lease-renewal endpoint in this phase.

New approved intent revisions update the deployment desired revision and queue
UPGRADE. Earlier queued/claimed revisions finish before later revisions can claim.
RETIRE waits for APPLY/UPGRADE at the same revision, including expired claims that
must be reclaimed and completed. Removal immediately sets RETIRING, blocking new
health reports. Completion of earlier apply work cannot restore readiness or erase
retirement. RETIRE success sets RETIRED and records retained obligations. Neither
the deployment node nor volumes are generically deleted. Preserved endpoint
purposes (including `status-list`), `issuer-key`, and `data` are recorded.

During execution, use the operation-scoped observation route. After successful
APPLY/UPGRADE completion, use deployment health: it requires both
`lastAppliedRevision === observedRevision` and `desiredRevision === observedRevision`.
Completion alone never sets READY. Stale revisions return `CONFLICT`.

## Health and endpoint observations

HTTP endpoints may declare `readiness: { path: '/', expectStatus: 200 }` separately
from their advertised API `path`. The expected status defaults to 200; paths must
start with `/` and contain neither `..` nor a query. These declarations flow into
the hash-bound plan endpoints alongside the execution block. Agents perform a
bounded unauthenticated GET against the readiness path, but report and bind the
advertised API URL. Without readiness, agents retain the endpoint-path probe.
This does not relax the requirement that every endpoint check pass before READY.

Only component/endpoint IDs in the approved selected-profile plan are accepted.
Duplicate or undeclared IDs return `BAD_REQUEST`. Addresses are opaque observations:
only `http:`, `https:`, and `tcp:` with a hostname are accepted. There are no fixed
host, loopback, port, or path mappings. Userinfo is stripped; query parameters with
credential-like keys (`token`, `secret`, `password`, `credential`, `authorization`,
`apiKey`, `signature`, `accessKey`, including case/separator variants) are stripped;
fragments are stripped. Do not encode credentials in paths or noncredential query
keys. Brain never dereferences these URLs. Driver-specific network isolation and
loopback publishing remain phase-4 agent responsibilities.

READY requires all selected components and declared endpoints observed healthy at
the desired revision. Partial initial health stays APPLYING. Three consecutive
unhealthy observations degrade an already-ready deployment; recovery is immediate.
More than 120 seconds without observations degrades it with `AGENT_STALE` on the
next reconciliation pass. No deployment is automatically recreated. Required FAILED
targets fail the intent; optional FAILED targets remain visible but do not prevent
intent readiness. Existing listInstallTargets/listWorkloadDeployments expose stored
lifecycle, revisions, package IDs, profiles, componentHealth/endpointsObserved
(JSON strings), retainedObligations, and failureCode. Removal status messages state
retained obligations.

## Configuration and remaining boundary

`WORKLOAD_LOCAL_COMPOSE_ENABLED` defaults false and requires `WORKLOAD_AGENT_TOKEN`
when enabled. `WORKLOAD_CURATOR_DIDS` governs approved publishers. The token enables
the privileged control-plane routes; it does not provision infrastructure.

Issuer binding is a typed seam only (`WorkloadIssuerBinding` in
`types/workload-lifecycle.ts`): `issuerProfileId` is not yet a hash-bound planner
input and no ISSUES_AS edge is created. Before production issuance, validate an
existing institution Profile's MEMBER_OF ecosystem relationship, bind it into the
approved plan, and create ISSUES_AS atomically with deployment creation. No issuer
login keys or key material are accepted here. Phase 4 must implement Docker-side
lease fencing, bounded execution/recovery, retained-volume/status publication,
and actual endpoint probes; these tests do not establish runtime deployment safety.
