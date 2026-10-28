# AI Passport Backend Service

## Running the Backend

1. Install dependencies:

    ```
    bun install
    ```

2. Start Qdrant vector database (required for embeddings storage):

    ```
    docker-compose up -d
    ```

3. Start the backend service:
    ```
    bun run dev
    ```

## HTTP upload resource limits

The HTTP API sets Bun's request-body limit to **6 MiB**, allowing the existing
4 MiB file limit plus base64 encoding and the JSON envelope. Bun 1.3.5 does not
reliably enforce this runtime cap on chunked bodies, so application byte counters
enforce the limits below independently. WebSocket messages use separate limits.

Before authentication or route-specific parsing, a shared reader bounds
non-upload bodies to **64 KiB** on `/insights/*` and `/oauth/*`, **256 KiB** on
`/auth/*`, and **6 MiB** on other routes. JSON, URL-encoded, and multipart parsers
receive only the bounded bytes. This separate pool admits at most **16 concurrent
body reads**; excess requests return **503** with `Retry-After: 5`. Each slot is
released before authentication and downstream processing, so model/database latency
does not hold up unrelated body reads. Short bodies are copied to an exact-sized
buffer instead of retaining the route's maximum-size scratch buffer. This pool
bounds body-reading memory, not the number or aggregate memory of downstream
operations. Bodyless traffic and file uploads use their existing paths.

`POST /credentials/parse-file` additionally counts actual received bytes before
decoding UTF-8 or parsing JSON, including requests without `Content-Length` or
with chunked transfer encoding. Oversized bodies return **413** and are cancelled;
stalled bodies return **408** after a **30-second body-read deadline**. Compressed
HTTP request bodies are unsupported and return **415**. This is independent of
compression inside a document, which is handled by the local extraction limits.

By default, each HTTP process admits at most **16 uploads**, with **two per
authenticated owner**, before reading a body. Admission is held through file
processing and response construction. Excess same-owner requests return **429**;
exhausted process capacity returns **503**. Both include `Retry-After: 5`, and
excess requests are rejected rather than queued. The limits and deadline are in
`src/http/uploadRequest.ts`.

Operators can set `MAX_CONCURRENT_FILE_UPLOADS` and
`MAX_CONCURRENT_FILE_UPLOADS_PER_OWNER` to integers from 1 through 32; per-owner
capacity must not exceed total capacity. Invalid configuration fails startup.
These are tunable starting values, not measured production throughput limits.
The frontend version in LearnCard #1769 processes multi-file extraction serially;
capacity still matters for simultaneous users and other clients. Raise capacity
only after checking full extraction memory, latency, errors, and provider limits.

The validated envelope retains `file`, `fileType`, and the optional processing
`diagnostics` fields (`enabled`, `operationId`, `attemptId`, and `attempt`). Unknown
top-level and diagnostic fields are stripped before processing. Guard rejections
return fixed `error`/`code` fields before extraction starts; accepted requests
retain the extraction API's correlated `processing` metadata and sanitized
response, excluding extracted text and raw model results.

Bun rejects known lengths above 6 MiB before the application runs, so those native
413 responses have no application CORS headers. Browsers may surface a network
error. Client-side file-size validation is still needed for friendly feedback;
server limits remain authoritative. Application-generated body-limit responses
include the normal CORS headers.

`Retry-After` is exposed through CORS so browser clients can respect the admission
delay. Foreground clients may wait and retry explicit upload admission rejections;
processing failures and uncertain transport failures must not be replayed as if
the server had rejected the upload before work started.

These are per-process memory controls, not a distributed account quota or IP rate
limiter. They do not bound model output size or all other application workloads.
The Fly reproduction and mitigation measurements are in
[the upload memory test report](../../docs/security/upload-memory-test.md).

## Qdrant Vector Database

Qdrant 1.17 or newer is required. Every API, MCP, and worker startup performs
a real conditional-upsert/vector-removal capability probe and refuses to start
if the server or transport cannot enforce deletion markers.

### Docker Integration

Qdrant runs as a Docker container and is configured in the `docker-compose.yml` file. The container exposes the following ports:

- 6333: REST API and dashboard
- 6334: gRPC API

The Qdrant dashboard is accessible at http://localhost:6333/dashboard when the container is running.

### Available Qdrant Functions

The `src/db/qdrant.ts` file provides the following functions:

- `getQdrantClient()`: Get a singleton instance of the Qdrant client
- `checkQdrantHealth()`: Check if Qdrant is running properly
- `createCollectionIfNotExists(collectionName, dimensions, distance)`: Create a new vector collection
- `storeEmbeddings(collectionName, points)`: Register point ownership durably in Mongo before a conditional upsert.
- `searchSimilar(collectionName, vector, limit, filter)`: Search within the authenticated owner and exclude erased points.

Owner writes require `withOwnerOperation` and the matching AI privacy context.
Payloads contain typed record pointers and provenance, never original text,
credential bodies, or hydrated model context. Export omits vectors. Deletion
replaces every registered ID, including an unsent write, with a vectorless
`{ erased: true }` marker. These markers and their minimal Mongo references are
permanent: deleting them could let a delayed insertion recreate erased data.

### Privacy and embedding migration

Use the owner-scoped ingestion/search paths rather than writing arbitrary
payloads directly. Do not store original credential or message text in Qdrant.
The privacy gateway filters embedding inputs; model/provider changes do not
retroactively protect legacy vectors or payloads.

LC-2206 separately migrates the current OpenAI 1536-dimensional embeddings to
Titan and rebuilds/version-switches indexes. Do not change dimensions or mix
embedding spaces before that migration is reviewed and verified. The offline
privacy migration below handles legacy data cleanup.

### Health Check

The backend exposes a health check endpoint for Qdrant at `/qdrant/health`. This endpoint returns the status of the Qdrant service:

```json
{
    "status": "ok",
    "message": "Qdrant is healthy"
}
```

## MongoDB

MongoDB stores threads, messages, credential records, summaries, plans, and cache
data. A replica set is required, including for local development. Startup proves
a transaction can commit with majority and journal durability. Every owner
write updates its owner guard in the same transaction; an erasure fence blocks
late commits. Set `MONGO_URI` and, optionally, `MONGO_DB` before startup.

The local Compose service initializes a single-node `rs0` replica set and waits
for a writable primary before starting the backend. Containers use
`mongodb://mongo:27017/?replicaSet=rs0`; host-side development uses
`mongodb://localhost:27018/?replicaSet=rs0&directConnection=true` because the
replica set advertises its Docker hostname. CI starts its own `rs0` member before
tests. These single-node setups exercise transactions, not production
high availability.

Use a dedicated, persistent Redis instance/database. Owner admission, renewal,
OAuth/session mutations, ingestion state, and generation locks fail closed if
Redis is unavailable. A lease uses Redis time and cannot renew after expiry.
Detached work acquires its own lease instead of outliving a released parent.

The service has three independent entrypoints:

- `bun run start` starts the HTTP and WebSocket API.
- `bun run start:mcp` starts the MCP server.
- `bun run start:workers` starts background workers.

## LC-1933 authentication rollout and message ownership migration

Deploy the compatible LearnCard client before this backend. The hardened backend no longer trusts caller-supplied DIDs, so deploying it while an old LearnCard client is still live is prohibited.

Message ownership migration is part of the offline privacy migration below.
It attributes missing message/vector ownership from unambiguous thread owners,
never overwrites conflicting ownership, and refuses to complete with orphaned
or ambiguous records. Historical owner-attributed messages remain exportable
and visible locally; missing consent revisions exclude them from model input.

Do not run the former online backfill or roll back to an unfenced writer after
this cutover. Old writers do not understand maintenance, encrypted retention,
private queue references, or permanent vector deletion markers.

## LC-2118 privacy gateway and rollout

Deploy the LearnCard live-consent producer first, then this backend, then the
selection-only formatter client. The formatter accepts credential URIs and
personal-field names, not caller-supplied credential bodies, personal values, or
identity. The authenticated owner and current dedicated-AI contract authorize
every selected source. Existing adult grants remain valid; no privacy-notice
acceptance is fabricated or required retroactively. Managed grants require
recorded approval from a currently authorized LearnCard manager for the current
contract revision.

Original signed credentials are verified before projection. Provider inputs use
typed learning facts, deterministic owner-scoped identifier tokens, then Amazon
Bedrock `ApplyGuardrail` sensitive-information filtering. AWS therefore processes
additional unmasked free-text PII; this is not an entirely local trust boundary.
Known identifiers are restored only for authorized learner outputs. Additional
PII receives generic `{NAME}` / `{EMAIL}`-style masks that are never restored or
guessed. MCP context remains protected. Consent, verification, configuration,
filtering, locale, audit, or persistence failures stop processing. Individually classified credential read/verification failures remain insight-input exclusions, not deletion or invalidation.

### Required runtime configuration

- Set `AI_PRIVACY_KEY` to an independently generated, canonical base64-encoded
  32-byte secret. Do not reuse `JWT_SECRET`. Startup validates this key and
  durable audit storage before serving requests. Keep the key stable while
  encrypted records are retained: replacing it without a controlled data/key
  migration makes existing mappings and retained originals unreadable.
- Provision `infrastructure/bedrock-privacy.yaml` in `us-east-1` through the
  reviewed infrastructure process; set `AWS_REGION`, `BEDROCK_GUARDRAIL_ID`
  and its immutable numeric `BEDROCK_GUARDRAIL_VERSION`. `DRAFT` is rejected.
  The runtime verifies the deployed PII policy before sending text. Use the
  standard AWS credential chain; never commit credentials or endpoint overrides.
- Docker images install only local PDFium, Pillow, XML extraction and Tesseract
  language packs. No GLiNER, PyTorch, model download, hosted OCR, or ML endpoint.
  Source execution uses `privacy/install.sh`, `AI_PRIVACY_PYTHON` and
  `AI_PRIVACY_ASSET_DIR`. Keep images and document bytes local.
- Local extraction bounds files to 10 MiB, documents to 50 pages, and output to
  200,000 UTF-16 code units. The upload route may enforce a smaller limit.
  Unsupported, malformed, oversized, or timed-out extraction fails locally
  rather than falling back to an external provider.

The deliberately selected filters protect names, postal addresses, contact,
authentication, financial and government identifiers. They do not enable blanket
`AGE` or `URL` masking, or mask all dates, schools or roles. AWS's built-in
`ADDRESS` detector may also mask city-only locations; do not assume geographic
references will be retained. Known personal fields, DIDs, credential/storage
identifiers and explicitly labelled birth dates retain deterministic handling.
Live consent seeds known personal values before free-text masking; mappings and
vault storage remain compatible with #82.

One gateway traversal batches unique text strings (including nested JSON tool
arguments/results and dynamic keys) for filtering. The serialized batch is
bounded to 100,000 UTF-16 code units; larger inputs fail, without truncation or
splitting an identifier across chunks. Extraction's separate 200,000-unit bound
does not promise that its whole result fits a single AI request.

AWS documents **17 sensitive-information languages**: Arabic, Chinese, Dutch,
English, Finnish, French, German, Hindi, Italian, Japanese, Korean, Norwegian,
Polish, Portuguese, Spanish, Swedish and Vietnamese. Russian is not supported.
Explicitly unsupported request locales remain rejected; absent locale defaults to
English. Content is no longer rejected or excluded based on individual Unicode
characters. The retired script regex was neither language identification nor an
AWS API input requirement, and incorrectly rejected mixed English mathematics.

This is a deliberate best-effort privacy policy: local deterministic redaction
and AWS sensitive-information filtering remain required, but unsupported natural
languages and mixed-language text can contain identifiers AWS misses. Accepted
text and full processed-character coverage do not guarantee correct PII detection;
missed identifiers can reach the configured generation provider. Known identifiers
are tokenized independently of language; their variants and unfamiliar free-text
PII can remain. Insight generation uses OpenAI models through Bedrock Responses,
and Bedrock remains the managed privacy processor. Embeddings default to legacy
OpenAI 1536; the versioned Nova 1024 migration and read/write controls are documented
in the [migration runbook](../../docs/nova-embeddings-backfill.md). No translation,
character stripping or extra paid call per credential is added.

Detection is probabilistic, not guaranteed anonymization. `bun run
test:privacy-runtime` exercises actual offline extraction/OCR, not AWS detection.
See [managed privacy data handling](../../docs/managed-privacy.md) for trust,
cost, language, staging validation and rollout requirements.

The SDK, DIDKit WASM, and shared credential types come from the LearnCard
workspace (`@learncard/init`, `@learncard/didkit-plugin`, and `@learncard/types`
are all `workspace:*`). Before the monorepo move they were pinned to npm
`@learncard/init` 2.4.16 and `@learncard/didkit-plugin` 1.10.0. DIDKit 1.7.5 could not parse current Data Integrity
proofs; the previously pinned 1.9.12 WASM also failed the fresh JWE ephemeral-key
regression. The shipped 1.10.0 artifact passes real signing, verification,
recipient isolation, and per-recipient/per-ciphertext ephemeral-key checks in
`src/credentials/verification.test.ts`. Updating the library does not repair
previously published ciphertexts. Generated Boost credentials include the
published Boost context so strict signing does not discard undefined JSON-LD terms.
Persisted verifier provenance records the SDK and DIDKit versions from the
workspace package manifests.

AI insight input selection and background ingestion exclude whole credentials
that cannot be fully verified or bound to the current subject. This includes
unsupported suites, malformed/unreadable input, SDK exceptions, returned errors,
and missing proof confirmation. Exclusion does not delete or replace the signed
credential, retained records, thread links, verification provenance, or vectors.
Only fresh verified inputs supply insight projections and cache fingerprints;
historical excluded context is never a fallback. Responses expose aggregate
`meta.inputCoverage` reasons/counts, and zero eligible inputs return
`no_eligible_insight_inputs` before any model or generated-cache access.

Consent/authenticated-owner failures, SDK initialization, thrown retrieval errors,
projection/storage/indexing failures still stop the request or background job;
there is no blanket catch over processing. An SDK read that hides its failure and
returns no result is excluded as `unreadable_input`, because the SDK does not
expose whether it was malformed data or an underlying dependency failure.
Generated-output verification and ordinary wallet/chat retrieval remain strict;
only those existing strict paths retain their confirmed-invalid cleanup behavior.
Unrecognized verifier text is never recorded or labeled invalid.

Summary generation failures propagate to the caller instead of becoming
fabricated learning summaries. Consent denial, erasure, cancellation, and other
generation failures must not produce a successful summary publication.

### Persistence and stale context

`credentials` retains typed projections and verification provenance, not raw
VC bodies. Originals are stored separately in `raw_credentials` using
owner/URI/fingerprint/expiry-authenticated AES-GCM encryption under a distinct
derived key. Raw reads require the authenticated owner; originals expire 30 days
after an explicit retention write. Reads do not extend retention.

Identifier mappings use a separate derived encryption key and pseudonymous
owner/value references. Tokens are stable only within their owner and live
30-day retention period; reads do not refresh expiry. Expired or deleted tokens
are not resurrected. Mongo TTL indexes perform cleanup, but reads enforce expiry
without waiting for the TTL monitor.

Formatter caches are owner-and-consent-revision scoped and expire after 24
hours. Topic caches also include the source fingerprint and locale. A changed
grant cannot reuse an earlier grant's prompt, topics, model-facing messages, or
plans. Historical conversation messages remain visible to their owner, but are
not replayed to models under a different grant. Stored search context is
resolved from currently shared, freshly verified originals before use.

Audit records persist a durable pending intent before provider work and
atomically transition that same event to one terminal outcome. Records contain
fixed data-category labels and sanitized metadata, not prompts, model outputs,
identifiers, or mappings. Startup and five-minute nonoverlapping sweeps mark
pending attempts older than 24 hours indeterminate; they never replay a model
request. There is no audit TTL.

Raw console output and MCP telemetry payloads are suppressed by default.
`AI_LOCAL_DEBUG_LOGGING=true` permits raw local debugging only in
development/test with exclusively loopback deployment origins. It cannot
enable raw production logging.
Uncaught exceptions and unhandled rejections emit a sanitized fatal event and
terminate the process rather than continuing in an unknown state.

### LC-2128 owner export and deletion

`GET /privacy/export` requires the authenticated owner and an active owner
operation. It exports decrypted retained originals and mappings, owner data,
audit metadata, private queued payloads, cache state, vector metadata, and the
external-effect ledger with `Cache-Control: no-store`. Storage failures are
errors, not empty or in-memory fallback exports.

`DELETE /privacy/data` remains authenticated but does not acquire an ordinary
owner lease. It atomically persists a Redis tombstone and an encrypted owner
request, awaits the Mongo write fence, then drains jobs and existing operations.
API, MCP, and worker startup and nonoverlapping 30-second sweeps resume pending
requests without another client DELETE. Redis persistence is required for the
fence and pending-request outbox. Existing authentication remains available
until cleanup completes; its normal expiry still applies.

HTTP 202 means cleanup is incomplete, without `completedAt`. The response's
`retryable` field distinguishes transient cleanup failures from remote outcomes
that need operator reconciliation. Cleanup fences vectors before removing Mongo
payloads, deletes supported owner-authorized remote artifacts, then revokes
authentication and records completion. A synchronous completion returns HTTP
200 and expires the cookie; background completion revokes the server session
without needing a browser response. Authentication cleanup uses an expiring
per-owner index, not a global authentication-key scan.

**Deletion is permanent removal from this Passport instance, not a reset.**
The minimal tombstones remain after completion to prevent late writes from
resurrecting data. New sign-in for the same DID returns HTTP 410
`data_erasure_requested`. Do not manually clear fences to re-enable the account:
a safe reset requires a separate generation/epoch design.

Every external creation, including both topic-start paths, is reserved before
the remote call. Conversation-derived credentials are signed and encrypted as
JWE for the learner and service. Boost templates contain generic metadata only,
with viewing and child-creation defaults explicitly denied; learner/topic/body
fields are never placed in the public creation window. Resume reads the private
credential through the owner's artifact ledger, not the generic boost template.

Cleanup uses LearnCard's `deleteCredential` and `deleteBoost`, deleting credential
records and child boosts before parents. Legacy references require positive
service-issuer and learner-subject ownership evidence. Acknowledged deletions
are durable and are not repeated. Missing records, lost creation/deletion
responses, ownership ambiguity, shared artifacts, and incomplete historical
inventory are not proof of successful erasure: they remain explicit blocked,
retryable, or unknown outcomes in the minimal recovery ledger. A legacy URI's
successful deletion does not establish that every historical artifact was
inventoried. Previously unrecorded pathway URIs and learner-held copies cannot
be reconstructed or revoked by this backend. These cases need operator
reconciliation rather than repeated client polling or a false success response.

### Offline privacy migration

Before deploying this cutover, inspect the target stores without changing data
or indexes:

```sh
bun run migrate:privacy
```

Stop **all** old and new API/MCP/worker processes and prior migration processes,
and drain their dispatched database, queue, and external writes. The flag below
is an operator assertion of that prerequisite, not an automatic shutdown.
Old binaries cannot honor the new Redis maintenance marker.

```sh
bun run migrate:privacy --apply --writers-stopped
```

Apply holds a persistent, non-expiring maintenance marker, refuses active owner
leases/jobs, checks storage capabilities, and backfills ownership. It groups all
raw/credential candidates by owner and URI before mutation, encrypts recoverable
originals without extending retention, and reconciles duplicates before creating
unique indexes. A corrupt sibling cannot erase a valid original. Conflicting
originals or ambiguous retention require offline remediation; encryption/storage
failure preserves originals for retry.

Historical plans, summaries, messages, and completed-thread state remain visible
to the owner, but unsafe legacy caches are not replayed into models. Persisted
credential/boost references are backfilled into the recovery ledger with unknown
historical coverage. Apply also minimizes vector payloads, removes legacy BullMQ
payloads/events and raw-DID cache keys, and rebuilds the owner authentication
index. Only this offline bootstrap scans legacy authentication keys; invalid
owned records stop apply and retain maintenance for operator remediation.
Migration does not invent proof verification or guardian consent; removed legacy
model records require normal verified resynchronization.

Reports contain counts and fixed categories, not private bodies. On failure,
the command exits nonzero and retains maintenance. After the failed process has
exited and the reported issue is resolved offline, resume with its emitted
token:

```sh
bun run migrate:privacy --apply --writers-stopped --resume-maintenance=<token>
```

Never run concurrent resumptions or delete the marker to bypass a failed
migration. Only successful completion releases the matching marker. Keep
`AI_PRIVACY_KEY` stable: changing it also changes erasure/ownership references,
so rotation requires a controlled rekey of retained ciphertext and fences.

The full LC-2118 stack, including this lifecycle cutover and production
migration, blocks public monorepo import. LC-2119 provider approval/DPA/ZDR
remains a separate external prerequisite; runtime controls do not establish
provider compliance approval.

### Stacked pull-request CI

CI runs for pull requests targeting `lc-2118-privacy-gateway-consolidated`
and the normal base branches. PR regressions use real Redis, MongoDB replica-set
transactions, and Qdrant without provider or signing secrets, AWS credentials,
or OIDC token permission. The live browser job is a separate trusted branch
dispatch (or `main` push). It uses GitHub OIDC to assume a dedicated
CI role, not Fly's runtime role or repository AWS access-key secrets. The
user-reported privacy-only grants are not live-verified here and do not authorize
generation; the role separately needs
`bedrock:CallWithBearerToken` constrained to `SHORT_TERM` and scoped
`bedrock:InvokeModel` / `bedrock:InvokeModelWithResponseStream` permissions on
both US inference profiles and their six routed foundation models, plus
`bedrock:GetInferenceProfile` on the two exact profile ARNs. No IAM policy is
changed and no AWS inspection or live API call was performed here. CI checks
the AWS account and runs fixed synthetic
Guardrail fixtures before browser E2E; those fixtures do not exercise production
consent, and `DRAFT` cannot replace the reviewed immutable numeric version.

Generation now uses the OpenAI SDK Responses API at the approved US Runtime endpoint, exact `us.openai.gpt-6.1-sol`/`us.openai.gpt-6-luna` profiles, and short-term bearer tokens. Runtime Responses requires scoped model inference/streaming grants **and** `bedrock:InvokeModel` on the account's default project. No IAM policy is changed by this PR.

Sol chat/planning keep medium defaults and accept low/medium/high/xhigh/max; Luna formatting/title retain none. Responses sends `reasoning: { effort }` without downshifting. Unknown models and unsupported efforts reject before requests. Generation resolves tokens per request, prefers configured Fly web identity, redacts credential-provider failures, sets `store: false`, disables SDK retries and suppresses ambient OpenAI org/project headers. Embeddings default to legacy OpenAI 1536; Nova 1024 is separately versioned and opt-in through the [migration read/write controls](../../docs/nova-embeddings-backfill.md#generation-and-rollback).

Taylor approved non-strict function schemas and unchanged original Zod validation. Intended functions and complete responses are required; original optional fields stay optional, null is not normalized to undefined, and malformed/refused/incomplete output rejects. Plain chat is independent of schema capabilities. Provider schema projection is not a guarantee that omitted bounds/refinements are enforced upstream.

Run `bun --no-env-file run scripts/smoke-bedrock-generation.ts` for the original local nineteen-shape inventory. It predates full-evidence insight
compaction; the offline insight integration regressions cover the added cohort and
final synthesis shapes separately. For the local operator's bounded synthetic live test after usual MFA authentication, see [Bedrock smoke instructions](scripts/bedrock-smoke.README.md). The script requires an explicit existing profile, confirms safe account metadata, limits six attempts/no retries, reserves less than $0.25 inference, and saves a sanitized summary. It defaults to offline mock mode. No live validation, deployment or IAM changes have been performed by local checks; review the independent local synthetic results separately from the remaining deployed-role/application and privacy/retention/logging/authorization gates.

See [the LC-2205 data-handling and staging gates](../../docs/managed-privacy.md#lc-2205-sdk-responses-generation--live-release-pending).

Set repository variables `BEDROCK_GUARDRAIL_ID`, the immutable numeric
`BEDROCK_GUARDRAIL_VERSION`, and `AWS_PRIVACY_CI_ROLE_ARN`; retain the existing
`OPENAI_API_KEY` secret for embeddings. Restrict the CI role's
GitHub OIDC trust to the allowlisted branch refs. Protect those branches and
restrict who can push; the live job refuses unprotected refs before checkout.
Run `gh workflow run ci.yml --ref lc-2128-lifecycle-follow-up`
after each reviewed update and require **Run Live AI E2E** to pass before
merging. A green pull-request unit job is not a live provider check. Missing
role/policy, consent, or configuration is a merge gate, not a reason to bypass
privacy or change generation providers.

### Persistence and source authorization

Owner persistence transactions are queued per owner within each backend process.
SDK reads and verification remain concurrent, and different owners have independent
queues. Mongo owner/deletion guards and transaction retries remain the cross-instance
protection; this process-local queue does not replace them or guarantee zero
contention between machines. Queued insight credential writes recheck owner, revision and URI membership
against the shared operation snapshot when admitted. Cancellation or rejection cannot poison subsequent queue members, and
nested writes reuse their existing transaction; recursive admission through another
DB instance rejects rather than deadlocking.

Insight failure diagnostics distinguish SDK initialization, retrieval, projection,
verification persistence, and raw persistence. They emit only fixed operation/error
classes and allowlisted Mongo numeric codes/retry labels alongside the existing
correlation identifier. Exception messages, stacks, credential content, owner/credential
identifiers, and URLs are never forwarded. Locally reproduced transaction contention
motivates the queue; it is not yet attribution of the production failure.

### Issuance and bounded observability

AI insight issuance includes the published Boost JSON-LD context because its
credential types include `BoostCredential`. The real pinned SDK regression signs
and verifies the actual synthetic insight structure, rejects changed claims, and
reproduces strict data-loss detection when that context is absent. Fixing this
issuance defect does not establish whether a long production request completes
before its connection closes; the endpoint currently has no whole-operation deadline.

Insight lifecycle telemetry emits a server-generated request correlation before
work begins. Platform log metadata identifies the serving instance; application
logs do not include owner or machine identifiers. Stage completion events report
elapsed and operation duration, with at most one completion per fixed stage.
Repeated successful completions and nested per-credential resolution/verification
progress are suppressed; failures retain their existing bounded classification.

Resolution telemetry emits at most five snapshots at 30-second intervals plus
one resolution-boundary snapshot. It reports only fixed operation names and
bounded completed counts, active counts, and cumulative milliseconds for consent,
verification, retrieval, persistence admission wait, admitted consent preflight,
and transaction work. Cumulative durations can overlap under concurrency and
must not be added to infer wall-clock latency. Overall elapsed time is separate.
No credential content, identifiers, raw exceptions, URLs or signal reasons are
included. A request-signal abort or classified timeout is recorded only when
observed; listener/timer cleanup does not cancel work or change any timeout,
consent, transaction, eligibility or API behavior. Request progress has a fixed
budget independent of credential batch size.

Insight source batches now load the current shared contract once to discover
allowed references and perform one final live receipt/revision/membership check
covering every reference, including exclusions and empty sets. Per-credential
resolution and queued persistence use local guards bound to that operation's
owner and snapshot; they do not reread the remote grant. Authorization is never
cached across requests. Background ingestion resolves the batch and validates
its final receipt before derived storage/indexing. Request-wide resolution failures
wait for sibling resolutions to settle and prevent derived work for the batch.
Existing fresh authorization at irreversible model boundaries and owner/deletion
transaction fences remain in place; strict wallet/chat paths keep their existing
per-credential policy. Source-batch remote grant reads are constant with input
count (two for an unpaginated grant), rather than hundreds for one shared contract.

Parallel AI input privacy filters settle before their enclosing audit and owner
operation finish, including when one filter rejects. Filtering remains concurrent;
the first rejection is preserved and model execution is prevented on any failure.
Offline regressions reproduce an early filter failure followed by a sibling audit
attempt after the owner scope closed, and cover structured and both streaming
paths. This fixes that lifecycle defect; it does not establish the cause of the
primary production privacy-filter failure. Audit persistence still fails closed.

Insight failures now include bounded `privacyOperation`, `privacyCategory` and,
when present and allowlisted, `privacyStatus`. Operations distinguish preparation,
local filtering/mapping persistence and authentication, payload serialization/limit,
service invocation, JSON parsing/shape/application, guardrail configuration/language,
policy and logging requests/validation, consent before/after the request, guardrail
request/response and audit. Fixed categories preserve guardrail validation reasons,
timeouts, service throttling/access errors, consent and audit failures through the
existing generic privacy-error wrappers. Metadata never reads messages, stacks,
causes, content, identifiers or accessors. HTTP status is allowlisted; arbitrary SDK
names/reasons are not emitted. The existing eight-failure request budget remains.
Errors and public API behavior are unchanged, including fail-closed audit behavior
and draining parallel filters before owner scope release. These categories identify failing operations without attributing a production cause.

### Full-evidence insight compaction

Insight generation now represents every currently eligible verified, subject-bound
credential. It canonicalizes allowlisted projection ordering, groups exact matching
projections, and retains credential multiplicity separately from evidence strength.
Repeated claims do not become independent corroboration. Cohorts are deterministic
size/count batches, not a new semantic classifier or a recency ranking. The final
synthesis never updates an earlier insight with only new inputs.

Small batches go directly to synthesis. Larger batches use bounded cohort summaries,
with further summary levels when necessary. An oversized projection is partitioned
at whole category/type/fact boundaries; its original signed credential and stored
records are unchanged. Every fragment contributes to a summary; source-group unions
and representative credential aliases are tracked outside model-generated text.
Aggregate statements are not attributed to every member, and ambiguous pathway
matches should remain empty. Summaries are lossy: complete source participation
cannot guarantee that every fact survives verbatim or that model reasoning is correct.

Raw JSON size is a conservative prefilter, followed by dry-run measurement using the
actual local privacy transform, including JSON wrappers, escaping and identifier-token
expansion. Dry runs do not retain mappings or call managed privacy/model services.
Each cohort input is limited to 60,000 serialized characters and the final evidence
input to 80,000. Cohort outputs are strict summaries of at most 2,000 characters and
16,000 serialized characters; final output fields and serialized output are bounded.
Every summary and final synthesis still passes through the existing audited AI client,
local plus managed privacy filters, live consent checks and owner cancellation signal.
No new embedding call is introduced. Cached summaries are bounded before reuse.

The workload limit is 1,000 distinct projection groups, 128 total summary nodes,
20 items per cohort, six levels, and three concurrent summary calls. Each summary
provider call has a 60-second deadline. A single indivisible unit that cannot fit,
insufficient reduction, or exceeding a workload bound produces a fixed compaction
failure; no eligible source is silently omitted and no partial insight is returned.
Active sibling calls drain after failure before the enclosing operation exits.
Request-wide consent, owner, cache, provider and storage errors do not fall back to
historical evidence. Existing whole-input verification exclusions remain unchanged.

Summary cache keys bind the owner, live grant revision, model, locale, privacy fields,
compaction version, exact cohort evidence and multiplicity through an HMAC. Existing
owner-fenced summary storage retains its 24-hour expiry and erasure behavior.
Grant and owner checks surround model calls and cache reads/writes. Generated insights
use a new full-evidence generation version, model/locale and complete verified-source
fingerprint; older omission-based insights are deliberately not reused. Warm generated
cache reads still re-resolve/re-verify current sources and check the current grant.

`meta.inputCoverage.compactionCoverage` exposes source/representative/duplicate counts,
fragmented-projection count, cohort count, levels, summary cache hits/misses, summary
model calls and generated-cache hit. `promptCoverage` remains compatible and reports
all eligible sources included with zero omissions on success. `credentialsAnalyzed`
counts all represented credential records, including exact duplicates. Coverage is
HTTP/cache metadata outside the signed credential; the current frontend ignores it.
Safe diagnostics add the `evidence_compaction` stage and fixed failure reasons only.

#### Offline call and cost benchmark

Run `bun run scripts/benchmark-insight-compaction.ts` from this backend directory.
The benchmark imports only the pure compactor, uses synthetic projections and canned
summaries, and makes no network/model/DB calls. An example local run produced:

| Synthetic case                     | Cold summary calls | Levels | Cold total including final synthesis | Warm summary-cache total | Warm generated-cache total |
| ---------------------------------- | -----------------: | -----: | -----------------------------------: | -----------------------: | -------------------------: |
| 15 exact duplicates                |                  0 |      0 |                                    1 |                        1 |                          0 |
| 196 distinct, 12 facts each        |                 13 |      1 |                                   14 |                        1 |                          0 |
| 500 distinct, 12 facts each        |                 32 |      1 |                                   33 |                        1 |                          0 |
| 196 larger, escaped-summary stress |                 46 |      2 |                                   47 |                        1 |                          0 |

The script prints measured planning time and explicitly illustrative model cost
estimates using characters/4, $3/million input tokens, $15/million output tokens,
6,500 final system-prompt characters and 8,000 final output characters. These are
assumptions, not current provider prices or billed usage. Example cold estimates
were about $0.038, $0.546, $1.338 and $2.483 respectively; warm summary-cache estimates
still include one final synthesis. Managed guardrail, audit/storage, actual tokenization
and provider reasoning charges are excluded. Synthetic local planning took roughly
1–100 ms; it is not network latency. Cold generation needs extra filtered model calls
and sequential reduction levels, so it may be materially slower/more costly than one
large call. Live latency, output quality and charges have not been measured.

### Structured generation bounds and failure metadata

The Bedrock Responses adapter sends non-strict projected function schemas and requires
one intended tool. Bounded strings receive only fixed descriptive hints with scalar
limits; arbitrary schema descriptions are excluded. Provider projection omits unsupported
constraints and does not guarantee upstream enforcement. The original Zod validators
remain authoritative, including nullable/optional semantics and all string/array bounds.
Only approved Sol/Luna models are supported; there is no fine-tuned/provider fallback.
Real-SDK offline tests cover the cohort summary and final named insight stream.

The summary's existing 2,000-character local Zod limit remains authoritative.
Provider regex/Unicode semantics can differ from JavaScript UTF-16 string length;
local validation still rejects an over-limit response. Oversized/malformed results
are never truncated, accepted into caches or retried automatically. All source
participation, consent, privacy and owner safeguards above remain unchanged.

Structured Bedrock Responses failures now carry WeakMap-held fixed metadata through the existing
error normalizer: `providerOperation` distinguishes request, tool selection, argument
JSON parsing and response validation; `providerFailureReason` distinguishes request
failure, missing/invalid tool, malformed arguments, bounds, shape and other validation
failures. `providerStatus` contains only an allowlisted SDK HTTP status. These are
bounded diagnostic fields on generation failures, not public response changes.
No provider response, argument text, schema paths, learner content, messages, stacks,
causes, URLs, identifiers or credentials are retained in diagnostic metadata.
Original SDK/validator exceptions and normalized public error behavior are preserved.

### Unicode evidence and summary handling

Source projections and intermediate summaries retain their Unicode text. Character-level script rejection, compatible-script summary instructions and source-script exclusion workarounds have been removed by explicit product decision. Strict summary shape/length and serialized privacy/compaction budgets remain enforced. Every actual summary/final inference still traverses the local and managed privacy boundary; unknown/service/auth/consent failures stop processing. Existing individual credential read/verification exclusions and no-historical-context behavior remain unchanged.

Summary cache version `v3-unicode-privacy-filtered` and generated cache version `6-unicode-best-effort-privacy` retire prior character-restriction/omission results. Cache reuse still requires exact owner, grant, model, locale, privacy fields, source evidence, multiplicity and version; generated reuse re-resolves/verifies the current sources. There is no script-specific `sourceCoverage` or `unsupported_script` reason. Existing verification, prompt and compaction coverage describe all currently eligible sources. The frontend remains unchanged.

Safe input-origin diagnostics retain request-instruction versus source-cohort versus reused-summary distinctions. Language rejection now identifies the separate unsupported-locale policy only; no rejected terms or characters are logged. Synthetic Unicode cases exercise the managed-boundary stub and real client wiring, not AWS detection quality in unsupported languages.
