---
'@learncard/types': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
---

Add Universal Inbox batch issuance through `sendCredentialsViaInbox`, tRPC
`inbox.issueBatch`, and `POST /inbox/issue-batch`, with public batch input and result
validators/types, shared configuration defaults, ordered per-item outcomes, and
24-hour issuer-scoped idempotency keys. Later duplicate keys in one batch conflict
deterministically. Completed issuances include reconciliation IDs if replay storage
cannot be confirmed; side-effect-free preflight failures release their keys.

Enforce a 4 MiB JSON payload budget and atomic batch quota admission without
charging rejected batches. Batch submission returns HTTP 202 with a durable
receipt. Poll `GET /inbox/batches/{batchId}` or
`getInboxCredentialBatch` for ordered progress and outcomes. Batch-level request IDs
make submission retries safe. Jobs, quota admission, dispatch records, and encrypted
results are stored in Neo4j; a dedicated SQS queue processes items independently of
notifications. Submission retries report the current batch state. Transient preparation
and signing failures retry before delivery. Terminal batches release their original
payload and remain available for 30 days, including uncertain outcomes; unresolved
replay reservations stay blocked for reconciliation after job expiry.
Container-backed tests exercise Neo4j, Redis, and an SQS emulator, including worker
recovery, duplicate delivery, polling authorization, and submission replay.

The existing single-issue route now accepts `configuration.guardianEmail`, exposing
guardian approval to single-issue clients. Both routes reject guardian self-approval
case-insensitively. Rate-limit errors use `TOO_MANY_REQUESTS` (HTTP 429); remove stale
TypeScript casts to `BAD_REQUEST` from existing callers. Those casts did not change
the runtime status code.
