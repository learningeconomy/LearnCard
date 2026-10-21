# DCC phase 5 result — BLOCKED, not READY

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
