# Local workload agent (ADR-009, phase 4)

## Command, init and MongoDB execution (5B)

`command` is an ordered argv-only image CMD override, never an entrypoint override.
The renderer does not insert a shell or expand templates. The final YAML dollar
escape runs exactly once. Commands require an explicit non-root numeric `user`.
The contract bounds argv to 1–64 arguments, 4096 characters per argument and 16384
total, rejects control characters, and restricts the executable to a safe path/name.

`lifecycle: {kind: 'init', timeoutMs: 1000..900000}` requires command and forbids
healthchecks, ports, volume declarations and endpoints. Declared tmpfs is allowed.
Init runs on the private network with `restart: 'no'`. Services retain healthchecks.
The agent independently validates declarations and dependency cycles, then starts
each dependency-ready component with `up -d --no-deps`, removing obsolete containers
without deleting volumes. Existing dependents stop before a new init attempt.

Init success requires actual exit zero, no OOM, and matching deployment, revision,
component and attempt labels. Nonzero/signal exits are `INIT_FAILED`, deadlines are
`INIT_TIMEOUT`, and create/start failures are `INIT_START_FAILED`. Ambiguous Docker
mutations retain the operator-reconciliation interlock. Output is bounded and raw
Docker errors are withheld. A verified running init is killed by container ID on
failure using reserved cleanup time; an unresolvable identity is fenced, never guessed.

Recovery does not mutate from local state. Brain must authorize a fresh operation
for a successfully applied current revision, with no retirement or pending operation.
The normal claim/apply/observe/complete path then reruns init with a fresh attempt.
Failure is terminal, reported to Brain, and is not automatically retried.

MongoDB endpoints require internal visibility, auth `none`, a database-only path and
strict query `{directConnection: true, replicaSet: 'rs0'}`. They cannot have readiness
or capability declarations, or share a component with non-internal endpoints.
URLs use `mongodb://<service>:<port>/<db>?directConnection=true&replicaSet=<set>`;
host/port/hostport mappings exclude the query. Mongo endpoint readiness is TCP;
transaction readiness is established by the separate init and transactional smoke.

Development status package commands (Brain workspace):

```sh
bun run seed:dcc-workload --status
bun run prove:dcc-workload --status
```

This publishes `org.dcc.issuer-status@1.0.0` through DCC Tools 1.3.0; the core-only
builder and bundle 1.2.0 remain available. Public status publication remains OPEN
(`status.example.invalid` is deliberately not a production origin). Opt-in Docker
transaction smoke, from this workspace: `DCC_MONGO_SMOKE=1 bun run test -- test/mongo-transactions.test.ts`.
It uses the Mongo driver inside the pinned status image and retains named test volumes.

**Development only. Docker socket access is daemon-host authority, not a production
isolation boundary.** Brain never receives the socket. This is not the DCC digest
seed, the console UI, a production driver, or production issuer custody.

## Run

From `apps/learn-card-app` (Docker Compose 2.24.4+ for `!override`):

```sh
export WORKLOAD_IMAGE_ALLOWLIST='docker.io/your-reviewed-repository@sha256:<64-hex-digest>'
bun run dev-console:workloads
# Equivalent:
docker compose -f compose-local.yaml -f compose-workloads.yaml --profile console --profile workloads up --build
```

To start just the agent alongside existing services:

```sh
docker compose -f compose-local.yaml -f compose-workloads.yaml --profile console --profile workloads up -d --build lcn-workload-agent brain
```

The Compose **service** is `brain`; `lcn-brain-service` is its container name.
Only this overlay enables workloads. Including it also enables Brain's workload
planning even if the workloads profile is not started. Its disposable default token
is `disposable-local-workload-agent-token`; it is **not a secret suitable for shared
development hosts**. Set `WORKLOAD_AGENT_TOKEN` to a fresh random value for any
shared host. The overlay replaces Brain's host publication with **127.0.0.1:4000**.
Other containers on the trusted local `learn-card` network can still reach Brain.
The allowlist is empty by default, denying all workload images.

`bun run dev-console:workloads:down` stops the development stack, not independent
workload projects. Retire workloads through Brain before shutting down the agent.

## Configuration

| Variable                         | Default / meaning                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `WORKLOAD_LOCAL_COMPOSE_ENABLED` | Must literally be `true`                                                                                                              |
| `WORKLOAD_AGENT_TOKEN`           | Required, at least 16 characters; shared with Brain                                                                                   |
| `BRAIN_URL`                      | Required origin, e.g. `http://brain:4000`; client appends `/trpc`                                                                     |
| `WORKLOAD_AGENT_POLL_MS`         | 5000; 100–60000 ms                                                                                                                    |
| `WORKLOAD_SECRETS_DIR`           | `/var/lib/lcn-workloads/secrets` in the container; absolute, outside source repository                                                |
| `WORKLOAD_HOST_SECRETS_DIR`      | Overlay host bind source; defaults to `${HOME}/.lcn-workloads/secrets`                                                                |
| `WORKLOAD_IMAGE_ALLOWLIST`       | Comma-separated exact digest references, exact repositories, or namespace prefixes **ending in `/`**; no arbitrary substring matching |
| `WORKLOAD_MAX_CPU_MILLIS`        | 2000 per component                                                                                                                    |
| `WORKLOAD_MAX_MEMORY_MIB`        | 2048 per component                                                                                                                    |
| `WORKLOAD_MAX_PIDS`              | 512 per component                                                                                                                     |
| `WORKLOAD_AGENT_CONTAINER`       | `lcn-workload-agent`; executor identity must match this container                                                                     |
| `WORKLOAD_REDIS_URL`             | Optional; overlay uses `redis://redis:6379`                                                                                           |

`NODE_ENV`, `STAGE`, `ENVIRONMENT`, or `DEPLOYMENT_ENV` equal to `prod` or
`production` refuse startup. A nonempty `PRODUCTION` or `WORKLOAD_PRODUCTION`
other than `false` also refuses startup. The overlay forwards `STAGE` and
`WORKLOAD_PRODUCTION`. Never run this image in a production environment.

Redis channel `workload-operations` is a wake-up hint only. Durable discovery always
polls Brain. Authentication success is logged as `AUTHENTICATED_POLL_EMPTY` when
the list is empty, or `AUTHENTICATED_POLL_PENDING`; tokens and operation bodies are
never logged. tRPC responses are parsed into the agent's typed boundary.

## Approval and policy

Phase-3 `WorkloadPlan` contained only image summaries and secret provisioning kinds.
The optional **hash-bound `execution` block** now carries selected full components,
logical secret declarations and validated config. The planner creates it before
approval; existing hash computation includes the block. Old approvals without it
fail `APPROVAL_EXECUTION_MISSING` and require a new plan/approval. The agent never
fetches mutable package metadata to fill missing approval data.

The agent independently parses strict component/endpoint/secret schemas, checks
summary/execution agreement, digest allowlisting, host CPU architecture, resource
ceilings, references and permitted volume paths. It never accepts arbitrary Compose
fragments, build contexts, privileged mode, host networking/PID, socket mounts or
host bind mounts. Cross-architecture emulation is not silently enabled.

## Rendering and ports

Project names are `lcnwl-<lowercase-sanitized-ID-prefix>-<12-hex-SHA256-ID>`.
The suffix prevents normalization collisions. Persistent volume names append the
same safe encoding of the declared volume name; their names are revision-independent.
Every deployment has one `internal: true` private network. Workload containers
never join `learn-card`, Brain, or database networks.

Host ports use 20000–49999: SHA256 of `deploymentId:componentId:portName`, first
32-bit big-endian word modulo 30000, plus 20000. Sorted endpoint keys reserve ports
with exclusive mode-0600 files in `_ports`; linear probing resolves collisions
against other reservations. Reservations survive restart/retire, so upgrades keep
their URLs. Docker's bind check fails closed if an unrelated host process occupies
the chosen port; the agent does not silently republish on a different port.
Only ecosystem/public endpoints publish, always on `127.0.0.1`. Multiple endpoints
on one component port share its reservation. Internal observations and environment
references use private container URLs; published observations use host-loopback URLs.
These local URLs are **not public Internet status publication**.

All services have `cap_drop: [ALL]`, `no-new-privileges`, read-only root filesystems,
resource limits, declared dependency order, explicit volumes/tmpfs and disabled
image Docker HEALTHCHECKs. Writable tmpfs mounts are emitted only when declared:
`tmpfs: [{ path: '/tmp', sizeMiB: 64 }]` (at most 16, each 1–1024 MiB).
Optional `user` accepts numeric non-root uid[:gid] only. Without it the image's
default USER remains effective. There is no writable-root opt-out or secret-file-support field. Images
such as Mongo must declare every required writable volume (often both `/data/db`
and `/data/configdb`). Some images requiring root/chown will be incompatible with
all capabilities dropped. Those failures must not be worked around with privilege.

## Secrets and retained state

The host bind directory must be outside the repository and accessible to Docker
Desktop. Directories are 0700 and files 0600. Logical values live under
`<root>/<safe deployment project>/values/<secret name>`, separated from Compose,
recovery state and component `.env` files to prevent filename collisions.

Generate: token = 32 random bytes base64url; ed25519 seed = 32 random bytes hex;
`ed25519-seed-multibase` = base58btc multibase of `[0, 32, ...32 random bytes]`;
password = 24 random base64url characters. Generation is exclusive and idempotent;
existing files are never regenerated. Missing existing-reference files fail
`SECRET_MISSING`. Values must be nonempty single-line text. Symlink secret files,
hard links and oversized files are rejected. Protect the **entire parent directory**
from untrusted host users; host/root administrators are in the trust boundary.

Since schema v1 cannot declare file support, secret mappings use external private
Compose `env_file` entries with `format: raw`, not inline YAML values. Compose reads
these files **inside the agent** and sends the resulting environment to Docker;
there are no workload bind mounts requiring host/container path translation.
This exposes values to daemon-authorized `docker inspect` and processes inside the
consumer container. This is an explicit dev-only trade-off, not production custody.
Secret values, env-file content and the agent token pass through a registered-value
redactor; command errors are coarse codes and raw Docker output is never logged.
Recovery state excludes lease tokens.

## Leases, recovery and health

Operations serialize per deployment. Claims last 60 seconds; there is no renewal.
Pulls occur before apply, with per-command timeouts and a reserved 15-second tail
for network cleanup and Brain requests. Startup probes retry at declared intervals
within both startup deadlines and the remaining lease. Insufficient time fails
`LEASE_BUDGET_EXCEEDED`; pre-pull large approved images on the daemon before retrying
via a newly approved operation. Partial observations report unhealthy components;
completion alone never establishes READY.

**Single executor per Docker daemon**: run only the named `lcn-workload-agent` with
one shared state root. Startup checks its Docker container identity. A durable
`mutation-unresolved` interlock is written before every up/down and removed only
after confirmed command success. Killing the Docker CLI cannot cancel a daemon
request: on timeout/crash the interlock remains and blocks all subsequent mutations
for that deployment, even after restart. Do not remove it until an operator has
confirmed the old daemon operation has settled. This is fail-closed local recovery,
not distributed daemon-side lease enforcement. Arbitrary EXEC probes also cannot
be forcibly cancelled inside a container merely by killing their Docker client;
only curate bounded, read-only EXEC commands.

Reclaimed operations (`attempts > 1`) are terminalized FAILED under the **new** lease
without replaying Docker mutations. This also unblocks a queued RETIRE after an
earlier APPLY observation conflicted with RETIRING. Any CONFLICT immediately abandons
the current lease, with no further Docker calls. New approvals are required to retry
failed execution. Brain's current contract has no failure-code input: detailed local
codes such as `SECRET_MISSING`/`LEASE_BUDGET_EXCEEDED` appear in sanitized agent logs;
Brain records `DRIVER_FAILED`.

The agent persists approved recovery state before apply, inspects labeled projects
at startup and resumes revision-guarded health rather than recreating containers.
Stale probe-network attachments are removed at startup. HTTP GET (no redirects),
TCP and EXEC argv checks run from the agent temporarily attached to the deployment
network. Endpoint checks are separate from component checks. Probe caches respect
component intervals; actual scheduling is bounded by polling and work duration.
HTTP endpoints requiring tenant authentication return unhealthy unless the package
declares an unauthenticated `readiness: { path: '/', expectStatus: 200 }` probe;
`expectStatus` defaults to 200. The bounded GET uses that path without credentials,
while observations and bindings retain the advertised endpoint `path` (for example,
`/instance`). Without `readiness`, the existing endpoint-path probe and successful
2xx status behavior are unchanged. Readiness declarations are part of the approved,
hash-bound plan endpoints; the agent never guesses credentials.
HTTPS keeps normal certificate validation (IP-hostname certificates can fail).

RETIRE executes Compose `down` **without `-v`**, stopping/removing containers while
retaining volumes, secret values, port reservations and recovery records. Brain
records retained obligations. In this dev phase, a retained `status-list` obligation
is recorded, **not actively served after down**. A continuing status-publication
service/approved handoff is still required before real issuance or production use;
this agent does not claim the broader ADR-009 standing-obligation guarantee is met.

## Verify / troubleshoot

From this directory:

```sh
bun run typecheck
bun run test
bun run lint
bun run build
# Build lcn-workload-agent-local via the overlay before opting in:
WORKLOAD_AGENT_DOCKER_SMOKE=1 bun run test -- test/docker-smoke.test.ts
```

The Docker smoke resolves `hashicorp/http-echo:1.0.0` to a real digest, uses that exact
digest in an allowlist, executes real HTTP component/endpoint probes from a container,
retires and asserts the named volume survives. It deliberately leaves that empty
smoke volume as retention evidence; no workload-volume removal command is used.

Troubleshooting codes: `BRAIN_REQUEST_FAILED` — check token/Brain reachability;
`IMAGE_NOT_ALLOWED` — configure a reviewed digest or namespace;
`PLATFORM_MISMATCH` — pin a native image; `RECOVERY_STATE_MISSING` — restore state,
do not fabricate a Compose file; `MUTATION_RECONCILIATION_REQUIRED` — inspect Docker
and resolve the ambiguous prior action before manually clearing the interlock;
`SPEC_INVALID` — replan with a valid execution block. Do not paste raw inspect output
or generated environment files into tickets/logs.
