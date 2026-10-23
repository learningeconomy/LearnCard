# DCC phase 5 result — PROOF COMPLETE WITH LABELS (local only), not PROOF READY

## Current status (2026-10-23)

This file is an append-only log; earlier sections record blockers that were later
resolved. Current state:

- **5A (issuer core):** READY locally (2026-10-21).
- **5B (status list):** the live acceptance gap recorded on 2026-10-22 was closed by
  the Step 4c runs. The status list was served through the read-only status gateway,
  and credential verification checked it live.
- **Step 4a (published exchange origin):** resolved by the generic
  `address: 'published'` / `part: 'origin'` endpoint environment source. See the
  "Subsequent resolution" note under Step 4a.
- **Step 4c (exchange):** bundle 1.4.2 / package 1.0.2 finished
  `PROOF COMPLETE WITH LABELS`:
    - The status list is labelled non-conformant: it has 100000 entries, below the
      131072 minimum.
    - The issuer is not in the registry.
    - Single-use replay was verified.
    - Claims are NOT consent-gated.
- **Still OPEN:**
    - status-list size (upstream);
    - learner claim-choice consent (deferred);
    - issuer default tenants;
    - non-loopback (phone) reachability;
    - in-memory exchange state;
    - concurrent single-use;
    - upgrade/rollback/retirement acceptance;
    - production gates (owners, LEF pin sign-off, security review, registry trust,
      TLS, custody).

## 5A proof — operator harness added, execution incomplete (2026-10-20)

**NOT READY. No installation or issuance acceptance is claimed by this attempt.**

Added Brain `bun run prove:dcc-workload`, using the console's existing dev login
state/callback and session cookie, then the real BFF operator routes. The harness
enables the bundle/member listings, reviews the signed core workload plan, approves
and applies it, and polls intent + install targets every five seconds (12-minute
limit). It includes failure-container log redaction, loopback-only issuance, and
an optional `--restart` comparison of deployment ID, container names/IDs and
eight-character secret hashes. Secret filenames are the manifest logical names
`tenant-token-edu` / `tenant-seed-edu`, not the consuming environment variable names.
This harness has **not yet been runtime-qualified**.

Commands started in the background, with logs outside the repository:

- Types: `bun run build`, PID 33853, `/tmp/dcc-types-build.log`; log showed
  `✔ Build successful` (the wrapper also runs declaration generation afterward;
  no captured overall exit status).
- Requested Compose rebuild/up, PID 33908, `/tmp/dcc-stack-build.log`.
  Confirmed service name `brain`. At the last observation the Brain image was
  still being unpacked after exporting layers (132.9 seconds). Existing agent
  and Brain containers still showed **Up 3 hours**: these are **not** evidence
  that the rebuilt images had been activated.
- Prettier, script ESLint, then Brain `bun run typecheck`, PID 34388,
  `/tmp/dcc-verify.log`. Prettier completed and ESLint returned successfully
  (the chained typecheck started). The last observation showed both tsc commands
  starting, but no `VERIFY_EXIT=0` marker yet. Typecheck completion is unconfirmed.
- New script LSP error diagnostics were clean before formatting.

Redacted agent excerpt from the **old running container**:

```text
AUTHENTICATED_POLL_EMPTY
AUTHENTICATED_POLL_EMPTY
AUTHENTICATED_POLL_EMPTY
```

Execution stopped at the executor's two-status-check limit while the rebuild was
still underway. This is an execution-budget limitation, not a diagnosed DCC
runtime failure. Background rebuild/verification processes were not killed.
The proof command was not started, and independent five-agent review was not
completed. No package or bundle version was changed; no commit was made.

**Outstanding:** confirm rebuild completion and authentication from the new agent;
run the proof in the background; diagnose real failures if any; run again and
compare snapshots; run `--restart` and verify fresh agent observations rather than
only persisted READY; capture lifecycle timestamps, deployment-filtered `docker ps`,
endpoint observations, issuer DID/proof type, and restart comparisons here. There
is no deployment ID, smoke result, or idempotency evidence from this attempt.

## 5A proof — partial contract implementation, no deployment proof

This follow-up adds optional endpoint `readiness.path` and `readiness.expectStatus`.
The agent uses a bounded, unauthenticated GET, defaults the explicit readiness
probe's expected status to 200, and preserves the advertised endpoint URL.
Absent readiness, the existing endpoint-path/2xx behavior is unchanged. Brain's
all-components/all-endpoints READY predicate is unchanged. Endpoint declarations
remain in the hash-bound plan's `endpoints` field alongside `execution`; they were
not moved into the execution block. Hash mutation coverage verifies that changing
the readiness path changes the approval hash.

Executed verification in this follow-up:

- Types build: exit 0; **54 tests passed**.
- Agent typecheck, lint and build: exit 0; **65 tests passed, 1 skipped**.
  New cases cover advertised URL preservation, declared readiness, default 200,
  custom status, fallback 204, invalid paths and invalid status values.
- Brain typecheck: exit 0.
- Requested integration selection: **3 files, 50 tests passed**.
- ESLint on changed types and Brain test files: exit 0.
- LSP error diagnostics: clean on all four changed TypeScript files.

Execution limitations: the implementation worker timed out after five minutes
without returning a result. This is a tooling limitation, not proof of a DCC
runtime failure. `timeout` and `gtimeout` are unavailable on this host; verification
commands instead used Python `subprocess.run(..., timeout=..., check=True)`.
The independent five-agent review was not completed.

**Not performed:** shared core package builder, bundle v1.2.0 publication, seed/prove
scripts, compose allowlist changes, agent image/Brain stack rebuild, operator
installation, smoke issuance, restart/idempotency checks, or seed-dev-all twice.
There is no deployment ID, container evidence, issued proof, or secret-hash evidence
from this follow-up. These are unfinished implementation phases, not established
runtime blockers. No READY claim or production approval is made. No commit was made.

## 5A result

Observed 2026-10-20. **BLOCKED before publication or installation; not READY.**
Owner-directed scope is signing core only: issuer-coordinator + signing-service.
`status-db` requires Mongo replica set (transactions) — pending phase 5B contract
extension; not installable yet. `lcw-exchange` remains excluded because it requires
the unpackaged transaction-service. Neither omission implies production readiness.

### Core image hardening preflight

Pulled the two linux/arm64 digest references in the resolved-images table below.
Image inspection showed:

- issuer-coordinator: no configured User (defaults to root), working directory
  `/app`, entrypoint `docker-entrypoint.sh`, command `node server.js`.
- signing-service: configured User `0`, working directory `/`, entrypoint
  `/nodejs/bin/node`, command `app/server.js`.

Both services ran successfully with explicit `--user 1000:1000 --read-only
--cap-drop ALL --security-opt no-new-privileges`. Issuer additionally used only
`--tmpfs /app/logs:rw,noexec,nosuid,size=16m`; signer needed no writable mount.
The signer had `--network none`; issuer shared its network namespace for this
isolated preflight. No host ports were published. This is not evidence of the
agent's deployment-network path or a real Brain deployment.

Environment mappings exercised: signer `PORT=4006`,
`TENANT_DIDMETHOD_EDU=key`, `TENANT_SEED_EDU` (fresh process-local random seed,
identity-multihash base58btc multibase); issuer `PORT=4005`,
`SIGNING_SERVICE=127.0.0.1:4006`, `ENABLE_STATUS_SERVICE=false`,
`TENANT_TOKEN_EDU` (fresh process-local random token). Both had
`ENABLE_HTTPS_FOR_DEV=false` and `ENABLE_ACCESS_LOGGING=false`.
Secrets were generated inside the startup process, never printed or persisted.
Probe startup wrappers imported the images' real server entrypoints; they did not
test the unmodified default command with agent-generated env files. Initial
wrapper attempts failed on ESM imports / a nonexistent bnid encoder export;
corrected wrappers used dynamic imports and direct base58btc encoding.

Read-only HTTP probes, each with `AbortSignal.timeout(5000)`, observed:

```text
signer GET /healthz 200
issuer GET /        200
issuer GET /instance 404
```

### Blocking endpoint-readiness mismatch

The requested credential-issuer endpoint must advertise `/instance`, but that is
an API base, not a successful unauthenticated GET resource in this pinned image.
`workload-agent/src/health.ts:113–131` independently probes **every** endpoint at
its declared path, without authentication; `httpProbe` requires a successful
HTTP status. Component health at `/` does not override this endpoint failure.
Brain requires all declared endpoints healthy before READY (see
`brain-service/src/workload/README.md:78–85`). The optional bundle member does not
relax the workload's own READY requirements.

`WorkloadEndpointDeclarationValidator` in `packages/learn-card-types/src/workload.ts`
is strict and has no separate readiness-path declaration. Thus the exact requested
`/instance` endpoint cannot become healthy through this agent as currently written,
even with both components healthy. The README's suggestion to declare an
unauthenticated readiness URL does not provide a separate readiness URL field.
No 404-as-healthy exception, skipped endpoint probe, fabricated observation, or
replacement of the requested API base with `/` was introduced.

Next design decision: add an explicit, reviewed, hash-bound endpoint readiness
path (preserving the advertised API base), carry it through planning/approval,
and test that the agent probes it while recording `/instance`. Alternatively,
approve a different endpoint contract. This is separate from the deferred Mongo
replica-set extension; deferring Mongo alone does not resolve this blocker.

### Scope and verification of this attempt

- Existing stack preflight: agent, Brain, console/BFF, Redis and ElasticMQ running;
  platform MongoDB and Neo4j healthy.
- Docker calls were bounded to 10–20 seconds for inspect/run/exec/logs/cleanup and
  120 seconds per image pull. Both pulls completed. Progress was reported between
  preflight stages; no unbounded Docker/network wait was used.
- Both `dcc-5a-*-probe` containers were stopped and removed successfully. Pulled
  images remain cached. No existing stack service was restarted or rebuilt.
- Only this evidence document was changed. No commit was made. No signed workload
  or bundle 1.2.0 was published, no allowlist was changed, and no install was run.
  There is no deployment ID, lifecycle transition, API-issued credential, or
  restart/secret-hash idempotency evidence from this attempt.
- Shared manifest, seed/prove scripts, bundle wiring and requested build/typecheck/
  test/lint suites (including seed-dev-all twice) were **not performed**. Test count
  for this attempt: **0**; the HTTP probes above are not automated-suite results.
- Helper-agent launch failed with `UnknownError` before execution. No delegated
  implementation or independent review result is claimed.
- LEF sign-off, named support owners, managed institution did:web / ISSUES_AS,
  production status publication, and retirement obligations remain OPEN.

## Follow-up implementation and runtime evidence (2026-10-20)

Implemented numeric non-root `user`, bounded declared `tmpfs` (16 mounts maximum,
1–1024 MiB each), endpoint `hostport`, and `ed25519-seed-multibase` generation.
The existing planner copies full components and secret declarations into its
hash-bound execution block; no separate projection change is needed. Added
approval-hash mutation coverage, renderer/policy tests and a known-vector
identity-multihash encoding test. The agent workspace has neither bs58 nor
multiformats as a dependency; the encoder adds no dependency. Brain's existing
bs58 produced the independent vector used in the test.

### Mongo ownership is resolved without capabilities

Executed the pinned Mongo image with these options:

```sh
docker run -d --name dcc-phase5-mongo-probe --network none \
  --user 999:999 --read-only --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --mount type=volume,source=dcc-phase5-mongo-db,destination=/data/db \
  --mount type=volume,source=dcc-phase5-mongo-config,destination=/data/configdb \
  docker.io/library/mongo@sha256:6128e405456dfe502c06fdc1541d70c1a5a416db30dec473dbb2d670b707dec9
docker exec dcc-phase5-mongo-probe mongosh --quiet \
  --eval 'JSON.stringify({ping:db.adminCommand({ping:1}).ok})'
docker exec dcc-phase5-mongo-probe stat -c '%u:%g %a %n' /data/db /data/configdb
```

Observed: `{"ping":1}`, `999:999 755 /data/db`, `999:999 755 /data/configdb`.
Fresh named-volume copy-up supplies correct ownership. No chown or privilege
exception is necessary. This was an isolated runtime probe, not a Brain deployment.

### New blocker: the pinned status manager requires Mongo transactions

The pinned status image contains `@digitalcredentials/credential-status-manager-db`
**0.0.1**. Inspected its installed JavaScript inside the immutable image:

- `dist/credential-status-manager-index.js:39` initializes through `executeTransaction`.
- `dist/credential-status-manager-base.js:306,465` also calls `executeTransaction`.
- `dist/credential-status-manager-mongodb.js:105` uses `session.withTransaction`.

Using the **Mongo driver bundled in that pinned status image**, executed an actual
transactional insert against the hardened Mongo probe (shared network namespace,
no host ports or credentials). It exited 1:

```json
{
    "code": 20,
    "codeName": "IllegalOperation",
    "message": "Transaction numbers are only allowed on a replica set member or mongos"
}
```

Consequently a standalone Mongo ping is not sufficient acceptance evidence. A
replica-set startup configuration and explicit, idempotent initialization are
needed. The current component contract has no command/argv or init declaration.
Do not hide `rs.initiate` in an EXEC readiness check: checks must remain read-only.
The four requested extensions alone do not express this deployment requirement.
This needs an additional reviewed, hash-bound startup/init design or a separately
reviewed immutable Mongo image that provides that behavior.

An additional mapping gap remains: the installed manager rejects host/port-only
configuration without username/password; its fallback constructs an authenticated
Mongo URL. The existing endpoint URL renderer emits `tcp://`, not `mongodb://`.
No guessed credentials, hardcoded deployment hostname, or unapproved endpoint
template was introduced to conceal this gap.

### Acceptance not performed

No signed DCC workload/bundle 1.2.0 publication, shared DCC manifest, seed command,
allowlist change, operator enablement/plan/approve/apply script, credential smoke,
deployment lifecycle, secret listing, or restart-idempotence proof was completed.
No deployment ID exists from this attempt. No secrets were generated for DCC.
No production readiness or LEF sign-off is claimed. lcw-exchange still requires
the unpackaged transaction-service; retirement status publication and institution
ISSUES_AS/managed did:web custody remain OPEN.

## Historical preflight (before the changes above)

### Verification of the partial implementation

- Types build passed; 54 tests passed. The subsequent tmpfs separator rejection
  was exercised by agent tests importing the types source; dist needs rebuilding
  before any deployment of the final source.
- Brain `bun run typecheck`: exit 0.
- Requested integration selection: 3 files, **50 tests passed**, including the
  added approval-plan hash mutation coverage.
- Agent typecheck: exit 0; build and lint passed; **53 tests passed, 1 skipped**
  (the opt-in Docker smoke).
- ESLint on changed types and Brain test files: exit 0.
- Changed TypeScript files had clean LSP error diagnostics before formatting and
  the final tmpfs separator cases.
- Independent review is incomplete: two reviewer launches failed with tool
  `UnknownError`; no full-review PASS is claimed.
- Completed static reviews found outstanding corrections: `URL.host` drops
  explicit default ports 80/443, so the new hostport mapping must instead use
  the declared containerPort; numeric UID/GID values should be runtime-range
  bounded. Mount policy should canonicalize aliases and reject short-form
  delimiters on ephemeral-volume paths as well as the new tmpfs field. Review
  also identified a pre-existing secret EEXIST read-validation/race gap. These
  findings are not fixed or covered by the passing tests above; Part A is partial,
  not merge-ready.
- Agent Docker image rebuild, stack rebuild/restart, and `seed:dev-all` twice
  were not run. They do not establish acceptance without the missing DCC package
  and replica-set/init design.

The following text is historical and describes the earlier preflight, not the
current implementation state.

Observed 2026-10-20. **Not installation acceptance, not READY, and not a published
WorkloadPackage.** This records research and one runtime incompatibility so they
need not be rediscovered. No package, bundle, allowlist, schema, or seed was changed
in this attempt. The implementation and API acceptance proof remain outstanding.

## Resolved images

Resolved with `docker buildx imagetools inspect <repository>:<tag>`. These are
platform manifest digests, not the multi-platform index digests. All five DCC tags
have both linux/arm64 and linux/amd64 images; emulation is unnecessary on this host.
References below are candidates for the signed package, not claims that it was
published with these pins.

| Repository (under docker.io)            | Tag                | Selected platform | sha256 digest                                                    |
| --------------------------------------- | ------------------ | ----------------- | ---------------------------------------------------------------- |
| digitalcredentials/issuer-coordinator   | 1.0.0              | linux/arm64       | ecc5cd955fdf0587b0959482fb7b701d1ec7bd44ee411ceb9b9d5721c518dbfa |
| digitalcredentials/signing-service      | 1.2.0              | linux/arm64       | 446bed585c34417968cb28f52b3618295d84009de19f8b7aec37faadde07d141 |
| digitalcredentials/status-service-db    | 0.1.0              | linux/arm64       | a62f2a1707430adea61bba01521012d46d49ab0e6c8fc50cc188e7451b51e8a8 |
| digitalcredentials/workflow-coordinator | 1.0.1              | linux/arm64       | a4b534d6e0c0b7c78e32da4802044afd78ef6cbf915b59e86ab6aaa58357e2d7 |
| digitalcredentials/dcc-admin-dashboard  | 1.0.1              | linux/arm64       | 90d784dd1b87174318591d1dbaba265bc7e711535cf4baec5118d9cc29fd15e2 |
| library/mongo                           | 7.0 (7.0.45-jammy) | linux/arm64/v8    | 6128e405456dfe502c06fdc1541d70c1a5a416db30dec473dbb2d670b707dec9 |

Mongo 7.0 is a candidate, **not yet compatibility-qualified** with the pinned status
service. The reviewed dashboard compose uses an unversioned `mongo` image; this
does not establish an expected server version. Do not describe Mongo as MIT: MongoDB
Community Server uses SSPL, requiring separate curation/license consideration.

The five DCC repositories' tagged license files are MIT:

- [issuer-coordinator LICENSE](https://github.com/digitalcredentials/issuer-coordinator/blob/48e5a0f53cb6731fa9a88e2f74a05bd5955967be/LICENSE)
- [signing-service LICENSE](https://github.com/digitalcredentials/signing-service/blob/dc84c9fadc376e23c6234d09fd9424cda3da4222/LICENSE)
- [status-service-db LICENSE](https://github.com/digitalcredentials/status-service-db/blob/25f0eef6546b04665a3b61a527baa32e455eef46/LICENSE)
- [workflow-coordinator LICENSE.md](https://github.com/digitalcredentials/workflow-coordinator/blob/ba01b997b33eec10abc5cf44dce50569b0eca6c6/LICENSE.md)
- [dcc-admin-dashboard LICENSE](https://github.com/digitalcredentials/dcc-admin-dashboard/blob/17695be4ec1131cac15fe3dd6c52c553a4b271af/LICENSE)

## Runtime contract mismatches

### Mongo default entrypoint cannot run with the current capability policy

Actual invocation, using the selected immutable image, no network, read-only root,
both declared data volumes, and the agent's capability restrictions:

```sh
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --mount type=volume,destination=/data/db \
  --mount type=volume,destination=/data/configdb \
  docker.io/library/mongo@sha256:6128e405456dfe502c06fdc1541d70c1a5a416db30dec473dbb2d670b707dec9 \
  mongod --version
```

Output (exit 1):

```text
chown: changing ownership of '/proc/1/fd/1': Operation not permitted
chown: changing ownership of '/proc/1/fd/2': Operation not permitted
error: failed switching to 'mongodb': operation not permitted
```

This fails before Mongo starts. Merely making the root filesystem writable would
not repair the capability/identity switch failure. The current strict component
schema has no user override. A narrowly typed, hash-bound non-root user declaration
is a possible next implementation step, but **was not implemented or tested**.
Do not remove `cap_drop: ALL` or grant privileged mode to make this probe pass.

### DCC seeds are not the current agent's hexadecimal Ed25519 seed format

The tagged signing service uses `bnid` v3 `decodeSecretKeySeed`. Its encoding is
`z` + base58btc of `[0x00, 0x20, ...32 seed bytes]`: an identity multihash wrapped
in multibase, **not** an Ed25519 multicodec key and **not** hex.

Sources: [signer decoder](https://github.com/digitalcredentials/signing-service/blob/dc84c9fadc376e23c6234d09fd9424cda3da4222/src/utils/decodeSeed.js),
[bnid encoding](https://github.com/digitalcredentials/bnid/blob/af1a5fe40c0c2012bb07ee84974cdc590737d644/lib/index.js).
The current `ed25519-seed` generator returns hex. Keep that existing format stable;
a new explicitly named, hash-bound provisioning format needs implementation and
round-trip tests before publishing the DCC package.

### Service references need host and port, not a URL

The tagged issuer constructs `http://${SIGNING_SERVICE}/...` and
`http://${STATUS_SERVICE}/...`. Mapping an endpoint's `url` produces a doubled
scheme. Mapping only `host` loses the port. Current endpoint env parts are only
`url`, `host`, and `port`; add a hash-bound `authority` mapping or an equivalently
typed solution, rather than hardcoding the renderer's deployment-specific names.

Source: [issuer config](https://github.com/digitalcredentials/issuer-coordinator/blob/48e5a0f53cb6731fa9a88e2f74a05bd5955967be/src/config.js).

### Logging and optional profile dependencies need explicit treatment

Issuer and workflow coordinators unconditionally configure file transports for
`logs/error.log` and `logs/all.log` in the tagged sources. Resolve their image
working directories and declare bounded writable log mounts; do not assume the
general logging environment variables disable these transports.

Workflow additionally checks a transaction service. The existing six-component
fixture does not declare one. Dashboard needs its own Payload/Mongo configuration
and has no dedicated readiness endpoint. These optional profiles have **not** been
runtime-qualified by the core preflight.

## Proposed core environment mapping (not implemented)

| Component          | Variable                | Source / constraint                                                                                     |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| issuer-coordinator | TENANT_TOKEN_EDU        | Generated persistent tenant-token secret                                                                |
| issuer-coordinator | SIGNING_SERVICE         | Internal signing endpoint authority, host:4006                                                          |
| issuer-coordinator | STATUS_SERVICE          | Internal status endpoint authority, host:4008                                                           |
| issuer-coordinator | ENABLE_STATUS_SERVICE   | Literal true                                                                                            |
| issuer-coordinator | PORT                    | Literal 4005                                                                                            |
| signing-service    | TENANT_SEED_EDU         | Persistent 32-byte seed encoded using bnid format above                                                 |
| signing-service    | TENANT_DIDMETHOD_EDU    | Literal key, development only; not managed institution did:web                                          |
| signing-service    | PORT                    | Literal 4006                                                                                            |
| status-service-db  | CRED_STATUS_SERVICE     | Literal mongodb                                                                                         |
| status-service-db  | CRED_STATUS_DB_URL      | Private mongodb:// URL; tcp:// endpoint URL is not valid                                                |
| status-service-db  | CRED_STATUS_DID_SEED    | Dedicated persistent status signing seed                                                                |
| status-service-db  | STATUS_CRED_SITE_ORIGIN | Explicit development status publication origin; container URL is not a publicly reachable status origin |
| status-service-db  | PORT                    | Literal 4008                                                                                            |
| Node services      | ENABLE_HTTPS_FOR_DEV    | Literal false for this private HTTP deployment                                                          |
| Node services      | ENABLE_ACCESS_LOGGING   | Literal false; separately verify other logging does not disclose credential data                        |

Use either `CRED_STATUS_DB_URL` or the manager's host/port/user/password configuration;
the latter must be checked against its exact connection/authentication behavior.
No database credentials were generated in this attempt.

## Health evidence from tagged source, not live service observations

- Signer `GET /healthz` performs a signing test; `GET /` is shallow.
- Issuer `GET /` checks its signing/status dependencies, but its error handling must
  be accounted for; do not rely on it alone to establish all-component readiness.
- Status `GET /` is shallow after asynchronous manager initialization. Continuing
  database readiness needs a database probe as well.
- Mongo should use a read-only ping, not merely an open TCP socket.
- Dashboard `GET /` redirects to `/admin`; the agent does not follow redirects.

## Acceptance evidence and outstanding work

Observed existing containers: agent and Brain running, Neo4j and platform Mongo
healthy, console/BFF/Redis running. Pulled the selected status and Mongo images.
No workload deployment was created through Brain. No tenant secrets were created
or printed. No existing service was restarted. No commit was made.

**Not performed:** shared fixture implementation, signed workload publication,
bundle 1.2.0 publication, allowlist changes, seed-dev-all integration, real operator
enablement/plan/approve/apply, lifecycle polling, credential issuance, restart and
volume/secret idempotence proof, or the requested build/typecheck/test/lint suites.
Consequently there are no deployment IDs, endpoint observations, workload log
excerpts, or secret-directory evidence to report.

The obstacles above are implementation work, not proof that the requested local
acceptance is impossible. Do not mark the existing Release / pinning gate complete:
digests are resolved here but not yet published in a signed package, and LEF sign-off
remains open. Named support contacts, production status publication and retention,
and the managed did:web / ISSUES_AS custody seam remain open as well.

## 5A proof — READY (2026-10-21)

The DCC issuer signing core installed through the real operator path and reached READY,
then issued a signed credential. Command: `bun run prove:dcc-workload [-- --reset|--restart]`
from `services/learn-card-network/brain-service`.

**Lifecycle** (intent `int_235369b3…`): APPROVED → APPLIED 02:11:39.5Z → workload APPLYING →
workload READY + intent READY 02:11:49.7Z (~10 s after apply).

**Containers** (`docker ps --filter label=org.learncard.workload.deployment=…`):
`issuer-coordinator  Up  127.0.0.1:24982->4005/tcp` and `signing-service  Up  4006/tcp`
(internal only).

**Endpoints observed:** `issuer` → `http://127.0.0.1:24982/instance` healthy;
`signing-service` → `http://signing-service-e234db522da6:4006/` healthy.

**Smoke:** POST `/instance/edu/credentials/issue` (tenant token read from the 0600 secret
file, never printed) → signed VC, issuer `did:key:z6MkgZb74HR2LJK2FejwseDgg5xXNXFadmmxj2Swdj1vyU9L`,
proof `Ed25519Signature2020`.

**Idempotency:** re-run reused the approved intent; `docker restart lcn-workload-agent
lcn-brain-service` → READY again with identical deployment id, container IDs and secret-file
SHA-256 prefixes; the issuer DID is unchanged (seed not regenerated). **Retire:** `--reset`
drove RETIRING → RETIRED, retaining volumes and secrets.

### Defects found and fixed during the proof

1. **Planner rejected the package: curator allowlist not passed to brain.** `compose-workloads.yaml`
   now sets `WORKLOAD_CURATOR_DIDS` (dev signer) for brain.
2. **Upstream crash when probed out of order.** issuer-coordinator's `GET /` calls the signer and
   double-responds on error (`ERR_HTTP_HEADERS_SENT`), killing the process. The agent now probes in
   dependency order (dependents only after dependencies are healthy) and renders
   `restart: on-failure:5`.
3. **Endpoint hostnames exceeded the 63-char DNS label limit.** Internal endpoint values used the
   83-char `container_name`; Node's resolver returned `ENOTFOUND`. They now use the Compose service
   name (unique within each deployment's private network).
4. **Published ports were inert on an `internal: true` network.** Components with
   ecosystem/public endpoints now also join a non-internal per-deployment `edge` network (ports
   still bound to 127.0.0.1). Dev trade-off: those components gain outbound network access.
5. **Intent removal failed when bindings referenced a target** (`Cannot delete node … still has
relationships`; latent since DCC Tools v1.1 default bindings). Bindings are already revoked
   first; App/Wallet/Registry targets are now detach-deleted (revoked bindings keep provider/consumer
   ids as properties). Regression test added and shown to fail without the fix.
6. **Smoke payload**: DCC issuer-coordinator takes the unsigned VC as the whole body (not a VC-API
   `{ credential }` envelope) and the signer requires an `issuer` property.

### Still OPEN

Status list / revocation (status-service-db needs a Mongo replica set — phase 5B contract work);
`lcw-exchange` (transaction-service unpackaged); live status publication after retirement;
institution `ISSUES_AS` / managed did:web custody (the issuer is the signing-service tenant
did:key); LEF pin sign-off and named support owners.

## 5B result — implementation and transactional smoke; live acceptance unverified (closed by Step 4c)

Observed 2026-10-22. **Not READY: no status-enabled installation/issuance/restart
acceptance is claimed. No commit was made.** Consent/binding files were not edited.

Implemented the owner-approved argv command contract, service/init lifecycle,
strict private MongoDB endpoints and execution semantics version 2. Full execution
declarations and endpoint query/path/protocol remain approval-hash-bound. Added
mutation coverage for argv order/content, lifecycle/timeout and Mongo query fields.
The agent uses explicit dependency-ordered `up --no-deps`, current-attempt init exit
inspection, bounded startup/deadline handling, private init networking and no restart.
No named-volume deletion was introduced. Completed init observations do not count as
unhealthy services. Recovery now requests a new Brain-authorized leased operation;
local state alone cannot authorize replay. Failed recovery is terminal through the
ordinary operation path. Service health is attempt-aware. Mongo observed URL query
and path must match the approved declaration.

The separate `buildDccStatusWorkloadPackage` adds Mongo, mongo-init and status-service-db
without modifying the core-only builder. The fixed mongosh script reads only the
endpoint hostport environment value, initiates only on NotYetInitialized, verifies
the existing set/member and waits for writable PRIMARY without force reconfiguration.
The status publication origin remains deliberately `https://status.example.invalid`;
public status hosting is not proven by this development package.

### Executed evidence

- Types build: exit 0; **121 tests passed**.
- Agent typecheck/lint/build: exit 0; full suite **71 passed, 2 skipped** before
  the final recovery hardening. After hardening, affected init/health/jobs suites:
  **28 passed**, including six init outcome cases (success, nonzero, signal, stale
  attempt, create/start failure, timeout/kill); typecheck/lint/build again exit 0.
- Brain `bun run typecheck`: exit 0 after recovery authorization changes.
- Requested integration suites ran individually: workload packages **27 passed**,
  workload deployments **21 passed**, DCC Tools bundle **2 passed**. After adding
  recovery authorization coverage, workload deployments **22 passed**.
- ESLint on changed types/Brain files: exit 0. LSP error diagnostics clean on all
  changed TypeScript files.
- Real Docker `DCC_MONGO_SMOKE=1 bun run test -- test/mongo-transactions.test.ts`:
  **1 passed**. This started the pinned Mongo image as 999:999 with named volumes,
  initialized single-node rs0 using the same fixed script, then used
  `/app/node_modules/mongodb` **inside the pinned status-service-db image** to
  commit/insert/read back and abort an insert with verified absence. The test
  asserted `TRANSACTION_COMMIT_READBACK_AND_ABORT_OK`. Test containers/network were
  removed; named volumes were retained.
- `bun run seed:dcc-workload --status`: exit 0, published
  `org.dcc.issuer-status@1.0.0`, package version
  `wpv_9eaa5af4-119c-4b98-87f8-cab2a626f5e1`, manifest hash
  `3a9c879e5c3f2fdeed2069b28b1098b8712761bfa742351b1723d20ad4d6dbb3`.
  DCC Tools **1.3.0**, listing `6d44d1c6-3085-4f04-9357-c243e1b2a5e0`, version
  `7694fb40-27a6-40ea-8af4-2f465e07350e`. The initial seed log incorrectly printed
  1.2.0 in its human-readable message; the returned signed manifest was 1.3.0.
  The logging text has been corrected without changing the published manifest.

### Live proof blocker and remaining verification

The requested dev stack rebuild/start ran under nohup, with output at
`/tmp/dcc-5b-stack.log`. The final captured lines show Brain, agent, console/BFF and
console web started. A follow-up rebuild/proof chain used `/tmp/dcc-5b-proof.log`.
**Its Bun `--cwd` wrapper printed script usage instead of running the proofs, yet
returned `PROOF_EXIT=0`. That exit code is not proof evidence.** Neither core-only
nor status-enabled live proof is confirmed by this attempt. Execution stopped at
the executor's two-status-check limit; this is a harness/execution limitation,
not an observed DCC issuance failure.

Run the proofs from the Brain workspace directly under nohup (without the broken
wrapper), capture their actual output, and confirm fresh post-restart observations:
`bun run prove:dcc-workload`, then `bun run prove:dcc-workload --status`.
The status mode asserts non-empty credentialStatus before and after restart,
unchanged issuer DID/secrets/Mongo volume identities and a new successful init attempt.
Those assertions have **not** been exercised against a live deployment here.

Independent review was incomplete: three Oracle reviews ran and identified recovery,
deadline and stale-health gaps addressed in the follow-up; the QA agent failed to
launch. No independent all-pass review of the final follow-up is claimed. Additional
fault-injection coverage is still warranted for Docker inspection failure before
container identity can be established (the agent fences for operator reconciliation),
cleanup ambiguity, queued retirement during recovery, and removed-component upgrades.
Production custody, public status hosting/retirement, support ownership and LEF sign-off
remain OPEN.

## Step 4a result — BLOCKED: advertised exchange origin cannot use allocated host port (since resolved)

Observed 2026-10-22. **Not READY; no exchange package was published or installed.**
Stopped at the requested contract-compatibility gate. Only this evidence document
was edited; no consent/binding code, existing builders, allowlists or contract was
changed. No agents were delegated work and no commit was made.

### Upstream research

Read the real repositories using `gh api repos/digitalcredentials/<repo>/contents/<path>`
with the raw media type: READMEs, workflow `.env.example` and `docker-compose.yml`,
tagged source, Dockerfiles and licenses. The transaction-service v0.4.0 root listing
contains neither `.env.example` nor `docker-compose.yml`, despite its README claiming
a sample env file. Source takes precedence over stale README/Compose examples.

- Workflow-coordinator **v1.0.1**: [config](https://github.com/digitalcredentials/workflow-coordinator/blob/v1.0.1/src/config.js),
  [routes](https://github.com/digitalcredentials/workflow-coordinator/blob/v1.0.1/src/app.js).
  `PORT` defaults to 4005; `SIGNING_SERVICE`, `STATUS_SERVICE`, and
  `TRANSACTION_SERVICE` are **host:port**, with HTTP prepended by the routes.
  `PUBLIC_EXCHANGE_HOST` is a full externally usable origin, defaulting to
  `http://coordinator:4005`. `TENANT_TOKEN_EDU` protects the `edu` setup request;
  `ENABLE_STATUS_SERVICE=true` enables status allocation, and
  `ENABLE_HTTPS_FOR_DEV=false` / `ENABLE_ACCESS_LOGGING=false` suit the dev topology.
  Default `test` and `random` tenants are UNPROTECTED unless explicitly overridden.
  `GET /` checks status (when enabled), signer and transaction dependencies, but
  its catch/next paths continue to the success response: dependency-ordered probes
  remain important. No dedicated `/healthz` route is defined in this tag.
  Image source uses `/app`, `node server.js`, and no USER directive. Logger creates
  `logs/error.log` and `logs/all.log` regardless of access logging; a non-root
  package would need a bounded `/app/logs` tmpfs. Non-root runtime not tested here.
- Transaction-service **v0.4.0**, source commit
  `2639e2a94503e1e813b9463c95dabd6fe5d4b603`:
  [manager](https://github.com/digitalcredentials/transaction-service/blob/v0.4.0/src/transactionManager.js),
  [routes](https://github.com/digitalcredentials/transaction-service/blob/v0.4.0/src/app.js),
  [server](https://github.com/digitalcredentials/transaction-service/blob/v0.4.0/server.js).
  Actual default port is **4004**, not the README's 4006. Server uses bitwise
  `process.env.PORT | DEFAULT_PORT`, so 4004 should be retained rather than assuming
  arbitrary port overrides work. Keyv is in-memory by default; `PERSIST_TO_FILE`
  selects keyv-file with the supplied filename (100 ms batched writes). No Redis
  service is required. The source assigns `DEFAULT_TTL` to ten minutes rather than
  honoring an existing value; per-record `timeToLive` is supported, as is
  `deleteWhenCollected`. `GET /` is shallow after manager initialization.
  `/healthz` creates a test exchange and verifies DIDAuth, so it is a **mutating**
  probe, not a read-only storage-readiness check. Morgan request logging is
  unconditional and includes exchange paths; do not collect raw logs containing
  exchange identifiers in proof output. Image source uses `/app`, `node server.js`,
  no USER directive. Persistent file ownership/non-root operation remains untested.
- Both tagged LICENSE.md files are **MIT**. The inherited Mongo component remains
  SSPL, not MIT; this research does not change its curation obligations.

### Immutable images confirmed

Executed `docker buildx imagetools inspect` for both tags (exit 0). Both advertise
linux/arm64 and linux/amd64, plus attestation manifests. These are resolved pins,
not installed-image/runtime evidence:

| Image                                                     | linux/arm64 manifest digest                                               | Multi-platform index digest                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `docker.io/digitalcredentials/transaction-service:0.4.0`  | `sha256:937924f3b383426a41e95cfa63b53d14a5d03e861889a699ddcd99cc744bde75` | `sha256:75029d1e4f545a8fa22e1e6bcb90a82c7f208984fd2b6f5f7ff5fa56963bcde0` |
| `docker.io/digitalcredentials/workflow-coordinator:1.0.1` | `sha256:a4b534d6e0c0b7c78e32da4802044afd78ef6cbf915b59e86ab6aaa58357e2d7` | `sha256:de3d2fdb0fa8228e6839bc148824859ca81a9775f2f118b2ec4f38c89405c642` |

The workflow arm64 digest matches the earlier resolved-images table.

### Actual exchange flow (source evidence, not an executed exchange)

1. POST **`/exchange/setup`** to workflow-coordinator, with tenant bearer token and
   `{tenantName: 'edu', data: [{vc: <unsigned OBv3 credential>, retrievalId: <id>}]}`.
   This is not workflow `POST /exchange`; that route belongs to transaction-service.
2. Workflow unconditionally sets `exchangeData.exchangeHost = exchangeHost` from
   `PUBLIC_EXCHANGE_HOST`, verifies tenant authorization, then calls transaction
   `POST /exchange` internally.
3. Response is an array containing `retrievalId`, `directDeepLink`, `vprDeepLink`,
   `chapiVPR` (and optional metadata). Links use **`https://lcw.app/request.html`**,
   not `dccrequest://`. Their `vc_request_url` values use the configured origin and
   `/exchange/<exchangeId>` or `/exchange/<exchangeId>/<transactionId>`.
4. Initial POST to `/exchange/<exchangeId>` returns
   `{verifiablePresentationRequest: {query: [{type: 'DIDAuthentication'}], challenge,
domain, interact: {service: [...]}}}`. The continuation service type in that
   wrapper is `UnmediatedPresentationService2021`; setup's `chapiVPR` instead uses
   `VerifiableCredentialApiExchangeService`. A proof must test the actual shapes.
5. Continuation POST supplies the DIDAuth presentation itself. Workflow verifies
   via transaction-service, assigns `credentialSubject.id` from the holder, allocates
   status, and invokes the tenant signer before returning the signed credential.
   Full links/challenges/exchange identifiers should not be printed.

### Precise contract gap and why existing fields do not solve it

`packages/learn-card-types/src/workload.ts:61–72` permits only endpoint `url`, `host`,
`port`, and `hostport`, with no internal/published address selector.
`workload-agent/src/render.ts:192–201` resolves every endpoint env source through
`endpointUrl(spec, deployment, source.endpointId)` **without the allocated ports**.
At lines 149–165, `endpointUrl` uses a published loopback URL only when passed the
ports map; otherwise it returns the Compose service hostname and container port,
even for `visibility: 'ecosystem'`. The README explicitly documents this distinction
at lines 133–142. Consequently mapping `PUBLIC_EXCHANGE_HOST` to an ecosystem
endpoint's `url` produces a Docker-private address, not the host-callable exchange.

The missing capability is a hash-bound endpoint env reference to the **allocated
published origin** (scheme + loopback host + reserved host port, without a trailing
path/slash). For example, the required value would have shape
`http://127.0.0.1:<allocated-port>`, while the current reference has shape
`http://<compose-service>:4005/`. Upstream concatenates `/exchange/...` directly.
An `/exchange` endpoint path would also duplicate that path if used as the origin.

Literal/config fields can hold an operator-supplied origin, but do not bind it to
the agent's allocation: `compose-driver.ts:115–147` chooses ports from deployment
identity and collision reservations, with no package/config host-port override.
A separately pre-provisioned stable reverse proxy could supply an origin, but is
not part of this requested self-contained loopback deployment. Guessing a future
port, modifying generated env after approval, rewriting returned URLs in the proof,
or injecting a request-body `exchangeHost` does not establish the requested flow
(the last is explicitly overwritten upstream). No such workaround was introduced.

Next approval needed: define published-origin env mapping semantics, keep internal
service references unchanged, and bind/test them through planning/rendering and
restart. This is a proposal only, **not an implemented contract extension**.
Host-loopback links would support the requested local wallet simulation, not a
physical phone's remote reachability; that is a separate deployment concern.

### Verification scope

No package/bundle versions were consumed or changed. No seed, build, stack up,
live proof, restart, or secret generation was performed. Requested types/Brain/
agent tests, lint and status-regression proof were **not run**, because implementation
stopped at the explicitly requested contract gap. Test count for this attempt: **0**.
No TypeScript files changed, so TypeScript diagnostics/build verification is not
applicable to the documentation-only edit. Earlier READY evidence is not claimed
as a fresh regression result. Exchange acceptance remains blocked pending approval.

**Subsequent resolution:** the Step 4a contract gap was resolved by the generic
`address: 'published'` endpoint environment source with `part: 'origin'`
(Oracle-reviewed in the preceding contract work). Step 4c uses that contract;
it does not rewrite wallet URLs or inject `exchangeHost` into setup requests.

## Upstream status-list size (checked 2026-10-23)

`digitalcredentials/credential-status-manager-db` `src/credential-status-manager-base.ts:27`
hard-codes `CREDENTIAL_STATUS_LIST_SIZE = 100000` (also used for list rollover at
`:473` and creation at `:1778`). Latest commits: status-manager-db `d0a3ad94`
(2024-09-04), status-service-db `25f0eef6` (2024-10-10). No releases, configuration
option or upstream issue referencing the 131072 minimum was found. A fix therefore
requires an upstream change or a patched, separately pinned image. Awaiting user
decision.

## Step 4c result — local exchange proof (NOT consent-gated)

**Latest result (1.0.2 / 1.4.2): PROOF COMPLETE WITH LABELS.** At the user's explicit
direction, the exact upstream status-list size failure (100000 entries; verifier
minimum 131072) is labelled, **not accepted as conformant**, while registry and
single-use assertions run to completion. No PROOF READY is claimed. See the final
follow-up below; earlier failures are retained as history.

Initial 1.0.0 attempt, observed 2026-10-23. **Full exchange proof BLOCKED, not PROOF READY:** the signed
credential's cryptographic proof verified, but DIDKit classified unreachable
placeholder status-list hosting as a verification **error**, not a warning.
Built and published `org.dcc.issuer-exchange@1.0.0` through
`seed-dcc-workload.ts --exchange`, with optional `dcc-issuer`, profile `core`, in
DCC Tools **1.4.0**. The builder clones the status fixture; existing core/status
builders and older bundle outputs are unchanged. The status readiness gate is
preserved as OPEN, and the exchange-only learner claim-choice readiness note is
OPEN. This is catalog evidence, not a consent enforcement mechanism.

### Package and runtime

- Transaction-service 0.4.0:
  `docker.io/digitalcredentials/transaction-service@sha256:937924f3b383426a41e95cfa63b53d14a5d03e861889a699ddcd99cc744bde75`.
- Workflow-coordinator 1.0.1:
  `docker.io/digitalcredentials/workflow-coordinator@sha256:a4b534d6e0c0b7c78e32da4802044afd78ef6cbf915b59e86ab6aaa58357e2d7`.
- Both declare `1000:1000`, bounded tmpfs, and dependency-ordered root probes.
  Transaction `/healthz` is never probed. Transaction state remains in-memory.
- Workflow uses private hostport dependencies and the agent-assigned published
  exchange origin. EDU reuses the tenant secret; generated 32-byte secrets protect
  workflow `test` and `random` tenants. HTTPS-for-dev and access logging are off.
- True package sizing is **2750m CPU / 2816 MiB / 704 PIDs**, including init.
  `parseSpec` enforces ceilings per component; no aggregate sizing-vs-env ceiling
  check was found in Brain or the compose driver. Defaults were not raised.
- Rebuilt and recreated the agent (code is baked into its image, not bind-mounted).
  A filtered `docker inspect` confirmed both new pins in the running allowlist.
  Rebuilt types and restarted Brain/BFF. No workload contract or agent source edits.
- Prior standalone preflight: transaction root HTTP 200 under non-root/read-only/
  cap-drop hardening; workflow HTTP 500 without dependencies was expected and is
  not counted as successful readiness. Temporary preflight containers were removed.

### Commands and verification

Commands below run from the indicated directories. Long jobs were launched with
`nohup sh -c '<commands>' > /tmp/dcc-exchange-*.log 2>&1 &`; logs were polled with
`tail`. No `timeout` executable, delegated agents, commits, or history changes.

```sh
# packages/learn-card-types
npx vitest run src/workload.spec.ts && bun run build
# workload-agent
bun run typecheck && bun run test && bun run lint
# brain-service (integration suites sequential)
bun run typecheck
bun run test:integration -- test/dcc-tools-bundle.spec.ts
bun run test:integration -- test/workload-packages.spec.ts
# apps/learn-card-app
docker compose -f compose-local.yaml -f compose-workloads.yaml --profile console --profile workloads up -d --build --no-deps lcn-workload-agent
# repository root
docker restart lcn-brain-service lcn-console-bff
# brain-service
bun scripts/seed-dcc-workload.ts --exchange
bun run prove:dcc-workload -- --exchange
```

- Types: **59 passed**, build successful.
- Agent: typecheck/lint passed; **80 passed, 2 skipped** across 7 passed / 2 skipped files.
- Brain: both typecheck entrypoints passed; bundle integration **2 passed**;
  workload-package integration **27 passed**.
- Changed TypeScript files: language-server error diagnostics clean.
- Prettier applied to changed files. Existing proof script alias reused.
- Local native DIDKit addon was unavailable; LearnCard explicitly fell back to WASM.
  Vite emitted existing native-config/tsconfig-paths migration advisories.

### Protocol and remaining OPEN findings

The pinned public setup handler forwards data items unchanged, so this proof opts
into `deleteWhenCollected: true`. Continuation sends a **raw signed DIDAuth VP**;
the coordinator returns a **signed VC directly**, not a presentation envelope.
The proof checks the holder, smoke issuer, status, signature verification, registry,
and rejected replay. Upstream maps internal 404 to HTTP 500, so replay assertions
also inspect `serviceResponseStatus=404` and `Unknown exchangeId.` without logging
the response or identifiers.

- Consent/learner claim choice is **not gated**, explicitly deferred by the user.
- Phone reachability requires a non-loopback published-address resolver; localhost
  simulation is not phone UX evidence.
- Placeholder `status.example.invalid` is not public status-list hosting. Any
  verification warnings must be reported; public revocation availability stays OPEN.
- Registry membership is observed, never fabricated; a local dev did:key is not
  production trust evidence.
- Issuer-coordinator 1.0.0 defaults **test, testing, random** to UNPROTECTED.
  Those inherited declarations are unchanged, including in the exchange clone;
  tenant hardening there remains OPEN. Workflow defaults are protected separately.
- Single-use is opt-in, not an upstream default. In-memory exchanges disappear on
  transaction-service restart; deletion happens before downstream signing, and
  concurrent-claim atomicity is not established by a sequential replay proof.
- Key custody, registry onboarding, TLS/routing, persistence, licensing review,
  operational ownership/SLOs, and all other production gates remain OPEN.

### Live proof evidence

Publication, operator approval/apply, workload READY, restart recovery, live
non-root hardening, exchange setup, published-origin resolution, wallet DIDAuth,
and receipt of a signed credential were observed. The credential subject matched
the holder and its issuer matched the smoke issuer; credentialStatus was present.
The verifier returned `Success proof` and `Success expiration`, **but also a
Failed status-list fetch**. This is not an acceptable warning and was not hidden,
downgraded, or bypassed. No final PROOF READY line was emitted.

Registry membership and sequential single-use rejection were **not reached** in
the live run, because verification fails before those assertions. Their code is
implemented, but neither a registry finding nor a successful replay rejection is
claimed. Consent remains deliberately not gated; the final consent log line was
likewise not reached.

Attempt history and deviations:

1. First live attempt reached exchange initiation, then importing Brain's
   `getLearnCard` helper failed its database environment validation. Fixed by using
   standalone `@learncard/init` with the locally installed DIDKit WASM; no database
   credentials or environment bypass were added to the proof.
2. A retry command was accidentally launched from the repository root, invoking
   the root Nx typecheck/dependency build rather than Brain's script. It was
   terminated; intermediate declarations were restored with direct types and
   learn-card-plugin builds. No source edits to those dependencies were made.
   Two intermediate Brain checks failed on stale/missing dependency declarations;
   the final Brain typecheck passed before the second actual live proof ran.
3. Second live attempt reused the same approved intent (no reset or deletion),
   completed DIDAuth and received the VC, then failed status verification as above.

Additional recovery commands (from their respective package directories):

```sh
# packages/learn-card-types
bun run build
# packages/plugins/learn-card
bun run build
# brain-service
bun run typecheck
bun run prove:dcc-workload -- --exchange
```

Final proof log: `/tmp/dcc-exchange-proof-recovered.log`. Key redacted lines:

```text
2026-10-23T17:32:19.583Z REUSE intent=[REDACTED opaque value] approval=APPROVED
2026-10-23T17:32:19.811Z intent=[REDACTED opaque value] phase=READY workload=READY deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:34:09.969Z intent=[REDACTED opaque value] phase=READY workload=READY deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:34:10.000Z IDEMPOTENCY restart unchanged
2026-10-23T17:34:10.132Z RECOVERY init succeeded with new attempt=[REDACTED UUID]; Mongo volumes preserved
2026-10-23T17:34:10.281Z SMOKE issuer=did:key:[REDACTED opaque value] proofType=Ed25519Signature2020
2026-10-23T17:34:10.281Z STATUS credentialStatus present
2026-10-23T17:34:10.343Z HARDENING transaction-service user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T17:34:10.386Z HARDENING workflow-coordinator user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T17:34:10.430Z EXCHANGE setup passed (deleteWhenCollected=true)
2026-10-23T17:34:10.430Z EXCHANGE vc_request_url uses published origin
2026-10-23T17:34:10.474Z EXCHANGE DIDAuthentication request received
2026-10-23T17:34:10.932Z WALLET LearnCard DIDAuth VP signed (authentication)
2026-10-23T17:34:11.112Z EXCHANGE signed credential received; holder, issuer and credentialStatus matched
2026-10-23T17:34:11.138Z VERIFY Failed Unable to fetch status list credential: Unable to load resource: Error sending HTTP request:: Unable to fetch status list credential: Unable to load resource: Error sending HTTP request: error sending request
2026-10-23T17:34:11.138Z VERIFY Success proof: Valid
2026-10-23T17:34:11.138Z VERIFY Success expiration: Does Not Expire
2026-10-23T17:34:11.138Z BLOCKED Credential verification failed or has no successful proof check
error: script "prove:dcc-workload" exited with code 1
```

**Exact remaining acceptance gap:** provide legitimately reachable status-list
hosting (requiring a new immutable package/bundle version if the manifest changes),
or an explicitly reviewed verification policy for unavailable status. The current
requirement accepts warnings only, not verification errors. No such policy change
was made, and the existing published exchange manifest must not be overwritten.
After that gap is resolved, rerun the operator proof through registry and replay
checks. All production gates remain OPEN.

### 1.0.1 follow-up — read-only public status gateway

The implemented correction targets `org.dcc.issuer-exchange@1.0.1` via DCC Tools
**1.4.1**, not a rewrite of the immutable 1.0.0 / 1.4.0 versions. No code depended
on rebuilding the historical exchange 1.0.0 fixture; the exchange builder now
produces 1.0.1. Core/status builders and older published records remain unchanged.

Upstream source checked directly with `gh api`:

- `digitalcredentials/status-service-db`, `src/app.js`: unauthenticated
  `POST /credentials/status/allocate`, `POST /credentials/status`, credential-info
  `GET /credentials/:credentialId`, and list-read `GET /:statusCredentialId` all
  share one port. Publishing that port would expose writes and credential metadata.
- Its `src/status.js` passes `STATUS_CRED_SITE_ORIGIN` to the database status
  manager as `statusCredentialSiteOrigin`.
- `digitalcredentials/credential-status-manager-db`,
  `src/credential-status-manager-base.ts`: list URLs are
  `${this.statusCredentialSiteOrigin}/${statusCredentialId}`; generated IDs are
  20 alphanumeric characters. This matches the gateway's single-segment allowlist.

The fixed exported `DCC_STATUS_GATEWAY_SCRIPT` runs with
`command: ['node', '-e', DCC_STATUS_GATEWAY_SCRIPT]` in the already-pinned image:

```text
docker.io/digitalcredentials/status-service-db@sha256:a62f2a1707430adea61bba01521012d46d49ab0e6c8fc50cc188e7451b51e8a8
```

No new image, external proxy, contract change, or agent change is introduced.
The gateway declares user `1000:1000`, port 4010, dependency `status-service-db`,
100m CPU / 64 MiB / 32 PIDs, and no writable mounts. Package totals are now
**2850m CPU / 2880 MiB / 736 PIDs**, including init. Existing per-component ceilings
and image allowlist are sufficient.

Security boundary:

- `STATUS_UPSTREAM` must match `^[a-z0-9-]+:[0-9]+$` and comes from the private
  `status-service` hostport endpoint. The service itself stays internal.
- Only GET/HEAD are allowed; other methods return 405 before any upstream request.
- `/` is a local 200 health response. All other raw request targets must match
  `^/[A-Za-z0-9_-]{1,128}$` and cannot equal `/credentials`; invalid targets return
  404 without contacting upstream. No decoding/normalization allows nested or
  encoded paths through. Queries are rejected too.
- Allowed requests carry no body and forward only Accept. The proxy does not
  follow redirects and returns only upstream status and Content-Type, not cookies,
  redirects, or internal response headers. Node supplies normal HTTP framing.
- Absolute timeout is 5 seconds; upstream errors and responses over 1 MiB become 502. Responses are buffered within that bound before headers are sent. No path
  logging or upstream error-detail disclosure is introduced.
- `status-public` is ecosystem-visible, auth none, root path, local root readiness,
  purpose `status-list-publication`, and not preserved on retirement. Only the
  exchange clone's status origin now references its agent-assigned published origin.

The proof defaults to bundle 1.4.1 and has explicit
`--retire-previous-exchange` support scoped to bundle 1.4.0 and package 1.0.0 in the
active ecosystem. Retirement uses `revokeInstallIntent` and waits for the agent;
there are no database writes, manual volume deletions, or workload Compose bypasses.
The new version selects a new intent and fresh Mongo state instead of reusing lists
whose URLs were baked with `example.invalid`.

Fresh verification commands (run in the indicated package directories, using
`nohup ... > /tmp/dcc-status-gateway-checks.log 2>&1 &` for the sequential job):

```sh
# packages/learn-card-types
npx vitest run src/workload.spec.ts && bun run build
# services/learn-card-network/workload-agent
bun run typecheck && bun run test && bun run lint
# services/learn-card-network/brain-service
bun run typecheck
bun run test:integration -- test/dcc-tools-bundle.spec.ts
bun run test:integration -- test/workload-packages.spec.ts
```

Results: types **61 passed**, build passed; agent **80 passed / 2 skipped**, typecheck
and lint passed; Brain typecheck passed, integrations **2 passed** and **27 passed**
(run sequentially). Changed TypeScript error diagnostics were clean. Gateway unit
tests execute the exact fixed program with real ephemeral HTTP servers, covering
invalid configuration, local health, blocked methods/paths without upstream calls,
GET/HEAD, request/response header filtering, the exact 1 MiB boundary, overflow,
upstream 404, connection failure, and the actual 5-second timeout.

Live command (Brain directory):

```sh
nohup sh -c 'docker restart lcn-brain-service lcn-console-bff && bun scripts/seed-dcc-workload.ts --exchange && bun run prove:dcc-workload -- --exchange --retire-previous-exchange' > /tmp/dcc-status-gateway-proof.log 2>&1 &
```

The updated proof requires status-list URLs to match the observed published
gateway origin, asserts both write routes return 405 and credential-info paths
return 404, and requires successful **proof and status checks with no errors or
warnings** before registry/replay checks and the final READY line.

#### Follow-up execution result — BLOCKED before publication

The fresh test/build/typecheck/lint results above passed. The live command then
restarted Brain and BFF, but the seed process failed connecting to its configured
Neo4j server. It reported `Neo4jError` / `ServiceUnavailable` from
`seed-dcc-tools.ts:98`, called by `seed-dcc-workload.ts:53`. Cleanup subsequently
reported `Pool is closed, it is no more able to serve requests.` during index
creation. The error does not establish whether the underlying cause is service
availability, host/port configuration, or connection/encryption settings; no cause
is invented here.

The shell used `&&`, so it did **not** start `prove:dcc-workload` after that seed
failure. New 1.0.1 / 1.4.1 publication was not confirmed, no old intent was retired,
and no new intent installed. Gateway live hardening, published list URLs, status
verification, registry, and single-use rejection are **not newly verified**.
There is no PROOF READY line. The earlier 1.0.0 signed-credential evidence remains
historical and is not evidence for the new gateway.

Redacted failure evidence from `/tmp/dcc-status-gateway-proof.log`:

```text
Neo4jError: Failed to connect to server. Please ensure that your database is listening on the correct host and port and that you have compatible encryption settings both on Neo4j server and driver. Note that the default encryption setting has changed in Neo4j 4.0.
retriable: true
code: "ServiceUnavailable"
at scripts/seed-dcc-tools.ts:98:26
at scripts/seed-dcc-workload.ts:53:28
at scripts/seed-dcc-workload.ts:180:30
Error creating indices:
Neo4jError: Pool is closed, it is no more able to serve requests.
retriable: false
code: "N/A"
```

**Next execution prerequisite:** restore the seed process's connection to the
development Neo4j instance, then rerun the same seed and scoped operator proof
command. No verification bypass, manual database mutation, volume removal, or
contract change was used to work around the failure.

Remaining OPEN items: consent/claim choice remains deliberately deferred; the
gateway is loopback-only HTTP and does not add browser CORS headers or production
TLS/routing; phone reachability, registry trust, key custody, availability and
operational ownership remain OPEN. Per-request response/timeout bounds are not
global rate limiting. The inherited issuer's default tenant exposure and upstream
in-memory/opt-in single-use/concurrency risks remain as recorded above. No new
third-party image or allowlist change was needed; no gateway tmpfs was declared
because its program writes no files. Non-root image execution still requires the
pending live installation. No delegated agents or commits were used.

#### Infrastructure recovery retry — published and applied, polling failed

The existing `lcn-neo4j` container was subsequently found stopped: exit code 137,
`OOMKilled=false`. It was started with `docker start lcn-neo4j`, without recreation
or volume changes. This establishes that it was stopped, not why it stopped.
After a 30-second startup allowance, the same seed and scoped proof were retried:

```sh
# brain-service
docker start lcn-neo4j
nohup sh -c 'sleep 30 && bun scripts/seed-dcc-workload.ts --exchange && bun run prove:dcc-workload -- --exchange --retire-previous-exchange' > /tmp/dcc-status-gateway-proof-retry.log 2>&1 &
```

This time package **1.0.1** and bundle **1.4.1** were newly published. The previous
1.0.0 deployment reached RETIRED through the operator revoke path. A new intent was
approved and applied, but polling failed with an HTTP 500 from
`installIntents.getInstallIntent` before workload READY was observed. No database
error body was returned, so this observation alone does not identify the new
failure's cause. The fresh deployment is not claimed READY; status verification,
registry and replay checks remain unexecuted for this version.

```text
2026-10-23T17:53:54.395Z RESET workload=RETIRING
2026-10-23T17:53:59.542Z RESET workload=RETIRED
2026-10-23T17:53:59.542Z RETIRED previous exchange 1.0.0 through operator revoke path
2026-10-23T17:54:00.071Z APPROVED intent=[REDACTED opaque value]
2026-10-23T17:54:01.045Z APPLIED intent=[REDACTED opaque value]
2026-10-23T17:54:01.225Z intent=[REDACTED opaque value] phase=APPLYING workload=APPLYING deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:54:06.469Z intent=[REDACTED opaque value] phase=APPLYING workload=APPLYING deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:54:11.668Z intent=[REDACTED opaque value] phase=APPLYING workload=APPLYING deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:54:16.811Z intent=[REDACTED opaque value] phase=APPLYING workload=APPLYING deployment=[REDACTED opaque value] failureCode=-
2026-10-23T17:54:21.825Z BLOCKED /trpc/installIntents.getInstallIntent HTTP 500:
error: script "prove:dcc-workload" exited with code 1
```

Next step is to diagnose/restore the operator API and resume the **existing** new
intent without resetting it. Publication and old-intent retirement must not be
repeated as new versions or manual deletions. The required test suites passed as
recorded above and were not rerun during this infrastructure-only retry.

#### Definitive driver diagnosis and safe stale-deployment retirement

The operator BFF's install intent and installTargets records confirm that the
failed reused target is **bundle 1.4.1 / org.dcc.issuer-exchange@1.0.1**, with eight
planned components (safe diagnostic intent tag `7d2d6fa2c9ec`). It is not the older
1.4.0 intent. Bundle 1.4.0 / package 1.0.0 (tag `584afa31a7fb`) is already REMOVED /
RETIRED. Intent phase can temporarily read READY while its workload reads FAILED;
the proof correctly gates on workload status, not just intent phase.

`--retire-previous-exchange` only revokes bundle 1.4.0 / package 1.0.0, as designed.
It does not reset a FAILED deployment belonging to the requested 1.4.1 version.
The existing `--reset` path would revoke and recreate the selected target, but
was deliberately not used after finding a deterministic manifest/image mismatch.

Agent logs include `HEALTH_STARTUP_FAILED`, with Brain reporting DRIVER_FAILED.
The failed proof log `/tmp/dcc-gw-proof3.log` contains repeated:

```text
Error: Cannot find module '/node'
```

Inspection of the exact pinned status-service image establishes the cause:

```text
Entrypoint=["/nodejs/bin/node"] Cmd=["app/server.js"] WorkingDir="/"
```

The workload `command` replaces image **CMD**, not ENTRYPOINT. Thus the requested
gateway `['node', '-e', DCC_STATUS_GATEWAY_SCRIPT]` runs effectively as
`/nodejs/bin/node node -e ...`, and Node attempts to load `/node`. The gateway
never starts listening. A six-container partial deployment is consistent with
startup halting at this component before the other components start; it does not
mean the wrong package was selected.

This **contradicts the requested gateway invocation design**. The current
`WorkloadCommandValidator` rejects an argv[0] beginning with `-`, so replacing CMD
with `['-e', script]` is also not expressible under the approved contract. There is
no package entrypoint override. No validator relaxation, agent special case,
NODE_OPTIONS workaround, or direct Docker workload override was introduced.
The fixed-program unit tests validate HTTP behavior, but did not test the image's
ENTRYPOINT composition; their earlier success is not image-runtime evidence.

Required next decision: approve a generic, reviewed command/entrypoint capability
or revise the gateway image/invocation design. Any corrected manifest must use a
**new immutable package/bundle version**, not overwrite published 1.0.1 / 1.4.1.
Resetting the current target alone would reproduce the same failure. The live
exchange proof remains BLOCKED and no PROOF READY is claimed.

Safe memory-pressure cleanup was completed independently of that blocker:

| Bundle | Intent tag     | Action/result                                                      |
| ------ | -------------- | ------------------------------------------------------------------ |
| 1.2.0  | `ec4e0aaf8c4e` | Revoked through BFF; workload RETIRED                              |
| 1.3.0  | `ff14b2ea8f69` | Revoked through BFF; workload RETIRED                              |
| 1.3.1  | `a6b654da35f6` | Revoked through BFF; workload RETIRED                              |
| 1.4.0  | `584afa31a7fb` | Already RETIRED; left unchanged                                    |
| 1.4.1  | `7d2d6fa2c9ec` | Selected target excluded; retained FAILED pending corrected design |

Three other historical 1.2.0 intents were already RETIRED and left unchanged.
No `docker rm`, volume deletion, or direct database writes were performed.
Retirement is observed; a quantitative memory reduction was not measured.

The proof script now supports `--inspect` (read-only BFF state reporting) and
`--retire-stale-dcc` (cleanup-only, limited to 1.2.0/1.3.0/1.3.1/1.4.0 of the DCC
Tools listing in the active ecosystem, excluding the selected version). Normal
proof runs also print the selected bundle/package version and component count on
a separate line that is not suppressed by endpoint-auth redaction.

Before the cleanup job, Docker inspection confirmed `lcn-neo4j`,
`lcn-brain-service`, `lcn-console-bff`, and `lcn-workload-agent` running. Filtered
BFF logs contained `console-bff ready`, and the authenticated BFF inspection call
answered successfully. Commands from Brain:

```sh
bun scripts/prove-dcc-workload.ts --exchange --inspect
nohup sh -c 'bun run typecheck && bun scripts/prove-dcc-workload.ts --exchange --retire-stale-dcc' > /tmp/dcc-stale-retirement.log 2>&1 &
```

Fresh verification: Brain typecheck passed both entrypoints; changed proof-script
language-server error diagnostics were clean; Prettier applied. The earlier full
suite results (types 61; agent 80 passed / 2 skipped; integrations 2 and 27) remain
the latest full-suite execution, not new reruns. Cleanup's live assertions reached
RETIRED for all three newly revoked intents.

Redacted final cleanup tail (no Mongo NETWORK noise):

```text
2026-10-23T18:08:56.169Z INSPECT intentTag=7d2d6fa2c9ec bundle=1.4.1 selected=true package=org.dcc.issuer-exchange@1.0.1 components=8 phase=READY workload=FAILED failure=DRIVER_FAILED
2026-10-23T18:08:56.424Z RESET workload=RETIRING
2026-10-23T18:09:01.457Z RESET workload=RETIRED
2026-10-23T18:09:01.457Z RETIRED stale DCC bundle=1.2.0 intentTag=ec4e0aaf8c4e
2026-10-23T18:09:01.581Z RESET workload=RETIRING
2026-10-23T18:09:06.635Z RESET workload=RETIRED
2026-10-23T18:09:06.635Z RETIRED stale DCC bundle=1.3.0 intentTag=ff14b2ea8f69
2026-10-23T18:09:06.816Z RESET workload=RETIRING
2026-10-23T18:09:11.844Z RESET workload=RETIRED
2026-10-23T18:09:11.844Z RETIRED stale DCC bundle=1.3.1 intentTag=a6b654da35f6
```

#### 1.0.2 / 1.4.2 — revised image invocation, no contract change

The user approved using the already-pinned transaction-service image for the
gateway instead of changing the command contract. Only the exchange builder
advances to **1.0.2**, with DCC Tools **1.4.2**; all earlier published versions
remain immutable. Gateway logic, resources, internal upstream and public-origin
mapping are unchanged. The image is already allowlisted:

```text
docker.io/digitalcredentials/transaction-service@sha256:937924f3b383426a41e95cfa63b53d14a5d03e861889a699ddcd99cc744bde75
```

**Exact-image preflight was performed before changing the fixture.** Safe image
inspection returned:

```text
Entrypoint=["docker-entrypoint.sh"] Cmd=["node","server.js"] WorkingDir="/app" User=""
```

A Bun one-liner imported `DCC_STATUS_GATEWAY_SCRIPT` and passed that exact constant
to `Bun.spawn` as a Docker argv element, without shell interpolation. The runtime
invocation matched the agent's command and hardening:

```text
docker run --rm -d --read-only --cap-drop ALL --security-opt no-new-privileges
  --user 1000:1000 -e STATUS_UPSTREAM=example:4008
  -p 127.0.0.1::4010 <pinned transaction image> node -e <exact script constant>
```

Docker allocated a free loopback port. Curl checks and the API/version probe gave:

```text
PREFLIGHT GET / => ok200
PREFLIGHT POST /credentials/status/allocate => 405
PREFLIGHT GET /credentials/x => 404
v18.20.8 function function function
PREFLIGHT temporary container stopped (auto-removed)
```

The three functions are `fetch`, `AbortSignal.timeout`, and `node:http.request`.
The gateway itself uses Node HTTP, timers and Buffer, rather than fetch. No tmpfs
or additional image was required. **Lesson:** executing the fixed program in a
unit test does not test Docker ENTRYPOINT/CMD composition. Preflight the exact
digest, argv and hardened image invocation before publishing an immutable package.

Fixture tests now assert the transaction-service pin and include a separate exact
`['node', '-e', DCC_STATUS_GATEWAY_SCRIPT]` assertion. `--retire-stale-dcc` also
includes bundle 1.4.1 while excluding the selected 1.4.2 version. That cleanup flag
returns after retirement; a separate invocation then performs the proof.

Fresh checks (`/tmp/dcc-gateway142-checks.log`):

```sh
# packages/learn-card-types
npx vitest run src/workload.spec.ts && bun run build
# brain-service
bun run typecheck
bun run test:integration -- test/dcc-tools-bundle.spec.ts
bun run test:integration -- test/workload-packages.spec.ts
```

Results: **62 types tests passed**, types build passed, Brain typecheck passed
both entrypoints, integrations **2 passed** and **27 passed** sequentially. All
four changed TypeScript files had clean error diagnostics. Prettier applied.
The existing Vite migration advisories remain; no test failure was suppressed.
Agent code and contract did not change; its previous 80-pass / 2-skip run was not
repeated for this image-only revision.

Before the long operator run, all four required containers reported running;
`console-bff ready` was observed. Authenticated BFF inspection answered and reported
the expected not-yet-published 1.4.2 selection. Then, from Brain:

```sh
nohup sh -c 'bun scripts/seed-dcc-workload.ts --exchange && bun run prove:dcc-workload -- --exchange --retire-stale-dcc && bun run prove:dcc-workload -- --exchange' > /tmp/dcc-gateway142-proof.log 2>&1 &
```

##### Live outcome — gateway fixed; upstream list size blocks verification

The new package **1.0.2** and bundle **1.4.2** were published successfully. Failed
bundle **1.4.1** (safe intent tag `7d2d6fa2c9ec`) reached RETIRED through the normal
BFF revoke path at 18:17:27Z. The proof selected bundle 1.4.2 / package 1.0.2 with
eight components, approved/applied the new intent, reached workload READY, and
passed its restart/recovery/idempotency checks. Mongo volumes were preserved.

All three exchange-side components, including the gateway, passed the live
`1000:1000` / read-only / cap-drop-ALL assertions. The simulated LearnCard wallet
signed a DIDAuth VP; the exchange returned a signed VC with matching holder and
smoke issuer. Its status-list URL matched the agent's published status-public
origin. Both status write routes were rejected with 405 and both credential-info
paths with 404. The image invocation problem and status-list reachability gap are
therefore resolved for this revision.

The **next, distinct upstream failure** is list conformance, not reachability:

```text
VERIFY Failed Status list bitstring is too small: 100000. Minimum entries: 131072
VERIFY Success proof: Valid
VERIFY Success expiration: Does Not Expire
```

The previously inspected upstream database status-manager source defines
`CREDENTIAL_STATUS_LIST_SIZE = 100000` and passes it to `createList`. The live
verifier independently reports exactly that decoded size. This is an error, not
an acceptable warning; no downgrade, status bypass, or signed-list rewriting was
introduced. The read-only gateway cannot enlarge a signed list without invalidating
its signature. Retrying the same pinned implementation would reproduce this
deterministic mismatch, so no redundant retries were made for it.

Registry lookup, replay rejection and the final consent/READY log lines are **not
reached** because verification fails first. The workload is operationally READY,
but the full acceptance proof is **not** PROOF READY. The next dependency is an
approved status-service/status-manager implementation producing conformant lists
of at least 131072 entries, with its image/invocation preflighted before another
immutable package/bundle version is published. Neither a new status image nor
verification-policy relaxation was authorized or implemented in this revision.

Redacted final proof evidence (`/tmp/dcc-gateway142-proof.log`, no Mongo NETWORK noise):

```text
2026-10-23T18:17:27.285Z RETIRED stale DCC bundle=1.4.1 intentTag=7d2d6fa2c9ec
2026-10-23T18:17:27.679Z SELECTED bundle=1.4.2 package=org.dcc.issuer-exchange@1.0.2 components=8
2026-10-23T18:17:27.760Z APPROVED intent=[REDACTED opaque value]
2026-10-23T18:17:28.122Z APPLIED intent=[REDACTED opaque value]
2026-10-23T18:21:14.618Z intent=[REDACTED opaque value] phase=READY workload=READY deployment=[REDACTED opaque value] failureCode=-
2026-10-23T18:21:14.689Z IDEMPOTENCY restart unchanged
2026-10-23T18:21:14.834Z RECOVERY init succeeded with new attempt=[REDACTED UUID]; Mongo volumes preserved
2026-10-23T18:21:15.169Z SMOKE issuer=did:key:[REDACTED opaque value] proofType=Ed25519Signature2020
2026-10-23T18:21:15.169Z STATUS credentialStatus present
2026-10-23T18:21:15.262Z HARDENING transaction-service user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:21:15.315Z HARDENING workflow-coordinator user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:21:15.370Z HARDENING status-gateway user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:21:15.420Z EXCHANGE setup passed (deleteWhenCollected=true)
2026-10-23T18:21:15.420Z EXCHANGE vc_request_url uses published origin
2026-10-23T18:21:15.426Z EXCHANGE DIDAuthentication request received
2026-10-23T18:21:15.871Z WALLET LearnCard DIDAuth VP signed (authentication)
2026-10-23T18:21:16.101Z EXCHANGE signed credential received; holder, issuer and credentialStatus matched
2026-10-23T18:21:16.102Z STATUS statusListCredential uses published status-public origin
2026-10-23T18:21:16.107Z GATEWAY POST /credentials/status/allocate rejected HTTP 405
2026-10-23T18:21:16.108Z GATEWAY POST /credentials/status rejected HTTP 405
2026-10-23T18:21:16.108Z GATEWAY GET /credentials/x rejected HTTP 404
2026-10-23T18:21:16.109Z GATEWAY GET /credentials rejected HTTP 404
2026-10-23T18:21:16.205Z VERIFY Failed Status list bitstring is too small: 100000. Minimum entries: 131072: Status list bitstring is too small: 100000. Minimum entries: 131072
2026-10-23T18:21:16.205Z VERIFY Success proof: Valid
2026-10-23T18:21:16.205Z VERIFY Success expiration: Does Not Expire
2026-10-23T18:21:16.205Z BLOCKED Credential verification must pass proof and status without errors or warnings
error: script "prove:dcc-workload" exited with code 1
```

No contract change, new pin, agent edit, consent gate, manual volume deletion,
delegation or commit was introduced. Remaining risks are unchanged except that
gateway invocation/read-only routing/reachability are now evidenced: list-size
conformance, unverified registry/replay assertions, deferred claim choice, loopback
phone reachability, inherited issuer default tenants, in-memory exchange durability
and concurrency, and production trust/TLS/custody/operations remain OPEN.

##### User-selected labelled completion — registry and replay now verified live

The user selected option 3: retain the verifier's non-conformance finding, label
it explicitly, and finish the rest of the local proof. Only the exchange proof
script changed. Verifier/library code, production policy, manifests and deployment
versions were not modified.

The script requires a successful `proof` check. Every non-success result must be
`Failed` and exactly match the anchored text
`Status list bitstring is too small: 100000. Minimum entries: 131072` in its check
and any supplied message/details. Any other error or warning still blocks. The
original verifier failure is logged before the explicit NON-CONFORMANT label;
it is not converted to verifier success. Final output is selected only after
registry and both replay assertions complete. This labelled branch never emits
PROOF READY.

Before the run, all four core containers were running, `console-bff ready` was
observed, and authenticated inspection confirmed existing bundle **1.4.2** /
package **1.0.2** intent tag `d7979867cac6` was workload READY. The proof reused that
intent; no reset, reseed, new publication, or retirement was needed.

```sh
# brain-service
nohup sh -c 'bun run typecheck && bun run prove:dcc-workload -- --exchange' > /tmp/dcc-exchange-labelled-proof.log 2>&1 &
```

Brain typecheck passed both entrypoints before the proof ran. Changed proof-script
LSP error diagnostics were clean. Prettier applied to the script and this document.
The live run completed on the first attempt for this change.

Observed findings:

- Cryptographic credential proof: **Success**. Holder and issuer matched; revocation
  coordinates are present and use the read-only published gateway.
- Status list: **NON-CONFORMANT, labelled, not accepted** (100000 < 131072). This is
  not a successful standards-conformant revocation verification.
- DCC sandbox registry: **issuer listed=false**, expected for this local dev did:key.
  Registry trust remains OPEN; registration is not fabricated.
- Single-use: the second claim and re-initiation both returned HTTP 500 from the
  coordinator. For each, the existing assertions verified the wrapped transaction
  response `serviceResponseStatus=404`, code 404, message `Unknown exchangeId.`.
  Thus this is confirmed record rejection, not an arbitrary 500 counted as success.
  The setup explicitly requested `deleteWhenCollected: true`.
- Consent: **not gated**; learner claim choice remains deferred.

Final redacted proof tail, without Mongo NETWORK noise:

```text
2026-10-23T18:58:30.661Z SMOKE issuer=did:key:[REDACTED opaque value] proofType=Ed25519Signature2020
2026-10-23T18:58:30.662Z STATUS credentialStatus present
2026-10-23T18:58:30.702Z HARDENING transaction-service user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:58:30.740Z HARDENING workflow-coordinator user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:58:30.781Z HARDENING status-gateway user=1000:1000 read_only=true cap_drop=ALL running
2026-10-23T18:58:30.826Z EXCHANGE setup passed (deleteWhenCollected=true)
2026-10-23T18:58:30.826Z EXCHANGE vc_request_url uses published origin
2026-10-23T18:58:30.831Z EXCHANGE DIDAuthentication request received
2026-10-23T18:58:31.134Z WALLET LearnCard DIDAuth VP signed (authentication)
2026-10-23T18:58:31.190Z EXCHANGE signed credential received; holder, issuer and credentialStatus matched
2026-10-23T18:58:31.190Z STATUS statusListCredential uses published status-public origin
2026-10-23T18:58:31.191Z GATEWAY POST /credentials/status/allocate rejected HTTP 405
2026-10-23T18:58:31.192Z GATEWAY POST /credentials/status rejected HTTP 405
2026-10-23T18:58:31.192Z GATEWAY GET /credentials/x rejected HTTP 404
2026-10-23T18:58:31.193Z GATEWAY GET /credentials rejected HTTP 404
2026-10-23T18:58:31.260Z VERIFY Failed Status list bitstring is too small: 100000. Minimum entries: 131072: Status list bitstring is too small: 100000. Minimum entries: 131072
2026-10-23T18:58:31.260Z VERIFY Success proof: Valid
2026-10-23T18:58:31.260Z VERIFY Success expiration: Does Not Expire
2026-10-23T18:58:31.260Z STATUS NON-CONFORMANT list size 100000 < 131072 (upstream credential-status-manager-db; labelled, not accepted)
2026-10-23T18:58:31.495Z REGISTRY issuer listed=false
2026-10-23T18:58:31.495Z REGISTRY issuer not listed (expected for local dev did:key; production trust gate OPEN)
2026-10-23T18:58:31.504Z SINGLE_USE second claim HTTP 500 (response withheld)
2026-10-23T18:58:31.510Z SINGLE_USE initiation after claim HTTP 500; exchange rejected
2026-10-23T18:58:31.510Z CONSENT not gated (wallet-claim-choice deferred)
2026-10-23T18:58:31.510Z PROOF COMPLETE WITH LABELS (local exchange; revocation present but non-conformant list size; NOT consent-gated; production gates remain OPEN)
```

Residual risks remain: non-conformant list size, absent registry membership,
deferred learner claim choice, loopback-only phone reachability, inherited issuer
default tenants, in-memory exchange durability, unproven concurrent-claim atomicity,
and production TLS/key custody/operational ownership. Sequential single-use rejection
is proven; it does not close those other gates. No commits or delegation occurred.
